import { act, fireEvent, screen } from "@testing-library/react"

import { getIndicator } from "@/lib/indicators"
import { useMapHover } from "@/stores/map-hover-store"
import { useUserData } from "@/stores/user-data-store"
import { MAP_COUNTRIES, TINY_WORLD, stubRect, stubSvgScreen } from "@/test-kit/map-fixtures"
import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"

import { MAP_COLORS } from "../helpers/color-scale"
import { WORLD_GEO_URL } from "../helpers/world-geo"
import { WorldMap } from "../WorldMap"

const gdp = getIndicator("NY.GDP.PCAP.CD")!
const DATA = {
  IDN: { value: 4000, year: 2023 },
  USA: { value: 80000, year: 2022 },
}

function mapGroup(container: HTMLElement) {
  return container.querySelector("svg[role=img] > g")!
}

/** d3-zoom reads `event.view`, which jsdom won't accept in the MouseEvent init. */
function dispatchMouse(target: EventTarget, type: string) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 5, clientY: 5 })
  Object.defineProperty(event, "view", { value: window })
  act(() => void target.dispatchEvent(event))
}

async function renderMap(props: Partial<React.ComponentProps<typeof WorldMap>> = {}) {
  const view = renderWithProviders(<WorldMap countries={MAP_COUNTRIES} data={DATA} indicator={gdp} {...props} />)
  await screen.findByRole("link", { name: /^Indonesia/ })
  return view
}

beforeEach(() => {
  mockFetch("GET", WORLD_GEO_URL, TINY_WORLD)
  stubSvgScreen()
})

afterEach(() => {
  useMapHover.setState({ hovered: null })
  vi.restoreAllMocks()
})

