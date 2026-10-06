"use client"

import { useState } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { formatDate } from "@/lib/utils/format"
import type { NoteRow } from "@/lib/domain/library"

import { NoteEditor } from "./NoteEditor"

export function NoteItem({
  note,
  onUpdate,
  onDelete,
}: {
  note: NoteRow
  /** Resolves true when saved, which closes the editor. */
  onUpdate: (body: string) => Promise<boolean>
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <NoteEditor
        initial={note.body}
        submitLabel="Save"
        onCancel={() => setEditing(false)}
        onSubmit={async (body) => {
          const ok = await onUpdate(body)
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
        <Button variant="ghost" size="icon-xs" aria-label="Delete note" onClick={onDelete}>
          <Trash2Icon />
        </Button>
      </div>
    </div>
  )
}
