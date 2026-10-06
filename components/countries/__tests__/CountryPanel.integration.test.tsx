import { screen } from "@testing-library/react"

import { WB, wbCountry, wbPage } from "@/test-kit/app-fixtures"
import { mockFetch } from "@/test-kit/mock-fetch"
import { renderServer } from "@/test-kit/server"
import { setupSupabase } from "@/test-kit/supabase"

import { CountryPanel } from "../CountryPanel"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const IDN = wbCountry("IDN", "Indonesia")
const BRA = wbCountry("BRA", "Brazil", { region: ["LCN", "Latin America & Caribbean"] })

describe("CountryPanel", () => {
  it("shows the range of the current page and links to the others", async () => {
    mockFetch("GET", `${WB}/country`, wbPage([IDN, BRA], { page: 2, pages: 3, total: 42 }))

    await renderServer(CountryPanel({ params: { region: "EAS", page: "2", indicator: "SP.POP.TOTL" } }))

    expect(await screen.findByText("21–22 of 42")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Brazil" })).toHaveAttribute("href", "/countries/BRA")
    expect(screen.getByRole("button", { name: "3" })).toHaveAttribute(
      "href",
      "/countries?region=EAS&indicator=SP.POP.TOTL&page=3"
    )
  })

  it("explains an empty favorites tab", async () => {
    setupSupabase({ user: null })

    await renderServer(CountryPanel({ params: { tab: "favorites" } }))

    expect(await screen.findByText("No matches")).toBeInTheDocument()
    expect(screen.getByText("No favorites here")).toBeInTheDocument()
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
  })
})
