import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { LibraryView } from "@/components/library/LibraryView"
import { getUser } from "@/lib/server/auth/session"
import { getCountries } from "@/lib/server/worldbank/queries"

export const metadata: Metadata = { title: "My library" }

export default async function LibraryPage() {
  await connection()
  const user = await getUser()
  if (!user) redirect("/login?next=/library")

  const countries = await getCountries()
  const lookup = Object.fromEntries(countries.map((c) => [c.code, { name: c.name, iso2: c.iso2 }]))

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">My library</h1>
        <p className="text-muted-foreground">
          Favorites, saved comparisons, pinned indicators and notes for{" "}
          {user.email ?? "your account"}.
        </p>
      </div>
      <LibraryView countries={lookup} />
    </>
  )
}
