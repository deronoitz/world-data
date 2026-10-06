import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { GlobeIcon } from "lucide-react"

import { SignInOptions } from "@/components/auth/SignInOptions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { firstParam } from "@/lib/domain/country"
import { safeNext } from "@/lib/utils/safe-next"
import { isDevLoginEnabled, isGoogleConfigured } from "@/lib/server/auth/env"
import { getUser } from "@/lib/server/auth/session"

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
          <SignInOptions providers={{ google: isGoogleConfigured, devLogin: isDevLoginEnabled }} next={next} />
        </Suspense>
      </CardContent>
    </Card>
  )
}
