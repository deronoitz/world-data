import { ScrollArea } from "@/components/ui/ScrollArea"
import { COUNTRY_PAGE_SIZE } from "@/lib/domain/country"
import { loadCountryPage, type PanelParams } from "@/lib/server/services/country-page"
import { getUserFavorites } from "@/lib/server/services/library"

import { CountryPagination } from "./CountryPagination"
import { CountryTable } from "./CountryTable"
import { FavoritesSeed } from "./FavoritesSeed"

export type { PanelParams }

export async function CountryPanel({ params }: { params: PanelParams }) {
  const [{ countries, total, pages, page }, favorites] = await Promise.all([
    loadCountryPage(params),
    getUserFavorites(),
  ])
  const first = (page - 1) * COUNTRY_PAGE_SIZE + 1

  return (
    <>
      <FavoritesSeed favorites={favorites} />
      <p className="px-1 text-xs text-muted-foreground">
        {total === 0 ? "No matches" : `${first}–${first + countries.length - 1} of ${total}`}
      </p>
      <ScrollArea className="min-h-0 flex-1">
        <CountryTable countries={countries} favoritesTab={params.tab === "favorites"} />
      </ScrollArea>
      <CountryPagination
        page={page}
        totalPages={pages}
        params={{ q: params.q, region: params.region, tab: params.tab, indicator: params.indicator }}
      />
    </>
  )
}
