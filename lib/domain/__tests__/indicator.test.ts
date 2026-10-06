import { DEFAULT_INDICATOR, INDICATORS, getIndicator, isIndicatorCode, resolveIndicator } from "../indicator"

describe("indicator catalog", () => {
  it("has unique codes", () => {
    const codes = INDICATORS.map((i) => i.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("recognizes catalog codes only", () => {
    expect(isIndicatorCode("SP.POP.TOTL")).toBe(true)
    expect(isIndicatorCode("sp.pop.totl")).toBe(false)
    expect(isIndicatorCode(undefined)).toBe(false)
  })

  it("looks up indicators by code", () => {
    expect(getIndicator("SP.DYN.LE00.IN")?.format).toBe("years")
    expect(getIndicator("nope")).toBeUndefined()
  })

  it("resolves invalid search params to the default indicator", () => {
    expect(resolveIndicator("SP.POP.TOTL").code).toBe("SP.POP.TOTL")
    expect(resolveIndicator("nope").code).toBe(DEFAULT_INDICATOR)
    expect(resolveIndicator(null).code).toBe(DEFAULT_INDICATOR)
  })
})
