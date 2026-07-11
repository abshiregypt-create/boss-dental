"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/language";

type SwitchBranch = { id: string; nameEn: string; nameAr: string; code: string };

const selectCls =
  "rounded-lg border border-primary/15 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary disabled:opacity-50";

/**
 * Active-branch switcher (multi-branch Phase 2). Lets a staff member choose the
 * branch new records are stamped against; the choice is stored in the
 * `bdic_branch` cookie via /api/admin/active-branch.
 *
 * Renders nothing when the clinic has fewer than two selectable branches, so a
 * single-branch clinic's screens look exactly as before.
 */
export function BranchSwitcher({ compact = false }: { compact?: boolean }) {
  const { tr, lang } = useLang();
  const [branches, setBranches] = useState<SwitchBranch[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/active-branch", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j) return;
        setBranches(Array.isArray(j.branches) ? j.branches : []);
        setActiveId(typeof j.branchId === "string" ? j.branchId : "");
      })
      .catch(() => {
        /* leave empty — switcher stays hidden */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (branches.length < 2) return null;

  const label = (b: SwitchBranch) =>
    `${lang === "ar" ? b.nameAr || b.nameEn : b.nameEn || b.nameAr} (${b.code})`;

  const onChange = async (nextId: string) => {
    const prev = activeId;
    setActiveId(nextId);
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/active-branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: nextId }),
      });
      if (res.ok) {
        const chosen = branches.find((b) => b.id === nextId);
        setNotice(
          tr({
            en: `Now working in ${chosen ? label(chosen) : "the selected branch"}. New records are saved to it.`,
            ar: `أنت تعمل الآن في ${chosen ? label(chosen) : "الفرع المحدد"}. تُحفظ السجلات الجديدة فيه.`,
          }),
        );
      } else {
        setActiveId(prev);
        setNotice(tr({ en: "Could not switch branch.", ar: "تعذر تبديل الفرع." }));
      }
    } catch {
      setActiveId(prev);
      setNotice(tr({ en: "Could not switch branch.", ar: "تعذر تبديل الفرع." }));
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <div className="relative flex items-center gap-1.5">
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="hidden h-4 w-4 text-muted sm:block"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 21h18M6 21V8l6-4 6 4v13M10 21v-5h4v5" />
        </svg>
        <select
          id="branch-switcher"
          aria-label={tr({ en: "Working branch", ar: "فرع العمل" })}
          className="max-w-[10rem] rounded-lg border border-primary/20 bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-primary disabled:opacity-50 sm:max-w-[14rem] sm:text-sm"
          value={activeId}
          disabled={saving}
          onChange={(e) => onChange(e.target.value)}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {label(b)}
            </option>
          ))}
        </select>
        {notice && (
          <p
            role="status"
            className="absolute end-0 top-full z-40 mt-1 max-w-[16rem] rounded-md bg-emerald-600 px-2 py-1 text-xs text-white shadow-lg"
          >
            {notice}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor="branch-switcher" className="text-sm text-ink/70">
          {tr({ en: "Working in", ar: "أعمل في" })}
        </label>
        <select
          id="branch-switcher"
          className={selectCls}
          value={activeId}
          disabled={saving}
          onChange={(e) => onChange(e.target.value)}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {label(b)}
            </option>
          ))}
        </select>
      </div>
      {notice && (
        <p role="status" className="text-xs text-emerald-600">
          {notice}
        </p>
      )}
    </div>
  );
}
