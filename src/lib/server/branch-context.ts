/**
 * Multi-branch request context (Sprint 13, Phase 2 — write stamping).
 *
 * The "active branch" is the physical location a signed-in staff member is
 * currently working in. It is stored in a dedicated `bdic_branch` cookie — NOT
 * in the JWT — so switching branches never requires re-authentication and never
 * invalidates the session token.
 *
 * `resolveActiveBranchId()` is the single boundary helper request handlers call
 * to decide which `branchId` to stamp on new rows. It is deliberately
 * conservative and backward-compatible:
 *   - When no cookie is set (the default for every clinic today) it returns the
 *     seeded default branch (`branch_main`) WITHOUT touching the database, so a
 *     single-branch clinic keeps byte-identical behaviour and pays no extra
 *     query cost.
 *   - When a non-default cookie is present it validates it against the live
 *     (active, non-deleted) branches and falls back to the default via the pure
 *     {@link chooseActiveBranchId} selector.
 *
 * The returned id is always a real, FK-safe branch id: the default branch row
 * can never be hard-deleted, so stamping it can never violate the foreign key.
 *
 * Background/public writers (website bookings, the WhatsApp agent) have no
 * request cookie context and must NOT call this — they stamp `DEFAULT_BRANCH_ID`
 * directly (see appointments.ts).
 */
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { DEFAULT_BRANCH_ID, chooseActiveBranchId } from "./branches";

/** Cookie that holds the staff member's currently selected branch id. */
export const BRANCH_COOKIE = "bdic_branch";

/** One year — the active branch is a durable preference, not a session token. */
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Cookie options for the active-branch selection. Mirrors the session cookie's
 * Secure handling (opt out on the desktop app served over plain http) but the
 * value itself (a branch id) is not sensitive.
 */
export const branchCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && process.env.DESKTOP !== "1",
  path: "/",
  maxAge: MAX_AGE,
};

/**
 * Resolve the branch id to stamp on new rows for the current request. Reads the
 * `bdic_branch` cookie and validates it against the live branch list; falls back
 * to the seeded default branch. Never throws for a missing/unknown cookie.
 */
export async function resolveActiveBranchId(): Promise<string> {
  const jar = await cookies();
  const cookieVal = jar.get(BRANCH_COOKIE)?.value ?? null;

  // Fast path: no selection, or the default is already selected — no DB hit and
  // identical to the historical backfill (every legacy row is on branch_main).
  if (!cookieVal || cookieVal.trim() === DEFAULT_BRANCH_ID) return DEFAULT_BRANCH_ID;

  const selectable = await listSelectableBranches();
  return chooseActiveBranchId(cookieVal, selectable);
}

/**
 * The branches a staff member may work in / stamp against: active and not
 * soft-deleted, in a deterministic priority order (sortOrder, then name, then
 * id). Used by both the resolver and the active-branch API.
 */
export async function listSelectableBranches(): Promise<Array<{ id: string; nameEn: string; nameAr: string; code: string }>> {
  return prisma.branch.findMany({
    where: { active: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }, { id: "asc" }],
    select: { id: true, nameEn: true, nameAr: true, code: true },
  });
}
