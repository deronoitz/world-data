import { render, screen } from "@testing-library/react"

import { PageContainer } from "../PageContainer"

describe("PageContainer", () => {
  it("renders children with merged classes and passes props through", () => {
    render(
      <PageContainer className="gap-2" data-testid="page" id="main">
        Content
      </PageContainer>
    )

    const page = screen.getByTestId("page")
    expect(page).toHaveTextContent("Content")
    expect(page).toHaveAttribute("id", "main")
    expect(page).toHaveClass("mx-auto", "gap-2")
    expect(page).not.toHaveClass("gap-6")
  })
})
