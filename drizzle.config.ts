import { defineConfig } from "drizzle-kit"

// drizzle-kit does not read Next's env files; studio/push need DATABASE_URL.
try {
  process.loadEnvFile(".env.local")
} catch {}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/server/db/schema.ts",
  out: "./migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
})
