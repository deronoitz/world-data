"use client"

import { useState } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { formatDate } from "@/lib/format"
import type { NoteRow } from "@/lib/supabase/types"
import { useUserData } from "@/stores/user-data-store"

import { NoteEditor } from "./NoteEditor"

export function NoteItem({ note }: { note: NoteRow }) {
  const [editing, setEditing] = useState(false)
  const updateNote = useUserData((s) => s.updateNote)
  const deleteNote = useUserData((s) => s.deleteNote)

  if (editing) {
    return (
      <NoteEditor
        initial={note.body}
        submitLabel="Save"
        onCancel={() => setEditing(false)}
        onSubmit={async (body) => {
          const ok = await updateNote(note.id, body)
          if (ok) setEditing(false)
          return ok
        }}
      />
    )
  }

  const edited = note.updated_at !== note.created_at
  return (
    <div className="group flex flex-col gap-1">
      <p className="text-sm whitespace-pre-wrap">{note.body}</p>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>
          {formatDate(note.created_at)}
          {edited && " · edited"}
        </span>
        <Button variant="ghost" size="icon-xs" aria-label="Edit note" onClick={() => setEditing(true)}>
          <PencilIcon />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label="Delete note" onClick={() => void deleteNote(note.id)}>
          <Trash2Icon />
        </Button>
      </div>
    </div>
  )
}
