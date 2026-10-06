import { screen } from "@testing-library/react"

import { getIndicator } from "@/lib/domain/indicator"
import { renderWithProviders } from "@/test-kit/render"

import { IndicatorChart } from "../IndicatorChart"

vi.mock("recharts", async (importOriginal) =>
  (await import("@/test-kit/indicator-chart")).withFixedSizeCharts(await importOriginal<object>())
)

const gdpPerCapita = getIndicator("NY.GDP.PCAP.CD")!
const COUNTRIES = [
  { code: "IDN", name: "Indonesia" },
  { code: "USA", name: "United States" },
]
const SERIES = [
  { country: "IDN", year: 2020, value: 3900 },
  { country: "USA", year: 2020, value: 64000 },
  { country: "IDN", year: 2021, value: 4300 },
  { country: "USA", year: 2021, value: null },
]

function tooltip(container: HTMLElement) {
  return container.querySelector<HTMLElement>(".recharts-tooltip-wrapper")!
}

describe("IndicatorChart", () => {
  it("draws one line per country in selection-order colors, with a legend and formatted axis", () => {
    const { container } = renderWithProviders(
      <IndicatorChart series={SERIES} countries={COUNTRIES} indicator={gdpPerCapita} />
    )

    const lines = [...container.querySelectorAll(".recharts-line-curve")]
    expect(lines.map((l) => l.getAttribute("stroke"))).toEqual(["var(--color-IDN)", "var(--color-USA)"])
    expect(container.querySelector("style")?.textContent).toContain("--color-USA: var(--chart-2);")
    expect(screen.getByText("United States")).toBeInTheDocument()
    expect(screen.getByText("2020")).toBeInTheDocument()
    expect(screen.getByText("$60K")).toBeInTheDocument()
  })

  it("shows the hovered year's values in the tooltip", async () => {
    const { user, container } = renderWithProviders(
      <IndicatorChart series={SERIES} countries={COUNTRIES} indicator={gdpPerCapita} />
    )

    // Focusing the chart selects the first year; arrow keys move between years.
    await user.tab()
    expect(tooltip(container)).toHaveTextContent("2020Indonesia$3,900United States$64,000")

    await user.keyboard("{ArrowRight}")
    expect(tooltip(container)).toHaveTextContent(/^2021Indonesia\$4,300$/)
  })

  it("falls back to the code, a blank year and a dash for malformed rows", async () => {
    // Shapes the types rule out, but the API boundary can't fully guarantee.
    const series = [{ country: "IDN", year: undefined, value: "n/a" }] as unknown as typeof SERIES
    const countries = [{ code: "IDN" }] as unknown as typeof COUNTRIES
    const { user, container } = renderWithProviders(
      <IndicatorChart series={series} countries={countries} indicator={gdpPerCapita} />
    )

    await user.tab()
    expect(tooltip(container)).toHaveTextContent(/^IDN—$/)
  })

  it("omits the legend for a single country and cycles colors past six", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ code: `C${i}`, name: `Country ${i}` }))
    const { container, unmount } = renderWithProviders(
      <IndicatorChart series={[{ country: "C6", year: 2020, value: 1 }]} countries={seven} indicator={gdpPerCapita} />
    )
    expect(container.querySelector("style")?.textContent).toContain("--color-C6: var(--chart-1);")
    unmount()

    renderWithProviders(
      <IndicatorChart series={SERIES} countries={COUNTRIES.slice(0, 1)} indicator={gdpPerCapita} />
    )
    expect(screen.queryByText("Indonesia")).not.toBeInTheDocument()
    expect(document.querySelector(".recharts-legend-wrapper")).not.toBeInTheDocument()
  })
})
