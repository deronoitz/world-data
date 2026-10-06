// @vitest-environment node

import { createServerClient, type CookieMethodsServer } from "@supabase/ssr"
import { cookies } from "next/headers"

import { setSupabaseConfigured, TEST_USER } from "@/test-kit/supabase"

import { createClient, getUser } from "../server"

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: vi.fn() }))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const getUserMock = vi.fn()
const cookieStore = { getAll: vi.fn(() => [{ name: "sb", value: "1" }]), set: vi.fn() }

function cookieAdapter() {
  return vi.mocked(createServerClient).mock.calls[0][2].cookies as Required<CookieMethodsServer>
}

beforeEach(() => {
  vi.mocked(cookies).mockResolvedValue(cookieStore as never)
  vi.mocked(createServerClient).mockReturnValue({ auth: { getUser: getUserMock } } as never)
  getUserMock.mockResolvedValue({ data: { user: TEST_USER } })
})

describe("server createClient", () => {
  it("creates a client bound to the request cookies", async () => {
    await createClient()
    expect(createServerClient).toHaveBeenCalledWith("http://supabase.test", "test-key", expect.any(Object))
    expect(cookieAdapter().getAll()).toEqual([{ name: "sb", value: "1" }])
  })

  it("writes refreshed cookies to the store", async () => {
    await createClient()
    cookieAdapter().setAll([{ name: "sb", value: "2", options: { path: "/" } }], {})
    expect(cookieStore.set).toHaveBeenCalledWith("sb", "2", { path: "/" })
  })

  it("ignores read-only cookie stores (Server Components)", async () => {
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("Cookies can only be modified in a Server Action or Route Handler")
    })
    await createClient()
    expect(() => cookieAdapter().setAll([{ name: "sb", value: "2", options: {} }], {})).not.toThrow()
  })
})

describe("getUser", () => {
  it("returns the verified user", async () => {
    expect(await getUser()).toBe(TEST_USER)
  })

  it("returns null without creating a client when Supabase is not configured", async () => {
    setSupabaseConfigured(false)
    expect(await getUser()).toBeNull()
    expect(createServerClient).not.toHaveBeenCalled()
    setSupabaseConfigured(true)
  })
})
