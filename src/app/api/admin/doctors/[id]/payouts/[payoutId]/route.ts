import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";

/** DELETE /api/admin/doctors/[id]/payouts/[payoutId] — remove a doctor payout. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; payoutId: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id, payoutId } = await ctx.params;

  const payout = await prisma.doctorPayout.findUnique({ where: { id: payoutId }, select: { id: true, doctorId: true } });
  if (!payout || payout.doctorId !== id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.doctorPayout.delete({ where: { id: payoutId } });
  return NextResponse.json({ ok: true });
}
