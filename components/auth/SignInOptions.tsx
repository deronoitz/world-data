import { DevLoginButton } from "./DevLoginButton"
import { GoogleButton } from "./GoogleButton"

export type SignInProviders = { google: boolean; devLogin: boolean }

/**
 * The sign-in buttons for the configured providers. Google is also shown when
 * nothing is configured, so clicking it explains what's missing.
 */
export function SignInOptions({ providers, next }: { providers: SignInProviders; next?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {(providers.google || !providers.devLogin) && <GoogleButton next={next} className="w-full" />}
      {providers.devLogin && <DevLoginButton next={next} className="w-full" />}
    </div>
  )
}
