"use client"

import { Suspense } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { useUserData } from "@/stores/user-data-store"

import { SignInOptions, type SignInProviders } from "./SignInOptions"

/** Opened by any gated action (favorite, pin, save, notes) while signed out. */
export function SignInDialog({ providers }: { providers: SignInProviders }) {
  const reason = useUserData((s) => s.signInPrompt)
  const close = useUserData((s) => s.closeSignInPrompt)

  return (
    <Dialog open={reason !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in to save</DialogTitle>
          <DialogDescription>
            {reason ?? "Sign in to keep your library."} Your favorites, comparisons, pinned
            indicators and notes are private to your account.
          </DialogDescription>
        </DialogHeader>
        <Suspense>
          <SignInOptions providers={providers} />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}
