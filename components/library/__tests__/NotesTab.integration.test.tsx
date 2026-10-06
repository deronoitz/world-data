import { screen } from "@testing-library/react"

import { renderWithProviders } from "@/test-kit/render"
import { useUserData } from "@/stores/user-data-store"

import { NotesTab } from "../NotesTab"
import { COUNTRIES, note } from "./fixtures"

describe("NotesTab", () => {
  it("shows an empty state", () => {
    renderWithProviders(<NotesTab countries={COUNTRIES} />, { signedIn: true })
    expect(screen.getByText("No notes yet")).toBeInTheDocument()
  })

  it("groups notes by country, sorted by name", () => {
    useUserData.setState({
      notes: [
        note({ id: "n1", country_code: "IDN", body: "Archipelago" }),
        note({ id: "n2", country_code: "ZZZ", body: "Unknown place" }),
        note({ id: "n3", country_code: "FRA", body: "Baguettes", updated_at: "2026-04-01T12:00:00Z" }),
        note({ id: "n4", country_code: "IDN", body: "Volcanoes" }),
      ],
    })
    renderWithProviders(<NotesTab countries={COUNTRIES} />, { signedIn: true })

    const links = screen.getAllByRole("link")
    expect(links.map((l) => l.textContent?.replace(/[^\x20-\x7E]/g, "").trim())).toEqual(["France", "Indonesia", "ZZZ"])
    expect(links[2]).toHaveAttribute("href", "/countries/ZZZ")
    expect(screen.getByText("Archipelago")).toBeInTheDocument()
    expect(screen.getByText("Volcanoes")).toBeInTheDocument()
    expect(screen.getByText("Apr 1, 2026")).toBeInTheDocument()
  })
})
