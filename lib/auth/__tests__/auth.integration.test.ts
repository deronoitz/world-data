// @vitest-environment node

import { eq } from "drizzle-orm"

import { users } from "@/lib/db/schema"
import { TEST_USER, setAuthConfigured, setProviders, setupAuth, signIn } from "@/test-kit/auth"
import { db } from "@/test-kit/db"

import { signInAsDevUser, signInWithGoogle } from "../actions"
import { getUser } from "../session"

describe("signInWithGoogle", () => {
  it("starts Google sign in with a safe redirect target", async () => {
    await signInWithGoogle("/library")
    expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/library" })
  })

  it("never redirects off-site", async () => {
    await signInWithGoogle("//evil.example")
    expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/countries" })
  })

  it("returns an error instead when auth is not configured", async () => {
    setAuthConfigured(false)
    expect(await signInWithGoogle("/library")).toEqual({ error: expect.stringContaining("AUTH_SECRET") })
    expect(signIn).not.toHaveBeenCalled()
  })

  it("returns an error when only dev login is configured", async () => {
    setProviders({ google: false, devLogin: true })
    expect(await signInWithGoogle("/library")).toEqual({ error: expect.stringContaining("AUTH_GOOGLE_ID") })
    expect(signIn).not.toHaveBeenCalled()
  })
})

describe("signInAsDevUser", () => {
  it("signs in with the dev provider and a safe redirect target", async () => {
    setProviders({ devLogin: true })
    await signInAsDevUser("//evil.example")
    expect(signIn).toHaveBeenCalledWith("dev", { redirectTo: "/countries" })
  })

  it("is refused unless dev login is enabled", async () => {
    expect(await signInAsDevUser("/library")).toEqual({ error: expect.stringContaining("AUTH_DEV_LOGIN") })
    setProviders({ devLogin: true })
    setAuthConfigured(false)
    expect(await signInAsDevUser("/library")).toEqual({ error: expect.stringContaining("AUTH_DEV_LOGIN") })
    expect(signIn).not.toHaveBeenCalled()
  })
})

describe("getUser", () => {
  it("maps the Auth.js session user", async () => {
    expect(await getUser()).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      email: "ada@example.com",
      name: "Ada Lovelace",
      avatarUrl: null,
    })
  })

  it("is null when the session's user no longer exists", async () => {
    await db.delete(users).where(eq(users.id, TEST_USER.id))
    expect(await getUser()).toBeNull()
  })

  it("keeps the session when the user check fails", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(db, "select").mockImplementationOnce(() => {
      throw new Error("db down")
    })
    expect(await getUser()).toMatchObject({ id: TEST_USER.id })
    expect(errors).toHaveBeenCalled()
    errors.mockRestore()
  })

  it("is null when signed out or not configured", async () => {
    setupAuth({ user: null })
    expect(await getUser()).toBeNull()
    setupAuth()
    setAuthConfigured(false)
    expect(await getUser()).toBeNull()
  })
})
