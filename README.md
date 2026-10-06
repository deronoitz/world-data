# World Data Explorer

Browse, map and compare World Bank development indicators by country. Signed-in users can keep a private library of favorite countries, saved comparisons, pinned indicators and notes.

- **Frontend:** Next.js 16 App Router with Suspense streaming, shadcn/ui (Base UI), zustand, Recharts and a d3-geo SVG choropleth
- **Data:** [World Bank Indicators API v2](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392), which needs no key. Responses are cached for 24h.
- **Backend:** REST route handlers under `app/api/*`, backed by Supabase Postgres with Row Level Security and Google SSO via Supabase Auth

## Setup

### 1. Install

```bash
pnpm install
cp .env.local.example .env.local
```

### 2. Supabase

1. Create a project, then copy its **URL** and **anon/publishable key** into `.env.local`.
2. Apply the schema. Use either of these:
   ```bash
   pnpm dlx supabase link --project-ref <project-ref>
   pnpm dlx supabase db push
   ```
   Or paste `supabase/migrations/20261006000000_init.sql` into the SQL editor.
3. **Authentication → URL Configuration**: set the Site URL to `http://localhost:3000`. Add `http://localhost:3000/auth/callback` to the redirect URLs, plus your production URL later.

### 3. Google SSO

1. In Google Cloud Console, go to **APIs & Services → Credentials → Create OAuth client ID**, and choose Web application.
2. Add this authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase, go to **Authentication → Providers → Google**, enable it, and paste the client ID and secret.

### 4. Run

```bash
pnpm dev        # http://localhost:3000
```

Without Supabase env vars the app still runs: browsing, the map and comparing all work, and saving features say Supabase isn't configured.

## Features

| Route | What it does |
|---|---|
| `/countries` | Paginated list of 217 economies (aggregates like "World" removed), with search, region and income filters, and a favorites-only filter. A **Map** view shows a choropleth of any indicator, with zoom/pan and click-through. |
| `/countries/[code]` | KPI cards for population, GDP, GDP per capita, life expectancy and your pinned indicators. Each card streams independently. Also shows an indicator history chart or table with a year range, a locator map, and notes. |
| `/compare?c=IDN,USA&i=…` | Up to 6 countries on one chart plus a table of latest values. The URL is shareable, and the view can be saved to your library. |
| `/library` | Favorites, saved comparisons (open, rename, delete), pinned indicators (reorder, unpin) and notes. Requires sign-in. |

## Backend API

Every endpoint requires a session cookie: it returns `401` when signed out and `400` for an invalid body.

| Method & path | Body / query |
|---|---|
| `GET /api/favorites` · `POST /api/favorites` · `DELETE /api/favorites/:code` | `{ country_code: "IDN" }` |
| `GET /api/indicators` · `POST /api/indicators` · `PUT /api/indicators` · `DELETE /api/indicators/:code` | `{ indicator_code }`; PUT takes `{ order: string[] }` |
| `GET /api/comparisons` · `POST /api/comparisons` · `PATCH/DELETE /api/comparisons/:id` | `{ name, country_codes[2..6], indicator_code, year_from?, year_to? }` |
| `GET /api/notes[?country=IDN]` · `POST /api/notes` · `PATCH/DELETE /api/notes/:id` | `{ country_code, body }` |

Postgres RLS (`user_id = auth.uid()`) enforces ownership as well, so one user can never read or modify another user's rows, even with the anon key.

## Project layout

```
app/                     routes (pages, loading/error boundaries, api/*, auth/*)
components/              feature components (countries, map, indicators, compare, notes, library, auth)
components/ui/           shadcn components
lib/worldbank/           typed API client + normalizers (server-only)
lib/indicators.ts        curated indicator catalog
lib/supabase/            server/browser clients + DB types
lib/api/                 route helpers and request validation
stores/                  zustand: user library (optimistic) + compare tray (localStorage)
supabase/migrations/     schema + RLS
proxy.ts                 refreshes the Supabase session cookie
test-kit/                integration test helpers (fetch, Supabase and next/navigation fakes)
```

## Testing

Tests run on [Vitest](https://vitest.dev) and live in `__tests__/` folders next to the code they cover. Neither layer needs a network connection or Supabase.

```bash
pnpm test               # unit: *.test.ts, pure functions and stores
pnpm test:integration   # integration: *.integration.test.ts(x)
pnpm test:all           # both
pnpm test:watch         # watch mode
pnpm test:coverage      # both layers + coverage report (fails below 95%)
pnpm typecheck          # tsc, including test files
```

- **Unit** tests cover pure logic: validation, formatting, normalizers and helpers.
- **Integration** tests run real route handlers, client components, zustand stores and `lib/api/client.ts` together. Only three boundaries are faked: the Supabase client, `fetch`, and `next/navigation`. See [`test-kit/README.md`](test-kit/README.md).

Pages and other async Server Components are rendered with `renderServer` from the test-kit. It awaits the async components before React DOM renders the tree.

## World Bank API notes

- The API reports errors with **HTTP 200** and a `[{ message: [...] }]` body. The client turns these into a `WorldBankError`.
- `/country` mixes in 78 aggregates (`region.id === "NA"`), which are filtered out.
- `per_page`, `page`, coordinates and `date` sometimes come back as strings. They're normalized in `lib/worldbank/normalize.ts`.
- Series come back newest year first, with `null` for missing years. Charts show those years as gaps.
