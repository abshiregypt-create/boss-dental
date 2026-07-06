import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { round2 } from "@/lib/server/doctors";

/** GET /api/admin/doctors/[id]/payouts — payouts made to a doctor + running totals. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;

  const doctor = await prisma.doctor.findUnique({ where: { id }, select: { id: true } });
  if (!doctor) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [payouts, earnedAgg] = await Promise.all([
    prisma.doctorPayout.findMany({ where: { doctorId: id }, orderBy: { paidAt: "desc" } }),
    prisma.treatmentDoctor.aggregate({ where: { doctorId: id }, _sum: { amount: true } }),
  ]);

  const totalPaid = round2(payouts.reduce((s, p) => s + (p.amount || 0), 0));
  const totalEarned = round2(earnedAgg._sum.amount || 0);

  return NextResponse.json({
    payouts: payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      reference: p.reference,
      note: p.note,
      paidAt: p.paidAt.toISOString(),
    })),
    totals: { totalEarned, totalPaid, pending: round2(totalEarned - totalPaid) },
  });
}

/** POST /api/admin/doctors/[id]/payouts — record a payment made to the doctor. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;

  const doctor = await prisma.doctor.findUnique({ where: { id }, select: { id: true } });
  if (!doctor) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: { amount?: number; method?: string; reference?: string; note?: string; paidAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const amount = round2(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount_required" }, { status: 400 });
  }

  const allowed = new Set(["cash", "card", "transfer", "other"]);
  const method = allowed.has(String(body.method)) ? String(body.method) : "cash";

  let paidAt = new Date();
  if (body.paidAt) {
    const d = new Date(body.paidAt);
    if (!Number.isNaN(d.getTime())) paidAt = d;
  }

  const payout = await prisma.doctorPayout.create({
    data: {
      doctorId: id,
      amount,
      method,
      reference: body.reference ? String(body.reference).trim() : null,
      note: body.note ? String(body.note).trim() : null,
      paidAt,
    },
  });

  return NextResponse.json({ ok: true, payout: { ...payout, paidAt: payout.paidAt.toISOString() } });
}
