"use client"

import { useRouter } from "next/navigation"
import { ArrowDownIcon, ArrowUpIcon, PinIcon, PinOffIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { getIndicator } from "@/lib/indicators"
import { useUserData } from "@/stores/user-data-store"

import { moveItem } from "./helpers/move-item"
import { LibraryEmptyState } from "./LibraryEmptyState"

export function IndicatorsTab() {
  const router = useRouter()
  const savedIndicators = useUserData((s) => s.savedIndicators)
  const reorder = useUserData((s) => s.reorderIndicators)
  const togglePin = useUserData((s) => s.togglePinnedIndicator)

  if (savedIndicators.length === 0) {
    return (
      <LibraryEmptyState icon={PinIcon} title="No pinned indicators">
        Pin an indicator on a country page to show it on every country.
      </LibraryEmptyState>
    )
  }

  // Pinned indicators render as server KPI cards on country pages; refresh drops
  // any cached copies of those pages from the router cache.
  const move = (index: number, delta: number) =>
    void reorder(moveItem(savedIndicators, index, delta)).then(() => router.refresh())

  return (
    <div className="flex max-w-xl flex-col gap-2">
      {savedIndicators.map((code, index) => (
        <Card key={code} size="sm">
          <CardHeader>
            <CardTitle>{getIndicator(code)?.label ?? code}</CardTitle>
            <CardDescription>{code}</CardDescription>
            <CardAction className="flex gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUpIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Move down"
                disabled={index === savedIndicators.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDownIcon />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Unpin" onClick={() => void togglePin(code).then(() => router.refresh())}>
                <PinOffIcon />
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
