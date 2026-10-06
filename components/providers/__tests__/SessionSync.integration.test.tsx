import { Suspense } from "react"
import { act, render, waitFor } from "@testing-library/react"

import { fetchRequests } from "@/test-kit/mock-fetch"
import { TEST_SESSION_USER } from "@/test-kit/session"
import { useCompare } from "@/stores/compare-store"
import type { SessionUser } from "@/lib/domain/user"
import { useUserData } from "@/stores/user-data-store"

import { SessionSync } from "../SessionSync"

async function renderSync(user: SessionUser | null) {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <SessionSync userPromise={Promise.resolve(user)} />
      </Suspense>
    )
  })
}

describe("SessionSync", () => {
  it("seeds the store with the server user without fetching their library", async () => {
    await renderSync(TEST_SESSION_USER)
    expect(useUserData.getState()).toMatchObject({ user: TEST_SESSION_USER, authReady: true, loads: {} })
    expect(fetchRequests()).toHaveLength(0)
  })

  it("marks auth as ready for a signed-out visitor without fetching", async () => {
    await renderSync(null)
    expect(useUserData.getState()).toMatchObject({ user: null, authReady: true, loads: {} })
    expect(fetchRequests()).toHaveLength(0)
  })

  it("rehydrates the compare tray from localStorage", async () => {
    window.localStorage.setItem("world-data:compare", JSON.stringify({ state: { countries: ["IDN", "USA"] }, version: 0 }))
    await renderSync(null)
    await waitFor(() => expect(useCompare.getState().countries).toEqual(["IDN", "USA"]))
  })
})
