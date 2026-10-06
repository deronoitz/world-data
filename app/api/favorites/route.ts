import { json, readJson, withUser } from "@/lib/api/route"
import { asRecord, countryCode } from "@/lib/api/validate"
import { addFavorite, listFavorites } from "@/lib/data/favorites"

export const GET = withUser(async ({ userId }) => json(await listFavorites(userId)))

export const POST = withUser(async ({ req, userId }) => {
  const body = asRecord(await readJson(req))
  const code = countryCode(body.country_code)
  // Idempotent: favoriting twice is not an error.
  const row = await addFavorite(userId, code)
  return json(row ?? { country_code: code }, { status: 201 })
})
