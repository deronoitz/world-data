import "server-only"

import { getUser } from "@/lib/auth/session"
import { listFavoriteCodes } from "@/lib/data/favorites"
import { listSavedIndicatorCodes } from "@/lib/data/indicators"

// These decorate public pages, so a database error degrades to "nothing saved"
// rather than failing the page.
async function orEmpty<T>(query: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await query()
  } catch (error) {
    console.error(error)
    return empty
  }
}

/** Favorite country codes for the signed-in user (empty when signed out). */
export async function getFavoriteCodes(): Promise<Set<string>> {
  const user = await getUser()
  if (!user) return new Set()
  return orEmpty(async () => new Set(await listFavoriteCodes(user.id)), new Set<string>())
}

/** Pinned indicator codes in the user's chosen order (empty when signed out). */
export async function getSavedIndicatorCodes(): Promise<string[]> {
  const user = await getUser()
  if (!user) return []
  return orEmpty(() => listSavedIndicatorCodes(user.id), [])
}
