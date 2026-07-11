# Changelog

All notable changes to the BDIC site. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Recovery / Production-Readiness sprints (branch `recovery/production-readiness`)

Hardening pass from the 10-expert production-readiness audit. No existing feature
removed; business rules (financial calc, commissions, payments, appointment and
inventory workflows, permissions, taxes) preserved. Every task ships with tests
and docs. Backward compatible.

#### Sprint 9 - Inventory: Purchasing Insights (reorder suggestions + supplier price history)

Additive, read-only reporting on top of the existing inventory + purchase-order
data. No schema change, no migration, no change to any existing endpoint, workflow,
or screen — every figure is derived from tables the system already maintains.

- **Reorder suggestions** - new `GET /api/admin/inventory/reorder` lists active items
  at/below their reorder level, each annotated with quantity already on order (open
  POs, `submitted`/`partially_received`; trashed POs excluded), a suggested buy
  quantity, and the last purchase (supplier + unit cost + date). Suggested quantity
  nets out open POs so the buyer never double-orders what is already inbound, and
  honours a configured `reorderQty` batch size when present.
- **Supplier price history** - new `GET /api/admin/inventory/items/[id]/purchase-history`
  returns an item's recent receipts (newest first) with supplier, unit cost, quantity
  and date, for spotting price creep and negotiating.
- **Pure math** - `suggestedOrderQty(onHand, onOrder, reorderLevel, reorderQty)` added
  to `inventory.ts` (consistent with `isLowStock`) and unit-tested (mirrored in
  `tests/unit/inventory.test.mjs`).
- **Service** - new `src/lib/server/purchasing-insights.ts` (`reorderReport`,
  `itemPurchaseHistory`); read-only, uses the soft-delete read extension to skip
  trashed POs automatically.
- **UI** - a "To reorder" section on the inventory Overview tab and a "Purchase
  history" table in the item detail modal (bilingual EN/AR). Both read-only.
- **Verification** - tsc 0, eslint 0, **199/199 unit tests** (was 198), `next build`
  registers both new routes. Reads are session-gated (any signed-in staff).

#### Sprint 8 - Enterprise Inventory: Purchase Orders + Goods Receiving

