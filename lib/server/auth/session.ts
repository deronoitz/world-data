import "server-only"

import { connection } from "next/server"
import { cache } from "react"

import { auth } from "@/auth"
import { userExists } from "@/lib/server/repositories/users"
import { toSessionUser } from "@/lib/server/auth/session-user"
import type { SessionUser } from "@/lib/domain/user"

import { isAuthConfigured } from "./env"

/** The signed-in user, or null when signed out / auth is not configured. */
export async function getUser(): Promise<SessionUser | null> {
  // Always request-bound, so pages are never prerendered as signed out because
  // the auth env vars were missing at build time (e.g. in the Docker build).
  await connection()
  if (!isAuthConfigured) return null
  const user = toSessionUser((await auth())?.user)
  return user && (await hasAccount(user.id)) ? user : null
}

// The JWT can outlive its users row (e.g. the database was reset). Treat that
// as signed out, so the user can sign in again. Once per request; a database
// error keeps the session rather than signing everyone out.
const hasAccount = cache(async (id: string) => {
  try {
    return await userExists(id)
  } catch (error) {
    console.error(error)
    return true
  }
})
