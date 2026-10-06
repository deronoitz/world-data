import { screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"
import { useCompare } from "@/stores/compare-store"

import { CountryMultiSelect, type CountryOption } from "../CountryMultiSelect"

const OPTIONS: CountryOption[] = [
  { code: "IDN", name: "Indonesia", iso2: "ID" },
  { code: "FRA", name: "France", iso2: "FR" },
  { code: "USA", name: "United States", iso2: "US" },
  { code: "JPN", name: "Japan", iso2: "JP" },
  { code: "DEU", name: "Germany", iso2: "DE" },
  { code: "BRA", name: "Brazil", iso2: "BR" },
  { code: "GBR", name: "United Kingdom", iso2: "GB" },
]

describe("CountryMultiSelect", () => {
  it("mirrors the selection into the compare tray", () => {
    renderWithProviders(<CountryMultiSelect options={OPTIONS} selected={["IDN", "XXX"]} />, { url: "/compare" })

    expect(useCompare.getState().countries).toEqual(["IDN", "XXX"])
    expect(screen.getByText("Indonesia")).toBeInTheDocument()
    // Unknown codes fall back to the code itself.
    expect(screen.getByRole("button", { name: "Remove XXX" })).toBeInTheDocument()
  })

  it("removes a country from the URL", async () => {
    const { user } = renderWithProviders(<CountryMultiSelect options={OPTIONS} selected={["IDN", "FRA"]} />, {
      url: "/compare?c=IDN,FRA&i=SP.POP.TOTL",
    })

    await user.click(screen.getByRole("button", { name: "Remove Indonesia" }))

    expect(router.replace).toHaveBeenCalledWith("/compare?c=FRA&i=SP.POP.TOTL", { scroll: false })
  })

  it("drops ?c= when the last country is removed", async () => {
    const { user } = renderWithProviders(<CountryMultiSelect options={OPTIONS} selected={["IDN"]} />, {
      url: "/compare?c=IDN",
    })

    await user.click(screen.getByRole("button", { name: "Remove Indonesia" }))

    expect(router.replace).toHaveBeenCalledWith("/compare", { scroll: false })
  })

  it("adds a country from the picker", async () => {
    const { user } = renderWithProviders(<CountryMultiSelect options={OPTIONS} selected={["IDN"]} />, {
      url: "/compare?c=IDN",
    })

    await user.click(screen.getByRole("button", { name: "Add country" }))
    await user.type(await screen.findByPlaceholderText("Search countries…"), "fra")
    await user.click(await screen.findByRole("option", { name: /France/ }))

    expect(router.replace).toHaveBeenCalledWith("/compare?c=IDN%2CFRA", { scroll: false })
    await waitFor(() => expect(screen.queryByPlaceholderText("Search countries…")).not.toBeInTheDocument())
  })

  it("toggles off an already selected country from the picker", async () => {
    const { user } = renderWithProviders(<CountryMultiSelect options={OPTIONS} selected={["IDN", "FRA"]} />, {
      url: "/compare?c=IDN,FRA",
    })

    await user.click(screen.getByRole("button", { name: "Add country" }))
    await user.click(await screen.findByRole("option", { name: /France/ }))

    expect(router.replace).toHaveBeenCalledWith("/compare?c=IDN", { scroll: false })
  })

  it("disables adding once the maximum is reached", () => {
    renderWithProviders(
      <CountryMultiSelect options={OPTIONS} selected={["IDN", "FRA", "USA", "JPN", "DEU", "BRA"]} />,
      { url: "/compare" }
    )
    expect(screen.getByRole("button", { name: "Add country" })).toBeDisabled()
  })

  it("warns instead of exceeding the maximum", async () => {
    const five = ["IDN", "FRA", "USA", "JPN", "DEU"]
    const { user, rerender } = renderWithProviders(<CountryMultiSelect options={OPTIONS} selected={five} />, {
      url: "/compare",
    })

    await user.click(screen.getByRole("button", { name: "Add country" }))
    await screen.findByRole("option", { name: /Brazil/ })
    // Another tab/URL change fills the last slot while the picker is open.
    rerender(<CountryMultiSelect options={OPTIONS} selected={[...five, "BRA"]} />)
    await user.click(screen.getByRole("option", { name: /United Kingdom/ }))

    expect(toast.warning).toHaveBeenCalledWith("You can compare up to 6 countries")
    expect(router.replace).not.toHaveBeenCalled()
  })
})
