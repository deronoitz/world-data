import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { LibraryView } from "../LibraryView"
import { COUNTRIES, comparison, note } from "./fixtures"

describe("LibraryView", () => {
  it("shows skeletons until the library has loaded", () => {
    useUserData.setState({ status: "loading" })
    const { container } = renderWithProviders(<LibraryView countries={COUNTRIES} />)

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    expect(container.querySelectorAll("[data-slot=skeleton]")).toHaveLength(6)
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
