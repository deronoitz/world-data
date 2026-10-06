"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { ChartLineIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { useCompare } from "@/stores/compare-store"

/** Floating tray listing countries queued for comparison (all pages but /compare). */
export function CompareTray() {
  const pathname = usePathname()
  const countries = useCompare((s) => s.countries)
  const remove = useCompare((s) => s.remove)
  const clear = useCompare((s) => s.clear)

  if (countries.length === 0 || pathname.startsWith("/compare")) return null

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-4 z-40 flex justify-center px-4",
        // On the map page, center within the map area right of the floating list.
        pathname === "/countries" && "lg:left-[432px] lg:right-4"
      )}
    >
      <div className="flex max-w-full items-center gap-2 rounded-xl border bg-popover p-2 pl-3 text-popover-foreground shadow-lg">
        <span className="text-sm text-muted-foreground">Compare</span>
        <div className="flex flex-wrap items-center gap-1">
          {countries.map((code) => (
            <Badge key={code} variant="secondary" className="gap-1 pr-1">
              {code}
              <button
                type="button"
                onClick={() => remove(code)}
                aria-label={`Remove ${code} from comparison`}
                className="rounded-sm opacity-60 hover:opacity-100"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear
        </Button>
        <Button
          size="sm"
          disabled={countries.length < 2}
          nativeButton={false}
          render={<Link href={`/compare?c=${countries.join(",")}`} />}
        >
          <ChartLineIcon data-icon="inline-start" />
          Compare {countries.length}
        </Button>
      </div>
    </div>
  )
}
