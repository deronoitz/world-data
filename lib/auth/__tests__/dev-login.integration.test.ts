// @vitest-environment node

import { eq } from "drizzle-orm"

import { users } from "@/lib/db/schema"
import { db } from "@/test-kit/db"

import { DEV_USER, upsertDevUser } from "../dev-login"

describe("upsertDevUser", () => {
  it("creates the demo user once and returns the same id afterwards", async () => {
    const first = await upsertDevUser(db as never)
    expect(first).toEqual({ id: expect.any(String), ...DEV_USER, image: null })

    const again = await upsertDevUser(db as never)
    expect(again.id).toBe(first.id)
    expect(await db.select().from(users).where(eq(users.email, DEV_USER.email))).toHaveLength(1)
  })
})
