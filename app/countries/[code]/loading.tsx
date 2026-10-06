import { ChartSkeleton, KpiSkeleton } from "@/components/Skeletons"
import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <>
      <Skeleton className="h-7 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton />
    </>
  )
}
