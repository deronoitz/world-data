// @vitest-environment node

import { callRoute } from "@/test-kit/route"
import { setSupabaseConfigured, setupSupabase } from "@/test-kit/supabase"

import { GET, POST } from "../route"
import { DELETE } from "../[code]/route"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

describe("/api/favorites", () => {
  it("returns 503 when Supabase isn't configured", async () => {
    setSupabaseConfigured(false)
    const res = await callRoute(GET)
    expect(res).toMatchObject({ status: 503, body: { error: "Supabase is not configured" } })
  })

  it("returns 401 when signed out", async () => {
    setupSupabase({ user: null })
    const res = await callRoute(GET)
    expect(res).toMatchObject({ status: 401, body: { error: "Unauthorized" } })
  })

  it("lists favorites newest first", async () => {
    const rows = [{ user_id: "u", country_code: "IDN", created_at: "2026-01-01T00:00:00Z" }]
    const supabase = setupSupabase({ tables: { favorite_countries: { data: rows, error: null } } })

    const res = await callRoute(GET)

    expect(res).toMatchObject({ status: 200, body: rows })
    expect(supabase.queries).toEqual([
      {
        table: "favorite_countries",
        ops: [["select", "*"], ["order", "created_at", { ascending: false }]],
      },
    ])
  })

  it("upserts a favorite idempotently", async () => {
    const supabase = setupSupabase({ tables: { favorite_countries: { data: null, error: null } } })

    const res = await callRoute(POST, { method: "POST", body: { country_code: "IDN" } })

    expect(res).toMatchObject({ status: 201, body: { country_code: "IDN" } })
    expect(supabase.queries[0].ops[0]).toEqual([
      "upsert",
      { country_code: "IDN" },
      { onConflict: "user_id,country_code", ignoreDuplicates: true },
    ])
  })

  it.each([
    ["invalid JSON", "{nope", "Invalid JSON body"],
    ["a non-object body", ["IDN"], "Body must be a JSON object"],
    ["a bad country code", { country_code: "idn" }, "country_code must be an ISO3 country code"],
  ])("returns 400 for %s", async (_, body, error) => {
    const supabase = setupSupabase()
    const res = await callRoute(POST, { method: "POST", body })
    expect(res).toMatchObject({ status: 400, body: { error } })
    expect(supabase.queries).toEqual([])
  })

  it("returns 500 without leaking database errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    setupSupabase({ tables: { favorite_countries: { data: null, error: { code: "XX000", message: "secret" } } } })
    const res = await callRoute(GET)
    expect(res).toMatchObject({ status: 500, body: { error: "Internal server error" } })
  })
})

describe("/api/favorites/[code]", () => {
  it("deletes by country code", async () => {
    const supabase = setupSupabase()
    const res = await callRoute(DELETE, { method: "DELETE", params: { code: "IDN" } })
    expect(res.status).toBe(204)
    expect(supabase.queries[0]).toEqual({
      table: "favorite_countries",
      ops: [["delete"], ["eq", "country_code", "IDN"]],
    })
  })
})
