// Applies ./migrations to the database. Used by `pnpm db:migrate`, which runs in
// the Vercel build (`vercel-build`) and in Dockerfile.dev, so drizzle-kit is not
// needed at deploy time. See lib/db/migration-target.ts for which database.

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { migrationTarget } from "../lib/db/migration-target.ts"

const target = migrationTarget(process.env)
if ("skip" in target) {
  console.log(target.skip)
  process.exit(0)
}
if ("error" in target) {
  console.error(target.error)
  process.exit(1)
}

// Arbitrary app-wide key: concurrent deploys apply migrations one at a time
// instead of racing. Polled with a deadline, so a stuck lock fails the build
// rather than hanging it.
const LOCK_KEY = 727_465_001
const LOCK_WAIT_MS = 5 * 60_000

const client = postgres(target.url, { max: 1, onnotice: () => {} })
try {
  const deadline = Date.now() + LOCK_WAIT_MS
  while (!(await client`select pg_try_advisory_lock(${LOCK_KEY}) as locked`)[0].locked) {
    if (Date.now() > deadline) throw new Error("Timed out waiting for another deploy's migrations")
    console.log("Another deploy is migrating; waiting…")
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  await migrate(drizzle(client), { migrationsFolder: "./migrations" })
  console.log("Migrations applied")
} finally {
  await client.end()
}
