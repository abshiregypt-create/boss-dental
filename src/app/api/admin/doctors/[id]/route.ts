import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, OWNER_ROLES } from "@/lib/server/guard";
import { writeAudit, auditIp } from "@/lib/server/audit";
import { clampPct } from "@/lib/server/doctors";
import { serializeDoctor } from "@/lib/server/money";

const MAX_PHOTO_LEN = 1_500_000;

/** Admin: edit or remove a doctor. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(OWNER_ROLES);
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
  await writeAudit({
    action: "doctor.update",
    actor: session,
    entityType: "Doctor",
    entityId: id,
    summary: `Updated doctor ${doctor.nameEn || doctor.nameAr}`,
    metadata: { fields: Object.keys(data) },
    ip: auditIp(req),
  });
  return NextResponse.json({ doctor: serializeDoctor(doctor) });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(OWNER_ROLES);
  if (error) return error;
  const { id } = await ctx.params;

  // TreatmentDoctor rows cascade-delete, but their snapshot amounts are already
  // reflected in past treatments' history; deleting a doctor only removes them
  // from future assignment and the earnings roll-up.
  const existing = await prisma.doctor.findUnique({ where: { id }, select: { nameEn: true, nameAr: true } });
  await prisma.doctor.delete({ where: { id } });
  await writeAudit({
    action: "doctor.delete",
    actor: session,
    entityType: "Doctor",
    entityId: id,
    summary: existing ? `Deleted doctor ${existing.nameEn || existing.nameAr}` : `Deleted doctor ${id}`,
    ip: auditIp(req),
  });
  return NextResponse.json({ ok: true });
}
