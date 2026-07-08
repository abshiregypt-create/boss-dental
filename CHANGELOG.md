# Changelog

All notable changes to the BDIC site. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Recovery / Production-Readiness sprints (branch `recovery/production-readiness`)

Hardening pass from the 10-expert production-readiness audit. No existing feature
removed; business rules (financial calc, commissions, payments, appointment and
inventory workflows, permissions, taxes) preserved. Every task ships with tests
and docs. Backward compatible.

#### Sprint 5 - Dependency security
- **postcss advisory cleared (GHSA-qx2v-qp2m-jg93, moderate)** - added a
  `package.json` `overrides` pinning `postcss` to `^8.5.15`. This dedupes the
  tree to a single patched `postcss@8.5.16` (previously Next bundled a vulnerable
  `8.4.31` while Tailwind already used `8.5.x`). Same-major bump, verified with a
  full `next build`; avoids the `npm audit fix --force` path that would downgrade
  Next 16 -> 9. No runtime/API/UX change.
- **uuid advisory accepted (GHSA-w5hq-g745-h8pq, moderate) - not reachable.**
  The flaw affects `uuid` v3/v5/v6 only when a caller-supplied `buf` output
  buffer is passed. The single transitive consumer, `exceljs@4.4.0`, imports
  `{ v4: uuidv4 } = require('uuid')` and calls `uuidv4()` with no `buf`; the app
  code uses no `uuid` directly. Forcing `uuid@>=11` would break exceljs's
  `^8.3.0` requirement to patch an unexploitable path, so it is documented and
  deferred rather than force-upgraded. Re-evaluate when exceljs ships a
  uuid@>=11-compatible release.
- **CI now runs against real PostgreSQL** - `.github/workflows/ci.yml` spins up a
  `postgres:16-alpine` service and points `DATABASE_URL` at it, so
  `prisma migrate deploy` actually exercises the production dialect (NUMERIC money
  columns, CHECK constraints, indexes) instead of the previous throwaway
  `file:./dev.db` SQLite URL that silently skipped every Postgres-only migration.
  Added a dedicated `npm run typecheck` (`tsc --noEmit`) script and CI step, and
  annotated the three Playwright fixture params in `tests/e2e/whatsapp-agent.spec.ts`
  so the typecheck gate is green. No runtime/API/UX change.
- **`.env.example` / `.env.railway.example` completed** - documented every
  environment variable the code actually consumes that was previously missing:
  `CRON_SECRET` (guards the external `POST /api/admin/tick` reminder trigger via
  the `x-cron-secret` header), the `SEED_DOCTOR_*` seeding credentials
  (production requires `SEED_DOCTOR_PASSWORD`; dev generates a random one),
  `WA_SESSION_DIR`/`CHROME_PATH` (WhatsApp Web worker), `NEXT_PUBLIC_SALES_WHATSAPP`,
  `NEXT_PUBLIC_LOGIN_USERNAME`, and the `NEXT_PUBLIC_CLINIC`/`CLINIC` slug.
  Prevents silent production misconfiguration. Template-only; no code change.
- **Regression tests for phone normalization** - added `tests/unit/phone.test.mjs`
  (11 cases) around `normalizePhone`, the pure function that decides the exact
  digits used for wa.me / WhatsApp Cloud delivery (country-code insertion, trunk-0
  handling, `00` prefix stripping, bare-local numbers, custom country codes, and
  the 10-15 digit validity window). Test-only; no source change. Unit suite 109 -> 120.

#### Sprint 4 — Enterprise Readiness
- **Centralized env validation** — `src/lib/server/env.ts` `checkEnv()` reports
  every misconfiguration at once (errors for functionality-breaking gaps,
  warnings for degraded/less-secure setups) plus typed accessors
  (`requireEnv`/`optionalEnv`/`intEnv`/`boolEnv`). `instrumentation.ts` now calls
  `validateEnvAndLog()` through the structured logger. Additive; boot never throws.
- **Readiness/liveness health** — `GET /api/health` adds `version`/`commit`/`env`
  build metadata (existing `status`/`db`/`uptimeSec`/`latencyMs`/`time` preserved,
  200/503 semantics unchanged); new `HEAD /api/health` is a DB-free liveness probe.
  `buildHealthPayload` extracted as a pure, tested helper.
- **In-process metrics** — `src/lib/server/metrics.ts` (bounded latency ring buffer,
  capped route cardinality) records request counts by status class and per-route
  p50/p95/p99. Fed automatically by `logRequest`. Exposed at owner-only
  `GET /api/admin/metrics`; no patient or financial data.
- **API versioning** — `x-api-version: 1` stamped on every instrumented response;
  contract-versioning, request-correlation, error-envelope and pagination-header
  conventions documented in `docs/API-REFERENCE.md`.
