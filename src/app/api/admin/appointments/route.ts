import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { stageOf, minutesUntil, ensurePatient } from "@/lib/server/appointments";
import { normalizePhone } from "@/lib/server/phone";
import { generateCode } from "@/lib/server/code";

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
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      doctor: { select: { id: true, nameEn: true, nameAr: true } },
    },
  });

  return NextResponse.json({
    appointments: appts.map((a) => ({
      ...a,
      doctorNameEn: a.doctor?.nameEn ?? null,
      doctorNameAr: a.doctor?.nameAr ?? null,
      stage: stageOf(a, now),
      minutesUntil: Math.round(minutesUntil(a, now)),
    })),
  });
}

/**
 * POST /api/admin/appointments
 * Doctor books an appointment straight from the dashboard. Creates a *confirmed*
 * appointment (so it lands on the schedule immediately), optionally assigned to a
 * doctor, and links or creates the client account:
 *   - patientId given  → use that existing profile.
 *   - createAccount !== false → ensurePatient (dedupes by phone, creates if new).
 *   - createAccount === false → book with name+phone only, no account linked yet.
 * Body: { name, phone, scheduledAt, durationMin?, serviceId?, serviceLabelEn?,
 *         serviceLabelAr?, complaint?, doctorId?, patientId?, createAccount? }
 */
export async function POST(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  let body: {
    name?: string;
    phone?: string;
    scheduledAt?: string;
    durationMin?: number;
    serviceId?: string;
    serviceLabelEn?: string;
    serviceLabelAr?: string;
    complaint?: string;
    doctorId?: string | null;
    patientId?: string | null;
    createAccount?: boolean;
    lang?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const phoneRaw = String(body.phone ?? "").trim();
  if (!name || !phoneRaw) return NextResponse.json({ error: "name_phone_required" }, { status: 400 });

  const when = new Date(String(body.scheduledAt ?? ""));
  if (Number.isNaN(when.getTime())) return NextResponse.json({ error: "bad_date" }, { status: 400 });

  const serviceId = String(body.serviceId ?? "checkup").trim() || "checkup";
  const serviceLabelEn = String(body.serviceLabelEn ?? serviceId).trim() || serviceId;
  const serviceLabelAr = String(body.serviceLabelAr ?? serviceLabelEn).trim() || serviceLabelEn;

  // Validate the doctor if one was chosen.
  let doctorId: string | null = body.doctorId ? String(body.doctorId) : null;
  if (doctorId) {
    const doc = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
    if (!doc) doctorId = null;
  }

  const norm = normalizePhone(phoneRaw);
  const phone = norm.e164 || phoneRaw;

  // Resolve the client account.
  let patientId: string | null = null;
  if (body.patientId) {
    const existing = await prisma.patient.findUnique({ where: { id: String(body.patientId) }, select: { id: true } });
    patientId = existing?.id ?? null;
  }
  if (!patientId && body.createAccount !== false) {
    try {
      patientId = await ensurePatient(name, phone);
    } catch (e) {
      console.error("[appointments] ensurePatient failed:", e instanceof Error ? e.message : e);
    }
  }

  // Unique short tracking code (same alphabet as bookings).
  let code = generateCode();
  for (let i = 0; i < 6; i++) {
    const clash = await prisma.appointment.findUnique({ where: { code }, select: { id: true } });
    if (!clash) break;
    code = generateCode();
  }

  const appt = await prisma.appointment.create({
    data: {
      code,
      patientName: name,
      phone,
      serviceId,
      serviceLabelEn,
      serviceLabelAr,
      scheduledAt: when,
      durationMin: Number(body.durationMin) > 0 ? Math.round(Number(body.durationMin)) : 30,
      complaint: body.complaint ? String(body.complaint).trim() : null,
      lang: body.lang === "ar" ? "ar" : "en",
      status: "confirmed",
      confirmedAt: new Date(),
      doctorId,
      patientId,
    },
  });

  return NextResponse.json({ ok: true, code: appt.code, id: appt.id });
}

