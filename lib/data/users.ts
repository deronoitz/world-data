import "server-only"

import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export async function userExists(id: string) {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)
  return rows.length > 0
}
