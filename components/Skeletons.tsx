import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Skeleton } from "@/components/ui/Skeleton"

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-px overflow-hidden rounded-lg border">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="hidden h-5 w-40 md:block" />
          <Skeleton className="hidden h-5 w-28 sm:block" />
          <Skeleton className="ml-auto h-7 w-16" />
        </div>
      ))}
    </div>
  )
}

export function MapSkeleton({ fullscreen = false }: { fullscreen?: boolean }) {
  return fullscreen ? (
    <Skeleton className="size-full rounded-none" />
  ) : (
    <Skeleton className="aspect-3/2 w-full rounded-lg" />
  )
}

export function PanelSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-6" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return <Skeleton className="aspect-video max-h-96 w-full rounded-lg" />
}

export function KpiSkeleton() {
  return (
    <Card size="sm">
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  )
}
