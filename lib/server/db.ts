import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Singleton — avoids exhausting connections during Next.js dev hot-reload.
const g = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Bound to DATABASE_URL (SQLite) locally and on Render by default: the deployed instance persists
 * its SQLite file on the Render Starter plan's 1 GB disk at /var/data (render.yaml), so data
 * survives redeploys. When TURSO_DATABASE_URL is set, the libSQL driver adapter switches to hosted
 * Turso as an optional off-box alternative. Setting the two TURSO_* env vars is all that's
 * needed — no code change. See DESIGN.md "Deployment options".
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
