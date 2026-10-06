import {
  ValidationError,
  asRecord,
  countryCode,
  countryCodes,
  indicatorCode,
  isUuid,
  optionalYear,
  text,
} from "../validate"

describe("asRecord", () => {
  it("accepts plain objects", () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 })
  })

  it.each([null, [], "x", 1])("rejects %j", (value) => {
    expect(() => asRecord(value)).toThrow(ValidationError)
  })
})

describe("countryCode", () => {
  it.each(["IDN", "XKX", "A1B"])("accepts %s", (code) => {
    expect(countryCode(code)).toBe(code)
  })

  it.each(["idn", "ID", "INDO", "", 123, null])("rejects %j", (value) => {
    expect(() => countryCode(value)).toThrow("country_code must be an ISO3 country code")
  })

  it("names the field in the error", () => {
    expect(() => countryCode("x", "codes")).toThrow("codes must be")
  })
})

describe("indicatorCode", () => {
  it("accepts catalog indicators", () => {
    expect(indicatorCode("SP.POP.TOTL")).toBe("SP.POP.TOTL")
  })

  it("rejects unknown indicators", () => {
    expect(() => indicatorCode("NOT.REAL")).toThrow(ValidationError)
  })
})

describe("text", () => {
  it("trims", () => {
    expect(text("  hello  ", "name", 10)).toBe("hello")
  })

  it("rejects whitespace-only and over-long values", () => {
    expect(() => text("   ", "name", 10)).toThrow("name must be 1–10 characters")
    expect(() => text("x".repeat(11), "name", 10)).toThrow(ValidationError)
  })

  it("rejects non-strings", () => {
    expect(() => text(5, "name", 10)).toThrow("name must be a string")
  })
})

describe("optionalYear", () => {
  it("treats null/undefined as no year", () => {
    expect(optionalYear(undefined, "y")).toBeNull()
    expect(optionalYear(null, "y")).toBeNull()
  })

  it("accepts 1960–2100", () => {
    expect(optionalYear(1960, "y")).toBe(1960)
    expect(optionalYear(2100, "y")).toBe(2100)
  })

  it.each([1959, 2101, 2000.5, "2000"])("rejects %j", (value) => {
    expect(() => optionalYear(value, "y")).toThrow(ValidationError)
  })
})

describe("countryCodes", () => {
  it("dedupes before checking the 2–6 bound", () => {
    expect(countryCodes(["IDN", "USA", "IDN"])).toEqual(["IDN", "USA"])
    expect(() => countryCodes(["IDN", "IDN"])).toThrow("2–6 distinct countries")
  })

  it("rejects more than 6", () => {
    expect(() => countryCodes(["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG"])).toThrow(ValidationError)
  })

  it("validates every code", () => {
    expect(() => countryCodes(["IDN", "usa"])).toThrow("country_codes must be an ISO3 country code")
  })

  it("rejects non-arrays", () => {
    expect(() => countryCodes("IDN,USA")).toThrow("country_codes must be an array")
  })
})

describe("isUuid", () => {
  it("matches UUIDs case-insensitively", () => {
    expect(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBe(true)
    expect(isUuid("3F2504E0-4F89-11D3-9A0C-0305E82C3301")).toBe(true)
  })

  it("rejects other values", () => {
    expect(isUuid("3f2504e0")).toBe(false)
    expect(isUuid(42)).toBe(false)
  })
})
