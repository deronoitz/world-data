import { screen } from "@testing-library/react"

import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { CountryTabs } from "../CountryTabs"

describe("CountryTabs", () => {
  it("defaults to All", () => {
    renderWithProviders(<CountryTabs />, { url: "/countries" })
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true")
  })

  it("switches to Favorites when signed in", async () => {
    const { user } = renderWithProviders(<CountryTabs />, { url: "/countries?page=2&q=a", signedIn: true })

    await user.click(screen.getByRole("tab", { name: "Favorites" }))

    expect(router.replace).toHaveBeenCalledWith("/countries?q=a&tab=favorites", { scroll: false })
  })

  it("asks signed-out users to sign in instead of switching", async () => {
    const { user } = renderWithProviders(<CountryTabs />, { url: "/countries" })

    await user.click(screen.getByRole("tab", { name: "Favorites" }))

    expect(useUserData.getState().signInPrompt).toBe("Sign in to see your favorite countries.")
    expect(router.replace).not.toHaveBeenCalled()
  })

  it("switches back to All", async () => {
    const { user } = renderWithProviders(<CountryTabs />, { url: "/countries?tab=favorites&page=4" })
    expect(screen.getByRole("tab", { name: "Favorites" })).toHaveAttribute("aria-selected", "true")

    await user.click(screen.getByRole("tab", { name: "All" }))

    expect(router.replace).toHaveBeenCalledWith("/countries", { scroll: false })
  })
})
