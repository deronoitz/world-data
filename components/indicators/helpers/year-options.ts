/** Years from `to` down to `from`, as strings for Select values. */
export function yearOptions(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => String(to - i))
}
