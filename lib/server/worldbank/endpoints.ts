import "server-only"

// World Bank API v2 paths, relative to WORLD_BANK_API_URL.
// Multiple country codes are joined with ";" as the API expects.

const joinCodes = (codes: string | string[]) => (Array.isArray(codes) ? codes.join(";") : codes)

export const ENDPOINTS = {
  countries: "/country",
  country: (codes: string | string[]) => `/country/${joinCodes(codes)}`,
  countryIndicator: (codes: string | string[], indicator: string) =>
    `/country/${joinCodes(codes)}/indicator/${indicator}`,
  allCountriesIndicator: (indicator: string) => `/country/all/indicator/${indicator}`,
  indicator: (indicator: string) => `/indicator/${indicator}`,
} as const
