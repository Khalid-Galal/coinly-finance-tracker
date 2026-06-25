import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Unit/integration tests only. Playwright e2e specs live in ./e2e and run separately.
    include: ["lib/**/*.test.ts"],
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
