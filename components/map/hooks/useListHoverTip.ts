"use client"

import { useLayoutEffect, useMemo, useState, type RefObject } from "react"
import type { ZoomTransform } from "d3-zoom"

import { useMapHover } from "@/stores/map-hover-store"

import type { MapGeometry } from "../helpers/geo"
import type { MapCountry, MapTip } from "../helpers/types"

/**
 * The country hovered in the side list: its feature (to outline), or a point
 * for economies too small for the 110m geometry, plus a tooltip positioned at
 * that spot in container pixels.
 */
export function useListHoverTip({
  geometry,
  countries,
  transform,
  svgRef,
  containerRef,
}: {
  geometry: MapGeometry | null
  countries: Record<string, MapCountry>
  transform: ZoomTransform
  svgRef: RefObject<SVGSVGElement | null>
  containerRef: RefObject<HTMLDivElement | null>
}) {
  const code = useMapHover((s) => s.hovered)
  const [tip, setTip] = useState<MapTip | null>(null)

  const country = code ? countries[code] : undefined
  const feature = useMemo(
    () => (geometry && code ? geometry.features.find((f) => f.properties.iso3 === code) : undefined),
    [geometry, code]
  )
  const point = useMemo<[number, number] | null>(() => {
    if (!geometry) return null
    if (feature) return geometry.path.centroid(feature)
    if (country?.lat != null && country.lng != null) return geometry.projection([country.lng, country.lat])
    return null
  }, [geometry, feature, country])

  useLayoutEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    const ctm = svgRef.current?.getScreenCTM()
    if (!code || !country || !point || !rect || !ctm) {
      setTip(null)
      return
    }
    const [x, y] = transform.apply(point)
    const screen = new DOMPoint(x, y).matrixTransform(ctm)
    setTip({ code, name: country.name, x: screen.x - rect.left, y: screen.y - rect.top })
  }, [code, country, point, transform, svgRef, containerRef])

  return { code, feature, point, tip }
}
