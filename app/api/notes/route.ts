import { json, readJson, withUser } from "@/lib/server/http/handler"
import { asRecord, countryCode, text } from "@/lib/server/http/validate"
import { createNote, listNotes } from "@/lib/server/repositories/notes"
import { NOTE_BODY_MAX } from "@/lib/domain/library"

/** GET /api/notes            → all notes
 *  GET /api/notes?country=IDN → notes for one country */
export const GET = withUser(async ({ req, userId }) => {
  const country = new URL(req.url).searchParams.get("country")
  return json(await listNotes(userId, country ? countryCode(country, "country") : undefined))
})

export const POST = withUser(async ({ req, userId }) => {
  const body = asRecord(await readJson(req))
  const row = await createNote(userId, countryCode(body.country_code), text(body.body, "body", NOTE_BODY_MAX))
  return json(row, { status: 201 })
})
