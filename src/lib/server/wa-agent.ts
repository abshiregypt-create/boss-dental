/**
 * WhatsApp booking agent — a PURE, bilingual (Arabic-first) conversation engine.
 *
 * `handleMessage(conv, text, phone, now)` takes the current conversation + the
 * incoming message and returns the reply, the next conversation state, and —
 * when the user confirms — the booking to create. It performs NO I/O, so it is
 * fully unit-testable and the webhook route owns all side effects (DB + sending).
 *
 * Flow:  idle → service → date → time → name → confirm → (create booking) → idle
 */
import { sessionTypes } from "@/lib/dashboard";

export type WaState = "idle" | "service" | "date" | "time" | "name" | "confirm";

export type WaDraft = {
  serviceId?: string;
  serviceLabelEn?: string;
  serviceLabelAr?: string;
  /** date-only ISO (midnight local) chosen in the "date" step */
  dateISO?: string;
  /** full ISO once time is chosen */
  scheduledAt?: string;
  name?: string;
};

export type WaConv = { state: WaState; draft: WaDraft; lang: "ar" | "en" };

export type BookingIntent = {
  name: string;
  phone: string;
  serviceId: string;
  serviceLabelEn: string;
  serviceLabelAr: string;
  scheduledAt: Date;
  lang: "ar" | "en";
};

export type AgentResult = {
  reply: string;
  next: WaConv;
  booking?: BookingIntent;
};

/* ---------------- clinic hours ---------------- */
const OPEN_MIN = 12 * 60; // 12:00
const CLOSE_MIN = 22 * 60; // 22:00
const CLOSED_WEEKDAY = 5; // Friday

/* ---------------- helpers ---------------- */

/** Convert Arabic-Indic digits to ASCII and trim. */
export function normalizeDigits(s: string): string {
  return (s || "")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function detectLang(text: string): "ar" | "en" {
  return /[\u0600-\u06ff]/.test(text) ? "ar" : "en";
}

const T = {
  greet: {
    ar: "أهلاً بك في مركز بدوي لزراعة الأسنان 🦷\nيسعدنا حجز موعدك. اختر الخدمة بالرد بالرقم:",
    en: "Welcome to Badawi Dental Implant Center 🦷\nLet's book your appointment. Reply with the service number:",
  },
  askDate: {
    ar: "تمام ✅ اخترت: ",
    en: "Great ✅ You chose: ",
  },
  askDateBody: {
    ar: "\n\nفي أي يوم تحب الموعد؟ اكتب التاريخ\n(مثال: «بكرة» أو «30/6» أو اسم اليوم)",
    en: "\n\nWhich day would you like? Type a date\n(e.g. \"tomorrow\", \"30/6\", or a weekday name)",
  },
  askTime: {
    ar: "وفي أي وقت؟ العيادة من ١٢ ظهرًا حتى ١٠ مساءً.\n(مثال: «5 مساءً» أو «17:00»)",
    en: "What time? The clinic is open 12:00 PM–10:00 PM.\n(e.g. \"5 pm\" or \"17:00\")",
  },
  askName: {
    ar: "وأخيرًا، اكتب اسمك الكامل من فضلك ✍️",
    en: "Finally, please type your full name ✍️",
  },
  confirmHead: { ar: "تأكيد الحجز 📋", en: "Confirm your booking 📋" },
  confirmAsk: {
    ar: "\nاكتب «تأكيد» للحجز، أو «إلغاء» للإلغاء.",
    en: "\nReply \"confirm\" to book, or \"cancel\" to abort.",
  },
  badService: {
    ar: "من فضلك اختر رقمًا من القائمة 👆",
    en: "Please reply with a number from the list 👆",
  },
  badDate: {
    ar: "لم أفهم التاريخ 😅 جرّب «بكرة» أو «30/6» أو اسم اليوم.",
    en: "I didn't get that date 😅 Try \"tomorrow\", \"30/6\", or a weekday.",
  },
  pastDate: {
    ar: "هذا التاريخ في الماضي ⏳ اكتب يومًا قادمًا من فضلك.",
    en: "That date is in the past ⏳ Please pick an upcoming day.",
  },
  friday: {
    ar: "العيادة مغلقة يوم الجمعة 🕌 اختر يومًا آخر من فضلك.",
    en: "The clinic is closed on Fridays 🕌 Please pick another day.",
  },
  badTime: {
    ar: "لم أفهم الوقت 😅 اكتب مثل «5 مساءً» أو «17:00».",
    en: "I didn't get that time 😅 Type like \"5 pm\" or \"17:00\".",
  },
  outOfHours: {
    ar: "الوقت خارج مواعيد العمل (١٢ ظهرًا–١٠ مساءً). اكتب وقتًا داخلها.",
    en: "That's outside opening hours (12 PM–10 PM). Pick a time within them.",
  },
  cancelled: {
    ar: "تم إلغاء الحجز. اكتب «حجز» في أي وقت للبدء من جديد 🌟",
    en: "Booking cancelled. Type \"book\" anytime to start again 🌟",
  },
  helpReset: {
    ar: "اكتب «حجز» لبدء حجز موعد 🦷",
    en: "Type \"book\" to start booking an appointment 🦷",
  },
  confirmAck: {
    ar: "شكرًا لك! ✅ وصلنا طلب تأكيد حجزك، وسيؤكده الطبيب قريبًا وتصلك رسالة بالتفاصيل.\n\nلو حابب تحجز موعدًا جديدًا، اكتب «حجز».",
    en: "Thank you! ✅ We've received your confirmation request. The doctor will confirm shortly and you'll get the details here.\n\nTo book a new appointment, type \"book\".",
  },
};

function serviceMenu(lang: "ar" | "en"): string {
  return sessionTypes
    .map((s, i) => `${i + 1}. ${lang === "ar" ? s.label.ar : s.label.en}`)
    .join("\n");
}

function fmtWhen(dt: Date, lang: "ar" | "en"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Cairo",
  }).format(dt);
}

