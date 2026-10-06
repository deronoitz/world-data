import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { GlobeIcon } from "lucide-react"

import { GoogleButton } from "@/components/auth/GoogleButton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { firstParam } from "@/lib/countries"
import { safeNext } from "@/lib/safe-next"
import { getUser } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext(firstParam((await searchParams).next), "/library")
  if (await getUser()) redirect(next)

  return (
    <Card className="mx-auto mt-12 w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <GlobeIcon className="mx-auto size-8" />
        <CardTitle className="text-xl">Sign in to World Data Explorer</CardTitle>
        <CardDescription>
          Save favorite countries, comparisons, pinned indicators and private notes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <GoogleButton next={next} className="w-full" />
        </Suspense>
      </CardContent>
    </Card>
  )
}
