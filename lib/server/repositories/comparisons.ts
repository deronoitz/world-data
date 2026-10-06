import "server-only"

import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/server/db/client"
import { comparisons as t } from "@/lib/server/db/schema"
import type { ComparisonUpdate } from "@/lib/domain/library"

type NewComparison = Required<ComparisonUpdate>

export function listComparisons(userId: string) {
  return db.select().from(t).where(eq(t.user_id, userId)).orderBy(desc(t.created_at))
}

export async function createComparison(userId: string, values: NewComparison) {
  const [row] = await db
    .insert(t)
    .values({ ...values, user_id: userId })
    .returning()
  return row
}

/** Null when the comparison doesn't exist or belongs to someone else. */
export async function updateComparison(userId: string, id: string, patch: ComparisonUpdate) {
  const [row] = await db
    .update(t)
    .set(patch)
    .where(and(eq(t.id, id), eq(t.user_id, userId)))
    .returning()
  return row ?? null
}

export async function removeComparison(userId: string, id: string) {
  await db.delete(t).where(and(eq(t.id, id), eq(t.user_id, userId)))
}
