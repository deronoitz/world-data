import { render, screen } from "@testing-library/react"

import { getIndicator } from "@/lib/domain/indicator"

import { KpiCard } from "../KpiCard"

const LIFE = getIndicator("SP.DYN.LE00.IN")!

function renderCard(props: Partial<React.ComponentProps<typeof KpiCard>> = {}) {
  return render(
    <KpiCard
      indicator={LIFE}
      latest={{ value: 71.85, year: 2022 }}
      active={false}
      href="/countries/IDN?indicator=SP.DYN.LE00.IN"
      {...props}
    />
  )
}

describe("KpiCard", () => {
  it("shows the value and year, linking to the indicator", () => {
    renderCard()
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/countries/IDN?indicator=SP.DYN.LE00.IN")
    expect(link).toHaveTextContent("Life expectancy")
    expect(link).toHaveTextContent("71.9 yrs")
    expect(link).toHaveTextContent("in 2022")
    expect(screen.queryByLabelText("Pinned")).not.toBeInTheDocument()
  })

  it("marks pinned and active cards", () => {
    const { container } = renderCard({ pinned: true, active: true })
    expect(screen.getByLabelText("Pinned")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="card"]')).toHaveClass("ring-2")
  })

  it("says no data for null and couldn't load for undefined", () => {
    const { rerender } = renderCard({ latest: null })
    expect(screen.getByRole("link")).toHaveTextContent("No data available")

    rerender(<KpiCard indicator={LIFE} latest={undefined} active={false} href="/" />)
    expect(screen.getByRole("link")).toHaveTextContent("Couldn't load, try again later")
  })
})
