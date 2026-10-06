import { FIRST_YEAR, LAST_YEAR, parseYear, parseYearRange } from "../year"

describe("parseYear", () => {
  it("accepts years in range", () => {
    expect(parseYear(String(FIRST_YEAR))).toBe(FIRST_YEAR)
    expect(parseYear(String(LAST_YEAR))).toBe(LAST_YEAR)
  })

  it.each([undefined, "", "abc", "1959", String(LAST_YEAR + 1), "2000.5"])("rejects %j", (value) => {
    expect(parseYear(value)).toBeUndefined()
  })
})

describe("parseYearRange", () => {
  it("swaps a reversed range", () => {
    expect(parseYearRange("2020", "2000")).toEqual({ from: 2000, to: 2020 })
  })

  it("keeps one-sided ranges", () => {
    expect(parseYearRange("2000", "nope")).toEqual({ from: 2000, to: undefined })
  })
})
