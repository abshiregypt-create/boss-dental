"use client";

import { useLang } from "@/lib/language";
import { Reveal } from "./Reveal";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

type Pair = {
  before: string;
  after: string;
  title: { en: string; ar: string };
  tag: { en: string; ar: string };
};

const pairs: Pair[] = [
  {
    before: "/cases/before-1.png",
    after: "/cases/after-1.png",
    title: { en: "Implants & Full Restoration", ar: "زراعة وترميم كامل" },
    tag: { en: "Implants", ar: "زراعة" },
  },
  {
    before: "/cases/before-2.png",
    after: "/cases/after-2.png",
    title: { en: "Crowns & Smile Makeover", ar: "تركيبات وتجميل الابتسامة" },
    tag: { en: "Cosmetic", ar: "تجميلي" },
  },
];

export function ResultsGallery() {
  const { tr } = useLang();

  return (
    <section id="results" className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute end-[-6rem] top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute start-[-6rem] bottom-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">
            {tr({ en: "Before & After", ar: "قبل وبعد" })}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {tr({ en: "Drag to See the Difference", ar: "اسحب لترى الفرق" })}
          </h2>
          <p className="mt-4 text-lg text-muted">
            {tr({
              en: "Slide the handle to reveal real before-and-after results from our clinic.",
              ar: "حرّك المؤشر لتكشف نتائج حقيقية قبل وبعد العلاج في عيادتنا.",
            })}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {pairs.map((p, i) => (
            <Reveal key={p.before} delay={(i % 2) * 100} as="article">
              <BeforeAfterSlider
                before={{ src: p.before, alt: tr({ en: `${tr(p.title)} — before`, ar: `${tr(p.title)} — قبل` }) }}
                after={{ src: p.after, alt: tr({ en: `${tr(p.title)} — after`, ar: `${tr(p.title)} — بعد` }) }}
                beforeLabel={tr({ en: "Before", ar: "قبل" })}
                afterLabel={tr({ en: "After", ar: "بعد" })}
              />
              <div className="mt-3 flex items-center justify-between gap-2 px-1">
                <h3 className="text-sm font-bold text-ink">{tr(p.title)}</h3>
                <span className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-bold text-primary">
                  {tr(p.tag)}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted">
          {tr({
            en: "Results vary from patient to patient. Photos shared with patient consent.",
            ar: "النتائج تختلف من مريض لآخر. الصور منشورة بموافقة المرضى.",
          })}
        </p>
      </div>
    </section>
  );
}
