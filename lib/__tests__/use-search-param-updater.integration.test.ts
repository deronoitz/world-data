import { act, renderHook } from "@testing-library/react"

import { router, setUrl } from "@/test-kit/navigation"

import { useSearchParamUpdater } from "../use-search-param-updater"

function renderUpdater(url: string) {
  setUrl(url)
  return renderHook(() => useSearchParamUpdater()).result
}

describe("useSearchParamUpdater", () => {
  it("sets, replaces and removes params without scrolling", () => {
    const result = renderUpdater("/countries?region=EAS&q=in&income=HIC&sort=name")
    act(() => result.current.update({ region: "NAC", q: null, income: undefined, sort: "", page: "2" }))
    expect(router.replace).toHaveBeenCalledWith("/countries?region=NAC&page=2", { scroll: false })
  })

  it("drops the page param when resetPage is set", () => {
    const result = renderUpdater("/countries?page=3")
    act(() => result.current.update({ region: "EAS" }, { resetPage: true }))
    expect(router.replace).toHaveBeenCalledWith("/countries?region=EAS", { scroll: false })
  })

  it("navigates to the bare pathname when no params remain", () => {
    const result = renderUpdater("/countries?q=in")
    act(() => result.current.update({ q: null }))
    expect(router.replace).toHaveBeenCalledWith("/countries", { scroll: false })
  })

  it("exposes the current search params and pending state", () => {
    const result = renderUpdater("/countries?q=in")
    expect(result.current.searchParams.get("q")).toBe("in")
    expect(result.current.isPending).toBe(false)
  })
})
