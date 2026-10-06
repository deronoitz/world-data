// @vitest-environment node

import { callRoute } from "@/test-kit/route"
import { setupSupabase } from "@/test-kit/supabase"

import { GET, POST } from "../route"
import { DELETE, PATCH } from "../[id]/route"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
const VALID = {
  name: " Asia vs US ",
  country_codes: ["IDN", "USA"],
  indicator_code: "SP.POP.TOTL",
  year_from: 2000,
  year_to: 2020,
}

describe("GET /api/comparisons", () => {
  it("lists comparisons newest first", async () => {
    const supabase = setupSupabase({ tables: { comparisons: { data: [{ id: ID }], error: null } } })
    const res = await callRoute(GET)
    expect(res).toMatchObject({ status: 200, body: [{ id: ID }] })
    expect(supabase.queries[0].ops).toEqual([
      ["select", "*"],
      ["order", "created_at", { ascending: false }],
    ])
  })
})

describe("POST /api/comparisons", () => {
  it("inserts a normalized comparison", async () => {
    const supabase = setupSupabase({ tables: { comparisons: { data: { id: ID }, error: null } } })
    const res = await callRoute(POST, { method: "POST", body: VALID })
    expect(res).toMatchObject({ status: 201, body: { id: ID } })
    expect(supabase.queries[0].ops[0]).toEqual(["insert", { ...VALID, name: "Asia vs US" }])
  })

  it.each([
    ["one country", { country_codes: ["IDN"] }, "country_codes must contain 2–6 distinct countries"],
    ["an unknown indicator", { indicator_code: "X" }, "indicator_code is not a supported indicator"],
    ["a reversed year range", { year_from: 2020, year_to: 2000 }, "year_from must not be after year_to"],
    ["a missing name", { name: "" }, "name must be 1–120 characters"],
  ])("returns 400 for %s", async (_, patch, error) => {
    setupSupabase()
    const res = await callRoute(POST, { method: "POST", body: { ...VALID, ...patch } })
    expect(res).toMatchObject({ status: 400, body: { error } })
  })

  it("maps a unique violation to 409", async () => {
    setupSupabase({ tables: { comparisons: { data: null, error: { code: "23505", message: "dup" } } } })
    const res = await callRoute(POST, { method: "POST", body: VALID })
    expect(res).toMatchObject({ status: 409, body: { error: "Already exists" } })
  })
})

describe("PATCH /api/comparisons/[id]", () => {
  it("only updates the fields sent", async () => {
    const supabase = setupSupabase({ tables: { comparisons: { data: { id: ID, name: "Renamed" }, error: null } } })
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: ID }, body: { name: "Renamed" } })
    expect(res.status).toBe(200)
    expect(supabase.queries[0].ops[0]).toEqual(["update", { name: "Renamed" }])
  })

  it("rejects an empty update", async () => {
    setupSupabase()
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: ID }, body: {} })
    expect(res).toMatchObject({ status: 400, body: { error: "Nothing to update" } })
  })
})

describe("PATCH /api/comparisons/[id] fields", () => {
  it("validates and updates every editable field", async () => {
    const supabase = setupSupabase({ tables: { comparisons: { data: { id: ID }, error: null } } })
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: ID }, body: VALID })
    expect(res.status).toBe(200)
    expect(supabase.queries[0].ops.slice(0, 2)).toEqual([
      ["update", { ...VALID, name: "Asia vs US" }],
      ["eq", "id", ID],
    ])
  })

  it("clears a year with null", async () => {
    const supabase = setupSupabase({ tables: { comparisons: { data: { id: ID }, error: null } } })
    await callRoute(PATCH, { method: "PATCH", params: { id: ID }, body: { year_to: null } })
    expect(supabase.queries[0].ops[0]).toEqual(["update", { year_to: null }])
  })

  it("returns 404 when no row matches", async () => {
    setupSupabase({ tables: { comparisons: { data: null, error: null } } })
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: ID }, body: { name: "x" } })
    expect(res).toMatchObject({ status: 404, body: { error: "Comparison not found" } })
  })

  it("rejects a non-UUID id", async () => {
    setupSupabase()
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: "42" }, body: { name: "x" } })
    expect(res).toMatchObject({ status: 400, body: { error: "id must be a UUID" } })
  })
})

describe("DELETE /api/comparisons/[id]", () => {
  it("deletes by id", async () => {
    const supabase = setupSupabase()
    const res = await callRoute(DELETE, { method: "DELETE", params: { id: ID } })
    expect(res).toMatchObject({ status: 204, body: null })
    expect(supabase.queries[0].ops).toEqual([["delete"], ["eq", "id", ID]])
  })

  it("rejects a non-UUID id", async () => {
    setupSupabase()
    const res = await callRoute(DELETE, { method: "DELETE", params: { id: "nope" } })
    expect(res).toMatchObject({ status: 400, body: { error: "id must be a UUID" } })
  })
})
