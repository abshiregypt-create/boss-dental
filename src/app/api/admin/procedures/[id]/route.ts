import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { serializeProcedure } from "@/lib/server/money";

/** Admin: edit or remove a catalog procedure. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;

  let body: { nameEn?: string; nameAr?: string; price?: number; cost?: number | null; active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const data: { nameEn?: string; nameAr?: string; price?: number; cost?: number | null; active?: boolean } = {};
  if (typeof body.nameEn === "string" && body.nameEn.trim()) data.nameEn = body.nameEn.trim();
  if (typeof body.nameAr === "string" && body.nameAr.trim()) data.nameAr = body.nameAr.trim();
  if (body.price != null && Number.isFinite(Number(body.price)) && Number(body.price) >= 0) {
    data.price = Number(body.price);
  }
  // cost: null or "" clears it; a valid number ≥ 0 sets it; anything else is ignored.
  if ("cost" in body) {
    if (body.cost == null || body.cost === ("" as unknown)) data.cost = null;
    else if (Number.isFinite(Number(body.cost)) && Number(body.cost) >= 0) data.cost = Number(body.cost);
  }
  if (typeof body.active === "boolean") data.active = body.active;

  const procedure = await prisma.procedure.update({ where: { id }, data });
  return NextResponse.json({ procedure: serializeProcedure(procedure) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;

  // Treatment records keep their snapshot (procedureId is set null on delete),
  // so removing a catalog entry never corrupts history.
  await prisma.procedure.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
