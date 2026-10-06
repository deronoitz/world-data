// Raw World Bank API v2 shapes (verified against live responses).
// Note: numeric meta fields are sometimes strings, coordinates/dates are strings,
// and "" means "no value".

export type WbMeta = {
  page: number | string
  pages: number | string
  per_page: number | string
  total: number | string
  sourceid?: string | null
  lastupdated?: string
}

export type WbRef = { id: string; iso2code: string; value: string }

export type WbCountryRaw = {
  id: string
  iso2Code: string
  name: string
  region: WbRef
  adminregion: WbRef
  incomeLevel: WbRef
  lendingType: WbRef
  capitalCity: string
  longitude: string
  latitude: string
}

export type WbObservationRaw = {
  indicator: { id: string; value: string }
  /** ISO2 code, not ISO3 */
  country: { id: string; value: string }
  countryiso3code: string
  date: string
  value: number | null
  unit?: string
  obs_status: string
  decimal: number
}

export type WbIndicatorRaw = {
  id: string
  name: string
  unit: string
  source: { id: string; value: string }
  sourceNote: string
  sourceOrganization: string
  topics: { id: string; value: string }[]
}

export type WbErrorBody = [{ message: { id: string; key: string; value: string }[] }]
