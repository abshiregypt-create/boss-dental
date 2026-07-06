import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { expensesForMonth, normalizeExpenseKind } from "@/lib/server/expenses";
import { isValidMonthKey, monthKeyOf } from "@/lib/server/doctors";

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
  const { error } = await requireSession();
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
  return NextResponse.json({ expense });
}
