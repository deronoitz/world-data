import { screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { signInWithGoogle } from "@/lib/server/auth/actions"
import { renderWithProviders } from "@/test-kit/render"

import { GoogleButton } from "../GoogleButton"

// The server action redirects to Google; here it just never returns.
vi.mock("@/lib/server/auth/actions", () => ({ signInWithGoogle: vi.fn() }))

// Stands in for the redirect: pending until the test ends. React keeps every
// transition pending while any async action is in flight, so settle it afterwards.
let settle: () => void
beforeEach(() => {
  vi.mocked(signInWithGoogle).mockReturnValue(new Promise<void>((resolve) => (settle = resolve)))
})
afterEach(() => settle())

describe("GoogleButton", () => {
  it("starts Google sign in and returns to the current page", async () => {
    const { user } = renderWithProviders(<GoogleButton />, { url: "/countries?q=indo&page=2" })

    await user.click(screen.getByRole("button", { name: "Continue with Google" }))

    expect(signInWithGoogle).toHaveBeenCalledWith("/countries?q=indo&page=2")
    // Stays pending while the browser redirects.
    expect(screen.getByRole("button", { name: /Continue with Google/ })).toBeDisabled()
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
  })

  it("uses an explicit next path and custom label", async () => {
    const { user } = renderWithProviders(<GoogleButton next="/library" label="Sign in" />, { url: "/countries" })
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(signInWithGoogle).toHaveBeenCalledWith("/library")
  })

  it("redirects back to a path without a query string", async () => {
    const { user } = renderWithProviders(<GoogleButton />, { url: "/compare" })
    await user.click(screen.getByRole("button", { name: "Continue with Google" }))
    expect(signInWithGoogle).toHaveBeenCalledWith("/compare")
  })

  it("reports a failed action and re-enables the button", async () => {
    vi.mocked(signInWithGoogle).mockRejectedValue(new Error("network down"))
    const { user } = renderWithProviders(<GoogleButton />)

    await user.click(screen.getByRole("button", { name: "Continue with Google" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not start Google sign in", { description: "network down" })
    )
    await waitFor(() => expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled())
  })

  it("leaves the redirect to Google to Next instead of reporting it", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;https://accounts.google.com;307;" })
    vi.mocked(signInWithGoogle).mockRejectedValue(redirect)
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    window.addEventListener("error", (event) => event.preventDefault(), { once: true })
    const { user } = renderWithProviders(<GoogleButton />)

    await user.click(screen.getByRole("button", { name: "Continue with Google" }))

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalled())
    expect(toast.error).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it("omits the description for a non-Error rejection", async () => {
    vi.mocked(signInWithGoogle).mockRejectedValue("nope")
    const { user } = renderWithProviders(<GoogleButton />)
    await user.click(screen.getByRole("button", { name: "Continue with Google" }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not start Google sign in", { description: undefined })
    )
  })

  it("explains when sign in is not configured", async () => {
    vi.mocked(signInWithGoogle).mockResolvedValue({ error: "Set AUTH_SECRET." })
    const { user } = renderWithProviders(<GoogleButton />)

    await user.click(screen.getByRole("button", { name: "Continue with Google" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Sign in is not configured", { description: "Set AUTH_SECRET." })
    )
    await waitFor(() => expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled())
  })
})
