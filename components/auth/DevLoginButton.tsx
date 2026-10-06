"use client"

import { TerminalIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/Spinner"
import { signInAsDevUser } from "@/lib/server/auth/actions"

import { useSignInAction } from "./hooks/useSignInAction"

/** Local development only: signs in as the demo user without Google. */
export function DevLoginButton({
  next,
  ...props
}: { next?: string } & Omit<React.ComponentProps<typeof Button>, "onClick" | "type">) {
  const [signIn, pending] = useSignInAction(signInAsDevUser, {
    next,
    unavailable: "Dev login is not available",
    failed: "Could not sign in",
  })

  return (
    <form action={signIn} className="contents">
      <Button type="submit" variant="secondary" disabled={pending} {...props}>
        {pending ? <Spinner data-icon="inline-start" /> : <TerminalIcon data-icon="inline-start" />}
        <span data-label>Dev login (local only)</span>
      </Button>
    </form>
  )
}
