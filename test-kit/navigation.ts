// Controllable stand-in for `next/navigation`, wired up in setup.ts.

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}

let pathname = "/"
let searchParams = new URLSearchParams()

/** Set the current URL as seen by usePathname() / useSearchParams(). */
export function setUrl(url: string) {
  const parsed = new URL(url, "http://localhost")
  pathname = parsed.pathname
  searchParams = parsed.searchParams
}

export function resetNavigation() {
  setUrl("/")
}

export const navigationMock = {
  useRouter: () => router,
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}
