"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { select } from "d3-selection"
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom"

import { MAP_WIDTH } from "../helpers/geo"

/**
 * d3-zoom wheel/drag/pinch on the map's <svg>. `onPanStart` fires when a
 * gesture begins (the map moves under the cursor, so tooltips should hide);
 * `isPanning` lets hover handlers ignore events mid-gesture.
 */
export function useMapZoom(svgRef: RefObject<SVGSVGElement | null>, height: number, onPanStart: () => void) {
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity)
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const panningRef = useRef(false)
  const onPanStartRef = useRef(onPanStart)

  useEffect(() => {
    onPanStartRef.current = onPanStart
  })

  useEffect(() => {
    if (!svgRef.current) return
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      // Slack around the world so it can be dragged even at the default zoom.
      .translateExtent([
        [-MAP_WIDTH * 0.5, -height * 0.5],
        [MAP_WIDTH * 1.5, height * 1.5],
      ])
      .on("start", () => {
        panningRef.current = true
        onPanStartRef.current()
      })
      .on("end", () => {
        panningRef.current = false
      })
      .on("zoom", (event: { transform: ZoomTransform }) => setTransform(event.transform))
    behaviorRef.current = behavior
    const svg = select(svgRef.current)
    svg.call(behavior).on("dblclick.zoom", null)
    return () => {
      svg.on(".zoom", null)
    }
  }, [svgRef, height])

  const zoomBy = useCallback(
    (factor: number) => {
      if (svgRef.current && behaviorRef.current) select(svgRef.current).call(behaviorRef.current.scaleBy, factor)
    },
    [svgRef]
  )
  const reset = useCallback(() => {
    if (svgRef.current && behaviorRef.current) select(svgRef.current).call(behaviorRef.current.transform, zoomIdentity)
  }, [svgRef])
  const isPanning = useCallback(() => panningRef.current, [])

  return { transform, zoomBy, reset, isPanning }
}
