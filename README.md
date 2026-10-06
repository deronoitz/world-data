# World Data Explorer

Browse, map and compare World Bank development indicators by country. Signed-in users can save favorite countries, comparisons, pinned indicators and private notes.

**Live:** [https://world-data-kappa.vercel.app/](https://world-data-kappa.vercel.app/)

---

## 1. Requirements

The brief: build an interactive country and global-development data explorer, using the [World Bank Indicators API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392) as the data source.

### Frontend

| Requirement | Implementation |
|---|---|
| Browsable, paginated country list | `/countries`: 217 economies (aggregates like "World" removed), 20 per page, with search, region and income filters, a favorites tab, and a **map** view (choropleth) |
| Country detail screen | `/countries/[code]` |
| Population, GDP, GDP per capita, life expectancy | KPI cards on the detail page. Each card streams in independently |
| Select an indicator and view its history | Indicator picker, history chart or table, and a year-range filter |
| Compare countries | `/compare?c=IDN,USA&i=…`: up to 6 countries on one chart, plus a table of latest values. The URL is shareable |

### Backend

| Requirement | Endpoints |
|---|---|
| Favorite countries | `GET/POST /api/favorites` · `DELETE /api/favorites/:code` |
| Save country comparisons | `GET/POST /api/comparisons` · `PATCH/DELETE /api/comparisons/:id` |
| Save selected indicators | `GET/POST/PUT /api/indicators` · `DELETE /api/indicators/:code` (PUT reorders) |
| Personal notes per country | `GET /api/notes[?country=IDN]` · `POST /api/notes` · `PATCH/DELETE /api/notes/:id` |

Every endpoint requires sign-in (Google SSO). Every query is scoped to the signed-in user's `user_id`, so no user can read or change another user's data. Everything a user saves is in `/library`.

---

## 2. Tech stack and why

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, Route Handlers) |
| UI | shadcn/ui (Base UI), Tailwind CSS 4, Recharts, d3-geo (SVG map) |
| Client state | zustand (library with optimistic updates, compare tray in localStorage) |
| Database | PostgreSQL on [Neon](https://neon.tech), through Drizzle ORM |
| Auth | Auth.js (Google SSO, JWT sessions) |
| Tests | Vitest, Testing Library, PGlite (in-process Postgres) |

### Why the backend lives inside Next.js instead of a separate service

The backend is Route Handlers (`app/api/*`) plus server code in the same Next.js app. The reasons:

- **The requirements are specific and well defined.** The backend only serves this app's features: favorites, comparisons, indicators and notes.
- **There are no other consumers.** No other service or app uses this API, so a separate service would add a second deployment, CORS and type syncing with no real benefit.
- **The main data source is a third-party API.** World Bank data is fetched directly in Server Components and cached by Next.js. The database only stores user data.
- One codebase means **types are shared** between server and client (`lib/domain`), and there's a single deploy.

If the backend ever needs other consumers, its logic is already isolated in `lib/server/*` (repositories, services, validation), so it can move to its own service without a rewrite.

### Why PostgreSQL on Neon

- User data is **relational**: a user has favorites, comparisons, indicators and notes. The database itself enforces integrity with *foreign keys*, *unique constraints* and *check constraints*.
- **Neon** was chosen for the easiest integration with Vercel: one click, and the connection strings are set in Vercel's environment automatically. Neon can also create a database branch per preview deployment.

> **Developer note:** I first built this on **Supabase** (its database, auth and client SDK). Because of *vendor lock-in* concerns, I replaced it with **Drizzle ORM** on standard Postgres, and Supabase Auth with **Auth.js**. No code is tied to a particular database provider anymore. If the database server changes (Neon, RDS, Railway or self-hosted), only `DATABASE_URL` changes.

---

## 3. Running locally

### Option A: Docker (fastest, no setup)

Requires: Docker Desktop.

```bash
git clone <repo-url> && cd world-data
docker compose up --build
```

Open http://localhost:3000, go to **Sign in** and choose **Dev login (local only)**.

- This runs Postgres 17 and `next dev` (hot reload). Migrations are applied automatically when the container starts.
- **No `.env.local` or Google account needed.** Dev login signs in as the demo user `dev@localhost`. It only works under `next dev`, and production builds never register the provider.
- Ports are bound to `127.0.0.1` only, so nothing is reachable from the network.
- Reset the data with `docker compose down -v`.

### Option B: Node on the host

Requires: Node ≥ 22.18, pnpm, and Docker (for Postgres) or your own Postgres 13+.

```bash
pnpm install
cp .env.local.example .env.local   # then add AUTH_SECRET and AUTH_DEV_LOGIN=true
docker compose up -d db            # Postgres on localhost:5432
pnpm db:migrate
pnpm dev                           # http://localhost:3000
```

Generate `AUTH_SECRET` with `npx auth secret`.

### Google sign-in (optional)

1. In Google Cloud Console, go to **APIs & Services → Credentials → Create OAuth client ID**, and choose *Web application*.
2. Add the redirect URI `http://localhost:3000/api/auth/callback/google`.
3. Put the values in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local`.

### Other commands

```bash
pnpm test:coverage   # all tests + coverage report (fails below 95%)
pnpm typecheck
pnpm lint
pnpm db:generate     # write a new SQL migration after changing the schema
pnpm db:studio       # table browser
```

---

## 4. Production environment

```
Browser ──► Vercel (Next.js: pages + /api/*) ──► Neon Postgres (pooled)
                     │
                     └──► World Bank API (cached for 24h by Next.js)
```

### Vercel

- The repo is connected to Vercel. Every push to `main` becomes a **Production** deployment, and every branch or PR gets a **Preview** deployment.
- The build runs the `vercel-build` script, `pnpm db:migrate && pnpm build`. Migrations are applied **before** the build, and a failed migration fails the deploy, so the previous version stays live.
- Environment variables set by hand: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. `AUTH_URL` isn't needed because Auth.js detects Vercel.

### Neon

- Connected through Vercel's Neon integration, which sets:
  - `DATABASE_URL`: the **pooled** connection (PgBouncer), used by the app. Many serverless functions can run at once, so the pooler keeps the database from running out of connections.
  - `DATABASE_URL_UNPOOLED`: the **direct** connection, used only for migrations. The migration script refuses a pooled URL.

### Migration safeguards

- **Advisory lock.** Concurrent deploys apply migrations one at a time, and give up with an error after 5 minutes instead of hanging.
- **Previews never touch production.** Preview builds skip migrations unless `MIGRATE_PREVIEW=true` is set. That variable is turned on together with *Neon preview branches*, so each preview gets its own copy of the database.
- **Migrations are backward compatible**, because they run before the new version goes live. For example: add a column, deploy, then drop the old one in a later release.

---

## 5. Project structure

```
app/                       routing (pages, loading/error boundaries, api/*)
  (site)/                  compare, library, login, auth/*
  countries/               country list + detail
  api/                     REST route handlers (favorites, comparisons, indicators, notes, auth)
components/                feature components (countries, map, indicators, compare, library, notes, auth)
  shared/                  presentational pieces used across features (skeletons, empty and error states)
  ui/                      shadcn components
lib/
  domain/                  pure logic shared by server and browser: types, indicator catalog, parsers
  server/                  server-only
    worldbank/             World Bank HTTP client (timeout, caching), queries, normalizers
    db/                    Drizzle schema, Postgres client, migration target
    repositories/          user-scoped queries, the only code that touches app tables
    services/              data composed for pages
    auth/                  session, sign-in server actions, Auth.js adapter
    http/                  route-handler wrapper (auth, error mapping) + request validation
  client/                  browser-only
    api/                   typed calls to /api/*
    hooks/                 client hooks
  utils/                   formatting, cn, safe redirects
stores/                    zustand (library, compare tray)
migrations/                SQL migrations (drizzle-kit), committed
scripts/                   migrate.mts, build-geo.mts
test-kit/                  integration test helpers (fake fetch, Auth.js, navigation, in-process Postgres)
auth.ts                    Auth.js config
compose.yaml               Postgres + app for local development
```

**Layer boundaries are enforced by lint.** `lib/server` and `lib/client` may only use `lib/domain` and `lib/utils`, never each other. If browser code imports `lib/server`, `pnpm lint` fails.

---

## 6. Best practices

### Server-side data fetching

- World Bank data is fetched in **React Server Components**, not in the browser. The client never calls the third-party API directly, and the HTML already contains the data when it arrives.
- Responses are cached by Next.js (`revalidate` 24h, 7 days for indicator metadata) and deduplicated per request with `React.cache`, so a page that uses the same data in several places makes one request.
- To keep the cache effective, indicator history is always fetched in full and filtered on the server. Changing the year range reuses the cached response.

### Non-blocking (async I/O)

- All I/O (World Bank, Postgres) is async; no synchronous operation blocks the event loop.
- Independent requests run **in parallel** with `Promise.all`, for example the country list and the map data, or the latest values for every country on the compare page.
- Client mutations use **optimistic updates** (zustand): the UI changes immediately, and rolls back with a toast if the request fails.

### Timeouts and retry when the World Bank is slow

The World Bank API can take tens of seconds for uncached requests. How that's handled:

- **15-second timeout** (configurable with `WORLD_BANK_TIMEOUT_MS`). After that the page stops waiting and shows an error in the failed section only, not the whole page.
- **The request isn't aborted.** The slow request keeps running in the background and its response lands in Next's cache, so when the user clicks **"Try again"** the retry usually succeeds straight from the cache.
- **Retry is manual**, through the "Try again" button, not automatic. Automatically retrying an API that is already slow only adds load and waiting time.
- Errors other than timeouts are logged on the server, so real failures (not just slowness) stay visible.
- World Bank errors returned with **HTTP 200** and a `[{ message }]` body are detected and turned into a `WorldBankError`.

### React Suspense and streaming

- Every slow part of a page is wrapped in `<Suspense>` with its own skeleton, for example each KPI card, the history chart and the compare table. Fast parts render first.
- Each route has a `loading.tsx` and an `error.tsx`, so navigation shows a skeleton immediately and an error in one route doesn't break the whole app.
- The user's session is streamed into the layout as a promise, so the page shell doesn't wait for the session check.

### Structure that scales

- Split by feature (`components/<feature>`) and by layer (`domain`, `server`, `client`), with boundaries enforced by lint.
- Leaf components take data and callbacks as props; store and server wiring lives in the feature's parent component (`CountryNotes` passes `updateNote` to `NoteItem`, `LatestKpiCard` fetches for `KpiCard`). `components/ui` and `components/shared` can't import stores, `next/navigation` or `lib/server`/`lib/client`.
- Only `lib/server/repositories` touches tables. Adding a feature means adding a repository, a route and components without changing other layers.

### Security and data integrity

- Ownership is checked in every query, not just in the UI. Another user's data behaves as if it doesn't exist: an update returns 404, and a delete has no effect.
- Input is validated in the route handlers, and constraints are checked again by the database. Postgres errors map to the right HTTP status (409 duplicate, 400 invalid value, 401 expired session).
- Redirects after sign-in only go to internal paths, which prevents open redirects.
- Google OAuth tokens are not stored in the database.

### Testing

- **Unit tests** cover pure logic: validation, formatting, normalizers and helpers.
- **Integration tests** run real route handlers, components, stores and SQL against an **in-process Postgres (PGlite)** with the real migrations. No network or database server needed.
- Only three boundaries are faked: Auth.js, `fetch` and `next/navigation`. A test also **fails** if it makes a `fetch` call that isn't mocked.
- **487 tests, ~98.6% coverage**, with an enforced **95%** threshold: `pnpm test:coverage` fails if coverage drops below it.
