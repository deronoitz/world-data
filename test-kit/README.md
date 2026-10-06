# test-kit

Helpers for the `integration` Vitest project (`*.integration.test.ts(x)`). Integration tests run the real app code, such as route handlers, client components, zustand stores and `lib/api/client.ts`. They fake only the edges of the app:

| Boundary | Fake | File |
|---|---|---|
| Supabase (`@/lib/supabase/server`, `@/lib/supabase/env`) | chainable query builder that records each query | `supabase.ts` |
| `fetch` (the app's `/api/*` and the World Bank API) | handlers matched by method and URL | `mock-fetch.ts` |
| `next/navigation` | `router` spies, plus a settable pathname and search params | `navigation.ts` |
| `sonner` | `toast` spies | `setup.ts` |

`setup.ts` applies the `next/navigation` and `sonner` mocks to every integration test. After each test it unmounts the rendered tree, then resets fetch, navigation, Supabase and the zustand stores. A test also **fails** if it made a `fetch` call that no handler matched.

## Route handlers

Route handler tests run under Node, so put `// @vitest-environment node` at the top of the file. Point the Supabase modules at the fake, then configure it in each test:

```ts
// @vitest-environment node
import { callRoute } from "@/test-kit/route"
import { setSupabaseConfigured, setupSupabase } from "@/test-kit/supabase"
import { GET, POST } from "../route"

vi.mock("@/lib/supabase/server", () => import("@/test-kit/supabase"))
vi.mock("@/lib/supabase/env", () => import("@/test-kit/supabase"))

it("creates a favorite", async () => {
  const supabase = setupSupabase({ tables: { favorite_countries: { data: null, error: null } } })
  const res = await callRoute(POST, { method: "POST", body: { country_code: "IDN" } })
  expect(res.status).toBe(201)
  expect(supabase.queries[0].ops[0][0]).toBe("upsert")
})
```

- `setupSupabase({ user: null })` simulates a signed-out request (expect a 401).
- `setSupabaseConfigured(false)` simulates missing env vars (expect a 503).
- A table can be set to a `{ data, error }` result. To answer based on the query, pass a function `(query) => result` instead.
- `callRoute(handler, { method, path, body, params })` returns `{ status, headers, body }`. A string `body` is sent raw, which is how to test invalid JSON.

## Components and stores

Components run under jsdom, the project default:

```tsx
import { screen } from "@testing-library/react"
import { mockFetch, reply, fetchRequests } from "@/test-kit/mock-fetch"
import { router } from "@/test-kit/navigation"
import { renderWithProviders } from "@/test-kit/render"

it("favorites a country", async () => {
  mockFetch("POST", "/api/favorites", reply(201, { country_code: "IDN" }))
  const { user } = renderWithProviders(<FavoriteButton code="IDN" name="Indonesia" />, {
    signedIn: true,
    url: "/countries?tab=favorites",
  })
  await user.click(screen.getByRole("button", { name: "Add Indonesia to favorites" }))
  expect(fetchRequests("POST", "/api/favorites")).toHaveLength(1)
  expect(router.refresh).toHaveBeenCalled()
})
```

- `mockFetch(method, url, response)`:
  - A plain value is sent as a 200 JSON response.
  - `reply(status, body?)` sends any status code. With no body it sends an empty response, which is what a 204 needs.
  - `(req) => value` answers each request dynamically.
  - A URL with no query string matches any query string.
  - Mocks for different URLs work together, and a later mock for the same URL takes precedence.
- `renderWithProviders(ui, { url, signedIn })` returns a `user` from `userEvent.setup()` along with RTL's render result. `signedIn` puts a user in the store without loading their saved data.
- Prefer `userEvent` to `fireEvent`, and accessible queries (`getByRole`, `getByLabelText`).

## Server Components and pages

React DOM can't render async Server Components. `renderServer` from `server.tsx` awaits every async component in the tree first, then renders the result:

```tsx
await renderServer(CountryPage({ params: Promise.resolve({ code: "IDN" }), searchParams: Promise.resolve({}) }))
expect(screen.getByRole("heading", { level: 1, name: "Indonesia" })).toBeInTheDocument()
```

Use `resolveServer` to get the awaited tree without rendering it. This is how the root layout is tested, since it returns `<html>`.

## Fixtures

- `app-fixtures.ts`: World Bank payload builders (`wbCountry`, `wbObservation`, `wbPage`).
- `map-fixtures.ts`: a tiny TopoJSON world, map country data, and SVG/DOMRect stubs for the d3 map.
- `indicator-chart.tsx`: `withFixedSizeCharts()` for `vi.mock("recharts", …)`. It gives `ResponsiveContainer` a fixed size so charts render in jsdom.

`setup.ts` stubs the browser APIs jsdom lacks: `ResizeObserver`, `IntersectionObserver`, `matchMedia`, `scrollIntoView`, `getAnimations` and pointer capture. Because of the `getAnimations` stub, Base UI popups close after an animation frame, so wait for them to go with `waitFor`.

## Coverage

`pnpm test:coverage` (or `pnpm test:all --coverage`) fails below 95% for statements, branches, functions or lines. `components/ui/**` is excluded because it is generated shadcn code. The HTML report is written to `coverage/index.html`.
