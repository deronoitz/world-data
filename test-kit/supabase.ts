// Fake Supabase for route handler tests. A test file swaps it in with:
//
//   vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
//   vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))
//
// and then configures it per test with `setupSupabase({ user, tables })`.

import type { User } from "@supabase/supabase-js"

type PgError = { code?: string; message: string }
export type QueryResult = { data: unknown; error: PgError | null }

/** One call in a query chain, e.g. ["eq", "id", "…"]. */
export type Op = [method: string, ...args: unknown[]]
export type Query = { table: string; ops: Op[] }

type TableResult = QueryResult | ((query: Query) => QueryResult)

export const TEST_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ada@example.com",
  user_metadata: { full_name: "Ada Lovelace" },
} as unknown as User

const CHAIN = ["select", "insert", "upsert", "update", "delete", "eq", "in", "order", "limit", "single", "maybeSingle"]

function createFake({
  user = TEST_USER,
  tables = {},
  exchangeError = null,
}: {
  user?: User | null
  tables?: Record<string, TableResult>
  exchangeError?: PgError | null
}) {
  const queries: Query[] = []

  function from(table: string) {
    const query: Query = { table, ops: [] }
    queries.push(query)
    const builder: Record<string, unknown> = {
      then(resolve: (r: QueryResult) => unknown, reject: (e: unknown) => unknown) {
        const result = tables[table] ?? { data: null, error: null }
        return Promise.resolve(typeof result === "function" ? result(query) : result).then(resolve, reject)
      },
    }
    for (const method of CHAIN) {
      builder[method] = (...args: unknown[]) => {
        query.ops.push([method, ...args])
        return builder
      }
    }
    return builder
  }

  return {
    queries,
    from,
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      exchangeCodeForSession: vi.fn<(code: string) => Promise<{ error: PgError | null }>>(async () => ({
        error: exchangeError,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  }
}

export type FakeSupabase = ReturnType<typeof createFake>

let current = createFake({})

/** Configure the client returned by `createClient()` for the current test. */
export function setupSupabase(options: Parameters<typeof createFake>[0] = {}) {
  current = createFake(options)
  return current
}

// --- `@/lib/supabase/server` surface ---

export async function createClient() {
  return current
}

export async function getUser() {
  return (await current.auth.getUser()).data.user
}

// --- `@/lib/supabase/env` surface (live binding, toggled by setSupabaseConfigured) ---

export const SUPABASE_URL = "http://supabase.test"
export const SUPABASE_KEY = "test-key"
export let isSupabaseConfigured = true

export function setSupabaseConfigured(value: boolean) {
  isSupabaseConfigured = value
}

export function resetFakeSupabase() {
  current = createFake({})
  isSupabaseConfigured = true
}
