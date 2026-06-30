import type { Lang } from "./content";

export type Bilingual = { en: string; ar: string };

/* ---------------- Session types (نوع الجلسة) ---------------- */
export type SessionType = {
  id: string;
  label: Bilingual;
  color: string; // hex accent used for chips / left borders
  durationMin: number;
  price: number; // default price in EGP
  icon: string; // SVG path data for a recognizable glyph
};

export const sessionTypes: SessionType[] = [
  { id: "checkup", label: { en: "Check-up", ar: "كشف" }, color: "#3b82f6", durationMin: 30, price: 300, icon: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm9.5 16-5-5" },
  { id: "cleaning", label: { en: "Scaling & Polish", ar: "تنظيف وجلي" }, color: "#10b981", durationMin: 45, price: 600, icon: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" },
  { id: "filling", label: { en: "Filling", ar: "حشو" }, color: "#c9a24b", durationMin: 45, price: 800, icon: "M12 4.5c-2-1.4-5-1.6-6.3.3-1.2 1.8-.6 4.3 0 6.6.5 1.9.3 3 .8 5.2.3 1.4.7 2.9 1.6 2.9 1.1 0 1.1-2 1.6-3.6.3-1 .8-1.7 1.3-1.7s1 .7 1.3 1.7c.5 1.6.5 3.6 1.6 3.6.9 0 1.3-1.5 1.6-2.9.5-2.2.3-3.3.8-5.2.6-2.3 1.2-4.8 0-6.6C17 2.9 14 3.1 12 4.5Z" },
  { id: "hard_filling", label: { en: "Complex Filling", ar: "حشو صعب" }, color: "#f59e0b", durationMin: 60, price: 1200, icon: "M13 2 4 14h6v8l8-12h-6z" },
  { id: "whitening", label: { en: "Teeth Whitening", ar: "تبييض" }, color: "#0ea5b7", durationMin: 60, price: 3500, icon: "M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z" },
  { id: "root_canal", label: { en: "Root Canal", ar: "علاج عصب" }, color: "#ef4444", durationMin: 90, price: 2500, icon: "M3 12h4l2 5 4-12 2 7h6" },
  { id: "extraction", label: { en: "Extraction", ar: "خلع" }, color: "#8b5cf6", durationMin: 30, price: 700, icon: "M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" },
  { id: "implant", label: { en: "Implant", ar: "زراعة" }, color: "#0891b2", durationMin: 90, price: 12000, icon: "M12 2v20M8 6h8M8 10h8M9 14h6M10 18h4" },
  { id: "crown", label: { en: "Crown / Veneer", ar: "تركيبة / عدسات" }, color: "#ec4899", durationMin: 60, price: 4500, icon: "M4 17 2 7l6 4 4-7 4 7 6-4-2 10z" },
];

export function sessionTypeById(id: string): SessionType {
  return sessionTypes.find((s) => s.id === id) ?? sessionTypes[0];
}

/* ---------------- Clinic working hours ---------------- */
export const clinic = {
  openMin: 10 * 60, // 10:00
  closeMin: 22 * 60, // 22:00
  slotMin: 30,
  closedWeekday: 5, // Friday (0 = Sunday … 6 = Saturday)
};

/* ---------------- Appointments (الجلسات المؤكدة) ---------------- */
export type Status = "confirmed" | "pending";

export type Appointment = {
  id: string;
  patient: Bilingual;
  typeId: string;
  dayOffset: number; // 0 = today, 1 = tomorrow …
  start: string; // "HH:MM" 24h
  status: Status;
  phone: string;
  code?: string; // booking code (DB-backed online/WhatsApp bookings)
  online?: boolean; // true if it comes from the DB (website/WhatsApp), not local seed
  done?: boolean; // true once the doctor marks the session finished (completed)
};

export const seedAppointments: Appointment[] = [
  // ---- Today ----
  { id: "a1", patient: { en: "Ahmed Kamal", ar: "أحمد كمال" }, typeId: "checkup", dayOffset: 0, start: "10:00", status: "confirmed", phone: "+20 100 221 8841" },
  { id: "a2", patient: { en: "Mona Saleh", ar: "منى صالح" }, typeId: "whitening", dayOffset: 0, start: "11:00", status: "confirmed", phone: "+20 101 553 2290" },
  { id: "a3", patient: { en: "Youssef Adel", ar: "يوسف عادل" }, typeId: "hard_filling", dayOffset: 0, start: "12:30", status: "confirmed", phone: "+20 122 980 7741" },
  { id: "a4", patient: { en: "Salma Hany", ar: "سلمى هاني" }, typeId: "cleaning", dayOffset: 0, start: "15:00", status: "confirmed", phone: "+20 111 442 6610" },
  { id: "a5", patient: { en: "Tarek Nabil", ar: "طارق نبيل" }, typeId: "root_canal", dayOffset: 0, start: "18:00", status: "confirmed", phone: "+20 128 330 9912" },
  // ---- Tomorrow ----
  { id: "a6", patient: { en: "Hana Fathy", ar: "هنا فتحي" }, typeId: "filling", dayOffset: 1, start: "10:30", status: "confirmed", phone: "+20 100 776 1188" },
  { id: "a7", patient: { en: "Omar Sherif", ar: "عمر شريف" }, typeId: "implant", dayOffset: 1, start: "13:00", status: "confirmed", phone: "+20 106 219 4453" },
  { id: "a8", patient: { en: "Lila Mostafa", ar: "ليلى مصطفى" }, typeId: "crown", dayOffset: 1, start: "16:30", status: "confirmed", phone: "+20 109 884 2200" },
  // ---- In 2 days ----
  { id: "a9", patient: { en: "Khaled Anwar", ar: "خالد أنور" }, typeId: "extraction", dayOffset: 2, start: "11:00", status: "confirmed", phone: "+20 127 540 1129" },
  { id: "a10", patient: { en: "Rana Wael", ar: "رنا وائل" }, typeId: "whitening", dayOffset: 2, start: "14:00", status: "confirmed", phone: "+20 102 668 3370" },
];

/* ---------------- Booking requests (حجوزات جديدة) ---------------- */
export type RequestStatus = "new" | "confirmed" | "declined";

export type BookingRequest = {
  id: string;
  patient: Bilingual;
  phone: string;
  complaint: Bilingual; // what the patient suffers from
  typeId: string; // requested session type
  dayOffset: number; // day the patient chose
  start: string; // hour the patient chose "HH:MM"
  createdAgoMin: number; // received N minutes ago
  status: RequestStatus;
};

export const seedRequests: BookingRequest[] = [
  {
    id: "r1",
    patient: { en: "Nourhan Adel", ar: "نورهان عادل" },
    phone: "+20 100 982 4471",
    complaint: {
      en: "Sharp pain in a lower back tooth when eating sweets.",
      ar: "ألم حاد في ضرس سفلي خلفي عند تناول الحلويات.",
    },
    typeId: "hard_filling",
    dayOffset: 0,
    start: "16:00",
    createdAgoMin: 8,
    status: "new",
  },
  {
    id: "r2",
    patient: { en: "Mostafa Lotfy", ar: "مصطفى لطفي" },
    phone: "+20 122 117 6650",
    complaint: {
      en: "Wants to whiten teeth before his wedding next month.",
      ar: "يريد تبييض الأسنان قبل زفافه الشهر القادم.",
    },
    typeId: "whitening",
    dayOffset: 1,
    start: "17:00",
    createdAgoMin: 35,
    status: "new",
  },
  {
    id: "r3",
    patient: { en: "Dina Magdy", ar: "دينا مجدي" },
    phone: "+20 111 304 9928",
    complaint: {
      en: "Bleeding gums and bad breath for two weeks.",
      ar: "نزيف باللثة ورائحة فم منذ أسبوعين.",
    },
    typeId: "cleaning",
    dayOffset: 0,
    start: "19:30",
    createdAgoMin: 52,
    status: "new",
  },
  {
    id: "r4",
    patient: { en: "Hassan Gamal", ar: "حسن جمال" },
    phone: "+20 128 776 3310",
    complaint: {
      en: "Broken front tooth from a fall, needs urgent fix.",
      ar: "كسر في سن أمامي بعد سقوط، يحتاج إصلاح عاجل.",
    },
    typeId: "crown",
    dayOffset: 2,
    start: "12:00",
    createdAgoMin: 96,
    status: "new",
  },
  {
    id: "r5",
    patient: { en: "Aya Ramadan", ar: "آية رمضان" },
    phone: "+20 106 552 8801",
    complaint: {
      en: "Routine check-up and cleaning, no pain.",
      ar: "كشف دوري وتنظيف، لا يوجد ألم.",
    },
    typeId: "checkup",
    dayOffset: 3,
    start: "11:30",
    createdAgoMin: 140,
    status: "new",
  },
];

/* ---------------- Time helpers ---------------- */
export function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const locale = (lang: Lang) => (lang === "ar" ? "ar-EG" : "en-US");

/** Build a Date for a given day offset and minute-of-day, based on a stable "today". */
export function dateAt(base: Date, dayOffset: number, minOfDay = 0): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minOfDay);
  return d;
}

