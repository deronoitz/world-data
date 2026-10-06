import { geoMercator, geoPath } from "d3-geo"
import type { Feature, FeatureCollection, Geometry } from "geojson"
import { feature } from "topojson-client"
import type { GeometryCollection, Topology } from "topojson-specification"

export type CountryProps = { name: string; iso3: string | null }
export type CountryFeature = Feature<Geometry, CountryProps>
/** Pre-processed by scripts/build-geo.mts: Antarctica removed, ISO3 on every country. */
export type WorldTopology = Topology<{ countries: GeometryCollection<CountryProps> }>

export const MAP_WIDTH = 960
const PAD = 8

/** Mercator fitted to the land; shared by the client map, the server locator and the build script. */
export function buildGeometry(topology: WorldTopology) {
  const collection = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, CountryProps>
  const features = collection.features as CountryFeature[]
  const land = { type: "FeatureCollection" as const, features }
  const projection = geoMercator().fitWidth(MAP_WIDTH - PAD * 2, land)
  const [tx, ty] = projection.translate()
  projection.translate([tx + PAD, ty + PAD])
  const path = geoPath(projection)
  // The viewBox height follows Mercator's real aspect so the map is never distorted.
  const height = Math.ceil(path.bounds(land)[1][1] + PAD)
  return { features, projection, path, height }
}

export type MapGeometry = ReturnType<typeof buildGeometry>
