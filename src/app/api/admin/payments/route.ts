import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { normalizePhone } from "@/lib/server/phone";
import { ensurePatient } from "@/lib/server/appointments";
import { normalizeMethod } from "@/lib/server/operations";

/**
 * POST /api/admin/payments
 * Record a payment from a patient (general, or toward a specific treatment).
 * Body: { phone, name?, amount, method?, note?, treatmentRecordId?, paidAt? }
 */
export async function POST(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  let body: {
    phone?: string;
    name?: string;
    amount?: number;
    method?: string;
    note?: string;
    treatmentRecordId?: string | null;
    paidAt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phoneRaw = String(body.phone ?? "").trim();
  if (!phoneRaw) return NextResponse.json({ error: "phone_required" }, { status: 400 });
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "bad_amount" }, { status: 400 });

  const to = normalizePhone(phoneRaw).digits || phoneRaw.replace(/\D/g, "");
  const patientId = await ensurePatient(String(body.name ?? "").trim() || to, to);
  if (!patientId) return NextResponse.json({ error: "patient_failed" }, { status: 400 });

  // If tied to a treatment, make sure it belongs to this patient.
  let treatmentRecordId: string | null = null;
  if (body.treatmentRecordId) {
    const tr = await prisma.treatmentRecord.findUnique({
      where: { id: String(body.treatmentRecordId) },
      select: { id: true, patientId: true },
    });
    if (tr && tr.patientId === patientId) treatmentRecordId = tr.id;
  }

  const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
  const payment = await prisma.payment.create({
    data: {
      patientId,
      treatmentRecordId,
      amount,
      method: normalizeMethod(body.method),
      note: body.note ? String(body.note).trim() : null,
      paidAt: isNaN(paidAt.getTime()) ? new Date() : paidAt,
    },
  });

  return NextResponse.json({ ok: true, id: payment.id });
}
