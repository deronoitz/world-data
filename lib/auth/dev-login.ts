import type { Db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export const DEV_USER = { email: "dev@localhost", name: "Dev User" }

/**
 * Returns the local demo user, creating it on first sign-in. The Credentials
 * provider bypasses the Auth.js adapter, so the users row is written here; its
 * id becomes token.sub, like a Google sign-in.
 */
export async function upsertDevUser(db: Db) {
  const [user] = await db
    .insert(users)
    .values(DEV_USER)
    .onConflictDoUpdate({ target: users.email, set: { name: DEV_USER.name } })
    .returning({ id: users.id, email: users.email, name: users.name, image: users.image })
  return user
}
