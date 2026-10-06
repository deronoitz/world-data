import { check, json, readJson, withUser } from "@/lib/api/route"
import { asRecord, countryCode, text } from "@/lib/api/validate"

/** GET /api/notes            → all notes
 *  GET /api/notes?country=IDN → notes for one country */
export const GET = withUser(async ({ req, supabase }) => {
  const country = new URL(req.url).searchParams.get("country")
  let query = supabase.from("country_notes").select("*").order("created_at", { ascending: false })
  if (country) query = query.eq("country_code", countryCode(country, "country"))
  const { data, error } = await query
  check(error)
  return json(data)
})

export const POST = withUser(async ({ req, supabase }) => {
  const body = asRecord(await readJson(req))
  const { data, error } = await supabase
    .from("country_notes")
    .insert({
      country_code: countryCode(body.country_code),
      body: text(body.body, "body", 5000),
    })
    .select()
    .single()
  check(error)
  return json(data, { status: 201 })
})
