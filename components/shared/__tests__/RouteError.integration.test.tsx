import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"

import { RouteError } from "../RouteError"

describe("RouteError", () => {
  it("explains the failure and retries", async () => {
    const retry = vi.fn()
    const { user } = renderWithProviders(<RouteError error={new Error("timeout")} retry={retry} />)

    expect(screen.getByText("Couldn't load data")).toBeInTheDocument()
    expect(screen.queryByText(/Ref:/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("shows the error digest for support", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" })
    renderWithProviders(<RouteError error={error} retry={vi.fn()} />)
    expect(screen.getByText("Ref: abc123")).toBeInTheDocument()
  })
})
