// @vitest-environment node

import { callRoute } from "@/test-kit/route"

import { HttpError, withUser } from "../handler"
import { ValidationError } from "../validate"

const pgError = (code: string) => Object.assign(new Error("db said no"), { code })
/** How Drizzle surfaces driver errors: a wrapper whose `cause` has the SQLSTATE. */
const wrapped = (code: string) => new Error("Failed query", { cause: pgError(code) })

const failingWith = (error: unknown) =>
  withUser(async () => {
    throw error
  })

describe("withUser error mapping", () => {
  it("passes the user's id to the handler", async () => {
    const res = await callRoute(withUser(async ({ userId }) => Response.json({ userId })))
    expect(res).toMatchObject({ status: 200, body: { userId: "00000000-0000-4000-8000-000000000001" } })
  })

  it.each([
    ["a validation error", new ValidationError("bad"), 400, "bad"],
    ["an HttpError", new HttpError(418, "teapot"), 418, "teapot"],
    ["a unique violation", pgError("23505"), 409, "Already exists"],
    ["a wrapped unique violation", wrapped("23505"), 409, "Already exists"],
    ["a check violation", wrapped("23514"), 400, "Invalid value"],
    ["an invalid text representation", wrapped("22P02"), 400, "Invalid value"],
    ["a too-long string", wrapped("22001"), 400, "Invalid value"],
    ["a session whose user no longer exists", wrapped("23503"), 401, "Session expired, please sign in again"],
  ])("maps %s", async (_, error, status, message) => {
    const res = await callRoute(failingWith(error))
    expect(res).toMatchObject({ status, body: { error: message } })
  })

  it.each([
    ["other database errors", wrapped("42P01")],
    ["a non-string code", Object.assign(new Error("x"), { code: 42 })],
    ["non-Error throws", "boom"],
  ])("hides %s behind a 500", async (_, error) => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await callRoute(failingWith(error))
    expect(res).toMatchObject({ status: 500, body: { error: "Internal server error" } })
  })
})
