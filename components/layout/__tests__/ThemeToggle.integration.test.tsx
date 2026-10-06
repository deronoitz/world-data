import { screen } from "@testing-library/react"

import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { renderWithProviders } from "@/test-kit/render"

import { ThemeToggle } from "../ThemeToggle"

afterEach(() => {
  document.documentElement.className = ""
  document.documentElement.removeAttribute("style")
})

describe("ThemeToggle", () => {
  it("switches between light and dark", async () => {
    const { user } = renderWithProviders(
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <ThemeToggle />
      </ThemeProvider>
    )
    const button = screen.getByRole("button", { name: "Toggle theme" })

    await user.click(button)
    expect(document.documentElement).toHaveClass("dark")
    expect(window.localStorage.getItem("theme")).toBe("dark")

    await user.click(button)
    expect(document.documentElement).toHaveClass("light")
    expect(document.documentElement).not.toHaveClass("dark")
  })
})
