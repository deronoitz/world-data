import "server-only"

import { geoPath } from "d3-geo"
import { zoomIdentity } from "d3-zoom"

import { MAP_WIDTH as WIDTH } from "./helpers/geo"
import { getServerGeometry } from "./helpers/server-geometry"

/**
 * Static "where is this country" map, rendered entirely on the server: no
 * client JavaScript and no world geometry shipped to the browser.
 */
export function LocatorMap({
  code,
  name,
  marker,
}: {
  code: string
  name: string
  /** Fallback for economies too small for the 110m geometry. */
  marker?: { lat: number; lng: number } | null
}) {
  const { features, path, projection, height: HEIGHT } = getServerGeometry()
  const target = features.find((f) => f.properties.iso3 === code)
  const point = !target && marker ? projection([marker.lng, marker.lat]) : null

  // Zoom so the country (or marker) fills about 60% of the frame.
  let bounds: [[number, number], [number, number]] | null = target ? path.bounds(target) : null
  if (!bounds && point) bounds = [[point[0] - 20, point[1] - 20], [point[0] + 20, point[1] + 20]]
  let t = zoomIdentity
  if (bounds) {
    const [[x0, y0], [x1, y1]] = bounds
    const k = Math.max(1, Math.min(6, 0.6 / Math.max((x1 - x0) / WIDTH, (y1 - y0) / HEIGHT)))
    t = zoomIdentity.translate(WIDTH / 2 - k * ((x0 + x1) / 2), HEIGHT / 2 - k * ((y0 + y1) / 2)).scale(k)
  }

  // Only draw countries that intersect the visible frame, rounded to 1 decimal.
  const visible = features.filter((f) => {
    const [[x0, y0], [x1, y1]] = path.bounds(f)
    const [vx0, vy0] = t.invert([0, 0])
    const [vx1, vy1] = t.invert([WIDTH, HEIGHT])
    return x1 >= vx0 && x0 <= vx1 && y1 >= vy0 && y0 <= vy1
  })
  const draw = geoPath(projection).digits(1)

  return (
    <div className="overflow-hidden rounded-lg border bg-(--map-sea) dark:bg-card">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full" role="img" aria-label={`Map highlighting ${name}`}>
        <g transform={t.toString()}>
          {visible.map((f, i) => {
            const isTarget = f === target
            return (
              <path
                key={f.properties.iso3 ?? `f-${i}`}
                d={draw(f) ?? ""}
                fill={isTarget ? "var(--map-locator)" : "var(--map-empty)"}
                stroke="var(--map-stroke)"
                strokeWidth={0.5}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
          {point && (
            <circle
              cx={point[0]}
              cy={point[1]}
              r={6 / t.k}
              fill="var(--map-locator)"
              stroke="var(--map-stroke)"
              strokeWidth={2 / t.k}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
