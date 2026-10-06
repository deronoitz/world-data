import Link from "next/link"
import { CircleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/Empty"

export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const { reason } = await searchParams
  return (
    <Empty className="mx-auto max-w-md">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Sign in failed</EmptyTitle>
        <EmptyDescription>
          {typeof reason === "string" ? reason : "Something went wrong while signing you in."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href="/login" />} nativeButton={false}>
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}
