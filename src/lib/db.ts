import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot-reloads / serverless invocations.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Cache the client on the global in EVERY environment. Cliniva runs as a
// long-lived server (Railway `next start`) and as an Electron desktop process —
// never per-request serverless — so skipping the cache in production would open a
// fresh connection pool on each cold module load and exhaust Postgres'
// max_connections under load. (Reviewed: backend blueprint Issue 9.)
globalForPrisma.prisma = prisma;
