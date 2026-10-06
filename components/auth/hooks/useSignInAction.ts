"use client"

import { useActionState } from "react"
import { unstable_rethrow, usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"

type SignInAction = (next: string) => Promise<{ error: string } | void>

/**
 * Form action for a sign-in button. A form action runs in a transition, so Next
 * follows the server action's redirect; `pending` stays true meanwhile, so a
 * second click can't start another sign-in (and overwrite its PKCE cookie).
 * Returns to `next`, or to the current page with its query.
 */
export function useSignInAction(
  action: SignInAction,
  { next, unavailable, failed }: { next?: string; unavailable: string; failed: string }
) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const target = next ?? `${pathname}${query ? `?${query}` : ""}`

  const [, signIn, pending] = useActionState(async () => {
    try {
      // Redirects on success; only returns when sign-in can't start.
      const result = await action(target)
      if (result) toast.error(unavailable, { description: result.error })
    } catch (error) {
      unstable_rethrow(error) // the redirect is not a failure
      toast.error(failed, { description: error instanceof Error ? error.message : undefined })
    }
  }, undefined)

  return [signIn, pending] as const
}
