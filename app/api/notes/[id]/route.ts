import { HttpError, json, readJson, withUser } from "@/lib/server/http/handler"
import { ValidationError, asRecord, isUuid, text } from "@/lib/server/http/validate"
import { removeNote, updateNote } from "@/lib/server/repositories/notes"
import { NOTE_BODY_MAX } from "@/lib/domain/library"

type Ctx = RouteContext<"/api/notes/[id]">

async function idFrom(ctx: Ctx) {
  const { id } = await ctx.params
  if (!isUuid(id)) throw new ValidationError("id must be a UUID")
  return id
}

export const PATCH = withUser<Ctx>(async ({ req, ctx, userId }) => {
  const id = await idFrom(ctx)
  const body = asRecord(await readJson(req))
  const row = await updateNote(userId, id, text(body.body, "body", NOTE_BODY_MAX))
  if (!row) throw new HttpError(404, "Note not found")
  return json(row)
})

export const DELETE = withUser<Ctx>(async ({ ctx, userId }) => {
  await removeNote(userId, await idFrom(ctx))
  return new Response(null, { status: 204 })
})
