"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { useSearchParamUpdater } from "@/lib/use-search-param-updater"
import { FIRST_YEAR as FIRST, LAST_YEAR as LAST } from "@/lib/years"

import { yearOptions } from "./helpers/year-options"

const ALL = "all"

/** From/to year pickers bound to `from` / `to` search params. */
export function YearRange({ from, to }: { from?: number; to?: number }) {
  const { update } = useSearchParamUpdater()
  const fromItems = [{ value: ALL, label: "Earliest" }, ...yearOptions(FIRST, to ?? LAST).map((y) => ({ value: y, label: y }))]
  const toItems = [{ value: ALL, label: "Latest" }, ...yearOptions(from ?? FIRST, LAST).map((y) => ({ value: y, label: y }))]

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Select
        items={fromItems}
        value={from ? String(from) : ALL}
        onValueChange={(v) => update({ from: v === ALL ? null : (v as string) })}
      >
        <SelectTrigger aria-label="From year" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {fromItems.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      to
      <Select
        items={toItems}
        value={to ? String(to) : ALL}
        onValueChange={(v) => update({ to: v === ALL ? null : (v as string) })}
      >
        <SelectTrigger aria-label="To year" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {toItems.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

