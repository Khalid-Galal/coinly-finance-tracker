// Runs before each test file's imports, so the eager PrismaClient singleton in
// lib/server/db.ts binds to the disposable test DB — never the developer's dev.db.
const TEST_DATABASE_URL = "file:./test.db";
process.env.DATABASE_URL = TEST_DATABASE_URL;

if (!process.env.DATABASE_URL.includes("test.db")) {
  throw new Error("Test DB guard: DATABASE_URL must point at test.db — refusing to run.");
}
