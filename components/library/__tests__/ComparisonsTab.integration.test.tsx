import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { ComparisonsTab } from "../ComparisonsTab"
import { COUNTRIES, comparison } from "./fixtures"

describe("ComparisonsTab", () => {
  it("shows an empty state", () => {
    renderWithProviders(<ComparisonsTab countries={COUNTRIES} />, { signedIn: true })
    expect(screen.getByText("No saved comparisons")).toBeInTheDocument()
  })

  it("renders a card per saved comparison", () => {
    useUserData.setState({
      comparisons: [comparison({ id: "a", name: "First" }), comparison({ id: "b", name: "Second" })],
    })
    renderWithProviders(<ComparisonsTab countries={COUNTRIES} />, { signedIn: true })

    expect(screen.getByRole("link", { name: "First" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Second" })).toBeInTheDocument()
  })
})
