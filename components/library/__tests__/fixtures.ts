import type { ComparisonRow, NoteRow } from "@/lib/supabase/types"

import type { CountryLookup } from "../helpers/types"

export const COUNTRIES: CountryLookup = {
  IDN: { name: "Indonesia", iso2: "ID" },
  FRA: { name: "France", iso2: "FR" },
}

export function comparison(overrides: Partial<ComparisonRow> = {}): ComparisonRow {
  return {
    id: "c1",
    user_id: "u1",
    name: "Indonesia vs France",
    country_codes: ["IDN", "FRA"],
    indicator_code: "SP.POP.TOTL",
    year_from: 2000,
    year_to: 2020,
    created_at: "2026-03-15T12:00:00Z",
    updated_at: "2026-03-15T12:00:00Z",
    ...overrides,
  }
}

export function note(overrides: Partial<NoteRow> = {}): NoteRow {
  return {
    id: "n1",
    user_id: "u1",
    country_code: "IDN",
    body: "Archipelago",
    created_at: "2026-03-15T12:00:00Z",
    updated_at: "2026-03-15T12:00:00Z",
    ...overrides,
  }
}
