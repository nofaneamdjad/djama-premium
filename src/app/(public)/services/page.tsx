"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, CheckCircle2, Zap, Users, TrendingUp,
  Shield, Clock, Settings2, MessageSquare, Star, BadgeCheck,
  Code2, LayoutGrid, Layers, ChevronRight,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import {
  staggerContainer, staggerContainerFast, cardReveal, cardRevealBlur,
  fadeIn, blurReveal, viewport,
} from "@/lib/animations";
import type { ServiceRow } from "@/types/db";
import { useLanguage } from "@/lib/language-context";
import { WordLift } from "@/components/ui/HoverText";

/* ─────────────────────────────────────────────────────────
   DESIGN SYSTEM PAR CATÉGORIE
───────────────────────────────────────────────────────── */
const CAT_CONFIG = {
  "Digital": {
    bg:          "from-[#080814] via-[#0d0d26] to-[#101030]",
    glow:        "rgba(124,111,205,0.30)",
    glowDark:    "rgba(124,111,205,0.15)",
    accent:      "#7c6fcd",
    accentRgb:   "124,111,205",
    border:      "rgba(124,111,205,0.28)",
    hoverShadow: "0 32px 72px rgba(124,111,205,0.24), 0 8px 20px rgba(0,0,0,0.6)",
    label:       "Digital",
    emoji:       "⚡",
  },
  "Création de contenu": {
    bg:          "from-[#160810] via-[#220c1c] to-[#1c0a16]",
    glow:        "rgba(220,80,120,0.28)",
    glowDark:    "rgba(220,80,120,0.14)",
    accent:      "#dc5078",
    accentRgb:   "220,80,120",
    border:      "rgba(220,80,120,0.28)",
    hoverShadow: "0 32px 72px rgba(220,80,120,0.22), 0 8px 20px rgba(0,0,0,0.6)",
    label:       "Création",
    emoji:       "✦",
  },
  "Documents & Outils": {
    bg:          "from-[#001412] via-[#001f1a] to-[#001815]",
    glow:        "rgba(52,211,153,0.26)",
    glowDark:    "rgba(52,211,153,0.12)",
    accent:      "#34d399",
    accentRgb:   "52,211,153",
    border:      "rgba(52,211,153,0.28)",
    hoverShadow: "0 32px 72px rgba(52,211,153,0.20), 0 8px 20px rgba(0,0,0,0.6)",
    label:       "Outils",
    emoji:       "◈",
  },
  "Accompagnement": {
    bg:          "from-[#160c00] via-[#221400] to-[#1c1000]",
    glow:        "rgba(249,168,38,0.26)",
    glowDark:    "rgba(249,168,38,0.12)",
    accent:      "#f9a826",
    accentRgb:   "249,168,38",
    border:      "rgba(249,168,38,0.28)",
    hoverShadow: "0 32px 72px rgba(249,168,38,0.20), 0 8px 20px rgba(0,0,0,0.6)",
    label:       "Accompagnement",
    emoji:       "◎",
  },
  "Coaching": {
    bg:          "from-[#0e0a02] via-[#160e04] to-[#1a1206]",
    glow:        "rgba(201,165,90,0.28)",
    glowDark:    "rgba(201,165,90,0.13)",
    accent:      "#c9a55a",
    accentRgb:   "201,165,90",
    border:      "rgba(201,165,90,0.28)",
    hoverShadow: "0 32px 72px rgba(201,165,90,0.22), 0 8px 20px rgba(0,0,0,0.6)",
    label:       "Coaching",
    emoji:       "◉",
  },
} as const;

type CatKey = keyof typeof CAT_CONFIG;

const CAT_ICONS: Record<string, React.ElementType> = {
  "Digital":              Code2,
  "Création de contenu": Sparkles,
  "Documents & Outils":  BadgeCheck,
  "Accompagnement":       Users,
  "Coaching":             Star,
};

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────
   CARD VISUEL — premium animated header
