// @vitest-environment node

import { savedIndicators } from "@/lib/db/schema"
import { OTHER_USER, TEST_USER, setAuthConfigured, setupAuth } from "@/test-kit/auth"
import { db } from "@/test-kit/db"
import { callRoute } from "@/test-kit/route"

import { GET, POST, PUT } from "../route"
import { DELETE } from "../[code]/route"

const POP = "SP.POP.TOTL"
const NET = "IT.NET.USER.ZS"
const URB = "SP.URB.TOTL.IN.ZS"

const pinned = async (userId = TEST_USER.id) =>
  (await db.select().from(savedIndicators))
    .filter((r) => r.user_id === userId)
    .sort((a, b) => a.position - b.position)
    .map((r) => [r.indicator_code, r.position])

describe("GET /api/indicators", () => {
  it("lists the user's pinned indicators by position, then creation time", async () => {
    await db.insert(savedIndicators).values([
      { user_id: TEST_USER.id, indicator_code: NET, position: 1 },
      { user_id: TEST_USER.id, indicator_code: URB, position: 0, created_at: new Date("2026-02-01") },
      { user_id: TEST_USER.id, indicator_code: POP, position: 0, created_at: new Date("2026-01-01") },
      { user_id: OTHER_USER.id, indicator_code: POP, position: 0 },
    ])
    const res = await callRoute(GET)
    expect(res.status).toBe(200)
    expect((res.body as unknown as { indicator_code: string }[]).map((r) => r.indicator_code)).toEqual([
      POP,
      URB,
      NET,
    ])
  })

  it("returns 401 when signed out", async () => {
    setupAuth({ user: null })
    expect(await callRoute(GET)).toMatchObject({ status: 401, body: { error: "Unauthorized" } })
  })

  it("returns 503 when auth is not configured", async () => {
    setAuthConfigured(false)
    expect((await callRoute(GET)).status).toBe(503)
  })
})

describe("POST /api/indicators", () => {
  it("appends after the user's last pinned position", async () => {
    await db.insert(savedIndicators).values([
      { user_id: TEST_USER.id, indicator_code: POP, position: 2 },
      { user_id: OTHER_USER.id, indicator_code: NET, position: 9 },
    ])
    const res = await callRoute(POST, { method: "POST", body: { indicator_code: URB } })
    expect(res).toMatchObject({ status: 201, body: { indicator_code: URB, position: 3 } })
  })

  it("starts at position 0 when nothing is pinned yet", async () => {
    const res = await callRoute(POST, { method: "POST", body: { indicator_code: URB } })
    expect(res).toMatchObject({ status: 201, body: { indicator_code: URB, position: 0 } })
  })

  it("rejects an unsupported indicator", async () => {
    const res = await callRoute(POST, { method: "POST", body: { indicator_code: "NOPE" } })
    expect(res).toMatchObject({ status: 400, body: { error: "indicator_code is not a supported indicator" } })
  })

  it("rejects invalid JSON", async () => {
    const res = await callRoute(POST, { method: "POST", body: "{" })
    expect(res).toMatchObject({ status: 400, body: { error: "Invalid JSON body" } })
  })

  it("maps an already-pinned indicator to 409", async () => {
    await db.insert(savedIndicators).values({ user_id: TEST_USER.id, indicator_code: URB })
    const res = await callRoute(POST, { method: "POST", body: { indicator_code: URB } })
    expect(res).toMatchObject({ status: 409, body: { error: "Already exists" } })
  })
})

describe("PUT /api/indicators", () => {
  it("rewrites positions in the given order and returns the list", async () => {
    await db.insert(savedIndicators).values([
      { user_id: TEST_USER.id, indicator_code: NET, position: 0 },
      { user_id: TEST_USER.id, indicator_code: POP, position: 1 },
      { user_id: OTHER_USER.id, indicator_code: POP, position: 5 },
    ])
    const res = await callRoute(PUT, { method: "PUT", body: { order: [POP, NET] } })
    expect(res.status).toBe(200)
    expect(await pinned()).toEqual([
      [POP, 0],
      [NET, 1],
    ])
    expect(await pinned(OTHER_USER.id)).toEqual([[POP, 5]])
  })

  it("accepts an empty order", async () => {
    const res = await callRoute(PUT, { method: "PUT", body: { order: [] } })
    expect(res).toMatchObject({ status: 200, body: [] })
  })

  it.each([
    ["a code that isn't saved", [POP, NET, URB]],
    ["a missing saved code", [POP]],
  ])("returns 409 and changes nothing for %s", async (_, order) => {
    await db.insert(savedIndicators).values([
      { user_id: TEST_USER.id, indicator_code: NET, position: 0 },
      { user_id: TEST_USER.id, indicator_code: POP, position: 1 },
    ])
    const res = await callRoute(PUT, { method: "PUT", body: { order } })
    expect(res).toMatchObject({ status: 409, body: { error: "order must list exactly the saved indicators" } })
    expect(await pinned()).toEqual([
      [NET, 0],
      [POP, 1],
    ])
  })

  it.each([
    ["a non-array order", { order: POP }, "order must be an array"],
    ["an unknown code", { order: ["NOPE"] }, "order is not a supported indicator"],
    ["duplicate codes", { order: [POP, POP] }, "order has duplicates"],
    ["a non-object body", [], "Body must be a JSON object"],
  ])("returns 400 for %s", async (_, body, error) => {
    const res = await callRoute(PUT, { method: "PUT", body })
    expect(res).toMatchObject({ status: 400, body: { error } })
  })
})

describe("DELETE /api/indicators/[code]", () => {
  it("unpins only the user's own indicator", async () => {
    await db.insert(savedIndicators).values([
      { user_id: TEST_USER.id, indicator_code: POP },
      { user_id: OTHER_USER.id, indicator_code: POP },
    ])
    const res = await callRoute(DELETE, { method: "DELETE", params: { code: POP } })
    expect(res).toMatchObject({ status: 204, body: null })
    expect(await pinned()).toEqual([])
    expect(await pinned(OTHER_USER.id)).toEqual([[POP, 0]])
  })

  it("rejects an unsupported code", async () => {
    const res = await callRoute(DELETE, { method: "DELETE", params: { code: "NOPE%20X" } })
    expect(res).toMatchObject({ status: 400, body: { error: "code is not a supported indicator" } })
  })

  it("surfaces database errors as 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(db, "delete").mockImplementationOnce(() => {
      throw new Error("boom")
    })
    expect((await callRoute(DELETE, { method: "DELETE", params: { code: POP } })).status).toBe(500)
  })
})
