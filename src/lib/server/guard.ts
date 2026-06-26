import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";

/** Guard for admin routes. Returns an error response if not signed in. */
export async function requireSession(): Promise<
  { error: NextResponse; session: null } | { error: null; session: SessionPayload }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}
