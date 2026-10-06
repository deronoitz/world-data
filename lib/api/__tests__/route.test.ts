import { HttpError, check } from "../route"
import { ValidationError } from "../validate"

describe("check", () => {
  it("does nothing without an error", () => {
    expect(() => check(null)).not.toThrow()
  })

  it("maps unique violations to 409", () => {
    const thrown = (() => {
      try {
        check({ code: "23505", message: "duplicate key" })
      } catch (error) {
        return error
      }
    })()
    expect(thrown).toBeInstanceOf(HttpError)
    expect(thrown).toMatchObject({ status: 409, message: "Already exists" })
  })

  it.each(["23514", "22P02", "22001"])("maps %s to a validation error", (code) => {
    expect(() => check({ code, message: "bad input" })).toThrow(ValidationError)
  })

  it("rethrows anything else as a plain error", () => {
    expect(() => check({ code: "42P01", message: "relation missing" })).toThrow("relation missing")
    expect(() => check({ code: "42P01", message: "x" })).not.toThrow(ValidationError)
  })
})
