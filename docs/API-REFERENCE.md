# BDIC — API Reference

Base URL (dev): `http://localhost:3000`

**Auth model**
- **Session routes** set/clear an HTTP-only JWT cookie.
- **Admin routes** (`/api/admin/*`) require a valid session — they call `requireSession()`
  and return `401 {"error":"unauthorized"}` when not signed in.
- **Public routes** (`/api/bookings`, `/api/track/[code]`) need no auth.
- `/api/admin/tick` additionally accepts a cron secret header instead of a session.

All request/response bodies are JSON unless noted (patient-file upload is `multipart/form-data`).

---

## Auth

### POST `/api/auth/login`
Sign in a clinic user.

- Body: `{ "email": string, "password": string }`
- `200` → `{ ok:true, user:{ email, name, role } }` + `Set-Cookie` session
- `400 {"error":"missing"}` · `401 {"error":"invalid_credentials"}`

### GET `/api/auth/me`
Return the current signed-in user.
- `200` → `{ user:{ sub, email, name, role } }` · `401` when no/invalid cookie

### POST `/api/auth/logout`
Clear the session cookie. `200` → `{ ok:true }`

---

## Public booking & tracking

### POST `/api/bookings`
Create a booking request from the landing page (status starts `pending`).

- Body:
  ```json
  {
    "name": "string",
    "phone": "string",
    "serviceId": "string",
    "serviceLabelEn": "string",
    "serviceLabelAr": "string",
    "scheduledAt": "ISO-8601 datetime",
    "durationMin": 30,
    "complaint": "string?",
    "offerTitle": "string?",
    "lang": "ar | en"
  }
  ```
- Required: `name`, `phone`, `serviceId`, `scheduledAt`.
- `200` → `{ ok:true, code:"ABC123", id:"…" }` (`code` drives the public tracker)
- `400 {"error":"missing_fields"|"bad_date"|"bad_json"}`

### GET `/api/track/[code]`
Public live status for a booking (polled by the tracker every 5s).

- Optional query `?preview=<stage>` forces a stage for demos
  (`reserved|reminder|queue|turn|completed|declined|cancelled`).
- `200` → `{ code, patientName, serviceLabel:{en,ar}, scheduledAt, status, stage,
  minutesUntil, ahead, reminderLeadMin, queueLeadMin, now }`
- `404 {"error":"not_found"}`

---

## Admin — appointments (auth required)

### GET `/api/admin/appointments`
List up to 100 recent appointments with their message log + computed stage.

- Optional query `?status=pending|confirmed|declined|completed|cancelled`
- `200` → `{ appointments: [ { …appointment, messages:[…], stage, minutesUntil } ] }`

### GET `/api/admin/appointments/[code]`
Read one appointment (with messages). `200` → `{ appointment }` · `404` not found.

### PATCH `/api/admin/appointments/[code]`
Confirm / decline / complete a booking.

- Body: `{ "action": "confirm" | "decline" | "complete" }`
- `confirm` → status `confirmed`, fires the **"reserved" WhatsApp** + starts the lifecycle
- `decline` → status `declined`
- `complete` → status `completed`, sets `completedAt`
- `200` → `{ ok:true, appointment }` · `400 {"error":"bad_action"}` · `404` not found

### POST `/api/admin/demo`
Demo helper — create a **confirmed** appointment N minutes out so the queue/tracker can be shown instantly.
- Body: `{ "minutes": 50, "name"?, "phone"?, "lang"?: "ar|en" }`
- `200` → `{ ok:true, code, minutes }`

### POST `/api/admin/tick`
Run one scheduler tick manually (or via external cron).
- Auth: a valid session **or** header `x-cron-secret: $CRON_SECRET`
- `200` → `{ ok:true, …result }` · `401` unauthorized

---

## Admin — patient files (auth required)

### GET `/api/admin/patient-files?patientKey=<key>`
List a patient's files (metadata only).
- `200` → `{ files:[ { id, category, title, fileName, mimeType, size, createdAt } ] }`
- `400 {"error":"missing_patientKey"}`

### POST `/api/admin/patient-files`
Upload a file. **`multipart/form-data`**.
- Fields: `file` (binary, required), `patientKey` (required), `category`
  (`xray|photo|document|medical`, default `xray`), `title?`, `patientName?`
- Limits: size ≤ `MAX_FILE_BYTES`; MIME must be in `ALLOWED_MIME`
- `200` → `{ ok:true, file:{ … } }`
- `400 missing_patientKey|missing_file|empty_file|bad_form` · `413 too_large` · `415 bad_type`

### GET `/api/admin/patient-files/[id]/raw`
Stream the stored binary (auth-guarded). `200` (file bytes) · `404` not found.

### DELETE `/api/admin/patient-files/[id]`
Delete the file (disk + DB row). `200` → `{ ok:true }` · `404` not found.

---

## WhatsApp booking agent

### GET `/api/whatsapp/webhook`
Meta verification handshake. Echoes `hub.challenge` when `hub.verify_token` matches
`WHATSAPP_VERIFY_TOKEN`. `200` (challenge) · `403` on mismatch.

### POST `/api/whatsapp/webhook`
Inbound WhatsApp messages from Meta. Verifies `X-Hub-Signature-256` (when
`WHATSAPP_APP_SECRET` is set), extracts text messages, drives the booking agent, and replies.
`200` → `{ received:true }` · `401` bad signature. Full flow: `docs/WHATSAPP-AGENT.md`.

### POST `/api/whatsapp/simulate`
Local testing of the agent without Meta. **Only enabled when `WHATSAPP_PROVIDER=mock`** (else `404`).
- Body: `{ "phone": string, "text": string }`
- `200` → `{ replies: string[], bookingCode?: string }`

---

## Health

### GET `/api/health`
Liveness/readiness probe (DB connectivity + uptime). `200` → `{ status:"ok", db:"up", uptimeSec, latencyMs }` · `503` when the DB is unreachable.

---

## Status code conventions

| Code | Meaning |
|---|---|
| 200 | success |
| 400 | bad/missing input |
| 401 | not authenticated |
| 404 | resource not found |
| 413 | upload too large |
| 415 | unsupported file type |

> Error bodies are always `{ "error": "<machine_code>" }` so the frontend can branch on a stable string.
