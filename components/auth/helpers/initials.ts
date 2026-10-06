/** "Ada Lovelace" → "AL"; falls back to the email, then "?". */
export function initials(name: string | null, email: string | null) {
  const source = name ?? email ?? "?"
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
