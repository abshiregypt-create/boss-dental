import type { Lang } from "./content";
import type { Bilingual } from "./dashboard";

export type SessionStatus = "completed" | "scheduled" | "cancelled";
export type PaymentMethod = "cash" | "card" | "insurance" | "transfer";

export type PatientSession = {
  id: string;
  typeId: string; // links to sessionTypes
  date: string; // YYYY-MM-DD
  cost: number; // EGP
  status: SessionStatus;
  notes?: string;
};

export type Payment = {
  id: string;
  amount: number; // EGP
  date: string; // YYYY-MM-DD
  method: PaymentMethod;
  note?: string;
};

export type Patient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: "male" | "female";
  source: "manual" | "booking";
  createdAt: string; // YYYY-MM-DD
  notes?: string;
  medical?: MedicalHistory;
  sessions: PatientSession[];
  payments: Payment[];
};

export type MedicalHistory = {
  bloodType?: string;
  allergies?: string; // e.g. penicillin, latex
  conditions?: string; // chronic conditions: diabetes, hypertension…
  medications?: string; // current medications
  notes?: string; // free-form medical notes
};

/* ---------------- Labels ---------------- */
export const sessionStatusLabel: Record<SessionStatus, Bilingual> = {
  completed: { en: "Completed", ar: "مكتملة" },
  scheduled: { en: "Scheduled", ar: "مجدولة" },
  cancelled: { en: "Cancelled", ar: "ملغاة" },
};

export const sessionStatusStyle: Record<SessionStatus, string> = {
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
  scheduled: "bg-amber-500/10 text-amber-700 border-amber-500/25",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/25",
};

export const paymentMethodLabel: Record<PaymentMethod, Bilingual> = {
  cash: { en: "Cash", ar: "نقدًا" },
  card: { en: "Card", ar: "بطاقة" },
  insurance: { en: "Insurance", ar: "تأمين" },
  transfer: { en: "Bank Transfer", ar: "تحويل بنكي" },
};

/* ---------------- Financial helpers ---------------- */
export function totalBilled(p: Patient): number {
  return p.sessions
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + s.cost, 0);
}

export function totalPaid(p: Patient): number {
  return p.payments.reduce((sum, x) => sum + x.amount, 0);
}

export function balance(p: Patient): number {
  return totalBilled(p) - totalPaid(p);
}

export function lastVisit(p: Patient): string | null {
  const done = p.sessions
    .filter((s) => s.status !== "cancelled")
    .map((s) => s.date)
    .sort();
  return done.length ? done[done.length - 1] : null;
}

/* ---------------- Search ---------------- */
export function searchPatients(list: Patient[], q: string): Patient[] {
  const query = q.trim().toLowerCase();
  if (!query) return list;
  const digits = query.replace(/\D/g, "");
  return list.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(query);
    const phoneDigits = p.phone.replace(/\D/g, "");
    const phoneMatch = digits.length >= 2 && phoneDigits.includes(digits);
    return nameMatch || phoneMatch;
  });
}

