"use client"

import { useEffect, useState } from "react"
import { CheckIcon, PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/Command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { flagEmoji } from "@/lib/utils/format"
import { useSearchParamUpdater } from "@/lib/client/hooks/use-search-param-updater"
import { MAX_COMPARE } from "@/lib/domain/library"
import { useCompare } from "@/stores/compare-store"

export type CountryOption = { code: string; name: string; iso2: string }

/** Country picker for /compare. The URL (`?c=`) is the source of truth; the tray store mirrors it. */
export function CountryMultiSelect({
  options,
  selected,
}: {
  options: CountryOption[]
  selected: string[]
}) {
  const { update } = useSearchParamUpdater()
  const setAll = useCompare((s) => s.setAll)
  const [open, setOpen] = useState(false)
  const byCode = new Map(options.map((o) => [o.code, o]))

  useEffect(() => {
    setAll(selected)
  }, [selected, setAll])

  function commit(codes: string[]) {
    update({ c: codes.length ? codes.join(",") : null })
  }

  function toggle(code: string) {
    if (selected.includes(code)) commit(selected.filter((c) => c !== code))
    else if (selected.length >= MAX_COMPARE) toast.warning(`You can compare up to ${MAX_COMPARE} countries`)
    else commit([...selected, code])
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map((code, i) => {
        const option = byCode.get(code)
        return (
          <Badge key={code} variant="outline" className="h-8 gap-1.5 pr-1 pl-2 text-sm">
            <span className="size-2.5 rounded-[2px]" style={{ background: `var(--chart-${(i % 6) + 1})` }} />
            <span aria-hidden="true">{option ? flagEmoji(option.iso2) : ""}</span>
            {option?.name ?? code}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${option?.name ?? code}`}
              onClick={() => toggle(code)}
            >
              <XIcon />
            </Button>
          </Badge>
        )
      })}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="outline" disabled={selected.length >= MAX_COMPARE} />}
        >
          <PlusIcon data-icon="inline-start" />
          Add country
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.code}
                    value={`${option.name} ${option.code}`}
                    onSelect={() => {
                      toggle(option.code)
                      setOpen(false)
                    }}
                  >
                    <span aria-hidden="true">{flagEmoji(option.iso2)}</span>
                    {option.name}
                    {selected.includes(option.code) && <CheckIcon className="ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
