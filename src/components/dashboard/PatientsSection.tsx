"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/lib/language";
import { Modal, Field, inputCls } from "./Modal";
import {
  type Patient,
  type PatientSession,
  type Payment,
  type SessionStatus,
  type PaymentMethod,
  type MedicalHistory,
  sessionStatusLabel,
  sessionStatusStyle,
  paymentMethodLabel,
  totalBilled,
  totalPaid,
  balance,
  lastVisit,
  searchPatients,
  formatMoney,
  formatDateStr,
  newPatient,
  uid,
} from "@/lib/patients";
import {
  sessionTypes,
  sessionTypeById,
  initials,
  tint,
  isoDate,
} from "@/lib/dashboard";
import { PatientFiles } from "./PatientFiles";

/* ============================ Forms ============================ */

function PatientForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Patient | null;
  onSubmit: (data: {
    name: string;
    phone: string;
    email: string;
    gender: "male" | "female" | "";
    notes: string;
    medical: MedicalHistory;
  }) => void;
  onCancel: () => void;
}) {
  const { tr } = useLang();
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [gender, setGender] = useState<"male" | "female" | "">(initial?.gender ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [bloodType, setBloodType] = useState(initial?.medical?.bloodType ?? "");
  const [allergies, setAllergies] = useState(initial?.medical?.allergies ?? "");
  const [conditions, setConditions] = useState(initial?.medical?.conditions ?? "");
  const [medications, setMedications] = useState(initial?.medical?.medications ?? "");
  const [medNotes, setMedNotes] = useState(initial?.medical?.notes ?? "");
  const valid = name.trim() && phone.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          gender,
          notes: notes.trim(),
          medical: {
            bloodType: bloodType.trim() || undefined,
            allergies: allergies.trim() || undefined,
            conditions: conditions.trim() || undefined,
            medications: medications.trim() || undefined,
            notes: medNotes.trim() || undefined,
          },
        });
      }}
      className="space-y-4"
    >
      <Field label={tr({ en: "Full name", ar: "الاسم بالكامل" })}>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label={tr({ en: "Phone number", ar: "رقم الهاتف" })}>
        <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" required />
      </Field>
      <Field label={tr({ en: "Email (optional)", ar: "البريد الإلكتروني (اختياري)" })}>
        <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
      </Field>
      <Field label={tr({ en: "Gender", ar: "النوع" })}>
        <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value as "male" | "female" | "")}>
          <option value="">{tr({ en: "Not specified", ar: "غير محدد" })}</option>
          <option value="male">{tr({ en: "Male", ar: "ذكر" })}</option>
          <option value="female">{tr({ en: "Female", ar: "أنثى" })}</option>
        </select>
      </Field>
      <Field label={tr({ en: "Notes (optional)", ar: "ملاحظات (اختياري)" })}>
        <textarea className={`${inputCls} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      {/* medical history */}
      <div className="rounded-xl border border-primary/15 bg-surface-2 p-3">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v8M8 12h8" /><rect x="3" y="3" width="18" height="18" rx="3" />
          </svg>
          {tr({ en: "Medical history", ar: "التاريخ الطبي" })}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tr({ en: "Blood type", ar: "فصيلة الدم" })}>
            <select className={inputCls} value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
              <option value="">{tr({ en: "Unknown", ar: "غير معروف" })}</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label={tr({ en: "Allergies", ar: "الحساسية" })}>
            <input className={inputCls} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder={tr({ en: "Penicillin, latex…", ar: "بنسلين، لاتكس…" })} />
          </Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={tr({ en: "Chronic conditions", ar: "أمراض مزمنة" })}>
            <input className={inputCls} value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder={tr({ en: "Diabetes, hypertension…", ar: "سكري، ضغط…" })} />
          </Field>
          <Field label={tr({ en: "Current medications", ar: "أدوية حالية" })}>
            <input className={inputCls} value={medications} onChange={(e) => setMedications(e.target.value)} placeholder={tr({ en: "Aspirin…", ar: "أسبرين…" })} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label={tr({ en: "Medical notes", ar: "ملاحظات طبية" })}>
            <textarea className={`${inputCls} resize-none`} rows={2} value={medNotes} onChange={(e) => setMedNotes(e.target.value)} placeholder={tr({ en: "Pregnancy, smoking, prior surgeries…", ar: "حمل، تدخين، عمليات سابقة…" })} />
          </Field>
        </div>
      </div>

      <FormActions onCancel={onCancel} disabled={!valid} />
    </form>
  );
}

function SessionForm({
  initial,
  base,
  onSubmit,
  onCancel,
}: {
  initial: PatientSession | null;
  base: Date;
  onSubmit: (s: PatientSession) => void;
  onCancel: () => void;
}) {
  const { tr } = useLang();
  const [typeId, setTypeId] = useState(initial?.typeId ?? "checkup");
  const [date, setDate] = useState(initial?.date ?? isoDate(base));
  const [cost, setCost] = useState(String(initial?.cost ?? sessionTypeById("checkup").price));
  const [status, setStatus] = useState<SessionStatus>(initial?.status ?? "completed");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const changeType = (id: string) => {
    setTypeId(id);
    if (!initial) setCost(String(sessionTypeById(id).price));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          id: initial?.id ?? uid("s"),
          typeId,
          date,
          cost: Number(cost) || 0,
          status,
          notes: notes.trim() || undefined,
        });
      }}
      className="space-y-4"
    >
      <Field label={tr({ en: "Session type", ar: "نوع الجلسة" })}>
        <select className={inputCls} value={typeId} onChange={(e) => changeType(e.target.value)}>
          {sessionTypes.map((s) => (
            <option key={s.id} value={s.id}>
              {tr(s.label)}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr({ en: "Date", ar: "التاريخ" })}>
          <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label={tr({ en: "Cost (EGP)", ar: "التكلفة (ج.م)" })}>
          <input className={inputCls} type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} dir="ltr" />
        </Field>
      </div>
      <Field label={tr({ en: "Status", ar: "الحالة" })}>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as SessionStatus)}>
          {(["completed", "scheduled", "cancelled"] as SessionStatus[]).map((s) => (
            <option key={s} value={s}>
              {tr(sessionStatusLabel[s])}
            </option>
          ))}
        </select>
      </Field>
      <Field label={tr({ en: "Notes (optional)", ar: "ملاحظات (اختياري)" })}>
        <textarea className={`${inputCls} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <FormActions onCancel={onCancel} disabled={false} />
    </form>
  );
}

