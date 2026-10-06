import "server-only"

import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { countryNotes as t } from "@/lib/db/schema"

export function listNotes(userId: string, countryCode?: string) {
  const owner = eq(t.user_id, userId)
  return db
    .select()
    .from(t)
    .where(countryCode ? and(owner, eq(t.country_code, countryCode)) : owner)
    .orderBy(desc(t.created_at))
}

export async function createNote(userId: string, countryCode: string, body: string) {
  const [row] = await db
    .insert(t)
    .values({ user_id: userId, country_code: countryCode, body })
    .returning()
  return row
}

/** Null when the note doesn't exist or belongs to someone else. */
export async function updateNote(userId: string, id: string, body: string) {
  const [row] = await db
    .update(t)
    .set({ body })
    .where(and(eq(t.id, id), eq(t.user_id, userId)))
    .returning()
  return row ?? null
}

export async function removeNote(userId: string, id: string) {
  await db.delete(t).where(and(eq(t.id, id), eq(t.user_id, userId)))
}
