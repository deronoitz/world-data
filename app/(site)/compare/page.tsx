import type { Metadata } from "next"
import { Suspense } from "react"
import { ChartLineIcon } from "lucide-react"

import { CountryMultiSelect } from "@/components/compare/CountryMultiSelect"
import { SaveComparisonDialog } from "@/components/compare/SaveComparisonDialog"
import { IndicatorHistory } from "@/components/indicators/IndicatorHistory"
import { IndicatorSelect } from "@/components/indicators/IndicatorSelect"
import { YearRange } from "@/components/indicators/YearRange"
import { ChartSkeleton, TableSkeleton } from "@/components/Skeletons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/Empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { firstParam } from "@/lib/countries"
import { flagEmoji, formatValue } from "@/lib/format"
import { resolveIndicator, type Indicator } from "@/lib/indicators"
import { getCountries, getIndicatorSeries, getLatestValue } from "@/lib/worldbank/client"
import type { Country } from "@/lib/worldbank/types"
import { parseYearRange } from "@/lib/years"
import { MAX_COMPARE } from "@/lib/compare"

export const metadata: Metadata = { title: "Compare countries" }

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams
  const countries = await getCountries()
  const byCode = new Map(countries.map((c) => [c.code, c]))
  const selected = [
    ...new Set(
      (firstParam(sp.c) ?? "")
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => byCode.has(c))
    ),
  ].slice(0, MAX_COMPARE)
  const selectedCountries = selected.map((c) => byCode.get(c)!)
  const indicator = resolveIndicator(firstParam(sp.i))
  const { from, to } = parseYearRange(firstParam(sp.from), firstParam(sp.to))
  const dataKey = `${selected.join(",")}|${indicator.code}|${from}|${to}`

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Compare countries</h1>
          <p className="text-muted-foreground">Pick up to {MAX_COMPARE} countries and an indicator.</p>
        </div>
        <SaveComparisonDialog
          countryCodes={selected}
          countryNames={selectedCountries.map((c) => c.name)}
          indicatorCode={indicator.code}
          from={from}
          to={to}
        />
      </div>

      <div className="flex flex-col gap-3">
        <CountryMultiSelect
          options={countries.map((c) => ({ code: c.code, name: c.name, iso2: c.iso2 }))}
          selected={selected}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <IndicatorSelect value={indicator.code} param="i" />
          <YearRange from={from} to={to} />
        </div>
      </div>

      {selected.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartLineIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing to compare yet</EmptyTitle>
            <EmptyDescription>
              Add countries above, or use the + button on the countries list.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle>{indicator.label}</CardTitle>
              <CardDescription>Annual values, World Bank WDI</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense key={dataKey} fallback={<ChartSkeleton />}>
                <CompareChart countries={selectedCountries} indicator={indicator} from={from} to={to} />
              </Suspense>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Latest values</CardTitle>
              <CardDescription>Most recent year with data, per country</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense key={`latest-${dataKey}`} fallback={<TableSkeleton rows={selected.length} />}>
                <LatestTable countries={selectedCountries} indicator={indicator} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

async function CompareChart({
  countries,
  indicator,
  from,
  to,
}: {
  countries: Country[]
  indicator: Indicator
  from?: number
  to?: number
}) {
  const series = await getIndicatorSeries(
    countries.map((c) => c.code),
    indicator.code,
    from,
    to
  )
  return (
    <IndicatorHistory
      series={series}
      countries={countries.map((c) => ({ code: c.code, name: c.name }))}
      indicator={indicator}
    />
  )
}

async function LatestTable({ countries, indicator }: { countries: Country[]; indicator: Indicator }) {
  const latest = await Promise.all(
    countries.map((c) => getLatestValue(c.code, indicator.code).catch(() => null))
  )
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Year</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {countries.map((c, i) => (
          <TableRow key={c.code}>
            <TableCell>
              <span className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: `var(--chart-${(i % 6) + 1})` }} />
                <span aria-hidden="true">{flagEmoji(c.iso2)}</span>
                <span className="truncate">{c.name}</span>
              </span>
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatValue(latest[i]?.value, indicator.format)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground tabular-nums">
              {latest[i]?.year ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
