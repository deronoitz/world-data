// World Bank API payloads for page / server-data tests.

export const WB = "https://api.worldbank.org/v2"

const ref = (id: string, value = id) => ({ id, iso2code: "", value })

/** A raw `/country` row. Pass `region: "NA"` for an aggregate such as "World". */
export function wbCountry(
  id: string,
  name: string,
  {
    iso2 = id.slice(0, 2),
    region = ["EAS", "East Asia & Pacific"],
    capital = "",
    lat = "",
    lng = "",
  }: { iso2?: string; region?: [string, string]; capital?: string; lat?: string; lng?: string } = {}
) {
  return {
    id,
    iso2Code: iso2,
    name,
    region: ref(...region),
    adminregion: ref(""),
    incomeLevel: ref("UMC", "Upper middle income"),
    lendingType: ref("IBD"),
    capitalCity: capital,
    longitude: lng,
    latitude: lat,
  }
}

/** A raw indicator observation row. */
export function wbObservation(iso3: string, date: string | number, value: number | null, indicator = "SP.POP.TOTL") {
  return {
    indicator: { id: indicator, value: "" },
    country: { id: iso3.slice(0, 2), value: iso3 },
    countryiso3code: iso3,
    date: String(date),
    value,
    obs_status: "",
    decimal: 0,
  }
}

/** `[meta, rows]` as the World Bank API returns it. */
export function wbPage<T>(rows: T[], meta: { page?: number; pages?: number; total?: number } = {}) {
  return [{ page: 1, pages: 1, per_page: 50, total: rows.length, ...meta }, rows]
}
