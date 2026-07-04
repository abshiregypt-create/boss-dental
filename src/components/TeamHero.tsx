"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/language";

type Person = {
  src: string;
  /** Optional real name/role — fill once provided by the clinic. */
  name?: { en: string; ar: string };
  role?: { en: string; ar: string };
};

// The featured doctor — shown as a single spotlighted hero figure.
const people: Person[] = [
  {
    src: "/doctor-ibrahim.png",
    name: { en: "Dr. Ibrahim Salah", ar: "د. إبراهيم صلاح" },
    role: { en: "Consultant Cosmetic Dentist", ar: "استشاري تجميل الأسنان" },
  },
];

export function TeamHero() {
  const { tr } = useLang();
  // Single featured figure.
  const [active, setActive] = useState<number>(0);

  // Auto-cycle focus so each doctor is highlighted in turn (no-op for one).
  useEffect(() => {
    if (people.length < 2) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % people.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="team-stage relative mx-auto w-full max-w-[95rem]">
      {/* stage glow + floor reflection */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 -z-10 mx-auto h-36 max-w-6xl rounded-[50%] bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-10 bottom-7 -z-10 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* dir=ltr keeps the lineup order stable (men left, women right) in both Arabic and English */}
      <div dir="ltr" className="flex items-end justify-center">
        {people.map((p, i) => {
          const isActive = active === i;
          return (
            <button
              key={p.src}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={p.name ? tr(p.name) : `Dr. Ibrahim Salah`}
              className={`stage-figure group relative -mx-3 sm:-mx-4 ${
                isActive ? "z-20" : "z-10"
              }`}
              data-active={isActive}
            >
              {/* spotlight halo behind the active figure */}
              <span className="figure-halo" aria-hidden />

              <span className="figure-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.name ? tr(p.name) : "Dr. Ibrahim Salah"} className="figure-img" />
              </span>

              {/* label pill */}
              <span className="figure-label">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {p.name ? tr(p.name) : tr({ en: "Dr. Ibrahim Salah", ar: "د. إبراهيم صلاح" })}
                </span>
                {p.role && <span className="block text-[10px] font-medium text-primary/80">{tr(p.role)}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* hint */}
      <p className="mt-14 text-center text-xs font-medium text-muted">
        {tr({ en: "Crafting confident, natural smiles", ar: "نصنع ابتسامات طبيعية وواثقة" })}
      </p>
    </div>
  );
}
