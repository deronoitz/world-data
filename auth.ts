import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

import { createAdapter } from "@/lib/server/auth/adapter"
import { upsertDevUser } from "@/lib/server/auth/dev-login"
import { isDevLoginEnabled } from "@/lib/server/auth/env"
import { db } from "@/lib/server/db/client"

// Google sign-in, with users and linked accounts (no OAuth tokens) stored in
// Postgres. Sessions are stateless JWT cookies. Reads AUTH_SECRET, AUTH_GOOGLE_ID
// and AUTH_GOOGLE_SECRET. Local development can also sign in as a demo user
// (see isDevLoginEnabled); that provider doesn't exist in production.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createAdapter(db),
  providers: [
    Google,
    ...(isDevLoginEnabled
      ? [Credentials({ id: "dev", name: "Dev login", credentials: {}, authorize: () => upsertDevUser() })]
      : []),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/auth/error" },
  callbacks: {
    // token.sub is the users.id set at sign-in; expose it to the app.
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
})
