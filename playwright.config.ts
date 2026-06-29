import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/globalSetup.ts",
  // Stateful journey over one shared DB — run serially to avoid cross-test races.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3912" },
  webServer: {
    // Group B isolation (TEST_PLAN §8.2): free port 3912, own e2e DB, own passcode.
    // dev server (not a prod build) — proxy.ts enforces the gate whenever APP_PASSCODE is set,
    // so the unlock wall is exercised the same way without the multi-minute build.
    command: "npm run dev -- -p 3912",
    port: 3912,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { DATABASE_URL: "file:./e2e-b.db", APP_PASSCODE: "b-pass" },
  },
});
