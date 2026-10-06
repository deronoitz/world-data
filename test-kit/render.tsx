import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TEST_SESSION_USER } from "./session"
import { setUrl } from "./navigation"
import type { SessionUser } from "@/lib/domain/user"
import { useUserData } from "@/stores/user-data-store"

/**
 * Render a client component with a userEvent instance. `url` sets what
 * usePathname()/useSearchParams() return; `signedIn` puts a user in the store
 * with every library list marked loaded, so components don't fetch them.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { url, signedIn }: { url?: string; signedIn?: boolean | SessionUser } = {}
) {
  if (url) setUrl(url)
  if (signedIn) {
    const user = signedIn === true ? TEST_SESSION_USER : signedIn
    useUserData.setState({
      user,
      owner: user.id,
      authReady: true,
      loads: { favorites: "ready", indicators: "ready", comparisons: "ready", notes: "ready" },
    })
  }
  return { user: userEvent.setup(), ...render(ui) }
}
