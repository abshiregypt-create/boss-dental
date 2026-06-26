import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { stageOf, minutesUntil } from "@/lib/server/appointments";

/** Admin: list recent appointments with their WhatsApp message log + live stage. */
export async function GET(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const status = new URL(req.url).searchParams.get("status") || undefined;
  const now = new Date();

  const appts = await prisma.appointment.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({
    appointments: appts.map((a) => ({
      ...a,
      stage: stageOf(a, now),
      minutesUntil: Math.round(minutesUntil(a, now)),
    })),
  });
}
