import { screen } from "@testing-library/react"

import { getIndicator } from "@/lib/indicators"
import { WB, wbObservation, wbPage } from "@/test-kit/app-fixtures"
import { mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderServer } from "@/test-kit/server"

import { KpiCard } from "../KpiCard"

const LIFE = getIndicator("SP.DYN.LE00.IN")!
const KPI_URL = `${WB}/country/IDN/indicator/SP.DYN.LE00.IN`

function renderCard(props: Partial<React.ComponentProps<typeof KpiCard>> = {}) {
  return renderServer(
    <KpiCard countryCode="IDN" indicator={LIFE} active={false} href="/countries/IDN?indicator=SP.DYN.LE00.IN" {...props} />
  )
}

describe("KpiCard", () => {
  it("shows the latest value and year, linking to the indicator", async () => {
    mockFetch("GET", KPI_URL, wbPage([wbObservation("IDN", 2022, 71.85, LIFE.code)]))
    await renderCard()
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/countries/IDN?indicator=SP.DYN.LE00.IN")
    expect(link).toHaveTextContent("Life expectancy")
    expect(link).toHaveTextContent("71.9 yrs")
    expect(link).toHaveTextContent("in 2022")
    expect(screen.queryByLabelText("Pinned")).not.toBeInTheDocument()
  })

  it("marks pinned and active cards", async () => {
    mockFetch("GET", KPI_URL, wbPage([wbObservation("IDN", 2022, 71.85, LIFE.code)]))
    const { container } = await renderCard({ pinned: true, active: true })
    expect(screen.getByLabelText("Pinned")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="card"]')).toHaveClass("ring-2")
  })

  it("says no data when there is no observation", async () => {
    mockFetch("GET", KPI_URL, wbPage([]))
    await renderCard()
    expect(screen.getByRole("link")).toHaveTextContent("No data available")
  })

  it("says it couldn't load when the API fails or times out", async () => {
    mockFetch("GET", KPI_URL, reply(502))
    await renderCard()
    expect(screen.getByRole("link")).toHaveTextContent("Couldn't load, try again later")
  })
})
