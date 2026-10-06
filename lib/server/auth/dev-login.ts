import "server-only"

import { upsertUserByEmail } from "@/lib/server/repositories/users"

export const DEV_USER = { email: "dev@localhost", name: "Dev User" }

/**
 * Returns the local demo user, creating it on first sign-in. The Credentials
 * provider bypasses the Auth.js adapter, so the users row is written here; its
 * id becomes token.sub, like a Google sign-in.
 */
export function upsertDevUser() {
  return upsertUserByEmail(DEV_USER)
}
