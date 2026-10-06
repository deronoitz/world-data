"use client"

import { useRouter } from "next/navigation"
import { PinIcon, PinOffIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { getIndicator } from "@/lib/domain/indicator"
import { useLibraryList, useUserData } from "@/stores/user-data-store"

export function PinIndicatorButton({ code }: { code: string }) {
  const router = useRouter()
  useLibraryList("indicators")
  const pinned = useUserData((s) => s.savedIndicators.includes(code))
  const toggle = useUserData((s) => s.togglePinnedIndicator)
  const label = getIndicator(code)?.shortLabel ?? code

  return (
    <Button
      variant="outline"
      aria-pressed={pinned}
      onClick={async () => {
        await toggle(code)
        // Pinned indicators render as server KPI cards; refresh to show/hide them.
        router.refresh()
      }}
      title={pinned ? `Unpin ${label}` : `Pin ${label} to every country page`}
    >
      {pinned ? <PinOffIcon data-icon="inline-start" /> : <PinIcon data-icon="inline-start" />}
      {pinned ? "Unpin" : "Pin indicator"}
    </Button>
  )
}
