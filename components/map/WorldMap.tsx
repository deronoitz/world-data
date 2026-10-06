"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { geoPath } from "d3-geo"

import { Skeleton } from "@/components/ui/Skeleton"
import { formatValue } from "@/lib/utils/format"
import type { Indicator } from "@/lib/domain/indicator"
import type { LatestByCountry } from "@/lib/domain/indicator"
import { useLibraryList, useUserData } from "@/stores/user-data-store"

import { CountryShape } from "./CountryShape"
import { buildColorScale } from "./helpers/color-scale"
import { MAP_WIDTH } from "./helpers/geo"
import type { MapCountry, MapTip } from "./helpers/types"
import { WORLD_MAP_HEIGHT } from "./helpers/world-geo"
import { useListHoverTip } from "./hooks/useListHoverTip"
import { useMapZoom } from "./hooks/useMapZoom"
import { useWorldGeometry } from "./hooks/useWorldGeometry"
import { MapLegend } from "./MapLegend"
import { MapTooltip } from "./MapTooltip"
import { ZoomControls } from "./ZoomControls"

export type { MapCountry }

/** Full-bleed interactive choropleth: zoom/pan, hover tooltips, list-hover highlight. */
export function WorldMap({
  countries,
  data,
  indicator,
  region,
}: {
  /** World Bank economies keyed by ISO3: only these are interactive. */
  countries: Record<string, MapCountry>
  data?: LatestByCountry
  indicator?: Indicator
  /** Dim countries outside this region id. */
  region?: string
}) {
  const router = useRouter()
  useLibraryList("favorites")
  const favorites = useUserData((s) => s.favorites)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pointerTip, setPointerTip] = useState<MapTip | null>(null)

  // Geometry arrives from a cached JSON asset after hydration; the frame is
  // already laid out at the right size, so nothing shifts when it lands.
  const { geometry, failed } = useWorldGeometry()
  const height = geometry?.height ?? WORLD_MAP_HEIGHT
  const { transform, zoomBy, reset, isPanning } = useMapZoom(svgRef, height, () => setPointerTip(null))
  const listHover = useListHoverTip({ geometry, countries, transform, svgRef, containerRef })

  // Path strings rounded to 1 decimal: visually identical, about half the markup.
  const draw = useMemo(() => (geometry ? geoPath(geometry.projection).digits(1) : null), [geometry])
  const shapes = useMemo(
    () => (geometry && draw ? geometry.features.map((f) => ({ feature: f, d: draw(f) ?? "" })) : []),
    [geometry, draw]
  )
  const scale = useMemo(
    () => (data && indicator ? buildColorScale(Object.values(data).map((d) => d.value), indicator) : null),
    [data, indicator]
  )

  function showPointerTip(code: string, name: string, clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (isPanning() || !rect) return
    setPointerTip({ code, name, x: clientX - rect.left, y: clientY - rect.top })
  }

  const tip = pointerTip ?? listHover.tip

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={containerRef}
        // Light mode: blue sea behind green land. Dark mode keeps its neutral surface.
        className="relative min-h-0 w-full flex-1 overflow-hidden bg-(--map-sea) dark:bg-muted/40"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full cursor-grab active:cursor-grabbing"
          role="img"
          aria-label={`World map${indicator ? ` colored by ${indicator.label}` : ""}`}
          onMouseLeave={() => setPointerTip(null)}
        >
          <defs>
            <pattern id="map-no-data" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--map-empty)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--map-stroke)" strokeWidth="1.5" />
            </pattern>
          </defs>
          <g transform={transform.toString()}>
            {shapes.map(({ feature, d }, index) => {
              const code = feature.properties.iso3
              const country = code ? countries[code] : undefined
              const value = code ? data?.[code]?.value : undefined
              return (
                <CountryShape
                  key={code ?? `f-${index}`}
                  d={d}
                  fill={value !== undefined && scale ? scale.color(value) : "url(#map-no-data)"}
                  dimmed={Boolean(region && country && country.region !== region)}
                  favorite={code ? favorites.includes(code) : false}
                  label={country && `${country.name}${indicator ? `: ${formatValue(value, indicator.format)}` : ""}`}
                  onPoint={code && country ? (x, y) => showPointerTip(code, country.name, x, y) : undefined}
                  onLeave={() => setPointerTip(null)}
                  onOpen={code && country ? () => router.push(`/countries/${code}`) : undefined}
                />
              )
            })}
            {listHover.feature && draw && (
              <path
                d={draw(listHover.feature) ?? ""}
                fill="none"
                stroke="var(--map-hover)"
                strokeWidth={2.5}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
                data-map-hover={listHover.code}
              />
            )}
            {!listHover.feature && listHover.point && (
              <circle
                cx={listHover.point[0]}
                cy={listHover.point[1]}
                r={5 / transform.k}
                fill="none"
                stroke="var(--map-hover)"
                strokeWidth={2 / transform.k}
                pointerEvents="none"
                className="animate-pulse"
                data-map-hover={listHover.code}
              />
            )}
          </g>
        </svg>

        {!geometry && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            {failed ? (
              "The map couldn't be loaded. Try refreshing the page."
            ) : (
              <Skeleton className="size-full rounded-none opacity-40" />
            )}
          </div>
        )}

        {tip && (
          <MapTooltip
            tip={tip}
            iso2={countries[tip.code]?.iso2}
            indicator={indicator}
            latest={data?.[tip.code]}
          />
        )}

        <ZoomControls onZoom={zoomBy} onReset={reset} />
      </div>

      {indicator && scale && (
        <MapLegend
          thresholds={scale.thresholds}
          max={scale.domain[1]}
          indicator={indicator}
          className="border-t bg-popover p-3 lg:absolute lg:right-4 lg:bottom-4 lg:rounded-lg lg:border lg:bg-popover/90 lg:shadow-sm lg:backdrop-blur"
        />
      )}
    </div>
  )
}
