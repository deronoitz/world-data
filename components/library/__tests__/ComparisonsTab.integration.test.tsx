import { screen, waitFor } from "@testing-library/react"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
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

  it("renames a comparison through the store", async () => {
    const row = comparison()
    useUserData.setState({ comparisons: [row] })
    mockFetch("PATCH", "/api/comparisons/c1", reply(200, { ...row, name: "Renamed" }))
    const { user } = renderWithProviders(<ComparisonsTab countries={COUNTRIES} />, { signedIn: true })

    await user.click(screen.getByRole("button", { name: "Rename" }))
    const input = screen.getByRole("textbox", { name: "Comparison name" })
    await user.clear(input)
    await user.type(input, "Renamed{Enter}")

    await waitFor(() => expect(fetchRequests("PATCH", "/api/comparisons/c1")).toHaveLength(1))
    expect(await fetchRequests("PATCH")[0].json()).toEqual({ name: "Renamed" })
    expect(useUserData.getState().comparisons[0].name).toBe("Renamed")
  })

  it("deletes a comparison through the store", async () => {
    useUserData.setState({ comparisons: [comparison()] })
    mockFetch("DELETE", "/api/comparisons/c1", reply(204))
    const { user } = renderWithProviders(<ComparisonsTab countries={COUNTRIES} />, { signedIn: true })

    await user.click(screen.getByRole("button", { name: "Delete" }))

    expect(useUserData.getState().comparisons).toEqual([])
    await waitFor(() => expect(fetchRequests("DELETE", "/api/comparisons/c1")).toHaveLength(1))
  })
})
