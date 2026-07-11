# BDIC — Architecture

**Project:** Badawi Dental Implant Center (BDIC) — bilingual (Arabic RTL / English LTR) clinic website + doctor dashboard.
**Status:** Dashboard 1 of 4 (reception landing page) + doctor operations dashboard + booking/WhatsApp automation backend.

---

## 1. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | React 19, server components + route handlers |
| Language | **TypeScript 5** | strict typing across app + server libs |
| Styling | **Tailwind CSS v4** | RTL/LTR aware, glassmorphism, custom theme tokens |
| ORM / DB | **Prisma 6** → **SQLite** (dev) / **PostgreSQL** (prod) | swap `provider` + `DATABASE_URL`, then migrate |
| Auth | **jose** (JWT) + **bcryptjs** | signed HTTP-only session cookie |
| Scheduler | **node-cron** | in-process, every minute, booted from `instrumentation.ts` |
| Messaging | WhatsApp via **Meta Cloud API** (or `mock` / `wa.me`) | provider switch in `.env` |
| Process mgr | **PM2** / `start-bdic.cmd` (local) | production = `next start` |

---

## 2. Folder map

```
dental-site/
├─ prisma/
│  ├─ schema.prisma          # 6 models (User, Patient, Appointment, Message, Setting, PatientFile)
│  ├─ migrations/            # ordered, versioned SQL migrations
│  └─ seed.mjs               # creates the doctor login + demo data
├─ src/
│  ├─ app/
│  │  ├─ page.tsx            # landing page (composes all sections)
│  │  ├─ layout.tsx          # fonts (self-hosted), providers, metadata
│  │  ├─ login/              # /login
│  │  ├─ dashboard/          # /dashboard (guarded by proxy.ts)
│  │  ├─ track/[code]/       # /track/<code> public live tracker
│  │  └─ api/                # 11 route handlers (see API-REFERENCE.md)
│  ├─ components/            # landing + dashboard React components
│  ├─ lib/
│  │  ├─ language.tsx        # i18n context (AR/EN, RTL/LTR, localStorage)
│  │  ├─ content.ts          # marketing copy/data
│  │  ├─ patients.ts         # seed patients (dashboard clients)
│  │  └─ server/             # backend-only logic (auth, appointments, whatsapp, storage…)
│  └─ proxy.ts               # route guard for /dashboard
├─ instrumentation.ts        # boots the scheduler in the Node runtime
├─ ecosystem.config.js       # PM2 production config
└─ docs/                     # this documentation bundle
```

> **Naming note:** `src/proxy.ts` is the Next.js request middleware (guards `/dashboard`).

---

## 3. Request flows

### 3.1 Public booking → confirmation → live queue (the core feature)

```
Patient (landing page)
   │  POST /api/bookings  {name, phone, serviceId, scheduledAt, lang}
   ▼
Appointment (status: pending)  ──►  tracking link /track/<code>
   │
Doctor (dashboard) ── PATCH /api/admin/appointments/<code> {action:"confirm"}
   │                         │
   │                         ├─ status → confirmed
   │                         └─ WhatsApp "reserved" sent immediately
   ▼
Scheduler (every minute) recomputes each confirmed appointment's STAGE:
   reserved ──(≤120 min before)──► reminder  (WhatsApp reminder)
            ──(≤60 min before)───► queue     ("N patients ahead of you")
            ──(time reached)─────► turn      ("It's your turn")
   ▼
Patient tracker (/track/<code>) polls every 5s and shows the live stage.
```

The **stage is computed, not stored** — derived from `scheduledAt` + `status` (see
`stageOf()` in `src/lib/server/appointments.ts`). Thresholds come from
`REMINDER_LEAD_MIN` (default 120) and `QUEUE_LEAD_MIN` (default 60).

### 3.2 Authentication

```
POST /api/auth/login {email,password}
   → bcrypt.compare → sign JWT (jose) → Set-Cookie (HTTP-only session)
GET  /api/auth/me     → returns current user from the cookie
POST /api/auth/logout → clears the cookie
/dashboard            → src/proxy.ts verifies the cookie or redirects to /login
/api/admin/*          → requireSession() returns 401 if not signed in
```

### 3.3 Patient files (x-rays / photos / documents)

```
POST /api/admin/patient-files (multipart: file, patientKey, category, title)
   → validate MIME + size → write binary to UPLOADS_DIR (off the DB)
   → store metadata row in PatientFile
GET  /api/admin/patient-files?patientKey=… → list metadata
GET  /api/admin/patient-files/<id>/raw     → stream the binary (auth-guarded)
DELETE /api/admin/patient-files/<id>       → remove file + row
```

Binaries live on disk under `UPLOADS_DIR` (default `./private-uploads`, git-ignored);
only metadata is in the database.