/** Local YYYY-MM-DD string for a given day offset from base. */
export function isoDate(base: Date, dayOffset = 0): string {
  const d = dateAt(base, dayOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtTime(base: Date, dayOffset: number, minOfDay: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateAt(base, dayOffset, minOfDay));
}

export function fmtDateLong(base: Date, dayOffset: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dateAt(base, dayOffset));
}

export function fmtWeekday(base: Date, dayOffset: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { weekday: "short" }).format(
    dateAt(base, dayOffset)
  );
}

export function fmtDayNum(base: Date, dayOffset: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { day: "numeric" }).format(
    dateAt(base, dayOffset)
  );
}

export function isClosed(base: Date, dayOffset: number): boolean {
  return dateAt(base, dayOffset).getDay() === clinic.closedWeekday;
}

export function formatAgo(min: number, lang: Lang): string {
  if (min < 60) {
    return lang === "ar" ? `منذ ${min} دقيقة` : `${min}m ago`;
  }
  if (min < 60 * 24) {
    const h = Math.floor(min / 60);
    return lang === "ar" ? `منذ ${h} ساعة` : `${h}h ago`;
  }
  const d = Math.floor(min / (60 * 24));
  return lang === "ar" ? `منذ ${d} يوم` : `${d}d ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/** rgba tint from a hex color. */
export function tint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ---------------- Day timeline (sessions + free slots) ---------------- */
export type TimelineEntry =
  | { kind: "appt"; appt: Appointment; startMin: number; endMin: number }
  | { kind: "free"; startMin: number; endMin: number };

export function dayTimeline(appts: Appointment[]): TimelineEntry[] {
  const sorted = [...appts].sort((a, b) => hhmmToMin(a.start) - hhmmToMin(b.start));
  const entries: TimelineEntry[] = [];
  let cursor = clinic.openMin;

  const pushFree = (from: number, to: number) => {
    let c = from;
    while (c + clinic.slotMin <= to) {
      entries.push({ kind: "free", startMin: c, endMin: c + clinic.slotMin });
      c += clinic.slotMin;
    }
    if (c < to) entries.push({ kind: "free", startMin: c, endMin: to });
  };

  for (const a of sorted) {
    const s = hhmmToMin(a.start);
    const end = s + sessionTypeById(a.typeId).durationMin;
    if (s > cursor) pushFree(cursor, s);
    entries.push({ kind: "appt", appt: a, startMin: s, endMin: end });
    cursor = Math.max(cursor, end);
  }
  if (cursor < clinic.closeMin) pushFree(cursor, clinic.closeMin);

  return entries;
}

export function freeSlotCount(appts: Appointment[]): number {
  return dayTimeline(appts).filter((e) => e.kind === "free").length;
}

/**
 * Bookable start times (HH:MM) for a given day, honoring the doctor's existing
 * appointments, the service duration, clinic hours, day off, and (for today)
 * a minimum lead time so past hours can't be booked.
 */
export function availableSlots(
  appts: Appointment[],
  base: Date,
  dayOffset: number,
  durationMin: number
): string[] {
  if (isClosed(base, dayOffset)) return [];

  const busy = appts
    .filter((a) => a.dayOffset === dayOffset)
    .map((a) => {
      const s = hhmmToMin(a.start);
      return [s, s + sessionTypeById(a.typeId).durationMin] as const;
    });

  // For today, require the slot to start at least 30 min from now.
  const nowMin =
    dayOffset === 0 ? base.getHours() * 60 + base.getMinutes() + 30 : -1;

  const slots: string[] = [];
  for (
    let start = clinic.openMin;
    start + durationMin <= clinic.closeMin;
    start += clinic.slotMin
  ) {
    if (start < nowMin) continue;
    const end = start + durationMin;
    const clash = busy.some(([bs, be]) => start < be && end > bs);
    if (!clash) slots.push(minToHHMM(start));
  }
  return slots;
}
