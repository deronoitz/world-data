import { IndicatorSelect } from "@/components/indicators/IndicatorSelect"

export function MapOverlay({ indicator, total }: { indicator: string; total: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-popover/90 p-3 shadow-sm backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Countries</h1>
        <p className="text-xs text-muted-foreground">
          {total} economies · hover a row to find it, click the map to open one
        </p>
      </div>
      <IndicatorSelect value={indicator} className="w-full min-w-64" />
    </div>
  )
}
