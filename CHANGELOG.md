# Changelog

All notable changes to the BDIC site. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added — WhatsApp "Confirm on WhatsApp" free-trick flow
- Website booking success now shows a **"Confirm on WhatsApp"** button that opens a chat with a
  prefilled message **from the customer to the clinic** (`confirmOnWhatsAppLink()` in `site.ts`).
  Because the customer messages first, WhatsApp's free 24-hour window opens and the clinic's
  confirmation reply is **free** on the official Meta Cloud API.
- The agent recognises an inbound "confirm my booking (code …)" message and acknowledges it
  instead of restarting the booking menu (`detectConfirm()` in `wa-agent.ts`).
- Added `site.whatsapp` (clinic WhatsApp number) and an e2e test for the confirm acknowledgement.

### Added — WhatsApp booking agent (inbound)
- **Conversational booking via WhatsApp**: a bilingual (AR-first) agent that greets, shows the
  service menu, parses the day/time (e.g. "بكرة", "30/6", "5 مساءً"), takes the name, confirms,
  and creates a **pending** booking that feeds the existing confirm→reminder→queue automation.
- `src/lib/server/wa-agent.ts` — pure, testable state machine + date/time parsers (clinic-hours
  and Friday validation).
- `src/lib/server/wa-runtime.ts` — conversation persistence + booking creation + reply sending.
- `src/app/api/whatsapp/webhook` — Meta Cloud API webhook (GET verify + POST receive) with
  `X-Hub-Signature-256` verification.
- `src/app/api/whatsapp/simulate` — local simulator to test the whole flow without Meta
  (auto-disabled unless `WHATSAPP_PROVIDER=mock`).
- `WaConversation` Prisma model (+ migration) for per-chat state.
- Extracted shared `createBooking()` so the web form and the agent create bookings identically.
- e2e coverage `tests/e2e/whatsapp-agent.spec.ts` (full conversation + validation + cancel).
- Env: `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`. Docs: `docs/WHATSAPP-AGENT.md`.

### Added — Phase 3: safety net (backups, staging, tests, CI)
- **Backup/restore** (`scripts/backup.mjs`, `scripts/restore.mjs`): timestamped snapshots of
  the SQLite DB + patient uploads, prune-by-count, and a **reversible** restore (auto-saves the
  current state to `_pre-restore-*` first). npm: `db:backup`, `db:restore`.
- **Staging workflow** (`scripts/staging-sync.mjs`): clone live data into `prisma/staging.db`
  so edits/migrations are tested on real-shaped data without touching production. npm: `staging:sync`.
- **Health check**: `GET /api/health` (DB connectivity + uptime + latency) and
  `scripts/healthcheck.mjs` (exit-coded for monitoring). npm: `health`.
- **Automated tests**: Playwright e2e (`tests/e2e`) covering landing+SEO, robots/sitemap,
  health, the full **booking→confirm→tracker** lifecycle, and admin auth-block; plus unit
  tests (`tests/unit`) for the `stageOf` lifecycle logic. npm: `test`, `test:unit`.
- **CI** (`.github/workflows/ci.yml`): install → lint → migrate+seed → unit → build →
  e2e on every push/PR to `main`.
- New `.gitignore` entries for `/backups` and `prisma/staging.db*`.

### SEO/Analytics, prior phase — see below.

## [Unreleased — Phase 2]
- **Rich metadata**: `metadataBase`, Open Graph, Twitter card, keywords, canonical, AR/EN
  `hreflang` alternates, robots directives (`src/app/layout.tsx`).
- **JSON-LD structured data**: schema.org `Dentist`/`LocalBusiness` with real name, address,
  geo, phone, opening hours, services, social profiles (`src/lib/site.ts`).
- **`robots.ts`** — allows crawl of the public site, disallows `/dashboard`, `/login`, `/api/`, `/track/`; points to the sitemap.
- **`sitemap.ts`** — XML sitemap of public routes.
- **`manifest.ts`** — PWA web manifest (name, icons, theme).
- **`opengraph-image.tsx`** — branded 1200×630 social share image (dynamically generated).
- **Analytics** (`src/components/Analytics.tsx`) — Google Analytics 4 + Meta Pixel, **env-gated**
  (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_FB_PIXEL_ID`); render nothing until IDs are set; load `afterInteractive`.
- Documented `NEXT_PUBLIC_SITE_URL` / analytics env vars in `.env.example`.

## [1.0.0] — 2026-06-26
First tagged, documented release. Landing page + doctor dashboard + booking/WhatsApp
automation backend, hardened for handover.

### Added
- **Landing page** (bilingual AR/EN): hero with auto-cycling team photos, services, about,
  offers + popup, before/after gallery, videos, team, testimonials, booking form, footer.
- **Doctor dashboard**: secure login, daily overview + schedule, online bookings
  (confirm/decline), patient profiles (medical history, sessions, payments, file uploads),
  offers manager, site content editor.
- **Backend** (11 API routes): bookings, appointments admin, patient files, auth, public tracker, cron tick.
- **Booking → confirm → WhatsApp → live-queue** lifecycle with a public `/track/<code>` page.
- **Scheduler** (`node-cron`, every minute, idempotent) for reminder/queue/turn messages.
- **WhatsApp providers**: `mock` (default, safe), `metaCloud` (Meta Cloud API), `wa.me` links.
- **Patient files**: x-ray/photo/document uploads stored on disk, metadata in DB, auth-guarded streaming.
- **Offline-capable**: self-hosted fonts + local images (no CDN/font calls at runtime).
- **Documentation bundle** under `docs/` (architecture, API, data model, requirements, runbook, handover).

### Changed
- Hero now uses local images instead of remote Unsplash/pravatar URLs (offline-safe).
- Team hero arranged men-left / women-right, RTL-stable via `dir="ltr"` on the lineup.

### Security
- bcrypt password hashing + signed JWT session cookie; `/dashboard` and `/api/admin/*` guarded.

### Ops
- `.gitignore` hardened (logs, temp scripts, secrets, db, uploads).
- PM2 config + `start-bdic.cmd` auto-restart loop for local always-on running.

### Known gaps (see docs/HANDOVER.md)
- No automated tests, SEO, or analytics yet (Phases 2–3). Single environment; manual backups.
