/** Copy of `items` with the item at `index` moved by `delta` places. */
export function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(index + delta, 0, item)
  return next
}
