import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guard";
import { withRoute } from "@/lib/server/http";
import { inventoryReport } from "@/lib/server/inventory-ops";

/**
 * Inventory summary report: total item count, stock valuation (Σ remaining ×
 * unit cost), and the low-stock / expiring / expired batch lists. Readable by
 * any signed-in staff member. `?days=` sets the expiring-soon window (default 30).
 */
export const GET = withRoute("admin.inventory.report.GET", reportGet);

async function reportGet(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const raw = new URL(req.url).searchParams.get("days");
  const days = raw != null && Number.isFinite(Number(raw)) ? Math.max(1, Math.floor(Number(raw))) : 30;
  const report = await inventoryReport(days);
  return NextResponse.json(report);
}
