import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TEST_SESSION_USER } from "./session"
import { setUrl } from "./navigation"
import type { SessionUser } from "@/lib/domain/user"
import { useUserData } from "@/stores/user-data-store"

/**
 * Render a client component with a userEvent instance. `url` sets what
 * usePathname()/useSearchParams() return; `signedIn` puts a user in the store
 * (without triggering a library hydrate).
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { url, signedIn }: { url?: string; signedIn?: boolean | SessionUser } = {}
) {
  if (url) setUrl(url)
  if (signedIn) {
    useUserData.setState({
      user: signedIn === true ? TEST_SESSION_USER : signedIn,
      authReady: true,
      status: "ready",
    })
  }
  return { user: userEvent.setup(), ...render(ui) }
}
