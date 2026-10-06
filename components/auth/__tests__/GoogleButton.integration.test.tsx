import { screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { renderWithProviders } from "@/test-kit/render"

import { GoogleButton } from "../GoogleButton"

const supabase = vi.hoisted(() => ({
  configured: true,
  signInWithOAuth: vi.fn(),
}))

vi.mock("@/lib/supabase/env", () => ({
  get isSupabaseConfigured() {
    return supabase.configured
  },
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth: supabase.signInWithOAuth } }),
}))

beforeEach(() => {
  supabase.configured = true
  supabase.signInWithOAuth.mockResolvedValue({ error: null })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("GoogleButton", () => {
  it("starts Google OAuth and returns to the current page", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    const { user } = renderWithProviders(<GoogleButton />, { url: "/countries?q=indo&page=2" })

    await user.click(screen.getByRole("button", { name: "Continue with Google" }))

    expect(supabase.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/countries?q=indo&page=2")}`,
      },
    })
    // Stays pending while the browser redirects.
    expect(screen.getByRole("button", { name: /Continue with Google/ })).toBeDisabled()
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
  })

  it("uses an explicit next path, custom label and the configured site URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://world.example")
    const { user } = renderWithProviders(<GoogleButton next="/library" label="Sign in" />, { url: "/countries" })

    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(supabase.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://world.example/auth/callback?next=%2Flibrary" },
    })
  })

  it("redirects back to a path without a query string", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://world.example")
    const { user } = renderWithProviders(<GoogleButton />, { url: "/compare" })

    await user.click(screen.getByRole("button", { name: "Continue with Google" }))

    expect(supabase.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://world.example/auth/callback?next=%2Fcompare" },
    })
  })

  it("reports OAuth errors and re-enables the button", async () => {
    supabase.signInWithOAuth.mockResolvedValue({ error: { message: "popup blocked" } })
    const { user } = renderWithProviders(<GoogleButton />)

    await user.click(screen.getByRole("button", { name: "Continue with Google" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not start Google sign in", { description: "popup blocked" })
    )
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled()
  })

  it("explains when Supabase is not configured", async () => {
    supabase.configured = false
    const { user } = renderWithProviders(<GoogleButton />)

    await user.click(screen.getByRole("button", { name: "Continue with Google" }))

    expect(toast.error).toHaveBeenCalledWith("Supabase is not configured", {
      description: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    })
    expect(supabase.signInWithOAuth).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled()
  })
})
