"use client"

import { CheckIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/Button"
import { MAX_COMPARE, useCompare } from "@/stores/compare-store"

export function CompareButton({
  code,
  name,
  withLabel = false,
}: {
  code: string
  name: string
  withLabel?: boolean
}) {
  const selected = useCompare((s) => s.countries.includes(code))
  const toggle = useCompare((s) => s.toggle)
  const label = selected ? `Remove ${name} from comparison` : `Add ${name} to comparison`

  function onClick() {
    if (!toggle(code)) toast.warning(`You can compare up to ${MAX_COMPARE} countries`)
  }

  const Icon = selected ? CheckIcon : PlusIcon
  return (
    <Button
      variant={withLabel ? "outline" : "ghost"}
      size={withLabel ? "default" : "icon-sm"}
      // With a visible label, the button's name must match its text (WCAG 2.5.3).
      aria-label={withLabel ? undefined : label}
      aria-pressed={selected}
      title={label}
      onClick={onClick}
    >
      <Icon data-icon={withLabel ? "inline-start" : undefined} />
      {withLabel && (selected ? "In comparison" : "Compare")}
    </Button>
  )
}
