import { ScrollArea } from "@/components/ui/ScrollArea"
import { PAGE_SIZE } from "@/lib/countries"

import { CountryPagination } from "./CountryPagination"
import { CountryTable } from "./CountryTable"
import { loadCountryPage, type PanelParams } from "./helpers/load-country-page"

export type { PanelParams }

export async function CountryPanel({ params }: { params: PanelParams }) {
  const { countries, total, pages, page } = await loadCountryPage(params)
  const first = (page - 1) * PAGE_SIZE + 1

  return (
    <>
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
