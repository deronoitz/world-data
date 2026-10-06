"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { useSearchParamUpdater } from "@/lib/use-search-param-updater"
import { useUserData } from "@/stores/user-data-store"

/** All / Favorites switch, bound to `?tab=`. */
export function CountryTabs() {
  const { update, searchParams } = useSearchParamUpdater()
  const requireUser = useUserData((s) => s.requireUser)
  const tab = searchParams.get("tab") === "favorites" ? "favorites" : "all"

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (value === "favorites" && !requireUser("Sign in to see your favorite countries.")) return
        update({ tab: value === "favorites" ? "favorites" : null }, { resetPage: true })
      }}
    >
      <TabsList className="w-full">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="favorites">Favorites</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
