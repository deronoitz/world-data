// @vitest-environment node

import { countryNotes } from "@/lib/server/db/schema"
import { OTHER_USER, TEST_USER } from "@/test-kit/auth"
import { db } from "@/test-kit/db"
import { callRoute } from "@/test-kit/route"

import { GET, POST } from "../route"
import { DELETE, PATCH } from "../[id]/route"

const MISSING = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"

async function seed(userId: string, country_code: string, body: string, created_at = new Date()) {
  const [row] = await db.insert(countryNotes).values({ user_id: userId, country_code, body, created_at }).returning()
  return row
}

const bodies = (res: { body: unknown }) => (res.body as { body: string }[]).map((n) => n.body)

describe("/api/notes", () => {
  it("lists the user's notes newest first without ?country", async () => {
    await seed(TEST_USER.id, "IDN", "Old", new Date("2026-01-01"))
    await seed(TEST_USER.id, "USA", "New", new Date("2026-02-01"))
    await seed(OTHER_USER.id, "IDN", "Not mine")
    const res = await callRoute(GET, { path: "/api/notes" })
    expect(res.status).toBe(200)
    expect(bodies(res)).toEqual(["New", "Old"])
  })

  it("filters by ?country", async () => {
    await seed(TEST_USER.id, "IDN", "Visit Bali")
    await seed(TEST_USER.id, "USA", "Visit NYC")
    await seed(OTHER_USER.id, "IDN", "Not mine")
    const res = await callRoute(GET, { path: "/api/notes?country=IDN" })
    expect(bodies(res)).toEqual(["Visit Bali"])
  })

  it("rejects an invalid ?country", async () => {
    const res = await callRoute(GET, { path: "/api/notes?country=bad" })
    expect(res).toMatchObject({ status: 400, body: { error: "country must be an ISO3 country code" } })
  })

  it("creates a note with a trimmed body", async () => {
    const res = await callRoute(POST, { method: "POST", body: { country_code: "IDN", body: "  Visit Bali  " } })
    expect(res).toMatchObject({
      status: 201,
      body: { user_id: TEST_USER.id, country_code: "IDN", body: "Visit Bali" },
    })
  })

  it("rejects bodies over 5000 characters", async () => {
    const res = await callRoute(POST, { method: "POST", body: { country_code: "IDN", body: "x".repeat(5001) } })
    expect(res).toMatchObject({ status: 400, body: { error: "body must be 1–5000 characters" } })
  })
})

describe("/api/notes/[id]", () => {
  it("rejects a non-UUID id", async () => {
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: "42" }, body: { body: "x" } })
    expect(res).toMatchObject({ status: 400, body: { error: "id must be a UUID" } })
  })

  it("updates a note", async () => {
    const note = await seed(TEST_USER.id, "IDN", "Old")
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: note.id }, body: { body: "New" } })
    expect(res).toMatchObject({ status: 200, body: { id: note.id, body: "New" } })
  })

  it("returns 404 when no row matches", async () => {
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: MISSING }, body: { body: "New" } })
    expect(res).toMatchObject({ status: 404, body: { error: "Note not found" } })
  })

  it("returns 404 for another user's note and leaves it unchanged", async () => {
    const theirs = await seed(OTHER_USER.id, "IDN", "Theirs")
    const res = await callRoute(PATCH, { method: "PATCH", params: { id: theirs.id }, body: { body: "Mine" } })
    expect(res.status).toBe(404)
    expect((await db.select().from(countryNotes))[0].body).toBe("Theirs")
  })

  it("deletes the user's note but not another user's", async () => {
    const mine = await seed(TEST_USER.id, "IDN", "Mine")
    const theirs = await seed(OTHER_USER.id, "IDN", "Theirs")
    expect((await callRoute(DELETE, { method: "DELETE", params: { id: mine.id } })).status).toBe(204)
    expect((await callRoute(DELETE, { method: "DELETE", params: { id: theirs.id } })).status).toBe(204)
    expect((await db.select().from(countryNotes)).map((n) => n.body)).toEqual(["Theirs"])
  })
})
