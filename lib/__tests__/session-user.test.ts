import type { User } from "@supabase/supabase-js"

import { toSessionUser } from "../session-user"

const user = (fields: Partial<User>) => ({ id: "u1", ...fields }) as User

describe("toSessionUser", () => {
  it("returns null when signed out", () => {
    expect(toSessionUser(null)).toBeNull()
  })

  it("prefers full_name and avatar_url from the OAuth metadata", () => {
    expect(
      toSessionUser(
        user({
          email: "ada@example.com",
          user_metadata: { full_name: "Ada Lovelace", name: "Ada", avatar_url: "a.png", picture: "p.png" },
        })
      )
    ).toEqual({ id: "u1", email: "ada@example.com", name: "Ada Lovelace", avatarUrl: "a.png" })
  })

  it("falls back to name and picture", () => {
    expect(toSessionUser(user({ user_metadata: { name: "Ada", picture: "p.png" } }))).toEqual({
      id: "u1",
      email: null,
      name: "Ada",
      avatarUrl: "p.png",
    })
  })

  it("handles missing metadata", () => {
    expect(toSessionUser(user({ user_metadata: undefined }))).toEqual({
      id: "u1",
      email: null,
      name: null,
      avatarUrl: null,
    })
  })
})
