"use client"

import { useCallback, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Updates URL search params inside a transition so the current UI stays on
 * screen (with `isPending`) while the next Server Component payload streams in.
 */
export function useSearchParamUpdater() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const update = useCallback(
    (changes: Record<string, string | null | undefined>, options: { resetPage?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "") params.delete(key)
        else params.set(key, value)
      }
      if (options.resetPage) params.delete("page")
      const query = params.toString()
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      })
    },
    [pathname, router, searchParams]
  )

  return { update, isPending, searchParams }
}
