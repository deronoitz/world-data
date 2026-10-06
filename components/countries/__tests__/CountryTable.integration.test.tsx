import { fireEvent, screen, within } from "@testing-library/react"

import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"
import type { Country } from "@/lib/worldbank/types"
import { useMapHover } from "@/stores/map-hover-store"
import { useUserData } from "@/stores/user-data-store"

import { CountryTable } from "../CountryTable"

function country(code: string, iso2: string, name: string, region: string): Country {
  return {
    code,
    iso2,
    name,
    region: { id: region, name: region },
    incomeLevel: { id: "X", name: "X" },
    capital: null,
    lat: null,
    lng: null,
  }
}

const COUNTRIES = [
  country("IDN", "ID", "Indonesia", "East Asia & Pacific"),
  country("FRA", "FR", "France", "Europe & Central Asia"),
]

afterEach(() => {
  useMapHover.setState({ hovered: null })
})

describe("CountryTable", () => {
  it("shows an empty search state", () => {
    renderWithProviders(<CountryTable countries={[]} />)
    expect(screen.getByText("No countries found")).toBeInTheDocument()
    expect(screen.getByText("Try a different search or region.")).toBeInTheDocument()
  })

  it("shows an empty favorites state", () => {
    renderWithProviders(<CountryTable countries={[]} favoritesTab />)
    expect(screen.getByText("No favorites here")).toBeInTheDocument()
    expect(screen.getByText("Star a country to add it to your favorites.")).toBeInTheDocument()
  })

  it("lists countries with links and actions", () => {
    renderWithProviders(<CountryTable countries={COUNTRIES} />)

    const rows = screen.getAllByRole("row").slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByRole("link", { name: /Indonesia/ })).toHaveAttribute("href", "/countries/IDN")
    expect(within(rows[0]).getByText("East Asia & Pacific")).toBeInTheDocument()
    expect(within(rows[1]).getByRole("button", { name: "Add France to comparison" })).toBeInTheDocument()
    expect(within(rows[1]).getByRole("button", { name: "Add France to favorites" })).toBeInTheDocument()
  })

  it("opens a country when its row is clicked, but not from the action buttons", async () => {
    const { user } = renderWithProviders(<CountryTable countries={COUNTRIES} />)

    await user.click(screen.getByText("Europe & Central Asia"))
    expect(router.push).toHaveBeenCalledWith("/countries/FRA")

    router.push.mockClear()
    await user.click(screen.getByRole("button", { name: "Add Indonesia to favorites" }))
    expect(router.push).not.toHaveBeenCalled()
    expect(useUserData.getState().signInPrompt).toBe("Sign in to save favorite countries.")
  })

  it("syncs the hovered/focused row with the map", async () => {
    const { user } = renderWithProviders(<CountryTable countries={COUNTRIES} />)
    const [, idnRow, fraRow] = screen.getAllByRole("row")

    await user.hover(idnRow)
    expect(useMapHover.getState().hovered).toBe("IDN")
    expect(idnRow).toHaveAttribute("data-state", "selected")
    expect(fraRow).not.toHaveAttribute("data-state")

    fireEvent.mouseLeave(idnRow.parentElement!)
    expect(useMapHover.getState().hovered).toBeNull()

    fireEvent.focus(within(fraRow).getByRole("link"))
    expect(useMapHover.getState().hovered).toBe("FRA")
    fireEvent.blur(within(fraRow).getByRole("link"))
    expect(useMapHover.getState().hovered).toBeNull()
  })
})
