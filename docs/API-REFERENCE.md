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

## Conventions

**API version.** Instrumented routes return `x-api-version: 1`. This is the API
*contract* version — bumped only on a breaking change to request/response shapes.
Additive changes (new optional fields, new endpoints, new headers) keep the same
version, so clients must ignore unknown fields and headers. The build/release
version is reported separately by `/api/health` (`version`/`commit`).

**Request correlation.** Instrumented routes return `x-request-id` (a UUID). The
same id appears in the server's structured `api_request` log line and in the
`{ "error": "internal_error", "requestId": "…" }` body of a `500`, so a client
error can be traced to its server log.

**Error envelope.** Errors are `{ "error": "<machine_code>" }`, optionally with a
human `message` and structured `details`. `error` is a stable code for client
branching; validation failures return `422 { "error":"validation_error", "details":[…] }`.

**Pagination (opt-in).** List endpoints accept `?limit=` and `?offset=`. When
neither is present the response is unchanged (full list, backward compatible).
When applied, the body shape is identical and page metadata is returned in
headers: `X-Total-Count`, `X-Limit`, `X-Offset`, `X-Has-More`, `X-Next-Offset`.

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

## Admin — Inventory (auth required)

Enterprise stock control for clinic consumables. **Reads** require a session;
**writes** require owner roles (`admin`/`doctor`) and are Zod-validated and audited.
On-hand and valuation are always **derived** from live batch quantities (never stored).
Quantities are decimals with up to 3 places; money is EGP with 2 places.

### GET `/api/admin/inventory/suppliers`
List suppliers. `200` → `{ suppliers:[ … ] }`. Supports `?limit=&offset=` with an
`X-Total-Count` header.

### POST `/api/admin/inventory/suppliers`
Create a supplier (owner roles). Body: `{ nameEn?, nameAr?, contactName?, phone?,
email?, address?, taxId?, paymentTerms?, notes?, active? }` (at least one name).
`201` → `{ supplier }` · `422` validation error.

### PATCH `/api/admin/inventory/suppliers/[id]`
Update a supplier (owner roles). `200` → `{ supplier }` · `404` not found.

### DELETE `/api/admin/inventory/suppliers/[id]`
Soft-delete a supplier (owner roles). `200` → `{ ok:true }`. Restorable from Trash
(`type=supplier`). Existing batches keep their history (supplier link set to null).

### GET `/api/admin/inventory/items`
List items with derived `onHand`, `valuation`, and `lowStock`. Filters:
`?search=<name|sku|barcode>`, `?low=1` (at/below reorder level), `?inactive=1`
(include archived). `200` → `{ items:[ … ] }`.

### POST `/api/admin/inventory/items`
Create an item (owner roles). Body: `{ nameEn?, nameAr?, sku?, barcode?, category?,
unit, reorderLevel?, reorderQty?, notes?, active? }`. `sku` must be unique across all
rows (including trashed). `201` → `{ item }` · `409 {"error":"sku_taken"}` · `422`.

### GET `/api/admin/inventory/items/[id]`
Item detail: `{ item, batches:[ … ], movements:[ … ] }` (recent ledger).
`404` not found.

### PATCH `/api/admin/inventory/items/[id]`
Update an item (owner roles). `sku` uniqueness re-checked (excluding self).
`200` → `{ item }` · `409 sku_taken` · `404`.

### DELETE `/api/admin/inventory/items/[id]`
Soft-delete an item (owner roles). `200` → `{ ok:true }`. Restorable from Trash
(`type=item`). Its stock stops counting toward valuation/expiry while trashed.

### POST `/api/admin/inventory/items/[id]/receive`
Receive stock into a new batch (owner roles). Body: `{ quantity, unitCost,
supplierId?, lotNumber?, expiryDate?, notes? }`. Writes a `receipt` movement and
creates the batch. `201` → `{ batch }` · `422`.

