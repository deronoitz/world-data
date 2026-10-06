"use client"

import { useState } from "react"

import { Button } from "@/components/ui/Button"
import { Field, FieldDescription } from "@/components/ui/Field"
import { Spinner } from "@/components/ui/Spinner"
import { Textarea } from "@/components/ui/Textarea"

/** Matches country_notes.body varchar(5000). */
const MAX_LENGTH = 5000

export function NoteEditor({
  initial = "",
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: string
  submitLabel: string
  onSubmit: (body: string) => Promise<boolean>
  onCancel?: () => void
}) {
  const [body, setBody] = useState(initial)
  const [saving, setSaving] = useState(false)
  const trimmed = body.trim()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!trimmed || trimmed.length > MAX_LENGTH) return
    setSaving(true)
    const ok = await onSubmit(trimmed)
    setSaving(false)
    if (ok && !initial) setBody("")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Field data-invalid={body.length > MAX_LENGTH || undefined}>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a note about this country…"
          aria-label="Note"
          aria-invalid={body.length > MAX_LENGTH || undefined}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(e)
          }}
        />
        <FieldDescription className="text-xs">
          {body.length}/{MAX_LENGTH} · ⌘/Ctrl + Enter to save
        </FieldDescription>
      </Field>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!trimmed || trimmed.length > MAX_LENGTH || saving}>
          {saving && <Spinner data-icon="inline-start" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
