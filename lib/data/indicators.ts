import "server-only"

import { and, asc, desc, eq, sql } from "drizzle-orm"

import { db, type Tx } from "@/lib/db"
import { savedIndicators as t } from "@/lib/db/schema"

export function listSavedIndicators(userId: string) {
  return db.select().from(t).where(eq(t.user_id, userId)).orderBy(asc(t.position), asc(t.created_at))
}

export async function listSavedIndicatorCodes(userId: string) {
  const rows = await db
    .select({ code: t.indicator_code })
    .from(t)
    .where(eq(t.user_id, userId))
    .orderBy(asc(t.position), asc(t.created_at))
  return rows.map((row) => row.code)
}

/**
 * Appends an indicator after the user's last one. Throws 23505 when already saved.
 * A per-user lock keeps concurrent pins from reading the same last position.
 */
export function addSavedIndicator(userId: string, indicatorCode: string) {
  return db.transaction(async (tx) => {
    await lockUser(tx, userId)
    const [last] = await tx
      .select({ position: t.position })
      .from(t)
      .where(eq(t.user_id, userId))
      .orderBy(desc(t.position))
      .limit(1)
    const [row] = await tx
      .insert(t)
      .values({ user_id: userId, indicator_code: indicatorCode, position: (last?.position ?? -1) + 1 })
      .returning()
    return row
  })
}

/**
 * Sets each code's position to its index in `order`, then returns the saved list.
 * `order` must hold exactly the user's saved codes; otherwise nothing changes and
 * it returns null (e.g. another tab pinned or unpinned one meanwhile).
 */
export function reorderSavedIndicators(userId: string, order: string[]) {
  return db.transaction(async (tx) => {
    await lockUser(tx, userId)
    const saved = await tx.select({ code: t.indicator_code }).from(t).where(eq(t.user_id, userId))
    const wanted = new Set(order)
    if (saved.length !== wanted.size || saved.some(({ code }) => !wanted.has(code))) return null

    if (order.length > 0) {
      const positions = sql.join(
        order.map((code, position) => sql`(${code}, ${position}::integer)`),
        sql`, `
      )
      await tx.execute(sql`
        update ${t} set position = o.position
        from (values ${positions}) as o(code, position)
        where ${t.user_id} = ${userId} and ${t.indicator_code} = o.code
      `)
    }
    return tx.select().from(t).where(eq(t.user_id, userId)).orderBy(asc(t.position), asc(t.created_at))
  })
}

/** Serializes this user's position writes until the transaction ends. */
async function lockUser(tx: Tx, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`)
}

export async function removeSavedIndicator(userId: string, indicatorCode: string) {
  await db.delete(t).where(and(eq(t.user_id, userId), eq(t.indicator_code, indicatorCode)))
}
