// @vitest-environment node

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"

import {
  WorldBankError,
  getCountries,
  getCountry,
  getIndicatorMeta,
  getIndicatorSeries,
  getLatestForAll,
  getLatestValue,
  listCountryPage,
} from "../client"
import type { WbCountryRaw, WbIndicatorRaw, WbObservationRaw } from "../types"

const WB = "https://api.worldbank.org/v2"

const ref = (id: string, value = id) => ({ id, iso2code: "", value })
function country(id: string, name: string, region = "EAS"): WbCountryRaw {
  return {
    id,
    iso2Code: id.slice(0, 2),
    name,
    region: ref(region),
    adminregion: ref(""),
    incomeLevel: ref("HIC"),
    lendingType: ref("LNX"),
    capitalCity: "",
    longitude: "",
    latitude: "",
  }
}
function obs(iso3: string, value: number | null, date = "2023"): WbObservationRaw {
  return {
    indicator: { id: "SP.POP.TOTL", value: "Population" },
    country: { id: iso3.slice(0, 2), value: iso3 },
    countryiso3code: iso3,
    date,
    value,
    obs_status: "",
    decimal: 0,
  }
}
const meta = (pages = 1, total = 1, page = 1) => ({ page, pages, per_page: 20, total })

const COUNTRIES = [country("USA", "United States", "NAC"), country("WLD", "World", "NA"), country("IDN", "Indonesia")]

