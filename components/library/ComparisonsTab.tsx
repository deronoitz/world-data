"use client"

import { ChartLineIcon } from "lucide-react"

import { useUserData } from "@/stores/user-data-store"

import { ComparisonCard } from "./ComparisonCard"
import type { CountryLookup } from "./helpers/types"
import { LibraryEmptyState } from "./LibraryEmptyState"

export function ComparisonsTab({ countries }: { countries: CountryLookup }) {
  const comparisons = useUserData((s) => s.comparisons)

  if (comparisons.length === 0) {
    return (
      <LibraryEmptyState icon={ChartLineIcon} title="No saved comparisons">
        Build one on the Compare page and press “Save comparison”.
      </LibraryEmptyState>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {comparisons.map((c) => (
        <ComparisonCard key={c.id} comparison={c} countries={countries} />
      ))}
    </div>
  )
}
