import type { comparisons, countryNotes, favoriteCountries, savedIndicators } from "./schema"

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
