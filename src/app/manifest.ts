import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DJAMA — L'écosystème digital pour entrepreneurs",
    short_name: "DJAMA",
    description:
      "Présence digitale, outils de gestion, accompagnement expert et IA pour entrepreneurs.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#c9a55a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity"],
    lang: "fr",
  };
}
