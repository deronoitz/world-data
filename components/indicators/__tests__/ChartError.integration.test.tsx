import { screen } from "@testing-library/react"

import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"

import { ChartError } from "../ChartError"

describe("ChartError", () => {
  it("explains the slow API and retries by refreshing the page data", async () => {
    const { user } = renderWithProviders(<ChartError />)

    expect(screen.getByText("Couldn't load this chart")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(router.refresh).toHaveBeenCalled()
  })
})
