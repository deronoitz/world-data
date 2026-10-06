// PaginationLink is a Base UI Button rendering <a role="button">.
import { render, screen } from "@testing-library/react"

import { CountryPagination } from "../CountryPagination"

describe("CountryPagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<CountryPagination page={1} totalPages={1} params={{}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("links pages while keeping the current filters", () => {
    render(<CountryPagination page={1} totalPages={3} params={{ q: "ind", region: undefined }} />)

    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("href", "/countries?q=ind")
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("href", "/countries?q=ind&page=2")
    expect(screen.getByRole("button", { name: /previous/i })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("button", { name: /next/i })).toHaveAttribute("href", "/countries?q=ind&page=2")
    expect(screen.getByRole("button", { name: /next/i })).toHaveAttribute("aria-disabled", "false")
  })

  it("collapses long ranges and disables Next on the last page", () => {
    render(<CountryPagination page={10} totalPages={10} params={{}} />)

    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("href", "/countries")
    expect(screen.getByText("More pages")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /previous/i })).toHaveAttribute("href", "/countries?page=9")
    expect(screen.getByRole("button", { name: /next/i })).toHaveAttribute("aria-disabled", "true")
  })
})
