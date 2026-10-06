import { screen } from "@testing-library/react"
import { toast } from "sonner"

import { MAX_COMPARE } from "@/lib/domain/library"
import { useCompare } from "@/stores/compare-store"
import { renderWithProviders } from "@/test-kit/render"

import { CompareButton } from "../CompareButton"

describe("CompareButton", () => {
  it("adds and removes a country from the tray", async () => {
    const { user } = renderWithProviders(<CompareButton code="IDN" name="Indonesia" />)

    await user.click(screen.getByRole("button", { name: "Add Indonesia to comparison" }))
    expect(useCompare.getState().countries).toEqual(["IDN"])
    expect(screen.getByRole("button", { name: "Remove Indonesia from comparison" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await user.click(screen.getByRole("button", { name: "Remove Indonesia from comparison" }))
    expect(useCompare.getState().countries).toEqual([])
  })

  it("shows a visible label that reflects the selection", async () => {
    const { user } = renderWithProviders(<CompareButton code="IDN" name="Indonesia" withLabel />)

    const button = screen.getByRole("button", { name: "Compare" })
    expect(button).toHaveAttribute("title", "Add Indonesia to comparison")

    await user.click(button)
    expect(screen.getByRole("button", { name: "In comparison" })).toHaveAttribute("aria-pressed", "true")
  })

  it("warns when the tray is full", async () => {
    const full = ["USA", "JPN", "DEU", "FRA", "GBR", "BRA"].slice(0, MAX_COMPARE)
    useCompare.setState({ countries: full })
    const { user } = renderWithProviders(<CompareButton code="IDN" name="Indonesia" />)

    await user.click(screen.getByRole("button", { name: "Add Indonesia to comparison" }))

    expect(toast.warning).toHaveBeenCalledWith(`You can compare up to ${MAX_COMPARE} countries`)
    expect(useCompare.getState().countries).toEqual(full)
  })
})
