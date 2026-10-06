import { DrizzleAdapter } from "@auth/drizzle-adapter"
import type { Adapter } from "next-auth/adapters"

import type { Db } from "@/lib/db"
import { accounts, users } from "@/lib/db/schema"

/**
 * Auth.js storage for users and their linked Google accounts. OAuth tokens
 * (access, refresh and id tokens) are dropped before saving: the app only needs
 * to know which user a Google account belongs to.
 */
export function createAdapter(db: Db): Adapter {
  const adapter = DrizzleAdapter(db, {
    usersTable: users,
    // Narrower than the adapter's default table (no token columns). The adapter
    // only reads userId, provider and providerAccountId from it.
    accountsTable: accounts as never,
  })

  return {
    ...adapter,
    linkAccount: ({ userId, type, provider, providerAccountId }) =>
      adapter.linkAccount!({ userId, type, provider, providerAccountId }),
  }
}
