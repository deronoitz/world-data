import { check, json, readJson, withUser } from "@/lib/api/route"
import { ValidationError, asRecord, countryCodes, indicatorCode, optionalYear, text } from "@/lib/api/validate"

export const GET = withUser(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("comparisons")
    .select("*")
    .order("created_at", { ascending: false })
  check(error)
  return json(data)
})

export const POST = withUser(async ({ req, supabase }) => {
  const body = asRecord(await readJson(req))
  const yearFrom = optionalYear(body.year_from, "year_from")
  const yearTo = optionalYear(body.year_to, "year_to")
  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
    throw new ValidationError("year_from must not be after year_to")
  }

  const { data, error } = await supabase
    .from("comparisons")
    .insert({
      name: text(body.name, "name", 120),
      country_codes: countryCodes(body.country_codes),
      indicator_code: indicatorCode(body.indicator_code),
      year_from: yearFrom,
      year_to: yearTo,
    })
    .select()
    .single()
  check(error)
  return json(data, { status: 201 })
})
