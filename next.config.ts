import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Images externes — Supabase Storage + éventuels CDN ──────────
  images: {
    remotePatterns: [
      {
        // Supabase Storage (projet hébergé sur supabase.co)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Supabase Storage (domaine personnalisé possible)
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ── Packages Node-only — évite le bundling côté client ──────────
  // resend, stripe et jspdf ne doivent pas être inclus dans le bundle
  // browser. Next.js les traite comme external automatiquement pour
  // les Server Components / Route Handlers, mais on le déclare
  // explicitement pour s'assurer qu'aucune erreur de build ne survient.
  /*
   * serverExternalPackages — Packages chargés via require() Node.js natif,
   * PAS bundlés par Turbopack/Webpack dans le chunk serveur.
   * Nécessaire pour éviter les problèmes de chunk hash sur Vercel :
   *   @anthropic-ai/sdk → ESM/CJS hybride, native bindings potentiels
   *   resend, stripe    → mêmes raisons
   */
  serverExternalPackages: ["resend", "stripe", "@anthropic-ai/sdk"],
};

export default nextConfig;
