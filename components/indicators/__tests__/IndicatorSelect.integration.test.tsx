import { screen } from "@testing-library/react"

import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"

import { IndicatorSelect } from "../IndicatorSelect"

describe("IndicatorSelect", () => {
  it("shows the current indicator and writes the pick to the `indicator` param", async () => {
    const { user } = renderWithProviders(<IndicatorSelect value="SP.POP.TOTL" />, { url: "/countries?page=2" })

    const trigger = screen.getByRole("combobox", { name: "Indicator" })
    expect(trigger).toHaveTextContent("Population")
    expect(trigger).toHaveClass("min-w-64")

    await user.click(trigger)
    await user.click(await screen.findByRole("option", { name: "GDP (current US$)" }))

    expect(router.replace).toHaveBeenCalledWith("/countries?page=2&indicator=NY.GDP.MKTP.CD", { scroll: false })
  })

  it("binds to a custom param and class", async () => {
    const { user } = renderWithProviders(<IndicatorSelect value="SP.POP.TOTL" param="i" className="w-40" />, {
      url: "/compare",
    })

    const trigger = screen.getByRole("combobox", { name: "Indicator" })
    expect(trigger).toHaveClass("w-40")
    expect(trigger).not.toHaveClass("min-w-64")

    await user.click(trigger)
    await user.click(await screen.findByRole("option", { name: "Inflation, consumer prices (annual %)" }))

    expect(router.replace).toHaveBeenCalledWith("/compare?i=FP.CPI.TOTL.ZG", { scroll: false })
  })
})
