import { check, json, readJson, withUser } from "@/lib/api/route"
import { ValidationError, asRecord, indicatorCode } from "@/lib/api/validate"

export const GET = withUser(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("saved_indicators")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
  check(error)
  return json(data)
})

export const POST = withUser(async ({ req, supabase }) => {
  const body = asRecord(await readJson(req))
  const code = indicatorCode(body.indicator_code)

  const { data: last, error: lastError } = await supabase
    .from("saved_indicators")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()
  check(lastError)

  const { data, error } = await supabase
    .from("saved_indicators")
    .insert({ indicator_code: code, position: (last?.position ?? -1) + 1 })
    .select()
    .single()
  check(error)
  return json(data, { status: 201 })
})

/** Reorder: body is { order: string[] } with every saved indicator code. */
export const PUT = withUser(async ({ req, supabase, user }) => {
  const body = asRecord(await readJson(req))
  if (!Array.isArray(body.order)) throw new ValidationError("order must be an array")
  const order = body.order.map((code) => indicatorCode(code, "order"))
  if (new Set(order).size !== order.length) throw new ValidationError("order has duplicates")

  const { data, error } = await supabase
    .from("saved_indicators")
    .upsert(
      order.map((code, position) => ({ user_id: user.id, indicator_code: code, position })),
      { onConflict: "user_id,indicator_code" }
    )
    .select()
    .order("position", { ascending: true })
  check(error)
  return json(data)
})
