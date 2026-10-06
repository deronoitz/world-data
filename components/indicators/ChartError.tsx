"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CloudOffIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/Empty"
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
    <Empty className="aspect-video max-h-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudOffIcon />
        </EmptyMedia>
        <EmptyTitle>Couldn&apos;t load this chart</EmptyTitle>
        <EmptyDescription>
          The World Bank API is taking too long to respond. It&apos;s usually ready if you try again
          in a minute.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => startTransition(() => router.refresh())} disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}
