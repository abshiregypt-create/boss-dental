/** Next.js startup hook — validates critical config, then boots the scheduler. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
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
