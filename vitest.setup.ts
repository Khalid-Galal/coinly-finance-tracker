import { beforeEach, afterAll } from "vitest";

// Runs before each test file's imports, so the eager PrismaClient singleton in
// lib/server/db.ts binds to the disposable test DB — never the developer's dev.db.
process.env.DATABASE_URL = "file:./test.db";

if (!process.env.DATABASE_URL.includes("test.db")) {
  throw new Error("Test DB guard: DATABASE_URL must point at test.db — refusing to run.");
}

// FK-safe clean slate before every test (children before parents), so each test —
// and each test file — starts from an empty database. db is imported dynamically
// (not statically) so it binds AFTER DATABASE_URL is set above.
beforeEach(async () => {
  const { db } = await import("./lib/server/db");
  await db.auditLog.deleteMany();
  await db.transaction.deleteMany();
  await db.categorizationRule.deleteMany();
  await db.budget.deleteMany();
  await db.exchangeRate.deleteMany();
  await db.insight.deleteMany();
  await db.qaHistory.deleteMany();
  await db.category.deleteMany();
  await db.account.deleteMany();
  await db.setting.deleteMany();
});

// Disconnect so the Prisma handle doesn't keep the test runner alive.
afterAll(async () => {
  const { db } = await import("./lib/server/db");
  await db.$disconnect();
});
