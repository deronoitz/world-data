// Shared by the app (lib/server/db/client.ts) and scripts/migrate.mts, so no imports here.

/**
 * Adapts a Postgres connection string for postgres.js, which sends query
 * parameters it doesn't know to the server as session settings. Hosted
 * providers add libpq-only ones (Neon: `channel_binding=require`) that the
 * server rejects, so they're dropped. TLS still follows `sslmode`.
 */
export function connectionUrl(url: string): string {
  if (!URL.canParse(url)) return url
  const parsed = new URL(url)
  parsed.searchParams.delete("channel_binding")
  return parsed.toString()
}
