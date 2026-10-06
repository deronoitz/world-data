import { screen } from "@testing-library/react"

import { getIndicator } from "@/lib/domain/indicator"
import { WB, wbObservation, wbPage } from "@/test-kit/app-fixtures"
import { mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderServer } from "@/test-kit/server"

import { LatestKpiCard } from "../LatestKpiCard"

const LIFE = getIndicator("SP.DYN.LE00.IN")!
const KPI_URL = `${WB}/country/IDN/indicator/SP.DYN.LE00.IN`

function renderCard(props: Partial<React.ComponentProps<typeof LatestKpiCard>> = {}) {
  return renderServer(
    <LatestKpiCard countryCode="IDN" indicator={LIFE} active={false} href="/countries/IDN?indicator=SP.DYN.LE00.IN" {...props} />
  )
}

describe("LatestKpiCard", () => {
  it("shows the latest value and year, linking to the indicator", async () => {
    mockFetch("GET", KPI_URL, wbPage([wbObservation("IDN", 2022, 71.85, LIFE.code)]))
    await renderCard()
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/countries/IDN?indicator=SP.DYN.LE00.IN")
    expect(link).toHaveTextContent("Life expectancy")
    expect(link).toHaveTextContent("71.9 yrs")
    expect(link).toHaveTextContent("in 2022")
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
