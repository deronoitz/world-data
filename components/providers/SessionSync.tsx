"use client"

import { use, useEffect } from "react"

import { useCompare } from "@/stores/compare-store"
import { useUserData, type SessionUser } from "@/stores/user-data-store"

import { useAuthSubscription } from "./hooks/useAuthSubscription"

/**
 * Seeds the user store from the server-verified user (streamed in as a promise
 * under Suspense) and keeps it in sync with Supabase auth events.
 */
export function SessionSync({ userPromise }: { userPromise: Promise<SessionUser | null> }) {
  const initialUser = use(userPromise)
  const setUser = useUserData((s) => s.setUser)

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser, setUser])

  useEffect(() => {
    void useCompare.persist.rehydrate()
  }, [])

  useAuthSubscription(setUser)

  return null
}
