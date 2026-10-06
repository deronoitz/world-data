"use client"

import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/InputGroup"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Spinner } from "@/components/ui/Spinner"
import { useSearchParamUpdater } from "@/lib/use-search-param-updater"

type Option = { id: string; name: string }

const ALL = "all"

export function CountryFilters({ regions }: { regions: Option[] }) {
  const { update, isPending, searchParams } = useSearchParamUpdater()
  const [query, setQuery] = useState(searchParams.get("q") ?? "")

  // Debounce the search box into the URL.
  useEffect(() => {
    const current = searchParams.get("q") ?? ""
    if (query.trim() === current) return
    const id = setTimeout(() => update({ q: query.trim() }, { resetPage: true }), 300)
    return () => clearTimeout(id)
  }, [query, searchParams, update])

  const regionItems = [{ value: ALL, label: "All regions" }, ...regions.map((r) => ({ value: r.id, label: r.name }))]

  return (
    <div className="flex gap-2">
      <InputGroup className="min-w-0 flex-1">
        <InputGroupInput
          placeholder="Search countries…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search countries"
        />
        <InputGroupAddon>{isPending ? <Spinner /> : <SearchIcon />}</InputGroupAddon>
      </InputGroup>

      <Select
        items={regionItems}
        value={searchParams.get("region") ?? ALL}
        onValueChange={(value) => update({ region: value === ALL ? null : (value as string) }, { resetPage: true })}
      >
        <SelectTrigger aria-label="Region" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {regionItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
