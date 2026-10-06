import { screen, waitFor } from "@testing-library/react"

import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"

import { CountryFilters } from "../CountryFilters"

const REGIONS = [
  { id: "EAS", name: "East Asia & Pacific" },
  { id: "ECS", name: "Europe & Central Asia" },
]

describe("CountryFilters", () => {
  it("debounces the search box into ?q= and resets the page", async () => {
    const { user } = renderWithProviders(<CountryFilters regions={REGIONS} />, { url: "/countries?page=3" })

    await user.type(screen.getByRole("textbox", { name: "Search countries" }), " indo ")

    expect(router.replace).not.toHaveBeenCalled()
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/countries?q=indo", { scroll: false }))
    expect(router.replace).toHaveBeenCalledTimes(1)
  })

  it("starts from the current query and clears it", async () => {
    const { user } = renderWithProviders(<CountryFilters regions={REGIONS} />, { url: "/countries?q=indo" })

    const input = screen.getByRole("textbox", { name: "Search countries" })
    expect(input).toHaveValue("indo")

    await user.clear(input)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/countries", { scroll: false }))
  })

  it("filters by region", async () => {
    const { user } = renderWithProviders(<CountryFilters regions={REGIONS} />, { url: "/countries?page=2" })

    const trigger = screen.getByRole("combobox", { name: "Region" })
    expect(trigger).toHaveTextContent("All regions")

    await user.click(trigger)
    await user.click(await screen.findByRole("option", { name: "Europe & Central Asia" }))

    expect(router.replace).toHaveBeenCalledWith("/countries?region=ECS", { scroll: false })
  })

  it("clears the region when picking All regions", async () => {
    const { user } = renderWithProviders(<CountryFilters regions={REGIONS} />, {
      url: "/countries?region=EAS&q=a",
    })

    const trigger = screen.getByRole("combobox", { name: "Region" })
    expect(trigger).toHaveTextContent("East Asia & Pacific")

    await user.click(trigger)
    await user.click(await screen.findByRole("option", { name: "All regions" }))

    expect(router.replace).toHaveBeenCalledWith("/countries?q=a", { scroll: false })
  })
})
