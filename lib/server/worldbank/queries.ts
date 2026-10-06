import "server-only"

import { cache } from "react"

import { COUNTRY_PAGE_SIZE, type Country } from "@/lib/domain/country"
import type {
  IndicatorMeta,
  LatestByCountry,
  LatestValue,
  Observation,
} from "@/lib/domain/indicator"
import { FIRST_YEAR } from "@/lib/domain/year"

import { ENDPOINTS } from "./endpoints"
import { DAY, wbFetch } from "./http"
import {
  isAggregate,
  normalizeCountry,
  normalizeIndicator,
  normalizeObservation,
} from "./normalize"
import type { WbCountryRaw, WbIndicatorRaw, WbObservationRaw } from "./raw-types"

/** All real economies (aggregates such as "World" removed), sorted by name. */
export const getCountries = cache(async (): Promise<Country[]> => {
  const { rows } = await wbFetch<WbCountryRaw>(ENDPOINTS.countries, { per_page: 400 })
  return rows
    .filter((raw) => !isAggregate(raw))
    .map(normalizeCountry)
    .sort((a, b) => a.name.localeCompare(b.name))
})

export type CountryPage = { countries: Country[]; total: number; pages: number; page: number }

/**
 * One page of real economies, paged by the API itself. Aggregates are excluded
 * by always passing a region filter (all regions when none is chosen). Rows come
 * back in ISO3 order, so each page is re-sorted by name for display.
 */
export async function listCountryPage({
  page,
  region,
  perPage = COUNTRY_PAGE_SIZE,
}: {
  page: number
  region?: string
  perPage?: number
}): Promise<CountryPage> {
  const regions = region
    ? region
    : [...new Set((await getCountries()).map((c) => c.region.id))].sort().join(";")
  const fetchPage = (p: number) =>
    wbFetch<WbCountryRaw>(ENDPOINTS.countries, { region: regions, per_page: perPage, page: p }, { paged: true })

  let { meta, rows } = await fetchPage(Math.max(1, page))
  const pages = Math.max(1, Number(meta.pages))
  if (rows.length === 0 && page > pages) ({ meta, rows } = await fetchPage(pages))

  return {
    countries: rows
      .filter((raw) => !isAggregate(raw))
      .map(normalizeCountry)
      .sort((a, b) => a.name.localeCompare(b.name)),
    total: Number(meta.total),
    pages,
    page: Number(meta.page),
  }
}

export const getCountry = cache(async (code: string): Promise<Country | null> => {
  const upper = code.toUpperCase()
  const countries = await getCountries()
  return countries.find((c) => c.code === upper) ?? null
})

export const getIndicatorSeries = cache(
  async (
    codes: string[],
    indicator: string,
    from: number = FIRST_YEAR,
    to: number = new Date().getFullYear()
  ): Promise<Observation[]> => {
    if (codes.length === 0) return []
    // Always the full history, so changing the year range reuses the cached response.
    const { rows } = await wbFetch<WbObservationRaw>(
      ENDPOINTS.countryIndicator(codes, indicator),
      { date: `${FIRST_YEAR}:${new Date().getFullYear()}`, per_page: 2000 }
    )
    return rows
      .filter((row) => row.countryiso3code)
      .map(normalizeObservation)
      .filter((o) => o.year >= from && o.year <= to)
      .sort((a, b) => a.year - b.year)
  }
)

export const getLatestValue = cache(
  async (code: string, indicator: string): Promise<LatestValue> => {
    const { rows } = await wbFetch<WbObservationRaw>(
      ENDPOINTS.countryIndicator(code, indicator),
      { mrnev: 1 }
    )
    const obs = rows[0] ? normalizeObservation(rows[0]) : null
    return obs && obs.value !== null ? { value: obs.value, year: obs.year } : null
  }
)

/** Latest non-empty value for every real economy, keyed by ISO3. */
export const getLatestForAll = cache(async (indicator: string): Promise<LatestByCountry> => {
  const [{ rows }, countries] = await Promise.all([
    wbFetch<WbObservationRaw>(ENDPOINTS.allCountriesIndicator(indicator), {
      mrnev: 1,
      per_page: 400,
    }),
    getCountries(),
  ])
  const real = new Set(countries.map((c) => c.code))
  const result: LatestByCountry = {}
  for (const row of rows) {
    const obs = normalizeObservation(row)
    if (real.has(obs.country) && obs.value !== null) {
      result[obs.country] = { value: obs.value, year: obs.year }
    }
  }
  return result
})

export const getIndicatorMeta = cache(async (indicator: string): Promise<IndicatorMeta | null> => {
  const { rows } = await wbFetch<WbIndicatorRaw>(ENDPOINTS.indicator(indicator), {}, { revalidate: DAY * 7 })
  return rows[0] ? normalizeIndicator(rows[0]) : null
})
