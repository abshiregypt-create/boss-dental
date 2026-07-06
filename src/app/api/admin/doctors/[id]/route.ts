import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { clampPct } from "@/lib/server/doctors";

const MAX_PHOTO_LEN = 1_500_000;

/** Admin: edit or remove a doctor. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;

  let body: {
    nameEn?: string;
    nameAr?: string;
    phone?: string | null;
    email?: string | null;
    specialtyEn?: string | null;
    specialtyAr?: string | null;
    photoUrl?: string | null;
    commissionPct?: number;
    notes?: string | null;
    active?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.nameEn === "string" && body.nameEn.trim()) data.nameEn = body.nameEn.trim();
  if (typeof body.nameAr === "string" && body.nameAr.trim()) data.nameAr = body.nameAr.trim();
  if ("phone" in body) data.phone = body.phone ? String(body.phone).trim() : null;
  if ("email" in body) data.email = body.email ? String(body.email).trim() : null;
  if ("specialtyEn" in body) data.specialtyEn = body.specialtyEn ? String(body.specialtyEn).trim() : null;
  if ("specialtyAr" in body) data.specialtyAr = body.specialtyAr ? String(body.specialtyAr).trim() : null;
  if ("photoUrl" in body) {
    data.photoUrl =
      typeof body.photoUrl === "string" && body.photoUrl && body.photoUrl.length <= MAX_PHOTO_LEN
        ? body.photoUrl
        : null;
  }
  if (body.commissionPct != null) data.commissionPct = clampPct(body.commissionPct);
  if ("notes" in body) data.notes = body.notes ? String(body.notes).trim() : null;
  if (typeof body.active === "boolean") data.active = body.active;

  const doctor = await prisma.doctor.update({ where: { id }, data });
  return NextResponse.json({ doctor });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;

  // TreatmentDoctor rows cascade-delete, but their snapshot amounts are already
  // reflected in past treatments' history; deleting a doctor only removes them
  // from future assignment and the earnings roll-up.
  await prisma.doctor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
