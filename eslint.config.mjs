import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layers inside lib/ (see README "Project structure"): domain is pure and shared,
// server and client never import each other.
const restrict = (files, patterns) => ({
  files,
  rules: { "@typescript-eslint/no-restricted-imports": ["error", { patterns }] },
})

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  restrict(
    ["lib/domain/**"],
    [
      {
        regex: "^@/(lib/(server|client|utils)|stores|components|app)/",
        // Row types are derived from the Drizzle schema; type imports are erased.
        allowTypeImports: true,
        message: "lib/domain is pure: no server, client or UI code.",
      },
      { regex: "^(next|react|drizzle-orm|postgres)(/|$)", message: "lib/domain is framework-free." },
    ]
  ),
  restrict(
    ["lib/client/**", "stores/**"],
    [{ regex: "^@/lib/server/", message: "Browser code can't import lib/server; call it through lib/client/api." }]
  ),
  restrict(
    ["components/ui/**", "components/shared/**"],
    [
      {
        regex: "^(@/stores/|@/lib/(server|client)/|next/navigation$)",
        message: "Shared components are presentational: take data and callbacks as props.",
      },
    ]
  ),
  restrict(
    ["lib/server/**"],
    [{ regex: "^@/(lib/client|stores|components)/", message: "lib/server can't import browser code." }]
  ),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
