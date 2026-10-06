"use client"

import { toast } from "sonner"
import { create } from "zustand"

import { api } from "@/lib/api/client"
import type { ComparisonRow, NoteRow, SavedIndicatorRow, FavoriteRow } from "@/lib/db/types"

export type SessionUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
}

type Status = "signed-out" | "loading" | "ready" | "error"

export type NewComparison = Pick<
  ComparisonRow,
  "name" | "country_codes" | "indicator_code" | "year_from" | "year_to"
>

type UserDataState = {
  user: SessionUser | null
  /** True once the initial session check finished. */
  authReady: boolean
  status: Status
  favorites: string[]
  savedIndicators: string[]
  comparisons: ComparisonRow[]
  notes: NoteRow[]
  signInPrompt: string | null

  setUser: (user: SessionUser | null) => void
  hydrate: () => Promise<void>
  reset: () => void
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
  favorites: [] as string[],
  savedIndicators: [] as string[],
  comparisons: [] as ComparisonRow[],
  notes: [] as NoteRow[],
}

function fail(message: string, error: unknown) {
  toast.error(message, { description: error instanceof Error ? error.message : undefined })
}

export const useUserData = create<UserDataState>()((set, get) => ({
  user: null,
  authReady: false,
  status: "signed-out",
  ...EMPTY,
  signInPrompt: null,

  setUser: (user) => {
    const previous = get().user
    set({ user, authReady: true })
    if (!user) get().reset()
    else if (previous?.id !== user.id) void get().hydrate()
  },

  hydrate: async () => {
    set({ status: "loading" })
    try {
      const [favorites, indicators, comparisons, notes] = await Promise.all([
        api<FavoriteRow[]>("/api/favorites"),
        api<SavedIndicatorRow[]>("/api/indicators"),
        api<ComparisonRow[]>("/api/comparisons"),
        api<NoteRow[]>("/api/notes"),
      ])
      set({
        status: "ready",
        favorites: favorites.map((f) => f.country_code),
        savedIndicators: indicators.map((i) => i.indicator_code),
        comparisons,
        notes,
      })
    } catch (error) {
      set({ status: "error" })
      fail("Could not load your library", error)
    }
  },

  reset: () => set({ status: "signed-out", ...EMPTY }),

  requireUser: (reason) => {
    if (get().user) return true
    set({ signInPrompt: reason })
    return false
  },
  closeSignInPrompt: () => set({ signInPrompt: null }),

  toggleFavorite: async (code) => {
    if (!get().requireUser("Sign in to save favorite countries.")) return
    const wasFavorite = get().favorites.includes(code)
    const before = get().favorites
    set({ favorites: wasFavorite ? before.filter((c) => c !== code) : [code, ...before] })
    try {
      if (wasFavorite) await api(`/api/favorites/${code}`, { method: "DELETE" })
      else await api("/api/favorites", { method: "POST", body: { country_code: code } })
    } catch (error) {
      set({ favorites: before })
      fail("Could not update favorites", error)
    }
  },

  togglePinnedIndicator: async (code) => {
    if (!get().requireUser("Sign in to pin indicators.")) return
    const before = get().savedIndicators
    const pinned = before.includes(code)
    set({ savedIndicators: pinned ? before.filter((c) => c !== code) : [...before, code] })
    try {
      if (pinned) await api(`/api/indicators/${encodeURIComponent(code)}`, { method: "DELETE" })
      else await api("/api/indicators", { method: "POST", body: { indicator_code: code } })
    } catch (error) {
      set({ savedIndicators: before })
      fail("Could not update pinned indicators", error)
    }
  },

  reorderIndicators: async (order) => {
    const before = get().savedIndicators
    set({ savedIndicators: order })
    try {
      await api("/api/indicators", { method: "PUT", body: { order } })
    } catch (error) {
      set({ savedIndicators: before })
      fail("Could not reorder indicators", error)
    }
  },

  saveComparison: async (input) => {
    if (!get().requireUser("Sign in to save comparisons.")) return null
    try {
      const row = await api<ComparisonRow>("/api/comparisons", { method: "POST", body: input })
      set({ comparisons: [row, ...get().comparisons] })
      toast.success("Comparison saved", { description: row.name })
      return row
    } catch (error) {
      fail("Could not save comparison", error)
      return null
    }
  },

  renameComparison: async (id, name) => {
    const before = get().comparisons
    set({ comparisons: before.map((c) => (c.id === id ? { ...c, name } : c)) })
    try {
      await api(`/api/comparisons/${id}`, { method: "PATCH", body: { name } })
    } catch (error) {
      set({ comparisons: before })
      fail("Could not rename comparison", error)
    }
  },

  deleteComparison: async (id) => {
    const before = get().comparisons
    set({ comparisons: before.filter((c) => c.id !== id) })
    try {
      await api(`/api/comparisons/${id}`, { method: "DELETE" })
    } catch (error) {
      set({ comparisons: before })
      fail("Could not delete comparison", error)
    }
  },

  addNote: async (countryCode, body) => {
    if (!get().requireUser("Sign in to write notes.")) return false
    try {
      const row = await api<NoteRow>("/api/notes", {
        method: "POST",
        body: { country_code: countryCode, body },
      })
      set({ notes: [row, ...get().notes] })
      return true
    } catch (error) {
      fail("Could not save note", error)
      return false
    }
  },

  updateNote: async (id, body) => {
    const before = get().notes
    set({ notes: before.map((n) => (n.id === id ? { ...n, body } : n)) })
    try {
      const row = await api<NoteRow>(`/api/notes/${id}`, { method: "PATCH", body: { body } })
      set({ notes: get().notes.map((n) => (n.id === id ? row : n)) })
      return true
    } catch (error) {
      set({ notes: before })
      fail("Could not update note", error)
      return false
    }
  },

  deleteNote: async (id) => {
    const before = get().notes
    set({ notes: before.filter((n) => n.id !== id) })
    try {
      await api(`/api/notes/${id}`, { method: "DELETE" })
    } catch (error) {
      set({ notes: before })
      fail("Could not delete note", error)
    }
  },
}))

export const useIsFavorite = (code: string) =>
  useUserData((s) => s.favorites.includes(code))
