import Link from "next/link"
import { GlobeIcon } from "lucide-react"

import { UserMenu } from "@/components/auth/UserMenu"

import { MainNav } from "./MainNav"
import { ThemeToggle } from "./ThemeToggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-4">
        <Link href="/countries" aria-label="World Data Explorer" className="flex items-center gap-2 font-semibold">
          <GlobeIcon className="size-5" />
          <span className="hidden sm:inline">World Data Explorer</span>
        </Link>
        <MainNav />
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
