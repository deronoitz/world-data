import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const IGNORED = ["**/node_modules/**", "**/.next/**"]

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws when imported outside a React Server Component bundle.
    alias: { "server-only": fileURLToPath(new URL("./test-kit/empty.ts", import.meta.url)) },
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["app/**", "components/**", "lib/**", "stores/**", "auth.ts"],
      // components/ui is generated shadcn code, tested upstream.
      exclude: ["**/__tests__/**", "**/*.d.ts", "components/ui/**"],
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: [...IGNORED, "**/*.integration.test.*"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          // Route handler / World Bank client tests opt into node with `// @vitest-environment node`.
          environment: "jsdom",
          include: ["**/*.integration.test.{ts,tsx}"],
          exclude: IGNORED,
          setupFiles: ["./test-kit/setup.ts"],
        },
      },
    ],
  },
})