const isCancel = (t: string) => /^(إلغاء|الغاء|cancel|stop|الغ)/i.test(t.trim());
const isConfirm = (t: string) => /^(تأكيد|تاكيد|اكد|نعم|تمام|confirm|yes|ok)/i.test(t.trim());

/** Detects a "confirm my booking" message (from the website's WhatsApp button),
 *  and extracts the booking code if present (e.g. "كود الحجز: ABC123"). */
export function detectConfirm(text: string): { isConfirm: boolean; code?: string } {
  const t = text || "";
  const mentions = /(تأكيد|أكّد|اكد|confirm).*(حجز|موعد|booking|appointment)|(حجز|موعد|booking|appointment).*(تأكيد|أكّد|اكد|confirm)/i.test(t);
  const m = t.match(/\b([A-Z2-9]{6})\b/); // tracking codes: 6 chars, no 0/O/1/I/L
  return { isConfirm: mentions || /كود الحجز|booking code/i.test(t), code: m ? m[1] : undefined };
}

/* ---------------- date & time parsers ---------------- */

const AR_WEEKDAYS: Record<string, number> = {
  "الأحد": 0, "الاحد": 0, "الإثنين": 1, "الاثنين": 1, "الثلاثاء": 2,
  "الأربعاء": 3, "الاربعاء": 3, "الخميس": 4, "الجمعة": 5, "السبت": 6,
};
const EN_WEEKDAYS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function nextWeekday(from: Date, target: number): Date {
  const d = startOfDay(from);
  const diff = (target - d.getDay() + 7) % 7 || 7; // strictly upcoming
  d.setDate(d.getDate() + diff);
  return d;
}

