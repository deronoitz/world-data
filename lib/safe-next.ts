/** Only allow same-origin relative paths as post-login redirect targets. */
export function safeNext(next: string | null | undefined, fallback = "/countries"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback
  }
  return next
}
