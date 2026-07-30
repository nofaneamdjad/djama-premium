import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // ── Turbopack — évite l'avertissement de workspace root ─────────
  turbopack: {
    root: __dirname,
  },

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

  // ── Headers anti-cache pour forcer le navigateur à toujours
  //    récupérer la dernière version depuis Vercel ────────────────────
  async headers() {
    return [
      /* ── En-têtes de sécurité — toutes les routes ── */
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy — bloque injections XSS et ressources non autorisées
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js inline scripts (anti-flash, JSON-LD) + Stripe.js
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com",
              // Styles Tailwind inline
              "style-src 'self' 'unsafe-inline'",
              // Images Supabase Storage + data URIs (aperçus inline)
              "img-src 'self' data: blob: *.supabase.co *.supabase.in",
              // Fonts locales uniquement
              "font-src 'self'",
              // API calls autorisées
              "connect-src 'self' *.supabase.co *.supabase.in wss://*.supabase.co api.stripe.com api-m.paypal.com api-m.sandbox.paypal.com",
              // iframes Stripe (paiement sécurisé)
              "frame-src 'self' js.stripe.com hooks.stripe.com",
              // Interdit l'inclusion dans des iframes tierces
              "frame-ancestors 'self'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join("; "),
          },
          // Empêche le site d'être embarqué dans une iframe tierce (clickjacking)
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          // Empêche le navigateur de sniffer le Content-Type
          { key: "X-Content-Type-Options",    value: "nosniff" },
          // Limite les infos du Referer transmises aux tiers
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          // Force HTTPS pour 1 an (Vercel / production uniquement)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          // Désactive les APIs sensibles non utilisées
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Protection XSS basique (IE/Edge legacy)
          { key: "X-XSS-Protection",          value: "1; mode=block" },
        ],
      },
      /* ── Service Worker — doit être revalidé mais pas bloqué ── */
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control",          value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed",  value: "/" },
        ],
      },
      /* ── Icônes PWA — mise en cache longue durée ── */
      {
        source: "/icons/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      /* ── Toutes les autres routes — no-cache ── */
      {
        source: "/((?!sw\\.js|icons/).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma",        value: "no-cache" },
          { key: "Expires",       value: "0" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Désactive le bundling Sentry si DSN absent (dev sans config Sentry)
  silent: !process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Upload des sourcemaps vers Sentry (nécessite SENTRY_AUTH_TOKEN dans CI)
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
