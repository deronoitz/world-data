import { isAggregate, normalizeCountry, normalizeIndicator, normalizeObservation } from "../normalize"
import type { WbCountryRaw, WbObservationRaw } from "../raw-types"

const ref = (id: string, value: string) => ({ id, iso2code: "", value })

const RAW_COUNTRY: WbCountryRaw = {
  id: "IDN",
  iso2Code: "ID",
  name: " Indonesia ",
  region: ref("EAS", "East Asia & Pacific "),
  adminregion: ref("EAP", "East Asia & Pacific (excluding high income)"),
  incomeLevel: ref("UMC", "Upper middle income"),
  lendingType: ref("IBD", "IBRD"),
  capitalCity: "Jakarta",
  longitude: "106.83",
  latitude: "-6.19752",
}

describe("normalizeCountry", () => {
  it("trims names and parses coordinates", () => {
    expect(normalizeCountry(RAW_COUNTRY)).toEqual({
      code: "IDN",
      iso2: "ID",
      name: "Indonesia",
      region: { id: "EAS", name: "East Asia & Pacific" },
      incomeLevel: { id: "UMC", name: "Upper middle income" },
      capital: "Jakarta",
      lat: -6.19752,
      lng: 106.83,
    })
  })

  it('maps "" to null', () => {
    const c = normalizeCountry({ ...RAW_COUNTRY, capitalCity: " ", latitude: "", longitude: "abc" })
    expect(c).toMatchObject({ capital: null, lat: null, lng: null })
  })
})

describe("isAggregate", () => {
  it('treats region "NA" as an aggregate', () => {
    expect(isAggregate({ ...RAW_COUNTRY, region: ref("NA", "Aggregates") })).toBe(true)
    expect(isAggregate(RAW_COUNTRY)).toBe(false)
  })
})

describe("normalizeObservation", () => {
  const raw: WbObservationRaw = {
    indicator: { id: "SP.POP.TOTL", value: "Population, total" },
    country: { id: "ID", value: "Indonesia" },
    countryiso3code: "IDN",
    date: "2023",
    value: 277_534_122,
    obs_status: "",
    decimal: 0,
  }

  it("uses the ISO3 code and a numeric year", () => {
    expect(normalizeObservation(raw)).toEqual({ country: "IDN", year: 2023, value: 277_534_122 })
  })

  it("keeps missing values as null", () => {
    expect(normalizeObservation({ ...raw, value: null }).value).toBeNull()
  })
})

describe("normalizeIndicator", () => {
  it("keeps the descriptive fields", () => {
    expect(
      normalizeIndicator({
        id: "SP.POP.TOTL",
        name: "Population, total",
        unit: "",
        source: { id: "2", value: "WDI" },
        sourceNote: "Total population…",
        sourceOrganization: "UN",
        topics: [],
      })
    ).toEqual({
      code: "SP.POP.TOTL",
      name: "Population, total",
      sourceNote: "Total population…",
      sourceOrganization: "UN",
    })
  })
})
