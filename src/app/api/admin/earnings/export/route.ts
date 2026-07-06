import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guard";
import { buildEarningsWorkbook, exportFileName } from "@/lib/server/export-excel";

/**
 * Admin: download the doctor-earnings report as an Excel (.xlsx) workbook with
 * three sheets (Operations, Monthly Summary, Doctor Summary).
 *   GET /api/admin/earnings/export            → all doctors
 *   GET /api/admin/earnings/export?doctorId=… → a single doctor's report
 */
export async function GET(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const doctorId = new URL(req.url).searchParams.get("doctorId") || undefined;
  const buffer = await buildEarningsWorkbook(doctorId);
  const fileName = exportFileName("earnings");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    },
  });
}
