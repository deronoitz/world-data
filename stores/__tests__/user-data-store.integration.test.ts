import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { TEST_SESSION_USER } from "@/test-kit/session"

import { useIsFavorite, useUserData } from "../user-data-store"

const state = () => useUserData.getState()
const signIn = () => useUserData.setState({ user: TEST_SESSION_USER, authReady: true, status: "ready" })

function mockLibrary() {
  mockFetch("GET", "/api/favorites", [{ country_code: "IDN" }])
  mockFetch("GET", "/api/indicators", [{ indicator_code: "SP.POP.TOTL" }])
  mockFetch("GET", "/api/comparisons", [])
  mockFetch("GET", "/api/notes", [])
}

describe("user data store", () => {
  it("hydrates the library when a user signs in", async () => {
    mockLibrary()
    state().setUser(TEST_SESSION_USER)
    await vi.waitFor(() => expect(state().status).toBe("ready"))
    expect(state()).toMatchObject({ favorites: ["IDN"], savedIndicators: ["SP.POP.TOTL"] })
  })

  it("marks the library as errored and toasts when hydrating fails", async () => {
    mockLibrary()
    mockFetch("GET", "/api/notes", reply(500, { error: "boom" }))
    await state().hydrate()
    expect(state().status).toBe("error")
    expect(toast.error).toHaveBeenCalledWith("Could not load your library", { description: "boom" })
  })

  it("clears the library on sign-out", () => {
    useUserData.setState({ user: TEST_SESSION_USER, favorites: ["IDN"] })
    state().setUser(null)
    expect(state()).toMatchObject({ status: "signed-out", favorites: [] })
  })

  it("asks signed-out users to sign in instead of calling the API", async () => {
    await state().toggleFavorite("IDN")
    expect(state().signInPrompt).toBe("Sign in to save favorite countries.")
    expect(fetchRequests()).toHaveLength(0)
  })

  it("favorites optimistically and posts to the API", async () => {
    signIn()
    mockFetch("POST", "/api/favorites", reply(201, { country_code: "IDN" }))
    const pending = state().toggleFavorite("IDN")
    expect(state().favorites).toEqual(["IDN"])
    await pending
    expect(await fetchRequests("POST", "/api/favorites")[0].json()).toEqual({ country_code: "IDN" })
  })

  it("rolls back a failed unfavorite", async () => {
    signIn()
    useUserData.setState({ favorites: ["IDN", "USA"] })
    mockFetch("DELETE", "/api/favorites/IDN", reply(500, { error: "db down" }))
    await state().toggleFavorite("IDN")
    expect(state().favorites).toEqual(["IDN", "USA"])
    expect(toast.error).toHaveBeenCalledWith("Could not update favorites", { description: "db down" })
  })

  it("replaces an edited note with the server row", async () => {
    signIn()
    const note = { id: "n1", country_code: "IDN", body: "old", user_id: "u", created_at: "a", updated_at: "a" }
    useUserData.setState({ notes: [note] })
    mockFetch("PATCH", "/api/notes/n1", { ...note, body: "new", updated_at: "b" })
    expect(await state().updateNote("n1", "new")).toBe(true)
    expect(state().notes).toEqual([{ ...note, body: "new", updated_at: "b" }])
  })
})

const COMPARISON = {
  id: "c1",
  user_id: "u",
  name: "Asia",
  country_codes: ["IDN", "THA"],
  indicator_code: "SP.POP.TOTL",
  year_from: 2000,
  year_to: 2020,
  created_at: "a",
  updated_at: "a",
}
const NOTE = { id: "n1", country_code: "IDN", body: "old", user_id: "u", created_at: "a", updated_at: "a" }

describe("user data store: session", () => {
  it("does not re-hydrate when the same user is set again", () => {
    signIn()
    state().setUser({ ...TEST_SESSION_USER, name: "Renamed" })
    expect(state().user?.name).toBe("Renamed")
    expect(fetchRequests()).toHaveLength(0)
  })

  it("closes the sign-in prompt", () => {
    state().requireUser("Sign in please")
    expect(state().signInPrompt).toBe("Sign in please")
    state().closeSignInPrompt()
    expect(state().signInPrompt).toBeNull()
  })

  it("lets a signed-in user through requireUser", () => {
    signIn()
    expect(state().requireUser("x")).toBe(true)
    expect(state().signInPrompt).toBeNull()
  })
})

