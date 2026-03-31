"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, ShoppingCart, Smartphone, LayoutDashboard,
  Video, ImageIcon, Megaphone, FileText, ClipboardList,
  BadgeCheck, NotebookPen, Briefcase, Brain, GraduationCap,
  ArrowRight, Sparkles, CheckCircle2,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import { services } from "@/content/services";

/* ─── Config visuelle par catégorie ─────────────── */
const CAT_CONFIG: Record<string, {
  gradient: string; glow: string; accent: string; label: string;
}> = {
  "Digital": {
    gradient: "from-[#0d0d1a] via-[#111132] to-[#1a1040]",
    glow: "rgba(124,111,205,0.25)",
    accent: "#7c6fcd",
    label: "Digital",
  },
  "Création de contenu": {
    gradient: "from-[#1a0a14] via-[#2a0f22] to-[#1e0e1a]",
    glow: "rgba(220,80,120,0.22)",
    accent: "#dc5078",
    label: "Création",
  },
  "Documents & Outils": {
    gradient: "from-[#001a14] via-[#002a20] to-[#001e18]",
    glow: "rgba(52,211,153,0.2)",
    accent: "#34d399",
    label: "Outils",
  },
  "Accompagnement": {
    gradient: "from-[#1a1000] via-[#2a1a00] to-[#1e1200]",
    glow: "rgba(249,168,38,0.22)",
    accent: "#f9a826",
    label: "Accompagnement",
  },
  "Coaching": {
    gradient: "from-[#0a0a0f] via-[#14100a] to-[#1a1408]",
    glow: "rgba(201,165,90,0.22)",
    accent: "#c9a55a",
    label: "Coaching",
  },
};

const CATEGORIES = ["Tous", ...Object.keys(CAT_CONFIG)];

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Visuel de carte (gradient + icône géante) ── */
function CardVisual({ icon: Icon, config }: {
  icon: React.ElementType;
  config: typeof CAT_CONFIG[string];
}) {
  return (
    <div className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${config.gradient}`}>
      {/* Grille subtile */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      {/* Glow central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="h-28 w-28 rounded-full blur-2xl"
          style={{ background: config.glow }}
        />
      </div>
      {/* Icône */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{
            background: `${config.glow}`,
            borderColor: `${config.accent}30`,
            boxShadow: `0 0 24px ${config.glow}`,
          }}
        >
          <Icon size={32} style={{ color: config.accent }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Carte service premium ──────────────────────── */
function ServiceCard({ service }: { service: typeof services[0] }) {
  const config    = CAT_CONFIG[service.category];
  const href      = service.ctaHref ?? "/contact";
  const clickable = !!service.ctaHref;

  return (
    <motion.div
      layout
      variants={cardReveal}
      className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(9,9,11,0.05)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_56px_rgba(9,9,11,0.12)] hover:border-[rgba(201,165,90,0.2)] ${clickable ? "cursor-pointer" : ""}`}
    >
      {/* ── Overlay de clic sur toute la carte ── */}
      {clickable && (
        <Link
          href={href}
          className="absolute inset-0 z-10 rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,165,90,0.6)]"
          aria-label={`${service.ctaLabel ?? "Voir"} — ${service.title}`}
        />
      )}

      {/* Anneau gold au hover (visible seulement si cliquable) */}
      {clickable && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[1.5rem] opacity-0 ring-2 ring-[rgba(201,165,90,0.45)] transition-opacity duration-300 group-hover:opacity-100"
        />
      )}

      {/* Visuel haut */}
      <CardVisual icon={service.icon} config={config} />

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-6">
        {/* Badge catégorie */}
        <span
          className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
          style={{
            background: `${config.glow}`,
            color: config.accent,
            border: `1px solid ${config.accent}30`,
          }}
        >
          {config.label}
        </span>

        {/* Titre */}
        <h2 className="text-lg font-extrabold leading-tight text-[var(--ink)]">
          {service.title}
        </h2>

        {/* Excerpt */}
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
          {service.excerpt}
        </p>

        {/* Highlights */}
        <ul className="mt-4 space-y-1.5">
          {service.highlights.slice(0, 3).map((h) => (
            <li key={h} className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <CheckCircle2 size={12} className="flex-shrink-0" style={{ color: config.accent }} />
              {h}
            </li>
          ))}
        </ul>

        {/* CTA — au-dessus de l'overlay grâce à z-20 */}
        <Link
          href={href}
          className="relative z-20 mt-5 inline-flex items-center gap-1.5 text-sm font-bold transition-all duration-300 group-hover:gap-3"
          style={{ color: config.accent }}
        >
          {service.ctaLabel ?? "En savoir plus"}
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Bordure du bas colorée au hover */}
      <div
        className="absolute inset-x-0 bottom-0 h-[2px] scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)` }}
      />
    </motion.div>
  );
}

