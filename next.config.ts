import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Permet deux instances Next.js sur des ports différents (dev local vs prod)
// sans conflit sur le verrou .next/dev/lock.
// Usage : NEXT_DIST_DIR=.next-local npx next dev --port 3001
const distDir = process.env.NEXT_DIST_DIR ?? ".next";

// ── Garde DJAMA_ENV : valeur obligatoire, typage strict ──────────────────
// Fail-closed : absent ou invalide → refuse de démarrer.
// Local : DJAMA_ENV=development dans .env.local
// Production : DJAMA_ENV=production dans les variables Vercel
// Fallback : VERCEL_ENV est injecté automatiquement par Vercel dans tous les builds
const _VERCEL_ENV = process.env.VERCEL_ENV; // "production" | "preview" | "development" | undefined
const _DJAMA_ENV = process.env.DJAMA_ENV
  ?? (_VERCEL_ENV === "production" || _VERCEL_ENV === "preview" ? "production" : undefined);
if (_DJAMA_ENV !== "development" && _DJAMA_ENV !== "production") {
  throw new Error(
    `[DJAMA] DJAMA_ENV="${_DJAMA_ENV ?? "(absent)"}" est invalide. ` +
    `Définissez DJAMA_ENV=development (local) ou DJAMA_ENV=production (Vercel). ` +
    `En local : copiez .env.local.dev vers .env.local.`
  );
}

// ── Garde Upstash : obligatoire en production (rate limiting distribué) ──────
// En dev, le fallback in-memory de rate-limit.ts est acceptable (1 instance).
// En prod Vercel (multi-instance), l'absence d'Upstash = rate limiting inopérant.
if (_DJAMA_ENV === "production") {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error(
      `[DJAMA] UPSTASH_REDIS_REST_URL et/ou UPSTASH_REDIS_REST_TOKEN absents en production. ` +
      `Sans Upstash, le rate limiting est inopérant sur les instances Vercel. ` +
      `Configurez-les dans les variables d'environnement Vercel.`
    );
  }
}

// ── Garde dev/prod : Supabase URL doit être localhost en développement ───────
// Protège contre la connexion accidentelle à Supabase cloud depuis dev.
// Pour audits nécessitant le cloud (Docker indisponible) :
//   définir DJAMA_ALLOW_CLOUD_SUPABASE_IN_DEV=true dans .env.local
if (
  _DJAMA_ENV === "development" &&
  !process.env.DJAMA_ALLOW_CLOUD_SUPABASE_IN_DEV &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http://127.0.0.1:54321")
) {
  throw new Error(
    `[DJAMA] Garde dev/prod : NEXT_PUBLIC_SUPABASE_URL="${process.env.NEXT_PUBLIC_SUPABASE_URL}" n'est pas localhost. ` +
    `En développement, utilisez Supabase local (http://127.0.0.1:54321). ` +
    `Pour utiliser intentionnellement le cloud en dev (audit sans Docker), ` +
    `définissez DJAMA_ALLOW_CLOUD_SUPABASE_IN_DEV=true dans .env.local.`
  );
}

const nextConfig: NextConfig = {
  distDir,

  // Ignore les erreurs TS auto-générées par le validator de routes Next.js 16
  // (bug interne .next/dev/types/validator.ts — "Cannot find name 'k'")
  // Les types sont toujours vérifiés via `tsc --noEmit` en CI/pre-commit.
  typescript: { ignoreBuildErrors: true },

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
              // Styles Tailwind inline + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images Supabase Storage + data URIs (aperçus inline) + avatars social proof
              "img-src 'self' data: blob: *.supabase.co *.supabase.in randomuser.me",
              // Fonts locales + Google Fonts fichiers
              "font-src 'self' https://fonts.gstatic.com",
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
