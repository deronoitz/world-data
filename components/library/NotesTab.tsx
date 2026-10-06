"use client"

import { useMemo } from "react"
import Link from "next/link"
import { NotebookPenIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/EmptyState"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { flagEmoji, formatDate } from "@/lib/utils/format"
import { useUserData } from "@/stores/user-data-store"

import { groupNotesByCountry } from "./helpers/group-notes"
import type { CountryLookup } from "./helpers/types"

export function NotesTab({ countries }: { countries: CountryLookup }) {
  const notes = useUserData((s) => s.notes)
  const groups = useMemo(() => groupNotesByCountry(notes, countries), [notes, countries])

  if (groups.length === 0) {
    return (
      <EmptyState icon={NotebookPenIcon} title="No notes yet">
        Write notes from any country page.
      </EmptyState>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {groups.map(([code, list]) => (
        <Card key={code} size="sm">
          <CardHeader>
            <CardTitle>
              <Link href={`/countries/${code}`} className="flex items-center gap-2 hover:underline">
                <span aria-hidden="true">{countries[code] ? flagEmoji(countries[code].iso2) : ""}</span>
                {countries[code]?.name ?? code}
              </Link>
            </CardTitle>
            <CardDescription className="flex flex-col gap-3">
              {list.map((note) => (
                <span key={note.id} className="flex flex-col gap-0.5">
                  <span className="line-clamp-3 whitespace-pre-wrap text-foreground">{note.body}</span>
                  <span className="text-xs">{formatDate(note.updated_at)}</span>
                </span>
              ))}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