- **Uniform observability** — `withRoute()` adopted across 34 remaining route
  handlers (admin reads/reports/mutations incl. dynamic routes, auth, bookings,
  track, tick) for consistent structured logging, metrics, `x-request-id` and safe
  500 envelopes. Health probes, the Meta webhook/simulate, and high-frequency
  WhatsApp worker-polling routes intentionally excluded. `withRoute` generalized to
  `Promise<Response>` so binary download routes are covered; `NextResponse` callers
  unaffected.

#### Sprint 3 — Data Integrity & API Robustness
- **Input validation** — `zod` schemas on every write endpoint via
  `src/lib/server/validate.ts` (`parseJson`, `zMoney`, `zPct`, `zReqText`,
  `zOptText`, `zDateString`, …). Consistent `{ error, message, details }`
  envelope. Schemas are at least as permissive as the old hand-rolled checks
  (null-tolerant `.nullish()`, lenient `.catch()`), so no previously-accepted
  request is now rejected; all existing error codes/messages preserved.
- **CHECK constraints (`20260709000003_data_constraints`)** — non-negative money
  (Procedure, TreatmentRecord, Payment, TreatmentDoctor, DoctorPayout,
  ClinicExpense, ClinicExpenseOverride), percentages `0..100` (discountPct,
  commissionPct), and enum guards for `Appointment.status` and
  `Payment`/`DoctorPayout.method`. Raw SQL (Prisma can't model CHECK);
  case-insensitive enum compare + drop-if-exists make it safe and re-runnable.
- **Indexes (`20260709000004_performance_indexes`)** — added on the unindexed
  FKs `TreatmentRecord.procedureId`, `Payment.treatmentRecordId`,
  `Appointment.patientId`, and the hot sort column `Appointment.scheduledAt`
  (schema `@@index` kept in sync). Redundant indexes avoided.
- **Opt-in pagination** — `src/lib/server/pagination.ts` adds `?limit`/`?offset`
  (clamped) with page metadata in response **headers** (`X-Total-Count`,
  `X-Limit`, `X-Offset`, `X-Has-More`, `X-Next-Offset`). Response bodies are
  unchanged; with no query params behaviour is identical to before. Applied to
  appointments, patient-files, procedures, doctors; report/aggregation routes
  intentionally excluded to preserve totals.
- **Structured logging** — `src/lib/server/logger.ts` emits JSON-Lines
  (info/warn/error) with credential-key redaction and stack/DB-error capture.
  `http.ts` adds `withRoute()` (request id via `x-request-id`, user id, route,
  status, duration) adopted on the primary read/write routes.

#### Sprint 2 — Access Control & Financial Integrity
- **RBAC (SEC-02)** — `requireRole()` + `OWNER_ROLES` in `src/lib/server/guard.ts`
  gate admin/owner routes from the authenticated session (not client input).
- **Session revocation (SEC-12)** — `User.tokenVersion` embedded in the JWT (`ver`);
  `guard.ts` rejects stale tokens so logout/forced sign-out revoke issued tokens.
- **Audit trail (SEC-12)** — new `AuditLog` table + shared helper records actor,
  action, entity, and metadata on destructive and financial operations.
- **IDOR scoping (SEC-05)** — patient-file `[id]` reads resolve records scoped to
  their owner and reject cross-patient ids.
- **No default credentials (SEC-03)** — `prisma/seed.mjs` requires
  `SEED_DOCTOR_PASSWORD` in production; no baked-in first-user password.
- **Exact money (DB-01)** — all 13 monetary columns migrated float → `Decimal`
  (`NUMERIC(12,2)`, percentages `NUMERIC(5,2)`). New `src/lib/server/money.ts`
  converts Decimal↔number at the API boundary so JSON stays numeric and the
  frontend is unchanged. Migration `20260709000002_money_decimal` preserves values.
- **Reliability** — atomic treatment+payment write (`prisma.$transaction`),
  appointment unique-code allocation retry on P2002, and idempotent
  claim-then-send scheduling for reminders/follow-ups (exactly-once on success).
- **Timezone (s2-tz)** — process timezone pinned to `Africa/Cairo` (via
  `instrumentation.ts` default + `TZ` env in deploy templates) so appointment
  slot/day math agrees with the Cairo times patients see. Non-destructive; no
  stored instants changed. (Commits `6e933cd`, `aaf0e07`, `c003d5c`, `62107b6`.)

#### Sprint 1 — Security & Reliability Hardening
- **Route middleware (SEC-01)** — `src/middleware.ts` (replacing the dead
  `src/proxy.ts` Next never ran) protects `/dashboard*`.
- **AUTH_SECRET strength (SEC-07)**, **WhatsApp webhook fail-closed (SEC-06)**,
  **simulate-endpoint gating (SEC-06)**, **path-traversal containment (SEC-08)**,
  **upload content/magic-byte validation + safe downloads (SEC-11)**,
  **login rate limiting (SEC-04)**, **baseline security headers (SEC-09)**.
  Full detail in `docs/SECURITY.md`. (Commits `529fce2`, `39c27b8`.)


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