/* ─── Filtre catégories ──────────────────────────── */
function CategoryFilter({ active, onChange }: { active: string; onChange: (c: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease, delay: 0.5 }}
      className="flex flex-wrap justify-center gap-2"
    >
      {CATEGORIES.map((cat) => {
        const isActive = active === cat;
        const config = cat !== "Tous" ? CAT_CONFIG[cat] : null;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className="relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300"
            style={{
              background: isActive
                ? config ? config.glow : "rgba(201,165,90,0.12)"
                : "transparent",
              color: isActive
                ? config ? config.accent : "#c9a55a"
                : "var(--muted)",
              border: isActive
                ? `1px solid ${config ? config.accent + "40" : "rgba(201,165,90,0.3)"}`
                : "1px solid transparent",
            }}
          >
            {cat === "Tous" ? "Tous les services" : cat}
          </button>
        );
      })}
    </motion.div>
  );
}

/* ─── PAGE ───────────────────────────────────────── */
export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState("Tous");

  const filtered = activeCategory === "Tous"
    ? services
    : services.filter((s) => s.category === activeCategory);

  return (
    <div className="bg-white">

      {/* ══ HERO ══════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-24 pt-32">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[500px] w-[600px] rounded-full bg-[rgba(176,141,87,0.1)] blur-[100px]" />
        </div>
        <div className="pointer-events-none absolute right-[-100px] top-[20%] h-[350px] w-[350px] rounded-full bg-[rgba(124,111,205,0.08)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(176,141,87,0.25)] bg-[rgba(176,141,87,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <Sparkles size={11} />
            Services professionnels
          </motion.div>

          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Ce que nous", "faisons, mieux", "que personne."]}
              highlight={2}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal delay={0.6} as="p" className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/55">
            Une offre complète — du digital à l&apos;accompagnement — pensée pour les
            indépendants, entrepreneurs et entreprises qui veulent aller plus loin.
          </FadeReveal>

          <FadeReveal delay={0.75} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">
              Démarrer un projet <ArrowRight size={16} />
            </Link>
            <Link href="#services" className="btn-ghost">
              Explorer les services
            </Link>
          </FadeReveal>

          {/* Stats inline */}
          <FadeReveal delay={0.9} className="mt-12 flex flex-wrap justify-center gap-8 border-t border-white/8 pt-10">
            {[
              { value: `${services.length}`, label: "services disponibles" },
              { value: "5",                   label: "catégories" },
              { value: "50+",                 label: "clients accompagnés" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="mt-0.5 text-xs text-white/40">{label}</p>
              </div>
            ))}
          </FadeReveal>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══ FILTRES + GRILLE ══════════════════════ */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-20">

        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial="hidden"
            animate="visible"
            variants={staggerContainerFast}
            className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filtered.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* CTA bas de page */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease }}
          className="mt-20 overflow-hidden rounded-[2rem] border border-[rgba(176,141,87,0.2)] bg-[var(--ink)] p-10 text-center"
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[200px] w-[400px] rounded-full bg-[rgba(176,141,87,0.08)] blur-[60px]" />
          </div>
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-widest text-[#c9a55a]">
              Besoin d&apos;un service sur mesure ?
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-white">
              Discutons de votre projet.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-white/50">
              Chaque projet est unique. Prenons le temps d&apos;en discuter ensemble.
            </p>
            <Link href="/contact" className="btn-primary mt-6 inline-flex">
              Nous contacter <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
