import { act, screen, waitFor, within } from "@testing-library/react"

import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderWithProviders } from "@/test-kit/render"
import { TEST_SESSION_USER } from "@/test-kit/session"
import { useUserData } from "@/stores/user-data-store"

import { CountryNotes } from "../CountryNotes"

const NOTE = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  user_id: "u",
  country_code: "IDN",
  body: "Visit Bali",
  created_at: "2026-01-02T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
}

function renderNotes(signedIn = true) {
  return renderWithProviders(<CountryNotes countryCode="IDN" countryName="Indonesia" />, { signedIn })
}

describe("CountryNotes", () => {
  it("asks signed-out users to sign in", async () => {
    const { user } = renderNotes(false)
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(useUserData.getState().signInPrompt).toBe("Sign in to write notes.")
  })

  it("fetches only this country's notes when opened", async () => {
    useUserData.setState({ user: TEST_SESSION_USER, authReady: true, loads: {} })
    mockFetch("GET", "/api/notes?country=IDN", [NOTE])
    renderWithProviders(<CountryNotes countryCode="IDN" countryName="Indonesia" />)

    expect(await screen.findByText("Visit Bali")).toBeInTheDocument()
    expect(fetchRequests()).toHaveLength(1)
  })

  it("only lists notes for this country", () => {
    useUserData.setState({ notes: [NOTE, { ...NOTE, id: "other", country_code: "USA", body: "Visit NYC" }] })
    renderNotes()
    expect(screen.getByText("Visit Bali")).toBeInTheDocument()
    expect(screen.queryByText("Visit NYC")).not.toBeInTheDocument()
  })

  it("adds a note and clears the editor", async () => {
    mockFetch("POST", "/api/notes", reply(201, NOTE))
    const { user } = renderNotes()
    const addButton = screen.getByRole("button", { name: "Add note" })
    expect(addButton).toBeDisabled()

    await user.type(screen.getByRole("textbox", { name: "Note" }), "  Visit Bali  ")
    await user.click(addButton)

    expect(await screen.findByText("Visit Bali")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveValue("")
    expect(await fetchRequests("POST", "/api/notes")[0].json()).toEqual({ country_code: "IDN", body: "Visit Bali" })
  })

  it("saves with Ctrl+Enter", async () => {
    mockFetch("POST", "/api/notes", reply(201, NOTE))
    const { user } = renderNotes()
    await user.type(screen.getByRole("textbox", { name: "Note" }), "Visit Bali")
    await user.keyboard("{Control>}{Enter}{/Control}")
    expect(await screen.findByText("Visit Bali")).toBeInTheDocument()
  })

  it("keeps the draft when saving fails", async () => {
    mockFetch("POST", "/api/notes", reply(500, { error: "db down" }))
    const { user } = renderNotes()
    await user.type(screen.getByRole("textbox", { name: "Note" }), "Visit Bali")
    await user.click(screen.getByRole("button", { name: "Add note" }))
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveValue("Visit Bali")
  })

  it("edits a note in place", async () => {
    useUserData.setState({ notes: [NOTE] })
    mockFetch("PATCH", `/api/notes/${NOTE.id}`, { ...NOTE, body: "Visit Lombok", updated_at: "2026-01-03T00:00:00Z" })
    const { user } = renderNotes()

    await user.click(screen.getByRole("button", { name: "Edit note" }))
    const editors = screen.getAllByRole("textbox", { name: "Note" })
    const editor = editors[editors.length - 1]
    await user.clear(editor)
    await user.type(editor, "Visit Lombok")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Visit Lombok")).toBeInTheDocument()
    expect(screen.getByText(/edited/)).toBeInTheDocument()
  })

  it("deletes a note", async () => {
    useUserData.setState({ notes: [NOTE] })
    mockFetch("DELETE", `/api/notes/${NOTE.id}`, reply(204))
    const { user } = renderNotes()

    const item = screen.getByText("Visit Bali").parentElement!
    await user.click(within(item).getByRole("button", { name: "Delete note" }))

    expect(screen.queryByText("Visit Bali")).not.toBeInTheDocument()
    expect(fetchRequests("DELETE")).toHaveLength(1)
  })

  it("shows a skeleton instead of notes while they load", () => {
    useUserData.setState({ notes: [NOTE] })
    renderNotes()
    act(() => useUserData.setState({ loads: { "notes:IDN": "loading" } }))
    expect(screen.queryByText("Visit Bali")).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it("separates multiple notes", () => {
    useUserData.setState({ notes: [NOTE, { ...NOTE, id: "second", body: "Visit Java" }] })
    renderNotes()
    expect(screen.getByText("Visit Bali")).toBeInTheDocument()
    expect(screen.getByText("Visit Java")).toBeInTheDocument()
    expect(screen.getAllByRole("separator", { hidden: true })).toHaveLength(1)
  })

  it("only shows the edited label when the note was updated", () => {
    useUserData.setState({ notes: [NOTE] })
    renderNotes()
    expect(screen.queryByText(/edited/)).not.toBeInTheDocument()
  })

  it("cancels editing without saving", async () => {
    useUserData.setState({ notes: [NOTE] })
    const { user } = renderNotes()
    await user.click(screen.getByRole("button", { name: "Edit note" }))
    const editors = screen.getAllByRole("textbox", { name: "Note" })
    await user.type(editors[editors.length - 1], " soon")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByText("Visit Bali")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument()
    expect(fetchRequests()).toHaveLength(0)
  })

  it("keeps editing when an update fails", async () => {
    useUserData.setState({ notes: [NOTE] })
    mockFetch("PATCH", `/api/notes/${NOTE.id}`, reply(500, { error: "db down" }))
    const { user } = renderNotes()
    await user.click(screen.getByRole("button", { name: "Edit note" }))
    const editors = screen.getAllByRole("textbox", { name: "Note" })
    const editor = editors[editors.length - 1]
    await user.clear(editor)
    await user.type(editor, "Visit Lombok")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(fetchRequests("PATCH")).toHaveLength(1))
    expect(await screen.findByRole("button", { name: "Save" })).toBeEnabled()
    expect(editor).toHaveValue("Visit Lombok")
    expect(useUserData.getState().notes[0].body).toBe("Visit Bali")
  })

  it("ignores Ctrl+Enter on a blank draft", async () => {
    const { user } = renderNotes()
    await user.type(screen.getByRole("textbox", { name: "Note" }), "   ")
    await user.keyboard("{Control>}{Enter}{/Control}")
    expect(fetchRequests()).toHaveLength(0)
  })

  it("flags and refuses notes over 5000 characters", async () => {
    const { user } = renderNotes()
    const editor = screen.getByRole("textbox", { name: "Note" })
    await user.click(editor)
    await user.paste("x".repeat(5001))

    expect(editor).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText(/5001\/5000/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add note" })).toBeDisabled()
    await user.keyboard("{Meta>}{Enter}{/Meta}")
    expect(fetchRequests()).toHaveLength(0)
  })
})
