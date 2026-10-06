import { renderHook, waitFor } from "@testing-library/react"

import { TINY_WORLD } from "@/test-kit/map-fixtures"
import { fetchRequests, mockFetch, reply } from "@/test-kit/mock-fetch"

import { WORLD_GEO_URL } from "../helpers/world-geo"

/** The hook caches at module level: a fresh import starts with a cold cache. */
async function freshHook() {
  vi.resetModules()
  return (await import("../hooks/useWorldGeometry")).useWorldGeometry
}

/** A fetch response the test releases by hand. */
function deferred() {
  let release!: (value: Response) => void
  const response = new Promise<Response>((resolve) => (release = resolve))
  return { response, release }
}

describe("useWorldGeometry", () => {
  it("loads the world once and serves later mounts from the cache", async () => {
    const useWorldGeometry = await freshHook()
    mockFetch("GET", WORLD_GEO_URL, TINY_WORLD)

    const first = renderHook(() => useWorldGeometry())
    const second = renderHook(() => useWorldGeometry())
    expect(first.result.current).toEqual({ geometry: null, failed: false })

    await waitFor(() => expect(first.result.current.geometry).not.toBeNull())
    await waitFor(() => expect(second.result.current.geometry).toBe(first.result.current.geometry))
    expect(first.result.current.geometry!.features.map((f) => f.properties.iso3)).toEqual(["IDN", "USA", "ATA", null, "NRU"])
    expect(first.result.current.geometry!.height).toBeGreaterThan(0)

    const later = renderHook(() => useWorldGeometry())
    expect(later.result.current.geometry).toBe(first.result.current.geometry)
    expect(fetchRequests("GET", WORLD_GEO_URL)).toHaveLength(1)
  })

  it("reports a failed load and retries on the next mount", async () => {
    const useWorldGeometry = await freshHook()
    mockFetch("GET", WORLD_GEO_URL, reply(503))

    const failing = renderHook(() => useWorldGeometry())
    await waitFor(() => expect(failing.result.current.failed).toBe(true))
    expect(failing.result.current.geometry).toBeNull()

    mockFetch("GET", WORLD_GEO_URL, TINY_WORLD)
    const retry = renderHook(() => useWorldGeometry())
    await waitFor(() => expect(retry.result.current.geometry).not.toBeNull())
    expect(fetchRequests("GET", WORLD_GEO_URL)).toHaveLength(2)
  })

  it("ignores a load that settles after unmount", async () => {
    const useWorldGeometry = await freshHook()
    const ok = deferred()
    mockFetch("GET", WORLD_GEO_URL, () => ok.response)

    const { result, unmount } = renderHook(() => useWorldGeometry())
    await waitFor(() => expect(fetchRequests()).toHaveLength(1))
    unmount()
    ok.release(Response.json(TINY_WORLD))

    // The shared load still fills the cache for the next mount.
    await waitFor(() => expect(renderHook(() => useWorldGeometry()).result.current.geometry).not.toBeNull())
    expect(result.current.geometry).toBeNull()
  })

  it("ignores a failure that settles after unmount", async () => {
    const useWorldGeometry = await freshHook()
    const failure = deferred()
    mockFetch("GET", WORLD_GEO_URL, () => failure.response)

    const { result, unmount } = renderHook(() => useWorldGeometry())
    await waitFor(() => expect(fetchRequests()).toHaveLength(1))
    unmount()
    failure.release(new Response(null, { status: 500 }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(result.current.failed).toBe(false)
  })
})
