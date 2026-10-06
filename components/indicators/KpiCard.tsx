import Link from "next/link"
import { PinIcon } from "lucide-react"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { formatValue } from "@/lib/format"
import type { Indicator } from "@/lib/indicators"
import { cn } from "@/lib/utils"
import { getLatestValue } from "@/lib/worldbank/client"

/** Latest value for one indicator. Async: each card streams in under its own Suspense. */
export async function KpiCard({
  countryCode,
  indicator,
  active,
  pinned,
  href,
}: {
  countryCode: string
  indicator: Indicator
  active: boolean
  pinned?: boolean
  href: string
}) {
  const latest = await getLatestValue(countryCode, indicator.code).catch(() => null)

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
          {latest ? `in ${latest.year}` : "No data available"}
        </CardContent>
      </Card>
    </Link>
  )
}
