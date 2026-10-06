"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Spinner } from "@/components/ui/Spinner"
import { INDICATORS } from "@/lib/indicators"
import { useSearchParamUpdater } from "@/lib/use-search-param-updater"

const ITEMS = INDICATORS.map((i) => ({ value: i.code, label: i.label }))

/** Indicator picker bound to a URL search param (default `indicator`). */
export function IndicatorSelect({
  value,
  param = "indicator",
  className,
}: {
  value: string
  param?: string
  className?: string
}) {
  const { update, isPending } = useSearchParamUpdater()

  return (
    <div className="flex items-center gap-2">
      <Select items={ITEMS} value={value} onValueChange={(next) => update({ [param]: next as string })}>
        <SelectTrigger aria-label="Indicator" className={className ?? "min-w-64"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {isPending && <Spinner className="text-muted-foreground" />}
    </div>
  )
}
