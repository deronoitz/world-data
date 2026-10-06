// @vitest-environment node

import { signOut } from "@/test-kit/auth"
import { callRoute } from "@/test-kit/route"

import { POST as signout } from "../signout/route"

describe("POST /auth/signout", () => {
  it("signs out and redirects with 303", async () => {
    const res = await callRoute(signout, { method: "POST", path: "/auth/signout" })
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
    expect(res.status).toBe(303)
    expect(res.headers.get("location")).toBe("http://localhost/countries")
  })
})
