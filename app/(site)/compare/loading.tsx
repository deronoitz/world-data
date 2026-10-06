import { ChartSkeleton } from "@/components/shared/Skeletons"
import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-8 w-full max-w-xl" />
      <ChartSkeleton />
    </>
  )
}
