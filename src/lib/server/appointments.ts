import type { Appointment } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dispatchMessage } from "./notify";
import { generateCode } from "./code";

export type Stage =
  | "pending"
  | "reserved"
  | "reminder"
  | "queue"
  | "turn"
  | "completed"
  | "declined"
  | "cancelled";

export function reminderLeadMin(): number {
  return parseInt(process.env.REMINDER_LEAD_MIN || "120", 10);
}
export function queueLeadMin(): number {
  return parseInt(process.env.QUEUE_LEAD_MIN || "60", 10);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function minutesUntil(appt: Appointment, now = new Date()): number {
  return (appt.scheduledAt.getTime() - now.getTime()) / 60000;
}

/** Current lifecycle stage for the patient-facing tracker. */
export function stageOf(appt: Appointment, now = new Date()): Stage {
  if (appt.status === "declined") return "declined";
  if (appt.status === "cancelled") return "cancelled";
  if (appt.status === "completed") return "completed";
  if (appt.status === "pending") return "pending";
  // confirmed
  const mins = minutesUntil(appt, now);
  if (mins <= 0) return "turn";
  if (mins <= queueLeadMin()) return "queue";
  if (mins <= reminderLeadMin()) return "reminder";
  return "reserved";
}

/** How many confirmed patients are booked before this one, same day, not yet seen. */
export async function patientsAhead(appt: Appointment, now = new Date()): Promise<number> {
  const dayStart = startOfDay(appt.scheduledAt);
  return prisma.appointment.count({
    where: {
      id: { not: appt.id },
      status: "confirmed",
      completedAt: null,
      scheduledAt: { gte: dayStart, lt: appt.scheduledAt },
    },
  });
}

export type PublicAppointment = {
  code: string;
  patientName: string;
  serviceLabel: { en: string; ar: string };
  scheduledAt: string;
  status: string;
  stage: Stage;
  minutesUntil: number;
  ahead: number;
  reminderLeadMin: number;
  queueLeadMin: number;
  now: string;
};

/** Shape an appointment for the public tracker, including live queue position. */
export async function publicView(appt: Appointment, now = new Date()): Promise<PublicAppointment> {
  const stage = stageOf(appt, now);
  const ahead = stage === "queue" || stage === "turn" ? await patientsAhead(appt, now) : 0;
  return {
    code: appt.code,
    patientName: appt.patientName,
    serviceLabel: { en: appt.serviceLabelEn, ar: appt.serviceLabelAr },
    scheduledAt: appt.scheduledAt.toISOString(),
    status: appt.status,
    stage,
    minutesUntil: Math.round(minutesUntil(appt, now)),
    ahead,
    reminderLeadMin: reminderLeadMin(),
    queueLeadMin: queueLeadMin(),
    now: now.toISOString(),
  };
}

export async function findByCode(code: string): Promise<Appointment | null> {
  return prisma.appointment.findUnique({ where: { code: code.toUpperCase() } });
}

/** Confirm a booking: flip to confirmed and fire the "reserved" WhatsApp message. */
export async function confirmAppointment(idOrCode: { id?: string; code?: string }): Promise<Appointment | null> {
  const appt = idOrCode.id
    ? await prisma.appointment.findUnique({ where: { id: idOrCode.id } })
    : idOrCode.code
    ? await findByCode(idOrCode.code)
    : null;
  if (!appt) return null;
  if (appt.status === "confirmed") return appt;

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: "confirmed", confirmedAt: new Date() },
  });
  await dispatchMessage(updated, "reserved");

  // If it's already inside a reminder/queue window, let the next tick catch up.
  return updated;
}

/**
 * Scheduler core: for confirmed appointments, fire the timed WhatsApp messages
 * exactly once each. Idempotent via the *SentAt / queueOpenedAt timestamps.
 */
export async function processTick(now = new Date()): Promise<{ scanned: number; sent: number }> {
  const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000); // include just-passed turns
  const appts = await prisma.appointment.findMany({
    where: { status: "confirmed", scheduledAt: { gte: windowStart } },
  });

  let sent = 0;
  const R = reminderLeadMin();
  const Q = queueLeadMin();

  for (const a of appts) {
    const mins = minutesUntil(a, now);

    if (!a.reminderSentAt && mins <= R && mins > Q) {
      await dispatchMessage(a, "reminder");
      await prisma.appointment.update({ where: { id: a.id }, data: { reminderSentAt: now } });
      sent++;
    }

    if (!a.queueOpenedAt && mins <= Q && mins > 0) {
      const ahead = await patientsAhead(a, now);
      await dispatchMessage(a, "queue", { ahead });
      await prisma.appointment.update({ where: { id: a.id }, data: { queueOpenedAt: now } });
      sent++;
    }

    if (!a.turnSentAt && mins <= 0) {
      await dispatchMessage(a, "turn");
      await prisma.appointment.update({ where: { id: a.id }, data: { turnSentAt: now } });
      sent++;
    }
  }

  return { scanned: appts.length, sent };
}

export type NewBooking = {
  name: string;
  phone: string;
  serviceId: string;
  serviceLabelEn: string;
  serviceLabelAr: string;
  scheduledAt: Date;
  durationMin?: number;
  complaint?: string | null;
  offerTitle?: string | null;
  lang?: "en" | "ar";
  source?: string;
  waChatId?: string | null;
};

/**
 * Create a pending booking with a unique tracking code.
 * Shared by the website form (/api/bookings) and the WhatsApp agent so both
 * paths behave identically (status "pending" → doctor confirms → WhatsApp flow).
 */
export async function createBooking(input: NewBooking): Promise<Appointment> {
  let code = generateCode();
  for (let i = 0; i < 6; i++) {
    const clash = await prisma.appointment.findUnique({ where: { code } });
    if (!clash) break;
    code = generateCode();
  }

  return prisma.appointment.create({
    data: {
      code,
      patientName: input.name,
      phone: input.phone,
      serviceId: input.serviceId,
      serviceLabelEn: input.serviceLabelEn,
      serviceLabelAr: input.serviceLabelAr,
      scheduledAt: input.scheduledAt,
      durationMin: input.durationMin ?? 30,
      complaint: input.complaint ?? null,
      offerTitle: input.offerTitle ?? null,
      lang: input.lang === "ar" ? "ar" : "en",
      waChatId: input.waChatId ?? null,
      status: "pending",
    },
  });
}

