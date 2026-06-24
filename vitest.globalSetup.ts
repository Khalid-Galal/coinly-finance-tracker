import { execSync } from "node:child_process";

// Disposable test database (resolves to prisma/test.db, git-ignored).
const TEST_DATABASE_URL = "file:./test.db";

export default function setup() {
  // Apply committed migrations to a fresh/idempotent test DB. Runs once per test run
  // and works on a clean clone / CI from the committed prisma/migrations.
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
