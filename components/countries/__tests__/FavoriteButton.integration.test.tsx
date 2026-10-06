import { screen } from "@testing-library/react"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { FavoriteButton } from "../FavoriteButton"

describe("FavoriteButton", () => {
  it("favorites a country", async () => {
    mockFetch("POST", "/api/favorites", reply(201, { country_code: "IDN" }))
    const { user } = renderWithProviders(<FavoriteButton code="IDN" name="Indonesia" />, { signedIn: true })

    await user.click(screen.getByRole("button", { name: "Add Indonesia to favorites" }))

    expect(screen.getByRole("button", { name: "Remove Indonesia from favorites" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(fetchRequests("POST", "/api/favorites")).toHaveLength(1)
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it("unfavorites and refreshes the server-filtered Favorites tab", async () => {
    useUserData.setState({ favorites: ["IDN"] })
    mockFetch("DELETE", "/api/favorites/IDN", reply(204))
    const { user } = renderWithProviders(<FavoriteButton code="IDN" name="Indonesia" withLabel />, {
      signedIn: true,
      url: "/countries?tab=favorites",
    })

    await user.click(screen.getByRole("button", { name: "Favorited" }))

    expect(screen.getByRole("button", { name: "Favorite" })).toHaveAttribute("aria-pressed", "false")
    expect(router.refresh).toHaveBeenCalledOnce()
  })

  it("prompts signed-out users to sign in", async () => {
    const { user } = renderWithProviders(<FavoriteButton code="IDN" name="Indonesia" />)

    await user.click(screen.getByRole("button", { name: "Add Indonesia to favorites" }))

    expect(useUserData.getState().signInPrompt).toBe("Sign in to save favorite countries.")
    expect(fetchRequests()).toHaveLength(0)
  })
})
