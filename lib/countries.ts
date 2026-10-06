import type { Country } from "@/lib/worldbank/types"

export const PAGE_SIZE = 20

export type CountryFilter = {
  q?: string
  region?: string
  only?: Set<string>
}

export function filterCountries(countries: Country[], filter: CountryFilter): Country[] {
  const q = filter.q?.trim().toLowerCase()
  return countries.filter(
    (c) =>
      (!q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q ||
        c.capital?.toLowerCase().includes(q)) &&
      (!filter.region || c.region.id === filter.region) &&
      (!filter.only || filter.only.has(c.code))
  )
}

/** Distinct regions derived from the country list itself. */
export function regionOptions(countries: Country[]) {
  const regions = new Map<string, string>()
  for (const c of countries) regions.set(c.region.id, c.region.name)
  return [...regions].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
