import { screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { signInAsDevUser } from "@/lib/auth/actions"
import { renderWithProviders } from "@/test-kit/render"

import { DevLoginButton } from "../DevLoginButton"

vi.mock("@/lib/auth/actions", () => ({ signInAsDevUser: vi.fn() }))

const NAME = "Dev login (local only)"

describe("DevLoginButton", () => {
  it("signs in and returns to the current page", async () => {
    vi.mocked(signInAsDevUser).mockResolvedValue(undefined)
    const { user } = renderWithProviders(<DevLoginButton />, { url: "/countries?q=indo" })
    await user.click(screen.getByRole("button", { name: NAME }))
    expect(signInAsDevUser).toHaveBeenCalledWith("/countries?q=indo")
  })

  it("uses an explicit next path", async () => {
    vi.mocked(signInAsDevUser).mockResolvedValue(undefined)
    const { user } = renderWithProviders(<DevLoginButton next="/library" />, { url: "/compare" })
    await user.click(screen.getByRole("button", { name: NAME }))
    expect(signInAsDevUser).toHaveBeenCalledWith("/library")
  })

  it("explains when dev login is not available", async () => {
    vi.mocked(signInAsDevUser).mockResolvedValue({ error: "Set AUTH_DEV_LOGIN." })
    const { user } = renderWithProviders(<DevLoginButton />)
    await user.click(screen.getByRole("button", { name: NAME }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Dev login is not available", { description: "Set AUTH_DEV_LOGIN." })
    )
  })

  it("reports a failed action", async () => {
    vi.mocked(signInAsDevUser).mockRejectedValue(new Error("db down"))
    const { user } = renderWithProviders(<DevLoginButton />)
    await user.click(screen.getByRole("button", { name: NAME }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not sign in", { description: "db down" }))
    await waitFor(() => expect(screen.getByRole("button", { name: NAME })).toBeEnabled())
  })

  it("omits the description for a non-Error rejection", async () => {
    vi.mocked(signInAsDevUser).mockRejectedValue("nope")
    const { user } = renderWithProviders(<DevLoginButton />)
    await user.click(screen.getByRole("button", { name: NAME }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not sign in", { description: undefined }))
  })
})
