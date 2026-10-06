import { screen, waitFor, within } from "@testing-library/react"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { IndicatorsTab } from "../IndicatorsTab"

const PINNED = ["SP.POP.TOTL", "NY.GDP.MKTP.CD", "CUSTOM.CODE"]

function cards() {
  return screen.getAllByText(/\./, { selector: "[data-slot=card-description]" }).map((el) => el.textContent)
}

describe("IndicatorsTab", () => {
  it("shows an empty state", () => {
    renderWithProviders(<IndicatorsTab />, { signedIn: true })
    expect(screen.getByText("No pinned indicators")).toBeInTheDocument()
  })

  it("lists pinned indicators with first/last move buttons disabled", () => {
    useUserData.setState({ savedIndicators: PINNED })
    renderWithProviders(<IndicatorsTab />, { signedIn: true })

    expect(screen.getByText("Population")).toBeInTheDocument()
    // Unknown codes show the code as the title.
    expect(screen.getAllByText("CUSTOM.CODE")).toHaveLength(2)
    const up = screen.getAllByRole("button", { name: "Move up" })
    const down = screen.getAllByRole("button", { name: "Move down" })
    expect(up[0]).toBeDisabled()
    expect(down[2]).toBeDisabled()
    expect(up[1]).toBeEnabled()
    expect(down[0]).toBeEnabled()
  })

  it("reorders indicators", async () => {
    useUserData.setState({ savedIndicators: PINNED })
    mockFetch("PUT", "/api/indicators", reply(204))
    const { user } = renderWithProviders(<IndicatorsTab />, { signedIn: true })

    await user.click(screen.getAllByRole("button", { name: "Move down" })[0])
    expect(useUserData.getState().savedIndicators).toEqual(["NY.GDP.MKTP.CD", "SP.POP.TOTL", "CUSTOM.CODE"])
    expect(cards()).toEqual(["NY.GDP.MKTP.CD", "SP.POP.TOTL", "CUSTOM.CODE"])

    await user.click(screen.getAllByRole("button", { name: "Move up" })[2])
    expect(useUserData.getState().savedIndicators).toEqual(["NY.GDP.MKTP.CD", "CUSTOM.CODE", "SP.POP.TOTL"])

    await waitFor(() => expect(fetchRequests("PUT", "/api/indicators")).toHaveLength(2))
    expect(await fetchRequests("PUT")[1].json()).toEqual({ order: ["NY.GDP.MKTP.CD", "CUSTOM.CODE", "SP.POP.TOTL"] })
  })

  it("unpins an indicator", async () => {
    useUserData.setState({ savedIndicators: PINNED })
    mockFetch("DELETE", "/api/indicators/NY.GDP.MKTP.CD", reply(204))
    const { user } = renderWithProviders(<IndicatorsTab />, { signedIn: true })

    const card = screen.getByText("GDP (current US$)").closest<HTMLElement>("[data-slot=card]")!
    await user.click(within(card).getByRole("button", { name: "Unpin" }))

    expect(useUserData.getState().savedIndicators).toEqual(["SP.POP.TOTL", "CUSTOM.CODE"])
    await waitFor(() => expect(fetchRequests("DELETE")).toHaveLength(1))
  })
})
