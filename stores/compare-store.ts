"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { MAX_COMPARE } from "@/lib/compare"

export { MAX_COMPARE }

type CompareState = {
  countries: string[]
  add: (code: string) => boolean
  remove: (code: string) => void
  toggle: (code: string) => boolean
  setAll: (codes: string[]) => void
  clear: () => void
}

/** The "compare tray": countries picked while browsing, kept in localStorage. */
export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      countries: [],
      add: (code) => {
        const { countries } = get()
        if (countries.includes(code)) return true
        if (countries.length >= MAX_COMPARE) return false
        set({ countries: [...countries, code] })
        return true
      },
      remove: (code) => set({ countries: get().countries.filter((c) => c !== code) }),
      toggle: (code) => {
        if (get().countries.includes(code)) {
          get().remove(code)
          return true
        }
        return get().add(code)
      },
      setAll: (codes) => set({ countries: [...new Set(codes)].slice(0, MAX_COMPARE) }),
      clear: () => set({ countries: [] }),
    }),
    {
      name: "world-data:compare",
      storage: createJSONStorage(() => localStorage),
      // Rehydrated in StoreHydration after mount to avoid SSR mismatches.
      skipHydration: true,
    }
  )
)
