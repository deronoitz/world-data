// @vitest-environment node

import { createServerClient, type CookieMethodsServer } from "@supabase/ssr"
import { NextRequest } from "next/server"

import { setSupabaseConfigured } from "@/test-kit/supabase"

import { config, proxy } from "../proxy"

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const getUser = vi.fn()

function request() {
  return new NextRequest("http://localhost/countries", { headers: { cookie: "sb-token=old" } })
}

beforeEach(() => {
  getUser.mockResolvedValue({ data: { user: null } })
})

describe("proxy", () => {
  it("passes the request through untouched when Supabase is not configured", async () => {
    setSupabaseConfigured(false)
    const res = await proxy(request())
    expect(res.headers.get("x-middleware-next")).toBe("1")
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it("refreshes the session, exposing request cookies to Supabase", async () => {
    let cookies!: Required<CookieMethodsServer>
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      cookies = options.cookies as Required<CookieMethodsServer>
      return { auth: { getUser } } as never
    })

    const res = await proxy(request())

    expect(createServerClient).toHaveBeenCalledWith("http://supabase.test", "test-key", expect.any(Object))
    expect(getUser).toHaveBeenCalled()
    expect(cookies.getAll()).toEqual([{ name: "sb-token", value: "old" }])
    expect(res.cookies.getAll()).toEqual([])
  })

  it("writes refreshed cookies to both the forwarded request and the response", async () => {
    const req = request()
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      const cookies = options.cookies as Required<CookieMethodsServer>
      getUser.mockImplementation(async () => {
        cookies.setAll([{ name: "sb-token", value: "new", options: { httpOnly: true, path: "/" } }], {})
        return { data: { user: null } }
      })
      return { auth: { getUser } } as never
    })

    const res = await proxy(req)

    expect(req.cookies.get("sb-token")?.value).toBe("new")
    expect(res.cookies.get("sb-token")).toMatchObject({ value: "new", httpOnly: true, path: "/" })
  })

  it("skips static assets", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`)
    expect(matcher.test("/countries/IDN")).toBe(true)
    expect(matcher.test("/_next/static/chunk.js")).toBe(false)
    expect(matcher.test("/geo/world.json")).toBe(false)
  })
})
