"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLang } from "@/lib/language";
import { t } from "@/lib/content";
import { useSite } from "@/lib/siteStore";
import { activeClinic } from "@/lib/clinics";
import { TypingName } from "./TypingName";
import { TeamHero } from "./TeamHero";
import { CountUp } from "./CountUp";
import { SeamlessVideo } from "./SeamlessVideo";

const stats = [
  { value: "15+", key: "stat1" as const },
  { value: "5K+", key: "stat2" as const },
  { value: "3K+", key: "stat3" as const },
];

const heroVideo = activeClinic().hero.video ?? {
  src: "/clinic/videos/case-video-1.mp4",
  poster: "/clinic/smile-1.jpg",
  seamless: false,
};

export function Hero() {
  const { tr, lang } = useLang();
  const { settings } = useSite();
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt on the doctor photo card following the cursor
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${
        -py * 10
      }deg) scale(1.02)`;
    };
    const reset = () => {
      el.style.transform =
        "perspective(900px) rotateY(0) rotateX(0) scale(1)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden pt-28 pb-16 lg:pt-32"
    >
      {/* animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 start-[-6rem] h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
        <div className="absolute top-40 end-[-8rem] h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl animate-float-slow-2" />
        <div className="absolute inset-x-0 top-0 h-1/2 aurora opacity-40" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--primary) 1px, transparent 0)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Interactive team line-up at the very top */}
      <div className="mx-auto max-w-[95rem] px-5 text-center">
        <div className="fade-up" style={{ animationDelay: "0.05s" }}>
          <TeamHero />
        </div>

        {/* Animated clinic name under the team */}
        <h1
          key={`${lang}-${tr(settings.doctorName)}`}
          className="relative z-10 mt-8 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
        >
          <TypingName
            text={tr(settings.doctorName)}
            className="name-gold"
            speed={110}
            startDelay={350}
          />
        </h1>

        <p
          className="fade-up mt-3 text-lg font-semibold text-primary"
          style={{ animationDelay: "1.1s" }}
        >
          {tr(settings.role)}
        </p>

        <span
          className="fade-up mt-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-surface/70 px-4 py-1.5 text-sm font-semibold text-accent shadow-sm"
          style={{ animationDelay: "1.25s" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {tr(t.hero.badge)}
        </span>
      </div>

      {/* Headline + visual */}
      <div className="mx-auto mt-14 grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <div
          className="fade-up text-center lg:text-start"
          style={{ animationDelay: "1.35s" }}
        >
          <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {tr(settings.heroTitle1)}{" "}
            <span className="text-gradient">{tr(settings.heroTitle2)}</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted lg:mx-0">
            {tr(settings.subtitle)}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#contact"
              className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark px-7 py-3.5 text-center font-semibold text-[#0a0e12] shadow-xl shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/40 sm:w-auto"
            >
              {tr(t.hero.ctaPrimary)}
            </a>
            <a
              href="#services"
              className="w-full rounded-full border border-primary/30 bg-surface/60 px-7 py-3.5 text-center font-semibold text-ink transition hover:border-primary hover:text-primary sm:w-auto"
            >
              {tr(t.hero.ctaSecondary)}
            </a>
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-4 lg:mx-0">
            {stats.map((s) => (
              <div key={s.key} className="text-center lg:text-start">
                <div className="text-3xl font-extrabold text-primary">
                  <CountUp value={s.value} />
                </div>
                <div className="mt-1 text-xs font-medium text-muted">
                  {tr(t.hero[s.key])}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* tilt visual */}
        <div className="fade-up relative mx-auto w-full max-w-lg" style={{ animationDelay: "1.45s" }}>
          {heroVideo.seamless ? (
            <div ref={cardRef} className="hero-seamless relative transition-transform duration-200 will-change-transform">
              <SeamlessVideo
                src={heroVideo.src}
                poster={heroVideo.poster}
                className="ken-burns hero-seamless-video block w-full"
              />
              <div className="glass absolute -bottom-5 start-[-1rem] flex items-center gap-3 rounded-2xl p-3.5 shadow-xl">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">100%</div>
                  <div className="text-xs text-muted">Painless Care</div>
                </div>
              </div>

              <div className="glass absolute -top-4 end-[-1rem] flex items-center gap-2 rounded-2xl px-4 py-3 shadow-xl">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {["/clinic/smile-1.jpg", "/clinic/smile-2.jpg", "/clinic/case-gap.jpg"].map((src, idx) => (
                    <Image
                      key={idx}
                      src={src}
                      alt="patient"
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full border-2 border-surface object-cover"
                    />
                  ))}
                </div>
                <div className="text-xs font-semibold text-accent">★ 4.9 / 5</div>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={cardRef}
                className="hero-video-card relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-primary/20 shadow-2xl shadow-primary/10 transition-transform duration-200 will-change-transform"
              >
                <video
                  src={heroVideo.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster={heroVideo.poster}
                  className="ken-burns h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e12] via-[#0a0e12]/20 to-transparent" />
                <span className="absolute top-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  {tr({ en: "LIVE", ar: "مباشر" })}
                </span>
              </div>

              <div className="glass absolute -bottom-5 start-[-1rem] flex items-center gap-3 rounded-2xl p-3.5 shadow-xl">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">100%</div>
                  <div className="text-xs text-muted">Painless Care</div>
                </div>
              </div>

              <div className="glass absolute -top-4 end-[-1rem] flex items-center gap-2 rounded-2xl px-4 py-3 shadow-xl">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {["/clinic/smile-1.jpg", "/clinic/smile-2.jpg", "/clinic/case-gap.jpg"].map((src, idx) => (
                    <Image
                      key={idx}
                      src={src}
                      alt="patient"
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full border-2 border-surface object-cover"
                    />
                  ))}
                </div>
                <div className="text-xs font-semibold text-accent">★ 4.9 / 5</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* scroll cue */}
      <a
        href="#services"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-primary/70 transition hover:text-primary"
        aria-label="Scroll down"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 animate-soft-bounce" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
