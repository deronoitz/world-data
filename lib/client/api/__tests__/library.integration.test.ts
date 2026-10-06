import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"

import { comparisonsApi, favoritesApi, indicatorsApi, notesApi } from "../library"

const COMPARISON = {
  name: "ASEAN",
  country_codes: ["IDN", "MYS"],
  indicator_code: "SP.POP.TOTL",
  year_from: null,
  year_to: null,
}

// Each call → the request it must send. Bodies are compared as JSON.
const CASES: [string, () => Promise<unknown>, string, string, unknown?][] = [
  ["favoritesApi.list", () => favoritesApi.list(), "GET", "/api/favorites"],
  ["favoritesApi.add", () => favoritesApi.add("IDN"), "POST", "/api/favorites", { country_code: "IDN" }],
  ["favoritesApi.remove", () => favoritesApi.remove("IDN"), "DELETE", "/api/favorites/IDN"],
  ["indicatorsApi.list", () => indicatorsApi.list(), "GET", "/api/indicators"],
  ["indicatorsApi.pin", () => indicatorsApi.pin("SP.POP.TOTL"), "POST", "/api/indicators", { indicator_code: "SP.POP.TOTL" }],
  ["indicatorsApi.unpin", () => indicatorsApi.unpin("A/B"), "DELETE", "/api/indicators/A%2FB"],
  ["indicatorsApi.reorder", () => indicatorsApi.reorder(["B", "A"]), "PUT", "/api/indicators", { order: ["B", "A"] }],
  ["comparisonsApi.list", () => comparisonsApi.list(), "GET", "/api/comparisons"],
  ["comparisonsApi.create", () => comparisonsApi.create(COMPARISON), "POST", "/api/comparisons", COMPARISON],
  ["comparisonsApi.rename", () => comparisonsApi.rename("c1", "SEA"), "PATCH", "/api/comparisons/c1", { name: "SEA" }],
  ["comparisonsApi.remove", () => comparisonsApi.remove("c1"), "DELETE", "/api/comparisons/c1"],
  ["notesApi.list", () => notesApi.list(), "GET", "/api/notes"],
  ["notesApi.create", () => notesApi.create("IDN", "hi"), "POST", "/api/notes", { country_code: "IDN", body: "hi" }],
  ["notesApi.update", () => notesApi.update("n1", "edit"), "PATCH", "/api/notes/n1", { body: "edit" }],
  ["notesApi.remove", () => notesApi.remove("n1"), "DELETE", "/api/notes/n1"],
]

describe("library api", () => {
  it.each(CASES)("%s sends %s %s", async (_, call, method, url, body) => {
    mockFetch(method, url, reply(200, { ok: true }))
    expect(await call()).toEqual({ ok: true })
    const [req] = fetchRequests(method, url)
    if (body === undefined) expect(await req.text()).toBe("")
    else expect(await req.json()).toEqual(body)
  })
})
