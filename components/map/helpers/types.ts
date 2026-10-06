export type MapCountry = {
  name: string
  region: string
  iso2?: string
  lat?: number | null
  lng?: number | null
}

/** A tooltip anchored in container pixels. */
export type MapTip = { code: string; name: string; x: number; y: number }
