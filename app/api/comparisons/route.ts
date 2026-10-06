import { json, readJson, withUser } from "@/lib/api/route"
import { ValidationError, asRecord, countryCodes, indicatorCode, optionalYear, text } from "@/lib/api/validate"
import { createComparison, listComparisons } from "@/lib/data/comparisons"

export const GET = withUser(async ({ userId }) => json(await listComparisons(userId)))

export const POST = withUser(async ({ req, userId }) => {
  const body = asRecord(await readJson(req))
  const yearFrom = optionalYear(body.year_from, "year_from")
  const yearTo = optionalYear(body.year_to, "year_to")
  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
    throw new ValidationError("year_from must not be after year_to")
  }

  const row = await createComparison(userId, {
    name: text(body.name, "name", 120),
    country_codes: countryCodes(body.country_codes),
    indicator_code: indicatorCode(body.indicator_code),
    year_from: yearFrom,
    year_to: yearTo,
  })
  return json(row, { status: 201 })
})
