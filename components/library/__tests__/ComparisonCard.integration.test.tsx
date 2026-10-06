import { screen, waitFor } from "@testing-library/react"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { ComparisonCard } from "../ComparisonCard"
import { COUNTRIES, comparison } from "./fixtures"

describe("ComparisonCard", () => {
  it("summarises the comparison and links to it", () => {
    renderWithProviders(<ComparisonCard comparison={comparison()} countries={COUNTRIES} />)

    expect(screen.getByRole("link", { name: "Indonesia vs France" })).toHaveAttribute(
      "href",
      "/compare?c=IDN%2CFRA&i=SP.POP.TOTL&from=2000&to=2020"
    )
    expect(screen.getByText("Population · 2000–2020")).toBeInTheDocument()
    expect(screen.getByText("🇫🇷 France")).toBeInTheDocument()
    expect(screen.getByText("Saved Mar 15, 2026")).toBeInTheDocument()
  })

  it("falls back to raw codes and open-ended years", () => {
    const { rerender } = renderWithProviders(
      <ComparisonCard
        comparison={comparison({ indicator_code: "X.Y", country_codes: ["IDN", "ZZZ"], year_from: null, year_to: 2010 })}
        countries={COUNTRIES}
      />
    )
    expect(screen.getByText("X.Y · earliest–2010")).toBeInTheDocument()
    expect(screen.getByText("ZZZ")).toBeInTheDocument()

    rerender(<ComparisonCard comparison={comparison({ year_from: 1990, year_to: null })} countries={COUNTRIES} />)
    expect(screen.getByText("Population · 1990–latest")).toBeInTheDocument()

    rerender(<ComparisonCard comparison={comparison({ year_from: null, year_to: null })} countries={COUNTRIES} />)
    expect(screen.getByText("Population")).toBeInTheDocument()
  })

  it("renames the comparison", async () => {
    const row = comparison()
    useUserData.setState({ comparisons: [row] })
    mockFetch("PATCH", "/api/comparisons/c1", reply(200, { ...row, name: "Renamed" }))
    const { user } = renderWithProviders(<ComparisonCard comparison={row} countries={COUNTRIES} />, { signedIn: true })

    await user.click(screen.getByRole("button", { name: "Rename" }))
    const input = screen.getByRole("textbox", { name: "Comparison name" })
    await user.clear(input)
    await user.type(input, "  Renamed  ")
    await user.click(screen.getByRole("button", { name: "Save name" }))

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    await waitFor(() => expect(fetchRequests("PATCH", "/api/comparisons/c1")).toHaveLength(1))
    expect(await fetchRequests("PATCH")[0].json()).toEqual({ name: "Renamed" })
    expect(useUserData.getState().comparisons[0].name).toBe("Renamed")
  })

  it("ignores a blank name and can cancel editing", async () => {
    const { user } = renderWithProviders(<ComparisonCard comparison={comparison()} countries={COUNTRIES} />)

    await user.click(screen.getByRole("button", { name: "Rename" }))
    await user.clear(screen.getByRole("textbox", { name: "Comparison name" }))
    await user.keyboard("{Enter}")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Rename" }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(fetchRequests()).toHaveLength(0)
  })

  it("deletes the comparison", async () => {
    const row = comparison()
    useUserData.setState({ comparisons: [row] })
    mockFetch("DELETE", "/api/comparisons/c1", reply(204))
    const { user } = renderWithProviders(<ComparisonCard comparison={row} countries={COUNTRIES} />, { signedIn: true })

    await user.click(screen.getByRole("button", { name: "Delete" }))

    expect(useUserData.getState().comparisons).toEqual([])
    await waitFor(() => expect(fetchRequests("DELETE", "/api/comparisons/c1")).toHaveLength(1))
  })
})
