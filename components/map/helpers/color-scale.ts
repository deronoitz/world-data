import { scaleLog, scaleQuantize, scaleLinear } from "d3-scale"

import type { Indicator } from "@/lib/domain/indicator"

export const MAP_STEPS = 7
export const MAP_COLORS = Array.from({ length: MAP_STEPS }, (_, i) => `var(--map-${i + 1})`)

/**
 * Maps a value to one of 7 sequential steps. Log scale for skewed magnitudes
 * (population, GDP); linear otherwise. Domain is clipped to the 2nd–98th
 * percentile so a single outlier doesn't wash out the whole map.
 */
export function buildColorScale(values: number[], indicator: Pick<Indicator, "scale">) {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (sorted.length === 0) return null

  const useLog = indicator.scale === "log" && sorted[0] > 0
  const lo = sorted[Math.floor(sorted.length * 0.02)]
  const hi = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.98))]
  const domain: [number, number] = lo === hi ? [lo, lo + 1] : [lo, hi]

  const position = useLog
    ? scaleLog().domain(domain).range([0, 1]).clamp(true)
    : scaleLinear().domain(domain).range([0, 1]).clamp(true)
  const step = scaleQuantize<number>().domain([0, 1]).range([...Array(MAP_STEPS).keys()])

  return {
    domain,
    useLog,
    color: (value: number) => MAP_COLORS[step(position(value))],
    /** Lower bound of each of the 7 bins, in data units (for the legend). */
    thresholds: [...Array(MAP_STEPS).keys()].map((i) => position.invert(i / MAP_STEPS)),
  }
}
