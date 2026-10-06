import { screen } from "@testing-library/react"

import { fetchRequests, mockFetch } from "@/test-kit/mock-fetch"
import { renderWithProviders } from "@/test-kit/render"
import { TEST_SESSION_USER } from "@/test-kit/session"
import { useUserData } from "@/stores/user-data-store"

import { LibraryView } from "../LibraryView"
import { COUNTRIES, comparison, note } from "./fixtures"

describe("LibraryView", () => {
  it("shows skeletons until the library has loaded", () => {
    const { container } = renderWithProviders(<LibraryView countries={COUNTRIES} />)

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    expect(container.querySelectorAll("[data-slot=skeleton]")).toHaveLength(6)
  })

  it("loads every list when opened", async () => {
    useUserData.setState({ user: TEST_SESSION_USER, authReady: true, loads: {} })
    mockFetch("GET", "/api/favorites", [{ country_code: "IDN" }])
    mockFetch("GET", "/api/comparisons", [])
    mockFetch("GET", "/api/indicators", [])
    mockFetch("GET", "/api/notes", [])
    renderWithProviders(<LibraryView countries={COUNTRIES} />)

    expect(await screen.findByRole("tab", { name: "Favorites (1)" })).toBeInTheDocument()
    expect(fetchRequests()).toHaveLength(4)
  })

  it("shows tab counts and switches between tabs", async () => {
    useUserData.setState({
      favorites: ["IDN"],
      comparisons: [comparison({ name: "My comparison" })],
      savedIndicators: ["SP.POP.TOTL", "NY.GDP.MKTP.CD"],
      notes: [note({ body: "A note" })],
    })
    const { user } = renderWithProviders(<LibraryView countries={COUNTRIES} />, { signedIn: true })

    expect(screen.getByRole("tab", { name: "Favorites (1)" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("link", { name: /Indonesia/ })).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Comparisons (1)" }))
    expect(screen.getByRole("link", { name: "My comparison" })).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Indicators (2)" }))
    expect(screen.getByText("GDP (current US$)")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Notes (1)" }))
    expect(screen.getByText("A note")).toBeInTheDocument()
  })
})
