import { render } from "@testing-library/react"

import { ChartSkeleton, KpiSkeleton, MapSkeleton, PanelSkeleton, TableSkeleton } from "../Skeletons"

const skeletons = (container: HTMLElement) => container.querySelectorAll("[data-slot=skeleton]")

describe("Skeletons", () => {
  it("renders table rows (10 by default)", () => {
    expect(skeletons(render(<TableSkeleton />).container)).toHaveLength(40)
    expect(skeletons(render(<TableSkeleton rows={2} />).container)).toHaveLength(8)
  })

  it("renders the map inline or fullscreen", () => {
    expect(skeletons(render(<MapSkeleton />).container)[0]).toHaveClass("aspect-3/2")
    expect(skeletons(render(<MapSkeleton fullscreen />).container)[0]).toHaveClass("size-full")
  })

  it("renders panel, chart and KPI placeholders", () => {
    expect(skeletons(render(<PanelSkeleton />).container)).toHaveLength(31)
    expect(skeletons(render(<ChartSkeleton />).container)).toHaveLength(1)
    const kpi = render(<KpiSkeleton />).container
    expect(kpi.querySelector("[data-slot=card]")).toBeInTheDocument()
    expect(skeletons(kpi)).toHaveLength(3)
  })
})
