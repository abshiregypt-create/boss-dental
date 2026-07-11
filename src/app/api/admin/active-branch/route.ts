import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guard";
import { writeAudit, auditIp } from "@/lib/server/audit";
import { withRoute, errorJson } from "@/lib/server/http";
import { parseJson, z } from "@/lib/server/validate";
import {
  BRANCH_COOKIE,
  branchCookieOptions,
  resolveActiveBranchId,
  listSelectableBranches,
} from "@/lib/server/branch-context";

/**
 * Active-branch selection (multi-branch Phase 2).
 *
 * GET returns the branch the current staff member is working in (the one new
 * rows are stamped against) plus the list of branches they can switch to.
 * POST records a new selection in the `bdic_branch` cookie so subsequent writes
 * stamp that branch. Any signed-in staff member may switch their own working
 * branch (it is a per-user preference, not an owner-only setting); the target
 * must be an active, non-deleted branch.
 */
export const GET = withRoute("admin.activeBranch.GET", activeBranchGet);

async function activeBranchGet() {
  const { error } = await requireSession();
  if (error) return error;

  const [branchId, branches] = await Promise.all([
    resolveActiveBranchId(),
    listSelectableBranches(),
  ]);
  return NextResponse.json({ branchId, branches });
}

const SelectBody = z.object({ branchId: z.string().trim().min(1) });

export const POST = withRoute("admin.activeBranch.POST", activeBranchPost);

async function activeBranchPost(req: Request) {
  const { error, session } = await requireSession();
  if (error) return error;

  const parsed = await parseJson(req, SelectBody);
  if (!parsed.ok) return parsed.response;
  const { branchId } = parsed.data;

  // Only allow switching to a branch that actually exists and is selectable.
  const selectable = await listSelectableBranches();
  const target = selectable.find((b) => b.id === branchId);
  if (!target) return errorJson("branch_not_found", 404, { message: "That branch is not available." });

  const res = NextResponse.json({ ok: true, branchId: target.id });
  res.cookies.set(BRANCH_COOKIE, target.id, branchCookieOptions);
  await writeAudit({
    action: "branch.select",
    actor: session,
    entityType: "Branch",
    entityId: target.id,
    summary: `Switched active branch to ${target.nameEn || target.nameAr || target.code}`,
    ip: auditIp(req),
  });
  return res;
}
