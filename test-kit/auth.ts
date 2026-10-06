// Fake Auth.js for integration tests. setup.ts swaps it in for every test:
//
//   vi.mock("@/auth", () => import("./auth"))
//   vi.mock("@/lib/auth/env", () => import("./auth"))
//
// A test signs a user in or out with `setupAuth({ user })`. The default is
// TEST_USER, signed in.

import type { Session, User } from "next-auth"

export const TEST_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ada@example.com",
  name: "Ada Lovelace",
  image: null,
} satisfies User

export const OTHER_USER = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "grace@example.com",
  name: "Grace Hopper",
  image: null,
} satisfies User

let currentUser: User | null = TEST_USER

/** Sets who `auth()` reports as signed in (null = signed out). */
export function setupAuth({ user = TEST_USER }: { user?: User | null } = {}) {
  currentUser = user
}

// --- `@/auth` surface ---

export const auth = vi.fn(
  async (): Promise<Session | null> =>
    currentUser ? { user: currentUser, expires: "2999-01-01T00:00:00.000Z" } : null
)
export const signIn = vi.fn<(...args: unknown[]) => Promise<undefined>>(async () => undefined)
export const signOut = vi.fn<(...args: unknown[]) => Promise<undefined>>(async () => undefined)
export const handlers = {
  GET: vi.fn(async () => new Response(null)),
  POST: vi.fn(async () => new Response(null)),
}

// --- `@/lib/auth/env` surface (live bindings, toggled by setAuthConfigured / setProviders) ---

export let isAuthConfigured = true
export let isGoogleConfigured = true
export let isDevLoginEnabled = false

export function setAuthConfigured(value: boolean) {
  isAuthConfigured = value
}

/** Which sign-in providers `@/lib/auth/env` reports (default: Google only). */
export function setProviders({ google = true, devLogin = false }: { google?: boolean; devLogin?: boolean }) {
  isGoogleConfigured = google
  isDevLoginEnabled = devLogin
}

export function resetFakeAuth() {
  currentUser = TEST_USER
  isAuthConfigured = true
  isGoogleConfigured = true
  isDevLoginEnabled = false
}
