import { recoverWith } from "@/lib/server/worldbank/http"
import { getLatestValue } from "@/lib/server/worldbank/queries"

import { KpiCard, type KpiCardProps } from "./KpiCard"

/** KpiCard for a country's latest value. Async: each card streams in under its own Suspense. */
export async function LatestKpiCard({ countryCode, ...props }: Omit<KpiCardProps, "latest"> & { countryCode: string }) {
  const latest = await getLatestValue(countryCode, props.indicator.code).catch(recoverWith(undefined))
  return <KpiCard latest={latest} {...props} />
}
