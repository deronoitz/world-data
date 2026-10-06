"use client"

import { useEffect } from "react"

import { toSessionUser } from "@/lib/session-user"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { SessionUser } from "@/stores/user-data-store"

/**
 * Follows Supabase auth changes (sign in/out elsewhere, token refresh).
 * The initial user already came from the server, so the Supabase client
 * (~70 KiB) is only loaded once the browser is idle.
 */
export function useAuthSubscription(setUser: (user: SessionUser | null) => void) {
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    const start = async () => {
      const { createClient } = await import("@/lib/supabase/client")
      if (cancelled) return
      const {
        data: { subscription },
      } = createClient().auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          setUser(toSessionUser(session?.user ?? null))
        }
      })
      unsubscribe = () => subscription.unsubscribe()
    }

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1))
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout
    const handle = idle(() => void start())
    return () => {
      cancelled = true
      cancelIdle(handle)
      unsubscribe?.()
    }
  }, [setUser])
}
