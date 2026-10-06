import type { Observation } from "@/lib/domain/indicator"

export type SeriesCountry = { code: string; name: string }

/** Rows keyed by year: { year: 2020, IDN: 4000, USA: 65000 } (null = gap). */
export function toChartRows(series: Observation[], countries: SeriesCountry[]) {
  const byYear = new Map<number, Record<string, number | null>>()
  for (const obs of series) {
    const row = byYear.get(obs.year) ?? { year: obs.year }
    row[obs.country] = obs.value
    byYear.set(obs.year, row)
  }
  const rows = [...byYear.values()].sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
  // Trim leading/trailing years where no selected country has data.
  const hasData = (row: Record<string, number | null>) =>
    countries.some((c) => row[c.code] !== null && row[c.code] !== undefined)
  const first = rows.findIndex(hasData)
  const last = rows.findLastIndex(hasData)
  return first === -1 ? [] : rows.slice(first, last + 1)
}
