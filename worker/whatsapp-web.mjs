#!/usr/bin/env node
/**
 * BDIC WhatsApp Web worker — FREE, unofficial WhatsApp bot on your OWN number.
 *
 * Uses whatsapp-web.js (a WhatsApp Web automation library) so there is NO Meta
 * account, NO per-message cost, and you keep using your normal WhatsApp. You scan
 * a QR code ONCE (like linking WhatsApp Web); the session is then saved.
 *
 * It connects to your existing booking agent through the internal HTTP endpoint
 * POST /api/whatsapp/agent, so all the conversation logic stays in one place.
 *
 * Run (after `npm run dev` / `npm start` is up):
 *   node worker/whatsapp-web.mjs
 *
 * Env:
 *   APP_BASE_URL     default http://localhost:3000   (the running site)
 *   WA_AGENT_SECRET  shared secret matching the site's env (REQUIRED)
 *   WA_SESSION_DIR   default ./.wwebjs_auth          (persisted login)
 *
 * ⚠️  Use a phone number DEDICATED to the clinic, not your personal one:
 *     this is unofficial and WhatsApp could ban a number for automated activity.
 */
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

const BASE = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SECRET = process.env.WA_AGENT_SECRET;
const SESSION_DIR = process.env.WA_SESSION_DIR || "./.wwebjs_auth";

if (!SECRET) {
  console.error("FATAL: set WA_AGENT_SECRET (must match the site's WA_AGENT_SECRET).");
  process.exit(1);
}

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_DIR }),
  puppeteer: {
    headless: true,
    // Flags required to run Chromium on a headless VPS.
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("\n=== Scan this QR with WhatsApp (Settings → Linked Devices → Link a Device) ===\n");
  qrcode.generate(qr, { small: true });
  console.log("\nWaiting for scan…");
});

client.on("authenticated", () => console.log("[wa] authenticated — session saved."));
client.on("auth_failure", (m) => console.error("[wa] auth failure:", m));
client.on("ready", () => console.log("[wa] READY ✅  The booking bot is now live on your number."));
client.on("disconnected", (r) => console.error("[wa] disconnected:", r, "— PM2 will restart."));

/** Forward an inbound message to the booking agent and return its replies. */
async function askAgent(phone, text) {
  const res = await fetch(`${BASE}/api/whatsapp/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-agent-secret": SECRET },
    body: JSON.stringify({ phone, text }),
  });
  if (!res.ok) {
    console.error("[agent] HTTP", res.status, await res.text().catch(() => ""));
    return { replies: [] };
  }
  return res.json();
}

client.on("message", async (msg) => {
  try {
    // ignore group chats, status broadcasts, and non-text messages
    if (msg.from.endsWith("@g.us") || msg.from === "status@broadcast") return;
    if (msg.type !== "chat" || !msg.body) return;

    const phone = msg.from.split("@")[0]; // e.g. "201234567890"
    const { replies } = await askAgent(phone, msg.body);
    for (const body of replies) {
      if (body && body.trim()) await client.sendMessage(msg.from, body);
    }
  } catch (e) {
    console.error("[wa] message handler error:", e?.message || e);
  }
});

process.on("SIGINT", async () => {
  console.log("\n[wa] shutting down…");
  await client.destroy().catch(() => {});
  process.exit(0);
});

console.log(`[wa] starting worker → agent at ${BASE}/api/whatsapp/agent`);
client.initialize();
