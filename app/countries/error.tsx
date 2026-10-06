"use client"

import { PageContainer } from "@/components/layout/PageContainer"
import { RouteError } from "@/components/RouteError"

export default function CountriesError(props: React.ComponentProps<typeof RouteError>) {
  return (
    <PageContainer>
      <RouteError {...props} />
    </PageContainer>
  )
}