Approved feature sprint (inventory backlog #1). Adds supplier purchase orders and
goods receiving on top of the Sprint 7 stock foundation. Fully additive: two new
tables, zero `ALTER` on existing tables, no change to any existing financial number,
workflow, API response, or screen. Receiving reuses the exact audited stock-receipt
path from Sprint 7, so a PO receipt and a manual receipt create identical batches
and ledger movements.

- **Purchase-order schema (additive migration)** - `20260709000007_purchase_orders`
  adds `PurchaseOrder` (code `PO-YYYY-NNNN` unique, status, currency, supplier link,
  expected/ordered/received dates, notes, `deletedAt`/`deletedBy`) and
  `PurchaseOrderLine` (item link, English/Arabic name snapshots, `orderedQty` and
  `receivedQty` `Decimal(12,3)`, `unitCost` `Decimal(12,2)`). Lines cascade with
  their PO; item/supplier links `SetNull` so history survives a later delete. No
  column added to any existing table (`Supplier.purchaseOrders` /
  `InventoryItem.poLines` are Prisma-level back-relations only).
- **Pure PO math** - `src/lib/server/purchase-orders.ts` owns the lifecycle guards
  (`draft -> submitted -> partially_received -> received`, plus `cancelled`) and the
  ordered/received/remaining value roll-ups. Mirrored by
  `tests/unit/purchase-orders.test.mjs` (16 cases).
- **Shared receive path** - `postReceipt(tx, ...)` was extracted from `receiveStock`
  in `inventory-ops.ts` so manual receiving and PO receiving post the batch +
  `receipt` movement through one atomic helper. Manual-receive behavior is
  byte-identical; PO receipts are tagged `referenceType: "PurchaseOrder"` +
  the PO id for traceability.
- **PO service** - `src/lib/server/purchase-orders-ops.ts`: create (optional lines,
  each item name snapshotted), header/line edit (lines locked once submitted),
  submit, cancel (never reverses received stock), and receive. Receiving validates
  every line up front (belongs to the PO, item exists, quantity > 0, and no line -
  even across repeats in one payload - exceeds what was ordered -> `over_receipt`,
  400), then in ONE `$transaction` posts each receipt, advances each line's
  `receivedQty`, and recomputes the header status. One audit row per action.
- **PO API (new, additive)** - `/api/admin/inventory/purchase-orders` (GET list with
  `status`/`supplierId`/`search`; POST create), `.../[id]` (GET/PATCH/DELETE - DELETE
  soft-deletes the order document only, never received stock), and the action routes
  `.../[id]/submit`, `.../[id]/cancel`, `.../[id]/receive`. Reads require a session;
  writes require owner roles; all inputs Zod-validated and audited.
- **Recycle Bin coverage** - purchase orders are soft-deletable and appear in
  `/dashboard/recycle-bin` (restore + admin-only permanent delete). Trashing a PO
  never touches batches, movements, or on-hand.
- **Purchase Orders dashboard UI** - a new "Purchase Orders" tab in
  `/dashboard/inventory`: list (code, supplier, status, received/total lines,
  ordered value; PO-code search + status filter), a create modal (supplier + line
  picker with per-line quantity/cost and an estimated total), and a detail modal
  with lifecycle actions (submit / cancel / delete) and a goods-receiving modal
  (per-line quantity, lot number, expiry, unit cost). Bilingual (en/ar), reuses the
  shared Modal/Field primitives; write actions hidden for non-owner roles (server
  still enforces).

#### Sprint 7 - Enterprise Inventory (foundation)

Approved feature sprint (priority #1 of the enterprise roadmap). Adds a complete
stock-control module for clinic consumables. Fully additive: four new tables, zero
`ALTER` on existing tables, no change to any existing financial number, workflow,
API response, or screen. On-hand is always **derived** from batch quantities and
never stored, so it cannot drift.

- **Inventory schema (additive migration)** - `20260709000006_inventory_core` adds
  `Supplier`, `InventoryItem`, `InventoryBatch`, and `StockMovement`. Quantities are
  `Decimal(12,3)`, money `Decimal(12,2)` EGP. Item children cascade on force-purge
  (`InventoryBatch.itemId` / `StockMovement.itemId` -> `Cascade`); supplier links
  `SetNull` so movement history survives a supplier delete. `deletedAt`/`deletedBy`
  on `Supplier` and `InventoryItem` for Recycle Bin support.
- **Pure stock math** - `src/lib/server/inventory.ts` computes on-hand, valuation,
  FEFO (first-expiry-first-out) allocation, and low-stock/expiry classification.
  Mirrored by `tests/unit/inventory.test.mjs` (15 cases).
- **Transactional service** - `src/lib/server/inventory-ops.ts` writes exactly one
  append-only `StockMovement` and adjusts the affected batch's `remainingQty` in a
  single `$transaction`. Decrements are conditional (`remainingQty >= qty`), so
  concurrent draws can never oversell (rolls back to `insufficient_stock`, 409).
  Supports receive, consume, waste, return, and signed batch adjustment.
- **Inventory API (new, additive)** - nine endpoints under
  `/api/admin/inventory/**`: suppliers CRUD, items CRUD (with derived on-hand and
  valuation), `.../items/[id]/receive`, `.../items/[id]/adjust`, paginated
  `.../movements` ledger, `.../report` (KPIs + low-stock/expiry lists), and
  `.../lookup` (barcode/SKU). Reads require a session; writes require owner roles;
  every write is validated with Zod and audited.
- **Recycle Bin coverage** - suppliers and inventory items are now soft-deletable and
  appear in `/dashboard/recycle-bin` with restore and admin-only permanent delete
  (purge blocks items still holding stock/history unless forced).
- **Inventory dashboard UI (new route)** - `/dashboard/inventory` with Overview
  (KPIs, low-stock, expiring, expired), Items (search + low/archived filters;
  receive, adjust, edit, delete, batch/movement detail), Suppliers, and a Movements
  ledger. Bilingual (en/ar), reuses the shared Modal/Field primitives, standalone
  route so no existing dashboard component changed. Write actions are hidden for
  non-owner roles (server still enforces).

#### Sprint 6 - Data safety: soft-delete, Recycle Bin, Postgres backups

Approved feature sprint. Deletes of sensitive records are now recoverable, and
production database backups are automated. No financial number, workflow, or API
response shape changed; soft-deleted rows are hidden from every existing read so
all totals and lists behave exactly as before.

- **Soft-delete columns (additive migration)** - `20260709000005_soft_delete`
  adds nullable `deletedAt DateTime?` / `deletedBy String?` to the nine sensitive
  models (Patient, TreatmentRecord, TreatmentDoctor, Payment, Doctor,
  DoctorPayout, ClinicExpense, PatientFile, Procedure). ADD COLUMN only -
  reversible and non-destructive; existing rows read as live (`deletedAt = null`).
- **Automatic hide via Prisma client extension** - `src/lib/server/soft-delete.ts`
  injects `deletedAt: null` into top-level `findFirst/findMany/count/aggregate/
  groupBy` for soft-deletable models, so trashed rows disappear from normal reads
  and roll-ups without touching any call site. Callers opt out explicitly
  (`deletedAt: { not: null }`) for Trash views. Pure transform is unit-tested.
- **Nested include filters** - analytics, earnings, treatments, revenue, doctor
  earnings, and the Excel export now filter soft-deletable relations
  (`where: { deletedAt: null }`) so included children match the top-level scoping.
- **DELETE routes cascade-soft-delete with audit** - the eight delete endpoints
  now stamp `deletedAt`/`deletedBy` inside a `$transaction` that soft-deletes the
  exact children today's `onDelete: Cascade` removed (treatment -> TreatmentDoctor;
  doctor -> TreatmentDoctor + DoctorPayout; patient -> TreatmentRecord + Payment),
  keeping every financial roll-up identical. Each delete is written to `AuditLog`.
- **Trash API (new, additive)** - `GET /api/admin/trash` (list by type with
  counts, owner roles), `POST /api/admin/trash/restore` (owner roles; revives the
  record and its co-trashed children), `POST /api/admin/trash/purge` (Super Admin
  only; blocks permanent delete of records still referenced by financial/medical
  history unless `force: true`, and removes stored files on purge). All audited.
- **Recycle Bin admin UI (new route)** - `/dashboard/recycle-bin` lists trashed
  records by type, restores for owner roles, and offers admin-only permanent
  delete with a 409 -> force-confirm flow. Bilingual (en/ar), standalone route so
  no existing dashboard component changed.
- **Automated PostgreSQL backups (OPS-01)** - `npm run db:pg-backup` runs a
  `pg_dump -Fc` custom-format dump (includes soft-deleted rows), writes a manifest
  sidecar, prunes to a retention count, and redacts credentials in logs. Pure core
  (`scripts/lib/pg-backup-core.mjs`) is unit-tested (13 cases); `docs/RUNBOOK.md`
  section 5 documents scheduling, offsite copy, and a verified restore drill. The
  existing SQLite `backup.mjs` remains for the desktop build.


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
- **Regression tests for WhatsApp message templating** - added
  `tests/unit/messages.test.mjs` (7 cases) mirroring `aheadPhrase` (the
  patient-facing "N patients ahead" queue wording, EN + Arabic singular/plural,
  negative-count clamping) and `trackUrl` (localhost fallback, configured
  `APP_URL`, trailing-slash stripping). Guards the exact text patients receive.
  Test-only; no source change. Unit suite 120 -> 127.

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
