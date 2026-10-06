import type { Metadata } from "next"
import { Suspense } from "react"
import { preload } from "react-dom"

import { CountryFilters } from "@/components/countries/CountryFilters"
import { CountryPanel, type PanelParams } from "@/components/countries/CountryPanel"
import { CountryTabs } from "@/components/countries/CountryTabs"
import { MapOverlay } from "@/components/countries/MapOverlay"
import { WorldMap, type MapCountry } from "@/components/map/WorldMap"
import { WORLD_GEO_URL } from "@/components/map/helpers/world-geo"
import { MapSkeleton, PanelSkeleton } from "@/components/shared/Skeletons"
import { firstParam, regionOptions } from "@/lib/domain/country"
import { resolveIndicator } from "@/lib/domain/indicator"
import { getCountries, getLatestForAll } from "@/lib/server/worldbank/queries"

export const metadata: Metadata = { title: "Countries" }

export default async function CountriesPage({ searchParams }: PageProps<"/countries">) {
  // Start downloading the map geometry with the HTML, before any JS runs.
  preload(WORLD_GEO_URL, { as: "fetch", crossOrigin: "anonymous" })
  const raw = await searchParams
  const params: PanelParams = {
    q: firstParam(raw.q),
    region: firstParam(raw.region),
    tab: firstParam(raw.tab),
    page: firstParam(raw.page),
    indicator: firstParam(raw.indicator),
  }
  const indicator = resolveIndicator(params.indicator)
  const countries = await getCountries()

  return (
    <div className="relative flex flex-col lg:block">
      <div className="h-[min(65dvh,calc(68vw+100px))] lg:h-[calc(100dvh-3.5rem)]">
        <Suspense key={indicator.code} fallback={<MapSkeleton fullscreen />}>
          <MapSection indicatorCode={indicator.code} region={params.region} />
        </Suspense>
      </div>

      <div className="absolute top-4 right-4 hidden lg:block">
        <MapOverlay indicator={indicator.code} total={countries.length} />
      </div>

      <aside className="flex flex-col gap-3 border-t bg-popover p-4 lg:absolute lg:top-4 lg:bottom-4 lg:left-4 lg:w-[400px] lg:rounded-xl lg:border lg:bg-popover/95 lg:shadow-lg lg:backdrop-blur">
        <div className="lg:hidden">
          <MapOverlay indicator={indicator.code} total={countries.length} />
        </div>
        <CountryTabs />
        <CountryFilters regions={regionOptions(countries)} />
        <Suspense
          key={`${params.q}|${params.region}|${params.tab}|${params.page}`}
          fallback={<PanelSkeleton />}
        >
          <CountryPanel params={params} />
        </Suspense>
      </aside>
    </div>
  )
}

async function MapSection({ indicatorCode, region }: { indicatorCode: string; region?: string }) {
  const indicator = resolveIndicator(indicatorCode)
  const [countries, data] = await Promise.all([getCountries(), getLatestForAll(indicator.code)])
  const mapCountries: Record<string, MapCountry> = Object.fromEntries(
    countries.map((c) => [c.code, { name: c.name, region: c.region.id, iso2: c.iso2, lat: c.lat, lng: c.lng }])
  )

  return (
    <WorldMap
      countries={mapCountries}
      data={data}
      indicator={indicator}
      region={region}
    />
  )
}
