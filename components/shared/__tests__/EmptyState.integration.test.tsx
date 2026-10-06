import { render, screen } from "@testing-library/react"
import { StarIcon } from "lucide-react"

import { EmptyState } from "../EmptyState"

describe("EmptyState", () => {
  it("shows the title and description, bordered, without an action", () => {
    const { container } = render(
      <EmptyState icon={StarIcon} title="No favorites yet">
        Star a country to keep it here.
      </EmptyState>
    )
    expect(screen.getByText("No favorites yet")).toBeInTheDocument()
    expect(screen.getByText("Star a country to keep it here.")).toBeInTheDocument()
    expect(container.firstChild).toHaveClass("border")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders an action and lets className override the border", () => {
    const { container } = render(
      <EmptyState icon={StarIcon} title="Sign in" className="border-0 p-4" action={<button>Go</button>}>
        To keep notes.
      </EmptyState>
    )
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument()
    expect(container.firstChild).toHaveClass("border-0", "p-4")
    expect(container.firstChild).not.toHaveClass("border")
  })
})
