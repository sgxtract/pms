import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.systemName}, ${SITE.lguName}`,
    short_name: "PMS",
    description: `Procurement requests of the ${SITE.lguName} and their current status.`,
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#1e3a8a",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
