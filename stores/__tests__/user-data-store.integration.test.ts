import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { TEST_SESSION_USER } from "@/test-kit/session"

import { useIsFavorite, useLibraryList, useUserData } from "../user-data-store"

const state = () => useUserData.getState()
const READY = { favorites: "ready", indicators: "ready", comparisons: "ready", notes: "ready" } as const
/** Signed in with every list already loaded, so actions don't trigger fetches. */
const signIn = () =>
  useUserData.setState({ user: TEST_SESSION_USER, owner: TEST_SESSION_USER.id, authReady: true, loads: READY })
/** Signed in with nothing loaded yet. */
const signInFresh = () =>
  useUserData.setState({ user: TEST_SESSION_USER, owner: TEST_SESSION_USER.id, authReady: true, loads: {} })

const note = (id: string, country_code: string) => ({
  id,
  country_code,
  body: id,
  user_id: "u",
  created_at: "a",
  updated_at: "a",
})

describe("user data store", () => {
  it("fetches nothing when a user signs in", () => {
    state().setUser(TEST_SESSION_USER)
    expect(state()).toMatchObject({ user: TEST_SESSION_USER, authReady: true, loads: {} })
    expect(fetchRequests()).toHaveLength(0)
  })

  it("loads a list once, even when asked for it concurrently", async () => {
    signInFresh()
    mockFetch("GET", "/api/indicators", [{ indicator_code: "SP.POP.TOTL" }])
    await Promise.all([state().load("indicators"), state().load("indicators")])
    await state().load("indicators")

    expect(state()).toMatchObject({ savedIndicators: ["SP.POP.TOTL"], loads: { indicators: "ready" } })
    expect(fetchRequests("GET", "/api/indicators")).toHaveLength(1)
  })

  it("maps favorites and comparisons", async () => {
    signInFresh()
    mockFetch("GET", "/api/favorites", [{ country_code: "IDN" }])
    mockFetch("GET", "/api/comparisons", [{ id: "c1" }])
    await state().load("favorites")
    await state().load("comparisons")
    expect(state()).toMatchObject({ favorites: ["IDN"], comparisons: [{ id: "c1" }] })
  })

  it("loads one country's notes, keeping other countries' notes", async () => {
    signInFresh()
    useUserData.setState({ notes: [note("old-idn", "IDN"), note("fra", "FRA")] })
    mockFetch("GET", "/api/notes?country=IDN", [note("idn", "IDN")])
    await state().load("notes:IDN")

    expect(state().notes.map((n) => n.id)).toEqual(["idn", "fra"])
    expect(fetchRequests("GET", "/api/notes?country=IDN")).toHaveLength(1)
  })

  it("skips a country's notes once every note is loaded", async () => {
    signInFresh()
    mockFetch("GET", "/api/notes", [note("idn", "IDN"), note("fra", "FRA")])
    await state().load("notes")
    await state().load("notes:FRA")

    expect(state().notes).toHaveLength(2)
    expect(fetchRequests()).toHaveLength(1)
  })

  it("does nothing when signed out", async () => {
    await state().load("favorites")
    expect(fetchRequests()).toHaveLength(0)
  })

  it("marks a failed list, toasts, and retries on the next load", async () => {
    signInFresh()
    mockFetch("GET", "/api/favorites", reply(500, { error: "boom" }))
    await state().load("favorites")
    expect(state().loads.favorites).toBe("error")
    expect(toast.error).toHaveBeenCalledWith("Could not load your library", { description: "boom" })

    mockFetch("GET", "/api/favorites", [{ country_code: "IDN" }])
    await state().load("favorites")
    expect(state()).toMatchObject({ favorites: ["IDN"], loads: { favorites: "ready" } })
  })

  it("drops a response that arrives after signing out", async () => {
    signInFresh()
    let respond!: (value: unknown) => void
    mockFetch("GET", "/api/favorites", () => new Promise((resolve) => (respond = resolve)))
    const favorites = state().load("favorites")
    await vi.waitFor(() => expect(fetchRequests("GET", "/api/favorites")).toHaveLength(1))
    state().setUser(null)
    respond(Response.json([{ country_code: "IDN" }]))
    await favorites

    expect(state()).toMatchObject({ favorites: [], loads: {} })
  })

  it("drops a failure that arrives after signing out", async () => {
    signInFresh()
    let respond!: (value: unknown) => void
    mockFetch("GET", "/api/favorites", () => new Promise((resolve) => (respond = resolve)))
    const favorites = state().load("favorites")
    await vi.waitFor(() => expect(fetchRequests("GET", "/api/favorites")).toHaveLength(1))
    state().setUser(null)
    respond(reply(500, { error: "boom" }))
    await favorites

    expect(state().loads).toEqual({})
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("clears the library on sign-out", () => {
    signIn()
    useUserData.setState({ favorites: ["IDN"] })
    state().setUser(null)
    expect(state()).toMatchObject({ favorites: [], loads: {}, owner: null })
  })

  describe("seedFavorites", () => {
    it("fills favorites so they aren't fetched, and keeps them when the session arrives", async () => {
      state().seedFavorites(TEST_SESSION_USER.id, ["IDN"])
      state().setUser(TEST_SESSION_USER)
      await state().load("favorites")

      expect(state()).toMatchObject({ favorites: ["IDN"], loads: { favorites: "ready" } })
      expect(fetchRequests()).toHaveLength(0)
    })

    it("doesn't overwrite favorites the store already loaded", () => {
      signIn()
      useUserData.setState({ favorites: ["IDN", "FRA"] })
      state().seedFavorites(TEST_SESSION_USER.id, ["IDN"])
      expect(state().favorites).toEqual(["IDN", "FRA"])
    })

    it("ignores a seed for another account", () => {
      signIn()
      useUserData.setState({ favorites: ["IDN"] })
      state().seedFavorites("someone-else", ["FRA"])
      expect(state().favorites).toEqual(["IDN"])
    })

    it("drops lists of a previous account before seeding", () => {
      useUserData.setState({ owner: "someone-else", favorites: ["FRA"], comparisons: [{ id: "c1" } as never] })
      state().seedFavorites(TEST_SESSION_USER.id, ["IDN"])
      expect(state()).toMatchObject({ owner: TEST_SESSION_USER.id, favorites: ["IDN"], comparisons: [] })
    })
  })

  describe("useLibraryList", () => {
    it("loads nothing and reports nothing while signed out", () => {
      const { result } = renderHook(() => useLibraryList("favorites"))
      expect(result.current).toBeUndefined()
      expect(fetchRequests()).toHaveLength(0)
    })

    it("loads the list for a signed-in user and reports its state", async () => {
      signInFresh()
      mockFetch("GET", "/api/favorites", [{ country_code: "IDN" }])
      const { result } = renderHook(() => useLibraryList("favorites"))
      await vi.waitFor(() => expect(result.current).toBe("ready"))
      expect(state().favorites).toEqual(["IDN"])
    })

    it("reports a country's notes as ready once every note is loaded", () => {
      signIn()
      const { result } = renderHook(() => useLibraryList("notes:IDN"))
      expect(result.current).toBe("ready")
      expect(fetchRequests()).toHaveLength(0)
    })
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
  it("keeps loaded lists when the same user's details change", () => {
    signIn()
    state().setUser({ ...TEST_SESSION_USER, name: "Renamed" })
    expect(state()).toMatchObject({ user: { name: "Renamed" }, loads: READY })
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
