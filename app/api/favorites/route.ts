import { check, json, readJson, withUser } from "@/lib/api/route"
import { asRecord, countryCode } from "@/lib/api/validate"

export const GET = withUser(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("favorite_countries")
    .select("*")
    .order("created_at", { ascending: false })
  check(error)
  return json(data)
})

export const POST = withUser(async ({ req, supabase }) => {
  const body = asRecord(await readJson(req))
  const code = countryCode(body.country_code)
  // Idempotent: favoriting twice is not an error.
  const { data, error } = await supabase
    .from("favorite_countries")
    .upsert({ country_code: code }, { onConflict: "user_id,country_code", ignoreDuplicates: true })
    .select()
    .maybeSingle()
  check(error)
  return json(data ?? { country_code: code }, { status: 201 })
})
