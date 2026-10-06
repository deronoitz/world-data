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
import { firstParam } from "@/lib/countries"

// Auth.js redirects here with ?error=<type>.
// https://authjs.dev/reference/core/errors
const MESSAGES: Record<string, string> = {
  AccessDenied: "Access was denied. You may have cancelled the Google sign in.",
  Configuration: "Sign in is misconfigured on the server. Please try again later.",
  Verification: "The sign in link is no longer valid.",
  OAuthAccountNotLinked:
    "This email is already registered without this Google account linked. Sign in the way you did before.",
  CredentialsSignin: "Dev login failed. Check that the database is running.",
}

export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const error = firstParam((await searchParams).error)
  return (
    <Empty className="mx-auto max-w-md">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Sign in failed</EmptyTitle>
        <EmptyDescription>
          {(error && MESSAGES[error]) || "Something went wrong while signing you in."}
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
