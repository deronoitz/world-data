import { HttpError, json, readJson, withUser } from "@/lib/server/http/handler"
import {
  ValidationError,
  asRecord,
  countryCodes,
  indicatorCode,
  isUuid,
  optionalYear,
  text,
} from "@/lib/server/http/validate"
import { removeComparison, updateComparison } from "@/lib/server/repositories/comparisons"
import { COMPARISON_NAME_MAX, type ComparisonUpdate } from "@/lib/domain/library"

type Ctx = RouteContext<"/api/comparisons/[id]">

async function idFrom(ctx: Ctx) {
  const { id } = await ctx.params
  if (!isUuid(id)) throw new ValidationError("id must be a UUID")
  return id
}

export const PATCH = withUser<Ctx>(async ({ req, ctx, userId }) => {
  const id = await idFrom(ctx)
  const body = asRecord(await readJson(req))
  const update: ComparisonUpdate = {}
  if ("name" in body) update.name = text(body.name, "name", COMPARISON_NAME_MAX)
  if ("country_codes" in body) update.country_codes = countryCodes(body.country_codes)
  if ("indicator_code" in body) update.indicator_code = indicatorCode(body.indicator_code)
  if ("year_from" in body) update.year_from = optionalYear(body.year_from, "year_from")
  if ("year_to" in body) update.year_to = optionalYear(body.year_to, "year_to")
  if (Object.keys(update).length === 0) throw new ValidationError("Nothing to update")

  const row = await updateComparison(userId, id, update)
  if (!row) throw new HttpError(404, "Comparison not found")
  return json(row)
})

export const DELETE = withUser<Ctx>(async ({ ctx, userId }) => {
  await removeComparison(userId, await idFrom(ctx))
  return new Response(null, { status: 204 })
})
