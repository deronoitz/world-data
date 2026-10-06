import { render, screen } from "@testing-library/react"

import { fetchRequests } from "@/test-kit/mock-fetch"
import { TEST_SESSION_USER } from "@/test-kit/session"
import { useUserData } from "@/stores/user-data-store"

import { FavoriteButton } from "../FavoriteButton"
import { FavoritesSeed } from "../FavoritesSeed"

describe("FavoritesSeed", () => {
  it("seeds the store with the server's favorites", () => {
    render(<FavoritesSeed favorites={{ userId: "u1", codes: ["IDN"] }} />)
    expect(useUserData.getState()).toMatchObject({ owner: "u1", favorites: ["IDN"], loads: { favorites: "ready" } })
  })

  it("does nothing when signed out", () => {
    render(<FavoritesSeed favorites={null} />)
    expect(useUserData.getState()).toMatchObject({ owner: null, favorites: [], loads: {} })
  })

  it("runs before a FavoriteButton rendered after it, so the button doesn't fetch", () => {
    useUserData.setState({ user: TEST_SESSION_USER, owner: TEST_SESSION_USER.id, authReady: true, loads: {} })
    render(
      <>
        <FavoritesSeed favorites={{ userId: TEST_SESSION_USER.id, codes: ["IDN"] }} />
        <FavoriteButton code="IDN" name="Indonesia" />
      </>
    )
    expect(screen.getByRole("button", { name: "Remove Indonesia from favorites" })).toBeInTheDocument()
    expect(fetchRequests()).toHaveLength(0)
  })
})
