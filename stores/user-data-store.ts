"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { create } from "zustand"

import { comparisonsApi, favoritesApi, indicatorsApi, notesApi } from "@/lib/client/api/library"
import type { ComparisonRow, NewComparison, NoteRow } from "@/lib/domain/library"
import type { SessionUser } from "@/lib/domain/user"

/**
 * A list fetched on first use: the components that show it call `useLibraryList`
 * with its key. "notes" is every note (the library); "notes:IDN" is one country's.
 */
export type ListKey = "favorites" | "indicators" | "comparisons" | "notes" | `notes:${string}`
export type LoadState = "loading" | "ready" | "error"

type UserDataState = {
  user: SessionUser | null
  /** True once the initial session check finished. */
  authReady: boolean
  /** The account the loaded lists belong to (null: none yet). */
  owner: string | null
  loads: Partial<Record<ListKey, LoadState>>
  favorites: string[]
  savedIndicators: string[]
  comparisons: ComparisonRow[]
  notes: NoteRow[]
  signInPrompt: string | null

  setUser: (user: SessionUser | null) => void
  /** Fetches a list unless it's loaded or loading. No-op when signed out. */
  load: (key: ListKey) => Promise<void>
  /** Favorites the server already read for this page, so the browser needn't fetch them. */
  seedFavorites: (userId: string, codes: string[]) => void
  /** Returns false (and opens the sign-in dialog) when signed out. */
  requireUser: (reason: string) => boolean
  closeSignInPrompt: () => void

  toggleFavorite: (code: string) => Promise<void>
  togglePinnedIndicator: (code: string) => Promise<void>
  reorderIndicators: (order: string[]) => Promise<void>
  saveComparison: (input: NewComparison) => Promise<ComparisonRow | null>
  renameComparison: (id: string, name: string) => Promise<void>
  deleteComparison: (id: string) => Promise<void>
  addNote: (countryCode: string, body: string) => Promise<boolean>
  updateNote: (id: string, body: string) => Promise<boolean>
  deleteNote: (id: string) => Promise<void>
}

const EMPTY = {
  loads: {} as Partial<Record<ListKey, LoadState>>,
  favorites: [] as string[],
  savedIndicators: [] as string[],
  comparisons: [] as ComparisonRow[],
  notes: [] as NoteRow[],
}

function fail(message: string, error: unknown) {
  toast.error(message, { description: error instanceof Error ? error.message : undefined })
}

/**
 * Puts `item` back at `index` unless it's already there. Rollbacks undo only the
 * one change that failed, so concurrent changes to the same list survive.
 */
function restoreAt<T>(list: T[], item: T, index: number, same: (a: T) => boolean): T[] {
  if (list.some(same)) return list
  return [...list.slice(0, index), item, ...list.slice(index)]
}

type ListPatch = Partial<UserDataState> | ((state: UserDataState) => Partial<UserDataState>)

async function fetchList(key: ListKey): Promise<ListPatch> {
  switch (key) {
    case "favorites":
      return { favorites: (await favoritesApi.list()).map((f) => f.country_code) }
    case "indicators":
      return { savedIndicators: (await indicatorsApi.list()).map((i) => i.indicator_code) }
    case "comparisons":
      return { comparisons: await comparisonsApi.list() }
    case "notes":
      return { notes: await notesApi.list() }
    default: {
      // Replace just this country's notes, keeping any others already loaded.
      const country = key.slice("notes:".length)
      const rows = await notesApi.list(country)
      return (s) => ({ notes: [...rows, ...s.notes.filter((n) => n.country_code !== country)] })
    }
  }
}

