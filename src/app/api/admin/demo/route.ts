import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { generateCode } from "@/lib/server/code";
import { confirmAppointment } from "@/lib/server/appointments";

/**
 * Admin demo helper: create a *confirmed* appointment N minutes from now so the
 * WhatsApp + live-queue stages can be showcased without waiting hours.
 */
export async function POST(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const minutes = Number(body.minutes);
  const mins = Number.isFinite(minutes) ? minutes : 50;
  const lang = body.lang === "ar" ? "ar" : "en";

  let code = generateCode();
  for (let i = 0; i < 6; i++) {
    const clash = await prisma.appointment.findUnique({ where: { code } });
    if (!clash) break;
    code = generateCode();
  }

  const appt = await prisma.appointment.create({
    data: {
      code,
      patientName: String(body.name || "Demo Patient"),
      phone: String(body.phone || "+20 100 000 0000"),
      serviceId: "checkup",
      serviceLabelEn: "Check-up",
      serviceLabelAr: "كشف",
      scheduledAt: new Date(Date.now() + mins * 60000),
      durationMin: 30,
      lang,
      status: "pending",
    },
  });

  await confirmAppointment({ id: appt.id });
  return NextResponse.json({ ok: true, code: appt.code, minutes: mins });
}
