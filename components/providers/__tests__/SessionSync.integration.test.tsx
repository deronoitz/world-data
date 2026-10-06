import { Suspense } from "react"
import { act, render, waitFor } from "@testing-library/react"

import { fetchRequests, mockFetch } from "@/test-kit/mock-fetch"
import { TEST_SESSION_USER } from "@/test-kit/session"
import { useCompare } from "@/stores/compare-store"
import { useUserData, type SessionUser } from "@/stores/user-data-store"

import { SessionSync } from "../SessionSync"

type AuthCallback = (event: string, session: { user: unknown } | null) => void

const auth = vi.hoisted(() => ({ callback: undefined as AuthCallback | undefined }))

vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: true }))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: (cb: AuthCallback) => {
        auth.callback = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
    },
  }),
}))

function mockLibrary() {
  mockFetch("GET", "/api/favorites", [{ country_code: "IDN" }])
  mockFetch("GET", "/api/indicators", [])
  mockFetch("GET", "/api/comparisons", [])
  mockFetch("GET", "/api/notes", [])
}

async function renderSync(user: SessionUser | null) {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <SessionSync userPromise={Promise.resolve(user)} />
      </Suspense>
    )
  })
}

beforeEach(() => {
  auth.callback = undefined
})

describe("SessionSync", () => {
  it("seeds the store with the server user and hydrates their library", async () => {
    mockLibrary()
    await renderSync(TEST_SESSION_USER)
    await waitFor(() => expect(useUserData.getState().status).toBe("ready"))
    expect(useUserData.getState()).toMatchObject({ user: TEST_SESSION_USER, authReady: true, favorites: ["IDN"] })
    expect(fetchRequests("GET", "/api/favorites")).toHaveLength(1)
  })

  it("marks auth as ready for a signed-out visitor without fetching", async () => {
    await renderSync(null)
    expect(useUserData.getState()).toMatchObject({ user: null, authReady: true, status: "signed-out" })
    expect(fetchRequests()).toHaveLength(0)
  })

  it("rehydrates the compare tray from localStorage", async () => {
    window.localStorage.setItem("world-data:compare", JSON.stringify({ state: { countries: ["IDN", "USA"] }, version: 0 }))
    await renderSync(null)
    await waitFor(() => expect(useCompare.getState().countries).toEqual(["IDN", "USA"]))
  })

  it("follows Supabase auth events", async () => {
    await renderSync(null)
    await waitFor(() => expect(auth.callback).toBeDefined())

    mockLibrary()
    act(() => auth.callback!("SIGNED_IN", { user: { id: "u2", email: "grace@example.com", user_metadata: { name: "Grace" } } }))
    await waitFor(() => expect(useUserData.getState().status).toBe("ready"))
    expect(useUserData.getState().user).toEqual({ id: "u2", email: "grace@example.com", name: "Grace", avatarUrl: null })

    act(() => auth.callback!("SIGNED_OUT", null))
    expect(useUserData.getState()).toMatchObject({ user: null, status: "signed-out", favorites: [] })
  })
})
