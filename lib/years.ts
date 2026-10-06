export const FIRST_YEAR = 1960
export const LAST_YEAR = new Date().getFullYear()

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
