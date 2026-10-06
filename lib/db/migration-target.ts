// Used by scripts/migrate.mts (run by plain Node), so only relative .ts imports.
import { connectionUrl } from "./connection.ts"

type Env = Record<string, string | undefined>

export type MigrationTarget = { url: string } | { skip: string } | { error: string }

/**
 * Where `pnpm db:migrate` should apply migrations, if anywhere.
 *
 * - Vercel preview builds skip unless MIGRATE_PREVIEW=true (set it once Neon
 *   preview branches are on), so an unmerged migration never reaches production.
 * - Prefers DATABASE_URL_UNPOOLED. A pooled (PgBouncer) URL is refused: the
 *   migration lock is session-level, and a pooler can keep it held after the
 *   script exits, blocking every later deploy.
 */
export function migrationTarget(env: Env): MigrationTarget {
  if (env.VERCEL_ENV === "preview" && env.MIGRATE_PREVIEW !== "true") {
    return { skip: "Skipping migrations on a preview build (set MIGRATE_PREVIEW=true to run them)" }
  }

  const url = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL
  if (!url) return { error: "DATABASE_URL is not set" }
  if (!URL.canParse(url) || /[<>]/.test(url)) {
    return { error: "DATABASE_URL is not a valid connection string (still the .env.local.example placeholder?)" }
  }
  if (new URL(url).hostname.includes("-pooler.")) {
    return {
      error:
        "Migrations need a direct connection, not the pooled one. Set DATABASE_URL_UNPOOLED " +
        "(Neon: the connection string without -pooler in the host).",
    }
  }
  return { url: connectionUrl(url) }
}
