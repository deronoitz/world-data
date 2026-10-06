import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"

import { MainNav } from "../MainNav"

describe("MainNav", () => {
  it("marks the section of a nested page as current", () => {
    renderWithProviders(<MainNav />, { url: "/countries/IDN" })

    expect(screen.getByRole("link", { name: "Countries" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Compare" })).not.toHaveAttribute("aria-current")
    expect(screen.getByRole("link", { name: /Library/ })).toHaveAttribute("href", "/library")
  })

  it("marks an exact match and shows both library labels", () => {
    renderWithProviders(<MainNav />, { url: "/library" })

    const library = screen.getByRole("link", { name: /Library/ })
    expect(library).toHaveAttribute("aria-current", "page")
    expect(library).toHaveTextContent("LibraryMy library")
    expect(screen.getByRole("link", { name: "Countries" })).not.toHaveAttribute("aria-current")
  })

  it("does not match sibling paths that share a prefix", () => {
    renderWithProviders(<MainNav />, { url: "/compareish" })
    expect(screen.getByRole("link", { name: "Compare" })).not.toHaveAttribute("aria-current")
  })
})
