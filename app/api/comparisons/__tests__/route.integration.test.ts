// @vitest-environment node

import { comparisons } from "@/lib/db/schema"
import { OTHER_USER, TEST_USER } from "@/test-kit/auth"
import { db } from "@/test-kit/db"
import { callRoute } from "@/test-kit/route"

import { GET, POST } from "../route"
import { DELETE, PATCH } from "../[id]/route"

const MISSING = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
const VALID = {
  name: " Asia vs US ",
  country_codes: ["IDN", "USA"],
  indicator_code: "SP.POP.TOTL",
  year_from: 2000,
  year_to: 2020,
}
const SAVED = { ...VALID, name: "Asia vs US" }

async function seed(userId = TEST_USER.id, values: Partial<typeof comparisons.$inferInsert> = {}) {
  const [row] = await db
    .insert(comparisons)
    .values({ ...SAVED, user_id: userId, ...values })
    .returning()
  return row
}

describe("GET /api/comparisons", () => {
  it("lists the user's comparisons newest first", async () => {
    const older = await seed(TEST_USER.id, { name: "Older", created_at: new Date("2026-01-01") })
    const newer = await seed(TEST_USER.id, { name: "Newer", created_at: new Date("2026-02-01") })
    await seed(OTHER_USER.id)

    const res = await callRoute(GET)

    expect(res.status).toBe(200)
    expect((res.body as unknown as { id: string }[]).map((r) => r.id)).toEqual([newer.id, older.id])
  })
})

describe("POST /api/comparisons", () => {
  it("inserts a normalized comparison owned by the user", async () => {
    const res = await callRoute(POST, { method: "POST", body: VALID })
    expect(res).toMatchObject({ status: 201, body: { ...SAVED, user_id: TEST_USER.id } })
    expect(await db.select().from(comparisons)).toHaveLength(1)
  })

  it.each([
    ["one country", { country_codes: ["IDN"] }, "country_codes must contain 2–6 distinct countries"],
    ["an unknown indicator", { indicator_code: "X" }, "indicator_code is not a supported indicator"],
    ["a reversed year range", { year_from: 2020, year_to: 2000 }, "year_from must not be after year_to"],
    ["a missing name", { name: "" }, "name must be 1–120 characters"],
  ])("returns 400 for %s", async (_, patch, error) => {
    const res = await callRoute(POST, { method: "POST", body: { ...VALID, ...patch } })
    expect(res).toMatchObject({ status: 400, body: { error } })
  })
})

describe("PATCH /api/comparisons/[id]", () => {
  it("only updates the fields sent and bumps updated_at", async () => {
    const row = await seed(TEST_USER.id, { updated_at: new Date("2026-01-01") })
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: row.id }, body: { name: "Renamed" } })
    expect(res).toMatchObject({ status: 200, body: { ...SAVED, id: row.id, name: "Renamed" } })
    expect(new Date(res.body!.updated_at as string).getTime()).toBeGreaterThan(row.updated_at.getTime())
  })

  it("validates and updates every editable field", async () => {
    const row = await seed(TEST_USER.id, { name: "x", country_codes: ["FRA", "DEU"], year_from: null, year_to: null })
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: row.id }, body: VALID })
    expect(res).toMatchObject({ status: 200, body: SAVED })
  })

  it("clears a year with null", async () => {
    const row = await seed()
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: row.id }, body: { year_to: null } })
    expect(res).toMatchObject({ status: 200, body: { year_from: 2000, year_to: null } })
  })

  it("maps a database check violation to 400", async () => {
    const row = await seed()
    // Each year is valid on its own, but the stored range would be reversed.
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: row.id }, body: { year_from: 2030 } })
    expect(res).toMatchObject({ status: 400, body: { error: "Invalid value" } })
  })

  it("rejects an empty update", async () => {
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: MISSING }, body: {} })
    expect(res).toMatchObject({ status: 400, body: { error: "Nothing to update" } })
  })

  it("returns 404 when no row matches", async () => {
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: MISSING }, body: { name: "x" } })
    expect(res).toMatchObject({ status: 404, body: { error: "Comparison not found" } })
  })

  it("returns 404 for another user's comparison and leaves it unchanged", async () => {
    const theirs = await seed(OTHER_USER.id)
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: theirs.id }, body: { name: "Mine now" } })
    expect(res.status).toBe(404)
    expect((await db.select().from(comparisons))[0].name).toBe(SAVED.name)
  })

  it("rejects a non-UUID id", async () => {
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: "42" }, body: { name: "x" } })
    expect(res).toMatchObject({ status: 400, body: { error: "id must be a UUID" } })
  })
})

describe("DELETE /api/comparisons/[id]", () => {
  it("deletes the user's comparison", async () => {
    const row = await seed()
    const res = await callRoute(DELETE, { method: "DELETE", params: { id: row.id } })
    expect(res).toMatchObject({ status: 204, body: null })
    expect(await db.select().from(comparisons)).toEqual([])
  })

  it("does not delete another user's comparison", async () => {
    const theirs = await seed(OTHER_USER.id)
    const res = await callRoute(DELETE, { method: "DELETE", params: { id: theirs.id } })
    expect(res.status).toBe(204)
    expect(await db.select().from(comparisons)).toHaveLength(1)
  })

  it("rejects a non-UUID id", async () => {
    const res = await callRoute(DELETE, { method: "DELETE", params: { id: "nope" } })
    expect(res).toMatchObject({ status: 400, body: { error: "id must be a UUID" } })
  })
})
