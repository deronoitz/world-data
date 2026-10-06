import Link from "next/link"
import { MapPinOffIcon } from "lucide-react"

import { Button } from "@/components/ui/Button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/Empty"

export default function CountryNotFound() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPinOffIcon />
        </EmptyMedia>
        <EmptyTitle>Country not found</EmptyTitle>
        <EmptyDescription>
          That code isn&apos;t a World Bank economy. Codes are ISO3, e.g. IDN or BRA.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link href="/countries" />}>
          Browse countries
        </Button>
      </EmptyContent>
    </Empty>
  )
}