describe("user data store: favorites", () => {
  it("reports whether a country is a favorite via useIsFavorite", () => {
    const { result } = renderHook(() => useIsFavorite("IDN"))
    expect(result.current).toBe(false)
    act(() => useUserData.setState({ favorites: ["IDN"] }))
    expect(result.current).toBe(true)
  })

  it("unfavorites with a DELETE", async () => {
    signIn()
    useUserData.setState({ favorites: ["IDN"] })
    mockFetch("DELETE", "/api/favorites/IDN", reply(204))
    await state().toggleFavorite("IDN")
    expect(state().favorites).toEqual([])
    expect(fetchRequests("DELETE", "/api/favorites/IDN")).toHaveLength(1)
  })
})

describe("user data store: pinned indicators", () => {
  it("asks signed-out users to sign in", async () => {
    await state().togglePinnedIndicator("SP.POP.TOTL")
    expect(state().signInPrompt).toBe("Sign in to pin indicators.")
    expect(fetchRequests()).toHaveLength(0)
  })

  it("pins by appending and posting", async () => {
    signIn()
    useUserData.setState({ savedIndicators: ["A"] })
    mockFetch("POST", "/api/indicators", reply(201, { indicator_code: "SP.POP.TOTL" }))
    await state().togglePinnedIndicator("SP.POP.TOTL")
    expect(state().savedIndicators).toEqual(["A", "SP.POP.TOTL"])
    expect(await fetchRequests("POST", "/api/indicators")[0].json()).toEqual({ indicator_code: "SP.POP.TOTL" })
  })

  it("unpins with an encoded DELETE", async () => {
    signIn()
    useUserData.setState({ savedIndicators: ["A", "B/C"] })
    mockFetch("DELETE", "/api/indicators/B%2FC", reply(204))
    await state().togglePinnedIndicator("B/C")
    expect(state().savedIndicators).toEqual(["A"])
    expect(fetchRequests("DELETE")).toHaveLength(1)
  })

  it("rolls back a failed pin", async () => {
    signIn()
    mockFetch("POST", "/api/indicators", reply(500, { error: "nope" }))
    await state().togglePinnedIndicator("A")
    expect(state().savedIndicators).toEqual([])
    expect(toast.error).toHaveBeenCalledWith("Could not update pinned indicators", { description: "nope" })
  })

  it("reorders optimistically and sends the new order", async () => {
    useUserData.setState({ savedIndicators: ["A", "B"] })
    mockFetch("PUT", "/api/indicators", reply(204))
    const pending = state().reorderIndicators(["B", "A"])
    expect(state().savedIndicators).toEqual(["B", "A"])
    await pending
    expect(await fetchRequests("PUT", "/api/indicators")[0].json()).toEqual({ order: ["B", "A"] })
  })

  it("rolls back a failed reorder", async () => {
    useUserData.setState({ savedIndicators: ["A", "B"] })
    mockFetch("PUT", "/api/indicators", reply(500))
    await state().reorderIndicators(["B", "A"])
    expect(state().savedIndicators).toEqual(["A", "B"])
    expect(toast.error).toHaveBeenCalledWith("Could not reorder indicators", { description: "Request failed (500)" })
  })
})

