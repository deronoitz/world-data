import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env"
import type { Database } from "./types"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  })
}

/** The verified current user, or null when signed out / not configured. */
export async function getUser() {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
