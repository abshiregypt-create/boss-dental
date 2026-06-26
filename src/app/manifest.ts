import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e12",
    theme_color: "#0a0e12",
    icons: [
      { src: "/bdic-logo.jpg", sizes: "192x192", type: "image/jpeg" },
      { src: "/bdic-logo.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
  };
}
