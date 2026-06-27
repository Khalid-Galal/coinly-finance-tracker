import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/globalSetup.ts",
  // Stateful journey over one shared DB — run serially to avoid cross-test races.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run build && npm start",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Production build with the passcode gate ON — the e2e exercises the real deployed behaviour
    // (unlock wall + cookie). e2e DB is provisioned in globalSetup.
    env: { DATABASE_URL: "file:./e2e.db", APP_PASSCODE: "e2e-pass" },
  },
});