describe("World Bank client", () => {
  it("drops aggregates and sorts countries by name", async () => {
    mockFetch("GET", `${WB}/country`, [meta(), COUNTRIES])
    const countries = await getCountries()
    expect(countries.map((c) => c.code)).toEqual(["IDN", "USA"])
    expect(new URL(fetchRequests("GET")[0].url).searchParams.get("format")).toBe("json")
  })

  it("turns the API's HTTP-200 error body into a WorldBankError", async () => {
    mockFetch("GET", `${WB}/country/XXX/indicator/SP.POP.TOTL`, [
      { message: [{ id: "120", key: "Invalid value", value: "The provided parameter value is not valid" }] },
    ])
    const error = await getLatestValue("XXX", "SP.POP.TOTL").catch((e) => e)
    expect(error).toBeInstanceOf(WorldBankError)
    expect(error.isInvalidValue).toBe(true)
  })

  it("reports HTTP failures with their status", async () => {
    mockFetch("GET", `${WB}/country`, reply(502, {}))
    await expect(getCountries()).rejects.toMatchObject({ code: "http", status: 502 })
  })

  it("rejects unexpected response shapes", async () => {
    mockFetch("GET", `${WB}/country`, { not: "an array" })
    await expect(getCountries()).rejects.toMatchObject({ code: "shape" })
  })

  it("refuses to silently drop rows from a multi-page response", async () => {
    mockFetch("GET", `${WB}/country`, [meta(3), COUNTRIES])
    await expect(getCountries()).rejects.toMatchObject({ code: "paging" })
  })

  it("returns null when the latest value is missing", async () => {
    mockFetch("GET", `${WB}/country/IDN/indicator/SP.POP.TOTL`, [meta(), [obs("IDN", null)]])
    expect(await getLatestValue("IDN", "SP.POP.TOTL")).toBeNull()
  })

  it("keeps only real economies with values in getLatestForAll", async () => {
    mockFetch("GET", `${WB}/country`, [meta(), COUNTRIES])
    mockFetch("GET", `${WB}/country/all/indicator/SP.POP.TOTL`, [
      meta(),
      [obs("IDN", 280), obs("WLD", 8000), obs("USA", null)],
    ])
    expect(await getLatestForAll("SP.POP.TOTL")).toEqual({ IDN: { value: 280, year: 2023 } })
  })

  it("returns the latest value and year", async () => {
    mockFetch("GET", `${WB}/country/IDN/indicator/SP.POP.TOTL`, [meta(), [obs("IDN", 280)]])
    expect(await getLatestValue("IDN", "SP.POP.TOTL")).toEqual({ value: 280, year: 2023 })
  })

  it("returns null when there is no latest observation at all", async () => {
    mockFetch("GET", `${WB}/country/IDN/indicator/SP.POP.TOTL`, [meta(), null])
    expect(await getLatestValue("IDN", "SP.POP.TOTL")).toBeNull()
  })

  it("falls back to generic codes for an error body without message details", async () => {
    mockFetch("GET", `${WB}/country`, [{ message: [] }])
    await expect(getCountries()).rejects.toMatchObject({ code: "unknown", message: "World Bank API error" })
  })

  it("looks up a single country case-insensitively", async () => {
    mockFetch("GET", `${WB}/country`, [meta(), COUNTRIES])
    expect((await getCountry("idn"))?.name).toBe("Indonesia")
    expect(await getCountry("XXX")).toBeNull()
  })

  describe("getIndicatorSeries", () => {
    it("returns nothing for no countries without fetching", async () => {
      expect(await getIndicatorSeries([], "SP.POP.TOTL")).toEqual([])
      expect(fetchRequests()).toHaveLength(0)
    })

    it("drops rows without an ISO3 code and sorts by year", async () => {
      mockFetch("GET", `${WB}/country/IDN;USA/indicator/SP.POP.TOTL`, [
        meta(),
        [obs("IDN", 3, "2022"), { ...obs("", 9, "2000") }, obs("USA", 1, "2020")],
      ])
      const series = await getIndicatorSeries(["IDN", "USA"], "SP.POP.TOTL", 2000, 2022)
      expect(series.map((o) => [o.country, o.year])).toEqual([
        ["USA", 2020],
        ["IDN", 2022],
      ])
      const params = new URL(fetchRequests("GET")[0].url).searchParams
      expect(params.get("date")).toBe("2000:2022")
    })

    it("defaults the range to 1960 through the current year", async () => {
      mockFetch("GET", `${WB}/country/IDN/indicator/SP.POP.TOTL`, [meta(), []])
      await getIndicatorSeries(["IDN"], "SP.POP.TOTL")
      const params = new URL(fetchRequests("GET")[0].url).searchParams
      expect(params.get("date")).toBe(`1960:${new Date().getFullYear()}`)
    })
  })

  describe("getIndicatorMeta", () => {
    const raw: WbIndicatorRaw = {
      id: "SP.POP.TOTL",
      name: "Population, total",
      unit: "",
      source: { id: "2", value: "World Development Indicators" },
      sourceNote: "Total population.",
      sourceOrganization: "UN",
      topics: [],
    }

    it("normalizes the indicator when found", async () => {
      mockFetch("GET", `${WB}/indicator/SP.POP.TOTL`, [meta(), [raw]])
      expect(await getIndicatorMeta("SP.POP.TOTL")).toEqual({
        code: "SP.POP.TOTL",
        name: "Population, total",
        sourceNote: "Total population.",
        sourceOrganization: "UN",
      })
    })

    it("returns null when not found", async () => {
      mockFetch("GET", `${WB}/indicator/NOPE`, [meta(), []])
      expect(await getIndicatorMeta("NOPE")).toBeNull()
    })
  })

  describe("listCountryPage", () => {
    it("filters by every region of real economies when none is chosen", async () => {
      mockFetch("GET", `${WB}/country`, (req) =>
        new URL(req.url).searchParams.has("region")
          ? [meta(1, 2, 1), [country("USA", "United States", "NAC"), country("IDN", "Indonesia")]]
          : [meta(), COUNTRIES]
      )
      const result = await listCountryPage({ page: 0 })
      expect(result.countries.map((c) => c.code)).toEqual(["IDN", "USA"])
      const paged = fetchRequests("GET").map((r) => new URL(r.url).searchParams).find((p) => p.has("region"))!
      expect(paged.get("region")).toBe("EAS;NAC")
      expect(paged.get("page")).toBe("1")
    })

    it("returns an empty page for an empty favorites list without fetching", async () => {
      expect(await listCountryPage({ page: 1, codes: [] })).toEqual({ countries: [], total: 0, pages: 1, page: 1 })
      expect(fetchRequests()).toHaveLength(0)
    })

    it("filters by region and requests the given page", async () => {
      mockFetch("GET", `${WB}/country`, [meta(2, 21, 2), [country("IDN", "Indonesia")]])
      const result = await listCountryPage({ page: 2, region: "EAS" })
      expect(result).toMatchObject({ total: 21, pages: 2, page: 2 })
      const params = new URL(fetchRequests("GET")[0].url).searchParams
      expect(params.get("region")).toBe("EAS")
      expect(params.get("page")).toBe("2")
    })

    it("falls back to the last page when the requested page is past the end", async () => {
      mockFetch("GET", `${WB}/country/IDN;USA`, (req) => {
        const page = Number(new URL(req.url).searchParams.get("page"))
        return page > 1 ? [meta(1, 2, page), []] : [meta(1, 2, 1), [country("USA", "United States"), country("IDN", "Indonesia")]]
      })
      const result = await listCountryPage({ page: 5, region: "EAS", codes: ["IDN", "USA"] })
      expect(result.page).toBe(1)
      expect(result.countries.map((c) => c.code)).toEqual(["IDN", "USA"])
    })
  })
})