---

## 4. The WhatsApp scheduler

- Booted once from `instrumentation.ts` → `startScheduler()` (`src/lib/scheduler.ts`).
- Runs `processTick()` every minute, wrapped in try/catch (a tick failure never crashes the process).
- **Idempotent:** each message kind (`reserved`/`reminder`/`queue`/`turn`) is recorded in the
  `Message` table and only sent once per appointment.
- Can also be driven externally: `POST /api/admin/tick` with header `x-cron-secret: $CRON_SECRET`
  (useful if you prefer an OS-level cron over the in-process one; set `SCHEDULER_ENABLED=0`).

---

## 5. Internationalisation

- `src/lib/language.tsx` provides `useLang()` → `{ tr, lang }`. Every string is `{ en, ar }`.
- Language is stored in `localStorage.lang`; `<html dir>` flips `rtl`/`ltr` automatically.
- Fonts are **self-hosted** by Next.js at build time (Cairo for Arabic, Plus Jakarta Sans for Latin) —
  the site renders fully **offline** (no Google Fonts / CDN calls at runtime).

---

## 6. Environments

| | Dev | Production (target) |
|---|---|---|
| DB | SQLite `prisma/dev.db` | PostgreSQL on the VPS |
| Run | `npm run dev` | `next start` under PM2 |
| WhatsApp | `mock` | `metaCloud` |
| Secrets | `.env` (git-ignored) | server env / secrets manager |

See **RUNBOOK.md** for deploy + backup procedures and **DATA-MODEL.md** for the schema.

## 7. Observability & operational endpoints

Cross-cutting operational concerns live in `src/lib/server/`:

- **Config validation** — `env.ts` `checkEnv()` inspects the environment at boot;
  `instrumentation.ts` logs every error/warning through the structured logger
  before the scheduler starts. Typed accessors (`intEnv`, `boolEnv`, …) standardise
  reads.
- **Structured logging** — `logger.ts` emits JSON-Lines with credential redaction.
  `http.ts` `withRoute()` wraps handlers to log one `api_request` line per request
  (method, route, status, duration, `x-request-id`, best-effort user id) and to
  convert uncaught errors into a safe 500.
- **Metrics** — `metrics.ts` aggregates request counts by status class and per-route
  latency quantiles in memory (bounded); surfaced at owner-only
  `GET /api/admin/metrics`.
- **Health** — `GET /api/health` is a DB-backed readiness probe with build metadata;
  `HEAD /api/health` is a DB-free liveness probe for orchestrators.
- **API contract** — every instrumented response carries `x-api-version`; see
  **API-REFERENCE.md** for the versioning and pagination conventions.

Excluded from `withRoute` by design: health probes, the Meta webhook/simulate, and
high-frequency WhatsApp worker-polling routes (to avoid log/metric flooding).

---

## 8. Data safety: soft-delete, Recycle Bin, backups

Deletes of sensitive records are recoverable rather than physical, and production
databases are backed up on a schedule.

- **Soft-delete columns** — eleven sensitive models (Patient, TreatmentRecord,
  TreatmentDoctor, Payment, Doctor, DoctorPayout, ClinicExpense, PatientFile,
  Procedure, Supplier, InventoryItem) carry nullable `deletedAt`/`deletedBy`. A live
  row has `deletedAt = null`.
- **Automatic hiding** — a Prisma client extension (`soft-delete.ts`, wired in
  `db.ts`) injects `deletedAt: null` into top-level `findFirst/findMany/count/
  aggregate/groupBy` for those models, so trashed rows vanish from normal reads and
  every roll-up without touching call sites. Trash views opt out with
  `deletedAt: { not: null }`. Nested includes on soft-deletable relations filter
  explicitly. Pure helpers are unit-tested (the extension can't be exercised without
  a live client, so end-to-end scoping is verified on CI Postgres).
- **Cascade on delete** — DELETE routes stamp `deletedAt`/`deletedBy` in a
  `$transaction` that soft-deletes exactly the children the DB `onDelete: Cascade`
  would have removed, so financial totals stay identical. Every delete/restore/purge
  writes an `AuditLog` entry. Write-side cascade + restore + purge logic lives in
  `soft-delete-ops.ts`; the Trash read registry is `trash.ts`.
- **Recycle Bin** — `GET/POST /api/admin/trash*` expose list/restore/purge (see
  API-REFERENCE.md); `/dashboard/recycle-bin` is the operator UI (standalone route,
  middleware-protected). Restore revives co-trashed children; purge is Super Admin
  only and blocks records still referenced by history unless forced.
