import { HttpError, check, json, readJson, withUser } from "@/lib/api/route"
import {
  ValidationError,
  asRecord,
  countryCodes,
  indicatorCode,
  isUuid,
  optionalYear,
  text,
} from "@/lib/api/validate"
import type { Database } from "@/lib/supabase/types"

type Ctx = RouteContext<"/api/comparisons/[id]">

async function idFrom(ctx: Ctx) {
  const { id } = await ctx.params
  if (!isUuid(id)) throw new ValidationError("id must be a UUID")
  return id
}

export const PATCH = withUser<Ctx>(async ({ req, ctx, supabase }) => {
  const id = await idFrom(ctx)
  const body = asRecord(await readJson(req))
  const update: Database["public"]["Tables"]["comparisons"]["Update"] = {}
  if ("name" in body) update.name = text(body.name, "name", 120)
  if ("country_codes" in body) update.country_codes = countryCodes(body.country_codes)
  if ("indicator_code" in body) update.indicator_code = indicatorCode(body.indicator_code)
  if ("year_from" in body) update.year_from = optionalYear(body.year_from, "year_from")
  if ("year_to" in body) update.year_to = optionalYear(body.year_to, "year_to")
  if (Object.keys(update).length === 0) throw new ValidationError("Nothing to update")

  const { data, error } = await supabase
    .from("comparisons")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle()
  check(error)
  if (!data) throw new HttpError(404, "Comparison not found")
  return json(data)
})

export const DELETE = withUser<Ctx>(async ({ ctx, supabase }) => {
  const id = await idFrom(ctx)
  const { error } = await supabase.from("comparisons").delete().eq("id", id)
  check(error)
  return new Response(null, { status: 204 })
})
