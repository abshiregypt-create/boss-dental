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
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env from the project root so the worker runs standalone (e.g. via PM2 / a .cmd loop).
(() => {
  try {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const envPath = path.join(root, ".env");
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* env file is optional if vars are already set */
  }
})();

const BASE = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SECRET = process.env.WA_AGENT_SECRET;
const SESSION_DIR = process.env.WA_SESSION_DIR || "./.wwebjs_auth";

// Outbox poll timer (declared early; it's referenced by disconnect/fatal handlers).
let outboxTimer = null;

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
let lastState = "offline";
async function reportStatus(state, qr) {
  lastState = state;
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

// Heartbeat: re-post the last known state every 20s so the dashboard stays accurate
// (the site marks the worker "offline" only after 60s of silence).
setInterval(() => {
  if (lastState === "ready" || lastState === "authenticated") reportStatus(lastState);
}, 20_000);

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
  console.error("[wa] disconnected:", r, "— exiting so the launcher restarts a fresh session.");
  reportStatus("disconnected");
  if (outboxTimer) clearInterval(outboxTimer);
  // Exit; start-worker.cmd (or PM2) relaunches with the saved session.
  setTimeout(() => process.exit(1), 1000);
});

// If Chrome's page detaches (the "detached Frame" crash), the session is dead —
// exit so the launcher restarts cleanly instead of looping on a broken client.
let fatalCount = 0;
function maybeFatal(err) {
  const msg = String(err?.message || err || "");
  if (/detached Frame|Session closed|Target closed|Protocol error|Execution context/i.test(msg)) {
    fatalCount++;
    if (fatalCount >= 3) {
      console.error("[wa] session looks dead — exiting for a clean restart.");
      if (outboxTimer) clearInterval(outboxTimer);
      setTimeout(() => process.exit(1), 500);
    }
  }
}
process.on("unhandledRejection", maybeFatal);

/** Forward an inbound message to the booking agent and return its replies. */
async function askAgent(phone, text, name, chatId) {
  const res = await fetch(`${BASE}/api/whatsapp/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-agent-secret": SECRET },
    body: JSON.stringify({ phone, text, name, chatId }),
  });
  if (!res.ok) {
    console.error("[agent] HTTP", res.status, await res.text().catch(() => ""));
    return { replies: [] };
  }
  return res.json();
}

/** Poll the outbox for server-initiated messages (e.g. doctor confirmations). */
async function drainOutbox() {
  try {
    const res = await fetch(`${BASE}/api/whatsapp/outbox`, {
      headers: { "x-agent-secret": SECRET },
    });
    if (!res.ok) return;
    const { messages } = await res.json();
    if (!messages?.length) return;
    const sent = [];
    const failed = [];
    for (const m of messages) {
      const digits = String(m.phone).replace(/\D/g, "");
      try {
        // Prefer the exact chat id captured when the patient messaged us
        // (works even when the number is a @lid alias). Fall back to number lookup.
        let target = m.chatId;
        if (!target) {
          const numId = await client.getNumberId(digits);
          if (!numId) {
            console.error(`[outbox] ${digits} is not on WhatsApp — marking failed.`);
            failed.push(m.id);
            continue;
          }
          target = numId._serialized;
        }
        await client.sendMessage(target, m.body);
        sent.push(m.id);
      } catch (e) {
        const msg = String(e?.message || e);
        console.error("[outbox] send failed:", msg);
        if (/No LID|not.*registered|invalid|wid/i.test(msg)) failed.push(m.id);
        else maybeFatal(e);
      }
    }
    if (sent.length || failed.length) {
      await fetch(`${BASE}/api/whatsapp/outbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-agent-secret": SECRET },
        body: JSON.stringify({ ids: sent, failedIds: failed }),
      });
    }
  } catch {
    /* best-effort */
  }
}

client.on("message", async (msg) => {
  try {
    // ignore group chats, status broadcasts, and non-text messages
    if (msg.from.endsWith("@g.us") || msg.from === "status@broadcast") return;
    if (msg.type !== "chat" || !msg.body) return;

    // Resolve the real phone number + contact name. msg.from can be a @lid alias,
    // so we dig for the actual phone via several whatsapp-web.js fields.
    let phone = msg.from.split("@")[0];
    let name;
    try {
      const contact = await msg.getContact();
      // Prefer an explicit phone field; fall back through known shapes.
      const cand =
        contact?.number ||
        contact?.id?.user ||
        (typeof contact?.getFormattedNumber === "function"
          ? (await contact.getFormattedNumber().catch(() => null))
          : null) ||
        msg.from.split("@")[0];
      phone = String(cand).replace(/\D/g, "");
      name = contact?.pushname || contact?.name || contact?.verifiedName || msg._data?.notifyName || undefined;
      // Diagnostic: log what we actually got so we can pin the right field.
      console.log(
        `[wa] inbound from=${msg.from} | number=${contact?.number} | id.user=${contact?.id?._serialized} | resolved=${phone} | name=${name}`
      );
    } catch (e) {
      name = msg._data?.notifyName || undefined;
      console.log(`[wa] inbound from=${msg.from} (getContact failed: ${e?.message || e})`);
    }

    const { replies } = await askAgent(phone, msg.body, name, msg.from);
    for (const body of replies) {
      if (body && body.trim()) await client.sendMessage(msg.from, body);
    }
  } catch (e) {
    console.error("[wa] message handler error:", e?.message || e);
    maybeFatal(e);
  }
});

// Poll the outbox once the client is ready (doctor-confirm messages, etc.).
client.on("ready", () => {
  if (outboxTimer) clearInterval(outboxTimer);
  outboxTimer = setInterval(drainOutbox, 8000);
});

process.on("SIGINT", async () => {
  console.log("\n[wa] shutting down…");
  await client.destroy().catch(() => {});
  process.exit(0);
});

console.log(`[wa] starting worker → agent at ${BASE}/api/whatsapp/agent`);
client.initialize();
