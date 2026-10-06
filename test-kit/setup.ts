// Shared setup for the `integration` project (see vitest.config.mts).

import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"

import { fetchMock, resetFetch, takeUnmatched } from "./mock-fetch"
import { resetNavigation } from "./navigation"
import { resetFakeAuth } from "./auth"

vi.mock("next/navigation", async () => (await import("./navigation")).navigationMock)

// `connection()` throws outside a real request; tests render pages directly.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}))

// Auth.js and Postgres: see auth.ts and db.ts. The database only boots in files that use it.
vi.mock("@/auth", () => import("./auth"))
vi.mock("@/lib/auth/env", () => import("./auth"))
vi.mock("@/lib/db", () => import("./db"))

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
  Toaster: () => null,
}))

// Browser APIs jsdom lacks, used by Base UI popups, Recharts and the maps.
if (typeof window !== "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
  window.IntersectionObserver ??= ResizeObserverStub as unknown as typeof IntersectionObserver
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList
  Element.prototype.scrollIntoView ??= function () {}
  Element.prototype.getAnimations ??= () => []
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= function () {}
  Element.prototype.releasePointerCapture ??= function () {}
}

beforeEach(async () => {
  vi.stubGlobal("fetch", fetchMock)
  await (globalThis as { __resetTestDb?: () => Promise<void> }).__resetTestDb?.()
})

afterEach(async () => {
  // Unmount first so resets below don't update a still-mounted tree.
  cleanup()
  const unmatched = takeUnmatched()
  vi.unstubAllGlobals()
  resetFetch()
  resetNavigation()
  resetFakeAuth()
  // Client stores only exist in jsdom tests. Importing them lazily keeps node-env
  // workers from touching Node's experimental localStorage global.
  if (typeof window !== "undefined") {
    const { useCompare } = await import("@/stores/compare-store")
    const { useUserData } = await import("@/stores/user-data-store")
    useUserData.setState(useUserData.getInitialState(), true)
    useCompare.setState({ countries: [] })
    window.localStorage.clear()
  }
  vi.clearAllMocks()
  if (unmatched.length > 0) {
    throw new Error(`Unmocked fetch calls:\n  ${unmatched.join("\n  ")}`)
  }
})
