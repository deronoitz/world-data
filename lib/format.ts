import type { IndicatorFormat } from "./indicators"

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})
const oneDecimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })
const twoDecimals = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })
const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

export function formatValue(value: number | null | undefined, format: IndicatorFormat): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—"
  switch (format) {
    case "compact":
      return compact.format(value)
    case "usd-compact":
      return usdCompact.format(value)
    case "usd":
      return usd.format(value)
    case "percent":
      return `${oneDecimal.format(value)}%`
    case "years":
      return `${oneDecimal.format(value)} yrs`
    case "decimal":
      return twoDecimals.format(value)
  }
}

/** Shorter form for chart axes. */
export function formatAxis(value: number, format: IndicatorFormat): string {
  switch (format) {
    case "usd":
    case "usd-compact":
      return usdCompact.format(value)
    case "percent":
      return `${compact.format(value)}%`
    case "years":
    case "decimal":
      return oneDecimal.format(value)
    default:
      return compact.format(value)
  }
}

export function formatFull(value: number): string {
  return full.format(value)
}

/** 🇮🇩 from "ID". Non-letter ISO2 codes (e.g. Kosovo "XK") still produce a flag or fall back. */
export function flagEmoji(iso2: string): string {
  if (!/^[A-Z]{2}$/.test(iso2)) return "🏳️"
  return String.fromCodePoint(...[...iso2].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
