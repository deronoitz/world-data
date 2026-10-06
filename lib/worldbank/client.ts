import "server-only"

import { cache } from "react"

import { PAGE_SIZE } from "@/lib/countries"

import { ENDPOINTS } from "./endpoints"
import { WORLD_BANK_API_URL } from "./env"
import {
  isAggregate,
  normalizeCountry,
  normalizeIndicator,
  normalizeObservation,
} from "./normalize"
import type {
  Country,
  IndicatorMeta,
  LatestByCountry,
  LatestValue,
  Observation,
  WbCountryRaw,
  WbErrorBody,
  WbIndicatorRaw,
  WbMeta,
  WbObservationRaw,
} from "./types"

const DAY = 60 * 60 * 24

export const FIRST_YEAR = 1960

export class WorldBankError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = "WorldBankError"
  }

  /** WB error 120 = "Invalid value" (unknown country / indicator code). */
  get isInvalidValue() {
    return this.code === "120"
  }
}

function isErrorBody(json: unknown): json is WbErrorBody {
  return (
    Array.isArray(json) &&
    json.length === 1 &&
    typeof json[0] === "object" &&
    json[0] !== null &&
    "message" in json[0]
  )
}

async function wbFetch<T>(
  path: string,
  params: Record<string, string | number> = {},
  { revalidate = DAY, paged = false }: { revalidate?: number; paged?: boolean } = {}
): Promise<{ meta: WbMeta; rows: T[] }> {
  const url = new URL(`${WORLD_BANK_API_URL}${path}`)
  url.searchParams.set("format", "json")
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  const res = await fetch(url, { next: { revalidate, tags: ["wb"] } })
  if (!res.ok) {
    throw new WorldBankError("http", `World Bank API responded ${res.status}`, res.status)
  }

  const json: unknown = await res.json()
  // The API reports errors with HTTP 200 and a one-element [{ message }] body.
  if (isErrorBody(json)) {
    const msg = json[0].message[0]
    throw new WorldBankError(msg?.id ?? "unknown", msg?.value ?? "World Bank API error")
  }
  if (!Array.isArray(json) || json.length !== 2) {
    throw new WorldBankError("shape", "Unexpected World Bank API response")
  }

  const [meta, rows] = json as [WbMeta, T[] | null]
  // Unless the caller pages deliberately, a multi-page response means we'd silently drop rows.
  if (!paged && Number(meta.pages) > 1) {
    throw new WorldBankError("paging", `Response for ${path} spans ${meta.pages} pages`)
  }
  return { meta, rows: rows ?? [] }
}

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
 * by always passing a region filter (all regions when none is chosen); `codes`
 * narrows to specific countries (favorites). Rows come back in ISO3 order, so
 * each page is re-sorted by name for display.
 */
export async function listCountryPage({
  page,
  region,
  codes,
}: {
  page: number
  region?: string
  codes?: string[]
}): Promise<CountryPage> {
  if (codes && codes.length === 0) return { countries: [], total: 0, pages: 1, page: 1 }

  const regions = region
    ? region
    : [...new Set((await getCountries()).map((c) => c.region.id))].sort().join(";")
  const path = codes ? ENDPOINTS.country(codes) : ENDPOINTS.countries
  const fetchPage = (p: number) =>
    wbFetch<WbCountryRaw>(path, { region: regions, per_page: PAGE_SIZE, page: p }, { paged: true })

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
    const { rows } = await wbFetch<WbObservationRaw>(
      ENDPOINTS.countryIndicator(codes, indicator),
      { date: `${from}:${to}`, per_page: 2000 }
    )
    return rows
      .filter((row) => row.countryiso3code)
      .map(normalizeObservation)
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
