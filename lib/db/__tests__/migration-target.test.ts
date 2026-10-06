import { migrationTarget } from "../migration-target"

const LOCAL = "postgresql://postgres:postgres@localhost:5432/world_data"
const NEON = "postgresql://u:p@ep-cool-1234.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
const NEON_POOLED = "postgresql://u:p@ep-cool-1234-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

describe("migrationTarget", () => {
  it("uses DATABASE_URL locally", () => {
    expect(migrationTarget({ DATABASE_URL: LOCAL })).toEqual({ url: LOCAL })
  })

  it("prefers the unpooled URL and adapts it for postgres.js", () => {
    expect(migrationTarget({ DATABASE_URL: NEON_POOLED, DATABASE_URL_UNPOOLED: NEON })).toEqual({
      url: "postgresql://u:p@ep-cool-1234.us-east-2.aws.neon.tech/neondb?sslmode=require",
    })
  })

  it("refuses a pooled URL", () => {
    expect(migrationTarget({ DATABASE_URL: NEON_POOLED })).toEqual({
      error: expect.stringContaining("DATABASE_URL_UNPOOLED"),
    })
  })

  it("skips Vercel preview builds unless opted in", () => {
    expect(migrationTarget({ VERCEL_ENV: "preview", DATABASE_URL: NEON })).toEqual({
      skip: expect.stringContaining("MIGRATE_PREVIEW"),
    })
    expect(migrationTarget({ VERCEL_ENV: "preview", MIGRATE_PREVIEW: "true", DATABASE_URL_UNPOOLED: NEON })).toEqual({
      url: expect.stringContaining("ep-cool-1234.us-east-2"),
    })
  })

  it("migrates production builds", () => {
    expect(migrationTarget({ VERCEL_ENV: "production", DATABASE_URL_UNPOOLED: NEON })).toHaveProperty("url")
  })

  it.each([
    ["is missing", {}, "DATABASE_URL is not set"],
    ["is still the placeholder", { DATABASE_URL: "postgresql://<user>@<host>/db" }, "not a valid connection string"],
    ["is not a URL", { DATABASE_URL: "nope" }, "not a valid connection string"],
  ])("errors when the URL %s", (_, env, error) => {
    expect(migrationTarget(env)).toEqual({ error: expect.stringContaining(error) })
  })
})