### POST `/api/admin/inventory/items/[id]/adjust`
Adjust stock (owner roles). Body branches on `type`:
- `consumption` | `wastage` | `return`: `{ type, quantity, batchId?, reason? }` —
  decreases stock (FEFO across batches if `batchId` omitted). `409
  {"error":"insufficient_stock"}` if not enough on hand.
- `adjustment`: `{ type:"adjustment", batchId, delta, reason }` — signed correction
  of one batch's remaining quantity (`reason` required).

`200` → `{ movements }` (or `{ movement }`) · `422` · `409`.

### GET `/api/admin/inventory/items/[id]/purchase-history`
Supplier price history for one item: recent receipts, newest first. `?limit=`
(default 20, max 100). `200` → `{ item:{ id, nameEn, nameAr, unit },
purchaseHistory:[ { batchId, lotNumber, unitCost, receivedQty, receivedAt,
supplier:{ id, nameEn, nameAr }|null } ] }` · `404`.

### GET `/api/admin/inventory/movements`
Paginated stock ledger, newest first. Filters `?itemId=&type=` (`limit` default 50,
100 for the UI). `200` → `{ movements:[ { id, itemId, type, quantityDelta, unitCost,
totalCost, reason, actorName, createdAt, item:{ nameEn, nameAr, unit } } ] }`.

### GET `/api/admin/inventory/report`
KPIs + working lists. `?days=<n>` sets the expiry window (default 30). `200` →
`{ totalItems, totalValuation, lowStockCount, expiringCount, expiredCount,
lowStock:[…], expiring:[…], expired:[…] }`.

