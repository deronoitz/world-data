import "server-only"

import { cache } from "react"

import { getSessionUser } from "@/lib/server/auth/session"
import { listFavoriteCodes } from "@/lib/server/repositories/favorites"
import { listSavedIndicatorCodes } from "@/lib/server/repositories/saved-indicators"

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

/**
 * The signed-in user's favorite codes, read once per request. Null when signed
 * out, or when the query failed (the browser then fetches them itself).
 */
export const getUserFavorites = cache(async (): Promise<{ userId: string; codes: string[] } | null> => {
  const user = await getSessionUser()
  if (!user) return null
  return orEmpty(async () => ({ userId: user.id, codes: await listFavoriteCodes(user.id) }), null)
})

/** Favorite country codes for the signed-in user (empty when signed out). */
export async function getFavoriteCodes(): Promise<Set<string>> {
  return new Set((await getUserFavorites())?.codes)
}

/** Pinned indicator codes in the user's chosen order (empty when signed out). */
export async function getSavedIndicatorCodes(): Promise<string[]> {
  const user = await getSessionUser()
  if (!user) return []
  return orEmpty(() => listSavedIndicatorCodes(user.id), [])
}
