import { isValidElement, type ReactElement, type ReactNode } from "react"
import { redirect } from "next/navigation"

import { SessionSync } from "@/components/providers/SessionSync"
import { setupAuth } from "@/test-kit/auth"

import RootLayout, { metadata } from "../layout"
import Home from "../page"

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans-var" }),
  Geist_Mono: () => ({ variable: "font-mono-var" }),
}))

type Props = { children?: ReactNode; [key: string]: unknown }

/** Depth-first search of an element tree (without rendering it). */
function find(node: ReactNode, match: (el: ReactElement<Props>) => boolean): ReactElement<Props> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = find(child, match)
      if (found) return found
    }
    return undefined
  }
  if (!isValidElement<Props>(node)) return undefined
  return match(node) ? node : find(node.props.children, match)
}

describe("root layout", () => {
  it("renders the document shell with fonts and the page inside <main>", () => {
    setupAuth()
    const html = RootLayout({ children: <p>Page</p> } as LayoutProps<"/">) as ReactElement<Props>

    expect(html.type).toBe("html")
    expect(html.props).toMatchObject({ lang: "en" })
    expect(html.props.className).toContain("font-sans-var font-mono-var")
    const main = find(html, (el) => el.type === "main")!
    expect(isValidElement<Props>(main.props.children) && main.props.children.type).toBe("p")
  })

  it("streams the signed-in user to SessionSync", async () => {
    setupAuth()
    const html = RootLayout({ children: null } as LayoutProps<"/">)
    const sync = find(html, (el) => el.type === SessionSync)!
    await expect(sync.props.userPromise).resolves.toMatchObject({
      email: "ada@example.com",
      name: "Ada Lovelace",
    })
  })

  it("streams null when signed out", async () => {
    setupAuth({ user: null })
    const sync = find(RootLayout({ children: null } as LayoutProps<"/">), (el) => el.type === SessionSync)!
    await expect(sync.props.userPromise).resolves.toBeNull()
  })

  it("sets the default and templated titles", () => {
    expect(metadata.title).toEqual({ default: "World Data Explorer", template: "%s · World Data Explorer" })
  })
})

describe("home page", () => {
  it("redirects to the countries list", () => {
    Home()
    expect(redirect).toHaveBeenCalledWith("/countries")
  })
})