/** Parse a date phrase → a local-midnight Date, or null. */
export function parseDate(textRaw: string, now = new Date()): Date | null {
  const text = normalizeDigits(textRaw).trim().toLowerCase();

  if (/(النهارده|النهاردة|today|اليوم)/.test(text)) return startOfDay(now);
  if (/(بعد بكر|بعد غد|day after tomorrow)/.test(text)) {
    const d = startOfDay(now); d.setDate(d.getDate() + 2); return d;
  }
  if (/(بكره|بكرة|غدا|غدًا|tomorrow)/.test(text)) {
    const d = startOfDay(now); d.setDate(d.getDate() + 1); return d;
  }

  for (const [name, idx] of Object.entries(AR_WEEKDAYS)) {
    if (text.includes(name)) return nextWeekday(now, idx);
  }
  for (const [name, idx] of Object.entries(EN_WEEKDAYS)) {
    if (text.includes(name)) return nextWeekday(now, idx);
  }

  // explicit d/m or d/m/y (also accepts - or .)
  const m = text.match(/(\d{1,2})\s*[/\-.]\s*(\d{1,2})(?:\s*[/\-.]\s*(\d{2,4}))?/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    let year = m[3] ? parseInt(m[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (d.getMonth() !== month || d.getDate() !== day) return null; // invalid (e.g. 31/2)
    // if a bare d/m already passed this year, roll to next year
    if (!m[3] && startOfDay(d) < startOfDay(now)) d.setFullYear(year + 1);
    return startOfDay(d);
  }
  return null;
}

/** Parse a time phrase → minutes-since-midnight, or null. */
export function parseTime(textRaw: string): number | null {
  const text = normalizeDigits(textRaw).trim().toLowerCase();
  const pm = /(مساء|مساءً|م\b|pm|ev)/.test(text);
  const am = /(صباح|صباحًا|ص\b|am)/.test(text);

  const m = text.match(/(\d{1,2})(?:\s*[:.]\s*(\d{2}))?/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (hour > 23 || min > 59) return null;

  if (pm && hour < 12) hour += 12;
  else if (am && hour === 12) hour = 0;
  else if (!pm && !am && hour >= 1 && hour <= 11) hour += 12; // clinic is afternoon/evening

  return hour * 60 + min;
}

/* ---------------- the state machine ---------------- */

export function handleMessage(
  conv: WaConv,
  textRaw: string,
  phone: string,
  now = new Date()
): AgentResult {
  const text = (textRaw || "").trim();
  const lang = conv.lang || detectLang(text);
  const tr = (k: keyof typeof T) => T[k][lang];

  // global: cancel from anywhere
  if (isCancel(text) && conv.state !== "idle") {
    return { reply: tr("cancelled"), next: { state: "idle", draft: {}, lang } };
  }

  switch (conv.state) {
    case "idle": {
      // greet + show the service menu (detect language from the first message)
      const l = detectLang(text);
      // Free-trick: a "confirm my booking" message from the website button —
      // acknowledge it (this also opens WhatsApp's free 24h reply window).
      const conf = detectConfirm(text);
      if (conf.isConfirm) {
        return { reply: T.confirmAck[l], next: { state: "idle", draft: {}, lang: l } };
      }
      return {
        reply: `${T.greet[l]}\n\n${serviceMenu(l)}`,
        next: { state: "service", draft: {}, lang: l },
      };
    }

    case "service": {
      const n = parseInt(normalizeDigits(text), 10);
      let svc = Number.isFinite(n) ? sessionTypes[n - 1] : undefined;
      if (!svc) {
        // try matching by name
        svc = sessionTypes.find(
          (s) => text.includes(s.label.ar) || text.toLowerCase().includes(s.label.en.toLowerCase())
        );
      }
      if (!svc) {
        return { reply: tr("badService"), next: conv };
      }
      const label = lang === "ar" ? svc.label.ar : svc.label.en;
      return {
        reply: `${tr("askDate")}${label}${T.askDateBody[lang]}`,
        next: {
          state: "date",
          lang,
          draft: { serviceId: svc.id, serviceLabelEn: svc.label.en, serviceLabelAr: svc.label.ar },
        },
      };
    }

    case "date": {
      const d = parseDate(text, now);
      if (!d) return { reply: tr("badDate"), next: conv };
      if (startOfDay(d) < startOfDay(now)) return { reply: tr("pastDate"), next: conv };
      if (d.getDay() === CLOSED_WEEKDAY) return { reply: tr("friday"), next: conv };
      return {
        reply: tr("askTime"),
        next: { state: "time", lang, draft: { ...conv.draft, dateISO: d.toISOString() } },
      };
    }

    case "time": {
      const mins = parseTime(text);
      if (mins == null) return { reply: tr("badTime"), next: conv };
      if (mins < OPEN_MIN || mins > CLOSE_MIN) return { reply: tr("outOfHours"), next: conv };
      const base = conv.draft.dateISO ? new Date(conv.draft.dateISO) : startOfDay(now);
      base.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      if (base.getTime() <= now.getTime()) return { reply: tr("pastDate"), next: conv };
      return {
        reply: tr("askName"),
        next: { state: "name", lang, draft: { ...conv.draft, scheduledAt: base.toISOString() } },
      };
    }

    case "name": {
      const name = text.replace(/\s+/g, " ").trim();
      if (name.length < 2) return { reply: tr("askName"), next: conv };
      const when = conv.draft.scheduledAt ? new Date(conv.draft.scheduledAt) : now;
      const svcLabel = lang === "ar" ? conv.draft.serviceLabelAr : conv.draft.serviceLabelEn;
      const summary =
        `${tr("confirmHead")}\n` +
        `👤 ${name}\n` +
        `🦷 ${svcLabel}\n` +
        `📅 ${fmtWhen(when, lang)}` +
        T.confirmAsk[lang];
      return {
        reply: summary,
        next: { state: "confirm", lang, draft: { ...conv.draft, name } },
      };
    }

    case "confirm": {
      if (isConfirm(text)) {
        const d = conv.draft;
        const booking: BookingIntent = {
          name: d.name || "WhatsApp Patient",
          phone,
          serviceId: d.serviceId || "checkup",
          serviceLabelEn: d.serviceLabelEn || "Check-up",
          serviceLabelAr: d.serviceLabelAr || "كشف",
          scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : now,
          lang,
        };
        // reply is composed by the webhook (needs the generated code); leave empty.
        return { reply: "", next: { state: "idle", draft: {}, lang }, booking };
      }
      // anything else at confirm → re-show the ask
      return { reply: T.confirmAsk[lang].trim(), next: conv };
    }

    default:
      return { reply: T.helpReset[lang], next: { state: "idle", draft: {}, lang } };
  }
}

/** Success message after the booking row is created (needs the tracking code). */
export function bookingConfirmedReply(
  lang: "ar" | "en",
  code: string,
  trackUrl: string
): string {
  if (lang === "ar") {
    return (
      `✅ تم استلام طلب حجزك!\n` +
      `كود المتابعة: *${code}*\n\n` +
      `سيؤكده الطبيب قريبًا وتصلك رسالة. تابع حالة حجزك من هنا:\n${trackUrl}`
    );
  }
  return (
    `✅ Your booking request is in!\n` +
    `Tracking code: *${code}*\n\n` +
    `The doctor will confirm shortly and you'll get a message. Track it here:\n${trackUrl}`
  );
}
