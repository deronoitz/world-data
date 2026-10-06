import type { NoteRow } from "@/lib/db/types"

import type { CountryLookup } from "./types"

/** Notes grouped by country, countries sorted by name. */
export function groupNotesByCountry(notes: NoteRow[], countries: CountryLookup): [string, NoteRow[]][] {
  const groups = new Map<string, NoteRow[]>()
  for (const note of notes) groups.set(note.country_code, [...(groups.get(note.country_code) ?? []), note])
  const name = (code: string) => countries[code]?.name ?? code
  return [...groups].sort(([a], [b]) => name(a).localeCompare(name(b)))
}
