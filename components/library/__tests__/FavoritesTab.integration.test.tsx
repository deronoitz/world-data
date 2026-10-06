import { screen, waitFor } from "@testing-library/react"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { FavoritesTab } from "../FavoritesTab"
import { COUNTRIES } from "./fixtures"

describe("FavoritesTab", () => {
  it("shows an empty state", () => {
    renderWithProviders(<FavoritesTab countries={COUNTRIES} />, { signedIn: true })
    expect(screen.getByText("No favorites yet")).toBeInTheDocument()
  })

  it("links each favorite, falling back to the code for unknown countries", () => {
    useUserData.setState({ favorites: ["IDN", "ZZZ"] })
    renderWithProviders(<FavoritesTab countries={COUNTRIES} />, { signedIn: true })

    expect(screen.getByRole("link", { name: /Indonesia/ })).toHaveAttribute("href", "/countries/IDN")
    expect(screen.getByRole("link", { name: "ZZZ" })).toHaveAttribute("href", "/countries/ZZZ")
    expect(screen.getByRole("button", { name: "Remove ZZZ from favorites" })).toBeInTheDocument()
  })

  it("unfavorites a country", async () => {
    useUserData.setState({ favorites: ["IDN"] })
    mockFetch("DELETE", "/api/favorites/IDN", reply(204))
    const { user } = renderWithProviders(<FavoritesTab countries={COUNTRIES} />, { signedIn: true })

    await user.click(screen.getByRole("button", { name: "Remove Indonesia from favorites" }))

    expect(screen.getByText("No favorites yet")).toBeInTheDocument()
    await waitFor(() => expect(fetchRequests("DELETE", "/api/favorites/IDN")).toHaveLength(1))
  })
})
