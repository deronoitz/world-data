import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"

const STEP = 1.6

export function ZoomControls({ onZoom, onReset }: { onZoom: (factor: number) => void; onReset: () => void }) {
  return (
    <div className="absolute top-1/2 right-4 flex -translate-y-1/2 flex-col gap-1">
      <Button variant="outline" size="icon-sm" aria-label="Zoom in" onClick={() => onZoom(STEP)}>
        <PlusIcon />
      </Button>
      <Button variant="outline" size="icon-sm" aria-label="Zoom out" onClick={() => onZoom(1 / STEP)}>
        <MinusIcon />
      </Button>
      <Button variant="outline" size="icon-sm" aria-label="Reset zoom" onClick={onReset}>
        <RotateCcwIcon />
      </Button>
    </div>
  )
}
