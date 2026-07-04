"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/language";
import { formatMoney } from "@/lib/patients";

type Analytics = {
  range: string;
  kpis: {
    collected: number;
    billedInRange: number;
    outstanding: number;
    totalAppts: number;
    completed: number;
    newPatients: number;
    noShowRate: number;
  };
  apptsBreakdown: { completed: number; upcoming: number; missed: number; pending: number; declined: number; cancelled: number };
  topProcedures: { name: string; count: number; revenue: number }[];
  monthly: { key: string; revenue: number; appts: number }[];
  methodMix: { method: string; amount: number }[];
  newVsReturning: { new: number; returning: number };
};

const RANGES = [
  { id: "30d", label: { en: "30 days", ar: "٣٠ يوم" } },
  { id: "90d", label: { en: "90 days", ar: "٩٠ يوم" } },
  { id: "12m", label: { en: "12 months", ar: "١٢ شهر" } },
  { id: "all", label: { en: "All time", ar: "كل الفترة" } },
] as const;

const METHOD_LABEL: Record<string, { en: string; ar: string }> = {
  cash: { en: "Cash", ar: "نقدًا" },
  card: { en: "Card", ar: "بطاقة" },
  insurance: { en: "Insurance", ar: "تأمين" },
  transfer: { en: "Transfer", ar: "تحويل" },
};

const BREAKDOWN_META: { key: keyof Analytics["apptsBreakdown"]; label: { en: string; ar: string }; color: string }[] = [
  { key: "completed", label: { en: "Completed", ar: "مكتملة" }, color: "#10b981" },
  { key: "upcoming", label: { en: "Upcoming", ar: "قادمة" }, color: "#3b82f6" },
  { key: "pending", label: { en: "Pending", ar: "بانتظار" }, color: "#f59e0b" },
  { key: "missed", label: { en: "Missed", ar: "فائتة" }, color: "#f43f5e" },
  { key: "declined", label: { en: "Declined", ar: "مرفوضة" }, color: "#94a3b8" },
  { key: "cancelled", label: { en: "Cancelled", ar: "ملغاة" }, color: "#cbd5e1" },
];

