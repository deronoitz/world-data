import { cn } from "@/lib/utils"

/** One country polygon. Interactive when `onOpen` is set (a World Bank economy). */
export function CountryShape({
  d,
  fill,
  dimmed,
  favorite,
  label,
  onPoint,
  onLeave,
  onOpen,
}: {
  d: string
  fill: string
  dimmed: boolean
  favorite: boolean
  label?: string
  /** Pointer or focus position in client pixels, for the tooltip. */
  onPoint?: (clientX: number, clientY: number) => void
  onLeave: () => void
  onOpen?: () => void
}) {
  const interactive = Boolean(onOpen)
  return (
    <path
      d={d}
      fill={fill}
      fillOpacity={dimmed ? 0.25 : 1}
      stroke={favorite ? "var(--map-highlight)" : "var(--map-stroke)"}
      strokeWidth={favorite ? 1.5 : 0.5}
      vectorEffect="non-scaling-stroke"
      className={cn(
        "outline-none",
        interactive && "cursor-pointer transition-opacity hover:opacity-80 focus-visible:opacity-80"
      )}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "link" : undefined}
      aria-label={interactive ? label : undefined}
      onMouseMove={onPoint && ((e) => onPoint(e.clientX, e.clientY))}
      onFocus={
        onPoint &&
        ((e) => {
          const box = e.currentTarget.getBoundingClientRect()
          onPoint(box.left + box.width / 2, box.top + box.height / 2)
        })
      }
      onBlur={onLeave}
      onClick={onOpen}
      onKeyDown={
        onOpen &&
        ((e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpen()
          }
        })
      }
    />
  )
}
