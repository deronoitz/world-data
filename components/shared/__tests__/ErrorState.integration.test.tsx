import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"

import { ErrorState } from "../ErrorState"

describe("ErrorState", () => {
  it("shows the message and its retry action", async () => {
    const retry = vi.fn()
    const { user } = renderWithProviders(
      <ErrorState title="Couldn't load" action={<button onClick={retry}>Try again</button>}>
        The API is slow.
      </ErrorState>
    )
    expect(screen.getByText("Couldn't load")).toBeInTheDocument()
    expect(screen.getByText("The API is slow.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