describe("WorldMap", () => {
  // Runs first: the geometry cache is module-level, and a failed load leaves it cold.
  it("shows a placeholder while loading, then an error if the geometry fails", async () => {
    mockFetch("GET", WORLD_GEO_URL, reply(500))
    const { container } = renderWithProviders(<WorldMap countries={MAP_COUNTRIES} />)

    expect(container.querySelector("[data-slot=skeleton]")).toBeInTheDocument()
    expect(await screen.findByText("The map couldn't be loaded. Try refreshing the page.")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("colors economies by the indicator and hatches the rest", async () => {
    const { container } = await renderMap()

    expect(screen.getByRole("img", { name: "World map colored by GDP per capita (current US$)" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Indonesia: $4,000" })).toHaveAttribute("fill", MAP_COLORS[0])
    expect(screen.getByRole("link", { name: "United States: $80,000" })).toHaveAttribute(
      "fill",
      MAP_COLORS[MAP_COLORS.length - 1]
    )
    // The unlisted feature and the one without an ISO3 are drawn but not interactive.
    const paths = container.querySelectorAll("svg[role=img] > g > path")
    expect(paths).toHaveLength(5)
    expect(paths[2]).toHaveAttribute("fill", "url(#map-no-data)")
    expect(paths[2]).not.toHaveAttribute("role")
    expect(paths[3]).not.toHaveAttribute("tabindex")
    expect(paths[4]).toHaveAttribute("d", "")
    expect(container.querySelector("[data-slot=skeleton]")).not.toBeInTheDocument()

    expect(screen.getByText("GDP per capita (current US$) · latest available year")).toBeInTheDocument()
    expect(screen.getByText("$80K+")).toBeInTheDocument()
    expect(fetchRequests("GET", WORLD_GEO_URL)).toHaveLength(1)
  })

  it("labels countries by name alone without an indicator", async () => {
    renderWithProviders(<WorldMap countries={MAP_COUNTRIES} />)

    const indonesia = await screen.findByRole("link", { name: "Indonesia" })
    expect(indonesia).toHaveAttribute("fill", "url(#map-no-data)")
    expect(screen.getByRole("img", { name: "World map" })).toBeInTheDocument()
    expect(screen.queryByText("No data")).not.toBeInTheDocument()
  })

  it("dims countries outside the region and outlines favorites", async () => {
    useUserData.setState({ favorites: ["USA"] })
    await renderMap({ region: "EAS" })

    const indonesia = screen.getByRole("link", { name: /^Indonesia/ })
    const usa = screen.getByRole("link", { name: /^United States/ })
    expect(indonesia).toHaveAttribute("fill-opacity", "1")
    expect(indonesia).toHaveAttribute("stroke", "var(--map-stroke)")
    expect(usa).toHaveAttribute("fill-opacity", "0.25")
    expect(usa).toHaveAttribute("stroke", "var(--map-highlight)")
    expect(usa).toHaveAttribute("stroke-width", "1.5")
  })

  it("opens a country on click, Enter or Space", async () => {
    const { user } = await renderMap()
    const indonesia = screen.getByRole("link", { name: /^Indonesia/ })

    // fireEvent: userEvent's mousedown has no `view`, which d3-zoom's drag handler needs.
    fireEvent.click(indonesia)
    expect(router.push).toHaveBeenLastCalledWith("/countries/IDN")

    indonesia.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    await user.keyboard("a")
    expect(router.push).toHaveBeenCalledTimes(3)
  })

  it("shows a tooltip at the pointer and hides it when the pointer leaves", async () => {
    stubRect({ left: 10, top: 20 })
    await renderMap()
    const indonesia = screen.getByRole("link", { name: /^Indonesia/ })

    fireEvent.mouseMove(indonesia, { clientX: 110, clientY: 220 })
    const tooltip = screen.getByText("$4,000").closest("div.absolute")!
    expect(tooltip).toHaveTextContent("🇮🇩Indonesia$4,000 (2023)")
    expect(tooltip).toHaveStyle({ left: "100px", top: "200px" })

    fireEvent.mouseLeave(screen.getByRole("img"))
    expect(screen.queryByText("$4,000")).not.toBeInTheDocument()

    fireEvent.mouseMove(indonesia, { clientX: 110, clientY: 220 })
    fireEvent.mouseLeave(indonesia)
    fireEvent.blur(indonesia)
    expect(screen.queryByText("$4,000")).not.toBeInTheDocument()
  })

  it("anchors the tooltip at the center of a keyboard-focused country", async () => {
    stubRect({ left: 40, top: 60, width: 20, height: 10 })
    await renderMap()
    const usa = screen.getByRole("link", { name: /^United States/ })

    fireEvent.focus(usa)
    // Center (50, 65) minus the container's own rect origin (40, 60).
    expect(screen.getByText("$80,000").closest("div.absolute")).toHaveStyle({ left: "10px", top: "5px" })
  })

  it("ignores hover while the map is being dragged", async () => {
    stubRect({ left: 0, top: 0 })
    await renderMap()
    const indonesia = screen.getByRole("link", { name: /^Indonesia/ })

    dispatchMouse(screen.getByRole("img"), "mousedown")
    fireEvent.focus(indonesia)
    expect(screen.queryByText("$4,000")).not.toBeInTheDocument()

    dispatchMouse(window, "mouseup")
    fireEvent.focus(indonesia)
    expect(screen.getByText("$4,000")).toBeInTheDocument()
  })

  it("zooms with the controls and hides the tooltip when the map moves", async () => {
    stubRect({ left: 0, top: 0 })
    const { user, container } = await renderMap()
    expect(mapGroup(container)).toHaveAttribute("transform", "translate(0,0) scale(1)")

    fireEvent.focus(screen.getByRole("link", { name: /^Indonesia/ }))
    await user.click(screen.getByRole("button", { name: "Zoom in" }))
    expect(mapGroup(container).getAttribute("transform")).toMatch(/scale\(1\.6\)$/)
    expect(screen.queryByText("$4,000")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Zoom out" }))
    expect(mapGroup(container).getAttribute("transform")).toMatch(/scale\(1\)$/)

    await user.click(screen.getByRole("button", { name: "Zoom in" }))
    await user.click(screen.getByRole("button", { name: "Reset zoom" }))
    expect(mapGroup(container)).toHaveAttribute("transform", "translate(0,0) scale(1)")
  })

  describe("list hover", () => {
    it("outlines the hovered country and shows its tooltip", async () => {
      stubSvgScreen({ x: 5, y: 7 })
      stubRect({ left: 0, top: 0 })
      const { container } = await renderMap()

      act(() => useMapHover.getState().setHovered("IDN"))

      const outline = container.querySelector('path[data-map-hover="IDN"]')
      expect(outline).toHaveAttribute("stroke", "var(--map-hover)")
      expect(outline?.getAttribute("d")).toBe(screen.getByRole("link", { name: /^Indonesia/ }).getAttribute("d"))
      expect(screen.getByText("$4,000")).toBeInTheDocument()
    })

    it("marks small economies without a shape with a point scaled to the zoom", async () => {
      const { user, container } = await renderMap()

      act(() => useMapHover.getState().setHovered("SGP"))
      expect(container.querySelector('circle[data-map-hover="SGP"]')).toHaveAttribute("r", "5")
      expect(screen.getByText("Singapore").parentElement).toHaveTextContent("🇸🇬SingaporeNo data")

      await user.click(screen.getByRole("button", { name: "Zoom in" }))
      expect(Number(container.querySelector("circle")!.getAttribute("r"))).toBeCloseTo(5 / 1.6)
    })

    it("outlines an unlisted feature without a tooltip", async () => {
      const { container } = await renderMap()

      act(() => useMapHover.getState().setHovered("ATA"))
      expect(container.querySelector('path[data-map-hover="ATA"]')).toBeInTheDocument()
      expect(screen.queryByText("Unlisted")).not.toBeInTheDocument()

      act(() => useMapHover.getState().setHovered("NRU"))
      expect(container.querySelector('path[data-map-hover="NRU"]')).toHaveAttribute("d", "")
    })

    it("draws nothing for an economy with no shape or coordinates", async () => {
      const { container } = await renderMap()

      act(() => useMapHover.getState().setHovered("TUV"))
      expect(container.querySelector("[data-map-hover]")).not.toBeInTheDocument()
      expect(screen.queryByText("Tuvalu")).not.toBeInTheDocument()
    })

    it("prefers the pointer tooltip over the list one", async () => {
      stubRect({ left: 0, top: 0 })
      await renderMap()

      act(() => useMapHover.getState().setHovered("IDN"))
      fireEvent.focus(screen.getByRole("link", { name: /^United States/ }))

      expect(screen.getByText("$80,000")).toBeInTheDocument()
      expect(screen.queryByText("$4,000")).not.toBeInTheDocument()
    })
  })
})
