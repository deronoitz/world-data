"use client"

import { create } from "zustand"

/** Country hovered in the countries list; the map highlights it. */
export const useMapHover = create<{
  hovered: string | null
  setHovered: (code: string | null) => void
}>()((set) => ({
  hovered: null,
  setHovered: (hovered) => set({ hovered }),
}))
