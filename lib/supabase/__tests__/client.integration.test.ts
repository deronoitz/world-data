// @vitest-environment node

import { createBrowserClient } from "@supabase/ssr"

import { createClient } from "../client"

vi.mock("@supabase/ssr", () => ({ createBrowserClient: vi.fn(() => ({ kind: "browser-client" })) }))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

describe("browser createClient", () => {
  it("creates one client with the project URL and key and reuses it", () => {
    const first = createClient()
    expect(createClient()).toBe(first)
    expect(createBrowserClient).toHaveBeenCalledTimes(1)
    expect(createBrowserClient).toHaveBeenCalledWith("http://supabase.test", "test-key")
  })
})