───────────────────────────────────────────────────────── */
function CardVisual({ icon: Icon, config }: {
  icon: React.ElementType;
  config: typeof CAT_CONFIG[CatKey];
}) {
  return (
    <div className={`relative flex h-[160px] sm:h-[200px] items-center justify-center overflow-hidden bg-gradient-to-br ${config.bg}`}>

      {/* Dot grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.055) 1.5px, transparent 0)",
        backgroundSize: "24px 24px",
      }} />

      {/* Animated main glow orb */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-44 w-44 rounded-full blur-3xl" style={{ background: config.glow }} />
      </motion.div>

      {/* Secondary glow top-right */}
      <motion.div
        className="absolute right-5 top-3 h-20 w-20 rounded-full blur-2xl pointer-events-none"
        style={{ background: config.glowDark }}
        animate={{ x: [0, 6, 0], y: [0, -5, 0], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Floating particles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute h-[3px] w-[3px] rounded-full pointer-events-none"
          style={{
            background: config.accent,
            left: `${18 + i * 18}%`,
            top: `${28 + (i % 2 === 0 ? 20 : -5)}%`,
          }}
          animate={{ y: [0, -(8 + i * 4), 0], opacity: [0.18, 0.5, 0.18] }}
          transition={{ duration: 2.8 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.45 }}
        />
      ))}

      {/* Icon container with pulse glow */}
      <div className="relative z-10">
        <motion.div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border"
          style={{
            background: `rgba(${config.accentRgb}, 0.12)`,
            borderColor: config.border,
          }}
          animate={{
            boxShadow: [
              `0 0 18px rgba(${config.accentRgb}, 0.16), inset 0 1px 0 rgba(255,255,255,0.06)`,
              `0 0 40px rgba(${config.accentRgb}, 0.38), inset 0 1px 0 rgba(255,255,255,0.08)`,
              `0 0 18px rgba(${config.accentRgb}, 0.16), inset 0 1px 0 rgba(255,255,255,0.06)`,
            ],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.1 }}
        >
          <Icon size={34} style={{ color: config.accent }} />
        </motion.div>
      </div>

      {/* Bottom gradient separator */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${config.border}, transparent)` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SERVICE CARD — premium glassmorphism
───────────────────────────────────────────────────────── */
function ServiceCard({ service, lang }: { service: ServiceRow; lang: "fr" | "en" }) {
  const config  = CAT_CONFIG[service.category as CatKey];
  const isOutil = service.category === "Documents & Outils";
  const Icon    = CAT_ICONS[service.category] ?? Code2;

  const isCoachingIA        = service.slug === "coaching-ia"                      || service.title === "Coaching IA";
  const isSoutienScolaire   = service.slug === "soutien-scolaire"                 || service.title === "Soutien scolaire";
  const isMarchesPublics    = service.slug === "marches-publics-prives"           || service.title === "Marchés publics & privés";
  const isAssistanceAdmin   = service.slug === "assistance-administrative-entreprises"
                           || service.title === "Assistance administrative entreprises"
                           || service.title === "Assistance administrative";
  const isDeclarationsUrssaf   = service.slug === "declarations-urssaf"
                             || service.title === "Déclarations URSSAF";
  const isCreationAutoEntre    = service.slug === "creation-auto-entrepreneur"
                             || service.title === "Création auto-entrepreneur"
                             || service.title === "Création auto entrepreneur";
  const isMontageVideo         = service.slug === "montage-video"
                             || service.title === "Montage vidéo"
                             || service.title === "Montage video";
  const isRetouchePhoto        = service.slug === "retouche-photo"
                             || service.title === "Retouche photo"
                             || service.title === "Retouche Photo";
  const isVisuelsPublicitaires = service.slug === "visuels-publicitaires"
                             || service.title === "Visuels publicitaires"
                             || service.title === "Visuels Publicitaires";
  const isFournisseurs          = service.slug === "fournisseurs-internationaux"
                              || service.title === "Recherche de fournisseurs internationaux"
                              || service.title === "Recherche fournisseurs";
  const isAutomatisationIA      = service.slug === "automatisation-ia"
                              || service.title === "Automatisation & IA"
                              || service.title === "Automatisation IA";
  const isPlateformeWeb         = service.slug === "plateforme-web-sur-mesure"
                              || service.title === "Plateforme web sur mesure"
                              || service.title === "Plateforme web";
  const isAppMobile             = service.slug === "application-mobile"
                              || service.title === "Application mobile"
                              || service.title === "Application Mobile";
  const isSiteVitrine           = service.slug === "site-vitrine"
                              || service.title === "Création de site vitrine"
                              || service.title === "Site vitrine"
                              || service.title === "Site Vitrine";
  const isSiteEcommerce         = service.slug === "site-ecommerce"
                              || service.title === "Site e-commerce"
                              || service.title === "Site ecommerce"
                              || service.title === "E-commerce";

  const href = isOutil
    ? "/abonnement"
    : isCoachingIA
      ? "/services/coaching-ia"
      : isSoutienScolaire
        ? "/services/soutien-scolaire"
        : isMarchesPublics
          ? "/services/marches-publics"
          : isAssistanceAdmin
            ? "/services/assistance-administrative"
            : isDeclarationsUrssaf
              ? "/services/declarations-urssaf"
              : isCreationAutoEntre
                ? "/services/creation-auto-entrepreneur"
                : isMontageVideo
                  ? "/services/montage-video"
                  : isRetouchePhoto
                    ? "/services/retouche-photo"
                    : isVisuelsPublicitaires
                      ? "/services/visuels-publicitaires"
                      : isAutomatisationIA
                        ? "/services/automatisation-ia"
                        : isPlateformeWeb
                          ? "/services/plateforme-web-sur-mesure"
                          : isAppMobile
                            ? "/services/application-mobile"
                            : isSiteVitrine
                              ? "/services/site-vitrine"
                              : isSiteEcommerce
                                ? "/services/site-ecommerce"
                                : isFournisseurs
                                  ? "/services/recherche-fournisseurs"
                                  : "/contact";

  const priceTag  = service.price || null;
  const bullets    = service.description.split(/\n+/).map((b) => b.trim()).filter(Boolean);
  const excerpt    = bullets[0] ?? service.description ?? "";
  const extraBullets = bullets.slice(1, 3);

  const ctaLabel = isOutil
    ? (lang === "en" ? "Get started"             : "Commencer maintenant")
    : isCoachingIA
      ? (lang === "en" ? "Book your AI Coaching"  : "Réserver votre Coaching IA")
      : isSoutienScolaire
        ? (lang === "en" ? "Book a trial lesson"  : "Réserver votre cours d'essai")
        : isAutomatisationIA
          ? (lang === "en" ? "Discuss my automation" : "Parler de mon automatisation")
          : isPlateformeWeb
            ? (lang === "en" ? "Discuss my platform"  : "Discuter de ma plateforme")
            : isAppMobile
              ? (lang === "en" ? "Discuss my app"      : "Parler de mon application")
              : isSiteVitrine
                ? (lang === "en" ? "Create my website"  : "Créer mon site vitrine")
                : isSiteEcommerce
                  ? (lang === "en" ? "Launch my store"  : "Lancer ma boutique")
                  : (lang === "en" ? "Request a quote"  : "Demander un devis");

  return (
    /* Outer wrapper — stagger target + group anchor */
    <motion.div
      variants={cardRevealBlur}
      className="group relative"
    >
      {/* Gradient border bloom — outside the overflow-hidden inner card */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-[1.8rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(145deg, rgba(${config.accentRgb}, 0.5) 0%, transparent 45%, rgba(${config.accentRgb}, 0.2) 100%)`,
        }}
      />

      {/* Main card — lift + shadow on hover */}
      <motion.div
        className="relative flex flex-col overflow-hidden rounded-[1.75rem] border bg-[#09090b] transition-shadow duration-500"
        style={{
          borderColor: isOutil ? config.border : "rgba(255,255,255,0.08)",
          boxShadow: isOutil
            ? `0 4px 24px rgba(${config.accentRgb}, 0.12), inset 0 1px 0 rgba(255,255,255,0.04)`
            : "0 2px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
        whileHover={{
          y: -8,
          boxShadow: config.hoverShadow,
          borderColor: config.border,
        }}
        transition={{ duration: 0.38, ease }}
      >
        {/* Shimmer sweep */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[1.75rem]">
          <div
            className="absolute inset-y-0 -left-[60%] w-[45%] -skew-x-12 transition-all duration-700 ease-out group-hover:left-[160%]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.045), transparent)" }}
          />
        </div>

        {/* Top highlight edge on hover */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${config.accentRgb}, 0.9), transparent)` }}
        />

        {/* Overlay — whole card is clickable */}
        <Link href={href} className="absolute inset-0 z-0" aria-label={service.title} tabIndex={-1} />

        {isSiteVitrine || isAppMobile || isSiteEcommerce || isAutomatisationIA || isPlateformeWeb ? (
          <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <Image
              src={
                isSiteVitrine    ? "/services-vitrine.jpg"        :
                isAppMobile      ? "/services-app-mobile.jpg"     :
                isSiteEcommerce  ? "/services-ecommerce.jpg"      :
                isAutomatisationIA ? "/services-automatisation.jpg" :
                                   "/services-plateforme.jpg"
              }
              alt={
                isSiteVitrine    ? "Création de site vitrine — DJAMA"          :
                isAppMobile      ? "Application mobile iOS/Android — DJAMA"    :
                isSiteEcommerce  ? "Site e-commerce performant — DJAMA"        :
                isAutomatisationIA ? "Automatisation & IA — DJAMA"             :
                                   "Plateforme web sur mesure — DJAMA"
              }
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 100vw, 480px"
            />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#09090b] to-transparent" />
          </div>
        ) : (
          <CardVisual icon={Icon} config={config} />
        )}

        {/* Espace client banner */}
        {isOutil && (
          <div
            className="flex items-center justify-center gap-1.5 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.15em]"
            style={{
              background: `rgba(${config.accentRgb}, 0.1)`,
              color: config.accent,
              borderBottom: `1px solid rgba(${config.accentRgb}, 0.15)`,
            }}
          >
            <span className="h-1 w-1 rounded-full" style={{ background: config.accent }} />
            {lang === "en" ? "Included in subscription" : "Inclus dans l'abonnement"}
          </div>
        )}

        <div className="flex flex-col p-5 sm:p-7">
          {/* Badge catégorie + prix */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.14em]"
              style={{
                background: `rgba(${config.accentRgb}, 0.1)`,
                color: config.accent,
                border: `1px solid rgba(${config.accentRgb}, 0.22)`,
              }}
            >
              <span className="h-1 w-1 rounded-full" style={{ background: config.accent }} />
              {config.label}
            </span>
            {priceTag && (
              <span
                className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
                style={{
                  background: isOutil ? `rgba(${config.accentRgb}, 0.12)` : "transparent",
                  color: isOutil ? config.accent : "rgba(255,255,255,0.3)",
                  border: isOutil ? `1px solid rgba(${config.accentRgb}, 0.22)` : "none",
                }}
              >
                {priceTag}
              </span>
            )}
          </div>

          <h2 className="text-[1.05rem] font-extrabold leading-snug text-white/90">
            <WordLift text={service.title} yOffset={4} stagger={25} hoverColor="rgba(255,255,255,1)" />
          </h2>

          <p className="mt-2.5 text-sm leading-relaxed text-white/40">
            {excerpt}
          </p>

          {extraBullets.length > 0 && (
            <ul className="mt-5 space-y-2">
              {extraBullets.map((hl) => (
                <li key={hl} className="flex items-start gap-2 text-xs text-white/50">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: config.accent }} />
                  {hl}
                </li>
              ))}
            </ul>
          )}

          {/* CTAs */}
          {isOutil ? (
            <Link
              href={href}
              className="group/cta relative z-[1] mt-5 flex items-center justify-between overflow-hidden rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
              style={{ background: config.accent, color: "#09090b" }}
            >
              <span>{ctaLabel}</span>
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight size={16} />
              </motion.span>
            </Link>
          ) : (
            <Link
              href={href}
              className="group/cta relative z-[1] mt-5 flex items-center justify-between overflow-hidden rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300"
              style={{
                background: `rgba(${config.accentRgb}, 0.10)`,
                border: `1px solid rgba(${config.accentRgb}, 0.28)`,
                color: config.accent,
              }}
            >
              <span>{ctaLabel}</span>
              <ChevronRight size={16} className="transition-transform duration-300 group-hover/cta:translate-x-1" />
              <span
                className="absolute inset-0 -translate-x-full rounded-xl transition-transform duration-500 group-hover/cta:translate-x-0"
                style={{ background: `rgba(${config.accentRgb}, 0.14)` }}
              />
            </Link>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   OUTILS BLOCK — bloc unique pour Documents & Outils
───────────────────────────────────────────────────────── */
const OUTILS_LIST = [
  "Factures & Devis PDF",
  "Planning",
  "Planification",
  "Bloc-notes IA",
  "CRM Client",
  "Chrono Pro",
  "Dépenses Pro",
  "Trésorerie",
  "Contrats IA",
  "Sourcing IA",
  "Coach Business IA",
] as const;

function OutilsBlock({ lang }: { lang: "fr" | "en" }) {
  const cfg = CAT_CONFIG["Documents & Outils"];

  return (
    <motion.div
      variants={cardRevealBlur}
      className="group relative sm:col-span-2 xl:col-span-3"
    >
      {/* Gradient border bloom on hover */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-[1.8rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(145deg, rgba(${cfg.accentRgb},0.45) 0%, transparent 45%, rgba(${cfg.accentRgb},0.18) 100%)`,
        }}
      />

      <motion.div
        className="relative overflow-hidden rounded-[1.75rem] border bg-[#09090b]"
        style={{
          borderColor: cfg.border,
          boxShadow: `0 4px 28px rgba(${cfg.accentRgb},0.11), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
        whileHover={{ y: -6, boxShadow: cfg.hoverShadow }}
        transition={{ duration: 0.38, ease }}
      >
        {/* Shimmer sweep */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[1.75rem]">
          <div className="absolute inset-y-0 -left-[60%] w-[40%] -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-all duration-700 ease-out group-hover:left-[160%]" />
        </div>
        {/* Top edge glow on hover */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${cfg.accentRgb},0.9), transparent)` }}
        />

        {/* ── Header visuel — image ── */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <Image
            src="/services-outils.jpg"
            alt="Documents & Outils professionnels inclus — DJAMA"
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, 900px"
            priority
          />
        </div>

        {/* ── Corps ── */}
        <div className="p-6 sm:p-8">
          {/* Grille d'outils */}
          <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-2.5">
            {OUTILS_LIST.map((tool) => (
              <div
                key={tool}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5 transition-all hover:border-[rgba(52,211,153,0.22)] hover:bg-[rgba(52,211,153,0.05)]"
              >
                <CheckCircle2 size={11} className="shrink-0" style={{ color: cfg.accent }} />
                <span className="truncate text-[0.77rem] font-semibold text-white/60">{tool}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.72rem] text-white/28">
              {lang === "fr"
                ? "Accès depuis votre espace client · Synchronisation en temps réel"
                : "Access from your client space · Real-time sync"}
            </p>
            <Link
              href="/abonnement"
              className="group/cta relative z-[1] inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-bold transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
              style={{ background: cfg.accent, color: "#09090b" }}
            >
              {lang === "fr" ? "Accéder aux outils" : "Access tools"}
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight size={16} />
              </motion.span>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   FILTRE CATÉGORIES — animated layoutId pill
───────────────────────────────────────────────────────── */
function CategoryFilter({
  active,
  onChange,
  counts,
  filterLabels,
}: {
  active: string;
  onChange: (c: string) => void;
  counts: Record<string, number>;
  filterLabels: Record<string, string>;
}) {
  const CATEGORIES: ("all" | CatKey)[] = [
    "all", "Digital", "Création de contenu", "Documents & Outils", "Accompagnement", "Coaching",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease, delay: 0.4 }}
      className="flex flex-wrap justify-center gap-2"
    >
      {CATEGORIES.map((cat) => {
        const isActive = active === cat;
        const config   = cat !== "all" ? CAT_CONFIG[cat as CatKey] : null;
        const count    = counts[cat] ?? 0;
        const label    = cat === "all" ? filterLabels["all"] : (filterLabels[cat] ?? (config ? config.label : cat));

        return (
          <motion.button
            key={cat}
            onClick={() => onChange(cat)}
            whileTap={{ scale: 0.93 }}
            className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200"
            style={{
              color: isActive
                ? config ? config.accent : "#c9a55a"
                : "rgba(255,255,255,0.35)",
            }}
          >
            {/* Animated active pill */}
            {isActive ? (
              <motion.span
                layoutId="active-cat-pill"
                className="absolute inset-0 rounded-full"
                style={{
                  background: config ? `rgba(${config.accentRgb}, 0.12)` : "rgba(201,165,90,0.12)",
                  border: `1px solid ${config ? config.border : "rgba(201,165,90,0.3)"}`,
                }}
                transition={{ type: "spring", bounce: 0.18, duration: 0.48 }}
              />
            ) : (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              />
            )}

            <span className="relative z-10">{label}</span>
            <span
              className="relative z-10 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[0.55rem] font-black"
              style={{
                background: isActive
                  ? config ? `rgba(${config.accentRgb}, 0.2)` : "rgba(201,165,90,0.2)"
                  : "rgba(255,255,255,0.07)",
                color: isActive
                  ? config ? config.accent : "#c9a55a"
                  : "rgba(255,255,255,0.3)",
              }}
            >
              {count}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   DONNÉES STATIQUES FALLBACK
   Utilisées quand Supabase retourne 0 résultats ou échoue.
───────────────────────────────────────────────────────── */
const NOW = new Date().toISOString();
const STATIC_SERVICES: ServiceRow[] = [
  /* ── Digital ── */
  { id:"s1",  slug:"site-vitrine",                 title:"Site vitrine",                         category:"Digital",             price:"Dès 490 €",       description:"Site professionnel jusqu'à 5 pages, responsive, SEO local, formulaire de contact intégré.\nLivraison en 10 jours ouvrés.\nRévisions incluses.", active:true, sort_order:1,  created_at:NOW },
  { id:"s2",  slug:"site-ecommerce",               title:"Site e-commerce",                      category:"Digital",             price:"Dès 990 €",       description:"Boutique en ligne complète, catalogue produits, paiement sécurisé, gestion des commandes et des stocks.\nIntégration Stripe / PayPal.", active:true, sort_order:2,  created_at:NOW },
  { id:"s3",  slug:"application-mobile",           title:"Application mobile",                   category:"Digital",             price:"Dès 1 900 €",     description:"Application iOS & Android ou React Native, design sur mesure, notifications push, espace utilisateur.\nLivraison en 4 à 8 semaines.", active:true, sort_order:3,  created_at:NOW },
  { id:"s4",  slug:"plateforme-web-sur-mesure",    title:"Plateforme web sur mesure",            category:"Digital",             price:"Dès 3 500 €",     description:"SaaS, outil métier, dashboard, marketplace — architecture et développement complets.\nBackend Node.js / Next.js, base de données, API.", active:true, sort_order:4,  created_at:NOW },
  { id:"s5",  slug:"automatisation-ia",            title:"Automatisation & IA",                  category:"Digital",             price:"Dès 490 €",       description:"Création de workflows automatisés, chatbots IA, bots de traitement de données et intégrations métier sur mesure.\nMake, n8n, OpenAI, Claude.", active:true, sort_order:5,  created_at:NOW },
  /* ── Création de contenu ── */
  { id:"s6",  slug:"visuels-publicitaires",        title:"Visuels publicitaires",                category:"Création de contenu", price:"Dès 290 €",       description:"Affiches, flyers, visuels réseaux sociaux, identité visuelle et branding complet.\nFormats print et digital.", active:true, sort_order:6,  created_at:NOW },
  { id:"s7",  slug:"montage-video",                title:"Montage vidéo",                        category:"Création de contenu", price:"Dès 190 €",       description:"Reels, teasers, vidéos institutionnelles, sous-titrage automatique, transitions et effets pro.\nLivraison en 5 jours.", active:true, sort_order:7,  created_at:NOW },
  { id:"s8",  slug:"retouche-photo",               title:"Retouche photo",                       category:"Création de contenu", price:"Dès 49 €",        description:"Retouche professionnelle, fond blanc, mise en lumière, détourage, correction colorimétrique.\nIdéal e-commerce et profils pros.", active:true, sort_order:8,  created_at:NOW },
  /* ── Documents & Outils ── */
  { id:"s9",  slug:"outils-pro",                   title:"DJAMA Pro — 11 outils",                category:"Documents & Outils",  price:"11,90 €/mois",    description:"Accès à 11 outils pros : facturation, CRM, agenda, trésorerie, contrats IA, sourcing, bloc-notes.\nSans engagement — résiliable à tout moment.", active:true, sort_order:9,  created_at:NOW },
  /* ── Accompagnement ── */
  { id:"s10", slug:"creation-auto-entrepreneur",   title:"Création auto-entrepreneur",           category:"Accompagnement",      price:"Dès 49 €",        description:"Immatriculation complète, choix du statut juridique, conseil personnalisé et démarches administratives.\nRéponse sous 24h.", active:true, sort_order:10, created_at:NOW },
  { id:"s11", slug:"declarations-urssaf",          title:"Déclarations URSSAF",                  category:"Accompagnement",      price:"Dès 29 €/mois",   description:"Déclarations mensuelles ou trimestrielles, suivi des cotisations sociales, assistance en cas de contrôle.\nSuivi personnalisé.", active:true, sort_order:11, created_at:NOW },
  { id:"s12", slug:"assistance-administrative",    title:"Assistance administrative",            category:"Accompagnement",      price:"Sur devis",       description:"Rédaction de courriers, démarches administratives complexes, gestion documentaire professionnelle.\nPour entreprises et particuliers.", active:true, sort_order:12, created_at:NOW },
  { id:"s13", slug:"recherche-fournisseurs",       title:"Recherche fournisseurs internationaux",category:"Accompagnement",      price:"Sur devis",       description:"Identification, sélection et mise en relation avec des fournisseurs qualifiés à l'international (Asie, Europe, Afrique).\nNégociation incluse.", active:true, sort_order:13, created_at:NOW },
  { id:"s14", slug:"marches-publics",              title:"Marchés publics & privés",             category:"Accompagnement",      price:"Sur devis",       description:"Veille sur les appels d'offres, constitution de dossiers de candidature complets, conseil stratégique.\nTaux de réussite élevé.", active:true, sort_order:14, created_at:NOW },
  /* ── Coaching ── */
  { id:"s15", slug:"coaching-ia",                  title:"Coaching IA",                          category:"Coaching",            price:"190 € unique",    description:"Formation complète : 6 modules, 20 chapitres, 4h d'accompagnement expert, accès 3 mois.\nGarantie satisfait ou remboursé 7 jours.", active:true, sort_order:15, created_at:NOW },
  { id:"s16", slug:"soutien-scolaire",             title:"Soutien scolaire",                     category:"Coaching",            price:"14 €/heure",      description:"Cours particuliers toutes matières, collège et lycée, présentiel ou en ligne.\nSuivi régulier et progression garantie.", active:true, sort_order:16, created_at:NOW },
];

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ServicesPage() {
  const { lang, dict } = useLanguage();
  const s = dict.services;

  const [activeCategory, setActiveCategory] = useState("all");
  const [rows, setRows]       = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<ServiceRow[]>;
      })
      .then((d) => { setRows(d.length > 0 ? d : STATIC_SERVICES); setFetchErr(null); })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[ServicesPage] /api/services échoué — fallback statique :", msg);
        setFetchErr(null); // on masque l'erreur, le fallback est suffisant
        setRows(STATIC_SERVICES);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "all"
    ? rows
    : rows.filter((sv) => sv.category === activeCategory);

  const counts = (["Digital", "Création de contenu", "Documents & Outils", "Accompagnement", "Coaching"] as CatKey[]).reduce((acc, cat) => {
    acc[cat] = rows.filter((sv) => sv.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const WHY_ICONS  = [Zap, TrendingUp, Users, Settings2, Shield, Clock] as const;
  const WHY_COLORS = [
    { color: "#c9a55a", rgb: "201,165,90"  },
    { color: "#60a5fa", rgb: "96,165,250"  },
    { color: "#4ade80", rgb: "74,222,128"  },
    { color: "#f9a826", rgb: "249,168,38"  },
    { color: "#a78bfa", rgb: "167,139,250" },
    { color: "#f87171", rgb: "248,113,113" },
  ] as const;

  return (
    <div className="bg-[#09090b]">

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-14 pt-24 sm:pb-32 sm:pt-40">

        {/* Grid */}
        <div className="hero-grid absolute inset-0 opacity-40" />

        {/* Breathing mesh gradient */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(201,165,90,0.07) 0%, transparent 72%)",
              "radial-gradient(ellipse 75% 60% at 50% 0%, rgba(124,111,205,0.05) 0%, transparent 72%)",
              "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(201,165,90,0.07) 0%, transparent 72%)",
            ],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orb 1 — gold, top center */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          animate={{ y: [0, -18, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-[420px] w-[640px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[90px]" />
        </motion.div>

        {/* Orb 2 — purple, top-right */}
        <motion.div
          className="pointer-events-none absolute right-[8%] top-[20%] h-[280px] w-[280px] rounded-full bg-[rgba(167,139,250,0.045)] blur-[70px]"
          animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />

        {/* Orb 3 — blue, bottom-left */}
        <motion.div
          className="pointer-events-none absolute bottom-[5%] left-[5%] h-[240px] w-[240px] rounded-full bg-[rgba(96,165,250,0.035)] blur-[65px]"
          animate={{ x: [0, -8, 0], y: [0, 12, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">

          {/* Badge with pulse ring */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]"
          >
            <Sparkles size={11} />
            {s.hero.badge}
          </motion.div>

          {/* Title */}
          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={s.hero.titleLines}
              highlight={1}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal
            delay={0.65}
            as="p"
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/45"
          >
            {s.hero.subtitle}
          </FadeReveal>

          {/* CTAs */}
          <FadeReveal delay={0.8} className="mt-10 flex flex-wrap justify-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
              <Link href="/contact" className="btn-primary">
                {lang === "fr" ? "Démarrer un projet" : "Start a project"}
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight size={16} />
                </motion.span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/[0.1] bg-white/[0.05] px-7 py-[0.875rem] text-sm font-bold text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                {lang === "fr" ? "Explorer les services" : "Explore services"}
              </Link>
            </motion.div>
          </FadeReveal>

          {/* Stats */}
          <FadeReveal delay={0.95} className="mt-14 border-t border-white/[0.06] pt-12">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 1.0 } } }}
              className="flex flex-wrap justify-center gap-10"
            >
              {[
                { value: loading ? "…" : `${rows.length}`, label: lang === "fr" ? "services disponibles" : "services available" },
                { value: "5",    label: lang === "fr" ? "pôles d'expertise"    : "areas of expertise" },
                { value: "50+",  label: lang === "fr" ? "clients accompagnés"  : "clients supported"  },
                { value: "24h",  label: lang === "fr" ? "délai de réponse"     : "response time"      },
              ].map(({ value, label }) => (
                <motion.div
                  key={label}
                  variants={blurReveal}
                  className="text-center"
                >
                  <p className="text-2xl font-black tracking-tight text-white">{value}</p>
                  <p className="mt-0.5 text-xs text-white/30">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </FadeReveal>

          {/* Category chips */}
          <FadeReveal delay={1.1} className="mt-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 1.15 } } }}
              className="flex flex-wrap justify-center gap-2"
            >
              {(Object.keys(CAT_CONFIG) as CatKey[]).map((cat) => {
                const c = CAT_CONFIG[cat];
                return (
                  <motion.span
                    key={cat}
                    variants={blurReveal}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-bold"
                    style={{
                      background: `rgba(${c.accentRgb}, 0.08)`,
                      border: `1px solid rgba(${c.accentRgb}, 0.20)`,
                      color: c.accent,
                    }}
                  >
                    {c.emoji} {c.label}
                  </motion.span>
                );
              })}
            </motion.div>
          </FadeReveal>
        </div>

        {/* Bottom fade to section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#09090b] to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════
          FILTRES + GRILLE SERVICES
      ══════════════════════════════════════════════════ */}
      <section id="services" className="border-t border-white/[0.05] px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-6xl">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.65, ease }}
            className="mb-12 text-center"
          >
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/30">
              {lang === "fr" ? "Catalogue complet" : "Full catalogue"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-white/80">
              {lang === "fr" ? "Filtrez par catégorie" : "Filter by category"}
            </h2>
            {/* Decorative line */}
            <div className="mx-auto mt-4 h-px w-12 rounded-full bg-gradient-to-r from-transparent via-[#c9a55a]/40 to-transparent" />
          </motion.div>

          <CategoryFilter
            active={activeCategory}
            onChange={setActiveCategory}
            counts={{ ...counts, all: rows.length }}
            filterLabels={s.filters}
          />

          {loading ? (
            <div className="mt-12 grid items-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[340px] sm:h-[400px] animate-pulse rounded-[1.75rem] border border-white/[0.05] bg-white/[0.015]"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : fetchErr ? (
            <div className="mt-10 rounded-2xl border border-[rgba(248,113,113,0.18)] bg-[rgba(248,113,113,0.07)] px-6 py-8 text-center">
              <p className="text-sm font-bold text-[#f87171]">Impossible de charger les services</p>
              <p className="mt-1 text-xs text-white/35">{fetchErr}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial="hidden"
                animate="visible"
                variants={staggerContainerFast}
                className="mt-12 grid items-start gap-6 sm:grid-cols-2 xl:grid-cols-3"
              >
                {/* Bloc Outils — affiché en tête, pleine largeur */}
                {(activeCategory === "all" || activeCategory === "Documents & Outils") && (
                  <OutilsBlock lang={lang} />
                )}

                {/* Autres services (Documents & Outils exclus) */}
                {filtered
                  .filter((sv) => sv.category !== "Documents & Outils")
                  .map((service) => (
                    <ServiceCard key={service.id} service={service} lang={lang} />
                  ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          POURQUOI DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="relative border-t border-white/[0.05] px-6 py-28 overflow-hidden">
        {/* Subtle section glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[300px] w-[500px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
          >
            {/* Header */}
            <div className="mb-10 sm:mb-16 text-center">
              <motion.span
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]"
              >
                <Star size={10} /> {s.whyUs.badge}
              </motion.span>
              <motion.h2 variants={fadeIn} className="display-section mt-4 text-white">
                {s.whyUs.title}
              </motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-base text-white/40">
                {lang === "fr" ? "Ce qui nous différencie, au-delà des mots." : "What actually sets us apart."}
              </motion.p>
            </div>

            {/* Grid 3×2 */}
            <motion.div
              variants={staggerContainerFast}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {s.whyUs.items.map(({ title, desc }, i) => {
                const Icon = WHY_ICONS[i];
                const { color, rgb } = WHY_COLORS[i];
                return (
                  <motion.div
                    key={title}
                    variants={cardRevealBlur}
                    whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-[#0c0c10] p-7 transition-all duration-300 hover:border-white/[0.14]"
                  >
                    {/* Faint number watermark */}
                    <span
                      className="pointer-events-none absolute -right-1 -top-5 select-none text-[6.5rem] font-black leading-none text-white/[0.022]"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Radial hover glow */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[1.5rem] opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                      style={{ background: `radial-gradient(ellipse at 15% 0%, rgba(${rgb}, 0.13) 0%, transparent 60%)` }}
                    />

                    {/* Hover inset border glow */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[1.5rem] opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 0 1px rgba(${rgb}, 0.22)` }}
                    />

                    {/* Icon */}
                    <motion.div
                      className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border"
                      style={{
                        background: `rgba(${rgb}, 0.10)`,
                        borderColor: `rgba(${rgb}, 0.22)`,
                        boxShadow: `0 0 14px rgba(${rgb}, 0.12)`,
                      }}
                      whileHover={{ scale: 1.12, boxShadow: `0 0 28px rgba(${rgb}, 0.4)` }}
                      transition={{ duration: 0.25 }}
                    >
                      <Icon size={22} style={{ color }} />
                    </motion.div>

                    <h3 className="relative text-[0.95rem] font-extrabold text-white/88">{title}</h3>
                    <p className="relative mt-2.5 text-sm leading-relaxed text-white/42">{desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          LE SYSTÈME DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="relative border-t border-white/[0.05] bg-[#0b0b12] px-6 py-28 overflow-hidden">
        {/* Background orb */}
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[120px]" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-[rgba(124,111,205,0.025)] blur-[100px]" />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
          >
            <div className="grid items-center gap-16 lg:grid-cols-[1fr_480px]">

              {/* Text left */}
              <div>
                <motion.span
                  variants={fadeIn}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]"
                >
                  <Layers size={10} /> {lang === "fr" ? "L'approche DJAMA" : "The DJAMA approach"}
                </motion.span>
                <motion.h2 variants={fadeIn} className="display-section mt-4 text-white">
                  {lang === "fr" ? (
                    <>Plus qu&apos;un service.<br /><span className="text-gold">Un système complet.</span></>
                  ) : (
                    <>More than a service.<br /><span className="text-gold">A complete system.</span></>
                  )}
                </motion.h2>
                <motion.p variants={fadeIn} className="mt-5 max-w-md text-base leading-relaxed text-white/45">
                  {lang === "fr"
                    ? "Chez DJAMA, vous ne commandez pas une prestation isolée. Vous accédez à un écosystème : image, outils, accompagnement, performance."
                    : "At DJAMA, you don't just order a single service. You access an ecosystem: brand, tools, support, performance."}
                </motion.p>

                <motion.div variants={staggerContainerFast} className="mt-8 space-y-3">
                  {(lang === "fr" ? [
                    { label: "Création & Design",                 desc: "Site, app, visuels — une image premium qui convertit." },
                    { label: "Outils professionnels",             desc: "Factures, planning, bloc-notes — intégrés à votre workflow." },
                    { label: "Accompagnement",                    desc: "Administratif, fournisseurs, marchés — on gère à votre place." },
                    { label: "Coaching & montée en compétence",   desc: "IA, scolaire, numérique — vous progressez vraiment." },
                  ] : [
                    { label: "Creation & Design",     desc: "Website, app, visuals — a premium image that converts." },
                    { label: "Professional tools",    desc: "Invoices, scheduling, notes — integrated into your workflow." },
                    { label: "Support",               desc: "Admin, suppliers, tenders — we handle it for you." },
                    { label: "Coaching & upskilling", desc: "AI, academic, digital — you truly progress." },
                  ]).map(({ label, desc }, i) => (
                    <motion.div
                      key={label}
                      variants={cardReveal}
                      className="group flex items-start gap-4 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.025] p-4 transition-all duration-300 hover:border-[rgba(201,165,90,0.25)] hover:bg-[rgba(201,165,90,0.04)]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.1)] text-xs font-black text-[#c9a55a] transition-all duration-300 group-hover:bg-[rgba(201,165,90,0.18)]">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white/80">{label}</p>
                        <p className="mt-0.5 text-xs text-white/35">{desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={fadeIn} className="mt-8">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} className="inline-block">
                    <Link href="/contact" className="btn-primary">
                      {lang === "fr" ? "Parlons de votre projet" : "Let's talk about your project"}
                      <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                </motion.div>
              </div>

              {/* Visual right — system card */}
              <motion.div variants={cardRevealBlur}>
                <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.04] to-transparent p-8">
                  {/* Corner glow */}
                  <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[rgba(201,165,90,0.07)] blur-[80px]" />
                  <div className="pointer-events-none absolute left-0 bottom-0 h-48 w-48 rounded-full bg-[rgba(124,111,205,0.04)] blur-[60px]" />

                  <div className="relative">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/25">
                      {lang === "fr" ? "Ce que vous obtenez" : "What you get"}
                    </p>

                    <div className="mt-6 space-y-3">
                      {[
                        { icon: Code2,         color: "#7c6fcd", rgb: "124,111,205", label: lang === "fr" ? "Présence digitale"    : "Digital presence",    value: lang === "fr" ? "Site · App · E-commerce"          : "Website · App · E-commerce"    },
                        { icon: LayoutGrid,    color: "#34d399", rgb: "52,211,153",  label: lang === "fr" ? "Outils opérationnels" : "Operational tools",   value: lang === "fr" ? "Factures · Planning · Notes"       : "Invoices · Scheduling · Notes"  },
                        { icon: MessageSquare, color: "#f9a826", rgb: "249,168,38",  label: lang === "fr" ? "Accompagnement"       : "Support",             value: lang === "fr" ? "Admin · Fournisseurs · Marchés"    : "Admin · Suppliers · Tenders"    },
                        { icon: Sparkles,      color: "#c9a55a", rgb: "201,165,90",  label: "Coaching",                                                      value: lang === "fr" ? "IA · Scolaire · Numérique"         : "AI · Academic · Digital"        },
                        { icon: TrendingUp,    color: "#f87171", rgb: "248,113,113", label: lang === "fr" ? "Résultats"            : "Results",             value: lang === "fr" ? "Performance · Croissance · Clarté" : "Performance · Growth · Clarity"  },
                      ].map(({ icon: Icon, color, rgb, label, value }) => (
                        <motion.div
                          key={label}
                          className="group/row flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.22 }}
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover/row:scale-110"
                            style={{ background: `rgba(${rgb}, 0.12)`, border: `1px solid rgba(${rgb}, 0.22)` }}
                          >
                            <Icon size={15} style={{ color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[0.7rem] font-bold text-white/70">{label}</p>
                            <p className="truncate text-[0.6rem] text-white/30">{value}</p>
                          </div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <CheckCircle2 size={14} className="shrink-0 text-[#c9a55a]" />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.06)] px-4 py-3 text-center">
                      <p className="text-xs font-bold text-[#c9a55a]">
                        {lang === "fr"
                          ? "Devis gratuit · Réponse sous 24h · Sans engagement"
                          : "Free quote · Reply within 24h · No commitment"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-12 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.85, ease }}
            className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(201,165,90,0.18)] p-12 text-center"
            style={{
              background: "linear-gradient(145deg, rgba(201,165,90,0.08) 0%, rgba(9,9,11,0.9) 35%, rgba(124,111,205,0.05) 100%)",
              boxShadow: "0 0 80px rgba(201,165,90,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Background glows */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <motion.div
                className="h-64 w-96 rounded-full blur-[90px]"
                style={{ background: "rgba(201,165,90,0.07)" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="pointer-events-none absolute right-[10%] bottom-[10%] h-40 w-40 rounded-full bg-[rgba(124,111,205,0.05)] blur-[60px]" />

            {/* Top border highlight */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(201,165,90,0.5), transparent)" }}
            />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">
                <Sparkles size={10} /> {lang === "fr" ? "On vous attend" : "We're ready for you"}
              </span>

              <h2 className="display-section mt-5 text-white">
                {lang === "fr" ? "Parlons de votre projet." : "Let's talk about your project."}
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/45">
                {lang === "fr"
                  ? "Que vous ayez besoin d'un site, d'outils professionnels ou d'accompagnement — DJAMA vous aide à construire des solutions digitales modernes."
                  : "Whether you need a website, professional tools or expert guidance — DJAMA helps you build modern digital solutions."}
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
                  <Link href="/contact" className="btn-primary px-8 py-4 text-base">
                    {lang === "fr" ? "Demander un devis" : "Request a quote"}
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight size={17} />
                    </motion.span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
                  <Link
                    href="/abonnement"
                    className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/[0.1] bg-white/[0.05] px-8 py-4 text-base font-bold text-white/65 backdrop-blur-sm transition-all duration-300 hover:border-[rgba(201,165,90,0.28)] hover:bg-[rgba(201,165,90,0.07)] hover:text-white/90"
                  >
                    {lang === "fr" ? "Voir nos outils" : "View our tools"} <ChevronRight size={17} />
                  </Link>
                </motion.div>
              </div>

              {/* Trust signals */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                {[
                  { icon: Shield,     label: lang === "fr" ? "Devis gratuit"          : "Free quote"            },
                  { icon: Clock,      label: lang === "fr" ? "Réponse sous 24h"        : "Reply within 24h"     },
                  { icon: BadgeCheck, label: lang === "fr" ? "Sans engagement"         : "No commitment"        },
                  { icon: Star,       label: lang === "fr" ? "50+ clients satisfaits"  : "50+ satisfied clients" },
                ].map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    className="flex items-center gap-1.5 text-xs text-white/32"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <Icon size={12} className="text-[#c9a55a]" />
                    {label}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
