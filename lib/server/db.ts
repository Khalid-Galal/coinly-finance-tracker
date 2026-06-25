import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Singleton — avoids exhausting connections during Next.js dev hot-reload.
const g = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Bound to DATABASE_URL (SQLite) locally and on Render by default. When TURSO_DATABASE_URL is set,
 * use the libSQL driver adapter so the deployed instance persists data across redeploys (the
 * Render free-tier disk is ephemeral). Setting the two TURSO_* env vars is all that's needed —
 * no code change. See DESIGN.md "Deployment options".
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    const adapter = new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const db = g.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") g.prisma = db;