- **Backups** — `npm run db:pg-backup` (`scripts/pg-backup.mjs`, pure core in
  `scripts/lib/pg-backup-core.mjs`) runs `pg_dump -Fc`, writes a manifest, prunes to
  a retention count, and redacts credentials. Soft-deleted rows are ordinary rows so
  dumps include them. Scheduling, offsite copy, and a restore drill are documented in
  RUNBOOK section 5. The SQLite `backup.mjs` remains for the desktop build.

## 9. Inventory subsystem

Enterprise stock control for clinic consumables (`/dashboard/inventory`,
`/api/admin/inventory/**`). Additive: four tables, no change to existing workflows.

- **Data model** — `Supplier`, `InventoryItem`, `InventoryBatch`, `StockMovement`
  (`20260709000006_inventory_core`). A batch holds a received quantity, a decreasing
  `remainingQty`, unit cost, optional lot/expiry, and an optional supplier link. A
  movement is one append-only ledger row (`receipt|consumption|wastage|adjustment|
  transfer|return`) with a signed `quantityDelta`.
- **Derived on-hand** — an item's on-hand is `Σ InventoryBatch.remainingQty` and its
  valuation is `Σ remainingQty × unitCost`. Nothing is stored on the item, so the
  quantity can never disagree with the ledger. Pure math lives in `inventory.ts`
  (FEFO allocation, low-stock/expiry classification), unit-tested in
  `tests/unit/inventory.test.mjs`.
- **Transactional writes** — `inventory-ops.ts` performs each change in one
  `$transaction`: append a `StockMovement` and adjust the batch(es). Decrements use a
  conditional update (`remainingQty >= qty`) so concurrent draws cannot oversell
  (they roll back to `insufficient_stock`, 409). Receiving picks/creates a batch;
  consumption/wastage/return draw FEFO (earliest expiry first) unless a batch is
  pinned; adjustment applies a signed delta to one batch with a required reason.
- **API & UI** — nine routes (suppliers/items CRUD, receive, adjust, movements,
  report, lookup); reads need a session, writes need owner roles and are audited. The
  dashboard has Overview (KPIs + low-stock/expiry), Items, Suppliers, and a Movements
  ledger, bilingual and built from the shared Modal/Field primitives.
- **Recoverability** — `Supplier` and `InventoryItem` are soft-deletable and flow
  through the same Recycle Bin (§8). Force-purge cascades an item's batches and ledger
  (`onDelete: Cascade`); deleting a supplier keeps history (`SetNull`).

### 9.1 Purchase orders & goods receiving

Supplier ordering on top of the stock foundation (`20260709000007_purchase_orders`,
Purchase Orders tab of `/dashboard/inventory`). Additive: two tables, no `ALTER` on
existing tables.

- **Data model** — `PurchaseOrder` (code `PO-YYYY-NNNN`, status, currency, supplier
  link, expected/ordered/received dates, notes, soft-delete columns) and
  `PurchaseOrderLine` (item link, English/Arabic name snapshots, `orderedQty`,
  `receivedQty`, `unitCost`). Lines cascade with their PO; item/supplier links
  `SetNull` so a later delete keeps order history. `Supplier.purchaseOrders` and
  `InventoryItem.poLines` are Prisma-level back-relations only (no new columns).
- **Lifecycle** — `draft → submitted → partially_received → received`, plus a
  terminal `cancelled`. Lines are editable only while `draft`; the header while
  `draft` or `submitted`. Pure guards + value roll-ups (ordered/received/remaining)
  live in `purchase-orders.ts`, unit-tested in `tests/unit/purchase-orders.test.mjs`.
- **Shared receive path** — receiving reuses the Sprint 7 stock-receipt helper
  `postReceipt(tx, …)` (extracted from `receiveStock`), so a PO receipt and a manual
  receipt create identical batches + `receipt` movements; PO receipts are tagged
  `referenceType:"PurchaseOrder"` + the PO id. `receivePoLines` validates the whole
  payload up front (rejecting over-receipt, even across repeated lines) and then, in
  one `$transaction`, posts every receipt, advances each line's `receivedQty`, and
  recomputes the header status.
- **API & UI** — collection + item routes plus `submit`/`cancel`/`receive` actions;
  reads need a session, writes need owner roles and are audited. The dashboard tab
  lists POs (status/search filters), a create modal (supplier + line picker), and a
  detail modal with lifecycle actions and a goods-receiving modal.
- **Recoverability** — a PO is soft-deletable through the Recycle Bin (§8); trashing
  it never touches received stock, batches, or movements.

### 9.2 Purchasing insights (reorder + supplier price history)

Read-only reporting derived from the data above — no schema change, no writes
(`purchasing-insights.ts`, Overview tab + item detail modal of `/dashboard/inventory`).

