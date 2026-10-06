/** First year of World Bank data, and of the year pickers. */
export const FIRST_YEAR = 1960
export const LAST_YEAR = new Date().getFullYear()

/** Bounds a saved comparison's year range must fall in (also a database check). */
export const YEAR_MIN = 1960
export const YEAR_MAX = 2100

export function parseYear(value: string | undefined): number | undefined {
  const n = Number(value)
  return Number.isInteger(n) && n >= FIRST_YEAR && n <= LAST_YEAR ? n : undefined
}

/** Valid [from, to] pair; swaps if reversed. */
export function parseYearRange(from: string | undefined, to: string | undefined) {
  let a = parseYear(from)
  let b = parseYear(to)
  if (a !== undefined && b !== undefined && a > b) [a, b] = [b, a]
  return { from: a, to: b }
}
