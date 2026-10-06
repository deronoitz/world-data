// @vitest-environment node

import { callRoute } from "@/test-kit/route"
import { setupSupabase } from "@/test-kit/supabase"

import { GET, POST } from "../route"
import { DELETE, PATCH } from "../[id]/route"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
const NOTE = { id: ID, country_code: "IDN", body: "Visit Bali", user_id: "u", created_at: "", updated_at: "" }

describe("/api/notes", () => {
  it("lists every note newest first without ?country", async () => {
    const supabase = setupSupabase({ tables: { country_notes: { data: [NOTE], error: null } } })
    const res = await callRoute(GET, { path: "/api/notes" })
    expect(res).toMatchObject({ status: 200, body: [NOTE] })
    expect(supabase.queries[0].ops).toEqual([
      ["select", "*"],
      ["order", "created_at", { ascending: false }],
    ])
  })

  it("filters by ?country", async () => {
    const supabase = setupSupabase({ tables: { country_notes: { data: [NOTE], error: null } } })
    const res = await callRoute(GET, { path: "/api/notes?country=IDN" })
    expect(res).toMatchObject({ status: 200, body: [NOTE] })
    expect(supabase.queries[0].ops).toContainEqual(["eq", "country_code", "IDN"])
  })

  it("rejects an invalid ?country", async () => {
    setupSupabase()
    const res = await callRoute(GET, { path: "/api/notes?country=bad" })
    expect(res).toMatchObject({ status: 400, body: { error: "country must be an ISO3 country code" } })
  })

  it("creates a note with a trimmed body", async () => {
    const supabase = setupSupabase({ tables: { country_notes: { data: NOTE, error: null } } })
    const res = await callRoute(POST, { method: "POST", body: { country_code: "IDN", body: "  Visit Bali  " } })
    expect(res).toMatchObject({ status: 201, body: NOTE })
    expect(supabase.queries[0].ops[0]).toEqual(["insert", { country_code: "IDN", body: "Visit Bali" }])
  })

  it("rejects bodies over 5000 characters", async () => {
    setupSupabase()
    const res = await callRoute(POST, { method: "POST", body: { country_code: "IDN", body: "x".repeat(5001) } })
    expect(res).toMatchObject({ status: 400, body: { error: "body must be 1–5000 characters" } })
  })
})

describe("/api/notes/[id]", () => {
  it("rejects a non-UUID id", async () => {
    setupSupabase()
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: "42" }, body: { body: "x" } })
    expect(res).toMatchObject({ status: 400, body: { error: "id must be a UUID" } })
  })

  it("updates a note", async () => {
    const supabase = setupSupabase({ tables: { country_notes: { data: { ...NOTE, body: "New" }, error: null } } })
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: ID }, body: { body: "New" } })
    expect(res).toMatchObject({ status: 200, body: { body: "New" } })
    expect(supabase.queries[0].ops.slice(0, 2)).toEqual([
      ["update", { body: "New" }],
      ["eq", "id", ID],
    ])
  })

  it("returns 404 when no row matches (e.g. another user's note under RLS)", async () => {
    setupSupabase({ tables: { country_notes: { data: null, error: null } } })
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: ID }, body: { body: "New" } })
    expect(res).toMatchObject({ status: 404, body: { error: "Note not found" } })
  })

  it("deletes a note", async () => {
    setupSupabase()
    const res = await callRoute(DELETE, { method: "DELETE", params: { id: ID } })
    expect(res).toMatchObject({ status: 204, body: null })
  })
})
