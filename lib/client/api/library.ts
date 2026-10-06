// Typed calls to the library routes under app/api. The only place in the
// browser that knows their URLs, methods and body shapes.

import type {
  ComparisonRow,
  FavoriteRow,
  NewComparison,
  NoteRow,
  SavedIndicatorRow,
} from "@/lib/domain/library"

import { api } from "./http"

export const favoritesApi = {
  list: () => api<FavoriteRow[]>("/api/favorites"),
  /** Idempotent: an existing favorite comes back as just its code. */
  add: (countryCode: string) =>
    api<Pick<FavoriteRow, "country_code">>("/api/favorites", {
      method: "POST",
      body: { country_code: countryCode },
    }),
  remove: (countryCode: string) => api<void>(`/api/favorites/${countryCode}`, { method: "DELETE" }),
}

export const indicatorsApi = {
  list: () => api<SavedIndicatorRow[]>("/api/indicators"),
  pin: (indicatorCode: string) =>
    api<SavedIndicatorRow>("/api/indicators", { method: "POST", body: { indicator_code: indicatorCode } }),
  unpin: (indicatorCode: string) =>
    api<void>(`/api/indicators/${encodeURIComponent(indicatorCode)}`, { method: "DELETE" }),
  /** `order` must hold exactly the saved codes. */
  reorder: (order: string[]) => api<SavedIndicatorRow[]>("/api/indicators", { method: "PUT", body: { order } }),
}

export const comparisonsApi = {
  list: () => api<ComparisonRow[]>("/api/comparisons"),
  create: (input: NewComparison) => api<ComparisonRow>("/api/comparisons", { method: "POST", body: input }),
  rename: (id: string, name: string) =>
    api<ComparisonRow>(`/api/comparisons/${id}`, { method: "PATCH", body: { name } }),
  remove: (id: string) => api<void>(`/api/comparisons/${id}`, { method: "DELETE" }),
}

export const notesApi = {
  list: () => api<NoteRow[]>("/api/notes"),
  create: (countryCode: string, body: string) =>
    api<NoteRow>("/api/notes", { method: "POST", body: { country_code: countryCode, body } }),
  update: (id: string, body: string) => api<NoteRow>(`/api/notes/${id}`, { method: "PATCH", body: { body } }),
  remove: (id: string) => api<void>(`/api/notes/${id}`, { method: "DELETE" }),
}
