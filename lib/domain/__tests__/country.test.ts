import type { Country } from "@/lib/domain/country"

import { filterCountries, firstParam, regionOptions } from "../country"

function country(code: string, name: string, region: [string, string], capital: string | null): Country {
  return {
    code,
    iso2: code.slice(0, 2),
    name,
    region: { id: region[0], name: region[1] },
    incomeLevel: { id: "HIC", name: "High income" },
    capital,
    lat: null,
    lng: null,
  }
}

const EAP: [string, string] = ["EAS", "East Asia & Pacific"]
const NAC: [string, string] = ["NAC", "North America"]
const COUNTRIES = [
  country("IDN", "Indonesia", EAP, "Jakarta"),
  country("USA", "United States", NAC, "Washington D.C."),
  country("CAN", "Canada", NAC, null),
]

describe("filterCountries", () => {
  it("returns everything without a filter", () => {
    expect(filterCountries(COUNTRIES, {})).toHaveLength(3)
  })

  it("matches name substrings, exact codes and capitals, case-insensitively", () => {
    const codes = (q: string) => filterCountries(COUNTRIES, { q }).map((c) => c.code)
    expect(codes("  indo ")).toEqual(["IDN"])
    expect(codes("usa")).toEqual(["USA"])
    expect(codes("us")).toEqual([]) // codes must match exactly
    expect(codes("jakarta")).toEqual(["IDN"])
  })

  it("combines region and allow-list filters", () => {
    const result = filterCountries(COUNTRIES, { region: "NAC", only: new Set(["CAN", "IDN"]) })
    expect(result.map((c) => c.code)).toEqual(["CAN"])
  })
})

describe("regionOptions", () => {
  it("lists distinct regions sorted by name", () => {
    expect(regionOptions(COUNTRIES)).toEqual([
      { id: "EAS", name: "East Asia & Pacific" },
      { id: "NAC", name: "North America" },
    ])
  })
})

describe("firstParam", () => {
  it("unwraps repeated search params", () => {
    expect(firstParam(["a", "b"])).toBe("a")
    expect(firstParam("a")).toBe("a")
    expect(firstParam(undefined)).toBeUndefined()
  })
})
