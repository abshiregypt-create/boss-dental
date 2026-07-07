import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The desktop (Electron) build bundles a self-contained Node server produced by
  // Next's standalone output. Gated on DESKTOP_BUILD so the Railway `next start`
  // deployment is unaffected.
  ...(process.env.DESKTOP_BUILD ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
