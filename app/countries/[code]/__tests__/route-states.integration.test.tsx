import { render, screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"

import CountryError from "../error"
import CountryLayout from "../layout"
import Loading from "../loading"
import CountryNotFound from "../not-found"

describe("country route states", () => {
  it("wraps the page in the centered container", () => {
    render(
      <CountryLayout>
        <p>Content</p>
      </CountryLayout>
    )
    expect(screen.getByText("Content").parentElement).toHaveClass("max-w-7xl")
  })

  it("shows header, KPI and chart skeletons while loading", () => {
    const { container } = render(<Loading />)
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(8)
  })

  it("links back to the country list when the code is unknown", () => {
    render(<CountryNotFound />)
    expect(screen.getByText("Country not found")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Browse countries" })).toHaveAttribute("href", "/countries")
  })

  it("offers a retry when data fails to load", async () => {
    const retry = vi.fn()
    const { user } = renderWithProviders(<CountryError error={new Error("x")} retry={retry} />)
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
