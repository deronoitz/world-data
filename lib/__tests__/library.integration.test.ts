// @vitest-environment node

import { favoriteCountries, savedIndicators } from "@/lib/db/schema"
import { OTHER_USER, TEST_USER, setAuthConfigured, setupAuth } from "@/test-kit/auth"
import { db } from "@/test-kit/db"

import { getFavoriteCodes, getSavedIndicatorCodes } from "../library"

const failNextSelect = () => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(db, "select").mockImplementationOnce(() => {
    throw new Error("boom")
  })
}

describe("getFavoriteCodes", () => {
  it("is empty when signed out, without querying", async () => {
    setupAuth({ user: null })
    const select = vi.spyOn(db, "select")
    expect(await getFavoriteCodes()).toEqual(new Set())
    expect(select).not.toHaveBeenCalled()
  })

  it("is empty when auth is not configured", async () => {
    setAuthConfigured(false)
    expect(await getFavoriteCodes()).toEqual(new Set())
  })

  it("returns only the user's favorite country codes", async () => {
    await db.insert(favoriteCountries).values([
      { user_id: TEST_USER.id, country_code: "IDN" },
      { user_id: TEST_USER.id, country_code: "BRA" },
      { user_id: OTHER_USER.id, country_code: "FRA" },
    ])
    expect(await getFavoriteCodes()).toEqual(new Set(["IDN", "BRA"]))
  })

  it("treats a failed query as no favorites", async () => {
    failNextSelect()
    expect(await getFavoriteCodes()).toEqual(new Set())
  })
})

describe("getSavedIndicatorCodes", () => {
  it("is empty when signed out", async () => {
    setupAuth({ user: null })
    expect(await getSavedIndicatorCodes()).toEqual([])
  })

  it("returns the user's pinned codes ordered by position", async () => {
    await db.insert(savedIndicators).values([
      { user_id: TEST_USER.id, indicator_code: "SP.POP.TOTL", position: 1 },
      { user_id: TEST_USER.id, indicator_code: "IT.NET.USER.ZS", position: 0 },
      { user_id: OTHER_USER.id, indicator_code: "NY.GDP.MKTP.CD", position: 0 },
    ])
    expect(await getSavedIndicatorCodes()).toEqual(["IT.NET.USER.ZS", "SP.POP.TOTL"])
  })

  it("treats a failed query as nothing pinned", async () => {
    failNextSelect()
    expect(await getSavedIndicatorCodes()).toEqual([])
  })
})
