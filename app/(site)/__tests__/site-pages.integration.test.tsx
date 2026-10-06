import { render, screen } from "@testing-library/react"
import { redirect } from "next/navigation"

import { WB, wbCountry, wbPage } from "@/test-kit/app-fixtures"
import { mockFetch } from "@/test-kit/mock-fetch"
import { renderServer } from "@/test-kit/server"
import { OTHER_USER, setProviders, setupAuth } from "@/test-kit/auth"

import AuthErrorPage from "../auth/error/page"
import CompareError from "../compare/error"
import CompareLoading from "../compare/loading"
import SiteLayout from "../layout"
import LibraryError from "../library/error"
import LibraryLoading from "../library/loading"
import LibraryPage from "../library/page"
import LoginPage from "../login/page"

class RedirectError extends Error {}

beforeEach(() => {
  vi.mocked(redirect).mockImplementation((url: string) => {
    throw new RedirectError(url)
  })
})

const searchParams = (sp: Record<string, string | string[]> = {}) => ({ searchParams: Promise.resolve(sp) })

describe("site layout", () => {
  it("wraps pages in the centered page container", () => {
    render(
      <SiteLayout>
        <p>Content</p>
      </SiteLayout>
    )
    expect(screen.getByText("Content").parentElement).toHaveClass("max-w-7xl")
  })
})

describe("auth error page", () => {
  it("explains a known Auth.js error", async () => {
    await renderServer(AuthErrorPage(searchParams({ error: "AccessDenied" }) as never))
    expect(screen.getByText("Sign in failed")).toBeInTheDocument()
    expect(screen.getByText(/Access was denied/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toHaveAttribute("href", "/login")
  })

  it.each([
    ["OAuthAccountNotLinked", /already registered without this Google account/],
    ["CredentialsSignin", /Dev login failed/],
  ])("explains %s", async (error, message) => {
    await renderServer(AuthErrorPage(searchParams({ error }) as never))
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it.each([["an unknown error", { error: "Weird" }], ["no error", {}]])(
    "falls back to a generic message for %s",
    async (_, params) => {
      await renderServer(AuthErrorPage(searchParams(params) as never))
      expect(screen.getByText("Something went wrong while signing you in.")).toBeInTheDocument()
    }
  )
})

describe("login page", () => {
  it("offers Google sign in when signed out", async () => {
    setupAuth({ user: null })
    await renderServer(LoginPage(searchParams({ next: "/compare" }) as never))
    expect(screen.getByText("Sign in to World Data Explorer")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument()
  })

  it("offers dev login instead of Google when only dev login is enabled", async () => {
    setupAuth({ user: null })
    setProviders({ google: false, devLogin: true })
    await renderServer(LoginPage(searchParams({}) as never))
    expect(screen.getByRole("button", { name: "Dev login (local only)" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument()
  })

  it("offers both when Google and dev login are configured", async () => {
    setupAuth({ user: null })
    setProviders({ google: true, devLogin: true })
    await renderServer(LoginPage(searchParams({}) as never))
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Dev login (local only)" })).toBeInTheDocument()
  })

  it("sends a signed-in user on to a safe ?next", async () => {
    setupAuth()
    await expect(LoginPage(searchParams({ next: "/compare?c=IDN" }) as never)).rejects.toThrow("/compare?c=IDN")
  })

  it("defaults ?next to the library and rejects off-site targets", async () => {
    setupAuth()
    await expect(LoginPage(searchParams({ next: "//evil.example" }) as never)).rejects.toThrow("/library")
  })
})

describe("library page", () => {
  it("redirects signed-out visitors to login", async () => {
    setupAuth({ user: null })
    await expect(LibraryPage()).rejects.toThrow("/login?next=/library")
  })

  it("greets the user by email and shows their library", async () => {
    setupAuth()
    mockFetch("GET", `${WB}/country`, wbPage([wbCountry("IDN", "Indonesia")]))
    await renderServer(LibraryPage(), { signedIn: true })
    expect(screen.getByRole("heading", { level: 1, name: "My library" })).toBeInTheDocument()
    expect(screen.getByText(/for ada@example\.com\./)).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Favorites (0)" })).toBeInTheDocument()
  })

  it("falls back to 'your account' when the user has no email", async () => {
    setupAuth({ user: { id: OTHER_USER.id } }) // an existing user, without an email in the session
    mockFetch("GET", `${WB}/country`, wbPage([]))
    await renderServer(LibraryPage())
    expect(screen.getByText(/for your account\./)).toBeInTheDocument()
  })

  it("shows skeletons while loading", () => {
    const { container } = render(<LibraryLoading />)
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(8)
  })
})

describe.each([
  ["library", LibraryError],
  ["compare", CompareError],
])("%s error boundary", (_, ErrorBoundary) => {
  it("offers a retry", async () => {
    const retry = vi.fn()
    const { user } = await renderServer(<ErrorBoundary error={new Error("x")} retry={retry} />)
    expect(screen.getByText("Couldn't load data")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalled()
  })
})

describe("compare loading", () => {
  it("shows a chart skeleton", () => {
    const { container } = render(<CompareLoading />)
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(2)
  })
})
