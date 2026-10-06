import { flagEmoji, formatAxis, formatDate, formatFull, formatValue } from "../format"

describe("formatValue", () => {
  it.each([
    [1_234_567, "compact", "1.2M"],
    [21_000_000_000_000, "usd-compact", "$21T"],
    [4_876.4, "usd", "$4,876"],
    [3.456, "percent", "3.5%"],
    [71.23, "years", "71.2 yrs"],
    [2.345, "decimal", "2.35"],
  ] as const)("formats %d as %s", (value, format, expected) => {
    expect(formatValue(value, format)).toBe(expected)
  })

  it.each([null, undefined, NaN, Infinity])("shows a dash for %j", (value) => {
    expect(formatValue(value, "compact")).toBe("—")
  })
})

describe("formatAxis", () => {
  it("uses compact currency for both USD formats", () => {
    expect(formatAxis(12_000, "usd")).toBe("$12K")
    expect(formatAxis(12_000, "usd-compact")).toBe("$12K")
  })

  it("compacts percentages", () => {
    expect(formatAxis(1500, "percent")).toBe("1.5K%")
  })

  it("uses one decimal for years and decimals", () => {
    expect(formatAxis(71.26, "years")).toBe("71.3")
    expect(formatAxis(2.345, "decimal")).toBe("2.3")
  })

  it("compacts plain counts", () => {
    expect(formatAxis(1_234_567, "compact")).toBe("1.2M")
  })
})

describe("formatFull", () => {
  it("rounds and groups thousands", () => {
    expect(formatFull(1234567.8)).toBe("1,234,568")
  })
})

describe("formatDate", () => {
  it("formats an ISO timestamp as a short US date", () => {
    expect(formatDate("2026-01-02T12:00:00Z")).toBe("Jan 2, 2026")
  })
})

describe("flagEmoji", () => {
  it("builds regional indicator pairs", () => {
    expect(flagEmoji("ID")).toBe("🇮🇩")
  })

  it("falls back for non-letter codes", () => {
    expect(flagEmoji("1A")).toBe("🏳️")
    expect(flagEmoji("id")).toBe("🏳️")
  })
})
