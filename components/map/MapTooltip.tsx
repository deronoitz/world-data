import { flagEmoji, formatValue } from "@/lib/utils/format"
import type { Indicator } from "@/lib/domain/indicator"

import type { MapTip } from "./helpers/types"

export function MapTooltip({
  tip,
  iso2,
  indicator,
  latest,
}: {
  tip: MapTip
  iso2?: string
  indicator?: Indicator
  latest?: { value: number; year: number }
}) {
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
      style={{ left: tip.x, top: tip.y }}
    >
      <div className="flex items-center gap-1.5 font-medium">
        {iso2 && (
          <span className="text-base leading-none" aria-hidden="true">
            {flagEmoji(iso2)}
          </span>
        )}
        {tip.name}
      </div>
      {indicator && (
        <div className="text-muted-foreground">
          {latest ? (
            <>
              <span className="font-medium text-foreground tabular-nums">
                {formatValue(latest.value, indicator.format)}
              </span>{" "}
              ({latest.year})
            </>
          ) : (
            "No data"
          )}
        </div>
      )}
    </div>
  )
}
