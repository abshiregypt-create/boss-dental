import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCode } from "@/lib/server/code";
import { normalizePhone } from "@/lib/server/phone";

/** Public endpoint: create a booking request from the landing-page form. */
export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const name = String(data.name ?? "").trim();
  const phone = String(data.phone ?? "").trim();
  const serviceId = String(data.serviceId ?? "").trim();
  const scheduledAtRaw = data.scheduledAt as string | undefined;

  if (!name || !phone || !serviceId || !scheduledAtRaw) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const when = new Date(scheduledAtRaw);
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "bad_date" }, { status: 400 });
  }

  const norm = normalizePhone(phone);

  let code = generateCode();
  for (let i = 0; i < 6; i++) {
    const clash = await prisma.appointment.findUnique({ where: { code } });
    if (!clash) break;
    code = generateCode();
  }

  const appt = await prisma.appointment.create({
    data: {
      code,
      patientName: name,
      phone: norm.e164 || phone,
      serviceId,
      serviceLabelEn: String(data.serviceLabelEn ?? serviceId),
      serviceLabelAr: String(data.serviceLabelAr ?? serviceId),
      scheduledAt: when,
      durationMin: Number(data.durationMin) || 30,
      complaint: data.complaint ? String(data.complaint) : null,
      offerTitle: data.offerTitle ? String(data.offerTitle) : null,
      lang: data.lang === "ar" ? "ar" : "en",
      status: "pending",
    },
  });

  return NextResponse.json({ ok: true, code: appt.code, id: appt.id });
}
