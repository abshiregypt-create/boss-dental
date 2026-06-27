/**
 * WhatsApp agent runtime: the side-effecting layer around the pure `wa-agent`.
 * Loads/saves conversation state, creates the booking, and sends replies.
 * Shared by the Meta webhook and the local simulator so both behave identically.
 */
import { prisma } from "@/lib/db";
import { handleMessage, bookingConfirmedReply, type WaConv, type WaState } from "./wa-agent";
import { createBooking } from "./appointments";
import { sendWhatsApp } from "./whatsapp";
import { trackUrl } from "./messages";

const VALID_STATES: WaState[] = ["idle", "service", "date", "time", "name", "confirm"];

export async function loadConv(phone: string): Promise<WaConv> {
  const row = await prisma.waConversation.findUnique({ where: { phone } });
  if (!row) return { state: "idle", draft: {}, lang: "ar" };
  const state = (VALID_STATES.includes(row.state as WaState) ? row.state : "idle") as WaState;
  let draft = {};
  try {
    draft = row.draft ? JSON.parse(row.draft) : {};
  } catch {
    draft = {};
  }
  return { state, draft, lang: row.lang === "en" ? "en" : "ar" };
}

async function saveConv(phone: string, conv: WaConv): Promise<void> {
  await prisma.waConversation.upsert({
    where: { phone },
    create: { phone, state: conv.state, draft: JSON.stringify(conv.draft), lang: conv.lang },
    update: { state: conv.state, draft: JSON.stringify(conv.draft), lang: conv.lang },
  });
}

/**
 * Process one inbound message end-to-end. Returns the reply texts (so the
 * simulator/tests can assert on them).
 *
 * `send` is the delivery function. By default it uses `sendWhatsApp` (Meta/mock).
 * The whatsapp-web.js worker passes its own sender so the SAME agent drives an
 * unofficial WhatsApp-Web session with zero changes to the conversation logic.
 */
export async function processInbound(
  phone: string,
  text: string,
  now = new Date(),
  send: (to: string, body: string) => Promise<unknown> = (to, body) => sendWhatsApp({ to, body })
): Promise<{ replies: string[]; bookingCode?: string }> {
  const conv = await loadConv(phone);
  const result = handleMessage(conv, text, phone, now);
  await saveConv(phone, result.next);

  const replies: string[] = [];
  if (result.reply) replies.push(result.reply);

  let bookingCode: string | undefined;
  if (result.booking) {
    const appt = await createBooking(result.booking);
    bookingCode = appt.code;
    replies.push(bookingConfirmedReply(result.booking.lang, appt.code, trackUrl(appt.code)));
  }

  for (const body of replies) {
    await send(phone, body);
  }

  return { replies, bookingCode };
}
