import Link from "next/link"
import { PinIcon } from "lucide-react"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { formatValue } from "@/lib/utils/format"
import type { Indicator, LatestValue } from "@/lib/domain/indicator"
import { cn } from "@/lib/utils"

export type KpiCardProps = {
  indicator: Indicator
  /** `undefined` = the World Bank didn't answer (e.g. timed out); `null` = no data. */
  latest: LatestValue | undefined
  active: boolean
  pinned?: boolean
  href: string
}

/** Latest value for one indicator, linking to its chart. */
export function KpiCard({ indicator, latest, active, pinned, href }: KpiCardProps) {
  return (
    <Link href={href} scroll={false} className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card size="sm" className={cn("h-full transition-colors hover:bg-muted/50", active && "ring-2 ring-primary")}>
        <CardHeader>
          <CardDescription>{indicator.shortLabel}</CardDescription>
          {pinned && (
            <CardAction>
              <PinIcon className="size-3.5 text-muted-foreground" aria-label="Pinned" />
            </CardAction>
          )}
          <CardTitle className="text-2xl font-semibold">
            {formatValue(latest?.value, indicator.format)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {latest ? `in ${latest.year}` : latest === null ? "No data available" : "Couldn't load, try again later"}
        </CardContent>
      </Card>
    </Link>
  )
}
