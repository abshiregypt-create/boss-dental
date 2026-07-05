# Deploy THE BOSS Dental Clinic to Railway (SQLite on a Volume)

This deploys the **landing page + doctor dashboard** for THE BOSS Dental Clinic
(clinic slug `ibrahim`). The WhatsApp booking bot is intentionally **excluded**
(it needs Chromium + a persistent phone session — run it on a VPS later).

Data (the SQLite database + uploaded x-rays/photos) is kept on a **Railway
Volume** mounted at `/data`, so it survives every redeploy.

---

## 0. Prerequisites
- The repo is on GitHub: `moatasemtameromran-crypto/bdic-dental-site`.
  Push your latest commits first: `git push origin main`.
- A Railway account: https://railway.com

---

## 1. Create the project + service
1. Railway → **New Project** → **Deploy from GitHub repo** → pick
   `bdic-dental-site`.
2. Railway detects Nixpacks and starts a first build. It will fail/half-work
   until you add the variables and the volume below — that's expected.

## 2. Add the persistent Volume (do this before the next deploy)
1. Open the service → **Settings → Volumes → New Volume** (or the **+ Volume**
   button on the service canvas).
2. **Mount path:** `/data`  → Create.
   This is where `boss.db` and `uploads/` will live permanently.

## 3. Set the service Variables
Service → **Variables** → **Raw Editor** → paste from `.env.railway.example`
and fill in the real values. The essential ones:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_CLINIC` | `ibrahim` |
| `CLINIC` | `ibrahim` |
| `PORT` | `8080` (must match your domain's target port) |
| `DATABASE_URL` | `file:/data/boss.db` |
| `UPLOADS_DIR` | `/data/uploads` |
| `AUTH_SECRET` | a long random string (see below) |
| `SEED_DOCTOR_EMAIL` | `doctor@theboss.clinic` |
| `SEED_DOCTOR_PASSWORD` | a strong password (change after first login) |
| `SEED_DOCTOR_NAME` | `Dr. Ibrahim Salah` |
| `WHATSAPP_PROVIDER` | `mock` |
| `SCHEDULER_ENABLED` | `0` |

Generate `AUTH_SECRET`:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> `NEXT_PUBLIC_CLINIC` **must** be present before the build — it is compiled
> into the site's branding. Railway applies variables at build + runtime, so
> setting it here is enough; just trigger a fresh deploy after saving.

## 4. Deploy
- Service → **Deploy** (or push a new commit). Railway will:
  1. `npm ci --include=dev --omit=optional` → install (skips Chromium).
  2. `prisma generate` + `next build` → build the site.
  3. On start: `prisma migrate deploy` (creates `/data/boss.db` + tables) →
     `node prisma/seed.mjs` (creates your dashboard login) → `next start`.

## 5. Get your URL + finish config
1. Service → **Settings → Networking → Generate Domain**. You'll get
   `https://<something>.up.railway.app`.
2. Add two more variables with that URL, then redeploy once:
   - `APP_URL=https://<something>.up.railway.app`
   - `NEXT_PUBLIC_SITE_URL=https://<something>.up.railway.app`

## 6. Verify
```
curl https://<something>.up.railway.app/api/health
# {"status":"ok","db":"up",...}
```
- Open the URL → THE BOSS landing page loads.
- Go to `/login` → sign in with `SEED_DOCTOR_EMAIL` / `SEED_DOCTOR_PASSWORD`
  → the doctor dashboard opens. **Change the password after first login.**

---

## Custom domain (optional)
Service → **Settings → Networking → Custom Domain** → add e.g.
`app.theboss.clinic`, then create the shown CNAME at your DNS provider. After it
verifies, update `APP_URL` + `NEXT_PUBLIC_SITE_URL` to the custom domain and
redeploy.

---

## Troubleshooting: "Healthcheck failure"
The build succeeded but Railway can't get a `200` from `/api/health`. Almost
always one of these:

1. **Port mismatch (most common).** Railway routes to a single target port and
   the healthcheck uses it too. The app must listen on that same port. This app
   binds to `$PORT` (start command: `next start -H 0.0.0.0 -p ${PORT:-8080}`).
   Make all three agree:
   - Domain → **target port = 8080** (you set this).
   - Service **Variable `PORT=8080`**.
   - That's it — app, domain, and healthcheck are all 8080.
2. **Volume not mounted / `DATABASE_URL` wrong.** On boot the app runs
   `prisma migrate deploy`, which creates `/data/boss.db`. If there's no Volume
   mounted at `/data`, that path doesn't exist and migrate crashes before the
   server starts. Fix: add the **Volume at `/data`** and set
   `DATABASE_URL=file:/data/boss.db`.
3. **First boot is slow.** migrate + seed + start can take a bit; the healthcheck
   timeout is set to 300s, which is plenty. If it still times out, check the
   Deploy logs for the real error.

Check the **Deploy Logs** tab — the failing line (crash vs. wrong port) tells you
which of the above it is.

---

## Notes & gotchas
- **Single instance only.** A SQLite-on-volume service must not be scaled to
  multiple replicas (they'd each get a separate disk). One replica is perfect
  for a single clinic.
- **Backups.** Download `boss.db` periodically (Railway shell:
  `cp /data/boss.db /data/boss-backup-$(date +%F).db`, or use `npm run db:backup`).
- **The bot / reminders.** `WHATSAPP_PROVIDER=mock` logs messages to the DB and
  the "Confirm on WhatsApp" wa.me links still work for patients. To run the real
  booking bot + scheduled reminders, deploy `worker/` on a machine with Chromium
  (a VPS) pointed at the same database — not Railway.
- **/product page.** The Clinva sales page is still bundled at `/product`. It's
  harmless but public; tell me if you want it blocked on this domain.