describe("user data store: comparisons", () => {
  const input = { name: "Asia", country_codes: ["IDN", "THA"], indicator_code: "SP.POP.TOTL", year_from: 2000, year_to: 2020 }

  it("returns null and prompts sign-in when saving signed out", async () => {
    expect(await state().saveComparison(input)).toBeNull()
    expect(state().signInPrompt).toBe("Sign in to save comparisons.")
    expect(fetchRequests()).toHaveLength(0)
  })

  it("prepends a saved comparison and toasts", async () => {
    signIn()
    useUserData.setState({ comparisons: [{ ...COMPARISON, id: "old" }] })
    mockFetch("POST", "/api/comparisons", reply(201, COMPARISON))
    expect(await state().saveComparison(input)).toEqual(COMPARISON)
    expect(state().comparisons.map((c) => c.id)).toEqual(["c1", "old"])
    expect(toast.success).toHaveBeenCalledWith("Comparison saved", { description: "Asia" })
    expect(await fetchRequests("POST", "/api/comparisons")[0].json()).toEqual(input)
  })

  it("returns null and toasts when saving fails", async () => {
    signIn()
    mockFetch("POST", "/api/comparisons", reply(400, { error: "invalid" }))
    expect(await state().saveComparison(input)).toBeNull()
    expect(state().comparisons).toEqual([])
    expect(toast.error).toHaveBeenCalledWith("Could not save comparison", { description: "invalid" })
  })

  it("renames a comparison", async () => {
    useUserData.setState({ comparisons: [COMPARISON, { ...COMPARISON, id: "c2", name: "Other" }] })
    mockFetch("PATCH", "/api/comparisons/c1", reply(200, { ...COMPARISON, name: "SEA" }))
    await state().renameComparison("c1", "SEA")
    expect(state().comparisons.map((c) => c.name)).toEqual(["SEA", "Other"])
    expect(await fetchRequests("PATCH", "/api/comparisons/c1")[0].json()).toEqual({ name: "SEA" })
  })

  it("rolls back a failed rename", async () => {
    useUserData.setState({ comparisons: [COMPARISON] })
    mockFetch("PATCH", "/api/comparisons/c1", reply(500, { error: "x" }))
    await state().renameComparison("c1", "SEA")
    expect(state().comparisons).toEqual([COMPARISON])
    expect(toast.error).toHaveBeenCalledWith("Could not rename comparison", { description: "x" })
  })

  it("deletes a comparison", async () => {
    useUserData.setState({ comparisons: [COMPARISON] })
    mockFetch("DELETE", "/api/comparisons/c1", reply(204))
    await state().deleteComparison("c1")
    expect(state().comparisons).toEqual([])
    expect(fetchRequests("DELETE", "/api/comparisons/c1")).toHaveLength(1)
  })

  it("rolls back a failed delete", async () => {
    useUserData.setState({ comparisons: [COMPARISON] })
    mockFetch("DELETE", "/api/comparisons/c1", reply(500, { error: "x" }))
    await state().deleteComparison("c1")
    expect(state().comparisons).toEqual([COMPARISON])
    expect(toast.error).toHaveBeenCalledWith("Could not delete comparison", { description: "x" })
  })
})

describe("user data store: notes", () => {
  it("returns false and prompts sign-in when adding a note signed out", async () => {
    expect(await state().addNote("IDN", "hi")).toBe(false)
    expect(state().signInPrompt).toBe("Sign in to write notes.")
    expect(fetchRequests()).toHaveLength(0)
  })

  it("returns false and toasts when adding a note fails", async () => {
    signIn()
    mockFetch("POST", "/api/notes", reply(500, { error: "db down" }))
    expect(await state().addNote("IDN", "hi")).toBe(false)
    expect(state().notes).toEqual([])
    expect(toast.error).toHaveBeenCalledWith("Could not save note", { description: "db down" })
  })

  it("rolls back a failed note edit", async () => {
    useUserData.setState({ notes: [NOTE, { ...NOTE, id: "n2" }] })
    mockFetch("PATCH", "/api/notes/n1", reply(500, { error: "x" }))
    expect(await state().updateNote("n1", "new")).toBe(false)
    expect(state().notes.map((n) => n.body)).toEqual(["old", "old"])
    expect(toast.error).toHaveBeenCalledWith("Could not update note", { description: "x" })
  })

  it("rolls back a failed note delete", async () => {
    useUserData.setState({ notes: [NOTE] })
    mockFetch("DELETE", "/api/notes/n1", reply(500, { error: "x" }))
    await state().deleteNote("n1")
    expect(state().notes).toEqual([NOTE])
    expect(toast.error).toHaveBeenCalledWith("Could not delete note", { description: "x" })
  })
})

describe("user data store: errors", () => {
  it("only replaces the edited note with the server row", async () => {
    useUserData.setState({ notes: [NOTE, { ...NOTE, id: "n2" }] })
    mockFetch("PATCH", "/api/notes/n1", { ...NOTE, body: "new", updated_at: "b" })
    expect(await state().updateNote("n1", "new")).toBe(true)
    expect(state().notes).toEqual([{ ...NOTE, body: "new", updated_at: "b" }, { ...NOTE, id: "n2" }])
  })

  it("toasts without a description when the failure is not an Error", async () => {
    useUserData.setState({ notes: [NOTE] })
    mockFetch("DELETE", "/api/notes/n1", () => {
      throw "offline"
    })
    await state().deleteNote("n1")
    expect(toast.error).toHaveBeenCalledWith("Could not delete note", { description: undefined })
  })
})
