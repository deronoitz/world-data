import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"

import { ApiError, api } from "../client"

describe("api client", () => {
  it("sends a JSON body with merged headers and parses the response", async () => {
    mockFetch("POST", "/api/notes", reply(201, { id: "n1" }))
    const result = await api<{ id: string }>("/api/notes", {
      method: "POST",
      body: { body: "hi" },
      headers: { "X-Trace": "abc" },
    })
    expect(result).toEqual({ id: "n1" })
    const [req] = fetchRequests("POST", "/api/notes")
    expect(req.headers.get("Content-Type")).toBe("application/json")
    expect(req.headers.get("X-Trace")).toBe("abc")
    expect(await req.json()).toEqual({ body: "hi" })
  })

  it("sends no body when none is given", async () => {
    mockFetch("GET", "/api/notes", [])
    expect(await api("/api/notes")).toEqual([])
    expect(await fetchRequests("GET")[0].text()).toBe("")
  })

  it("returns undefined for a 204", async () => {
    mockFetch("DELETE", "/api/notes/n1", reply(204))
    expect(await api("/api/notes/n1", { method: "DELETE" })).toBeUndefined()
  })

  it("throws an ApiError with the server's error message", async () => {
    mockFetch("GET", "/api/notes", reply(403, { error: "Forbidden" }))
    const error = await api("/api/notes").catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 403, message: "Forbidden" })
  })

  it("falls back to a generic message when the error body has no error field", async () => {
    mockFetch("GET", "/api/notes", reply(400, { detail: "x" }))
    await expect(api("/api/notes")).rejects.toMatchObject({ status: 400, message: "Request failed (400)" })
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    mockFetch("GET", "/api/notes", () => new Response("<html>oops</html>", { status: 502 }))
    await expect(api("/api/notes")).rejects.toMatchObject({ status: 502, message: "Request failed (502)" })
  })
})
