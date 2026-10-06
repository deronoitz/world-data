"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/countries", label: "Countries" },
  { href: "/compare", label: "Compare" },
  { href: "/library", label: "My library", short: "Library" },
] as const

export function MainNav() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1 text-sm">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:px-2.5",
              active && "bg-muted text-foreground"
            )}
          >
            {"short" in link ? (
              <>
                <span className="sm:hidden">{link.short}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </>
            ) : (
              link.label
            )}
          </Link>
        )
      })}
    </nav>
  )
}
