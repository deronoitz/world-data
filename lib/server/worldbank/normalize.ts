import "server-only"

import type { Country } from "@/lib/domain/country"
import type { IndicatorMeta, Observation } from "@/lib/domain/indicator"

import type { WbCountryRaw, WbIndicatorRaw, WbObservationRaw } from "./raw-types"

export const AGGREGATE_REGION_ID = "NA"

function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function isAggregate(raw: WbCountryRaw): boolean {
  return raw.region.id === AGGREGATE_REGION_ID
}

export function normalizeCountry(raw: WbCountryRaw): Country {
  return {
    code: raw.id,
    iso2: raw.iso2Code,
    name: raw.name.trim(),
    region: { id: raw.region.id, name: raw.region.value.trim() },
    incomeLevel: { id: raw.incomeLevel.id, name: raw.incomeLevel.value.trim() },
    capital: raw.capitalCity.trim() || null,
    lat: toNumberOrNull(raw.latitude),
    lng: toNumberOrNull(raw.longitude),
  }
}

export function normalizeObservation(raw: WbObservationRaw): Observation {
  return {
    country: raw.countryiso3code,
    year: Number(raw.date),
    value: toNumberOrNull(raw.value),
  }
}

export function normalizeIndicator(raw: WbIndicatorRaw): IndicatorMeta {
  return {
    code: raw.id,
    name: raw.name,
    sourceNote: raw.sourceNote,
    sourceOrganization: raw.sourceOrganization,
  }
}
