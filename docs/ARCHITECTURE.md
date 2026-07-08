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

