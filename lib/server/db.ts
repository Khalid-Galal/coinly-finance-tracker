import { PrismaClient } from "@prisma/client";

// Singleton — avoids exhausting connections during Next.js dev hot-reload.
// Bound to DATABASE_URL (SQLite locally and on Render). Turso libSQL is an optional
// persistence upgrade for the deployed instance — not currently wired (see DESIGN.md).
const g = globalThis as unknown as { prisma?: PrismaClient };

export const db = g.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") g.prisma = db;
