"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { StarIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useIsFavorite, useUserData } from "@/stores/user-data-store"

export function FavoriteButton({
  code,
  name,
  withLabel = false,
}: {
  code: string
  name: string
  withLabel?: boolean
}) {
  const isFavorite = useIsFavorite(code)
  const toggle = useUserData((s) => s.toggleFavorite)
  const router = useRouter()
  const searchParams = useSearchParams()
  const label = isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`

  return (
    <Button
      variant={withLabel ? "outline" : "ghost"}
      size={withLabel ? "default" : "icon-sm"}
      // With a visible label, the button's name must match its text (WCAG 2.5.3).
      aria-label={withLabel ? undefined : label}
      aria-pressed={isFavorite}
      title={label}
      onClick={async () => {
        await toggle(code)
        // The Favorites tab is filtered on the server; refresh so the row drops out.
        if (searchParams.get("tab") === "favorites") router.refresh()
      }}
    >
      <StarIcon
        data-icon={withLabel ? "inline-start" : undefined}
        className={cn(isFavorite && "fill-current text-chart-4")}
      />
      {withLabel && (isFavorite ? "Favorited" : "Favorite")}
    </Button>
  )
}
