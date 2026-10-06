import { act, renderHook } from "@testing-library/react"
import { zoomIdentity } from "d3-zoom"

import { useMapZoom } from "../hooks/useMapZoom"

function svgRef() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("viewBox", "0 0 960 600")
  document.body.append(svg)
  return { current: svg }
}

afterEach(() => {
  document.body.innerHTML = ""
})

describe("useMapZoom", () => {
  it("zooms by a factor within 1–8x and resets to identity", () => {
    const ref = svgRef()
    const onPanStart = vi.fn()
    const { result } = renderHook(() => useMapZoom(ref, 600, onPanStart))

    act(() => result.current.zoomBy(4))
    expect(result.current.transform.k).toBe(4)
    act(() => result.current.zoomBy(4))
    expect(result.current.transform.k).toBe(8) // clamped from 16
    expect(onPanStart).toHaveBeenCalledTimes(2)
    expect(result.current.isPanning()).toBe(false)

    act(() => result.current.reset())
    expect(result.current.transform).toEqual(zoomIdentity)
  })

  it("calls the latest onPanStart", () => {
    const ref = svgRef()
    const first = vi.fn()
    const latest = vi.fn()
    const { result, rerender } = renderHook(({ cb }) => useMapZoom(ref, 600, cb), { initialProps: { cb: first } })

    rerender({ cb: latest })
    act(() => result.current.zoomBy(2))
    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledOnce()
  })

  it("stops listening on unmount", () => {
    const ref = svgRef()
    const { unmount } = renderHook(() => useMapZoom(ref, 600, vi.fn()))
    const removed = vi.spyOn(ref.current, "removeEventListener")

    unmount()
    const types = removed.mock.calls.map(([type]) => type)
    expect(types).toEqual(expect.arrayContaining(["wheel", "mousedown", "touchstart"]))
  })

  it("does nothing without an svg", () => {
    const { result } = renderHook(() => useMapZoom({ current: null }, 600, vi.fn()))

    act(() => {
      result.current.zoomBy(2)
      result.current.reset()
    })
    expect(result.current.transform).toEqual(zoomIdentity)
  })
})
