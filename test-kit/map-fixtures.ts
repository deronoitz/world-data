// Map test fixtures: a tiny world topology and the SVG/DOM geometry APIs jsdom lacks.

import type { MapCountry } from "@/components/map/helpers/types"
import type { WorldTopology } from "@/components/map/helpers/geo"

/** Clockwise lon/lat ring around a box (d3-geo treats clockwise as the interior). */
function box(west: number, south: number, east: number, north: number) {
  return [
    [west, south],
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ]
}

/**
 * Two World Bank economies (IDN, USA), a feature with an ISO3 the app doesn't
 * list (ATA), one with no ISO3 at all, and one whose geometry was simplified
 * away (NRU, which draws as an empty path).
 */
export const TINY_WORLD = {
  type: "Topology",
  objects: {
    countries: {
      type: "GeometryCollection",
      geometries: [
        { type: "Polygon", arcs: [[0]], properties: { name: "Indonesia", iso3: "IDN" } },
        { type: "Polygon", arcs: [[1]], properties: { name: "United States", iso3: "USA" } },
        { type: "Polygon", arcs: [[2]], properties: { name: "Unlisted", iso3: "ATA" } },
        { type: "Polygon", arcs: [[3]], properties: { name: "Somaliland", iso3: null } },
        { type: null, properties: { name: "Nauru", iso3: "NRU" } },
      ],
    },
  },
  arcs: [box(100, -5, 120, 5), box(-120, 30, -80, 45), box(10, -40, 20, -30), box(45, 8, 50, 11)],
} as unknown as WorldTopology

/** Economies keyed by ISO3. SGP has no shape (point fallback); TUV has no shape or coordinates. */
export const MAP_COUNTRIES: Record<string, MapCountry> = {
  IDN: { name: "Indonesia", region: "EAS", iso2: "ID", lat: -6.2, lng: 106.8 },
  USA: { name: "United States", region: "NAC", iso2: "US", lat: 38.9, lng: -77 },
  SGP: { name: "Singapore", region: "EAS", iso2: "SG", lat: 1.3, lng: 103.8 },
  TUV: { name: "Tuvalu", region: "EAS" },
}

/** Minimal DOMPoint with matrixTransform for a 2D affine matrix. */
class DOMPointStub {
  constructor(
    public x = 0,
    public y = 0
  ) {}
  matrixTransform(m: { a: number; b: number; c: number; d: number; e: number; f: number }) {
    return new DOMPointStub(m.a * this.x + m.c * this.y + m.e, m.b * this.x + m.d * this.y + m.f)
  }
}

/**
 * jsdom has no getScreenCTM or DOMPoint. Installs them (call in beforeEach;
 * setup.ts unstubs globals after each test) with an identity-plus-offset CTM,
 * and returns the getScreenCTM spy so a test can override it.
 */
export function stubSvgScreen(offset = { x: 0, y: 0 }) {
  vi.stubGlobal("DOMPoint", DOMPointStub)
  if (!("getScreenCTM" in SVGSVGElement.prototype)) {
    Object.defineProperty(SVGSVGElement.prototype, "getScreenCTM", {
      configurable: true,
      writable: true,
      value: () => null,
    })
  }
  return vi
    .spyOn(SVGSVGElement.prototype, "getScreenCTM")
    .mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: offset.x, f: offset.y } as DOMMatrix)
}

/** Every element reports this client rect (jsdom's are all zeros). */
export function stubRect(rect: { left: number; top: number; width?: number; height?: number }) {
  const { left, top, width = 0, height = 0 } = rect
  return vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    left,
    top,
    width,
    height,
    x: left,
    y: top,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect)
}
