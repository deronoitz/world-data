"use client"

import { useState } from "react"
import { BookmarkPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/Field"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"
import { getIndicator } from "@/lib/domain/indicator"
import { useUserData } from "@/stores/user-data-store"

export function SaveComparisonDialog({
  countryCodes,
  countryNames,
  indicatorCode,
  from,
  to,
}: {
  countryCodes: string[]
  countryNames: string[]
  indicatorCode: string
  from?: number
  to?: number
}) {
  const requireUser = useUserData((s) => s.requireUser)
  const save = useUserData((s) => s.saveComparison)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const defaultName = `${countryNames.join(" vs ")} · ${getIndicator(indicatorCode)?.shortLabel ?? indicatorCode}`
  const [name, setName] = useState(defaultName)

  function openDialog() {
    if (!requireUser("Sign in to save comparisons.")) return
    setName(defaultName.slice(0, 120))
    setOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const row = await save({
      name: name.trim(),
      country_codes: countryCodes,
      indicator_code: indicatorCode,
      year_from: from ?? null,
      year_to: to ?? null,
    })
    setSaving(false)
    if (row) setOpen(false)
  }

  return (
    <>
      <Button onClick={openDialog} disabled={countryCodes.length < 2}>
        <BookmarkPlusIcon data-icon="inline-start" />
        Save comparison
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Save comparison</DialogTitle>
              <DialogDescription>Find it later in My library.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="comparison-name">Name</FieldLabel>
                <Input
                  id="comparison-name"
                  value={name}
                  maxLength={120}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
              <Button type="submit" disabled={!name.trim() || saving}>
                {saving && <Spinner data-icon="inline-start" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
