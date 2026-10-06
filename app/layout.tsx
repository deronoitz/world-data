import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"

import { SignInDialog } from "@/components/auth/SignInDialog"
import { CompareTray } from "@/components/compare/CompareTray"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { SessionSync } from "@/components/providers/SessionSync"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { Toaster } from "@/components/ui/Sonner"
import { TooltipProvider } from "@/components/ui/Tooltip"
import { isDevLoginEnabled, isGoogleConfigured } from "@/lib/server/auth/env"
import { getSessionUser } from "@/lib/server/auth/session"

import "./globals.css"

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "World Data Explorer", template: "%s · World Data Explorer" },
  description: "Explore and compare World Bank development indicators by country.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Not awaited: the user streams in under Suspense so the shell renders immediately.
  const userPromise = getSessionUser()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <SiteHeader />
            <main className="flex w-full flex-1 flex-col">
              {children}
            </main>
            <CompareTray />
            <SignInDialog providers={{ google: isGoogleConfigured, devLogin: isDevLoginEnabled }} />
            <Suspense>
              <SessionSync userPromise={userPromise} />
            </Suspense>
            <Toaster richColors={false} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
