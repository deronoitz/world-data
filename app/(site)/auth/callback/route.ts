import { NextResponse, type NextRequest } from "next/server"

import { safeNext } from "@/lib/safe-next"
import { createClient } from "@/lib/supabase/server"

// Google → Supabase → here with ?code=…; exchange it for a session cookie (PKCE).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNext(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
    console.error("OAuth code exchange failed:", error.message)
  }

  const reason = searchParams.get("error_description") ?? "Could not complete sign in"
  return NextResponse.redirect(
    new URL(`/auth/error?reason=${encodeURIComponent(reason)}`, origin)
  )
}
