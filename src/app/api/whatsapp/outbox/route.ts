import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Outbox bridge for the whatsapp-web.js worker (server → patient messages).
 *
 * GET  (worker, x-agent-secret): returns up to 20 queued messages to send.
 * POST (worker, x-agent-secret): { ids: string[] } → marks them as sent.
 *
 * Used for doctor-confirm notifications and any other server-initiated message.
 */
function authed(req: Request): boolean {
  const secret = process.env.WA_AGENT_SECRET;
  return !!secret && req.headers.get("x-agent-secret") === secret;
}

export async function GET(req: Request) {
  if (!authed(req)) return new NextResponse("unauthorized", { status: 401 });
  const messages = await prisma.waOutbox.findMany({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true, phone: true, body: true },
  });
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  if (!authed(req)) return new NextResponse("unauthorized", { status: 401 });
  let body: { ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === "string") : [];
  if (ids.length === 0) return NextResponse.json({ ok: true, updated: 0 });
  const r = await prisma.waOutbox.updateMany({
    where: { id: { in: ids } },
    data: { status: "sent", sentAt: new Date() },
  });
  return NextResponse.json({ ok: true, updated: r.count });
}
