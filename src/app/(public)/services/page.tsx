"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, CheckCircle2, Zap, Users, TrendingUp,
  Shield, Clock, Settings2, MessageSquare, Star, BadgeCheck,
  Code2, LayoutGrid, Layers, ChevronRight,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import {
  staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport,
} from "@/lib/animations";
import type { ServiceRow } from "@/types/db";
import { useLanguage } from "@/lib/language-context";
import { WordLift } from "@/components/ui/HoverText";

/* ─────────────────────────────────────────────────────────
   DESIGN SYSTEM PAR CATÉGORIE
───────────────────────────────────────────────────────── */
const CAT_CONFIG = {
  "Digital": {
    bg:       "from-[#080814] via-[#0d0d26] to-[#101030]",
    glow:     "rgba(124,111,205,0.30)",
    glowDark: "rgba(124,111,205,0.15)",
    accent:   "#7c6fcd",
    accentRgb:"124,111,205",
    border:   "rgba(124,111,205,0.28)",
    hoverShadow: "0 28px 64px rgba(124,111,205,0.20)",
    label:    "Digital",
    emoji:    "⚡",
  },
  "Création de contenu": {
    bg:       "from-[#160810] via-[#220c1c] to-[#1c0a16]",
    glow:     "rgba(220,80,120,0.28)",
    glowDark: "rgba(220,80,120,0.14)",
    accent:   "#dc5078",
    accentRgb:"220,80,120",
    border:   "rgba(220,80,120,0.28)",
    hoverShadow: "0 28px 64px rgba(220,80,120,0.18)",
    label:    "Création",
    emoji:    "✦",
  },
  "Documents & Outils": {
    bg:       "from-[#001412] via-[#001f1a] to-[#001815]",
    glow:     "rgba(52,211,153,0.26)",
    glowDark: "rgba(52,211,153,0.12)",
    accent:   "#34d399",
    accentRgb:"52,211,153",
    border:   "rgba(52,211,153,0.28)",
    hoverShadow: "0 28px 64px rgba(52,211,153,0.16)",
    label:    "Outils",
    emoji:    "◈",
  },
  "Accompagnement": {
    bg:       "from-[#160c00] via-[#221400] to-[#1c1000]",
    glow:     "rgba(249,168,38,0.26)",
    glowDark: "rgba(249,168,38,0.12)",
    accent:   "#f9a826",
    accentRgb:"249,168,38",
    border:   "rgba(249,168,38,0.28)",
    hoverShadow: "0 28px 64px rgba(249,168,38,0.16)",
    label:    "Accompagnement",
    emoji:    "◎",
  },
  "Coaching": {
    bg:       "from-[#0e0a02] via-[#160e04] to-[#1a1206]",
    glow:     "rgba(201,165,90,0.28)",
    glowDark: "rgba(201,165,90,0.13)",
    accent:   "#c9a55a",
    accentRgb:"201,165,90",
    border:   "rgba(201,165,90,0.28)",
    hoverShadow: "0 28px 64px rgba(201,165,90,0.18)",
    label:    "Coaching",
    emoji:    "◉",
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
   CARD VISUEL
───────────────────────────────────────────────────────── */
function CardVisual({ icon: Icon, config }: {
  icon: React.ElementType;
  config: typeof CAT_CONFIG[CatKey];
}) {
  return (
    <div className={`relative flex h-[200px] items-center justify-center overflow-hidden bg-gradient-to-br ${config.bg}`}>
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.05) 1.5px, transparent 0)",
        backgroundSize: "28px 28px",
      }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full blur-3xl" style={{ background: config.glow }} />
      </div>
      <div className="absolute right-6 top-4 h-20 w-20 rounded-full blur-2xl" style={{ background: config.glowDark }} />
      <div className="relative z-10">
        <div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border"
          style={{
            background: `rgba(${config.accentRgb}, 0.12)`,
            borderColor: config.border,
            boxShadow: `0 0 32px rgba(${config.accentRgb}, 0.22), inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          <Icon size={34} style={{ color: config.accent }} />
        </div>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${config.border}, transparent)` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SERVICE CARD
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
  const isDeclarationsUrssaf = service.slug === "declarations-urssaf"
                           || service.title === "Déclarations URSSAF";
  const isFournisseurs      = service.slug === "fournisseurs-internationaux"
                           || service.title === "Recherche de fournisseurs internationaux"
                           || service.title === "Recherche fournisseurs";

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
              : isFournisseurs
                ? "/services/recherche-fournisseurs"
                : "/contact";

  const priceTag = service.price || null;

  const bullets     = service.description.split(/\n+/).map((b) => b.trim()).filter(Boolean);
  const excerpt     = bullets[0] ?? service.description ?? "";
  const extraBullets = bullets.slice(1, 3);

  const ctaLabel = isOutil
    ? (lang === "en" ? "Get started" : "Commencer maintenant")
    : isCoachingIA
      ? (lang === "en" ? "Book your AI Coaching" : "Réserver votre Coaching IA")
      : isSoutienScolaire
        ? (lang === "en" ? "Book a trial lesson" : "Réserver votre cours d'essai")
        : (lang === "en" ? "Request a quote" : "Demander un devis");

  return (
    <motion.div
      layout
      variants={cardReveal}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border bg-[#09090b] transition-all duration-500"
      style={{
        borderColor: isOutil ? config.border : "rgba(255,255,255,0.07)",
        boxShadow: isOutil
          ? `0 4px 24px rgba(${config.accentRgb}, 0.12), 0 1px 0 rgba(255,255,255,0.04) inset`
          : "0 4px 16px rgba(0,0,0,0.4)",
      }}
      whileHover={{
        y: -8,
        boxShadow: config.hoverShadow,
        borderColor: config.border,
      }}
      transition={{ duration: 0.35, ease }}
    >
      {/* Overlay — toute la carte est cliquable */}
      <Link href={href} className="absolute inset-0 z-0" aria-label={service.title} tabIndex={-1} />
      <CardVisual icon={Icon} config={config} />

      {/* Bandeau "Espace client" pour les outils */}
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

      <div className="flex flex-1 flex-col p-7">
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

        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-white/40">
          {excerpt}
        </p>

        {extraBullets.length > 0 && (
          <ul className="mt-5 space-y-2">
            {extraBullets.map((hl) => (
              <li key={hl} className="flex items-start gap-2 text-xs text-white/50">
                <CheckCircle2
                  size={12}
                  className="mt-0.5 shrink-0"
                  style={{ color: config.accent }}
                />
                {hl}
              </li>
            ))}
          </ul>
        )}

        {/* ── CTA — deux styles selon category ── */}
        {isOutil ? (
          /* CTA solid pour les outils → conversion abonnement */
          <Link
            href={href}
            className="group/cta relative z-[1] mt-6 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: config.accent,
              color: "#09090b",
            }}
          >
            <span>{ctaLabel}</span>
            <ChevronRight size={16} className="transition-transform duration-300 group-hover/cta:translate-x-1" />
          </Link>
        ) : (
          /* CTA ghost pour les prestations */
          <Link
            href={href}
            className="group/cta relative z-[1] mt-6 flex items-center justify-between overflow-hidden rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300"
            style={{
              background: `rgba(${config.accentRgb}, 0.08)`,
              border: `1px solid rgba(${config.accentRgb}, 0.18)`,
              color: config.accent,
            }}
          >
            <span>{ctaLabel}</span>
            <ChevronRight size={16} className="transition-transform duration-300 group-hover/cta:translate-x-1" />
            <span
              className="absolute inset-0 -translate-x-full rounded-xl transition-transform duration-400 group-hover/cta:translate-x-0"
              style={{ background: `rgba(${config.accentRgb}, 0.10)` }}
            />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   FILTRE CATÉGORIES
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
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300"
            style={{
              background: isActive
                ? config ? `rgba(${config.accentRgb}, 0.12)` : "rgba(201,165,90,0.12)"
                : "rgba(255,255,255,0.03)",
              color: isActive
                ? config ? config.accent : "#c9a55a"
                : "rgba(255,255,255,0.35)",
              border: isActive
                ? `1px solid ${config ? config.border : "rgba(201,165,90,0.3)"}`
                : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span>{label}</span>
            <span
              className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.55rem] font-black"
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
          </button>
        );
      })}
    </motion.div>
  );
}

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
    // Appel à la route SERVEUR — lit les env vars au RUNTIME, pas au build.
    // Résout le problème "0 services en prod" causé par les NEXT_PUBLIC_* gravées vides.
    fetch("/api/services")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<ServiceRow[]>;
      })
      .then((d) => { setRows(d); setFetchErr(null); })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[ServicesPage] /api/services échoué :", msg);
        setFetchErr(msg);
        setRows([]);
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

  const WHY_ICONS = [Zap, TrendingUp, Users, Settings2, Shield, Clock] as const;
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
      <section className="relative overflow-hidden pb-32 pt-40">

        <div className="hero-grid absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[350px] w-[500px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[75px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]"
          >
            <Sparkles size={11} />
            {s.hero.badge}
          </motion.div>

          {/* Titre */}
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
            <Link href="/contact" className="btn-primary">
              {lang === "fr" ? "Démarrer un projet" : "Start a project"} <ArrowRight size={16} />
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/[0.1] bg-white/[0.05] px-7 py-[0.875rem] text-sm font-bold text-white/70 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              {lang === "fr" ? "Explorer les services" : "Explore services"}
            </Link>
          </FadeReveal>

          {/* Stats */}
          <FadeReveal delay={0.95} className="mt-14 flex flex-wrap justify-center gap-10 border-t border-white/[0.06] pt-12">
            {[
              { value: loading ? "…" : `${rows.length}`, label: lang === "fr" ? "services disponibles" : "services available" },
              { value: "5",                   label: lang === "fr" ? "pôles d'expertise"    : "areas of expertise" },
              { value: "50+",                 label: lang === "fr" ? "clients accompagnés"  : "clients supported"  },
              { value: "24h",                 label: lang === "fr" ? "délai de réponse"     : "response time"      },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black tracking-tight text-white">{value}</p>
                <p className="mt-0.5 text-xs text-white/30">{label}</p>
              </div>
            ))}
          </FadeReveal>

          {/* Chips catégories en bas du hero */}
          <FadeReveal delay={1.05} className="mt-10 flex flex-wrap justify-center gap-2">
            {(Object.keys(CAT_CONFIG) as CatKey[]).map((cat) => {
              const c = CAT_CONFIG[cat];
              return (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-bold"
                  style={{
                    background: `rgba(${c.accentRgb}, 0.08)`,
                    border: `1px solid rgba(${c.accentRgb}, 0.20)`,
                    color: c.accent,
                  }}
                >
                  {c.emoji} {c.label}
                </span>
              );
            })}
          </FadeReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FILTRES + GRILLE SERVICES
      ══════════════════════════════════════════════════ */}
      <section id="services" className="border-t border-white/[0.05] px-6 py-20">
        <div className="mx-auto max-w-6xl">

          {/* En-tête section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="mb-12 text-center"
          >
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/30">
              {lang === "fr" ? "Catalogue complet" : "Full catalogue"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-white/80">
              {lang === "fr" ? "Filtrez par catégorie" : "Filter by category"}
            </h2>
          </motion.div>

          <CategoryFilter
            active={activeCategory}
            onChange={setActiveCategory}
            counts={{ ...counts, all: rows.length }}
            filterLabels={s.filters}
          />

          {loading ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[380px] animate-pulse rounded-[1.75rem] border border-white/[0.06] bg-white/[0.02]" />
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
                className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {filtered.map((service) => (
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
      <section className="border-t border-white/[0.05] px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
          >
            {/* Header */}
            <div className="mb-16 text-center">
              <motion.span variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">
                <Star size={10} /> {s.whyUs.badge}
              </motion.span>
              <motion.h2 variants={fadeIn} className="display-section mt-4 text-white">
                {s.whyUs.title}
              </motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-base text-white/40">
                {lang === "fr" ? "Ce qui nous différencie, au-delà des mots." : "What actually sets us apart."}
              </motion.p>
            </div>

            {/* Grille 3×2 */}
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
                    variants={cardReveal}
                    className="group rounded-[1.5rem] border border-white/[0.07] bg-white/[0.03] p-7 transition-all duration-400 hover:border-white/[0.13] hover:bg-white/[0.05]"
                  >
                    <div
                      className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border"
                      style={{
                        background: `rgba(${rgb}, 0.10)`,
                        borderColor: `rgba(${rgb}, 0.22)`,
                      }}
                    >
                      <Icon size={22} style={{ color }} />
                    </div>
                    <h3 className="text-[0.95rem] font-extrabold text-white/85">{title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-white/40">{desc}</p>
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
      <section className="border-t border-white/[0.05] px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
          >
            <div className="grid items-center gap-16 lg:grid-cols-[1fr_480px]">

              {/* Texte gauche */}
              <div>
                <motion.span variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">
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
                    { label: "Creation & Design",   desc: "Website, app, visuals — a premium image that converts." },
                    { label: "Professional tools",  desc: "Invoices, scheduling, notes — integrated into your workflow." },
                    { label: "Support",             desc: "Admin, suppliers, tenders — we handle it for you." },
                    { label: "Coaching & upskilling", desc: "AI, academic, digital — you truly progress." },
                  ]).map(({ label, desc }, i) => (
                    <motion.div
                      key={label}
                      variants={cardReveal}
                      className="flex items-start gap-4 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] p-4 transition-all duration-300 hover:border-[rgba(201,165,90,0.22)] hover:bg-[rgba(201,165,90,0.04)]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.1)] text-xs font-black text-[#c9a55a]">
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
                  <Link href="/contact" className="btn-primary">
                    {lang === "fr" ? "Parlons de votre projet" : "Let's talk about your project"} <ArrowRight size={16} />
                  </Link>
                </motion.div>
              </div>

              {/* Visual droite — carte système */}
              <motion.div variants={cardReveal}>
                <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.05] to-transparent p-8">
                  <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[rgba(201,165,90,0.08)] blur-[80px]" />

                  <div className="relative">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/25">
                      {lang === "fr" ? "Ce que vous obtenez" : "What you get"}
                    </p>

                    <div className="mt-6 space-y-4">
                      {[
                        { icon: Code2,         color: "#7c6fcd", rgb: "124,111,205", label: lang === "fr" ? "Présence digitale"    : "Digital presence",    value: lang === "fr" ? "Site · App · E-commerce"          : "Website · App · E-commerce"        },
                        { icon: LayoutGrid,    color: "#34d399", rgb: "52,211,153",  label: lang === "fr" ? "Outils opérationnels" : "Operational tools",   value: lang === "fr" ? "Factures · Planning · Notes"       : "Invoices · Scheduling · Notes"      },
                        { icon: MessageSquare, color: "#f9a826", rgb: "249,168,38",  label: lang === "fr" ? "Accompagnement"       : "Support",             value: lang === "fr" ? "Admin · Fournisseurs · Marchés"    : "Admin · Suppliers · Tenders"        },
                        { icon: Sparkles,      color: "#c9a55a", rgb: "201,165,90",  label: "Coaching",                                                      value: lang === "fr" ? "IA · Scolaire · Numérique"         : "AI · Academic · Digital"            },
                        { icon: TrendingUp,    color: "#f87171", rgb: "248,113,113", label: lang === "fr" ? "Résultats"            : "Results",             value: lang === "fr" ? "Performance · Croissance · Clarté" : "Performance · Growth · Clarity"     },
                      ].map(({ icon: Icon, color, rgb, label, value }) => (
                        <div
                          key={label}
                          className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/[0.1]"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: `rgba(${rgb}, 0.12)`, border: `1px solid rgba(${rgb}, 0.22)` }}
                          >
                            <Icon size={15} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.7rem] font-bold text-white/70">{label}</p>
                            <p className="text-[0.6rem] text-white/30 truncate">{value}</p>
                          </div>
                          <CheckCircle2 size={14} className="shrink-0 text-[#c9a55a]" />
                        </div>
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
      <section className="border-t border-white/[0.05] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.8, ease }}
            className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(201,165,90,0.18)] bg-gradient-to-br from-[rgba(201,165,90,0.07)] via-transparent to-[rgba(124,111,205,0.06)] p-12 text-center"
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-96 rounded-full bg-[rgba(201,165,90,0.06)] blur-[80px]" />
            </div>

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
                <Link href="/contact" className="btn-primary px-8 py-4 text-base">
                  {lang === "fr" ? "Demander un devis" : "Request a quote"} <ArrowRight size={17} />
                </Link>
                <Link
                  href="/abonnement"
                  className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/[0.1] bg-white/[0.05] px-8 py-4 text-base font-bold text-white/65 backdrop-blur-sm transition-all duration-300 hover:border-[rgba(201,165,90,0.25)] hover:bg-[rgba(201,165,90,0.07)] hover:text-white/90"
                >
                  {lang === "fr" ? "Voir nos outils" : "View our tools"} <ChevronRight size={17} />
                </Link>
              </div>

              {/* Signaux de confiance */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                {[
                  { icon: Shield,     label: lang === "fr" ? "Devis gratuit"          : "Free quote"           },
                  { icon: Clock,      label: lang === "fr" ? "Réponse sous 24h"        : "Reply within 24h"    },
                  { icon: BadgeCheck, label: lang === "fr" ? "Sans engagement"         : "No commitment"       },
                  { icon: Star,       label: lang === "fr" ? "50+ clients satisfaits"  : "50+ satisfied clients"},
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-white/30">
                    <Icon size={12} className="text-[#c9a55a]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
