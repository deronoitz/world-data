import "server-only"

import { readFileSync } from "node:fs"
import path from "node:path"

import { buildGeometry, type MapGeometry, type WorldTopology } from "./geo"
import { WORLD_GEO_URL } from "./world-geo"

let geometry: MapGeometry | null = null

/** Same geometry as the client map, read from the generated asset in /public. */
export function getServerGeometry() {
  geometry ??= buildGeometry(
    JSON.parse(readFileSync(path.join(process.cwd(), "public", WORLD_GEO_URL), "utf8")) as WorldTopology
  )
  return geometry
}
