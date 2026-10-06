// @vitest-environment node

import { WB, wbCountry, wbPage } from "@/test-kit/app-fixtures"
import { fetchRequests, mockFetch } from "@/test-kit/mock-fetch"
import { setupSupabase } from "@/test-kit/supabase"

import { loadCountryPage } from "../load-country-page"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const IDN = wbCountry("IDN", "Indonesia", { capital: "Jakarta" })
const BRA = wbCountry("BRA", "Brazil", { region: ["LCN", "Latin America & Caribbean"], capital: "Brasilia" })
const ARG = wbCountry("ARG", "Argentina", { region: ["LCN", "Latin America & Caribbean"], capital: "Buenos Aires" })
const WLD = wbCountry("WLD", "World", { region: ["NA", "Aggregates"] })
const ALL = [IDN, BRA, ARG, WLD]

// 25 Latin American economies, so a name search spans two pages of 20.
const MANY = Array.from({ length: 25 }, (_, i) =>
  wbCountry(`A${String(i).padStart(2, "0")}`, `Arcadia ${String(i).padStart(2, "0")}`, {
    region: ["LCN", "Latin America & Caribbean"],
  })
)

const favorites = (codes: string[]) =>
  setupSupabase({ tables: { favorite_countries: { data: codes.map((country_code) => ({ country_code })), error: null } } })

const names = (page: Awaited<ReturnType<typeof loadCountryPage>>) => page.countries.map((c) => c.name)

describe("loadCountryPage without a search", () => {
  it("pages through every region via the API, sorted by name", async () => {
    mockFetch("GET", `${WB}/country`, (req: Request) =>
      new URL(req.url).searchParams.has("region") ? wbPage([IDN, BRA], { page: 2, pages: 3, total: 45 }) : wbPage(ALL)
    )

    const result = await loadCountryPage({ page: "2" })

    expect(result).toMatchObject({ total: 45, pages: 3, page: 2 })
    expect(names(result)).toEqual(["Brazil", "Indonesia"])
    const listed = new URL(fetchRequests("GET", `${WB}/country`).at(-1)!.url).searchParams
    expect(Object.fromEntries(listed)).toMatchObject({ region: "EAS;LCN", per_page: "20", page: "2" })
  })

  it("filters by region and treats a bad page number as page 1", async () => {
    mockFetch("GET", `${WB}/country`, wbPage([BRA, ARG], { total: 2 }))

    const result = await loadCountryPage({ region: "LCN", page: "abc", q: "  " })

    expect(names(result)).toEqual(["Argentina", "Brazil"])
    const listed = new URL(fetchRequests("GET", `${WB}/country`)[0].url).searchParams
    expect(Object.fromEntries(listed)).toMatchObject({ region: "LCN", page: "1" })
  })

  it("lists only favorites on the favorites tab", async () => {
    favorites(["IDN", "BRA"])
    mockFetch("GET", `${WB}/country/IDN;BRA`, wbPage([IDN, BRA]))

    const result = await loadCountryPage({ tab: "favorites", region: "EAS" })

    expect(names(result)).toEqual(["Brazil", "Indonesia"])
  })

  it("returns an empty page without calling the API when there are no favorites", async () => {
    setupSupabase({ user: null })
    expect(await loadCountryPage({ tab: "favorites" })).toEqual({ countries: [], total: 0, pages: 1, page: 1 })
    expect(fetchRequests()).toHaveLength(0)
  })
})

describe("loadCountryPage with a search", () => {
  beforeEach(() => {
    mockFetch("GET", `${WB}/country`, wbPage([...ALL, ...MANY]))
  })

  it("filters the cached list by name, capital and region", async () => {
    expect(names(await loadCountryPage({ q: "Buenos" }))).toEqual(["Argentina"])
    expect(names(await loadCountryPage({ q: "a", region: "EAS" }))).toEqual(["Indonesia"])
  })

  it("pages the matches and clamps an out-of-range page", async () => {
    const result = await loadCountryPage({ q: "arcadia", page: "9" })
    expect(result).toMatchObject({ total: 25, pages: 2, page: 2 })
    expect(names(result)).toEqual(["Arcadia 20", "Arcadia 21", "Arcadia 22", "Arcadia 23", "Arcadia 24"])
  })

  it("reports one empty page when nothing matches", async () => {
    expect(await loadCountryPage({ q: "zzz", page: "3" })).toEqual({ countries: [], total: 0, pages: 1, page: 1 })
  })

  it("searches within favorites on the favorites tab", async () => {
    favorites(["ARG"])
    expect(names(await loadCountryPage({ q: "ar", tab: "favorites" }))).toEqual(["Argentina"])
  })
})
