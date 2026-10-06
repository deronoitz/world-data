import { readFileSync } from "node:fs"
import path from "node:path"

import { render, screen } from "@testing-library/react"

import { WORLD_GEO_URL } from "@/components/map/helpers/world-geo"
import { WB, wbCountry, wbObservation, wbPage } from "@/test-kit/app-fixtures"
import { fetchRequests, mockFetch } from "@/test-kit/mock-fetch"
import { renderServer } from "@/test-kit/server"

import CountriesError from "../error"
import Loading from "../loading"
import CountriesPage from "../page"

const TOPOLOGY = JSON.parse(readFileSync(path.join(process.cwd(), "public", WORLD_GEO_URL), "utf8"))
const IDN = wbCountry("IDN", "Indonesia", { capital: "Jakarta", lat: "-6.19", lng: "106.83" })
const BRA = wbCountry("BRA", "Brazil", { region: ["LCN", "Latin America & Caribbean"], lat: "-15.8", lng: "-47.9" })

function props(searchParams: Record<string, string | string[]> = {}) {
  return { searchParams: Promise.resolve(searchParams) } as PageProps<"/countries">
}

SVGSVGElement.prototype.getScreenCTM ??= () => null

beforeEach(() => {
  mockFetch("GET", WORLD_GEO_URL, TOPOLOGY)
  mockFetch("GET", `${WB}/country`, (req: Request) =>
    wbPage(new URL(req.url).searchParams.has("region") ? [IDN] : [IDN, BRA])
  )
})

describe("countries page", () => {
  it("colors the world map by the chosen indicator and lists countries", async () => {
    mockFetch("GET", `${WB}/country/all/indicator/SP.POP.TOTL`, wbPage([wbObservation("IDN", 2023, 277_534_122)]))

    await renderServer(CountriesPage(props({ indicator: ["SP.POP.TOTL"], region: "EAS" })))

    expect(screen.getAllByRole("heading", { level: 1, name: "Countries" })).toHaveLength(2)
    expect(screen.getAllByText(/^2 economies/)).toHaveLength(2)
    expect(screen.getByRole("img", { name: "World map colored by Population" })).toBeInTheDocument()
    expect(await screen.findByLabelText("Indonesia: 277.5M")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Indonesia" })).toHaveAttribute("href", "/countries/IDN")
    expect(fetchRequests("GET", `${WB}/country/all/indicator/SP.POP.TOTL`)).toHaveLength(1)
  })

  it("defaults to GDP per capita", async () => {
    mockFetch("GET", `${WB}/country/all/indicator/NY.GDP.PCAP.CD`, wbPage([]))
    await renderServer(CountriesPage(props()))
    expect(screen.getByRole("img", { name: "World map colored by GDP per capita (current US$)" })).toBeInTheDocument()
  })
})

describe("countries route states", () => {
  it("shows map and panel skeletons while loading", () => {
    const { container } = render(<Loading />)
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(10)
  })

  it("renders the error inside the page container with a retry", async () => {
    const retry = vi.fn()
    const { user } = await renderServer(<CountriesError error={Object.assign(new Error("x"), { digest: "abc" })} retry={retry} />)
    expect(screen.getByText("Ref: abc")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
