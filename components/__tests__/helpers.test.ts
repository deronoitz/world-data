// Pure helpers colocated with feature components.

import { initials } from "@/components/auth/helpers/initials"
import { pageList } from "@/components/countries/helpers/page-list"
import { toChartRows } from "@/components/indicators/helpers/chart-rows"
import { yearOptions } from "@/components/indicators/helpers/year-options"
import { comparisonHref } from "@/components/library/helpers/comparison-href"
import { groupNotesByCountry } from "@/components/library/helpers/group-notes"
import { moveItem } from "@/components/library/helpers/move-item"
import { MAP_COLORS, buildColorScale } from "@/components/map/helpers/color-scale"
import type { ComparisonRow, NoteRow } from "@/lib/db/types"

describe("pageList", () => {
  it("lists every page up to 7", () => {
    expect(pageList(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("adds gaps around the current page", () => {
    expect(pageList(5, 11)).toEqual([1, "…", 4, 5, 6, "…", 11])
  })

  it("has no gap next to the edges", () => {
    expect(pageList(1, 11)).toEqual([1, 2, "…", 11])
    expect(pageList(2, 11)).toEqual([1, 2, 3, "…", 11])
    expect(pageList(11, 11)).toEqual([1, "…", 10, 11])
  })
})

describe("moveItem", () => {
  it("moves an item without mutating the input", () => {
    const items = ["a", "b", "c"]
    expect(moveItem(items, 0, 1)).toEqual(["b", "a", "c"])
    expect(moveItem(items, 2, -2)).toEqual(["c", "a", "b"])
    expect(items).toEqual(["a", "b", "c"])
  })
})

describe("initials", () => {
  it("prefers the name, then the email", () => {
    expect(initials("Ada Lovelace", "ada@example.com")).toBe("AL")
    expect(initials("ada king lovelace", null)).toBe("AK")
    expect(initials(null, "ada@example.com")).toBe("A")
    expect(initials(null, null)).toBe("?")
  })
})

describe("yearOptions", () => {
  it("counts down from `to`", () => {
    expect(yearOptions(2020, 2023)).toEqual(["2023", "2022", "2021", "2020"])
  })
})

describe("toChartRows", () => {
  const countries = [
    { code: "IDN", name: "Indonesia" },
    { code: "USA", name: "United States" },
  ]

  it("pivots by year and trims empty leading/trailing years", () => {
    const rows = toChartRows(
      [
        { country: "IDN", year: 2001, value: 2 },
        { country: "IDN", year: 2000, value: null },
        { country: "USA", year: 2001, value: 3 },
        { country: "USA", year: 2002, value: null },
        { country: "IDN", year: 2003, value: 4 },
        { country: "USA", year: 2004, value: null },
      ],
      countries
    )
    expect(rows).toEqual([
      { year: 2001, IDN: 2, USA: 3 },
      { year: 2002, USA: null },
      { year: 2003, IDN: 4 },
    ])
  })

  it("returns no rows when nothing has data", () => {
    expect(toChartRows([{ country: "IDN", year: 2000, value: null }], countries)).toEqual([])
  })
})

describe("comparisonHref", () => {
  const row = {
    country_codes: ["IDN", "USA"],
    indicator_code: "SP.POP.TOTL",
    year_from: null,
    year_to: null,
  } as unknown as ComparisonRow

  it("encodes countries and indicator", () => {
    expect(comparisonHref(row)).toBe("/compare?c=IDN%2CUSA&i=SP.POP.TOTL")
  })

  it("adds the year range when set", () => {
    expect(comparisonHref({ ...row, year_from: 2000, year_to: 2010 })).toBe(
      "/compare?c=IDN%2CUSA&i=SP.POP.TOTL&from=2000&to=2010"
    )
  })
})

describe("groupNotesByCountry", () => {
  const note = (id: string, country_code: string) => ({ id, country_code }) as NoteRow

  it("groups notes, sorting countries by display name", () => {
    const groups = groupNotesByCountry([note("1", "USA"), note("2", "IDN"), note("3", "USA"), note("4", "ZZZ")], {
      IDN: { name: "Indonesia", iso2: "ID" },
      USA: { name: "United States", iso2: "US" },
    })
    expect(groups.map(([code, notes]) => [code, notes.map((n) => n.id)])).toEqual([
      ["IDN", ["2"]],
      ["USA", ["1", "3"]],
      ["ZZZ", ["4"]], // unknown codes sort by the code itself
    ])
  })
})

describe("buildColorScale", () => {
  it("returns null without finite values", () => {
    expect(buildColorScale([NaN, Infinity], { scale: "linear" })).toBeNull()
  })

  it("maps the domain ends to the first and last colors", () => {
    const scale = buildColorScale([0, 25, 50, 75, 100], { scale: "linear" })!
    expect(scale.useLog).toBe(false)
    expect(scale.color(0)).toBe(MAP_COLORS[0])
    expect(scale.color(100)).toBe(MAP_COLORS[MAP_COLORS.length - 1])
    expect(scale.color(-50)).toBe(MAP_COLORS[0]) // clamped
    expect(scale.thresholds).toHaveLength(MAP_COLORS.length)
  })

  it("falls back to linear when a log scale would include non-positive values", () => {
    expect(buildColorScale([0, 10, 100], { scale: "log" })!.useLog).toBe(false)
    expect(buildColorScale([1, 10, 100], { scale: "log" })!.useLog).toBe(true)
  })

  it("widens a single-value domain", () => {
    expect(buildColorScale([5, 5, 5], { scale: "linear" })!.domain).toEqual([5, 6])
  })
})
