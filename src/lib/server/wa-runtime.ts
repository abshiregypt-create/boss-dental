/**
 * WhatsApp agent runtime: the side-effecting layer around the pure `wa-agent`.
 * Loads/saves conversation state, computes availability from the DB, creates the
 * booking, and returns replies. Shared by the worker endpoint and the simulator.
 */
import { prisma } from "@/lib/db";
import {
  handleMessage,
  type WaConv,
  type WaState,
  type DayOption,
  type SlotOption,
} from "./wa-agent";
import { createBooking } from "./appointments";

const VALID_STATES: WaState[] = ["idle", "day", "slot", "why"];

/* ---------------- clinic hours ---------------- */
const OPEN_MIN = 12 * 60; // 12:00
const CLOSE_MIN = 22 * 60; // 22:00
const SLOT_MIN = 30;
const VISIT_MIN = 30; // default consultation length
const CLOSED_WEEKDAY = 5; // Friday
const TZ = "Africa/Cairo";
const OPEN_DAYS_COUNT = 6; // how many upcoming open days to offer

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function minToHHMM(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function dayLabel(d: Date, lang: "ar" | "en"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(d);
}
function timeLabel(d: Date, lang: "ar" | "en"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  }).format(d);
}

/** The next N open (non-Friday) days, starting today. */
function nextOpenDays(now: Date, lang: "ar" | "en", count = OPEN_DAYS_COUNT): DayOption[] {
  const days: DayOption[] = [];
  const cursor = startOfDay(now);
  let guard = 0;
  while (days.length < count && guard < 21) {
    guard++;
    if (cursor.getDay() !== CLOSED_WEEKDAY) {
      days.push({ dateISO: cursor.toISOString(), label: dayLabel(cursor, lang) });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Free 30-min slots for a given day, excluding already-booked times. */
async function computeDaySlots(dateISO: string, now: Date, lang: "ar" | "en"): Promise<SlotOption[]> {
  const day = new Date(dateISO);
  if (day.getDay() === CLOSED_WEEKDAY) return [];
  const dayStart = startOfDay(day);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const appts = await prisma.appointment.findMany({
    where: {
      status: { in: ["pending", "confirmed"] },
      scheduledAt: { gte: dayStart, lt: dayEnd },
    },
    select: { scheduledAt: true, durationMin: true },
  });

  const busy = appts.map((a) => {
    const s = a.scheduledAt.getHours() * 60 + a.scheduledAt.getMinutes();
    return [s, s + (a.durationMin || VISIT_MIN)] as const;
  });

  const isToday = startOfDay(now).getTime() === dayStart.getTime();
  const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : -1;

  const slots: SlotOption[] = [];
  for (let start = OPEN_MIN; start + VISIT_MIN <= CLOSE_MIN; start += SLOT_MIN) {
    if (start < nowMin) continue;
    const end = start + VISIT_MIN;
    const clash = busy.some(([bs, be]) => start < be && end > bs);
    if (clash) continue;
    const slotDate = new Date(dayStart);
    slotDate.setHours(Math.floor(start / 60), start % 60, 0, 0);
    slots.push({ value: minToHHMM(start), label: timeLabel(slotDate, lang) });
  }
  return slots.slice(0, 12); // keep the menu readable
}

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
 * Process one inbound message end-to-end. Computes availability, runs the agent,
 * persists state, creates the booking on completion, and returns the reply texts.
 * The caller (worker / simulator) delivers the replies.
 */
export async function processInbound(
  phone: string,
  text: string,
  now = new Date(),
  name?: string
): Promise<{ replies: string[]; bookingCode?: string }> {
  const conv = await loadConv(phone);
  const lang = conv.lang;

  // Build availability context the agent needs.
  const openDays = nextOpenDays(now, lang);
  const slotsByDate: Record<string, SlotOption[]> = {};
  // Only compute slots we might show: all open days when about to list, or the
  // chosen day when in "slot". Computing all is cheap (<=6 small queries).
  for (const d of openDays) {
    slotsByDate[d.dateISO] = await computeDaySlots(d.dateISO, now, lang);
  }
  if (conv.draft.dateISO && !slotsByDate[conv.draft.dateISO]) {
    slotsByDate[conv.draft.dateISO] = await computeDaySlots(conv.draft.dateISO, now, lang);
  }

  const result = handleMessage(conv, text, phone, { now, name, openDays, slotsByDate });
  await saveConv(phone, result.next);

  const replies: string[] = [];
  if (result.reply) replies.push(result.reply);

  let bookingCode: string | undefined;
  if (result.booking) {
    const b = result.booking;
    const appt = await createBooking({
      name: b.name,
      phone: b.phone,
      serviceId: b.serviceId,
      serviceLabelEn: b.serviceLabelEn,
      serviceLabelAr: b.serviceLabelAr,
      scheduledAt: b.scheduledAt,
      complaint: b.reason ?? null,
      lang: b.lang,
    });
    bookingCode = appt.code;
  }

  return { replies, bookingCode };
}
