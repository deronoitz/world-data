"use server"

import { signIn } from "@/auth"
import { safeNext } from "@/lib/safe-next"

import { isAuthConfigured, isDevLoginEnabled, isGoogleConfigured } from "./env"

/** Redirects to Google; returns an error message only when sign-in can't start. */
export async function signInWithGoogle(next: string): Promise<{ error: string } | void> {
  if (!isAuthConfigured || !isGoogleConfigured) {
    return { error: "Set AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET and DATABASE_URL." }
  }
  await signIn("google", { redirectTo: safeNext(next) })
}

/** Signs in as the local demo user (development only), then redirects to `next`. */
export async function signInAsDevUser(next: string): Promise<{ error: string } | void> {
  if (!isAuthConfigured || !isDevLoginEnabled) {
    return { error: "Dev login needs `next dev` with AUTH_DEV_LOGIN=true, AUTH_SECRET and DATABASE_URL." }
  }
  await signIn("dev", { redirectTo: safeNext(next) })
}
