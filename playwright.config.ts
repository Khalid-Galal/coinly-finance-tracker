import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/globalSetup.ts",
  // Stateful journey over one shared DB — run serially to avoid cross-test races.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3911" },
  webServer: {
    // Group A isolation (TEST_PLAN §8.2): free port 3911, own e2e DB, own passcode.
    // dev server (not a prod build) — proxy.ts enforces the gate whenever APP_PASSCODE is set,
    // so the unlock wall is exercised the same way without the multi-minute build.
    command: "npm run dev -- -p 3911",
    port: 3911,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { DATABASE_URL: "file:./e2e-a.db", APP_PASSCODE: "a-pass" },
  },
});
