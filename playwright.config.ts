import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/globalSetup.ts",
  // Stateful journey over one shared DB — run serially to avoid cross-test races.
  workers: 1,
  fullyParallel: false,
  // Generous timeouts absorb the dev server's Turbopack compile-on-first-visit latency (a page's
  // first navigation triggers an on-demand compile), which is the main source of e2e flakiness.
  // No retries: the suite is a stateful shared-DB journey (e.g. the import-dedupe test), so a retry
  // would re-run against mutated state and fail for the wrong reason — better to keep it honest.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3911",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
  },
  webServer: {
    // Free port 3911, own e2e DB, own passcode. Dev server (not a prod build): proxy.ts enforces the
    // gate whenever APP_PASSCODE is set, so the unlock wall is exercised the same way without the
    // multi-minute build — and NODE_ENV stays "development", so the production-only /welcome re-run
    // guard (app/welcome/page.tsx) stays inactive and the specs can drive the wizard directly.
    command: "npm run dev -- -p 3911",
    port: 3911,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { DATABASE_URL: "file:./e2e-a.db", APP_PASSCODE: "a-pass" },
  },
});
