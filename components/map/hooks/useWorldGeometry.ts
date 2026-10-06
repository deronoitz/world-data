"use client"

import { useEffect, useState } from "react"

import { buildGeometry, type MapGeometry, type WorldTopology } from "../helpers/geo"
import { WORLD_GEO_URL } from "../helpers/world-geo"

let cached: MapGeometry | null = null
let pending: Promise<MapGeometry> | null = null

function load() {
  // Same URL/mode as the <link rel="preload" as="fetch"> on the countries page, so it reuses that download.
  pending ??= fetch(WORLD_GEO_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Map data failed to load (${res.status})`)
      return res.json() as Promise<WorldTopology>
    })
    .then((topology) => (cached = buildGeometry(topology)))
    .catch((error) => {
      pending = null
      throw error
    })
  return pending
}

/** World geometry fetched from the cached JSON asset (null until it arrives). */
export function useWorldGeometry() {
  const [geometry, setGeometry] = useState<MapGeometry | null>(cached)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (geometry) return
    let active = true
    load().then(
      (g) => active && setGeometry(g),
      () => active && setFailed(true)
    )
    return () => {
      active = false
    }
  }, [geometry])

  return { geometry, failed }
}
