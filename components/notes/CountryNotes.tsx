"use client"

import { useMemo } from "react"
import { NotebookPenIcon } from "lucide-react"
import { useShallow } from "zustand/react/shallow"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/Empty"
import { Separator } from "@/components/ui/Separator"
import { Skeleton } from "@/components/ui/Skeleton"
import { useUserData } from "@/stores/user-data-store"

import { NoteEditor } from "./NoteEditor"
import { NoteItem } from "./NoteItem"

export function CountryNotes({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const { user, status, addNote, requireUser } = useUserData(
    useShallow((s) => ({ user: s.user, status: s.status, addNote: s.addNote, requireUser: s.requireUser }))
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
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <NotebookPenIcon />
              </EmptyMedia>
              <EmptyTitle>Keep notes on countries</EmptyTitle>
              <EmptyDescription>Sign in to write private notes.</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={() => requireUser("Sign in to write notes.")}>
              Sign in
            </Button>
          </Empty>
        ) : (
          <>
            <NoteEditor submitLabel="Add note" onSubmit={(body) => addNote(countryCode, body)} />
            {status === "loading" ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              notes.length > 0 && (
                <div className="flex flex-col gap-3">
                  {notes.map((note, i) => (
                    <div key={note.id} className="flex flex-col gap-3">
                      {i > 0 && <Separator />}
                      <NoteItem note={note} />
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
