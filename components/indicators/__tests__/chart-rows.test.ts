import { toChartRows } from "../helpers/chart-rows"

describe("toChartRows", () => {
  it("sorts rows without a year first", () => {
    const series = [
      { country: "IDN", year: null, value: 1 },
      { country: "IDN", year: 2001, value: 2 },
      { country: "IDN", year: undefined, value: 0 },
    ] as unknown as Parameters<typeof toChartRows>[0]

    expect(toChartRows(series, [{ code: "IDN", name: "Indonesia" }])).toEqual([
      { year: null, IDN: 1 },
      { year: undefined, IDN: 0 },
      { year: 2001, IDN: 2 },
    ])
  })
})
