import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guard";
import { getFollowupConfig, setFollowupConfig } from "@/lib/server/followups";

/** Admin: read or update the post-session follow-up settings (on/off + delay). */
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;
  const config = await getFollowupConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  let body: { enabled?: boolean; delayMinutes?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const delay = Number(body.delayMinutes);
  const config = await setFollowupConfig({
    enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
    delayMinutes: Number.isFinite(delay) && delay > 0 ? delay : undefined,
  });
  return NextResponse.json({ config });
}
