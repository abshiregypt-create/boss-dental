import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { isValidMonthKey, monthBounds, monthKeyOf, round2 } from "@/lib/server/doctors";

/**
 * GET /api/admin/doctors/[id]/earnings?month=YYYY-MM
 * A doctor's account: operations they were assigned to, the % taken and amount
 * earned per operation, month + all-time totals, and a 12-month trend.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;

  const monthParam = new URL(req.url).searchParams.get("month");
  const month = isValidMonthKey(monthParam) ? monthParam : null;

  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const links = await prisma.treatmentDoctor.findMany({
    where: { doctorId: id },
    include: { treatmentRecord: { include: { patient: { select: { name: true, phone: true } } } } },
  });

  const now = new Date();
  // 12-month trend buckets
  const months: { key: string; earned: number; count: number }[] = [];
  const idx = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKeyOf(d);
    idx.set(k, months.length);
    months.push({ key: k, earned: 0, count: 0 });
  }

  let allEarned = 0;
  let allCount = 0;
  let monthEarned = 0;
  let monthCount = 0;
  const bounds = month ? monthBounds(month) : null;

  const operations = links
    .map((l) => {
      const t = l.treatmentRecord;
      const performedAt = t.performedAt;
      allEarned += l.amount || 0;
      allCount += 1;
      const mk = monthKeyOf(performedAt);
      const mi = idx.get(mk);
      if (mi != null) {
        months[mi].earned += l.amount || 0;
        months[mi].count += 1;
      }
      const inMonth = bounds ? performedAt >= bounds.start && performedAt < bounds.end : false;
      if (inMonth) {
        monthEarned += l.amount || 0;
        monthCount += 1;
      }
      return {
        id: l.id,
        performedAt: performedAt.toISOString(),
        monthKey: mk,
        nameEn: t.nameEn,
        nameAr: t.nameAr,
        patientName: t.patient?.name ?? null,
        patientPhone: t.patient?.phone ?? null,
        price: t.price,
        commissionPct: l.commissionPct,
        amount: l.amount,
        inMonth,
      };
    })
    .sort((a, b) => (a.performedAt < b.performedAt ? 1 : -1));

  for (const m of months) {
    m.earned = round2(m.earned);
  }

  const list = month ? operations.filter((o) => o.inMonth) : operations;

  return NextResponse.json({
    doctor: {
      id: doctor.id,
      nameEn: doctor.nameEn,
      nameAr: doctor.nameAr,
      specialtyEn: doctor.specialtyEn,
      specialtyAr: doctor.specialtyAr,
      photoUrl: doctor.photoUrl,
      phone: doctor.phone,
      email: doctor.email,
      commissionPct: doctor.commissionPct,
      active: doctor.active,
      notes: doctor.notes,
    },
    month,
    totals: {
      allEarned: round2(allEarned),
      allCount,
      monthEarned: round2(monthEarned),
      monthCount,
    },
    months,
    operations: list.slice(0, 300),
  });
}
