import { defineConfig } from "vitest/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the "@/..." path alias (used by app/api route handlers) so route-handler tests can import them.
const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": root } },
  test: {
    environment: "node",
    // Unit/integration tests (lib/**) + API route-handler tests (app/**). Playwright e2e live in ./e2e.
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
    // Provision a disposable test DB once, and point every worker at it before
    // PrismaClient is constructed — tests must never touch the dev database.
    globalSetup: ["./vitest.globalSetup.ts"],
    setupFiles: ["./vitest.setup.ts"],
    // DB-backed test files share one SQLite test.db; run files serially so their
    // per-test resets don't race against each other.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      // Cover the testable server/business logic. App routes and React components
      // are framework glue exercised by Playwright e2e, not unit-counted here.
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/**/index.ts", "lib/**/types.ts"],
      reporter: ["text", "text-summary"],
      // US-G6: enforce >=70% coverage. CI fails below this.
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 70 },
    },
  },
});
