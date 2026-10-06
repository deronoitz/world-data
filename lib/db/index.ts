import "server-only"

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { connectionUrl } from "./connection"
import * as schema from "./schema"

export type Db = PostgresJsDatabase<typeof schema>
/** The handle passed to a `db.transaction` callback. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0]

// postgres.js connects on the first query, so importing this during `next build`
// (or with DATABASE_URL unset) is harmless. On Vercel, DATABASE_URL is Neon's
// pooled URL; TLS follows its `sslmode=require`.
const globalForDb = globalThis as unknown as { db?: Db }

export const db: Db =
  globalForDb.db ?? drizzle(
    // On Vercel every function instance has its own pool, so keep each one small
    // and release idle connections.
    postgres(connectionUrl(process.env.DATABASE_URL ?? ""), {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    }),
    { schema }
  )

// Reuse one pool across dev HMR reloads.
if (process.env.NODE_ENV !== "production") globalForDb.db = db
