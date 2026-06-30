import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/server/guard";
import { normalizePhone } from "@/lib/server/phone";
import { sendWhatsApp } from "@/lib/server/whatsapp";
import { logChat } from "@/lib/server/followups";

const tail = (p: string) => (p || "").replace(/\D/g, "").slice(-9);

/** Pause the booking bot for this long after the doctor sends a manual reply. */
const PAUSE_MINUTES = 12 * 60;

/** Build a phone→display-name map from appointments + patients (best name wins). */
async function nameByPhone(): Promise<Map<string, string>> {
  const [appts, patients] = await Promise.all([
    prisma.appointment.findMany({ orderBy: { createdAt: "desc" }, select: { phone: true, patientName: true } }),
    prisma.patient.findMany({ select: { phone: true, name: true } }),
  ]);
  const map = new Map<string, string>();
  const isReal = (s: string) => (s || "").trim().replace(/[^\p{L}]/gu, "").length >= 2;
  for (const p of patients) {
    const t = tail(p.phone);
    if (t.length >= 8 && isReal(p.name) && !map.has(t)) map.set(t, p.name.trim());
  }
  for (const a of appts) {
    const t = tail(a.phone);
    if (t.length >= 8 && isReal(a.patientName) && !map.has(t)) map.set(t, a.patientName.trim());
  }
  return map;
}

export async function GET(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const phoneParam = new URL(req.url).searchParams.get("phone");

  // ---- Single conversation thread ----
  if (phoneParam) {
    const key = normalizePhone(phoneParam).digits || phoneParam.replace(/\D/g, "");
    const t = tail(key);
    const messages = await prisma.chatMessage.findMany({
      where: t.length >= 8 ? { phone: { contains: t } } : { phone: key },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    // Mark inbound messages as read.
    const unreadIds = messages.filter((m) => m.direction === "in" && !m.readAt).map((m) => m.id);
    if (unreadIds.length) {
      await prisma.chatMessage.updateMany({ where: { id: { in: unreadIds } }, data: { readAt: new Date() } });
    }

    const names = await nameByPhone();
    return NextResponse.json({
      phone: key,
      name: names.get(t) ?? `+${key}`,
      messages: messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        body: m.body,
        kind: m.kind,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  }

  // ---- Conversation list ----
  const recent = await prisma.chatMessage.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
  const names = await nameByPhone();

  const byPhone = new Map<
    string,
    { phone: string; name: string; lastBody: string; lastAt: string; lastDir: string; unread: number; chatId: string | null }
  >();
  for (const m of recent) {
    const t = tail(m.phone);
    const existing = byPhone.get(m.phone);
    if (!existing) {
      byPhone.set(m.phone, {
        phone: m.phone,
        name: names.get(t) ?? `+${m.phone}`,
        lastBody: m.body,
        lastAt: m.createdAt.toISOString(),
        lastDir: m.direction,
        unread: m.direction === "in" && !m.readAt ? 1 : 0,
        chatId: m.chatId ?? null,
      });
    } else {
      if (m.direction === "in" && !m.readAt) existing.unread += 1;
      if (!existing.chatId && m.chatId) existing.chatId = m.chatId;
    }
  }

  const conversations = [...byPhone.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);
  return NextResponse.json({ conversations, totalUnread });
}

export async function POST(req: Request) {
  const { error } = await requireSession();
  if (error) return error;

  let body: { phone?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const text = String(body.text ?? "").trim();
  const phoneRaw = String(body.phone ?? "").trim();
  if (!phoneRaw || !text) return NextResponse.json({ error: "missing phone or text" }, { status: 400 });

  const to = normalizePhone(phoneRaw).digits || phoneRaw.replace(/\D/g, "");
  const t = tail(to);

  // Find the best chat id to reply to (handles @lid): latest inbound chatId, then
  // any stored conversation/appointment chat id for this phone.
  const lastWithChat = await prisma.chatMessage.findFirst({
    where: { phone: { contains: t }, chatId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { chatId: true },
  });
  let chatId = lastWithChat?.chatId ?? null;
  if (!chatId) {
    const conv = await prisma.waConversation.findFirst({
      where: { phone: { contains: t }, chatId: { not: null } },
      select: { chatId: true },
    });
    chatId = conv?.chatId ?? null;
  }
  if (!chatId) {
    const appt = await prisma.appointment.findFirst({
      where: { phone: { contains: t }, waChatId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { waChatId: true },
    });
    chatId = appt?.waChatId ?? null;
  }

  const res = await sendWhatsApp({ to, body: text, chatId });
  await logChat({ phone: to, chatId, direction: "out", body: text, kind: "manual" });

  // Pause the booking bot so the patient's replies don't trigger auto-menus
  // while the doctor is chatting manually.
  const pausedUntil = new Date(Date.now() + PAUSE_MINUTES * 60000);
  await prisma.waConversation.upsert({
    where: { phone: to },
    create: { phone: to, chatId, state: "idle", agentPausedUntil: pausedUntil },
    update: { agentPausedUntil: pausedUntil, chatId: chatId ?? undefined },
  });

  return NextResponse.json({ ok: true, status: res.status, provider: res.provider });
}
