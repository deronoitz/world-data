"use client"

import { useShallow } from "zustand/react/shallow"

import { Skeleton } from "@/components/ui/Skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { useLibraryList, useUserData } from "@/stores/user-data-store"

import { ComparisonsTab } from "./ComparisonsTab"
import { FavoritesTab } from "./FavoritesTab"
import type { CountryLookup } from "./helpers/types"
import { IndicatorsTab } from "./IndicatorsTab"
import { NotesTab } from "./NotesTab"

export function LibraryView({ countries }: { countries: CountryLookup }) {
  // The library is the one page that shows every list.
  const loads = [
    useLibraryList("favorites"),
    useLibraryList("comparisons"),
    useLibraryList("indicators"),
    useLibraryList("notes"),
  ]
  const counts = useUserData(
    useShallow((s) => ({
      favorites: s.favorites.length,
      comparisons: s.comparisons.length,
      indicators: s.savedIndicators.length,
      notes: s.notes.length,
    }))
  )

  if (!loads.every((state) => state === "ready")) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <Tabs defaultValue="favorites" className="gap-4">
      <TabsList>
        <TabsTrigger value="favorites">Favorites ({counts.favorites})</TabsTrigger>
        <TabsTrigger value="comparisons">Comparisons ({counts.comparisons})</TabsTrigger>
        <TabsTrigger value="indicators">Indicators ({counts.indicators})</TabsTrigger>
        <TabsTrigger value="notes">Notes ({counts.notes})</TabsTrigger>
      </TabsList>
      <TabsContent value="favorites">
        <FavoritesTab countries={countries} />
      </TabsContent>
      <TabsContent value="comparisons">
        <ComparisonsTab countries={countries} />
      </TabsContent>
      <TabsContent value="indicators">
        <IndicatorsTab />
      </TabsContent>
      <TabsContent value="notes">
        <NotesTab countries={countries} />
      </TabsContent>
    </Tabs>
  )
}
