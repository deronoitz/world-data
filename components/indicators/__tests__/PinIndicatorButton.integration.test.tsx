import { screen, waitFor } from "@testing-library/react"

import { useUserData } from "@/stores/user-data-store"
import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"

import { PinIndicatorButton } from "../PinIndicatorButton"

describe("PinIndicatorButton", () => {
  it("pins the indicator and refreshes the server KPI cards", async () => {
    mockFetch("POST", "/api/indicators", reply(201, { indicator_code: "SP.POP.TOTL" }))
    const { user } = renderWithProviders(<PinIndicatorButton code="SP.POP.TOTL" />, { signedIn: true })

    const button = screen.getByRole("button", { name: "Pin indicator" })
    expect(button).toHaveAttribute("title", "Pin Population to every country page")
    expect(button).toHaveAttribute("aria-pressed", "false")
    await user.click(button)

    expect(screen.getByRole("button", { name: "Unpin" })).toHaveAttribute("aria-pressed", "true")
    expect(await fetchRequests("POST", "/api/indicators")[0].json()).toEqual({ indicator_code: "SP.POP.TOTL" })
    expect(router.refresh).toHaveBeenCalledOnce()
  })

  it("unpins a pinned indicator", async () => {
    useUserData.setState({ savedIndicators: ["SP.POP.TOTL"] })
    mockFetch("DELETE", "/api/indicators/SP.POP.TOTL", reply(204))
    const { user } = renderWithProviders(<PinIndicatorButton code="SP.POP.TOTL" />, { signedIn: true })

    const button = screen.getByRole("button", { name: "Unpin" })
    expect(button).toHaveAttribute("title", "Unpin Population")
    await user.click(button)

    await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce())
    expect(screen.getByRole("button", { name: "Pin indicator" })).toBeInTheDocument()
    expect(fetchRequests("DELETE")).toHaveLength(1)
  })

  it("labels an unknown indicator by its code", () => {
    renderWithProviders(<PinIndicatorButton code="XX.UNKNOWN" />)
    expect(screen.getByRole("button", { name: "Pin indicator" })).toHaveAttribute(
      "title",
      "Pin XX.UNKNOWN to every country page"
    )
  })

  it("prompts signed-out users to sign in", async () => {
    const { user } = renderWithProviders(<PinIndicatorButton code="SP.POP.TOTL" />)
    await user.click(screen.getByRole("button", { name: "Pin indicator" }))

    expect(useUserData.getState().signInPrompt).toBe("Sign in to pin indicators.")
    expect(fetchRequests()).toHaveLength(0)
  })
})
