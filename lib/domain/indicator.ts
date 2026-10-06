export type IndicatorFormat =
  | "compact"
  | "usd-compact"
  | "usd"
  | "percent"
  | "years"
  | "decimal"

export type Indicator = {
  code: string
  label: string
  shortLabel: string
  format: IndicatorFormat
  /** Color scale for the map: skewed magnitudes read better on a log scale. */
  scale: "log" | "linear"
}

export const INDICATORS = [
  { code: "SP.POP.TOTL", label: "Population", shortLabel: "Population", format: "compact", scale: "log" },
  { code: "NY.GDP.MKTP.CD", label: "GDP (current US$)", shortLabel: "GDP", format: "usd-compact", scale: "log" },
  { code: "NY.GDP.PCAP.CD", label: "GDP per capita (current US$)", shortLabel: "GDP per capita", format: "usd", scale: "log" },
  { code: "SP.DYN.LE00.IN", label: "Life expectancy at birth (years)", shortLabel: "Life expectancy", format: "years", scale: "linear" },
  { code: "NY.GDP.MKTP.KD.ZG", label: "GDP growth (annual %)", shortLabel: "GDP growth", format: "percent", scale: "linear" },
  { code: "FP.CPI.TOTL.ZG", label: "Inflation, consumer prices (annual %)", shortLabel: "Inflation", format: "percent", scale: "linear" },
  { code: "SL.UEM.TOTL.ZS", label: "Unemployment (% of labor force)", shortLabel: "Unemployment", format: "percent", scale: "linear" },
  { code: "EN.GHG.CO2.PC.CE.AR5", label: "CO₂ emissions per capita (t CO₂e)", shortLabel: "CO₂ per capita", format: "decimal", scale: "log" },
  { code: "IT.NET.USER.ZS", label: "Internet users (% of population)", shortLabel: "Internet users", format: "percent", scale: "linear" },
  { code: "SP.URB.TOTL.IN.ZS", label: "Urban population (% of total)", shortLabel: "Urban population", format: "percent", scale: "linear" },
  { code: "SP.DYN.TFRT.IN", label: "Fertility rate (births per woman)", shortLabel: "Fertility rate", format: "decimal", scale: "linear" },
  { code: "EG.ELC.ACCS.ZS", label: "Access to electricity (% of population)", shortLabel: "Electricity access", format: "percent", scale: "linear" },
  { code: "SH.XPD.CHEX.PC.CD", label: "Health expenditure per capita (current US$)", shortLabel: "Health spending", format: "usd", scale: "log" },
  { code: "SE.ADT.LITR.ZS", label: "Adult literacy rate (% ages 15+)", shortLabel: "Literacy rate", format: "percent", scale: "linear" },
] as const satisfies readonly Indicator[]

export type IndicatorCode = (typeof INDICATORS)[number]["code"]

export const DEFAULT_INDICATORS: IndicatorCode[] = [
  "SP.POP.TOTL",
  "NY.GDP.MKTP.CD",
  "NY.GDP.PCAP.CD",
  "SP.DYN.LE00.IN",
]

export const DEFAULT_INDICATOR: IndicatorCode = "NY.GDP.PCAP.CD"

const BY_CODE = new Map<string, Indicator>(INDICATORS.map((i) => [i.code, i]))

export function isIndicatorCode(code: unknown): code is IndicatorCode {
  return typeof code === "string" && BY_CODE.has(code)
}

export function getIndicator(code: string): Indicator | undefined {
  return BY_CODE.get(code)
}

/** Resolve a possibly-invalid search param to a catalog indicator. */
export function resolveIndicator(code: string | undefined | null): Indicator {
  return (code && BY_CODE.get(code)) || BY_CODE.get(DEFAULT_INDICATOR)!
}

// World Bank data, normalized for the app.

export type IndicatorMeta = {
  code: string
  name: string
  sourceNote: string
  sourceOrganization: string
}

export type Observation = {
  /** ISO3 */
  country: string
  year: number
  value: number | null
}

export type LatestValue = { value: number; year: number } | null

export type LatestByCountry = Record<string, { value: number; year: number }>