function PaymentForm({
  initial,
  base,
  onSubmit,
  onCancel,
}: {
  initial: Payment | null;
  base: Date;
  onSubmit: (p: Payment) => void;
  onCancel: () => void;
}) {
  const { tr } = useLang();
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [date, setDate] = useState(initial?.date ?? isoDate(base));
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "cash");
  const [note, setNote] = useState(initial?.note ?? "");
  const valid = Number(amount) > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          id: initial?.id ?? uid("pay"),
          amount: Number(amount),
          date,
          method,
          note: note.trim() || undefined,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr({ en: "Amount (EGP)", ar: "المبلغ (ج.م)" })}>
          <input className={inputCls} type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" required />
        </Field>
        <Field label={tr({ en: "Date", ar: "التاريخ" })}>
          <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>
      <Field label={tr({ en: "Payment method", ar: "طريقة الدفع" })}>
        <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          {(["cash", "card", "insurance", "transfer"] as PaymentMethod[]).map((m) => (
            <option key={m} value={m}>
              {tr(paymentMethodLabel[m])}
            </option>
          ))}
        </select>
      </Field>
      <Field label={tr({ en: "Note (optional)", ar: "ملاحظة (اختياري)" })}>
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <FormActions onCancel={onCancel} disabled={!valid} />
    </form>
  );
}

