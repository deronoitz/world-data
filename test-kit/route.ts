import { NextRequest } from "next/server"

// Route handlers have per-route context types (RouteContext<"/api/…">); accept any.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (req: NextRequest, ctx: any) => Promise<Response>

/** Call an App Router route handler directly and decode its JSON response. */
export async function callRoute(
  handler: Handler,
  {
    method = "GET",
    path = "/",
    body,
    params = {},
  }: { method?: string; path?: string; body?: unknown; params?: Record<string, string> } = {}
) {
  const req = new NextRequest(new URL(path, "http://localhost"), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  })
  const res = await handler(req, { params: Promise.resolve(params) })
  const text = await res.text()
  return {
    status: res.status,
    headers: res.headers,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : null,
  }
}
