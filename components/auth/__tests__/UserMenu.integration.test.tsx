import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { UserMenu } from "../UserMenu"

describe("UserMenu", () => {
  it("shows a placeholder until auth is ready", () => {
    const { container } = renderWithProviders(<UserMenu />)
    expect(container.querySelector("[data-slot=skeleton]")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("offers Google sign in when signed out", () => {
    useUserData.setState({ authReady: true })
    renderWithProviders(<UserMenu />)
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toHaveTextContent("Sign in")
  })

  it("opens the account menu for a signed-in user", async () => {
    const { user } = renderWithProviders(<UserMenu />, { signedIn: true })

    const trigger = screen.getByRole("button", { name: "Account" })
    expect(trigger).toHaveTextContent("AL")

    await user.click(trigger)

    const menu = await screen.findByRole("menu")
    expect(menu).toHaveTextContent("Ada Lovelace")
    expect(menu).toHaveTextContent("ada@example.com")
    expect(screen.getByRole("menuitem", { name: "My library" })).toHaveAttribute("href", "/library")
    const signOut = screen.getByRole("menuitem", { name: "Sign out" })
    expect(signOut).toHaveAttribute("type", "submit")
    expect(signOut.closest("form")).toHaveAttribute("action", "/auth/signout")
  })

  it("falls back when the user has no name and renders their avatar", async () => {
    const { user } = renderWithProviders(<UserMenu />, {
      signedIn: { id: "u2", name: null, email: "bob@example.com", avatarUrl: "https://example.com/a.png" },
    })

    await user.click(screen.getByRole("button", { name: "Account" }))

    expect(await screen.findByRole("menu")).toHaveTextContent("Signed in")
  })
})
