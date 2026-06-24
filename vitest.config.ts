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
  },
});
