"use client"

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

export function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudOffIcon />
        </EmptyMedia>
        <EmptyTitle>Couldn&apos;t load data</EmptyTitle>
        <EmptyDescription>
          The World Bank API may be slow or unavailable right now.
          {error.digest && <span className="block text-xs">Ref: {error.digest}</span>}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => retry()}>Try again</Button>
      </EmptyContent>
    </Empty>
  )
}
