import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireRole, OWNER_ROLES } from "@/lib/server/guard";
import { writeAudit, auditIp } from "@/lib/server/audit";
import { expensesForMonth, normalizeExpenseKind } from "@/lib/server/expenses";
import { isValidMonthKey, monthKeyOf } from "@/lib/server/doctors";
import { num } from "@/lib/server/money";

/**
 * GET /api/admin/expenses?month=YYYY-MM
 * Active clinic expenses with the amount that applies to the requested month
 * (recurring default unless overridden) and the month total.
 */
export async function GET(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const p = new URL(req.url).searchParams.get("month");
  const month = isValidMonthKey(p) ? p : monthKeyOf(new Date());
  const { expenses, total } = await expensesForMonth(month);
  return NextResponse.json({ month, expenses, total });
}

export async function POST(req: Request) {
  const { error, session } = await requireRole(OWNER_ROLES);
  if (error) return error;

  let body: { labelEn?: string; labelAr?: string; kind?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const labelEn = String(body.labelEn ?? "").trim();
  const labelAr = String(body.labelAr ?? "").trim();
  if (!labelEn && !labelAr) return NextResponse.json({ error: "label_required" }, { status: 400 });

  const amount = Number(body.amount);
  const max = await prisma.clinicExpense.aggregate({ _max: { sortOrder: true } });
  const expense = await prisma.clinicExpense.create({
    data: {
      labelEn: labelEn || labelAr,
      labelAr: labelAr || labelEn,
      kind: normalizeExpenseKind(body.kind),
      amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
      active: true,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  await writeAudit({
    action: "expense.create",
    actor: session,
    entityType: "ClinicExpense",
    entityId: expense.id,
    summary: `Created expense ${expense.labelEn || expense.labelAr}`,
    metadata: { amount: Number(expense.amount), kind: expense.kind },
    ip: auditIp(req),
  });
  return NextResponse.json({ expense: { ...expense, amount: num(expense.amount) } });
}
