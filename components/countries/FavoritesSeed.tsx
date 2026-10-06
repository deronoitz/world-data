"use client"

import { useEffect } from "react"

import { useUserData } from "@/stores/user-data-store"

/**
 * Puts the favorites the server already read into the store, so FavoriteButton
 * and WorldMap don't fetch /api/favorites. Render it before them in the same
 * server output: React runs earlier siblings' effects first, so the store is
 * seeded before they ask for the list.
 */
export function FavoritesSeed({ favorites }: { favorites: { userId: string; codes: string[] } | null }) {
  useEffect(() => {
    if (favorites) useUserData.getState().seedFavorites(favorites.userId, favorites.codes)
  }, [favorites])

  return null
}
