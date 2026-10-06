// @vitest-environment node

import { favoriteCountries } from "@/lib/db/schema"
import { OTHER_USER, TEST_USER, setAuthConfigured, setupAuth } from "@/test-kit/auth"
import { db } from "@/test-kit/db"
import { callRoute } from "@/test-kit/route"

import { GET, POST } from "../route"
import { DELETE } from "../[code]/route"

const codesOf = async (userId: string) =>
  (await db.select().from(favoriteCountries)).filter((r) => r.user_id === userId).map((r) => r.country_code)

describe("/api/favorites", () => {
  it("returns 503 when auth isn't configured", async () => {
    setAuthConfigured(false)
    const res = await callRoute(GET)
    expect(res).toMatchObject({ status: 503, body: { error: "Auth is not configured" } })
  })

  it("returns 401 when signed out", async () => {
    setupAuth({ user: null })
    const res = await callRoute(GET)
    expect(res).toMatchObject({ status: 401, body: { error: "Unauthorized" } })
  })

  it("lists only the user's favorites, newest first", async () => {
    await db.insert(favoriteCountries).values([
      { user_id: TEST_USER.id, country_code: "IDN", created_at: new Date("2026-01-01") },
      { user_id: TEST_USER.id, country_code: "USA", created_at: new Date("2026-02-01") },
      { user_id: OTHER_USER.id, country_code: "FRA" },
    ])

    const res = await callRoute(GET)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { user_id: TEST_USER.id, country_code: "USA", created_at: "2026-02-01T00:00:00.000Z" },
      { user_id: TEST_USER.id, country_code: "IDN", created_at: "2026-01-01T00:00:00.000Z" },
    ])
  })

  it("adds a favorite idempotently", async () => {
    const first = await callRoute(POST, { method: "POST", body: { country_code: "IDN" } })
    const again = await callRoute(POST, { method: "POST", body: { country_code: "IDN" } })

    expect(first).toMatchObject({ status: 201, body: { user_id: TEST_USER.id, country_code: "IDN" } })
    expect(again).toMatchObject({ status: 201, body: { country_code: "IDN" } })
    expect(await codesOf(TEST_USER.id)).toEqual(["IDN"])
  })

  it.each([
    ["invalid JSON", "{nope", "Invalid JSON body"],
    ["a non-object body", ["IDN"], "Body must be a JSON object"],
    ["a bad country code", { country_code: "idn" }, "country_code must be an ISO3 country code"],
  ])("returns 400 for %s", async (_, body, error) => {
    const res = await callRoute(POST, { method: "POST", body })
    expect(res).toMatchObject({ status: 400, body: { error } })
    expect(await codesOf(TEST_USER.id)).toEqual([])
  })

  it("returns 500 without leaking database errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(db, "select").mockImplementationOnce(() => {
      throw new Error("secret")
    })
    const res = await callRoute(GET)
    expect(res).toMatchObject({ status: 500, body: { error: "Internal server error" } })
  })
})

describe("/api/favorites/[code]", () => {
  it("deletes only the user's own favorite", async () => {
    await db.insert(favoriteCountries).values([
      { user_id: TEST_USER.id, country_code: "IDN" },
      { user_id: OTHER_USER.id, country_code: "IDN" },
    ])

    const res = await callRoute(DELETE, { method: "DELETE", params: { code: "IDN" } })

    expect(res.status).toBe(204)
    expect(await codesOf(TEST_USER.id)).toEqual([])
    expect(await codesOf(OTHER_USER.id)).toEqual(["IDN"])
  })
})
