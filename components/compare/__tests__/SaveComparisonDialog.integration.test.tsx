import { screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderWithProviders } from "@/test-kit/render"
import type { ComparisonRow } from "@/lib/domain/library"
import { useUserData } from "@/stores/user-data-store"

import { SaveComparisonDialog } from "../SaveComparisonDialog"

const ROW: ComparisonRow = {
  id: "c1",
  user_id: "u1",
  name: "Indonesia vs France · Population",
  country_codes: ["IDN", "FRA"],
  indicator_code: "SP.POP.TOTL",
  year_from: 2000,
  year_to: 2020,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const PROPS = {
  countryCodes: ["IDN", "FRA"],
  countryNames: ["Indonesia", "France"],
  indicatorCode: "SP.POP.TOTL",
}

describe("SaveComparisonDialog", () => {
  it("is disabled with fewer than two countries", () => {
    renderWithProviders(
      <SaveComparisonDialog countryCodes={["IDN"]} countryNames={["Indonesia"]} indicatorCode="SP.POP.TOTL" />
    )
    expect(screen.getByRole("button", { name: "Save comparison" })).toBeDisabled()
  })

  it("asks signed-out users to sign in", async () => {
    const { user } = renderWithProviders(<SaveComparisonDialog {...PROPS} />)

    await user.click(screen.getByRole("button", { name: "Save comparison" }))

    expect(useUserData.getState().signInPrompt).toBe("Sign in to save comparisons.")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("saves the comparison with a default name and closes", async () => {
    mockFetch("POST", "/api/comparisons", reply(201, ROW))
    const { user } = renderWithProviders(<SaveComparisonDialog {...PROPS} from={2000} to={2020} />, {
      signedIn: true,
    })

    await user.click(screen.getByRole("button", { name: "Save comparison" }))
    const name = await screen.findByRole("textbox", { name: "Name" })
    expect(name).toHaveValue("Indonesia vs France · Population")

    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    const [req] = fetchRequests("POST", "/api/comparisons")
    expect(await req.json()).toEqual({
      name: "Indonesia vs France · Population",
      country_codes: ["IDN", "FRA"],
      indicator_code: "SP.POP.TOTL",
      year_from: 2000,
      year_to: 2020,
    })
    expect(useUserData.getState().comparisons).toEqual([ROW])
  })

  it("uses a custom name, the raw indicator code and open-ended years", async () => {
    let resolve!: (value: Response) => void
    mockFetch("POST", "/api/comparisons", () => new Promise<Response>((r) => (resolve = r)))
    const { user } = renderWithProviders(<SaveComparisonDialog {...PROPS} indicatorCode="CUSTOM.CODE" />, {
      signedIn: true,
    })

    await user.click(screen.getByRole("button", { name: "Save comparison" }))
    const name = await screen.findByRole("textbox", { name: "Name" })
    expect(name).toHaveValue("Indonesia vs France · CUSTOM.CODE")

    await user.clear(name)
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    await user.type(name, "  Mine  ")
    await user.click(screen.getByRole("button", { name: "Save" }))

    // Disabled with a spinner while the request is in flight.
    expect(await screen.findByRole("status", { name: "Loading" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Save$/ })).toBeDisabled()
    resolve(reply(201, { ...ROW, name: "Mine" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    const [req] = fetchRequests("POST", "/api/comparisons")
    expect(await req.json()).toMatchObject({ name: "Mine", indicator_code: "CUSTOM.CODE", year_from: null, year_to: null })
  })

  it("stays open when saving fails", async () => {
    mockFetch("POST", "/api/comparisons", reply(500, { error: "boom" }))
    const { user } = renderWithProviders(<SaveComparisonDialog {...PROPS} />, { signedIn: true })

    await user.click(screen.getByRole("button", { name: "Save comparison" }))
    await user.click(await screen.findByRole("button", { name: "Save" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not save comparison", { description: "boom" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
  })

  it("closes on Cancel", async () => {
    const { user } = renderWithProviders(<SaveComparisonDialog {...PROPS} />, { signedIn: true })

    await user.click(screen.getByRole("button", { name: "Save comparison" }))
    await user.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(fetchRequests()).toHaveLength(0)
  })
})
