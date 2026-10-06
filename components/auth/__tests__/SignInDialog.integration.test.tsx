import { act, screen, waitFor } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { SignInDialog } from "../SignInDialog"

const GOOGLE_ONLY = { google: true, devLogin: false }

describe("SignInDialog", () => {
  it("stays closed without a sign-in prompt", () => {
    renderWithProviders(<SignInDialog providers={GOOGLE_ONLY} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens with the reason from a gated action and closes", async () => {
    const { user } = renderWithProviders(<SignInDialog providers={GOOGLE_ONLY} />)

    act(() => {
      useUserData.getState().requireUser("Sign in to write notes.")
    })

    const dialog = await screen.findByRole("dialog", { name: "Sign in to save" })
    expect(dialog).toHaveTextContent("Sign in to write notes. Your favorites, comparisons")
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close" }))

    expect(useUserData.getState().signInPrompt).toBeNull()
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})
