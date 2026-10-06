"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/Chart"
import { formatAxis, formatValue } from "@/lib/format"
import type { Indicator } from "@/lib/indicators"
import type { Observation } from "@/lib/worldbank/types"

import { toChartRows, type SeriesCountry } from "./helpers/chart-rows"

export function IndicatorChart({
  series,
  countries,
  indicator,
}: {
  series: Observation[]
  countries: SeriesCountry[]
  indicator: Indicator
}) {
  const rows = toChartRows(series, countries)
  // Color follows the entity: slot = position in the user's selection, never rank.
  const config: ChartConfig = Object.fromEntries(
    countries.map((c, i) => [c.code, { label: c.name, color: `var(--chart-${(i % 6) + 1})` }])
  )
  const multi = countries.length > 1

  return (
    <ChartContainer config={config} className="aspect-auto h-80 w-full">
      <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v: number) => formatAxis(v, indicator.format)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => String(payload?.[0]?.payload?.year ?? "")}
              formatter={(value, name, item) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ background: item.color }}
                  />
                  <span className="text-muted-foreground">{config[String(name)]?.label ?? name}</span>
                  <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
                    {formatValue(typeof value === "number" ? value : null, indicator.format)}
                  </span>
                </div>
              )}
            />
          }
        />
        {multi && <ChartLegend itemSorter={null} content={<ChartLegendContent />} />}
        {countries.map((c) => (
          <Line
            key={c.code}
            dataKey={c.code}
            type="monotone"
            stroke={`var(--color-${c.code})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