function FormActions({ onCancel, disabled }: { onCancel: () => void; disabled: boolean }) {
  const { tr } = useLang();
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-primary/15 px-4 py-2 text-sm font-semibold text-muted transition hover:text-ink"
      >
        {tr({ en: "Cancel", ar: "إلغاء" })}
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-semibold text-[#0a0e12] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {tr({ en: "Save", ar: "حفظ" })}
      </button>
    </div>
  );
}

/* small icon buttons */
function IconBtn({ kind, onClick, title }: { kind: "edit" | "delete"; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-7 w-7 place-items-center rounded-lg border border-primary/12 text-muted transition ${
        kind === "delete" ? "hover:border-rose-400/40 hover:text-rose-600" : "hover:border-primary/40 hover:text-primary"
      }`}
    >
      {kind === "edit" ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
        </svg>
      )}
    </button>
  );
}

/* ============================ Main section ============================ */

type ModalState =
  | { type: "none" }
  | { type: "patient"; editing: Patient | null }
  | { type: "session"; editing: PatientSession | null }
  | { type: "payment"; editing: Payment | null };

export function PatientsSection({
  patients,
  base,
  onSavePatient,
  onDeletePatient,
}: {
  patients: Patient[];
  base: Date;
  onSavePatient: (p: Patient) => void;
  onDeletePatient: (id: string) => void;
}) {
  const { tr, lang } = useLang();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(patients[0]?.id ?? null);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const filtered = useMemo(() => searchPatients(patients, query), [patients, query]);
  const selected =
    patients.find((p) => p.id === selectedId) ??
    (filtered.length ? filtered[0] : null);

  const close = () => setModal({ type: "none" });

  /* ---- patient ---- */
  const submitPatient = (data: {
    name: string;
    phone: string;
    email: string;
    gender: "male" | "female" | "";
    notes: string;
    medical: MedicalHistory;
  }) => {
    if (modal.type !== "patient") return;
    const hasMedical = Object.values(data.medical).some(Boolean);
    if (modal.editing) {
      onSavePatient({
        ...modal.editing,
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        gender: data.gender || undefined,
        notes: data.notes || undefined,
        medical: hasMedical ? data.medical : undefined,
      });
    } else {
      const p = newPatient({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        gender: data.gender || undefined,
        notes: data.notes || undefined,
        medical: hasMedical ? data.medical : undefined,
        source: "manual",
        createdAt: isoDate(base),
      });
      onSavePatient(p);
      setSelectedId(p.id);
    }
    close();
  };

  const removePatient = (p: Patient) => {
    if (!window.confirm(tr({ en: `Delete client "${p.name}"? This cannot be undone.`, ar: `حذف العميل "${p.name}"؟ لا يمكن التراجع.` }))) return;
    onDeletePatient(p.id);
    setSelectedId(null);
  };

  /* ---- sessions ---- */
  const saveSession = (s: PatientSession) => {
    if (!selected) return;
    const exists = selected.sessions.some((x) => x.id === s.id);
    const sessions = exists
      ? selected.sessions.map((x) => (x.id === s.id ? s : x))
      : [...selected.sessions, s];
    onSavePatient({ ...selected, sessions });
    close();
  };
  const deleteSession = (id: string) => {
    if (!selected) return;
    onSavePatient({ ...selected, sessions: selected.sessions.filter((x) => x.id !== id) });
  };

  /* ---- payments ---- */
  const savePayment = (p: Payment) => {
    if (!selected) return;
    const exists = selected.payments.some((x) => x.id === p.id);
    const payments = exists
      ? selected.payments.map((x) => (x.id === p.id ? p : x))
      : [...selected.payments, p];
    onSavePatient({ ...selected, payments });
    close();
  };
  const deletePayment = (id: string) => {
    if (!selected) return;
    onSavePatient({ ...selected, payments: selected.payments.filter((x) => x.id !== id) });
  };

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight lg:text-2xl">
            {tr({ en: "Clients", ar: "العملاء" })}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {tr({
              en: "Profiles, session history and payments.",
              ar: "الملفات وسجل الجلسات والمدفوعات.",
            })}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: "patient", editing: null })}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-[#0a0e12] shadow-lg shadow-primary/25 transition hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {tr({ en: "Add Client", ar: "إضافة عميل" })}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ---------- list + search ---------- */}
        <div className="flex h-[30rem] flex-col rounded-2xl border border-primary/12 bg-surface lg:h-[46rem]">
          <div className="border-b border-primary/10 p-3">
            <div className="relative">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3-3" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr({ en: "Search by name or number…", ar: "ابحث بالاسم أو الرقم…" })}
                className="w-full rounded-xl border border-primary/15 bg-surface-2 ps-9 pe-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="mt-2 px-1 text-xs text-muted">
              {filtered.length} {tr({ en: "clients", ar: "عميل" })}
            </p>
          </div>

          <div className="custom-scroll flex-1 space-y-1.5 overflow-y-auto p-2.5">
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                {tr({ en: "No clients found.", ar: "لا يوجد عملاء." })}
              </p>
            ) : (
              filtered.map((p) => {
                const bal = balance(p);
                const active = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-start transition ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-primary/20 hover:bg-primary/5"
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                      {initials(p.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">{p.name}</span>
                      <span className="block truncate text-xs text-muted" dir="ltr">{p.phone}</span>
                    </span>
                    {bal > 0 ? (
                      <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                        {formatMoney(bal, lang)}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {tr({ en: "Paid", ar: "مدفوع" })}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---------- profile detail ---------- */}
        <div className="lg:col-span-2">
          {selected ? (
            <ProfileDetail
              key={selected.id}
              patient={selected}
              base={base}
              onEditPatient={() => setModal({ type: "patient", editing: selected })}
              onDeletePatient={() => removePatient(selected)}
              onAddSession={() => setModal({ type: "session", editing: null })}
              onEditSession={(s) => setModal({ type: "session", editing: s })}
              onDeleteSession={deleteSession}
              onAddPayment={() => setModal({ type: "payment", editing: null })}
              onEditPayment={(p) => setModal({ type: "payment", editing: p })}
              onDeletePayment={deletePayment}
            />
          ) : (
            <div className="grid h-[46rem] place-items-center rounded-2xl border border-dashed border-primary/15 bg-surface text-center">
              <div className="text-muted">
                <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 19a4 4 0 0 0-8 0M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                </svg>
                <p className="mt-3 font-semibold">{tr({ en: "Select a client", ar: "اختر عميلاً" })}</p>
                <p className="text-sm">{tr({ en: "or add a new one to get started.", ar: "أو أضف عميلاً جديدًا للبدء." })}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- modals ---------- */}
      <Modal
        open={modal.type === "patient"}
        onClose={close}
        title={
          modal.type === "patient" && modal.editing
            ? tr({ en: "Edit Client", ar: "تعديل العميل" })
            : tr({ en: "Add Client", ar: "إضافة عميل" })
        }
      >
        {modal.type === "patient" && (
          <PatientForm initial={modal.editing} onSubmit={submitPatient} onCancel={close} />
        )}
      </Modal>

      <Modal
        open={modal.type === "session"}
        onClose={close}
        title={
          modal.type === "session" && modal.editing
            ? tr({ en: "Edit Session", ar: "تعديل الجلسة" })
            : tr({ en: "Add Session", ar: "إضافة جلسة" })
        }
      >
        {modal.type === "session" && (
          <SessionForm initial={modal.editing} base={base} onSubmit={saveSession} onCancel={close} />
        )}
      </Modal>

      <Modal
        open={modal.type === "payment"}
        onClose={close}
        title={
          modal.type === "payment" && modal.editing
            ? tr({ en: "Edit Payment", ar: "تعديل الدفعة" })
            : tr({ en: "Add Payment", ar: "إضافة دفعة" })
        }
      >
        {modal.type === "payment" && (
          <PaymentForm initial={modal.editing} base={base} onSubmit={savePayment} onCancel={close} />
        )}
      </Modal>
    </div>
  );
}

/* ============================ Profile detail ============================ */

function MedRow({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="shrink-0 font-semibold text-muted">{label}:</span>
      <span className={`min-w-0 font-medium ${alert ? "text-rose-600" : "text-ink"}`}>
        {alert && (
          <svg viewBox="0 0 24 24" className="me-1 inline h-3.5 w-3.5 -translate-y-px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        )}
        {value}
      </span>
    </div>
  );
}

function MoneyStat({ label, value, tone }: { label: string; value: string; tone: "gold" | "green" | "red" | "neutral" }) {
  const tones = {
    gold: "border-primary/20 bg-primary/8 text-primary",
    green: "border-emerald-500/20 bg-emerald-500/8 text-emerald-700",
    red: "border-rose-500/20 bg-rose-500/8 text-rose-600",
    neutral: "border-primary/12 bg-surface-2 text-ink",
  } as const;
  return (
    <div className={`rounded-xl border p-3.5 ${tones[tone]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-lg font-extrabold" dir="ltr">{value}</p>
    </div>
  );
}

function ProfileDetail({
  patient,
  base,
  onEditPatient,
  onDeletePatient,
  onAddSession,
  onEditSession,
  onDeleteSession,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}: {
  patient: Patient;
  base: Date;
  onEditPatient: () => void;
  onDeletePatient: () => void;
  onAddSession: () => void;
  onEditSession: (s: PatientSession) => void;
  onDeleteSession: (id: string) => void;
  onAddPayment: () => void;
  onEditPayment: (p: Payment) => void;
  onDeletePayment: (id: string) => void;
}) {
  const { tr, lang } = useLang();
  const billed = totalBilled(patient);
  const paid = totalPaid(patient);
  const bal = balance(patient);
  const last = lastVisit(patient);
  const sessions = [...patient.sessions].sort((a, b) => b.date.localeCompare(a.date));
  const payments = [...patient.payments].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="custom-scroll h-auto space-y-5 overflow-y-auto rounded-2xl border border-primary/12 bg-surface p-5 lg:h-[46rem]">
      {/* header */}
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/12 text-xl font-extrabold text-primary">
          {initials(patient.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold text-ink">{patient.name}</h3>
            <span className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
              {patient.source === "booking"
                ? tr({ en: "From booking", ar: "من حجز" })
                : tr({ en: "Manual", ar: "يدوي" })}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <a href={`tel:${patient.phone.replace(/\s/g, "")}`} dir="ltr" className="inline-flex items-center gap-1.5 transition hover:text-primary">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 4h3l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
              </svg>
              {patient.phone}
            </a>
            {patient.email && (
              <span className="inline-flex items-center gap-1.5" dir="ltr">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                {patient.email}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4.5" width="18" height="17" rx="2" />
                <path d="M3 9h18M8 2.5v4M16 2.5v4" />
              </svg>
              {tr({ en: "Since", ar: "عميل منذ" })} {formatDateStr(patient.createdAt, lang)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditPatient}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 px-3 py-1.5 text-sm font-semibold text-muted transition hover:border-primary/40 hover:text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            {tr({ en: "Edit", ar: "تعديل" })}
          </button>
          <IconBtn kind="delete" onClick={onDeletePatient} title={tr({ en: "Delete client", ar: "حذف العميل" })} />
        </div>
      </div>

      {/* financial summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MoneyStat label={tr({ en: "Total Billed", ar: "إجمالي الفواتير" })} value={formatMoney(billed, lang)} tone="gold" />
        <MoneyStat label={tr({ en: "Total Paid", ar: "إجمالي المدفوع" })} value={formatMoney(paid, lang)} tone="green" />
        <MoneyStat
          label={tr({ en: "Balance Due", ar: "المتبقي" })}
          value={formatMoney(bal, lang)}
          tone={bal > 0 ? "red" : "green"}
        />
        <MoneyStat
          label={tr({ en: "Last Visit", ar: "آخر زيارة" })}
          value={last ? formatDateStr(last, lang) : tr({ en: "—", ar: "—" })}
          tone="neutral"
        />
      </div>

      {patient.notes && (
        <div className="rounded-xl border border-primary/10 bg-surface-2 p-3 text-sm text-ink/90">
          <span className="font-semibold text-primary">{tr({ en: "Notes: ", ar: "ملاحظات: " })}</span>
          {patient.notes}
        </div>
      )}

      {/* medical history */}
      {patient.medical && Object.values(patient.medical).some(Boolean) && (
        <div className="rounded-xl border border-rose-300/30 bg-rose-50/50 p-4">
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 6 4.5 4.5 0 0 0 2 8.5C2 13 12 21 12 21s3-2.4 5.3-5" />
            </svg>
            {tr({ en: "Medical history", ar: "التاريخ الطبي" })}
          </p>
          <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {patient.medical.bloodType && (
              <MedRow label={tr({ en: "Blood type", ar: "فصيلة الدم" })} value={patient.medical.bloodType} />
            )}
            {patient.medical.allergies && (
              <MedRow label={tr({ en: "Allergies", ar: "الحساسية" })} value={patient.medical.allergies} alert />
            )}
            {patient.medical.conditions && (
              <MedRow label={tr({ en: "Chronic conditions", ar: "أمراض مزمنة" })} value={patient.medical.conditions} />
            )}
            {patient.medical.medications && (
              <MedRow label={tr({ en: "Medications", ar: "أدوية" })} value={patient.medical.medications} />
            )}
          </div>
          {patient.medical.notes && (
            <p className="mt-2.5 border-t border-rose-300/30 pt-2.5 text-sm text-ink/85">{patient.medical.notes}</p>
          )}
        </div>
      )}

      {/* sessions */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wide text-ink">
            {tr({ en: "Session History", ar: "سجل الجلسات" })} ({patient.sessions.length})
          </h4>
          <button
            onClick={onAddSession}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {tr({ en: "Add Session", ar: "إضافة جلسة" })}
          </button>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-primary/15 py-6 text-center text-sm text-muted">
            {tr({ en: "No sessions yet.", ar: "لا توجد جلسات بعد." })}
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const type = sessionTypeById(s.typeId);
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-surface-2 p-3">
                  <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: type.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink">{tr(type.label)}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sessionStatusStyle[s.status]}`}>
                        {tr(sessionStatusLabel[s.status])}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      {formatDateStr(s.date, lang)}
                      {s.notes ? ` · ${s.notes}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink" dir="ltr">{formatMoney(s.cost, lang)}</span>
                  <span className="flex shrink-0 gap-1">
                    <IconBtn kind="edit" onClick={() => onEditSession(s)} title={tr({ en: "Edit", ar: "تعديل" })} />
                    <IconBtn kind="delete" onClick={() => onDeleteSession(s.id)} title={tr({ en: "Delete", ar: "حذف" })} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* payments */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wide text-ink">
            {tr({ en: "Payments", ar: "المدفوعات" })} ({patient.payments.length})
          </h4>
          <button
            onClick={onAddPayment}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {tr({ en: "Add Payment", ar: "إضافة دفعة" })}
          </button>
        </div>
        {payments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-primary/15 py-6 text-center text-sm text-muted">
            {tr({ en: "No payments recorded.", ar: "لا توجد مدفوعات." })}
          </p>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-surface-2 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink" dir="ltr">{formatMoney(p.amount, lang)}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {formatDateStr(p.date, lang)} · {tr(paymentMethodLabel[p.method])}
                    {p.note ? ` · ${p.note}` : ""}
                  </div>
                </div>
                <span className="flex shrink-0 gap-1">
                  <IconBtn kind="edit" onClick={() => onEditPayment(p)} title={tr({ en: "Edit", ar: "تعديل" })} />
                  <IconBtn kind="delete" onClick={() => onDeletePayment(p.id)} title={tr({ en: "Delete", ar: "حذف" })} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* patient files (x-rays, photos, documents) */}
      <PatientFiles patientKey={patient.id} patientName={patient.name} />
    </div>
  );
}
