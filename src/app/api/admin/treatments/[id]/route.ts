import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";

/** Admin: delete a treatment record (its linked payments cascade to general via SetNull). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;
  await prisma.treatmentRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
