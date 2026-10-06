"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { ChartLineIcon, TableIcon } from "lucide-react"

import { ScrollArea } from "@/components/ui/ScrollArea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/Empty"
import { formatValue } from "@/lib/utils/format"
import type { Indicator } from "@/lib/domain/indicator"
import type { Observation } from "@/lib/domain/indicator"

import { ChartSkeleton } from "@/components/shared/Skeletons"

import { toChartRows, type SeriesCountry } from "./helpers/chart-rows"

// Recharts is ~100 KiB gzipped: load it after the page is interactive instead of up front.
const IndicatorChart = dynamic(() => import("./IndicatorChart").then((m) => m.IndicatorChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})

/** Chart / table view of one indicator's history for one or more countries. */
export function IndicatorHistory({
  series,
  countries,
  indicator,
}: {
  series: Observation[]
  countries: SeriesCountry[]
  indicator: Indicator
}) {
  const [view, setView] = useState<"chart" | "table">("chart")
  const rows = toChartRows(series, countries)

  if (rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No data</EmptyTitle>
          <EmptyDescription>
            The World Bank has no {indicator.shortLabel.toLowerCase()} values for this selection.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        variant="outline"
        size="sm"
        className="self-end"
        value={[view]}
        onValueChange={(v: string[]) => v[0] && setView(v[0] as "chart" | "table")}
        aria-label="Display as"
      >
        <ToggleGroupItem value="chart" aria-label="Chart">
          <ChartLineIcon />
          Chart
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table">
          <TableIcon />
          Table
        </ToggleGroupItem>
      </ToggleGroup>

      {view === "chart" ? (
        <IndicatorChart series={series} countries={countries} indicator={indicator} />
      ) : (
        <ScrollArea className="h-80 rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Year</TableHead>
                {countries.map((c) => (
                  <TableHead key={c.code} className="text-right">
                    {c.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...rows].reverse().map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="tabular-nums">{row.year}</TableCell>
                  {countries.map((c) => (
                    <TableCell key={c.code} className="text-right tabular-nums">
                      {formatValue(row[c.code], indicator.format)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  )
}
