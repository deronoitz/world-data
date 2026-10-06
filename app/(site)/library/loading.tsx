import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-96 max-w-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </>
  )
}
