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
import fs from "node:fs";

const BASE = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SECRET = process.env.WA_AGENT_SECRET;
const SESSION_DIR = process.env.WA_SESSION_DIR || "./.wwebjs_auth";

if (!SECRET) {
  console.error("FATAL: set WA_AGENT_SECRET (must match the site's WA_AGENT_SECRET).");
  process.exit(1);
}

/**
 * Find a Chrome/Chromium to drive. Order:
 *   1. CHROME_PATH env (set this on the VPS, e.g. /usr/bin/chromium-browser)
 *   2. puppeteer's own bundled Chromium (if it downloaded)
 *   3. a system Google Chrome / Edge install (Windows/macOS/Linux common paths)
 */
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    `${process.env.LOCALAPPDATA || ""}/Google/Chrome/Application/chrome.exe`,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return undefined; // let whatsapp-web.js fall back to its bundled Chromium
}

const executablePath = findChrome();
console.log(`[wa] using Chrome: ${executablePath || "(puppeteer bundled Chromium)"}`);

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_DIR }),
  puppeteer: {
    headless: true,
    executablePath,
    // Flags required to run Chromium on a headless VPS.
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
});

/** Push the worker's status (and QR) to the site so the dashboard can show it. */
async function reportStatus(state, qr) {
  try {
    await fetch(`${BASE}/api/whatsapp/worker-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-agent-secret": SECRET },
      body: JSON.stringify({ state, qr }),
    });
  } catch {
    /* dashboard reporting is best-effort */
  }
}

client.on("qr", (qr) => {
  console.log("\n=== Scan this QR with WhatsApp (Settings → Linked Devices → Link a Device) ===\n");
  qrcode.generate(qr, { small: true });
  console.log("\nOr open the dashboard → WhatsApp tab to scan it there.\nWaiting for scan…");
  reportStatus("qr", qr);
});

client.on("authenticated", () => {
  console.log("[wa] authenticated — session saved.");
  reportStatus("authenticated");
});
client.on("auth_failure", (m) => console.error("[wa] auth failure:", m));
client.on("ready", () => {
  console.log("[wa] READY ✅  The booking bot is now live on your number.");
  reportStatus("ready");
});
client.on("disconnected", (r) => {
  console.error("[wa] disconnected:", r, "— PM2 will restart.");
  reportStatus("disconnected");
});

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
