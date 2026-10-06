# World Data Explorer

Browse, map and compare World Bank development indicators by country. Signed-in users can keep a private library of favorite countries, saved comparisons, pinned indicators and notes.

- **Frontend:** Next.js 16 App Router with Suspense streaming, shadcn/ui (Base UI), zustand, Recharts and a d3-geo SVG choropleth
- **Data:** [World Bank Indicators API v2](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392), which needs no key. Responses are cached for 24h.
- **Backend:** REST route handlers under `app/api/*`, backed by Postgres via Drizzle ORM, with Google SSO via Auth.js (JWT sessions)

## Setup

### 1. Install

```bash
pnpm install
cp .env.local.example .env.local
```

### 2. Database

Any Postgres 13+ works. Production uses Neon, and local development uses the Postgres in `compose.yaml`:

```bash
docker compose up -d db    # local Postgres on :5432 (matches .env.local.example)
pnpm db:migrate            # applies migrations/ to DATABASE_URL
```

The schema lives in `lib/db/schema.ts` (Drizzle). After changing it, run `pnpm db:generate` to write a new SQL migration into `migrations/`, review it, and commit it. `pnpm db:studio` opens a table browser.

### 3. Google SSO (Auth.js)

Optional for local development: with `AUTH_DEV_LOGIN=true` (already set by `compose.yaml`), `/login` also shows **Dev login (local only)**, which signs in as a demo user (`dev@localhost`) without Google. It only works under `next dev`: production builds never register that provider. For `pnpm dev` on the host, add `AUTH_DEV_LOGIN=true` to `.env.local`.

To set up Google sign-in:

1. In Google Cloud Console, go to **APIs & Services → Credentials → Create OAuth client ID**, and choose Web application.
2. Add the authorized redirect URI `http://localhost:3000/api/auth/callback/google`, plus `https://<your-domain>/api/auth/callback/google` for production.
3. Put the client ID and secret in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, and generate `AUTH_SECRET` with `npx auth secret`.

### 4. Run

```bash
pnpm dev        # http://localhost:3000
```

Without the auth and database env vars the app still runs: browsing, the map and comparing all work, and saving features say sign-in isn't configured.

## Deploy (Vercel + Neon)

The app runs on Vercel, and the database is Neon Postgres via Vercel's Neon integration.

1. Import the repo into Vercel. The Next.js preset needs no extra settings.
2. **Storage → Create Database → Neon** (or connect an existing Neon project), and attach it to the Production and Preview environments. The integration sets `DATABASE_URL` (pooled, used by the app) and `DATABASE_URL_UNPOOLED` (direct, used by migrations).
   - Enable Neon's **preview branches**: every preview deploy then gets its own copy-on-write database branch. Then set `MIGRATE_PREVIEW=true` for the Preview environment. Until you do, preview builds skip migrations, so an unmerged migration can never reach production.
3. Add `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. `AUTH_URL` isn't needed because Auth.js detects Vercel.
4. Add `https://<your-domain>/api/auth/callback/google` to the Google OAuth client's redirect URIs.

Vercel runs the `vercel-build` script, `pnpm db:migrate && pnpm build`, so pending migrations are applied before each build. A failed migration fails the deploy. Migrations hold a Postgres advisory lock, so concurrent deploys apply them one at a time. They run before the new version goes live, so keep them backward compatible (add a column, deploy, then drop the old one in a later release). Neon connection strings can be used as-is: `lib/db/connection.ts` drops `channel_binding`, a libpq-only option that postgres.js would otherwise send to the server.

## Run locally with Docker (optional)

`compose.yaml` is for local development only. It runs Postgres 17 (`db`) and the app (`app`, built from `Dockerfile.dev`).

```bash
docker compose up --build    # Postgres + next dev on http://localhost:3000
docker compose up -d db      # only Postgres, then `pnpm db:migrate && pnpm dev` on the host
```

- `docker compose up --build` works on a fresh clone without `.env.local`: sign in with **Dev login**. Add `.env.local` only for Google sign-in.
- The `app` container always uses the `db` service, whatever `DATABASE_URL` is in `.env.local`. It reads the other variables from `.env.local` (if present), applies migrations on start, and hot-reloads your edits.
- For `pnpm dev` on the host, set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/world_data` (the `.env.local.example` default).
- Data persists in the `pgdata` volume. Reset it with `docker compose down -v`.
- Port 5432 must be free. Stop any local Postgres first, or change the host port in `compose.yaml`.
- If edits aren't picked up on your Docker VM, add `WATCHPACK_POLLING=true` to `.env.local`.

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

Ownership is enforced in `lib/data/*`: every query is scoped to the signed-in user's id, so one user can never read or modify another user's rows. Updating or deleting someone else's row behaves as if it doesn't exist.

## Project layout

```
app/                     routes (pages, loading/error boundaries, api/*, auth/*)
components/              feature components (countries, map, indicators, compare, notes, library, auth)
components/ui/           shadcn components
lib/worldbank/           typed API client + normalizers (server-only)
lib/indicators.ts        curated indicator catalog
lib/db/                  Drizzle schema, Postgres client, row types
lib/data/                user-scoped queries (the only place that touches app tables)
lib/auth/                session helper, sign-in server action, env check
lib/api/                 route helpers and request validation
stores/                  zustand: user library (optimistic) + compare tray (localStorage)
auth.ts                  Auth.js config (Google, Drizzle adapter, JWT sessions)
migrations/              generated SQL migrations (drizzle-kit)
test-kit/                integration test helpers (fetch, Auth.js and next/navigation fakes, in-process Postgres)
```

## Testing

Tests run on [Vitest](https://vitest.dev) and live in `__tests__/` folders next to the code they cover. Neither layer needs a network connection or a database server: integration tests run real SQL against an in-process Postgres ([PGlite](https://pglite.dev)) with the real migrations.

```bash
pnpm test               # unit: *.test.ts, pure functions and stores
pnpm test:integration   # integration: *.integration.test.ts(x)
pnpm test:all           # both
pnpm test:watch         # watch mode
pnpm test:coverage      # both layers + coverage report (fails below 95%)
pnpm typecheck          # tsc, including test files
```

- **Unit** tests cover pure logic: validation, formatting, normalizers and helpers.
- **Integration** tests run real route handlers, client components, zustand stores and `lib/api/client.ts` together. Only three boundaries are faked: Auth.js, `fetch`, and `next/navigation`. See [`test-kit/README.md`](test-kit/README.md).

Pages and other async Server Components are rendered with `renderServer` from the test-kit. It awaits the async components before React DOM renders the tree.

## World Bank API notes

- The API reports errors with **HTTP 200** and a `[{ message: [...] }]` body. The client turns these into a `WorldBankError`.
- `/country` mixes in 78 aggregates (`region.id === "NA"`), which are filtered out.
- `per_page`, `page`, coordinates and `date` sometimes come back as strings. They're normalized in `lib/worldbank/normalize.ts`.
- Series come back newest year first, with `null` for missing years. Charts show those years as gaps.
