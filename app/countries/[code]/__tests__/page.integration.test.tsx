import { screen } from "@testing-library/react"
import { notFound } from "next/navigation"

import { wbCountry, wbPage } from "@/test-kit/app-fixtures"
import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"
import { renderServer } from "@/test-kit/server"
import { setupSupabase } from "@/test-kit/supabase"

import CountryPage, { generateMetadata } from "../page"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

const WB = "https://api.worldbank.org/v2"
const ref = (id: string, value = id) => ({ id, iso2code: "", value })
const IDN = {
  id: "IDN",
  iso2Code: "ID",
  name: "Indonesia",
  region: ref("EAS", "East Asia & Pacific"),
  adminregion: ref(""),
  incomeLevel: ref("UMC", "Upper middle income"),
  lendingType: ref("IBD"),
  capitalCity: "Jakarta",
  longitude: "106.83",
  latitude: "-6.19",
}

function props(code: string, searchParams: Record<string, string> = {}) {
  return { params: Promise.resolve({ code }), searchParams: Promise.resolve(searchParams) }
}

beforeEach(() => {
  mockFetch("GET", `${WB}/country`, [{ page: 1, pages: 1, per_page: 400, total: 1 }, [IDN]])
  mockFetch("GET", `${WB}/country/IDN/indicator/SP.POP.TOTL`, [
    { page: 1, pages: 1, per_page: 50, total: 1 },
    [
      {
        indicator: { id: "SP.POP.TOTL", value: "" },
        country: { id: "ID", value: "Indonesia" },
        countryiso3code: "IDN",
        date: "2023",
        value: 277_534_122,
        obs_status: "",
        decimal: 0,
      },
    ],
  ])
})

describe("country page", () => {
  it("renders the header and KPI cards", async () => {
    setupSupabase({ user: null })
    // Unmocked KPI indicators fall back to "No data" via KpiCard's catch.
    mockFetch("GET", `${WB}/country/IDN/indicator/NY.GDP.MKTP.CD`, [{ pages: 1 }, []])
    mockFetch("GET", `${WB}/country/IDN/indicator/NY.GDP.PCAP.CD`, [{ pages: 1 }, []])
    mockFetch("GET", `${WB}/country/IDN/indicator/SP.DYN.LE00.IN`, [{ pages: 1 }, []])

    await renderServer(CountryPage(props("IDN", { indicator: "SP.POP.TOTL" })))

    expect(screen.getByRole("heading", { level: 1, name: "Indonesia" })).toBeInTheDocument()
    expect(screen.getByText("Capital: Jakarta")).toBeInTheDocument()
    expect(screen.getByText("277.5M")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Map highlighting Indonesia" })).toBeInTheDocument()
  })

  it("titles the page with the country name", async () => {
    expect(await generateMetadata(props("IDN"))).toEqual({ title: "Indonesia" })
  })

  it("titles an unknown code as not found", async () => {
    expect(await generateMetadata(props("XXX"))).toEqual({ title: "Country not found" })
  })

  it("renders not-found for an unknown code", async () => {
    vi.mocked(notFound).mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND")
    })
    await expect(CountryPage(props("XXX"))).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it("adds pinned indicators as extra KPI cards when signed in", async () => {
    setupSupabase({
      tables: {
        saved_indicators: {
          data: [{ indicator_code: "SP.POP.TOTL" }, { indicator_code: "IT.NET.USER.ZS" }, { indicator_code: "GONE" }],
          error: null,
        },
      },
    })
    for (const code of ["NY.GDP.MKTP.CD", "NY.GDP.PCAP.CD", "SP.DYN.LE00.IN", "IT.NET.USER.ZS"]) {
      // Latest-value lookups fail; the history series is empty.
      mockFetch("GET", `${WB}/country/IDN/indicator/${code}`, (req: Request) =>
        new URL(req.url).searchParams.has("mrnev") ? reply(502) : wbPage([])
      )
    }

    await renderServer(CountryPage(props("IDN", { indicator: "IT.NET.USER.ZS" })), { signedIn: true })

    const pinned = screen.getByLabelText("Pinned").closest("a")!
    expect(pinned).toHaveTextContent("Internet users")
    expect(pinned).toHaveAttribute("href", "/countries/IDN?indicator=IT.NET.USER.ZS")
    expect(pinned.querySelector('[data-slot="card"]')).toHaveClass("ring-2")
    expect(screen.getAllByLabelText("Pinned")).toHaveLength(1)
    expect(screen.getAllByText("No data available")).toHaveLength(4)
  })

  it("keeps the year range in KPI links and the history request", async () => {
    setupSupabase({ user: null })
    for (const code of ["NY.GDP.MKTP.CD", "NY.GDP.PCAP.CD", "SP.DYN.LE00.IN"]) {
      mockFetch("GET", `${WB}/country/IDN/indicator/${code}`, [{ pages: 1 }, []])
    }

    await renderServer(CountryPage(props("idn", { from: "2015", to: "2005" })))

    expect(screen.getByRole("link", { name: /^Population/ })).toHaveAttribute(
      "href",
      "/countries/IDN?indicator=SP.POP.TOTL&from=2005&to=2015"
    )
    const history = fetchRequests("GET", `${WB}/country/IDN/indicator/NY.GDP.PCAP.CD`).find((r) =>
      new URL(r.url).searchParams.has("date")
    )
    expect(new URL(history!.url).searchParams.get("date")).toBe("2005:2015")
  })

  it("handles a small economy without a capital or coordinates", async () => {
    setupSupabase({ user: null })
    mockFetch("GET", `${WB}/country`, wbPage([wbCountry("SGP", "Singapore")]))
    for (const code of ["SP.POP.TOTL", "NY.GDP.MKTP.CD", "NY.GDP.PCAP.CD", "SP.DYN.LE00.IN"]) {
      mockFetch("GET", `${WB}/country/SGP/indicator/${code}`, [{ pages: 1 }, []])
    }

    await renderServer(CountryPage(props("SGP")))

    expect(screen.getByRole("heading", { level: 1, name: "Singapore" })).toBeInTheDocument()
    expect(screen.queryByText(/^Capital:/)).not.toBeInTheDocument()
    expect(screen.getByText("No data")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Map highlighting Singapore" }).querySelector("circle")).toBeNull()
  })
})
