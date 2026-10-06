import type { ComparisonRow } from "@/lib/supabase/types"

/** Link that reopens a saved comparison on /compare. */
export function comparisonHref(c: ComparisonRow) {
  const query = new URLSearchParams({ c: c.country_codes.join(","), i: c.indicator_code })
  if (c.year_from) query.set("from", String(c.year_from))
  if (c.year_to) query.set("to", String(c.year_to))
  return `/compare?${query}`
}
