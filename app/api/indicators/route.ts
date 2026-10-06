import { HttpError, json, readJson, withUser } from "@/lib/api/route"
import { ValidationError, asRecord, indicatorCode } from "@/lib/api/validate"
import {
  addSavedIndicator,
  listSavedIndicators,
  reorderSavedIndicators,
} from "@/lib/data/indicators"

export const GET = withUser(async ({ userId }) => json(await listSavedIndicators(userId)))

export const POST = withUser(async ({ req, userId }) => {
  const body = asRecord(await readJson(req))
  const row = await addSavedIndicator(userId, indicatorCode(body.indicator_code))
  return json(row, { status: 201 })
})

/** Reorder: body is { order: string[] } with every saved indicator code. */
export const PUT = withUser(async ({ req, userId }) => {
  const body = asRecord(await readJson(req))
  if (!Array.isArray(body.order)) throw new ValidationError("order must be an array")
  const order = body.order.map((code) => indicatorCode(code, "order"))
  if (new Set(order).size !== order.length) throw new ValidationError("order has duplicates")
  const rows = await reorderSavedIndicators(userId, order)
  if (!rows) throw new HttpError(409, "order must list exactly the saved indicators")
  return json(rows)
})
