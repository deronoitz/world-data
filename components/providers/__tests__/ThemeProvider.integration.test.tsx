import { render, screen } from "@testing-library/react"
import { useTheme } from "next-themes"

import { ThemeProvider } from "../ThemeProvider"

function ThemeName() {
  const { theme } = useTheme()
  return <p>theme: {theme}</p>
}

describe("ThemeProvider", () => {
  it("renders children with the next-themes context", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <ThemeName />
      </ThemeProvider>
    )
    expect(screen.getByText("theme: dark")).toBeInTheDocument()
  })
})
