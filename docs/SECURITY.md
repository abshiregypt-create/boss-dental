# Cliniva Security Hardening

This document describes the security controls implemented during the recovery
sprints and the environment configuration they require. It is written for
operators deploying Cliniva and for engineers extending it.

## Required environment configuration

| Variable | Requirement | Enforced by |
| --- | --- | --- |
| `AUTH_SECRET` | Must be set, **>= 32 chars**, and not a known placeholder (`change-me`, `secret`, ...). Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. | `secretKey()` in `src/lib/server/jwt.ts` throws on the first JWT operation; `instrumentation.ts` logs a CRITICAL warning at boot. |
| `WHATSAPP_APP_SECRET` | **Mandatory** when `WHATSAPP_PROVIDER=metaCloud`. Without it the webhook rejects every request (fail-closed). | `src/app/api/whatsapp/webhook/route.ts`; boot warning in `instrumentation.ts`. |
| `WA_SIMULATE_ENABLED` | Leave empty in production. Set to `1` only to expose `/api/whatsapp/simulate` for a non-`mock` provider, and even then it requires an authenticated session. | `src/app/api/whatsapp/simulate/route.ts`. |

## Controls implemented (Sprint 1 — Security & Reliability Hardening)

### 1. Dashboard route middleware (SEC-01)
`src/middleware.ts` (renamed from the dead `src/proxy.ts`, which Next.js never
executed) redirects unauthenticated requests for `/dashboard*` to `/login` and
attaches an `x-session-role` header for downstream handlers.

### 2. AUTH_SECRET strength validation (SEC-07)
Weak, short, or placeholder signing secrets are rejected so a copied
`.env.example` can never sign forgeable tokens in a real deployment.

### 3. WhatsApp webhook fail-closed signature check (SEC-06)
Against Meta's Cloud API the `x-hub-signature-256` HMAC is mandatory. A missing
`WHATSAPP_APP_SECRET` returns `503` instead of silently accepting unsigned
payloads that could inject messages into the booking agent.

### 4. Simulate endpoint gating (SEC-06)
`/api/whatsapp/simulate` stays open for the default `mock` provider (local
testing) but is `404` for live providers unless `WA_SIMULATE_ENABLED=1`, and
then only for authenticated sessions.

### 5. Path-traversal containment (SEC-08)
`resolveStored()` resolves the target with `path.resolve` and verifies it stays
strictly inside the uploads directory, throwing `storage_path_traversal`
otherwise. Applied to reads, writes, and deletes.

### 6. Upload content validation (SEC-11)
Uploads are validated by **magic bytes** (`mimeMatchesContent`) so a disguised
file (e.g. an executable renamed to `.png`) is rejected with `415`, and the
sanitized filename is checked for traversal components.

### 7. Safe file downloads (SEC-11)
The raw file stream sends `X-Content-Type-Options: nosniff`, an RFC 5987
`filename*`, and `Cache-Control: private, no-store`.

### 8. Login rate limiting (SEC-04)
`RateLimiter` (`src/lib/server/rate-limit.ts`) throttles login attempts to
**10 per 15 minutes** per client IP + identifier, returning `429` with
`Retry-After`. Successful logins clear the counter.

> Note: the limiter is in-memory and suited to a single-instance deployment.
> Horizontally scaled hosting should back it with a shared store (Redis) using
> the same `RateLimiter` interface.

### 9. Baseline security headers (SEC-09)
`next.config.ts` emits `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`,
`Referrer-Policy`, `X-DNS-Prefetch-Control`, and `Permissions-Policy` on every
response, plus `Strict-Transport-Security` on hosted HTTPS builds. A full
Content-Security-Policy (needs per-request nonces for Next's inline runtime) is
tracked as a follow-up.

## Testing

Pure security logic is covered by `node --test` unit tests:

- `tests/unit/storage-path.test.mjs` — traversal containment
- `tests/unit/auth-secret.test.mjs` — secret validation
- `tests/unit/magic-byte.test.mjs` — upload signature checks
- `tests/unit/rate-limit.test.mjs` — throttling window/reset

Run: `npm run test:unit`

## Deferred / follow-up (require Product Owner approval — see roadmap)

- **RBAC / role enforcement (SEC-02)** — changes *permissions* behavior.
- **Session revocation via `tokenVersion` (SEC-12)** — schema migration.
- **Content-Security-Policy** — needs nonce integration with the app shell.
- **IDOR scoping (SEC-05)** — changes access behavior on `[id]` routes.
