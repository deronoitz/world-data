import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"
import { useCompare } from "@/stores/compare-store"

import { CompareTray } from "../CompareTray"

describe("CompareTray", () => {
  it("renders nothing when the tray is empty", () => {
    const { container } = renderWithProviders(<CompareTray />, { url: "/countries" })
    expect(container).toBeEmptyDOMElement()
  })

  it("is hidden on the compare page itself", () => {
    useCompare.setState({ countries: ["IDN", "USA"] })
    const { container } = renderWithProviders(<CompareTray />, { url: "/compare?c=IDN,USA" })
    expect(container).toBeEmptyDOMElement()
  })

  it("links to the comparison once two countries are queued", () => {
    useCompare.setState({ countries: ["IDN", "USA"] })
    renderWithProviders(<CompareTray />, { url: "/countries" })
    // Base UI's Button renders the <a> with role="button".
    expect(screen.getByRole("button", { name: "Compare 2" })).toHaveAttribute("href", "/compare?c=IDN,USA")
  })

  it("disables comparing a single country", () => {
    useCompare.setState({ countries: ["IDN"] })
    renderWithProviders(<CompareTray />, { url: "/countries" })
    expect(screen.getByRole("button", { name: "Compare 1" })).toHaveAttribute("aria-disabled", "true")
  })

  it("removes countries and clears the tray", async () => {
    useCompare.setState({ countries: ["IDN", "USA", "JPN"] })
    const { user, container } = renderWithProviders(<CompareTray />, { url: "/countries" })

    await user.click(screen.getByRole("button", { name: "Remove USA from comparison" }))
    expect(useCompare.getState().countries).toEqual(["IDN", "JPN"])

    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(container).toBeEmptyDOMElement()
  })
})
