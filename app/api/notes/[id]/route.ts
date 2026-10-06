import { HttpError, check, json, readJson, withUser } from "@/lib/api/route"
import { ValidationError, asRecord, isUuid, text } from "@/lib/api/validate"

type Ctx = RouteContext<"/api/notes/[id]">

async function idFrom(ctx: Ctx) {
  const { id } = await ctx.params
  if (!isUuid(id)) throw new ValidationError("id must be a UUID")
  return id
}

export const PATCH = withUser<Ctx>(async ({ req, ctx, supabase }) => {
  const id = await idFrom(ctx)
  const body = asRecord(await readJson(req))
  const { data, error } = await supabase
    .from("country_notes")
    .update({ body: text(body.body, "body", 5000) })
    .eq("id", id)
    .select()
    .maybeSingle()
  check(error)
  if (!data) throw new HttpError(404, "Note not found")
  return json(data)
})

export const DELETE = withUser<Ctx>(async ({ ctx, supabase }) => {
  const id = await idFrom(ctx)
  const { error } = await supabase.from("country_notes").delete().eq("id", id)
  check(error)
  return new Response(null, { status: 204 })
})
