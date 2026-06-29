import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Fresh, migrated e2e database before the server starts, so the run is deterministic and the
// first-run wizard appears. `file:./e2e.db` resolves to prisma/e2e.db (same as the dev/test DBs).
export default function globalSetup() {
  // Group A isolation: own e2e DB file (TEST_PLAN §8.2), separate from the shared e2e.db.
  for (const f of ["prisma/e2e-a.db", "prisma/e2e-a.db-journal"]) rmSync(f, { force: true });
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./e2e-a.db" },
  });
}
