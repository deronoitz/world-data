"use client"

import { useMemo } from "react"
import { NotebookPenIcon } from "lucide-react"
import { useShallow } from "zustand/react/shallow"

import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Separator } from "@/components/ui/Separator"
import { Skeleton } from "@/components/ui/Skeleton"
import { useLibraryList, useUserData } from "@/stores/user-data-store"

import { NoteEditor } from "./NoteEditor"
import { NoteItem } from "./NoteItem"

export function CountryNotes({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const loadState = useLibraryList(`notes:${countryCode}`)
  const { user, addNote, updateNote, deleteNote, requireUser } = useUserData(
    useShallow((s) => ({
      user: s.user,
      addNote: s.addNote,
      updateNote: s.updateNote,
      deleteNote: s.deleteNote,
      requireUser: s.requireUser,
    }))
  )
  const allNotes = useUserData((s) => s.notes)
  const notes = useMemo(() => allNotes.filter((n) => n.country_code === countryCode), [allNotes, countryCode])

  return (
    <Card>
      <CardHeader>
        <CardTitle>My notes</CardTitle>
        <CardDescription>Private notes about {countryName}.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!user ? (
          <EmptyState
            icon={NotebookPenIcon}
            title="Keep notes on countries"
            className="border-0 p-4"
            action={
              <Button variant="outline" onClick={() => requireUser("Sign in to write notes.")}>
                Sign in
              </Button>
            }
          >
            Sign in to write private notes.
          </EmptyState>
        ) : (
          <>
            <NoteEditor submitLabel="Add note" onSubmit={(body) => addNote(countryCode, body)} />
            {loadState === "loading" ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              notes.length > 0 && (
                <div className="flex flex-col gap-3">
                  {notes.map((note, i) => (
                    <div key={note.id} className="flex flex-col gap-3">
                      {i > 0 && <Separator />}
                      <NoteItem
                        note={note}
                        onUpdate={(body) => updateNote(note.id, body)}
                        onDelete={() => void deleteNote(note.id)}
                      />
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
