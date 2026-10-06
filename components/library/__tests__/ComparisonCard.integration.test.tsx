import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"

import { ComparisonCard } from "../ComparisonCard"
import { COUNTRIES, comparison } from "./fixtures"

const noop = () => {}

function renderCard(row = comparison(), handlers: { onRename?: () => void; onDelete?: () => void } = {}) {
  return renderWithProviders(
    <ComparisonCard comparison={row} countries={COUNTRIES} onRename={noop} onDelete={noop} {...handlers} />
  )
}

describe("ComparisonCard", () => {
  it("summarises the comparison and links to it", () => {
    renderCard()

    expect(screen.getByRole("link", { name: "Indonesia vs France" })).toHaveAttribute(
      "href",
      "/compare?c=IDN%2CFRA&i=SP.POP.TOTL&from=2000&to=2020"
    )
    expect(screen.getByText("Population · 2000–2020")).toBeInTheDocument()
    expect(screen.getByText("🇫🇷 France")).toBeInTheDocument()
    expect(screen.getByText("Saved Mar 15, 2026")).toBeInTheDocument()
  })

  it("falls back to raw codes and open-ended years", () => {
    const { rerender } = renderCard(
      comparison({ indicator_code: "X.Y", country_codes: ["IDN", "ZZZ"], year_from: null, year_to: 2010 })
    )
    expect(screen.getByText("X.Y · earliest–2010")).toBeInTheDocument()
    expect(screen.getByText("ZZZ")).toBeInTheDocument()

    rerender(
      <ComparisonCard
        comparison={comparison({ year_from: 1990, year_to: null })}
        countries={COUNTRIES}
        onRename={noop}
        onDelete={noop}
      />
    )
    expect(screen.getByText("Population · 1990–latest")).toBeInTheDocument()

    rerender(
      <ComparisonCard
        comparison={comparison({ year_from: null, year_to: null })}
        countries={COUNTRIES}
        onRename={noop}
        onDelete={noop}
      />
    )
    expect(screen.getByText("Population")).toBeInTheDocument()
  })

  it("submits a trimmed new name", async () => {
    const onRename = vi.fn()
    const { user } = renderCard(comparison(), { onRename })

    await user.click(screen.getByRole("button", { name: "Rename" }))
    const input = screen.getByRole("textbox", { name: "Comparison name" })
    await user.clear(input)
    await user.type(input, "  Renamed  ")
    await user.click(screen.getByRole("button", { name: "Save name" }))

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(onRename).toHaveBeenCalledExactlyOnceWith("Renamed")
  })

  it("ignores a blank name and can cancel editing", async () => {
    const onRename = vi.fn()
    const { user } = renderCard(comparison(), { onRename })

    await user.click(screen.getByRole("button", { name: "Rename" }))
    await user.clear(screen.getByRole("textbox", { name: "Comparison name" }))
    await user.keyboard("{Enter}")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Rename" }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(onRename).not.toHaveBeenCalled()
  })

  it("asks to delete the comparison", async () => {
    const onDelete = vi.fn()
    const { user } = renderCard(comparison(), { onDelete })

    await user.click(screen.getByRole("button", { name: "Delete" }))

    expect(onDelete).toHaveBeenCalledOnce()
  })
})
