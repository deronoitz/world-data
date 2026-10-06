export type Country = {
  /** ISO3 */
  code: string
  iso2: string
  name: string
  region: { id: string; name: string }
  incomeLevel: { id: string; name: string }
  capital: string | null
  lat: number | null
  lng: number | null
}

/** Countries per page in the countries list. */
export const COUNTRY_PAGE_SIZE = 20

// World Bank economy codes are three uppercase letters/digits (e.g. IDN, XKX).
const COUNTRY_CODE = /^[A-Z0-9]{3}$/

export function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && COUNTRY_CODE.test(value)
}

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