export const useUserData = create<UserDataState>()((set, get) => ({
  user: null,
  authReady: false,
  owner: null,
  ...EMPTY,
  signInPrompt: null,

  setUser: (user) => {
    set({ user, authReady: true })
    // Lists belong to one account: signing out or another account starts empty,
    // and its lists load as components ask for them. Lists the server seeded for
    // this same account before the session arrived are kept.
    const id = user?.id ?? null
    if (get().owner !== id) set({ ...EMPTY, owner: id })
  },

  seedFavorites: (userId, codes) => {
    const { user, owner } = get()
    if (user && user.id !== userId) return
    if (owner !== userId) set({ ...EMPTY, owner: userId })
    // Once loaded, the store has the newest state (including in-flight toggles).
    if (get().loads.favorites === "ready") return
    set((s) => ({ favorites: codes, loads: { ...s.loads, favorites: "ready" } }))
  },

  load: async (key) => {
    const { user, loads } = get()
    if (!user || loads[key] === "loading" || loads[key] === "ready") return
    // Every note is already here, so one country's notes are too.
    if (key.startsWith("notes:") && loads.notes === "ready") return
    const setLoad = (state: LoadState) => set((s) => ({ loads: { ...s.loads, [key]: state } }))

    setLoad("loading")
    try {
      const patch = await fetchList(key)
      // Signed out or switched account while the request was in flight.
      if (get().user?.id !== user.id) return
      set(patch)
      setLoad("ready")
    } catch (error) {
      if (get().user?.id !== user.id) return
      setLoad("error")
      fail("Could not load your library", error)
    }
  },

  requireUser: (reason) => {
    if (get().user) return true
    set({ signInPrompt: reason })
    return false
  },
  closeSignInPrompt: () => set({ signInPrompt: null }),

  toggleFavorite: async (code) => {
    if (!get().requireUser("Sign in to save favorite countries.")) return
    const index = get().favorites.indexOf(code)
    const wasFavorite = index !== -1
    set((s) => ({ favorites: wasFavorite ? s.favorites.filter((c) => c !== code) : [code, ...s.favorites] }))
    try {
      if (wasFavorite) await favoritesApi.remove(code)
      else await favoritesApi.add(code)
    } catch (error) {
      set((s) => ({
        favorites: wasFavorite
          ? restoreAt(s.favorites, code, index, (c) => c === code)
          : s.favorites.filter((c) => c !== code),
      }))
      fail("Could not update favorites", error)
    }
  },

  togglePinnedIndicator: async (code) => {
    if (!get().requireUser("Sign in to pin indicators.")) return
    const index = get().savedIndicators.indexOf(code)
    const pinned = index !== -1
    set((s) => ({
      savedIndicators: pinned ? s.savedIndicators.filter((c) => c !== code) : [...s.savedIndicators, code],
    }))
    try {
      if (pinned) await indicatorsApi.unpin(code)
      else await indicatorsApi.pin(code)
    } catch (error) {
      set((s) => ({
        savedIndicators: pinned
          ? restoreAt(s.savedIndicators, code, index, (c) => c === code)
          : s.savedIndicators.filter((c) => c !== code),
      }))
      fail("Could not update pinned indicators", error)
    }
  },

  reorderIndicators: async (order) => {
    if (!get().requireUser("Sign in to reorder indicators.")) return
    const before = get().savedIndicators
    set({ savedIndicators: order })
    try {
      await indicatorsApi.reorder(order)
    } catch (error) {
      // A reorder replaces the whole list, so undo it only if nothing changed since.
      if (get().savedIndicators === order) set({ savedIndicators: before })
      fail("Could not reorder indicators", error)
    }
  },

  saveComparison: async (input) => {
    if (!get().requireUser("Sign in to save comparisons.")) return null
    try {
      const row = await comparisonsApi.create(input)
      set({ comparisons: [row, ...get().comparisons] })
      toast.success("Comparison saved", { description: row.name })
      return row
    } catch (error) {
      fail("Could not save comparison", error)
      return null
    }
  },

  renameComparison: async (id, name) => {
    if (!get().requireUser("Sign in to rename comparisons.")) return
    const oldName = get().comparisons.find((c) => c.id === id)?.name
    if (oldName === undefined) return
    set((s) => ({ comparisons: s.comparisons.map((c) => (c.id === id ? { ...c, name } : c)) }))
    try {
      const row = await comparisonsApi.rename(id, name)
      set((s) => ({ comparisons: s.comparisons.map((c) => (c.id === id ? row : c)) }))
    } catch (error) {
      set((s) => ({ comparisons: s.comparisons.map((c) => (c.id === id ? { ...c, name: oldName } : c)) }))
      fail("Could not rename comparison", error)
    }
  },

  deleteComparison: async (id) => {
    if (!get().requireUser("Sign in to delete comparisons.")) return
    const index = get().comparisons.findIndex((c) => c.id === id)
    if (index === -1) return
    const row = get().comparisons[index]
    set((s) => ({ comparisons: s.comparisons.filter((c) => c.id !== id) }))
    try {
      await comparisonsApi.remove(id)
    } catch (error) {
      set((s) => ({ comparisons: restoreAt(s.comparisons, row, index, (c) => c.id === id) }))
      fail("Could not delete comparison", error)
    }
  },

  addNote: async (countryCode, body) => {
    if (!get().requireUser("Sign in to write notes.")) return false
    try {
      const row = await notesApi.create(countryCode, body)
      set({ notes: [row, ...get().notes] })
      return true
    } catch (error) {
      fail("Could not save note", error)
      return false
    }
  },

  updateNote: async (id, body) => {
    if (!get().requireUser("Sign in to edit notes.")) return false
    const oldBody = get().notes.find((n) => n.id === id)?.body
    if (oldBody === undefined) return false
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, body } : n)) }))
    try {
      const row = await notesApi.update(id, body)
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? row : n)) }))
      return true
    } catch (error) {
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, body: oldBody } : n)) }))
      fail("Could not update note", error)
      return false
    }
  },

  deleteNote: async (id) => {
    if (!get().requireUser("Sign in to delete notes.")) return
    const index = get().notes.findIndex((n) => n.id === id)
    if (index === -1) return
    const row = get().notes[index]
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
    try {
      await notesApi.remove(id)
    } catch (error) {
      set((s) => ({ notes: restoreAt(s.notes, row, index, (n) => n.id === id) }))
      fail("Could not delete note", error)
    }
  },
}))

export const useIsFavorite = (code: string) =>
  useUserData((s) => s.favorites.includes(code))

/**
 * Loads a list when a signed-in user first needs it (and again after switching
 * account). Returns its load state, or undefined while signed out.
 */
export function useLibraryList(key: ListKey): LoadState | undefined {
  const userId = useUserData((s) => s.user?.id)
  const state = useUserData((s) => s.loads[key] ?? (key.startsWith("notes:") ? s.loads.notes : undefined))

  useEffect(() => {
    if (userId) void useUserData.getState().load(key)
  }, [userId, key])

  return userId ? state : undefined
}
