import "server-only"

import { PAGE_SIZE, filterCountries } from "@/lib/countries"
import { getFavoriteCodes } from "@/lib/library"
import { getCountries, listCountryPage, type CountryPage } from "@/lib/worldbank/client"

export type PanelParams = {
  q?: string
  region?: string
  tab?: string
  page?: string
  indicator?: string
}

/**
 * Country list for the floating panel, 20 per page. Region and favorites are
 * filters the World Bank API supports, so those pages come straight from the
 * API; name search isn't, so a query falls back to filtering the cached list.
 */
export async function loadCountryPage(params: PanelParams): Promise<CountryPage> {
  const page = Math.max(1, Number(params.page) || 1)
  const favoritesTab = params.tab === "favorites"
  const favorites = favoritesTab ? await getFavoriteCodes() : undefined

  if (!params.q?.trim()) {
    return listCountryPage({ page, region: params.region, codes: favorites && [...favorites] })
  }

  const filtered = filterCountries(await getCountries(), {
    q: params.q,
    region: params.region,
    only: favorites,
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  return {
    countries: filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    total: filtered.length,
    pages,
    page: current,
  }
}