### GET `/api/admin/inventory/reorder`
Reorder suggestions: active items at/below their reorder level, each netted
against stock already on open POs. `200` → `{ count, items:[ { id, nameEn, nameAr,
unit, onHand, onOrder, reorderLevel, reorderQty, suggestedQty, lastUnitCost,
lastPurchaseAt, lastSupplier:{ id, nameEn, nameAr }|null } ] }`. `suggestedQty` is
`0` when an open PO already covers the level (don't double-order). Read-only.

### GET `/api/admin/inventory/lookup?code=|barcode=|sku=`
Resolve an item by barcode or SKU (for scanners). `200` → `{ item }` · `404`.

### GET `/api/admin/inventory/purchase-orders`
List purchase orders, newest first. Filters `?status=&supplierId=&search=` (search
matches the PO code). Opt-in pagination (`?limit=` default 100, max 200; `?offset=`).
`200` → `{ purchaseOrders:[ { id, code, status, supplierId, supplierName, currency,
expectedAt, orderedAt, receivedAt, notes, lines:[ { id, itemId, descriptionEn,
descriptionAr, orderedQty, receivedQty, unitCost, sortOrder } ], lineCount,
receivedLineCount, orderedValue, receivedValue, remainingValue } ] }`.

### POST `/api/admin/inventory/purchase-orders`
Create a draft (owner roles). Body `{ supplierId?, branchId?, currency?, notes?,
expectedAt?, lines?:[ { itemId, orderedQty>0, unitCost? } ] }`; each line's item name
is snapshotted. `200` → `{ purchaseOrder }` · `404` (unknown supplier/item) · `422`.

### GET `/api/admin/inventory/purchase-orders/[id]`
Full detail. `200` → `{ purchaseOrder }` · `404`.

### PATCH `/api/admin/inventory/purchase-orders/[id]`
Edit header (draft or submitted) and/or replace lines (draft only) — owner roles.
Omitted fields are unchanged. `200` → `{ purchaseOrder }` · `409` (`po_not_editable`
/ `po_lines_locked`) · `404` · `422`.

### DELETE `/api/admin/inventory/purchase-orders/[id]`
Soft-delete the order document (owner roles) → Recycle Bin. Received stock, batches,
and movements are untouched. `200` → `{ ok: true }` · `404`.

### POST `/api/admin/inventory/purchase-orders/[id]/submit`
Draft → submitted (owner roles); requires ≥ 1 line; stamps `orderedAt`. `200` →
`{ purchaseOrder }` · `409` (`po_not_submittable` / `po_empty`) · `404`.

### POST `/api/admin/inventory/purchase-orders/[id]/cancel`
Cancel a draft / submitted / partially-received PO (owner roles). Never reverses
already-received stock. `200` → `{ purchaseOrder }` · `409` (`po_not_cancellable`) · `404`.

### POST `/api/admin/inventory/purchase-orders/[id]/receive`
Receive goods against a submitted / partially-received PO (owner roles). Body
`{ receipts:[ { lineId, quantity>0, lotNumber?, expiryDate?, unitCost? } ] }`. Each
receipt creates an inventory batch + `receipt` movement (tagged
`referenceType:"PurchaseOrder"`) atomically, advances the line's `receivedQty`, and
recomputes the header status. `200` → `{ purchaseOrder }` · `400` (`over_receipt`) ·
`409` (`po_not_receivable`) · `404` · `422`.

The inventory operator UI for these endpoints is at `/dashboard/inventory`
(Purchase Orders tab included).

---

## Admin - Recycle Bin / Trash (auth required)

Deletes of sensitive records (patients, treatments, payments, doctors, payouts,
clinic expenses, patient files, procedures, suppliers, inventory items, purchase
orders) are **soft deletes**: the row is stamped `deletedAt`/`deletedBy` and hidden
from every normal read, instead of being physically removed. The DELETE endpoints above are unchanged from a client's
perspective (still `200 { ok:true }`); the record simply becomes restorable from
the Trash. The endpoints below manage those trashed rows.

### GET `/api/admin/trash`
List trashed records. Owner roles (`requireRole(OWNER_ROLES)`).
- No query: overview -> `{ total, types:[ { type, label, count } ] }`
- `?type=<type>&limit=&offset=`: items of one type ->
  `{ type, items:[ { id, label, detail, deletedAt, deletedBy } ] }`
- `type` is one of `patient|doctor|treatment|payment|procedure|file|payout|expense|supplier|item|purchase_order`
- `400 {"error":"bad_type"}` for an unknown type

### POST `/api/admin/trash/restore`
Restore a trashed record and its co-trashed children. Owner roles.
- Body: `{ "type": <type>, "id": string }`
- `200` → `{ ok:true }` · `404 {"error":"not_found"}` when the id is not trashed
- `422 {"error":"validation_error"}` on a missing/invalid body

### POST `/api/admin/trash/purge`
Permanently delete a trashed record (Super Admin / `admin` role only). Removes any
stored file bytes and lets the database cascade run.
- Body: `{ "type": <type>, "id": string, "force"?: boolean }`
- `200` → `{ ok:true }`
- `409 {"error":"purge_blocked","details":{ references }}` when the record is still
  referenced by financial/medical history; retry with `"force": true` to override
- `403` for non-admin roles · `404` when the id is not trashed

The Recycle Bin operator UI for these endpoints is at `/dashboard/recycle-bin`.

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
Readiness probe — pings the database. `200` → `{ status:"ok", db:"up", uptimeSec, latencyMs, version, commit, env, time }` · `503 { status:"error", db:"down", error, … }` when the DB is unreachable. `version`/`commit`/`env` are additive build metadata.

### HEAD `/api/health`
Liveness probe — confirms the process is serving without touching the database. Always `200` with an empty body. Suitable for aggressive orchestrator polling.

---

## Metrics

### GET `/api/admin/metrics`
Owner-only (`requireRole(OWNER_ROLES)`) in-process request metrics. Read-only; exposes no patient or financial data.
- `200` → `{ since, uptimeSec, totals:{ requests, byClass:{ "2xx","3xx","4xx","5xx" }, errors }, routes:[ { key, method, route, count, errors, p50, p95, p99, maxMs } ] }`
- `401` when not signed in · `403` for non-owner roles

Latency figures are milliseconds over a bounded, in-memory sample window and reset on restart. For durable dashboards, scrape this endpoint or forward the structured `api_request` logs.

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