function KpiCard({ label, value, accent, hint }: { label: string; value: string; accent: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-primary/12 bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink" style={{ color: accent }}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function AnalyticsSection() {
  const { tr, lang } = useLang();
  const [range, setRange] = useState("12m");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/admin/analytics?range=${range}`, { cache: "no-store" });
      if (res.ok && alive) setData((await res.json()) as Analytics);
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [range]);

  const monthLabel = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", { month: "short" }).format(new Date(y, m - 1, 1));
  };

  const maxRevenue = data ? Math.max(1, ...data.monthly.map((m) => m.revenue)) : 1;
  const maxProc = data ? Math.max(1, ...data.topProcedures.map((p) => p.revenue)) : 1;
  const totalMethods = data ? data.methodMix.reduce((s, m) => s + m.amount, 0) : 0;
  const breakdownTotal = data ? BREAKDOWN_META.reduce((s, b) => s + data.apptsBreakdown[b.key], 0) : 0;
  const nvr = data ? data.newVsReturning.new + data.newVsReturning.returning : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-ink lg:text-2xl">
            {tr({ en: "Analytics", ar: "التحليلات" })}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {tr({ en: "Your clinic's performance at a glance.", ar: "أداء عيادتك في لمحة." })}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                range === r.id
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-primary/15 text-muted hover:border-primary/40 hover:text-ink"
              }`}
            >
              {tr(r.label)}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="grid place-items-center py-20 text-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label={tr({ en: "Collected", ar: "المحصّل" })} value={formatMoney(data.kpis.collected, lang)} accent="#a87f2b" />
            <KpiCard label={tr({ en: "Outstanding", ar: "المتبقّي" })} value={formatMoney(data.kpis.outstanding, lang)} accent={data.kpis.outstanding > 0 ? "#e11d48" : "#10b981"} hint={tr({ en: "all-time balance owed", ar: "إجمالي المستحق" })} />
            <KpiCard label={tr({ en: "Appointments", ar: "المواعيد" })} value={String(data.kpis.totalAppts)} accent="#1c2127" hint={`${data.kpis.completed} ${tr({ en: "completed", ar: "مكتملة" })}`} />
            <KpiCard label={tr({ en: "New patients", ar: "مرضى جدد" })} value={String(data.kpis.newPatients)} accent="#3b82f6" />
            <KpiCard label={tr({ en: "Billed", ar: "إجمالي الفواتير" })} value={formatMoney(data.kpis.billedInRange, lang)} accent="#a87f2b" />
            <KpiCard label={tr({ en: "No-show rate", ar: "نسبة عدم الحضور" })} value={`${data.kpis.noShowRate}%`} accent={data.kpis.noShowRate > 20 ? "#e11d48" : "#10b981"} hint={tr({ en: "missed of scheduled", ar: "فائتة من المجدولة" })} />
            <KpiCard label={tr({ en: "New vs returning", ar: "جدد مقابل عائدين" })} value={`${data.newVsReturning.new} / ${data.newVsReturning.returning}`} accent="#8b5cf6" />
            <KpiCard label={tr({ en: "Collection rate", ar: "نسبة التحصيل" })} value={data.kpis.billedInRange > 0 ? `${Math.round((data.kpis.collected / data.kpis.billedInRange) * 100)}%` : "—"} accent="#10b981" />
          </div>

          {/* Monthly revenue chart */}
          <div className="rounded-2xl border border-primary/12 bg-surface p-5">
            <h3 className="text-sm font-bold text-ink">{tr({ en: "Revenue — last 12 months", ar: "الإيرادات — آخر ١٢ شهر" })}</h3>
            <div className="mt-4 flex h-44 items-stretch gap-2">
              {data.monthly.map((m) => (
                <div key={m.key} className="flex h-full flex-1 flex-col items-center gap-1.5" title={formatMoney(m.revenue, lang)}>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary transition-all"
                      style={{ height: `${m.revenue > 0 ? Math.max(3, (m.revenue / maxRevenue) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted">{monthLabel(m.key)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Top procedures */}
            <div className="rounded-2xl border border-primary/12 bg-surface p-5">
              <h3 className="text-sm font-bold text-ink">{tr({ en: "Top procedures by revenue", ar: "أكثر العمليات إيرادًا" })}</h3>
              <div className="mt-4 space-y-3">
                {data.topProcedures.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">{tr({ en: "No treatments yet.", ar: "لا توجد علاجات بعد." })}</p>
                ) : (
                  data.topProcedures.map((p) => (
                    <div key={p.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink">{p.name} <span className="text-xs font-normal text-muted">×{p.count}</span></span>
                        <span className="font-bold text-primary">{formatMoney(p.revenue, lang)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark" style={{ width: `${(p.revenue / maxProc) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Appointment breakdown + method mix */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-primary/12 bg-surface p-5">
                <h3 className="text-sm font-bold text-ink">{tr({ en: "Appointments breakdown", ar: "توزيع المواعيد" })}</h3>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-primary/5">
                  {BREAKDOWN_META.map((b) => {
                    const v = data.apptsBreakdown[b.key];
                    if (!v || breakdownTotal === 0) return null;
                    return <div key={b.key} style={{ width: `${(v / breakdownTotal) * 100}%`, background: b.color }} title={`${tr(b.label)}: ${v}`} />;
                  })}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  {BREAKDOWN_META.map((b) => (
                    <span key={b.key} className="inline-flex items-center gap-1.5 text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                      {tr(b.label)} <span className="font-bold text-ink">{data.apptsBreakdown[b.key]}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-primary/12 bg-surface p-5">
                <h3 className="text-sm font-bold text-ink">{tr({ en: "Payment methods", ar: "طرق الدفع" })}</h3>
                <div className="mt-3 space-y-2">
                  {data.methodMix.length === 0 ? (
                    <p className="py-3 text-center text-sm text-muted">{tr({ en: "No payments in this range.", ar: "لا مدفوعات في هذه الفترة." })}</p>
                  ) : (
                    data.methodMix.map((m) => (
                      <div key={m.method} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-ink">{tr(METHOD_LABEL[m.method] ?? { en: m.method, ar: m.method })}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted">{totalMethods > 0 ? Math.round((m.amount / totalMethods) * 100) : 0}%</span>
                          <span className="font-bold text-primary">{formatMoney(m.amount, lang)}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {nvr === 0 && (
            <p className="text-center text-xs text-muted">{tr({ en: "Tip: numbers grow as bookings, treatments and payments are recorded.", ar: "ملاحظة: الأرقام تكبر مع تسجيل الحجوزات والعلاجات والمدفوعات." })}</p>
          )}
        </>
      ) : (
        <p className="py-20 text-center text-sm text-muted">{tr({ en: "Could not load analytics.", ar: "تعذّر تحميل التحليلات." })}</p>
      )}
    </div>
  );
}
