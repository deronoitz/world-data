import "server-only"

import { connection } from "next/server"
import { cache } from "react"

import { auth } from "@/auth"
import { userExists } from "@/lib/server/repositories/users"
import { toSessionUser } from "@/lib/server/auth/session-user"
import type { SessionUser } from "@/lib/domain/user"

import { isAuthConfigured } from "./env"

/**
 * The user from the session cookie, without a database query: what the layout
 * and page decorations use. The JWT can outlive its users row (e.g. the database
 * was reset); reads for such a user just return nothing, and the first write
 * answers 401 "Session expired" (see errorResponse in server/http/handler.ts).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Always request-bound, so pages are never prerendered as signed out because
  // the auth env vars were missing at build time (e.g. in the Docker build).
  await connection()
  if (!isAuthConfigured) return null
  return toSessionUser((await auth())?.user)
}

/**
 * The session user, also checked against the database (null when the row is
 * gone). For pages that route on sign-in state (/login, /library), so a stale
 * session can't bounce between them.
 */
export async function getUser(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  return user && (await hasAccount(user.id)) ? user : null
}

// Once per request; a database error keeps the session rather than signing
// everyone out.
const hasAccount = cache(async (id: string) => {
  try {
    return await userExists(id)
  } catch (error) {
    console.error(error)
    return true
  }
})
