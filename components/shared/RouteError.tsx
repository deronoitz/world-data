"use client"

import { Button } from "@/components/ui/Button"

import { ErrorState } from "./ErrorState"

export function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState title="Couldn't load data" action={<Button onClick={() => retry()}>Try again</Button>}>
      The World Bank API may be slow or unavailable right now.
      {error.digest && <span className="block text-xs">Ref: {error.digest}</span>}
    </ErrorState>
  )
}
