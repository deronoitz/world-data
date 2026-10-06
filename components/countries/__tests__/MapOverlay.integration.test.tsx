import { screen } from "@testing-library/react"

import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"

import { MapOverlay } from "../MapOverlay"

describe("MapOverlay", () => {
  it("shows the total and an indicator picker bound to the URL", async () => {
    const { user } = renderWithProviders(<MapOverlay indicator="SP.POP.TOTL" total={217} />, { url: "/countries" })

    expect(screen.getByRole("heading", { name: "Countries" })).toBeInTheDocument()
    expect(screen.getByText(/217 economies/)).toBeInTheDocument()

    const select = screen.getByRole("combobox", { name: "Indicator" })
    expect(select).toHaveTextContent("Population")

    await user.click(select)
    await user.click(await screen.findByRole("option", { name: "GDP (current US$)" }))
    expect(router.replace).toHaveBeenCalledWith("/countries?indicator=NY.GDP.MKTP.CD", { scroll: false })
  })
})
