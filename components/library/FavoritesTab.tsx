"use client"

import Link from "next/link"
import { StarIcon } from "lucide-react"

import { FavoriteButton } from "@/components/countries/FavoriteButton"
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/Card"
import { flagEmoji } from "@/lib/format"
import { useUserData } from "@/stores/user-data-store"

import type { CountryLookup } from "./helpers/types"
import { LibraryEmptyState } from "./LibraryEmptyState"

export function FavoritesTab({ countries }: { countries: CountryLookup }) {
  const favorites = useUserData((s) => s.favorites)

  if (favorites.length === 0) {
    return (
      <LibraryEmptyState icon={StarIcon} title="No favorites yet">
        Star countries in the list or on a country page.
      </LibraryEmptyState>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((code) => (
        <Card key={code} size="sm">
          <CardHeader>
            <CardTitle>
              <Link href={`/countries/${code}`} className="flex items-center gap-2 hover:underline">
                <span className="text-xl" aria-hidden="true">
                  {countries[code] ? flagEmoji(countries[code].iso2) : ""}
                </span>
                {countries[code]?.name ?? code}
              </Link>
            </CardTitle>
            <CardAction>
              <FavoriteButton code={code} name={countries[code]?.name ?? code} />
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
