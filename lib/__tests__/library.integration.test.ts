// @vitest-environment node

import { setupSupabase } from "@/test-kit/supabase"

import { getFavoriteCodes, getSavedIndicatorCodes } from "../library"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

describe("getFavoriteCodes", () => {
  it("is empty when signed out, without querying", async () => {
    const supabase = setupSupabase({ user: null })
    expect(await getFavoriteCodes()).toEqual(new Set())
    expect(supabase.queries).toHaveLength(0)
  })

  it("returns the user's favorite country codes", async () => {
    setupSupabase({
      tables: { favorite_countries: { data: [{ country_code: "IDN" }, { country_code: "BRA" }], error: null } },
    })
    expect(await getFavoriteCodes()).toEqual(new Set(["IDN", "BRA"]))
  })

  it("treats a failed query as no favorites", async () => {
    setupSupabase({ tables: { favorite_countries: { data: null, error: { message: "boom" } } } })
    expect(await getFavoriteCodes()).toEqual(new Set())
  })
})

describe("getSavedIndicatorCodes", () => {
  it("is empty when signed out", async () => {
    setupSupabase({ user: null })
    expect(await getSavedIndicatorCodes()).toEqual([])
  })

  it("returns pinned codes ordered by position", async () => {
    const supabase = setupSupabase({
      tables: {
        saved_indicators: {
          data: [{ indicator_code: "IT.NET.USER.ZS" }, { indicator_code: "SP.POP.TOTL" }],
          error: null,
        },
      },
    })
    expect(await getSavedIndicatorCodes()).toEqual(["IT.NET.USER.ZS", "SP.POP.TOTL"])
    expect(supabase.queries[0].ops).toEqual([
      ["select", "indicator_code"],
      ["order", "position", { ascending: true }],
    ])
  })

  it("treats a failed query as nothing pinned", async () => {
    setupSupabase({ tables: { saved_indicators: { data: null, error: { message: "boom" } } } })
    expect(await getSavedIndicatorCodes()).toEqual([])
  })
})
