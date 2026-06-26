# Changelog

All notable changes to the BDIC site. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

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