- **Reorder suggestions** — `reorderReport()` lists active items at/below their
  reorder level, netting on-hand against quantity still on open POs
  (`submitted`/`partially_received`; trashed POs skipped by the soft-delete read
  extension) and attaching the last purchase (supplier + unit cost + date). The
  suggested buy quantity comes from the pure `suggestedOrderQty(onHand, onOrder,
  reorderLevel, reorderQty)` in `inventory.ts` (unit-tested): it returns `0` when an
  open PO already covers the level, otherwise the configured `reorderQty` batch size,
  or the shortfall back to the level. Served by `GET /api/admin/inventory/reorder`.
- **Supplier price history** — `itemPurchaseHistory(itemId, limit)` returns an item's
  recent receipts (newest first) with supplier, unit cost, quantity and date, for
  spotting price creep. Served by `GET /api/admin/inventory/items/[id]/purchase-history`.
- **Access** — both endpoints are session-gated reads (any signed-in staff); nothing
  here mutates stock or ledger.

### 9.3 Inventory consumption analytics

Read-only roll-up of the `StockMovement` ledger for the Analytics dashboard — no
schema change, no writes (`analytics-inventory.ts`, "Inventory consumption" panel in
`AnalyticsSection.tsx`).

- **Endpoint** — `GET /api/admin/analytics/inventory?range=30d|90d|12m|all` fetches
  `consumption`/`wastage` movements in the window (indexed by `@@index([type,
  createdAt])`), then `summarizeConsumption()` folds them into consumed vs wasted
  totals (value + quantity) plus the top items by value. `range` mirrors the dashboard
  selector via `normalizeRange`/`rangeStart`; `all` drops the `createdAt` bound.
- **Value convention** — `movementValue()` uses a movement's snapshot `totalCost` when
  present, else `|quantityDelta| × unitCost`, always non-negative and rounded. The math
  is pure and unit-tested (`tests/unit/analytics-inventory.test.mjs`).
- **Isolation** — a separate route so `GET /api/admin/analytics` stays byte-identical;
  the UI fetches it independently of the main analytics call, so one failing never
  blanks the other. Session-gated read (any signed-in staff).

## 10. Prescriptions subsystem

Electronic prescriptions (Sprint 11) let doctors issue, print and track patient
medication orders against a reusable catalog. Three additive tables (`Medication`,
`Prescription`, `PrescriptionItem`); no existing table altered.

- **Catalog vs. document** — `Medication` is a reusable bilingual template (default
  dosage/frequency/duration/instructions). A `Prescription` is an issued document with
  a `code` (`RX-YYYY-NNNN`), patient + doctor **snapshots**, `status`
  (`issued`/`cancelled`) and `diagnosis`/`notes`. Each `PrescriptionItem` **snapshots**
  the medication name/strength/form at issue time, so editing or deleting a catalog
  medication never rewrites past prescriptions (mirrors how purchase-order lines snapshot
  item names).
- **Pure core** — `src/lib/server/prescriptions.ts` holds the status guards,
  `clampRefills` (0–12), `clampDurationDays` (1–365), `buildRxCode`, and a safe no-op
  `checkInteractions` stub (a future drug-interaction hook that currently returns none).
  Unit-tested via a mirror in `tests/unit/prescriptions.test.mjs`.
- **Service** — `src/lib/server/prescriptions-ops.ts` (OpResult pattern): medication
  CRUD plus prescription create/list-by-phone/get/cancel/soft-delete. Codes are
  allocated by counting existing rows for the year (across live + trashed, so numbers
  never collide) with a P2002 unique-violation retry. Patients are resolved/created by
  phone via `ensurePatient` (identical to treatments).
- **Endpoints** — `/api/admin/medications` (+`/[id]`) and `/api/admin/prescriptions`
  (+`/[id]`, `/[id]/cancel`). Reads = any signed-in staff (the printable page uses the
  detail read); writes = owner roles, Zod-validated + audited.
- **Soft-delete** — `Medication` and `Prescription` are registered in the soft-delete /
  Recycle Bin infrastructure (`medication`/`prescription` trash types). `PrescriptionItem`
  is a cascade-only child (no `deletedAt`), like `PurchaseOrderLine`. Purging a
  medication still referenced by a prescription line is blocked unless a Super Admin forces it.
- **UI** — a "Prescriptions" section per patient in `PatientOperations.tsx` (via the
  self-contained `PatientPrescriptions.tsx`): list + issue modal (catalog picker with
  inline "save to library", per-line editor, optional doctor, diagnosis/notes). The
  printable document lives at `/dashboard/prescriptions/[id]/print` — a standalone client
  page (root layout only, no dashboard chrome) that renders a clinic-branded sheet and
  auto-opens the browser print dialog. Bilingual EN/AR; writes owner-gated.



