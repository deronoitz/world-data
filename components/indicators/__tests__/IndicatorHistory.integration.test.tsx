import { screen, within } from "@testing-library/react"

import { getIndicator } from "@/lib/domain/indicator"
import { renderWithProviders } from "@/test-kit/render"

import { IndicatorHistory } from "../IndicatorHistory"

vi.mock("recharts", async (importOriginal) =>
  (await import("@/test-kit/indicator-chart")).withFixedSizeCharts(await importOriginal<object>())
)

const lifeExpectancy = getIndicator("SP.DYN.LE00.IN")!
const COUNTRIES = [
  { code: "IDN", name: "Indonesia" },
  { code: "USA", name: "United States" },
]
const SERIES = [
  { country: "IDN", year: 2020, value: 70.5 },
  { country: "USA", year: 2020, value: 77 },
  { country: "IDN", year: 2021, value: 71.2 },
  { country: "USA", year: 2021, value: null },
]

describe("IndicatorHistory", () => {
  it("explains when the selection has no data", () => {
    renderWithProviders(
      <IndicatorHistory series={[{ country: "IDN", year: 2020, value: null }]} countries={COUNTRIES} indicator={lifeExpectancy} />
    )

    expect(screen.getByText("No data")).toBeInTheDocument()
    expect(screen.getByText("The World Bank has no life expectancy values for this selection.")).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "Display as" })).not.toBeInTheDocument()
  })

  it("loads the chart, then switches to a newest-first table and back", async () => {
    const { user, container } = renderWithProviders(
      <IndicatorHistory series={SERIES} countries={COUNTRIES} indicator={lifeExpectancy} />
    )

    expect(screen.getByRole("button", { name: "Chart" })).toHaveAttribute("aria-pressed", "true")
    await screen.findByText("United States", undefined, { timeout: 5000 })
    expect(container.querySelector("[data-slot=chart]")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Table" }))
    const table = screen.getByRole("table")
    const rows = within(table).getAllByRole("row")
    expect(rows.map((r) => r.textContent)).toEqual([
      "YearIndonesiaUnited States",
      "202171.2 yrs—",
      "202070.5 yrs77 yrs",
    ])
    expect(container.querySelector("[data-slot=chart]")).not.toBeInTheDocument()

    // Clicking the pressed item would empty the group; the view stays put.
    await user.click(screen.getByRole("button", { name: "Table" }))
    expect(screen.getByRole("table")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Chart" }))
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(container.querySelector("[data-slot=chart]")).toBeInTheDocument()
  })
})
