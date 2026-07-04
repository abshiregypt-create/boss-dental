import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";

/**
 * Admin analytics: the clinic's key numbers, computed live from appointments,
 * treatments and payments. All money is EGP. `range` bounds the time-limited
 * metrics (revenue, appointments, top procedures, new patients); outstanding
 * balance is always all-time.
 *   GET /api/admin/analytics?range=30d|90d|12m|all   (default 12m)
 */
type Range = "30d" | "90d" | "12m" | "all";

function sinceFor(range: Range): Date | null {
  const now = new Date();
  if (range === "30d") return new Date(now.getTime() - 30 * 86400000);
  if (range === "90d") return new Date(now.getTime() - 90 * 86400000);
  if (range === "12m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 12);
    return d;
  }
  return null; // all
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export async function GET(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const rangeParam = (new URL(req.url).searchParams.get("range") || "12m") as Range;
  const range: Range = ["30d", "90d", "12m", "all"].includes(rangeParam) ? rangeParam : "12m";
  const since = sinceFor(range);
  const now = new Date();

  const [appts, treatments, payments, patients] = await Promise.all([
    prisma.appointment.findMany({
      select: { status: true, scheduledAt: true, completedAt: true, phone: true, createdAt: true },
    }),
    prisma.treatmentRecord.findMany({ select: { nameEn: true, nameAr: true, price: true, performedAt: true } }),
    prisma.payment.findMany({ select: { amount: true, method: true, paidAt: true } }),
    prisma.patient.findMany({ select: { id: true, createdAt: true } }),
  ]);

  const inRange = (d: Date) => (since ? d >= since : true);

  // ---- KPIs ----
  const collected = payments.filter((p) => inRange(p.paidAt)).reduce((s, p) => s + (p.amount || 0), 0);
  const billedInRange = treatments.filter((t) => inRange(t.performedAt)).reduce((s, t) => s + (t.price || 0), 0);
  const billedAll = treatments.reduce((s, t) => s + (t.price || 0), 0);
  const paidAll = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = Math.max(0, billedAll - paidAll);
  const newPatients = patients.filter((p) => inRange(p.createdAt)).length;

  // ---- Appointment breakdown (time-limited by scheduledAt) ----
  const appR = appts.filter((a) => inRange(a.scheduledAt));
  let completed = 0, upcoming = 0, missed = 0, pending = 0, declined = 0, cancelled = 0;
  for (const a of appR) {
    if (a.status === "completed") completed++;
    else if (a.status === "pending") pending++;
    else if (a.status === "declined") declined++;
    else if (a.status === "cancelled") cancelled++;
    else if (a.status === "confirmed") {
      if (a.scheduledAt >= now) upcoming++;
      else missed++; // past confirmed but never marked done
    }
  }
  const noShowRate = completed + missed > 0 ? Math.round((missed / (completed + missed)) * 100) : 0;
  const totalAppts = appR.length;

  // ---- Top procedures (by revenue, in range) ----
  const procMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const t of treatments) {
    if (!inRange(t.performedAt)) continue;
    const name = (t.nameEn || t.nameAr || "—").trim();
    const key = name.toLowerCase();
    const e = procMap.get(key) ?? { name, count: 0, revenue: 0 };
    e.count += 1;
    e.revenue += t.price || 0;
    procMap.set(key, e);
  }
  const topProcedures = [...procMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  // ---- 12-month trend (always last 12 months) ----
  const months: { key: string; revenue: number; appts: number }[] = [];
  const idx = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    idx.set(k, months.length);
    months.push({ key: k, revenue: 0, appts: 0 });
  }
  for (const p of payments) {
    const i = idx.get(monthKey(p.paidAt));
    if (i != null) months[i].revenue += p.amount || 0;
  }
  for (const a of appts) {
    const i = idx.get(monthKey(a.scheduledAt));
    if (i != null) months[i].appts += 1;
  }

  // ---- Payment method mix (in range) ----
  const methodMap = new Map<string, number>();
  for (const p of payments) {
    if (!inRange(p.paidAt)) continue;
    methodMap.set(p.method, (methodMap.get(p.method) ?? 0) + (p.amount || 0));
  }
  const methodMix = [...methodMap.entries()]
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount);

  // ---- New vs returning (patients with an appointment in range) ----
  const tail = (p: string) => (p || "").replace(/\D/g, "").slice(-9);
  const earliestByTail = new Map<string, Date>();
  for (const a of appts) {
    const t = tail(a.phone);
    if (t.length < 8) continue;
    const cur = earliestByTail.get(t);
    if (!cur || a.scheduledAt < cur) earliestByTail.set(t, a.scheduledAt);
  }
  const seen = new Set<string>();
  let newInRange = 0, returningInRange = 0;
  for (const a of appR) {
    const t = tail(a.phone);
    if (t.length < 8 || seen.has(t)) continue;
    seen.add(t);
    const first = earliestByTail.get(t);
    if (first && inRange(first)) newInRange++;
    else returningInRange++;
  }

  return NextResponse.json({
    range,
    kpis: {
      collected,
      billedInRange,
      outstanding,
      totalAppts,
      completed,
      newPatients,
      noShowRate,
    },
    apptsBreakdown: { completed, upcoming, missed, pending, declined, cancelled },
    topProcedures,
    monthly: months,
    methodMix,
    newVsReturning: { new: newInRange, returning: returningInRange },
  });
}
