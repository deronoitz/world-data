// @vitest-environment node

import { callRoute } from "@/test-kit/route"
import { setupSupabase } from "@/test-kit/supabase"

import { GET as callback } from "../callback/route"
import { POST as signout } from "../signout/route"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

describe("GET /auth/callback", () => {
  it("exchanges the code and redirects to `next`", async () => {
    const supabase = setupSupabase()
    const res = await callRoute(callback, { path: "/auth/callback?code=abc&next=/library" })
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc")
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost/library")
  })

  it("ignores an off-site `next` (open redirect)", async () => {
    setupSupabase()
    const res = await callRoute(callback, { path: "/auth/callback?code=abc&next=//evil.example" })
    expect(res.headers.get("location")).toBe("http://localhost/countries")
  })

  it("sends a failed exchange to the error page", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    setupSupabase({ exchangeError: { message: "expired" } })
    const res = await callRoute(callback, { path: "/auth/callback?code=abc" })
    expect(res.headers.get("location")).toBe(
      "http://localhost/auth/error?reason=Could%20not%20complete%20sign%20in"
    )
  })

  it("passes the provider's error description through", async () => {
    const supabase = setupSupabase()
    const res = await callRoute(callback, { path: "/auth/callback?error_description=Access+denied" })
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(res.headers.get("location")).toBe("http://localhost/auth/error?reason=Access%20denied")
  })
})

describe("POST /auth/signout", () => {
  it("signs out and redirects with 303", async () => {
    const supabase = setupSupabase()
    const res = await callRoute(signout, { method: "POST", path: "/auth/signout" })
    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(res.status).toBe(303)
    expect(res.headers.get("location")).toBe("http://localhost/countries")
  })
})
