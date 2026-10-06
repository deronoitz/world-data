// The signed-in user's library: favorites, pinned indicators, saved comparisons
// and notes. Limits here are also enforced by database checks (server/db/schema.ts).

import type { comparisons, countryNotes, favoriteCountries, savedIndicators } from "@/lib/server/db/schema"

export const MIN_COMPARE = 2
export const MAX_COMPARE = 6
export const COMPARISON_NAME_MAX = 120
export const NOTE_BODY_MAX = 5000

/** A row as it arrives over the API: timestamps are ISO strings after JSON encoding. */
type Json<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] }

export type FavoriteRow = Json<typeof favoriteCountries.$inferSelect>
export type SavedIndicatorRow = Json<typeof savedIndicators.$inferSelect>
export type ComparisonRow = Json<typeof comparisons.$inferSelect>
export type NoteRow = Json<typeof countryNotes.$inferSelect>

/** Fields a comparison PATCH may change. */
export type ComparisonUpdate = Partial<
  Pick<typeof comparisons.$inferInsert, "name" | "country_codes" | "indicator_code" | "year_from" | "year_to">
>

export type NewComparison = Pick<
  ComparisonRow,
  "name" | "country_codes" | "indicator_code" | "year_from" | "year_to"
>
