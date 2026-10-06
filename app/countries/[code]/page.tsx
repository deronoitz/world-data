import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ArrowLeftIcon, ChartLineIcon } from "lucide-react"

import { CompareButton } from "@/components/countries/CompareButton"
import { FavoriteButton } from "@/components/countries/FavoriteButton"
import { ChartError } from "@/components/indicators/ChartError"
import { IndicatorHistory } from "@/components/indicators/IndicatorHistory"
import { IndicatorSelect } from "@/components/indicators/IndicatorSelect"
import { KpiCard } from "@/components/indicators/KpiCard"
import { PinIndicatorButton } from "@/components/indicators/PinIndicatorButton"
import { YearRange } from "@/components/indicators/YearRange"
import { LocatorMap } from "@/components/map/LocatorMap"
import { CountryNotes } from "@/components/notes/CountryNotes"
import { ChartSkeleton, KpiSkeleton } from "@/components/Skeletons"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { firstParam } from "@/lib/countries"
import { flagEmoji } from "@/lib/format"
import { DEFAULT_INDICATORS, getIndicator, isIndicatorCode, resolveIndicator } from "@/lib/indicators"
import { getSavedIndicatorCodes } from "@/lib/library"
import { getCountry, getIndicatorSeries, recoverWith } from "@/lib/worldbank/client"
import type { Country } from "@/lib/worldbank/types"
import { parseYearRange } from "@/lib/years"

export async function generateMetadata({ params }: PageProps<"/countries/[code]">): Promise<Metadata> {
  const country = await getCountry((await params).code)
  return { title: country?.name ?? "Country not found" }
}

export default async function CountryPage({ params, searchParams }: PageProps<"/countries/[code]">) {
  const { code } = await params
  const country = await getCountry(code)
  if (!country) notFound()

  const sp = await searchParams
  const indicator = resolveIndicator(firstParam(sp.indicator))
  const { from, to } = parseYearRange(firstParam(sp.from), firstParam(sp.to))

  const kpiHref = (indicatorCode: string) => {
    const query = new URLSearchParams({ indicator: indicatorCode })
    if (from) query.set("from", String(from))
    if (to) query.set("to", String(to))
    return `/countries/${country.code}?${query}`
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="self-start" nativeButton={false} render={<Link href="/countries" />}>
        <ArrowLeftIcon data-icon="inline-start" />
        All countries
      </Button>

      <CountryHeader country={country} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="kpi-heading" className="flex flex-col gap-3">
            <h2 id="kpi-heading" className="sr-only">Key indicators</h2>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {DEFAULT_INDICATORS.map((indicatorCode) => (
                <Suspense key={indicatorCode} fallback={<KpiSkeleton />}>
                  <KpiCard
                    countryCode={country.code}
                    indicator={getIndicator(indicatorCode)!}
                    active={indicator.code === indicatorCode}
                    href={kpiHref(indicatorCode)}
                  />
                </Suspense>
              ))}
              <Suspense>
                <PinnedKpis countryCode={country.code} activeCode={indicator.code} kpiHref={kpiHref} />
              </Suspense>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Historical values</CardTitle>
              <CardDescription>{indicator.label} · annual, World Bank WDI</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <IndicatorSelect value={indicator.code} />
                <PinIndicatorButton code={indicator.code} />
                <div className="sm:ml-auto">
                  <YearRange from={from} to={to} />
                </div>
              </div>
              <Suspense key={`${indicator.code}-${from}-${to}`} fallback={<ChartSkeleton />}>
                <HistorySection country={country} indicatorCode={indicator.code} from={from} to={to} />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>{country.region.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <LocatorMap
                code={country.code}
                name={country.name}
                marker={country.lat !== null && country.lng !== null ? { lat: country.lat, lng: country.lng } : null}
              />
            </CardContent>
          </Card>
          <CountryNotes countryCode={country.code} countryName={country.name} />
        </aside>
      </div>
    </>
  )
}

function CountryHeader({ country }: { country: Country }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="text-5xl leading-none" aria-hidden="true">
          {flagEmoji(country.iso2)}
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">{country.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{country.code}</Badge>
            <Badge variant="secondary">{country.incomeLevel.name}</Badge>
            {country.capital && <span>Capital: {country.capital}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <FavoriteButton code={country.code} name={country.name} withLabel />
        <CompareButton code={country.code} name={country.name} withLabel />
        <Button variant="outline" nativeButton={false} render={<Link href={`/compare?c=${country.code}`} />}>
          <ChartLineIcon data-icon="inline-start" />
          Compare with…
        </Button>
      </div>
    </div>
  )
}

async function PinnedKpis({
  countryCode,
  activeCode,
  kpiHref,
}: {
  countryCode: string
  activeCode: string
  kpiHref: (code: string) => string
}) {
  const pinned = (await getSavedIndicatorCodes()).filter(
    (code) => isIndicatorCode(code) && !DEFAULT_INDICATORS.includes(code)
  )
  return pinned.map((indicatorCode) => (
    <Suspense key={indicatorCode} fallback={<KpiSkeleton />}>
      <KpiCard
        countryCode={countryCode}
        indicator={getIndicator(indicatorCode)!}
        active={activeCode === indicatorCode}
        pinned
        href={kpiHref(indicatorCode)}
      />
    </Suspense>
  ))
}

async function HistorySection({
  country,
  indicatorCode,
  from,
  to,
}: {
  country: Country
  indicatorCode: string
  from?: number
  to?: number
}) {
  const series = await getIndicatorSeries([country.code], indicatorCode, from, to).catch(recoverWith(null))
  if (!series) return <ChartError />
  return (
    <IndicatorHistory
      series={series}
      countries={[{ code: country.code, name: country.name }]}
      indicator={resolveIndicator(indicatorCode)}
    />
  )
}
