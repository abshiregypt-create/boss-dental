/** Next.js startup hook — validates critical config, then boots the scheduler. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Pin the process timezone to the clinic's zone (Africa/Cairo) unless the
    // host already set TZ. All appointment slot/day math uses Date.setHours/
    // getHours, which read the process timezone; on a UTC host (e.g. Railway)
    // that would drift ~2–3h from the Cairo-formatted labels shown to patients.
    // Node re-runs tzset() on assignment, so setting it here — before the
    // scheduler and any route handler runs — makes all subsequent Date math
    // Cairo-local. Non-destructive: stored UTC instants are unchanged.
    if (!process.env.TZ) {
      process.env.TZ = "Africa/Cairo";
      console.info("[startup] TZ not set; defaulting process timezone to Africa/Cairo");
    }

    // Boot-time configuration validation — surface critical misconfig in logs.
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
      console.error(
        "[startup] CRITICAL: AUTH_SECRET is missing or too short (<32 chars). " +
          "Generate one: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
      );
    }
    if (process.env.WHATSAPP_PROVIDER === "metaCloud" && !process.env.WHATSAPP_APP_SECRET) {
      console.error(
        "[startup] CRITICAL: WHATSAPP_PROVIDER=metaCloud but WHATSAPP_APP_SECRET is not set. " +
          "The webhook will reject all requests until it is configured.",
      );
    }
    const { startScheduler } = await import("./src/lib/scheduler");
    startScheduler();
  }
}
