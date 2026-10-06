import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"

import { SiteHeader } from "../SiteHeader"

describe("SiteHeader", () => {
  it("renders the home link, navigation, theme toggle and sign in", () => {
    renderWithProviders(<SiteHeader />, { url: "/compare" })

    expect(screen.getByRole("banner")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "World Data Explorer" })).toHaveAttribute("href", "/countries")
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument()
  })
})
