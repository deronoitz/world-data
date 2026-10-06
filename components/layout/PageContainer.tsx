import { cn } from "@/lib/utils"

/** Centered content column used by every page except the full-bleed map. */
export function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 pb-24", className)}
      {...props}
    />
  )
}
