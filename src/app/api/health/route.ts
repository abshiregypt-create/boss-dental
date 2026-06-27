import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Lightweight health probe for monitoring / uptime checks.
 * Returns 200 when the DB is reachable, 503 otherwise.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "up",
      uptimeSec: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        db: "down",
        error: e instanceof Error ? e.message : "unknown",
        time: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
