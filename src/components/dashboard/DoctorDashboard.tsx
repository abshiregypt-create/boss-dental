"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLang } from "@/lib/language";
import { t } from "@/lib/content";
import { LanguageToggle } from "@/components/LanguageToggle";
import { DaySchedule } from "./DaySchedule";
import { BookingRequests } from "./BookingRequests";
import { PatientsSection } from "./PatientsSection";
import { OffersManager } from "./OffersManager";
import { SiteEditor } from "./SiteEditor";
import { OnlineBookings } from "./OnlineBookings";
import { WhatsAppLink } from "./WhatsAppLink";
import {
  type BookingRequest,
  type Appointment,
  sessionTypes,
  seedRequests,
  fmtWeekday,
  fmtDayNum,
  freeSlotCount,
  fmtTime,
  hhmmToMin,
  sessionTypeById,
  isClosed,
  isoDate,
} from "@/lib/dashboard";
import {
  type Patient,
  seedPatients,
  newPatient,
} from "@/lib/patients";
import { useSite, type Lead } from "@/lib/siteStore";

const WEEK_DAYS = 7;

function StatCard({
  icon,
  label,
  value,
  caption,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/12 bg-surface p-4">
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="truncate text-xl font-extrabold text-ink">{value}</p>
        </div>
      </div>
      {caption && <p className="mt-2 truncate text-xs text-muted">{caption}</p>}
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="grid min-h-[24rem] place-items-center rounded-2xl border border-dashed border-primary/15 bg-surface text-center">
      <div className="text-muted">
        <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l3 2" />
        </svg>
        <p className="mt-3 font-bold text-ink">{label}</p>
        <p className="text-sm">Coming soon</p>
      </div>
    </div>
  );
}

