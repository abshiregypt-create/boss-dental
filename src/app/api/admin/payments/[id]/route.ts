import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { withRoute } from "@/lib/server/http";

/** Admin: delete a payment. */
export const DELETE = withRoute("admin.payments.id.DELETE", adminPaymentsIdDELETE);

async function adminPaymentsIdDELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;
  await prisma.payment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
