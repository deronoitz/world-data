import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env"

// Refreshes the Supabase session cookie on each request so Server Components
// and Route Handlers always see a valid session. Authorization itself happens
// in the route handlers / pages (and in Postgres via RLS), not here.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Do not put code between createServerClient and getUser(): it triggers the refresh.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)",
  ],
}
