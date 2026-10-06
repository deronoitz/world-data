import { render, screen } from "@testing-library/react"

import { LocatorMap } from "../LocatorMap"

function renderMap(props: React.ComponentProps<typeof LocatorMap>) {
  render(<LocatorMap {...props} />)
  const svg = screen.getByRole("img", { name: `Map highlighting ${props.name}` })
  const highlighted = svg.querySelectorAll('[fill="var(--map-locator)"]')
  return { svg, highlighted, zoom: svg.querySelector("g")!.getAttribute("transform")! }
}

describe("LocatorMap", () => {
  it("zooms to and highlights a country in the geometry", () => {
    const { svg, highlighted, zoom } = renderMap({ code: "IDN", name: "Indonesia" })
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0].tagName).toBe("path")
    expect(zoom).toMatch(/scale\(/)
    // Only the countries around Indonesia are drawn, not the whole world.
    expect(svg.querySelectorAll("path").length).toBeLessThan(60)
  })

  it("drops a marker for an economy too small for the geometry", () => {
    const { highlighted, zoom } = renderMap({ code: "SGP", name: "Singapore", marker: { lat: 1.29, lng: 103.85 } })
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0].tagName).toBe("circle")
    expect(zoom).toMatch(/scale\(6\)/)
  })

  it("shows the whole world, unhighlighted, without geometry or a marker", () => {
    const { svg, highlighted, zoom } = renderMap({ code: "SGP", name: "Singapore", marker: null })
    expect(highlighted).toHaveLength(0)
    expect(zoom).toBe("translate(0,0) scale(1)")
    expect(svg.querySelectorAll("path")).toHaveLength(176)
  })
})
