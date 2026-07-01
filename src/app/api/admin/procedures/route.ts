import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { ensureProceduresSeeded } from "@/lib/server/operations";

/** Admin: the operations/procedures catalog. */
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  await ensureProceduresSeeded();
  const procedures = await prisma.procedure.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ procedures });
}

export async function POST(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  let body: { nameEn?: string; nameAr?: string; price?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const nameEn = String(body.nameEn ?? "").trim();
  const nameAr = String(body.nameAr ?? "").trim();
  const price = Number(body.price);
  if (!nameEn && !nameAr) return NextResponse.json({ error: "name_required" }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "bad_price" }, { status: 400 });

  const max = await prisma.procedure.aggregate({ _max: { sortOrder: true } });
  const procedure = await prisma.procedure.create({
    data: {
      nameEn: nameEn || nameAr,
      nameAr: nameAr || nameEn,
      price,
      active: true,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json({ procedure });
}
