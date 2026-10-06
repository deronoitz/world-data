// A `fetch` stub that dispatches by method + URL, so several mocks compose in one test.
// Unmatched requests fail the test in setup.ts's afterEach.

const ORIGIN = "http://localhost"

type Handler = (req: Request) => unknown

type Route = { method: string; url: URL; handler: Handler }

let routes: Route[] = []
let unmatched: string[] = []
let requests: Request[] = []

/** JSON (or empty, for 204) response with a status code. */
export function reply(status: number, body?: unknown) {
  return body === undefined
    ? new Response(null, { status })
    : Response.json(body, { status })
}

/**
 * Respond to `method url`. A URL without a query matches any query string;
 * with one, it must match exactly. Plain values are sent as 200 JSON.
 * Later mocks for the same request take precedence.
 */
export function mockFetch(method: string, url: string, handler: Handler): void
export function mockFetch(method: string, url: string, response: unknown): void
export function mockFetch(method: string, url: string, response: unknown) {
  const handler = typeof response === "function" ? (response as Handler) : () => response
  routes.unshift({ method: method.toUpperCase(), url: new URL(url, ORIGIN), handler })
}

function matches(route: Route, req: Request) {
  if (route.method !== req.method) return false
  const url = new URL(req.url)
  if (route.url.search) return route.url.href === url.href
  return route.url.origin === url.origin && route.url.pathname === url.pathname
}

export const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const href = input instanceof Request ? input.url : String(input)
  // Strip Next's `next` cache option; resolve app-relative paths like the browser would.
  const rest: RequestInit & { next?: unknown } = { ...init }
  delete rest.next
  const req = new Request(new URL(href, ORIGIN), rest)
  requests.push(req.clone())

  const route = routes.find((r) => matches(r, req))
  if (!route) {
    unmatched.push(`${req.method} ${req.url}`)
    throw new TypeError(`No mockFetch handler for ${req.method} ${req.url}`)
  }
  const result = await route.handler(req)
  return result instanceof Response ? result.clone() : Response.json(result)
})

/** Requests made so far, optionally filtered by method and path. */
export function fetchRequests(method?: string, path?: string) {
  return requests.filter(
    (r) =>
      (!method || r.method === method.toUpperCase()) &&
      (!path || new URL(r.url).pathname === new URL(path, ORIGIN).pathname)
  )
}

/** Returns (and clears) the requests that had no handler. */
export function takeUnmatched() {
  const result = unmatched
  unmatched = []
  return result
}

export function resetFetch() {
  routes = []
  unmatched = []
  requests = []
}
