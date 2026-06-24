import { PrismaClient } from "@prisma/client";

// Singleton — avoids exhausting connections during Next.js dev hot-reload.
// The libSQL/Turso adapter is wired in Sprint 0 Task 5 (deployed DB).
const g = globalThis as unknown as { prisma?: PrismaClient };

export const db = g.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") g.prisma = db;
