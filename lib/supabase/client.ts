import { createBrowserClient } from "@supabase/ssr"

import { SUPABASE_KEY, SUPABASE_URL } from "./env"
import type { Database } from "./types"

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  client ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_KEY)
  return client
}