const navItems = [
  { id: "overview", label: { en: "Overview", ar: "الرئيسية" }, icon: "M3 12 12 4l9 8M5 10v9h5v-6h4v6h5v-9" },
  { id: "bookings", label: { en: "Bookings", ar: "الحجوزات" }, icon: "M4 5h16v10H7l-3 3V5Z" },
  { id: "whatsapp", label: { en: "WhatsApp", ar: "واتساب" }, icon: "M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Z" },
  { id: "calendar", label: { en: "Calendar", ar: "التقويم" }, icon: "M3 9h18M7 3v4m10-4v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" },
  { id: "patients", label: { en: "Clients", ar: "العملاء" }, icon: "M16 19a4 4 0 0 0-8 0M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" },
  { id: "offers", label: { en: "Offers", ar: "العروض" }, icon: "M20 12v8H4v-8M2 7h20v5H2zM12 7v13M12 7S10.5 3 8 3a2 2 0 0 0 0 4M12 7s1.5-4 4-4a2 2 0 0 1 0 4" },
  { id: "editor", label: { en: "Site Editor", ar: "محرر الموقع" }, icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" },
  { id: "settings", label: { en: "Settings", ar: "الإعدادات" }, icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.3 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.5h5l.3-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.07-.33.1-.66.1-1Z" },
] as const;

export function DoctorDashboard() {
  const { tr, lang } = useLang();
  const {
    leads,
    markLeadSeen,
    removeLead,
    appointments,
    addAppointment,
    updateAppointment,
    removeAppointment,
  } = useSite();
  const base = useMemo(() => new Date(), []);
  const [requests, setRequests] = useState<BookingRequest[]>(seedRequests);
  const [patients, setPatients] = useState<Patient[]>(seedPatients);
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [activeNav, setActiveNav] = useState("overview");

  // Persist clients so manual additions / edits survive refresh.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("dash_patients");
      if (raw) setPatients(JSON.parse(raw) as Patient[]);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("dash_patients", JSON.stringify(patients));
    } catch {
      /* ignore */
    }
  }, [patients]);

  const savePatient = (p: Patient) => {
    setPatients((prev) =>
      prev.some((x) => x.id === p.id)
        ? prev.map((x) => (x.id === p.id ? p : x))
        : [p, ...prev]
    );
  };
  const deletePatient = (id: string) => {
    setPatients((prev) => prev.filter((x) => x.id !== id));
  };

  // Online bookings (website + WhatsApp) live in the database. Pull them once
  // (polling) and derive both the schedule blocks and the review requests below.
  type DbAppt = {
    code: string;
    patientName: string;
    phone: string;
    serviceId: string;
    serviceLabelEn: string;
    serviceLabelAr: string;
    scheduledAt: string;
    status: string;
    complaint?: string | null;
    createdAt: string;
  };
  const [dbAppts, setDbAppts] = useState<DbAppt[]>([]);
  // Bookings the doctor just confirmed/declined here — hidden from the request
  // list instantly (the next poll then reflects the persisted DB status).
  const [handledCodes, setHandledCodes] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/appointments", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (alive) setDbAppts((j.appointments ?? []) as DbAppt[]);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const todayMid = useMemo(() => {
    const x = new Date(base);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  }, [base]);
  const dayOffsetOf = (iso: string) => {
    const x = new Date(iso);
    x.setHours(0, 0, 0, 0);
    return Math.round((x.getTime() - todayMid) / 86400000);
  };
  const hhmmOf = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // DB bookings (confirmed + pending) mapped into the schedule Appointment shape,
  // limited to the visible week so they show in the day grid + week strip.
  const onlineAppts = useMemo<Appointment[]>(() => {
    return dbAppts
      .filter((a) => a.status === "confirmed" || a.status === "pending")
      .map((a) => {
        const typeId = sessionTypes.some((s) => s.id === a.serviceId) ? a.serviceId : "checkup";
        return {
          id: `online-${a.code}`,
          patient: { en: a.patientName, ar: a.patientName },
          typeId,
          dayOffset: dayOffsetOf(a.scheduledAt),
          start: hhmmOf(a.scheduledAt),
          status: a.status === "confirmed" ? "confirmed" : "pending",
          phone: a.phone,
        } as Appointment;
      })
      .filter((a) => a.dayOffset >= 0 && a.dayOffset < WEEK_DAYS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbAppts, todayMid]);

  // Pending DB bookings mapped into the Lead shape so WhatsApp/website requests
  // show in the "Recent Bookings — requests to review" panel for the doctor to
  // confirm or decline (newest request first).
  const dbLeads = useMemo<Lead[]>(() => {
    return dbAppts
      .filter((a) => a.status === "pending" && !handledCodes.has(a.code))
      .map((a) => {
        const serviceId = sessionTypes.some((s) => s.id === a.serviceId) ? a.serviceId : "checkup";
        return {
          id: `wa-${a.code}`,
          name: a.patientName,
          phone: a.phone,
          message: a.complaint ?? "",
          offerId: null,
          offerTitle: null,
          serviceId,
          serviceLabel: { en: a.serviceLabelEn, ar: a.serviceLabelAr },
          dayOffset: dayOffsetOf(a.scheduledAt),
          start: hhmmOf(a.scheduledAt),
          appointmentId: null,
          trackCode: a.code,
          createdAt: new Date(a.createdAt).getTime(),
          status: "new",
        } as Lead;
      })
      .sort((x, y) => y.createdAt - x.createdAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbAppts, handledCodes, todayMid]);

  // Merge the local schedule with online (DB) bookings for all schedule views.
  const scheduleAppts = useMemo(() => {
    const seen = new Set(appointments.map((a) => a.id));
    return [...appointments, ...onlineAppts.filter((a) => !seen.has(a.id))];
  }, [appointments, onlineAppts]);


  // Client accounts auto-created from bookings (website + WhatsApp) live in the
  // database. Pull them so each WhatsApp booker shows up in the Clients tab with
  // their real number, merged with the locally-managed clients.
  const [onlinePatients, setOnlinePatients] = useState<Patient[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/patients", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (alive) setOnlinePatients((j.patients ?? []) as Patient[]);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Show DB-created clients that aren't already in the local list (dedupe by the
  // trailing phone digits). New WhatsApp clients surface at the top.
  const mergedPatients = useMemo(() => {
    const tail = (p: string) => p.replace(/\D/g, "").slice(-9);
    const localTails = new Set(patients.map((p) => tail(p.phone)).filter((d) => d.length >= 8));
    const extra = onlinePatients.filter((p) => {
      const d = tail(p.phone);
      return d.length >= 8 ? !localTails.has(d) : true;
    });
    return [...extra, ...patients];
  }, [patients, onlinePatients]);

  // Confirm an online booking lead: lock its slot, create the client + session.
  const confirmLead = (lead: Lead) => {
    if (lead.appointmentId) updateAppointment(lead.appointmentId, { status: "confirmed" });

    // Fire the server-side WhatsApp flow (sends "reserved" + schedules reminder/queue).
    if (lead.trackCode) {
      fetch(`/api/admin/appointments/${lead.trackCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      }).catch(() => {});
      setHandledCodes((prev) => new Set(prev).add(lead.trackCode!));
    }

    const digits = lead.phone.replace(/\D/g, "");
    const offerNote = lead.offerTitle ? `${tr({ en: "Offer", ar: "عرض" })}: ${tr(lead.offerTitle)}` : "";
    const note = [offerNote, lead.message].filter(Boolean).join(" — ");
    const session =
      lead.serviceId && lead.dayOffset != null && lead.start
        ? {
            id: `s-${lead.id}`,
            typeId: lead.serviceId,
            date: isoDate(base, lead.dayOffset),
            cost: sessionTypeById(lead.serviceId).price,
            status: "scheduled" as const,
            notes: note || undefined,
          }
        : null;
    setPatients((prev) => {
      const idx = digits.length >= 5 ? prev.findIndex((p) => p.phone.replace(/\D/g, "") === digits) : -1;
      if (idx >= 0) {
        const ex = prev[idx];
        const merged = {
          ...ex,
          notes: [ex.notes, note].filter(Boolean).join(" | "),
          sessions: session && !ex.sessions.some((s) => s.id === session.id) ? [...ex.sessions, session] : ex.sessions,
        };
        const copy = [...prev];
        copy[idx] = merged;
        return copy;
      }
      const created = newPatient({
        name: lead.name || "—",
        phone: lead.phone,
        source: "booking",
        createdAt: isoDate(base),
        notes: note,
        sessions: session ? [session] : [],
      });
      return [created, ...prev];
    });
    markLeadSeen(lead.id);
    if (lead.dayOffset != null && lead.dayOffset >= 0 && lead.dayOffset < WEEK_DAYS) {
      setSelectedOffset(lead.dayOffset);
    }
  };

  // Decline an online booking: free its slot and drop the lead.
  const declineLead = (lead: Lead) => {
    // DB-backed (WhatsApp/website) booking: mark it declined server-side.
    if (lead.trackCode) {
      fetch(`/api/admin/appointments/${lead.trackCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      }).catch(() => {});
      setHandledCodes((prev) => new Set(prev).add(lead.trackCode!));
    }
    if (lead.appointmentId) removeAppointment(lead.appointmentId);
    removeLead(lead.id);
  };

  // When a booking is confirmed, create or update the client's profile.
  const upsertPatientFromRequest = (req: BookingRequest) => {
    const reqDigits = req.phone.replace(/\D/g, "");
    const date = isoDate(base, req.dayOffset);
    const cost = sessionTypeById(req.typeId).price;
    const session = {
      id: `s-${req.id}`,
      typeId: req.typeId,
      date,
      cost,
      status: "scheduled" as const,
      notes: req.complaint.en,
    };
    setPatients((prev) => {
      const idx = prev.findIndex(
        (p) => p.phone.replace(/\D/g, "") === reqDigits
      );
      if (idx >= 0) {
        const existing = prev[idx];
        if (existing.sessions.some((s) => s.id === session.id)) return prev;
        const updated = { ...existing, sessions: [...existing.sessions, session] };
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      const created = newPatient({
        name: req.patient.en,
        phone: req.phone,
        source: "booking",
        createdAt: isoDate(base),
        notes: req.complaint.en,
        sessions: [session],
      });
      return [created, ...prev];
    });
  };

  const confirmRequest = (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req || req.status !== "new") return;
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r))
    );
    addAppointment({
      id: `appt-${req.id}`,
      patient: req.patient,
      typeId: req.typeId,
      dayOffset: req.dayOffset,
      start: req.start,
      status: "confirmed",
      phone: req.phone,
    });
    upsertPatientFromRequest(req);
    setSelectedOffset(req.dayOffset);
  };

  const declineRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "declined" } : r))
    );
  };

  const todayAppts = scheduleAppts.filter((a) => a.dayOffset === 0);
  const newLeadCount = leads.filter((l) => l.status === "new").length;
  const newCount =
    requests.filter((r) => r.status === "new").length + newLeadCount + dbLeads.length;
  const freeToday = freeSlotCount(todayAppts);
  const nextAppt = [...todayAppts].sort(
    (a, b) => hhmmToMin(a.start) - hhmmToMin(b.start)
  )[0];

  const hour = base.getHours();
  const greeting =
    hour < 12
      ? { en: "Good morning", ar: "صباح الخير" }
      : hour < 18
      ? { en: "Good afternoon", ar: "مساء الخير" }
      : { en: "Good evening", ar: "مساء الخير" };

  return (
    <div className="dash-light flex min-h-screen bg-background text-ink">
      {/* ---------- Sidebar ---------- */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-primary/10 bg-surface/60 p-4 lg:flex">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-white p-0.5 shadow-lg shadow-primary/20">
            <Image src="/bdic-logo.jpg" alt={tr(t.brand)} width={40} height={40} className="h-full w-full object-contain" />
          </span>
          <span className="text-base font-bold tracking-tight">{tr(t.brand)}</span>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeNav === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:bg-primary/5 hover:text-ink"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {tr(item.label)}
            </button>
          ))}
        </nav>

        <a
          href="/"
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-primary/5 hover:text-primary"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {tr({ en: "Back to site", ar: "العودة للموقع" })}
        </a>
        <button
          onClick={() => {
            fetch("/api/auth/logout", { method: "POST" }).finally(() => window.location.assign("/login"));
          }}
          className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-rose-500/5 hover:text-rose-600"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {tr({ en: "Sign out", ar: "تسجيل الخروج" })}
        </button>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-primary/10 bg-background/80 px-4 py-3 backdrop-blur-md lg:px-6">
          <div>
            <h1 className="text-base font-bold lg:text-lg">
              {tr({ en: "Doctor Dashboard", ar: "لوحة الطبيب" })}
            </h1>
            <p className="hidden text-xs text-muted sm:block">
              {activeNav === "patients"
                ? tr({ en: "Clients & payments", ar: "العملاء والمدفوعات" })
                : tr({ en: "Appointments & schedule", ar: "المواعيد والجدول" })}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageToggle />
            <button
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-primary/20 text-ink transition hover:border-primary hover:text-primary"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0" />
              </svg>
              {newCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-[#0a0e12]">
                  {newCount}
                </span>
              )}
            </button>
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white p-0.5 ring-2 ring-primary/40">
              <Image src="/bdic-logo.jpg" alt={tr(t.brand)} width={40} height={40} className="h-full w-full object-contain" />
            </span>
          </div>
        </header>

        {/* content */}
        <main className="flex-1 space-y-5 p-4 lg:p-6">
          {/* mobile section switcher (sidebar is desktop-only) */}
          <div className="custom-scroll -mx-1 flex gap-2 overflow-x-auto px-1 lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeNav === item.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-primary/15 text-muted"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {tr(item.label)}
              </button>
            ))}
          </div>

          {activeNav === "overview" && (
          <>
          {/* greeting */}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight lg:text-2xl">
              {tr(greeting)}, {tr(t.brand)} 👋
            </h2>
            <p className="mt-1 text-sm text-muted">
              {tr({
                en: "Here's what your clinic looks like today.",
                ar: "إليك ملخص عيادتك اليوم.",
              })}
            </p>
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              accent="#c9a24b"
              label={tr({ en: "Today's Sessions", ar: "جلسات اليوم" })}
              value={String(todayAppts.length)}
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4.5" width="18" height="17" rx="2" />
                  <path d="M3 9h18M8 2.5v4M16 2.5v4" />
                </svg>
              }
            />
            <StatCard
              accent="#60a5fa"
              label={tr({ en: "New Requests", ar: "حجوزات جديدة" })}
              value={String(newCount)}
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5h16v10H7l-3 3V5Z" />
                </svg>
              }
            />
            <StatCard
              accent="#34d399"
              label={tr({ en: "Free Slots Today", ar: "مواعيد متاحة اليوم" })}
              value={String(freeToday)}
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7.5V12l3 2" />
                </svg>
              }
            />
            <StatCard
              accent="#f472b6"
              label={tr({ en: "Next Session", ar: "الجلسة القادمة" })}
              value={nextAppt ? fmtTime(base, 0, hhmmToMin(nextAppt.start), lang) : "—"}
              caption={
                nextAppt
                  ? `${tr(nextAppt.patient)} · ${tr(sessionTypeById(nextAppt.typeId).label)}`
                  : tr({ en: "No sessions today", ar: "لا جلسات اليوم" })
              }
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 19a4 4 0 0 0-8 0M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                </svg>
              }
            />
          </div>

          {/* week strip */}
          <div className="custom-scroll flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: WEEK_DAYS }, (_, offset) => {
              const count = scheduleAppts.filter((a) => a.dayOffset === offset).length;
              const active = selectedOffset === offset;
              const closed = isClosed(base, offset);
              return (
                <button
                  key={offset}
                  onClick={() => setSelectedOffset(offset)}
                  className={`flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 transition ${
                    active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-primary/12 bg-surface text-muted hover:border-primary/30 hover:text-ink"
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase">
                    {offset === 0 ? tr({ en: "Today", ar: "اليوم" }) : fmtWeekday(base, offset, lang)}
                  </span>
                  <span className="text-lg font-extrabold">{fmtDayNum(base, offset, lang)}</span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      closed ? "bg-rose-500/70" : count > 0 ? "bg-primary" : "bg-muted/30"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* panels */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="h-[38rem] lg:col-span-2">
              <DaySchedule base={base} dayOffset={selectedOffset} appointments={scheduleAppts} />
            </div>
            <div className="h-[38rem]">
              <BookingRequests
                base={base}
                requests={requests}
                extraLeads={dbLeads}
                onConfirm={confirmRequest}
                onDecline={declineRequest}
                onLeadConfirm={confirmLead}
                onLeadDecline={declineLead}
              />
            </div>
          </div>
          </>
          )}

          {activeNav === "patients" && (
            <PatientsSection
              patients={mergedPatients}
              base={base}
              onSavePatient={savePatient}
              onDeletePatient={deletePatient}
            />
          )}

          {activeNav === "bookings" && <OnlineBookings />}

          {activeNav === "whatsapp" && <WhatsAppLink />}

          {activeNav === "offers" && <OffersManager />}

          {activeNav === "editor" && <SiteEditor />}

          {(activeNav === "calendar" || activeNav === "settings") && (
            <ComingSoon label={tr(navItems.find((n) => n.id === activeNav)!.label)} />
          )}
        </main>
      </div>
    </div>
  );
}
