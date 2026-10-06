import { act, renderHook, waitFor } from "@testing-library/react"

import { useAuthSubscription } from "../useAuthSubscription"

type AuthCallback = (event: string, session: { user: unknown } | null) => void

const auth = vi.hoisted(() => ({
  configured: true,
  callback: undefined as AuthCallback | undefined,
  unsubscribe: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock("@/lib/supabase/env", () => ({
  get isSupabaseConfigured() {
    return auth.configured
  },
}))

vi.mock("@/lib/supabase/client", () => ({ createClient: auth.createClient }))

const SUPABASE_USER = {
  id: "u1",
  email: "ada@example.com",
  user_metadata: { full_name: "Ada Lovelace", avatar_url: "https://example.com/a.png" },
}

beforeEach(() => {
  auth.configured = true
  auth.callback = undefined
  auth.createClient.mockImplementation(() => ({
    auth: {
      onAuthStateChange: (cb: AuthCallback) => {
        auth.callback = cb
        return { data: { subscription: { unsubscribe: auth.unsubscribe } } }
      },
    },
  }))
})

async function subscribe() {
  const setUser = vi.fn()
  const hook = renderHook(() => useAuthSubscription(setUser))
  await waitFor(() => expect(auth.callback).toBeDefined())
  return { setUser, ...hook }
}

describe("useAuthSubscription", () => {
  it("forwards sign-in, sign-out and user updates as session users", async () => {
    const { setUser } = await subscribe()

    act(() => auth.callback!("SIGNED_IN", { user: SUPABASE_USER }))
    expect(setUser).toHaveBeenLastCalledWith({
      id: "u1",
      email: "ada@example.com",
      name: "Ada Lovelace",
      avatarUrl: "https://example.com/a.png",
    })

    act(() => auth.callback!("USER_UPDATED", { user: { ...SUPABASE_USER, email: undefined, user_metadata: {} } }))
    expect(setUser).toHaveBeenLastCalledWith({ id: "u1", email: null, name: null, avatarUrl: null })

    act(() => auth.callback!("SIGNED_OUT", null))
    expect(setUser).toHaveBeenLastCalledWith(null)
    expect(setUser).toHaveBeenCalledTimes(3)
  })

  it("ignores other auth events such as token refreshes", async () => {
    const { setUser } = await subscribe()
    act(() => auth.callback!("TOKEN_REFRESHED", { user: SUPABASE_USER }))
    act(() => auth.callback!("INITIAL_SESSION", { user: SUPABASE_USER }))
    expect(setUser).not.toHaveBeenCalled()
  })

  it("unsubscribes on unmount", async () => {
    const { unmount } = await subscribe()
    unmount()
    expect(auth.unsubscribe).toHaveBeenCalledTimes(1)
  })

  it("does nothing when Supabase is not configured", async () => {
    auth.configured = false
    const idle = vi.fn()
    vi.stubGlobal("requestIdleCallback", idle)
    renderHook(() => useAuthSubscription(vi.fn()))
    expect(idle).not.toHaveBeenCalled()
    expect(auth.createClient).not.toHaveBeenCalled()
  })

  it("waits for the browser to be idle and cancels the idle callback on early unmount", async () => {
    const idle = vi.fn(() => 42)
    const cancelIdle = vi.fn()
    vi.stubGlobal("requestIdleCallback", idle)
    vi.stubGlobal("cancelIdleCallback", cancelIdle)

    const { unmount } = renderHook(() => useAuthSubscription(vi.fn()))
    expect(idle).toHaveBeenCalledTimes(1)
    expect(auth.createClient).not.toHaveBeenCalled()

    unmount()
    expect(cancelIdle).toHaveBeenCalledWith(42)
    expect(auth.unsubscribe).not.toHaveBeenCalled()
  })

  it("does not subscribe if unmounted while the client is loading", async () => {
    let fire: () => void = () => {}
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
      fire = cb
      return 1
    })
    vi.stubGlobal("cancelIdleCallback", vi.fn())

    const { unmount } = renderHook(() => useAuthSubscription(vi.fn()))
    fire()
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(auth.createClient).not.toHaveBeenCalled()
  })
})
