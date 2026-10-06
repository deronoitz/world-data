import { MapSkeleton, PanelSkeleton } from "@/components/shared/Skeletons"

export default function Loading() {
  return (
    <div className="relative flex flex-col lg:block">
      <div className="h-[min(65dvh,calc(68vw+100px))] lg:h-[calc(100dvh-3.5rem)]">
        <MapSkeleton fullscreen />
      </div>
      <aside className="flex flex-col gap-3 bg-popover p-4 lg:absolute lg:top-4 lg:bottom-4 lg:left-4 lg:w-[400px] lg:rounded-xl lg:border lg:shadow-lg">
        <PanelSkeleton />
      </aside>
    </div>
  )
}
