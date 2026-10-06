import "server-only"

import { eq } from "drizzle-orm"

import { db } from "@/lib/server/db/client"
import { users } from "@/lib/server/db/schema"

export async function userExists(id: string) {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)
  return rows.length > 0
}

/** Creates the user with this email, or updates its name; returns the row. */
export async function upsertUserByEmail(values: { email: string; name: string }) {
  const [user] = await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.email, set: { name: values.name } })
    .returning({ id: users.id, email: users.email, name: users.name, image: users.image })
  return user
}
