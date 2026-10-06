import { toSessionUser } from "../session-user"

describe("toSessionUser", () => {
  it("returns null when signed out", () => {
    expect(toSessionUser(null)).toBeNull()
    expect(toSessionUser(undefined)).toBeNull()
  })

  it("returns null for a session user without an id", () => {
    expect(toSessionUser({ email: "ada@example.com" })).toBeNull()
  })

  it("maps the Auth.js user", () => {
    expect(
      toSessionUser({ id: "u1", email: "ada@example.com", name: "Ada Lovelace", image: "a.png" })
    ).toEqual({ id: "u1", email: "ada@example.com", name: "Ada Lovelace", avatarUrl: "a.png" })
  })

  it("fills missing profile fields with null", () => {
    expect(toSessionUser({ id: "u1" })).toEqual({ id: "u1", email: null, name: null, avatarUrl: null })
  })
})
