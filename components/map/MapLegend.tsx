import { formatAxis } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import type { Indicator } from "@/lib/domain/indicator"

import { MAP_COLORS } from "./helpers/color-scale"

export function MapLegend({
  thresholds,
  max,
  indicator,
  className,
}: {
  thresholds: number[]
  max: number
  indicator: Indicator
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-x-6 gap-y-2 text-xs text-muted-foreground", className)}>
      <div className="flex flex-col gap-1">
        <span>{indicator.label} · latest available year</span>
        <div className="flex items-start">
          {MAP_COLORS.map((color, i) => (
            <div key={color} className="flex w-10 flex-col gap-1 sm:w-14">
              <div className="h-2.5 border-r-2 border-card" style={{ background: color }} />
              <span className="tabular-nums">{formatAxis(thresholds[i], indicator.format)}</span>
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <div className="h-2.5" />
            <span className="tabular-nums">{formatAxis(max, indicator.format)}+</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pb-0.5">
        <svg className="size-3 rounded-sm" aria-hidden="true">
          <rect width="12" height="12" fill="url(#map-no-data)" />
        </svg>
        No data
      </div>
    </div>
  )
}
