import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { deleteStored } from "@/lib/server/storage";

/** Delete a patient file (DB row + disk binary). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await ctx.params;
  const file = await prisma.patientFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await deleteStored(file.storagePath);
  await prisma.patientFile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
