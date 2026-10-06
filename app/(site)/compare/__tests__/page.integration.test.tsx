import { screen, within } from "@testing-library/react"

import { WB, wbCountry, wbObservation as obs, wbPage as page } from "@/test-kit/app-fixtures"
import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderServer } from "@/test-kit/server"

import ComparePage from "../page"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const IDN = wbCountry("IDN", "Indonesia")
const BRA = wbCountry("BRA", "Brazil")
const USA = wbCountry("USA", "United States")

function props(searchParams: Record<string, string> = {}) {
  return { searchParams: Promise.resolve(searchParams) } as PageProps<"/compare">
}

beforeEach(() => {
  mockFetch("GET", `${WB}/country`, page([IDN, BRA, USA]))
})

describe("compare page", () => {
  it("prompts to pick countries when none are selected", async () => {
    await renderServer(ComparePage(props()))
    expect(screen.getByRole("heading", { level: 1, name: "Compare countries" })).toBeInTheDocument()
    expect(screen.getByText("Nothing to compare yet")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save comparison" })).toBeDisabled()
  })

  it("charts and tabulates the selected countries", async () => {
    mockFetch("GET", `${WB}/country/IDN;BRA/indicator/SP.POP.TOTL`, page([obs("IDN", "2005", 230e6), obs("BRA", "2005", 186e6)]))
    mockFetch("GET", `${WB}/country/IDN/indicator/SP.POP.TOTL`, page([obs("IDN", "2023", 277_534_122)]))
    mockFetch("GET", `${WB}/country/BRA/indicator/SP.POP.TOTL`, reply(503))

    const { user } = await renderServer(
      ComparePage(props({ c: "idn, BRA,IDN,XXX", i: "SP.POP.TOTL", from: "2010", to: "2000" }))
    )

    expect(screen.getByRole("button", { name: "Remove Indonesia" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove Brazil" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove United States" })).not.toBeInTheDocument()
    expect(new URL(fetchRequests("GET", `${WB}/country/IDN;BRA/indicator/SP.POP.TOTL`)[0].url).searchParams.get("date")).toBe(
      "2000:2010"
    )

    const latest = screen.getByRole("table")
    const [, idnRow, braRow] = within(latest).getAllByRole("row")
    expect(within(idnRow).getAllByRole("cell").map((c) => c.textContent)).toEqual(["🇮🇩Indonesia", "277.5M", "2023"])
    expect(within(braRow).getAllByRole("cell").map((c) => c.textContent)).toEqual(["🇧🇷Brazil", "—", "—"])

    await user.click(screen.getByRole("button", { name: "Table" }))
    expect(screen.getAllByRole("table")[0]).toHaveTextContent("230M")
  })
})
