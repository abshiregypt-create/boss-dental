"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/language";
import { Reveal } from "./Reveal";

type Clip = {
  src: string;
  title: { en: string; ar: string };
  tag: { en: string; ar: string };
  duration: string;
  /** source filmed sideways — rotate 90° to display upright */
  rotate?: boolean;
  /** natural landscape aspect for non-rotated clips */
  ratio?: string;
};

const clips: Clip[] = [
  {
    src: "/clinic/videos/case-video-1.mp4",
    title: { en: "Inside Our Clinic", ar: "من داخل عيادتنا" },
    tag: { en: "Reel", ar: "ريـل" },
    duration: "0:20",
    rotate: true,
  },
  {
    src: "/clinic/videos/case-video-2.mp4",
    title: { en: "Patient Journey", ar: "رحلة المريض" },
    tag: { en: "Showcase", ar: "عرض" },
    duration: "0:31",
    ratio: "1080 / 719",
  },
];

export function VideoShowcase() {
  const { tr } = useLang();
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [muted, setMuted] = useState<boolean[]>(() => clips.map(() => true));

  // Pause clips while off-screen to stay light on CPU; resume in view.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.25 }
    );
    videoRefs.current.forEach((v) => v && obs.observe(v));
    return () => obs.disconnect();
  }, []);

  const toggleMute = (i: number) => {
    const v = videoRefs.current[i];
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    if (!next) v.play().catch(() => {});
    setMuted((m) => m.map((val, idx) => (idx === i ? next : val)));
  };

  return (
    <section id="videos" className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute start-[-6rem] top-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute end-[-6rem] bottom-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">
            {tr({ en: "Clinic in Motion", ar: "من داخل العيادة" })}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {tr({ en: "Watch Our Work", ar: "شاهد من أعمالنا" })}
          </h2>
          <p className="mt-4 text-lg text-muted">
            {tr({
              en: "A closer look at the care Dr. Ibrahim Salah provides — real moments from our clinic.",
              ar: "نظرة أقرب على رعاية د. إبراهيم صلاح — لحظات حقيقية من داخل عيادتنا.",
            })}
          </p>
        </Reveal>

        <div className="mx-auto mt-14 flex max-w-5xl flex-col gap-10">
          {clips.map((c, i) => (
            <Reveal
              key={c.src}
              delay={i * 90}
              as="article"
              className="video-card group relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-[#0a0e12] shadow-2xl shadow-primary/10 transition hover:border-primary/40"
            >
              {c.rotate ? (
                <div className="rot-frame">
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    src={c.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="rot-video"
                  />
                </div>
              ) : (
                <div className="relative w-full" style={{ aspectRatio: c.ratio }}>
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    src={c.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              )}

              {/* overlays */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15" />

              <span className="absolute top-4 start-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-[#0a0e12] shadow">
                {tr(c.tag)}
              </span>
              <span className="absolute top-4 end-4 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                {c.duration}
              </span>

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                <h3 className="text-lg font-bold text-white drop-shadow sm:text-xl">{tr(c.title)}</h3>
                <button
                  type="button"
                  onClick={() => toggleMute(i)}
                  aria-label={muted[i] ? "Unmute" : "Mute"}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-primary hover:text-[#0a0e12]"
                >
                  {muted[i] ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m23 9-6 6M17 9l6 6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
                    </svg>
                  )}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
