"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, CheckCircle2, Zap, Users, Users2, TrendingUp,
  Shield, Clock, Settings2, MessageSquare, Star, BadgeCheck,
  Code2, LayoutGrid, Layers, ChevronRight, HeartHandshake,
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
   DESIGN SYSTEM PAR CATÉGORIE — light cards with accent border
───────────────────────────────────────────────────────── */
const CAT_CONFIG = {
  "Digital": {
    bg:          "from-[#080814] via-[#0d0d26] to-[#101030]",
    glow:        "rgba(124,111,205,0.30)",
    glowDark:    "rgba(124,111,205,0.15)",
    accent:      "#7c6fcd",
    accentRgb:   "124,111,205",
    border:      "rgba(124,111,205,0.28)",
    hoverShadow: "0 32px 72px rgba(124,111,205,0.18), 0 8px 20px rgba(0,0,0,0.08)",
    label:       "Digital",
    emoji:       "◆",
  },
  "Création de contenu": {
    bg:          "from-[#160810] via-[#220c1c] to-[#1c0a16]",
    glow:        "rgba(220,80,120,0.28)",
    glowDark:    "rgba(220,80,120,0.14)",
    accent:      "#dc5078",
    accentRgb:   "220,80,120",
    border:      "rgba(220,80,120,0.28)",
    hoverShadow: "0 32px 72px rgba(220,80,120,0.16), 0 8px 20px rgba(0,0,0,0.08)",
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
    hoverShadow: "0 32px 72px rgba(52,211,153,0.14), 0 8px 20px rgba(0,0,0,0.08)",
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
    hoverShadow: "0 32px 72px rgba(249,168,38,0.14), 0 8px 20px rgba(0,0,0,0.08)",
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
    hoverShadow: "0 32px 72px rgba(201,165,90,0.16), 0 8px 20px rgba(0,0,0,0.08)",
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
   SERVICE CARD — light glassmorphism
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
        className="relative flex flex-col overflow-hidden rounded-[1.75rem] border bg-white transition-shadow duration-500 shadow-[0_2px_10px_rgba(0,0,0,.06)]"
        style={{
          borderColor: isOutil ? config.border : "rgba(0,0,0,0.08)",
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
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
          />
        </div>

        {/* Top highlight edge on hover */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${config.accentRgb}, 0.9), transparent)` }}
        />

        {/* Overlay — whole card is clickable */}
        <Link href={href} className="absolute inset-0 z-0" aria-label={service.title} tabIndex={-1} />

        {isSiteVitrine || isAppMobile || isSiteEcommerce || isAutomatisationIA || isPlateformeWeb || isMontageVideo || isRetouchePhoto || isVisuelsPublicitaires || isMarchesPublics || isAssistanceAdmin || isDeclarationsUrssaf || isFournisseurs || isCreationAutoEntre || isCoachingIA || isSoutienScolaire ? (
          <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <Image
              src={
                isSiteVitrine          ? "/services-vitrine.jpg"               :
                isAppMobile            ? "/services-app-mobile.jpg"            :
                isSiteEcommerce        ? "/services-ecommerce.jpg"             :
                isAutomatisationIA     ? "/services-automatisation.jpg"        :
                isPlateformeWeb        ? "/services-plateforme.jpg"            :
                isMontageVideo         ? "/services-montage-video.jpg"         :
                isRetouchePhoto        ? "/services-retouche-photo.jpg"        :
                isVisuelsPublicitaires ? "/services-visuels-pub.jpg"           :
                isMarchesPublics       ? "/services-marches-publics.jpg"       :
                isAssistanceAdmin      ? "/services-assistance-admin.jpg"      :
                isDeclarationsUrssaf   ? "/services-declarations-urssaf.jpg"   :
                isFournisseurs         ? "/services-fournisseurs.jpg"          :
                isCreationAutoEntre    ? "/services-creation-auto-entre.jpg"   :
                isCoachingIA           ? "/services-coaching-ia.jpg"           :
                                         "/services-soutien-scolaire.jpg"
              }
              alt={
                isSiteVitrine          ? "Création de site vitrine — DJAMA"              :
                isAppMobile            ? "Application mobile iOS/Android — DJAMA"        :
                isSiteEcommerce        ? "Site e-commerce performant — DJAMA"            :
                isAutomatisationIA     ? "Automatisation & IA — DJAMA"                   :
                isPlateformeWeb        ? "Plateforme web sur mesure — DJAMA"             :
                isMontageVideo         ? "Montage vidéo professionnel — DJAMA"           :
                isRetouchePhoto        ? "Retouche photo professionnelle — DJAMA"        :
                isVisuelsPublicitaires ? "Visuels publicitaires percutants — DJAMA"      :
                isMarchesPublics       ? "Marchés publics & privés — DJAMA"              :
                isAssistanceAdmin      ? "Assistance administrative — DJAMA"             :
                isDeclarationsUrssaf   ? "Déclarations URSSAF simplifiées — DJAMA"       :
                isFournisseurs         ? "Recherche fournisseurs internationaux — DJAMA" :
                isCreationAutoEntre    ? "Création auto-entrepreneur — DJAMA"            :
                isCoachingIA           ? "Coaching IA — DJAMA"                           :
                                         "Soutien scolaire — DJAMA"
              }
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 100vw, 480px"
            />
          </div>
        ) : (
          <CardVisual icon={Icon} config={config} />
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
                  color: isOutil ? config.accent : "rgba(0,0,0,0.35)",
                  border: isOutil ? `1px solid rgba(${config.accentRgb}, 0.22)` : "none",
                }}
              >
                {priceTag}
              </span>
            )}
          </div>

          <h2 className="text-[1.05rem] font-extrabold leading-snug text-gray-800">
            <WordLift text={service.title} yOffset={4} stagger={25} hoverColor="rgba(0,0,0,1)" />
          </h2>

          <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
            {excerpt}
          </p>

          {extraBullets.length > 0 && (
            <ul className="mt-5 space-y-2">
              {extraBullets.map((hl) => (
                <li key={hl} className="flex items-start gap-2 text-xs text-gray-600">
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
              style={{ background: config.accent, color: "#fff" }}
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
   FILTRE CATÉGORIES — icon tab bar
───────────────────────────────────────────────────────── */
const CAT_FILTER_ICONS: Record<string, React.ElementType> = {
  all:                    LayoutGrid,
  Digital:                Code2,
  "Création de contenu":  Sparkles,
  "Documents & Outils":   BadgeCheck,
  Accompagnement:         Users,
  Coaching:               Star,
};

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
    "all", "Digital", "Création de contenu", "Accompagnement",
  ];

  return (
    <div className="relative mb-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.25 }}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CATEGORIES.map((cat) => {
          const isActive = active === cat;
          const config   = cat !== "all" ? CAT_CONFIG[cat as CatKey] : null;
          const count    = counts[cat] ?? 0;
          const label    = cat === "all" ? (filterLabels["all"] ?? "Tout") : (filterLabels[cat] ?? (config ? config.label : cat));
          const Icon     = CAT_FILTER_ICONS[cat] ?? Code2;

          return (
            <motion.button
              key={cat}
              onClick={() => onChange(cat)}
              whileTap={{ scale: 0.94 }}
              className="relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200"
              style={{
                color: isActive
                  ? config ? config.accent : "#c9a55a"
                  : "rgba(0,0,0,0.45)",
                background: isActive
                  ? config ? `rgba(${config.accentRgb}, 0.08)` : "rgba(201,165,90,0.08)"
                  : "rgba(0,0,0,0.03)",
                border: `1.5px solid ${
                  isActive
                    ? config ? config.border : "rgba(201,165,90,0.32)"
                    : "rgba(0,0,0,0.07)"
                }`,
              }}
            >
              {/* Sliding active background */}
              {isActive && (
                <motion.span
                  layoutId="cat-filter-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: config
                      ? `rgba(${config.accentRgb}, 0.06)`
                      : "rgba(201,165,90,0.06)",
                  }}
                  transition={{ type: "spring", bounce: 0.14, duration: 0.44 }}
                />
              )}
              <Icon
                size={13}
                className="relative z-10"
                style={{ opacity: isActive ? 1 : 0.55 }}
              />
              <span className="relative z-10">{label}</span>
              <span
                className="relative z-10 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[0.52rem] font-black"
                style={{
                  background: isActive
                    ? config ? `rgba(${config.accentRgb}, 0.15)` : "rgba(201,165,90,0.15)"
                    : "rgba(0,0,0,0.06)",
                  color: isActive
                    ? config ? config.accent : "#c9a55a"
                    : "rgba(0,0,0,0.3)",
                }}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
      {/* Scroll-fade hint on mobile */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent sm:hidden" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DONNÉES STATIQUES FALLBACK
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
  /* ── Accompagnement ── */
  { id:"s10", slug:"creation-auto-entrepreneur",   title:"Création auto-entrepreneur",           category:"Accompagnement",      price:"Dès 49 €",        description:"Immatriculation complète, choix du statut juridique, conseil personnalisé et démarches administratives.\nRéponse sous 24h.", active:true, sort_order:10, created_at:NOW },
  { id:"s11", slug:"declarations-urssaf",          title:"Déclarations URSSAF",                  category:"Accompagnement",      price:"Dès 29 €/mois",   description:"Déclarations mensuelles ou trimestrielles, suivi des cotisations sociales, assistance en cas de contrôle.\nSuivi personnalisé.", active:true, sort_order:11, created_at:NOW },
  { id:"s12", slug:"assistance-administrative",    title:"Assistance administrative",            category:"Accompagnement",      price:"Sur devis",       description:"Rédaction de courriers, démarches administratives complexes, gestion documentaire professionnelle.\nPour entreprises et particuliers.", active:true, sort_order:12, created_at:NOW },
  { id:"s13", slug:"recherche-fournisseurs",       title:"Recherche fournisseurs internationaux",category:"Accompagnement",      price:"Sur devis",       description:"Identification, sélection et mise en relation avec des fournisseurs qualifiés à l'international (Asie, Europe, Afrique).\nNégociation incluse.", active:true, sort_order:13, created_at:NOW },
  { id:"s14", slug:"marches-publics",              title:"Marchés publics & privés",             category:"Accompagnement",      price:"Sur devis",       description:"Veille sur les appels d'offres, constitution de dossiers de candidature complets, conseil stratégique.\nTaux de réussite élevé.", active:true, sort_order:14, created_at:NOW },
  /* ── Coaching ── */
  { id:"s16", slug:"soutien-scolaire",             title:"Soutien scolaire",                     category:"Accompagnement",            price:"14 €/heure",      description:"Cours particuliers toutes matières, collège et lycée, présentiel ou en ligne.\nSuivi régulier et progression garantie.", active:true, sort_order:16, created_at:NOW },
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

  // Coaching est fusionné dans Accompagnement côté affichage
  const normalizeCategory = (cat: string) => cat === "Coaching" ? "Accompagnement" : cat;

  const filtered = activeCategory === "all"
    ? rows
    : rows.filter((sv) => normalizeCategory(sv.category) === activeCategory);

  const isVisible = (sv: ServiceRow) =>
    sv.slug !== "coaching-ia" &&
    sv.title !== "Coaching IA" &&
    sv.category !== "Documents & Outils";

  const counts = (["Digital", "Création de contenu", "Accompagnement"] as CatKey[]).reduce((acc, cat) => {
    acc[cat] = rows.filter((sv) => isVisible(sv) && normalizeCategory(sv.category) === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════════
          HERO — style homepage
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white px-5 pb-14 pt-[108px] sm:pb-20 sm:pt-[132px]">

        {/* Orbes */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="hero-orb-1 absolute -top-32 -right-24 h-[480px] w-[480px] rounded-full blur-[90px]"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 68%)" }} />
          <div className="hero-orb-2 absolute -bottom-16 -left-28 h-[380px] w-[380px] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, rgba(201,165,90,0.18) 0%, transparent 68%)" }} />
          <div className="hero-orb-3 absolute top-0 left-1/2 -translate-x-1/2 h-[340px] w-[560px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)" }} />
        </div>

        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-10 mx-auto max-w-md text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeIn}
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em]"
            style={{ borderColor: "rgba(201,165,90,0.25)", background: "rgba(201,165,90,0.07)", color: "#c9a55a" }}
          >
            <Sparkles size={11} /> {s.hero.badge}
          </motion.div>

          {/* Titre */}
          <motion.h1 variants={fadeIn}
            className="text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-[3.4rem]"
          >
            {lang === "fr" ? "Nos services," : "Our services,"}<br />
            <span className="relative inline whitespace-nowrap">
              <span aria-hidden className="hero-marker absolute inset-x-[-2px] bottom-[2px]"
                style={{ height: "38%", background: "linear-gradient(90deg,rgba(201,165,90,0.72) 0%,rgba(201,165,90,0.38) 100%)", borderRadius: "4px", zIndex: 0 }} />
              <span className="relative z-10">{lang === "fr" ? "votre croissance" : "your growth"}</span>
            </span>.
          </motion.h1>

          {/* Sous-titre */}
          <motion.p variants={fadeIn} className="mt-5 text-[1rem] font-medium text-gray-500">
            {lang === "fr"
              ? "Du site web à l'accompagnement administratif — tout ce dont vous avez besoin pour avancer."
              : "From website to business support — everything you need to grow."}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeIn} className="mt-9 flex flex-col gap-3">
            <Link href="/contact"
              className="hero-btn w-full rounded-2xl py-4 text-center text-[1rem] font-bold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.015] active:scale-[.98]"
            >
              {lang === "fr" ? "Démarrer un projet →" : "Start a project →"}
            </Link>
            <Link href="#services"
              className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-center text-[1rem] font-semibold text-gray-500 shadow-sm transition-all duration-200 hover:border-gray-300 hover:text-gray-700 active:scale-[.98]"
            >
              {lang === "fr" ? "Explorer les services" : "Explore services"}
            </Link>
          </motion.div>

          {/* Stats cards */}
          <motion.div variants={fadeIn}
            className="mt-9 grid grid-cols-3 gap-3 border-t border-gray-100 pt-6"
          >
            {([
              { value: "14", label: lang === "fr" ? "services\ndisponibles" : "services\navailable", Icon: Layers },
              { value: "50+",  label: lang === "fr" ? "clients\naccompagnés" : "clients\nsupported",  Icon: Users2  },
              { value: "24h",  label: lang === "fr" ? "délai de\nréponse"    : "response\ntime",       Icon: Zap     },
            ] as const).map(({ value, label, Icon }) => (
              <div key={label}
                className="flex flex-col items-center gap-2.5 rounded-2xl px-2 py-4"
                style={{ background: "rgba(201,165,90,0.06)" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(201,165,90,0.12)", color: "#c9a55a" }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[1.3rem] font-extrabold leading-none text-gray-900">{value}</span>
                <span className="text-center text-[0.68rem] leading-snug text-gray-500" style={{ whiteSpace: "pre-line" }}>{label}</span>
              </div>
            ))}
          </motion.div>


        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          CATALOGUE — header + filtres + grille
      ══════════════════════════════════════════════════ */}
      <section id="services" className="border-t border-gray-100 bg-white px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">

          {/* Header — left-aligned, bold */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.65, ease }}
            className="mb-10"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.24)] bg-[rgba(201,165,90,0.07)] px-3.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#c9a55a]">
              <Sparkles size={9} />
              {lang === "fr" ? "14 services disponibles" : "14 services available"}
            </span>
            <h2 className="mt-4 text-[2rem] font-extrabold leading-[1.12] text-gray-900 sm:text-[2.5rem]">
              {lang === "fr"
                ? <>Tous nos <span style={{ color: "#c9a55a" }}>services</span></>
                : <>All our <span style={{ color: "#c9a55a" }}>services</span></>}
            </h2>
            <p className="mt-2.5 max-w-xl text-[0.92rem] leading-relaxed text-gray-500">
              {lang === "fr"
                ? "Choisissez une catégorie pour filtrer, ou parcourez l'intégralité de notre offre."
                : "Pick a category to filter, or browse our full offering."}
            </p>
          </motion.div>

          <CategoryFilter
            active={activeCategory}
            onChange={setActiveCategory}
            counts={{ ...counts, all: rows.filter(isVisible).length }}
            filterLabels={s.filters}
          />

          {loading ? (
            <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[340px] animate-pulse rounded-[1.75rem] border border-gray-200 bg-gray-100"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : fetchErr ? (
            <div className="rounded-2xl border border-[rgba(248,113,113,0.18)] bg-[rgba(248,113,113,0.07)] px-6 py-8 text-center">
              <p className="text-sm font-bold text-[#f87171]">Impossible de charger les services</p>
              <p className="mt-1 text-xs text-gray-500">{fetchErr}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial="hidden"
                animate="visible"
                variants={staggerContainerFast}
                className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {filtered
                  .filter(sv =>
                    sv.slug !== "coaching-ia" &&
                    sv.title !== "Coaching IA" &&
                    sv.category !== "Documents & Outils"
                  )
                  .map((service) => (
                    <ServiceCard key={service.id} service={service} lang={lang} />
                  ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SCHÉMA ANIMÉ — Processus DJAMA
      ══════════════════════════════════════════════════ */}
      <section
        className="border-t border-gray-100 px-6 py-20 sm:py-28"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#1e1035 100%)" }}
      >
        {/* Gold top line */}
        <div className="h-[3px] w-full mb-0 -mt-20 sm:-mt-28"
          style={{ background: "linear-gradient(90deg,transparent,#c9a55a,transparent)" }}
        />
        <div className="mx-auto max-w-5xl pt-20 sm:pt-28">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="mb-16 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.30)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#c9a55a]">
              <Sparkles size={9} /> {lang === "fr" ? "Notre approche" : "Our approach"}
            </span>
            <h2 className="mt-4 text-[2rem] font-extrabold leading-[1.12] text-white sm:text-[2.5rem]">
              {lang === "fr"
                ? <>Votre projet, <span style={{ color: "#c9a55a" }}>notre mission.</span></>
                : <>Your project, <span style={{ color: "#c9a55a" }}>our mission.</span></>}
            </h2>
            <p className="mt-3 text-[0.9rem] text-white/45">
              {lang === "fr"
                ? "Un processus simple, transparent et orienté résultats."
                : "A simple, transparent, results-driven process."}
            </p>
          </motion.div>

          {/* 3-step schema */}
          <div className="flex flex-col items-center gap-0 sm:flex-row sm:items-start sm:justify-between">
            {([
              {
                num: "01",
                icon: MessageSquare,
                color: "#7c6fcd",
                rgb: "124,111,205",
                title: lang === "fr" ? "Votre besoin" : "Your need",
                desc:  lang === "fr" ? "15 min d'échange pour cerner votre projet et vos objectifs." : "15-min call to understand your project and goals.",
              },
              {
                num: "02",
                icon: Zap,
                color: "#c9a55a",
                rgb: "201,165,90",
                title: lang === "fr" ? "DJAMA réalise" : "DJAMA delivers",
                desc:  lang === "fr" ? "Notre équipe conçoit, développe et livre avec soin." : "Our team designs, builds and delivers with care.",
              },
              {
                num: "03",
                icon: TrendingUp,
                color: "#34d399",
                rgb: "52,211,153",
                title: lang === "fr" ? "Vos résultats" : "Your results",
                desc:  lang === "fr" ? "Image renforcée, performance mesurable, objectifs atteints." : "Stronger brand, measurable performance, goals reached.",
              },
            ] as const).map((step, i) => (
              <Fragment key={step.num}>
                {/* Step node */}
                <motion.div
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.55, ease, delay: i * 0.18 }}
                  className="flex w-full flex-col items-center text-center sm:w-[28%]"
                >
                  {/* Step number */}
                  <span
                    className="mb-3 text-[0.58rem] font-black tracking-[0.22em]"
                    style={{ color: `rgba(${step.rgb},0.55)` }}
                  >
                    {step.num}
                  </span>

                  {/* Glow icon */}
                  <motion.div
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl"
                    style={{
                      background: `rgba(${step.rgb},0.12)`,
                      border: `1.5px solid rgba(${step.rgb},0.28)`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 0px rgba(${step.rgb},0)`,
                        `0 0 28px rgba(${step.rgb},0.30)`,
                        `0 0 0px rgba(${step.rgb},0)`,
                      ],
                    }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.9 }}
                  >
                    <step.icon size={28} style={{ color: step.color }} />
                  </motion.div>

                  <p className="mt-4 text-[0.95rem] font-extrabold text-white">{step.title}</p>
                  <p className="mt-1.5 max-w-[200px] text-[0.76rem] leading-snug text-white/45">{step.desc}</p>
                </motion.div>

                {/* Animated connector arrow */}
                {i < 2 && (
                  <div className="flex shrink-0 items-center justify-center py-4 sm:mt-[36px] sm:w-[8%] sm:py-0">
                    {/* Vertical — mobile */}
                    <motion.div
                      className="h-10 w-px sm:hidden"
                      initial={{ scaleY: 0, opacity: 0 }}
                      whileInView={{ scaleY: 1, opacity: 1 }}
                      viewport={viewport}
                      transition={{ duration: 0.5, ease, delay: i * 0.18 + 0.28 }}
                      style={{ background: "linear-gradient(180deg,rgba(201,165,90,0.12),rgba(201,165,90,0.5),rgba(201,165,90,0.12))", transformOrigin: "top" }}
                    />
                    {/* Horizontal arrow — desktop */}
                    <motion.svg
                      className="hidden sm:block"
                      width="44" height="18" viewBox="0 0 44 18"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={viewport}
                      transition={{ duration: 0.3, delay: i * 0.18 + 0.22 }}
                    >
                      <motion.path
                        d="M2 9 L36 9 M29 3 L36 9 L29 15"
                        stroke="rgba(201,165,90,0.45)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={viewport}
                        transition={{ duration: 0.7, ease, delay: i * 0.18 + 0.3 }}
                      />
                    </motion.svg>
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          {/* Bottom 4-chip row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease, delay: 0.55 }}
            className="mt-16 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
          >
            {([
              { icon: Zap,             color: "#c9a55a", rgb: "201,165,90", label: lang === "fr" ? "Livraison rapide"     : "Fast delivery"         },
              { icon: Shield,          color: "#7c6fcd", rgb: "124,111,205", label: lang === "fr" ? "Qualité garantie"    : "Quality guaranteed"    },
              { icon: HeartHandshake,  color: "#34d399", rgb: "52,211,153",  label: lang === "fr" ? "Suivi personnalisé"  : "Personal follow-up"    },
              { icon: TrendingUp,      color: "#f9a826", rgb: "249,168,38",  label: lang === "fr" ? "Résultats mesurables": "Measurable results"    },
            ] as const).map(({ icon: Icon, color, rgb, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl px-3 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `rgba(${rgb},0.14)` }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <span className="text-[0.73rem] font-semibold text-white/65">{label}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MARQUEE — services défilants
      ══════════════════════════════════════════════════ */}
      <section className="overflow-hidden border-t border-gray-100 bg-white py-12">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent" />

        {(() => {
          const ROW1 = [
            { icon: Code2,         color: "#7c6fcd", label: lang === "fr" ? "Site vitrine"               : "Website"              },
            { icon: Sparkles,      color: "#dc5078", label: lang === "fr" ? "E-commerce"                 : "E-commerce"           },
            { icon: MessageSquare, color: "#f9a826", label: lang === "fr" ? "Application mobile"         : "Mobile app"           },
            { icon: Layers,        color: "#7c6fcd", label: lang === "fr" ? "Plateforme web"             : "Web platform"         },
            { icon: Zap,           color: "#c9a55a", label: lang === "fr" ? "Automatisation & IA"        : "AI automation"        },
            { icon: TrendingUp,    color: "#34d399", label: lang === "fr" ? "Montage vidéo"              : "Video editing"        },
            { icon: Star,          color: "#f9a826", label: lang === "fr" ? "Retouche photo"             : "Photo retouching"     },
          ];
          const ROW2 = [
            { icon: BadgeCheck,    color: "#34d399", label: lang === "fr" ? "Visuels publicitaires"      : "Ad visuals"           },
            { icon: Users,         color: "#f9a826", label: lang === "fr" ? "Soutien scolaire"           : "Tutoring"             },
            { icon: Shield,        color: "#7c6fcd", label: lang === "fr" ? "Création auto-entrepreneur" : "Business registration" },
            { icon: Clock,         color: "#dc5078", label: lang === "fr" ? "Déclarations URSSAF"        : "URSSAF declarations"  },
            { icon: Settings2,     color: "#c9a55a", label: lang === "fr" ? "Assistance administrative"  : "Admin assistance"     },
            { icon: ArrowRight,    color: "#34d399", label: lang === "fr" ? "Marchés publics"            : "Public tenders"       },
            { icon: Users2,        color: "#f9a826", label: lang === "fr" ? "Recherche fournisseurs"     : "Supplier sourcing"    },
          ];

          const Chip = ({ icon: Icon, color, label }: { icon: React.ElementType; color: string; label: string }) => (
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-[0.78rem] font-semibold text-gray-700 whitespace-nowrap">
              <Icon size={12} style={{ color }} />
              {label}
            </div>
          );

          return (
            <div className="flex flex-col gap-3">
              {/* Row 1 — scroll left */}
              <div className="flex overflow-hidden">
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 22, ease: "linear", repeat: Infinity }}
                  className="flex gap-3 pr-3"
                >
                  {[...ROW1, ...ROW1].map((c, i) => <Chip key={i} {...c} />)}
                </motion.div>
              </div>
              {/* Row 2 — scroll right */}
              <div className="flex overflow-hidden">
                <motion.div
                  animate={{ x: ["-50%", "0%"] }}
                  transition={{ duration: 26, ease: "linear", repeat: Infinity }}
                  className="flex gap-3 pr-3"
                >
                  {[...ROW2, ...ROW2].map((c, i) => <Chip key={i} {...c} />)}
                </motion.div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ══════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section className="border-t border-gray-200 px-6 py-12 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.85, ease }}
            className="relative overflow-hidden rounded-[2.5rem] p-12 text-center"
            style={{
              background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%)",
            }}
          >
            {/* Top border highlight */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
            />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white">
                <Sparkles size={10} /> {lang === "fr" ? "On vous attend" : "We're ready for you"}
              </span>

              <h2 className="display-section mt-5 text-white">
                {lang === "fr" ? "Parlons de votre projet." : "Let's talk about your project."}
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/80">
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
                    className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:bg-white/20"
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
                    className="flex items-center gap-1.5 text-xs text-white/70"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <Icon size={12} className="text-white/80" />
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
