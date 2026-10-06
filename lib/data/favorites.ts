import "server-only"

import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { favoriteCountries as t } from "@/lib/db/schema"

export function listFavorites(userId: string) {
  return db.select().from(t).where(eq(t.user_id, userId)).orderBy(desc(t.created_at))
}

export async function listFavoriteCodes(userId: string) {
  const rows = await db.select({ code: t.country_code }).from(t).where(eq(t.user_id, userId))
  return rows.map((row) => row.code)
}

/** Idempotent: returns the new row, or null when it was already a favorite. */
export async function addFavorite(userId: string, countryCode: string) {
  const [row] = await db
    .insert(t)
    .values({ user_id: userId, country_code: countryCode })
    .onConflictDoNothing()
    .returning()
  return row ?? null
}

export async function removeFavorite(userId: string, countryCode: string) {
  await db.delete(t).where(and(eq(t.user_id, userId), eq(t.country_code, countryCode)))
}
