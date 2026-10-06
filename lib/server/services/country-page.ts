import "server-only"

import { COUNTRY_PAGE_SIZE, filterCountries } from "@/lib/domain/country"
import { getFavoriteCodes } from "@/lib/server/services/library"
import { getCountries, listCountryPage, type CountryPage } from "@/lib/server/worldbank/queries"

export type PanelParams = {
  q?: string
  region?: string
  tab?: string
  page?: string
  indicator?: string
}

/**
 * Country list for the floating panel, 20 per page. A plain region filter pages
 * straight from the World Bank API. Name search and the favorites tab filter
 * the cached full list instead: the API doesn't support search, and asking it
 * for a user's own set of countries is a new, uncached URL each time favorites
 * change, which the World Bank can take 30+ seconds to answer.
 */
export async function loadCountryPage(params: PanelParams): Promise<CountryPage> {
  const page = Math.max(1, Number(params.page) || 1)
  const favorites = params.tab === "favorites" ? await getFavoriteCodes() : undefined

  if (favorites?.size === 0) return { countries: [], total: 0, pages: 1, page: 1 }
  if (!favorites && !params.q?.trim()) {
    return listCountryPage({ page, region: params.region })
  }

  const filtered = filterCountries(await getCountries(), {
    q: params.q,
    region: params.region,
    only: favorites,
  })
  const pages = Math.max(1, Math.ceil(filtered.length / COUNTRY_PAGE_SIZE))
  const current = Math.min(page, pages)
  return {
    countries: filtered.slice((current - 1) * COUNTRY_PAGE_SIZE, current * COUNTRY_PAGE_SIZE),
    total: filtered.length,
    pages,
    page: current,
  }
}
