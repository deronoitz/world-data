// @vitest-environment node

import { callRoute } from "@/test-kit/route"
import { setSupabaseConfigured, setupSupabase, TEST_USER, type Query } from "@/test-kit/supabase"

import { GET, POST, PUT } from "../route"
import { DELETE } from "../[code]/route"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const ROW = { indicator_code: "SP.URB.TOTL.IN.ZS", position: 3 }
const isLastPositionQuery = (query: Query) => query.ops.some(([op]) => op === "limit")

describe("GET /api/indicators", () => {
  it("lists pinned indicators by position, then creation time", async () => {
    const supabase = setupSupabase({ tables: { saved_indicators: { data: [ROW], error: null } } })
    const res = await callRoute(GET)
    expect(res).toMatchObject({ status: 200, body: [ROW] })
    expect(supabase.queries[0].ops).toEqual([
      ["select", "*"],
      ["order", "position", { ascending: true }],
      ["order", "created_at", { ascending: true }],
    ])
  })

  it("returns 401 when signed out", async () => {
    setupSupabase({ user: null })
    expect(await callRoute(GET)).toMatchObject({ status: 401, body: { error: "Unauthorized" } })
  })

  it("returns 503 when Supabase is not configured", async () => {
    setSupabaseConfigured(false)
    expect((await callRoute(GET)).status).toBe(503)
  })

  it("returns 500 on a database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    setupSupabase({ tables: { saved_indicators: { data: null, error: { message: "boom" } } } })
    expect(await callRoute(GET)).toMatchObject({ status: 500, body: { error: "Internal server error" } })
  })
})

describe("POST /api/indicators", () => {
  it("appends after the last pinned position", async () => {
    const supabase = setupSupabase({
      tables: {
        saved_indicators: (query) =>
          isLastPositionQuery(query) ? { data: { position: 2 }, error: null } : { data: ROW, error: null },
      },
    })
    const res = await callRoute(POST, { method: "POST", body: { indicator_code: ROW.indicator_code } })
    expect(res).toMatchObject({ status: 201, body: ROW })
    expect(supabase.queries[0].ops).toEqual([
      ["select", "position"],
      ["order", "position", { ascending: false }],
      ["limit", 1],
      ["maybeSingle"],
    ])
    expect(supabase.queries[1].ops[0]).toEqual(["insert", { indicator_code: ROW.indicator_code, position: 3 }])
  })

  it("starts at position 0 when nothing is pinned yet", async () => {
    const supabase = setupSupabase({
      tables: {
        saved_indicators: (query) =>
          isLastPositionQuery(query) ? { data: null, error: null } : { data: ROW, error: null },
      },
    })
    await callRoute(POST, { method: "POST", body: { indicator_code: ROW.indicator_code } })
    expect(supabase.queries[1].ops[0]).toEqual(["insert", { indicator_code: ROW.indicator_code, position: 0 }])
  })

  it("rejects an unsupported indicator", async () => {
    setupSupabase()
    const res = await callRoute(POST, { method: "POST", body: { indicator_code: "NOPE" } })
    expect(res).toMatchObject({ status: 400, body: { error: "indicator_code is not a supported indicator" } })
  })

  it("rejects invalid JSON", async () => {
    setupSupabase()
    const res = await callRoute(POST, { method: "POST", body: "{" })
    expect(res).toMatchObject({ status: 400, body: { error: "Invalid JSON body" } })
  })

  it("maps an already-pinned indicator to 409", async () => {
    setupSupabase({
      tables: {
        saved_indicators: (query) =>
          isLastPositionQuery(query)
            ? { data: null, error: null }
            : { data: null, error: { code: "23505", message: "duplicate" } },
      },
    })
    const res = await callRoute(POST, { method: "POST", body: { indicator_code: ROW.indicator_code } })
    expect(res).toMatchObject({ status: 409, body: { error: "Already exists" } })
  })

  it("fails when the position lookup errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const supabase = setupSupabase({
      tables: { saved_indicators: { data: null, error: { message: "boom" } } },
    })
    const res = await callRoute(POST, { method: "POST", body: { indicator_code: ROW.indicator_code } })
    expect(res.status).toBe(500)
    expect(supabase.queries).toHaveLength(1)
  })
})

describe("PUT /api/indicators", () => {
  it("upserts every code with its new position", async () => {
    const supabase = setupSupabase({ tables: { saved_indicators: { data: [], error: null } } })
    const res = await callRoute(PUT, { method: "PUT", body: { order: ["SP.POP.TOTL", "IT.NET.USER.ZS"] } })
    expect(res.status).toBe(200)
    expect(supabase.queries[0].ops[0]).toEqual([
      "upsert",
      [
        { user_id: TEST_USER.id, indicator_code: "SP.POP.TOTL", position: 0 },
        { user_id: TEST_USER.id, indicator_code: "IT.NET.USER.ZS", position: 1 },
      ],
      { onConflict: "user_id,indicator_code" },
    ])
  })

  it.each([
    ["a non-array order", { order: "SP.POP.TOTL" }, "order must be an array"],
    ["an unknown code", { order: ["NOPE"] }, "order is not a supported indicator"],
    ["duplicate codes", { order: ["SP.POP.TOTL", "SP.POP.TOTL"] }, "order has duplicates"],
    ["a non-object body", [], "Body must be a JSON object"],
  ])("returns 400 for %s", async (_, body, error) => {
    setupSupabase()
    const res = await callRoute(PUT, { method: "PUT", body })
    expect(res).toMatchObject({ status: 400, body: { error } })
  })
})

describe("DELETE /api/indicators/[code]", () => {
  it("unpins the URL-decoded code", async () => {
    const supabase = setupSupabase()
    const res = await callRoute(DELETE, { method: "DELETE", params: { code: "SP.POP.TOTL" } })
    expect(res).toMatchObject({ status: 204, body: null })
    expect(supabase.queries[0].ops).toEqual([["delete"], ["eq", "indicator_code", "SP.POP.TOTL"]])
  })

  it("rejects an unsupported code", async () => {
    setupSupabase()
    const res = await callRoute(DELETE, { method: "DELETE", params: { code: "NOPE%20X" } })
    expect(res).toMatchObject({ status: 400, body: { error: "code is not a supported indicator" } })
  })

  it("surfaces database errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    setupSupabase({ tables: { saved_indicators: { data: null, error: { message: "boom" } } } })
    expect((await callRoute(DELETE, { method: "DELETE", params: { code: "SP.POP.TOTL" } })).status).toBe(500)
  })
})
