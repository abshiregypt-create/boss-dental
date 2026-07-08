import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { withRoute } from "@/lib/server/http";

/** Admin: delete a treatment record (its linked payments cascade to general via SetNull). */
export const DELETE = withRoute("admin.treatments.id.DELETE", adminTreatmentsIdDELETE);

async function adminTreatmentsIdDELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;
  await prisma.treatmentRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
