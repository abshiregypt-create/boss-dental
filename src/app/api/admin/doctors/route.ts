import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireRole, OWNER_ROLES } from "@/lib/server/guard";
import { writeAudit, auditIp } from "@/lib/server/audit";
import { clampPct } from "@/lib/server/doctors";
import { serializeDoctor } from "@/lib/server/money";

/** Admin: the clinic's doctors (practitioners assignable to operations). */
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const doctors = await prisma.doctor.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ doctors: doctors.map(serializeDoctor) });
}

// Guard against oversized profile photos stored as data URLs (~1.5MB of base64).
const MAX_PHOTO_LEN = 1_500_000;

export async function POST(req: Request) {
  const { error, session } = await requireRole(OWNER_ROLES);
  if (error) return error;

  let body: {
    nameEn?: string;
    nameAr?: string;
    phone?: string;
    email?: string;
    specialtyEn?: string;
    specialtyAr?: string;
    photoUrl?: string;
    commissionPct?: number;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const nameEn = String(body.nameEn ?? "").trim();
  const nameAr = String(body.nameAr ?? "").trim();
  if (!nameEn && !nameAr) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const photoUrl = typeof body.photoUrl === "string" && body.photoUrl.length <= MAX_PHOTO_LEN ? body.photoUrl : null;

  const max = await prisma.doctor.aggregate({ _max: { sortOrder: true } });
  const doctor = await prisma.doctor.create({
    data: {
      nameEn: nameEn || nameAr,
      nameAr: nameAr || nameEn,
      phone: body.phone ? String(body.phone).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      specialtyEn: body.specialtyEn ? String(body.specialtyEn).trim() : null,
      specialtyAr: body.specialtyAr ? String(body.specialtyAr).trim() : null,
      photoUrl,
      commissionPct: clampPct(body.commissionPct),
      notes: body.notes ? String(body.notes).trim() : null,
      active: true,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  await writeAudit({
    action: "doctor.create",
    actor: session,
    entityType: "Doctor",
    entityId: doctor.id,
    summary: `Created doctor ${doctor.nameEn || doctor.nameAr}`,
    metadata: { commissionPct: Number(doctor.commissionPct) },
    ip: auditIp(req),
  });
  return NextResponse.json({ doctor: serializeDoctor(doctor) });
}
