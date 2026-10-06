// @vitest-environment jsdom
// The store persists to localStorage.

import { MAX_COMPARE, useCompare } from "../compare-store"

const state = () => useCompare.getState()

beforeEach(() => {
  useCompare.setState({ countries: [] })
})

describe("compare store", () => {
  it("adds once and reports success for duplicates", () => {
    expect(state().add("IDN")).toBe(true)
    expect(state().add("IDN")).toBe(true)
    expect(state().countries).toEqual(["IDN"])
  })

  it(`refuses more than ${MAX_COMPARE} countries`, () => {
    const codes = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF"]
    codes.forEach((c) => state().add(c))
    expect(state().add("GGG")).toBe(false)
    expect(state().countries).toEqual(codes)
  })

  it("toggles in and out", () => {
    state().toggle("IDN")
    expect(state().countries).toEqual(["IDN"])
    expect(state().toggle("IDN")).toBe(true)
    expect(state().countries).toEqual([])
  })

  it("setAll dedupes and caps", () => {
    state().setAll(["AAA", "AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG"])
    expect(state().countries).toEqual(["AAA", "BBB", "CCC", "DDD", "EEE", "FFF"])
  })

  it("removes and clears", () => {
    state().setAll(["AAA", "BBB"])
    state().remove("AAA")
    expect(state().countries).toEqual(["BBB"])
    state().clear()
    expect(state().countries).toEqual([])
  })
})
