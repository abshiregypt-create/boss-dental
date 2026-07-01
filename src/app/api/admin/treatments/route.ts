import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { normalizePhone } from "@/lib/server/phone";
import { ensurePatient } from "@/lib/server/appointments";
import { computeTotals, normalizeMethod } from "@/lib/server/operations";

const tail = (p: string) => (p || "").replace(/\D/g, "").slice(-9);

/**
 * GET /api/admin/treatments?phone=...
 * Returns the patient's operations, payments and money totals (billed/paid/balance).
 * Keyed by phone so it works for any patient (WhatsApp, website or manual).
 */
export async function GET(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const phoneParam = new URL(req.url).searchParams.get("phone");
  if (!phoneParam) return NextResponse.json({ error: "phone_required" }, { status: 400 });

  const key = normalizePhone(phoneParam).digits || phoneParam.replace(/\D/g, "");
  const t = tail(key);
  if (t.length < 8) return NextResponse.json({ treatments: [], payments: [], totals: { billed: 0, paid: 0, balance: 0 } });

  // All patient rows that share this phone (there should be one, but match the
  // trailing digits to be safe), then their treatments + payments.
  const patients = await prisma.patient.findMany({ where: { phone: { contains: t } }, select: { id: true } });
  const patientIds = patients.map((p) => p.id);
  if (patientIds.length === 0) {
    return NextResponse.json({ treatments: [], payments: [], totals: { billed: 0, paid: 0, balance: 0 } });
  }

  const [treatments, payments] = await Promise.all([
    prisma.treatmentRecord.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { performedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  // Amount paid toward each specific treatment (for the per-operation remaining).
  const paidByTreatment = new Map<string, number>();
  for (const p of payments) {
    if (p.treatmentRecordId) {
      paidByTreatment.set(p.treatmentRecordId, (paidByTreatment.get(p.treatmentRecordId) ?? 0) + p.amount);
    }
  }

  return NextResponse.json({
    treatments: treatments.map((t) => ({
      id: t.id,
      procedureId: t.procedureId,
      nameEn: t.nameEn,
      nameAr: t.nameAr,
      price: t.price,
      paid: paidByTreatment.get(t.id) ?? 0,
      notes: t.notes,
      performedAt: t.performedAt.toISOString(),
    })),
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      note: p.note,
      treatmentRecordId: p.treatmentRecordId,
      paidAt: p.paidAt.toISOString(),
    })),
    totals: computeTotals(treatments, payments),
  });
}

/**
 * POST /api/admin/treatments
 * Records an operation for a patient (creating the patient by phone if needed),
 * with an optional initial payment (full or partial).
 * Body: { phone, name?, procedureId?, nameEn, nameAr, price, notes?, paidNow?, method?, performedAt? }
 */
export async function POST(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  let body: {
    phone?: string;
    name?: string;
    procedureId?: string | null;
    nameEn?: string;
    nameAr?: string;
    price?: number;
    notes?: string;
    paidNow?: number;
    method?: string;
    performedAt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phoneRaw = String(body.phone ?? "").trim();
  if (!phoneRaw) return NextResponse.json({ error: "phone_required" }, { status: 400 });
  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "bad_price" }, { status: 400 });

  // Resolve the name/price from the catalog if a procedureId is given.
  let nameEn = String(body.nameEn ?? "").trim();
  let nameAr = String(body.nameAr ?? "").trim();
  let procedureId = body.procedureId ? String(body.procedureId) : null;
  if (procedureId) {
    const proc = await prisma.procedure.findUnique({ where: { id: procedureId } });
    if (proc) {
      nameEn = nameEn || proc.nameEn;
      nameAr = nameAr || proc.nameAr;
    } else {
      procedureId = null; // stale id → treat as custom
    }
  }
  if (!nameEn && !nameAr) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const to = normalizePhone(phoneRaw).digits || phoneRaw.replace(/\D/g, "");
  const patientId = await ensurePatient(String(body.name ?? "").trim() || nameAr || nameEn, to);
  if (!patientId) return NextResponse.json({ error: "patient_failed" }, { status: 400 });

  const performedAt = body.performedAt ? new Date(body.performedAt) : new Date();

  const treatment = await prisma.treatmentRecord.create({
    data: {
      patientId,
      procedureId,
      nameEn: nameEn || nameAr,
      nameAr: nameAr || nameEn,
      price,
      notes: body.notes ? String(body.notes).trim() : null,
      performedAt: isNaN(performedAt.getTime()) ? new Date() : performedAt,
    },
  });

  // Optional initial payment (full or partial), capped at the treatment price.
  const paidNow = Number(body.paidNow);
  if (Number.isFinite(paidNow) && paidNow > 0) {
    await prisma.payment.create({
      data: {
        patientId,
        treatmentRecordId: treatment.id,
        amount: Math.min(paidNow, price),
        method: normalizeMethod(body.method),
        paidAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true, id: treatment.id });
}
