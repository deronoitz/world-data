"use client"

import { use, useEffect } from "react"

import { useCompare } from "@/stores/compare-store"
import { useUserData, type SessionUser } from "@/stores/user-data-store"

/**
 * Seeds the user store from the server-verified user (streamed in as a promise
 * under Suspense). Sign in and out are full-page navigations, so the server
 * value is always current.
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

  return null
}
