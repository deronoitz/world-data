"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { SearchXIcon, StarIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/Empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { flagEmoji } from "@/lib/utils/format"
import type { Country } from "@/lib/domain/country"
import { useMapHover } from "@/stores/map-hover-store"

import { CompareButton } from "./CompareButton"
import { FavoriteButton } from "./FavoriteButton"

export function CountryTable({ countries, favoritesTab = false }: { countries: Country[]; favoritesTab?: boolean }) {
  const hovered = useMapHover((s) => s.hovered)
  const setHovered = useMapHover((s) => s.setHovered)
  const router = useRouter()

  if (countries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">{favoritesTab ? <StarIcon /> : <SearchXIcon />}</EmptyMedia>
          <EmptyTitle>{favoritesTab ? "No favorites here" : "No countries found"}</EmptyTitle>
          <EmptyDescription>
            {favoritesTab
              ? "Star a country to add it to your favorites."
              : "Try a different search or region."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Country</TableHead>
          <TableHead>Region</TableHead>
          <TableHead className="w-20">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody onMouseLeave={() => setHovered(null)}>
        {countries.map((country) => (
          <TableRow
            key={country.code}
            data-state={hovered === country.code ? "selected" : undefined}
            className="cursor-pointer"
            // Whole row opens the country; the name stays a real link for keyboard and
            // middle-click, and clicks on the action buttons are left alone.
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a, button")) return
              router.push(`/countries/${country.code}`)
            }}
            onMouseEnter={() => setHovered(country.code)}
            onFocus={() => setHovered(country.code)}
            onBlur={() => setHovered(null)}
          >
            <TableCell className="max-w-40">
              <Link
                href={`/countries/${country.code}`}
                // A page of rows would prefetch 20 country pages (and the chart bundle) on load.
                prefetch={false}
                className="flex items-center gap-2 font-medium outline-none focus-visible:underline"
              >
                <span className="text-base leading-none" aria-hidden="true">
                  {flagEmoji(country.iso2)}
                </span>
                <span className="truncate">{country.name}</span>
              </Link>
            </TableCell>
            <TableCell className="max-w-32 truncate text-muted-foreground">{country.region.name}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-0.5">
                <FavoriteButton code={country.code} name={country.name} />
                <CompareButton code={country.code} name={country.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
