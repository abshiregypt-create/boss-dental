import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, OWNER_ROLES } from "@/lib/server/guard";
import { writeAudit, auditIp } from "@/lib/server/audit";
import { normalizeExpenseKind } from "@/lib/server/expenses";
import { isValidMonthKey } from "@/lib/server/doctors";

/**
 * PATCH /api/admin/expenses/[id]
 * Edit the recurring expense and/or set a specific month's override.
 * Body: { labelEn?, labelAr?, kind?, amount?, active?, monthKey?, monthAmount? }
 *   - monthKey + numeric monthAmount → upsert that month's override.
 *   - monthKey + null monthAmount    → clear that month's override (revert to recurring).
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(OWNER_ROLES);
  if (error) return error;
  const { id } = await ctx.params;

  let body: {
    labelEn?: string;
    labelAr?: string;
    kind?: string;
    amount?: number;
    active?: boolean;
    monthKey?: string;
    monthAmount?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.labelEn === "string" && body.labelEn.trim()) data.labelEn = body.labelEn.trim();
  if (typeof body.labelAr === "string" && body.labelAr.trim()) data.labelAr = body.labelAr.trim();
  if (typeof body.kind === "string") data.kind = normalizeExpenseKind(body.kind);
  if (body.amount != null && Number.isFinite(Number(body.amount)) && Number(body.amount) >= 0) {
    data.amount = Number(body.amount);
  }
  if (typeof body.active === "boolean") data.active = body.active;
  if (Object.keys(data).length > 0) {
    await prisma.clinicExpense.update({ where: { id }, data });
  }

  // Month override handling
  if (isValidMonthKey(body.monthKey)) {
    const monthKey = body.monthKey;
    if (body.monthAmount == null) {
      await prisma.clinicExpenseOverride.deleteMany({ where: { expenseId: id, monthKey } });
    } else if (Number.isFinite(Number(body.monthAmount)) && Number(body.monthAmount) >= 0) {
      const amount = Number(body.monthAmount);
      await prisma.clinicExpenseOverride.upsert({
        where: { expenseId_monthKey: { expenseId: id, monthKey } },
        create: { expenseId: id, monthKey, amount },
        update: { amount },
      });
    }
  }

  const expense = await prisma.clinicExpense.findUnique({ where: { id } });
  await writeAudit({
    action: "expense.update",
    actor: session,
    entityType: "ClinicExpense",
    entityId: id,
    summary: `Updated expense ${id}`,
    metadata: { fields: Object.keys(data), monthKey: body.monthKey ?? null },
    ip: auditIp(req),
  });
  return NextResponse.json({ expense });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(OWNER_ROLES);
  if (error) return error;
  const { id } = await ctx.params;
  await prisma.clinicExpense.delete({ where: { id } });
  await writeAudit({
    action: "expense.delete",
    actor: session,
    entityType: "ClinicExpense",
    entityId: id,
    summary: `Deleted expense ${id}`,
    ip: auditIp(req),
  });
  return NextResponse.json({ ok: true });
}
