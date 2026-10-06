import { json, readJson, withUser } from "@/lib/api/route"
import { asRecord, countryCode, text } from "@/lib/api/validate"
import { createNote, listNotes } from "@/lib/data/notes"

/** GET /api/notes            → all notes
 *  GET /api/notes?country=IDN → notes for one country */
export const GET = withUser(async ({ req, userId }) => {
  const country = new URL(req.url).searchParams.get("country")
  return json(await listNotes(userId, country ? countryCode(country, "country") : undefined))
})

export const POST = withUser(async ({ req, userId }) => {
  const body = asRecord(await readJson(req))
  const row = await createNote(userId, countryCode(body.country_code), text(body.body, "body", 5000))
  return json(row, { status: 201 })
})