/* ---------------- Formatting ---------------- */
export function formatMoney(amount: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateStr(date: string, lang: Lang): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function uid(prefix = "pt"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/* ---------------- Build a patient from a confirmed booking ---------------- */
export function newPatient(init: Partial<Patient> & { name: string; phone: string }): Patient {
  return {
    id: uid(),
    email: "",
    gender: undefined,
    source: "manual",
    createdAt: init.createdAt ?? new Date().toISOString().slice(0, 10),
    notes: "",
    sessions: [],
    payments: [],
    ...init,
  };
}

/* ---------------- Seed clients ---------------- */
export const seedPatients: Patient[] = [
  {
    id: "pt-ahmed",
    name: "Ahmed Kamal",
    phone: "+20 100 221 8841",
    email: "ahmed.kamal@email.com",
    gender: "male",
    source: "booking",
    createdAt: "2026-01-12",
    notes: "Sensitive to cold. Prefers morning appointments.",
    sessions: [
      { id: "s-a1", typeId: "checkup", date: "2026-01-12", cost: 300, status: "completed" },
      { id: "s-a2", typeId: "cleaning", date: "2026-02-03", cost: 600, status: "completed", notes: "Mild gum inflammation." },
      { id: "s-a3", typeId: "filling", date: "2026-03-15", cost: 800, status: "completed" },
    ],
    payments: [
      { id: "p-a1", amount: 900, date: "2026-01-12", method: "cash" },
      { id: "p-a2", amount: 800, date: "2026-03-15", method: "card" },
    ],
  },
  {
    id: "pt-mona",
    name: "Mona Saleh",
    phone: "+20 101 553 2290",
    email: "mona.saleh@email.com",
    gender: "female",
    source: "booking",
    createdAt: "2026-02-20",
    notes: "Bride — wants a bright smile before the wedding.",
    sessions: [
      { id: "s-m1", typeId: "whitening", date: "2026-02-20", cost: 3500, status: "completed" },
      { id: "s-m2", typeId: "crown", date: "2026-04-02", cost: 4500, status: "completed", notes: "Two upper veneers." },
    ],
    payments: [
      { id: "p-m1", amount: 3500, date: "2026-02-20", method: "card" },
      { id: "p-m2", amount: 2000, date: "2026-04-02", method: "transfer" },
    ],
  },
  {
    id: "pt-youssef",
    name: "Youssef Adel",
    phone: "+20 122 980 7741",
    gender: "male",
    source: "manual",
    createdAt: "2026-03-05",
    notes: "Recurring decay — review diet and brushing.",
    sessions: [
      { id: "s-y1", typeId: "hard_filling", date: "2026-03-05", cost: 1200, status: "completed" },
      { id: "s-y2", typeId: "root_canal", date: "2026-05-18", cost: 2500, status: "completed" },
      { id: "s-y3", typeId: "crown", date: "2026-06-22", cost: 4500, status: "scheduled" },
    ],
    payments: [
      { id: "p-y1", amount: 1200, date: "2026-03-05", method: "cash" },
      { id: "p-y2", amount: 1500, date: "2026-05-18", method: "cash" },
    ],
  },
  {
    id: "pt-salma",
    name: "Salma Hany",
    phone: "+20 111 442 6610",
    email: "salma.hany@email.com",
    gender: "female",
    source: "booking",
    createdAt: "2026-04-10",
    sessions: [
      { id: "s-s1", typeId: "cleaning", date: "2026-04-10", cost: 600, status: "completed" },
      { id: "s-s2", typeId: "checkup", date: "2026-06-01", cost: 300, status: "completed" },
    ],
    payments: [
      { id: "p-s1", amount: 900, date: "2026-06-01", method: "cash" },
    ],
  },
  {
    id: "pt-omar",
    name: "Omar Sherif",
    phone: "+20 106 219 4453",
    email: "omar.sherif@email.com",
    gender: "male",
    source: "manual",
    createdAt: "2026-05-02",
    notes: "Implant case — staged treatment over several months.",
    sessions: [
      { id: "s-o1", typeId: "extraction", date: "2026-05-02", cost: 700, status: "completed" },
      { id: "s-o2", typeId: "implant", date: "2026-05-20", cost: 12000, status: "completed" },
      { id: "s-o3", typeId: "crown", date: "2026-06-25", cost: 4500, status: "scheduled" },
    ],
    payments: [
      { id: "p-o1", amount: 700, date: "2026-05-02", method: "cash" },
      { id: "p-o2", amount: 6000, date: "2026-05-20", method: "transfer" },
    ],
  },
  {
    id: "pt-hana",
    name: "Hana Fathy",
    phone: "+20 100 776 1188",
    gender: "female",
    source: "booking",
    createdAt: "2026-06-08",
    sessions: [
      { id: "s-h1", typeId: "filling", date: "2026-06-08", cost: 800, status: "completed" },
    ],
    payments: [
      { id: "p-h1", amount: 800, date: "2026-06-08", method: "cash" },
    ],
  },
];
