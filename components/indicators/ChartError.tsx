"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/Spinner"

/**
 * Shown in place of a chart when the World Bank didn't answer in time. The slow
 * request keeps running on the server and gets cached, so a retry a little
 * later usually loads straight away.
 */
export function ChartError() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <ErrorState
      title="Couldn't load this chart"
      className="aspect-video max-h-96"
      action={
        <Button onClick={() => startTransition(() => router.refresh())} disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          Try again
        </Button>
      }
    >
      The World Bank API is taking too long to respond. It&apos;s usually ready if you try again in a
      minute.
    </ErrorState>
  )
}
