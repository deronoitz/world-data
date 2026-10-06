import { safeNext } from "../safe-next"

describe("safeNext", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNext("/library?tab=notes")).toBe("/library?tab=notes")
  })

  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "library"])(
    "falls back for %j",
    (value) => {
      expect(safeNext(value)).toBe("/countries")
    }
  )

  it("uses a custom fallback", () => {
    expect(safeNext(null, "/")).toBe("/")
  })
})
