// An in-process Postgres (PGlite) with the real migrations applied. setup.ts
// points `@/lib/server/db/client` at it for every integration test, so
// lib/server/repositories/* runs real SQL, including the CHECK and unique
// constraints, without a database server.
//
// Each test starts with empty tables plus TEST_USER and OTHER_USER.

import path from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"

import * as schema from "@/lib/server/db/schema"

import { OTHER_USER, TEST_USER } from "./auth"

export const db = drizzle(new PGlite(), { schema })

// Vitest runs from the project root.
await migrate(db, { migrationsFolder: path.resolve("migrations") })

export async function resetDb() {
  await db.execute(sql`truncate table ${schema.users} cascade`)
  await db.insert(schema.users).values([TEST_USER, OTHER_USER])
}

await resetDb()

// setup.ts resets the database before each test, but only in files that loaded it.
;(globalThis as { __resetTestDb?: () => Promise<void> }).__resetTestDb = resetDb
