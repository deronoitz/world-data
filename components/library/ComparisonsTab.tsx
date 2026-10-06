"use client"

import { ChartLineIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/EmptyState"
import { useUserData } from "@/stores/user-data-store"

import { ComparisonCard } from "./ComparisonCard"
import type { CountryLookup } from "./helpers/types"

export function ComparisonsTab({ countries }: { countries: CountryLookup }) {
  const comparisons = useUserData((s) => s.comparisons)
  const rename = useUserData((s) => s.renameComparison)
  const remove = useUserData((s) => s.deleteComparison)

  if (comparisons.length === 0) {
    return (
      <EmptyState icon={ChartLineIcon} title="No saved comparisons">
        Build one on the Compare page and press “Save comparison”.
      </EmptyState>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {comparisons.map((c) => (
        <ComparisonCard
          key={c.id}
          comparison={c}
          countries={countries}
          onRename={(name) => void rename(c.id, name)}
          onDelete={() => void remove(c.id)}
        />
      ))}
    </div>
  )
}
