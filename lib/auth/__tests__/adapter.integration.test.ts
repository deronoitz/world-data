// @vitest-environment node

import { accounts } from "@/lib/db/schema"
import { TEST_USER } from "@/test-kit/auth"
import { db } from "@/test-kit/db"

import { createAdapter } from "../adapter"

const adapter = createAdapter(db as never)
const GOOGLE = { provider: "google", providerAccountId: "google-123" }

describe("createAdapter", () => {
  it("links a Google account without storing its OAuth tokens", async () => {
    await adapter.linkAccount!({
      ...GOOGLE,
      userId: TEST_USER.id,
      type: "oidc",
      access_token: "ya29.secret",
      refresh_token: "1//secret",
      id_token: "eyJ.secret",
      expires_at: 1_900_000_000,
      token_type: "bearer",
      scope: "openid email profile",
    })

    expect(await db.select().from(accounts)).toEqual([
      { ...GOOGLE, userId: TEST_USER.id, type: "oidc" },
    ])
  })

  it("finds and unlinks the user by their Google account", async () => {
    await adapter.linkAccount!({ ...GOOGLE, userId: TEST_USER.id, type: "oidc" })

    expect(await adapter.getUserByAccount!(GOOGLE)).toMatchObject({ id: TEST_USER.id, email: TEST_USER.email })

    await adapter.unlinkAccount!(GOOGLE)
    expect(await adapter.getUserByAccount!(GOOGLE)).toBeNull()
  })
})
