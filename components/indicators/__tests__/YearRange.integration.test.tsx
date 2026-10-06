import { screen, within } from "@testing-library/react"

import { LAST_YEAR } from "@/lib/domain/year"
import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"

import { YearRange } from "../YearRange"

describe("YearRange", () => {
  it("defaults to the earliest and latest years", async () => {
    const { user } = renderWithProviders(<YearRange />, { url: "/compare?c=IDN" })

    expect(screen.getByRole("combobox", { name: "From year" })).toHaveTextContent("Earliest")
    expect(screen.getByRole("combobox", { name: "To year" })).toHaveTextContent("Latest")

    await user.click(screen.getByRole("combobox", { name: "From year" }))
    const options = within(await screen.findByRole("listbox")).getAllByRole("option")
    expect(options[0]).toHaveTextContent("Earliest")
    expect(options[1]).toHaveTextContent(String(LAST_YEAR))
    expect(options.at(-1)).toHaveTextContent("1960")

    await user.click(screen.getByRole("option", { name: "2000" }))
    expect(router.replace).toHaveBeenCalledWith("/compare?c=IDN&from=2000", { scroll: false })
  })

  it("limits each picker by the other bound and clears a bound with Earliest/Latest", async () => {
    const { user } = renderWithProviders(<YearRange from={2000} to={2010} />, {
      url: "/compare?c=IDN&from=2000&to=2010",
    })

    expect(screen.getByRole("combobox", { name: "From year" })).toHaveTextContent("2000")
    expect(screen.getByRole("combobox", { name: "To year" })).toHaveTextContent("2010")

    await user.click(screen.getByRole("combobox", { name: "From year" }))
    let options = within(await screen.findByRole("listbox")).getAllByRole("option")
    expect(options.map((o) => o.textContent)).toContain("2010")
    expect(options.map((o) => o.textContent)).not.toContain("2011")
    await user.click(screen.getByRole("option", { name: "Earliest" }))
    expect(router.replace).toHaveBeenLastCalledWith("/compare?c=IDN&to=2010", { scroll: false })

    await user.click(screen.getByRole("combobox", { name: "To year" }))
    options = within(await screen.findByRole("listbox")).getAllByRole("option")
    expect(options.at(-1)).toHaveTextContent("2000")
    await user.click(screen.getByRole("option", { name: "Latest" }))
    expect(router.replace).toHaveBeenLastCalledWith("/compare?c=IDN&from=2000", { scroll: false })

    await user.click(screen.getByRole("combobox", { name: "To year" }))
    await user.click(await screen.findByRole("option", { name: "2005" }))
    expect(router.replace).toHaveBeenLastCalledWith("/compare?c=IDN&from=2000&to=2005", { scroll: false })
  })
})
