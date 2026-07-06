# WhatsApp booking-bot worker (whatsapp-web.js + headless Chromium).
# Runs as its OWN Railway service, separate from the Next.js site. It logs in
# once via QR (shown in the dashboard), persists the session on a volume, and
# talks to the site over HTTP (POST /api/whatsapp/*). No web server / port.
FROM node:20-bookworm-slim

# Use the system Chromium instead of Puppeteer's bundled download.
ENV PUPPETEER_SKIP_DOWNLOAD=1 \
    CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production

# Chromium + the fonts/libs it needs to render headless on a server.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY whatsapp-web.mjs ./

CMD ["node", "whatsapp-web.mjs"]
