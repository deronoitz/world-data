"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { flagEmoji, formatDate } from "@/lib/utils/format"
import { getIndicator } from "@/lib/domain/indicator"
import { COMPARISON_NAME_MAX, type ComparisonRow } from "@/lib/domain/library"

import { comparisonHref } from "./helpers/comparison-href"
import type { CountryLookup } from "./helpers/types"

export function ComparisonCard({
  comparison,
  countries,
  onRename,
  onDelete,
}: {
  comparison: ComparisonRow
  countries: CountryLookup
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(comparison.name)
  const indicator = getIndicator(comparison.indicator_code)

  return (
    <Card size="sm">
      <CardHeader>
        {editing ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim()) onRename(name.trim())
              setEditing(false)
            }}
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={COMPARISON_NAME_MAX}
              aria-label="Comparison name"
              autoFocus
            />
            <Button type="submit" size="icon-sm" variant="ghost" aria-label="Save name">
              <CheckIcon />
            </Button>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Cancel" onClick={() => setEditing(false)}>
              <XIcon />
            </Button>
          </form>
        ) : (
          <CardTitle>
            <Link href={comparisonHref(comparison)} className="hover:underline">
              {comparison.name}
            </Link>
          </CardTitle>
        )}
        <CardDescription className="flex flex-col gap-2">
          <span>
            {indicator?.label ?? comparison.indicator_code}
            {(comparison.year_from || comparison.year_to) &&
              ` · ${comparison.year_from ?? "earliest"}–${comparison.year_to ?? "latest"}`}
          </span>
          <span className="flex flex-wrap gap-1">
            {comparison.country_codes.map((code) => (
              <Badge key={code} variant="secondary">
                {countries[code] ? `${flagEmoji(countries[code].iso2)} ${countries[code].name}` : code}
              </Badge>
            ))}
          </span>
          <span className="text-xs">Saved {formatDate(comparison.created_at)}</span>
        </CardDescription>
        {!editing && (
          <CardAction className="flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Rename" onClick={() => setEditing(true)}>
              <PencilIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={onDelete}>
              <Trash2Icon />
            </Button>
          </CardAction>
        )}
      </CardHeader>
    </Card>
  )
}
