"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight, ExternalLink, Sparkles, CheckCircle2,
  Zap, Smartphone, Search, Users, ShoppingCart, Layout,
  Globe2, Star, TrendingUp, Shield, FileText,
  Lock, EyeOff, Code2, Wrench, HeartHandshake,
  MessageCircle, ReceiptText, Globe,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import {
  staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport,
} from "@/lib/animations";
import { useLanguage } from "@/lib/language-context";
import { WordLift, GlowReveal } from "@/components/ui/HoverText";

const ease = [0.16, 1, 0.3, 1] as const;

/* ══════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════ */
type FilterId = "all" | "web" | "mobile" | "ecommerce" | "tools" | "support" | "sourcing" | "design";

interface Project {
  id: string;
  filter: FilterId;
  category: string;
  name: string;
  type: string;
  description: string;
  url?: string;
  domain?: string;
  status: "live" | "private" | "confidential";
  gradient: string;
  glow: string;
  glowRgb: string;
  accent: string;
  accentDim: string;
  tags: string[];
  icon: React.ElementType;
  highlights: string[];
  clients?: string[];
  stats?: { label: string; value: string }[];
  mockLines?: { w: string; h: number; mb: number; opacity: number; radius?: number }[];
  kind: "app" | "web" | "service";
}

/* ══════════════════════════════════════════════════
   DONNÉES PROJETS
══════════════════════════════════════════════════ */
const PROJECTS: Project[] = [
  {
    id: "wewe",
    filter: "mobile",
    kind: "app",
    category: "Application mobile",
    name: "WEWE",
    type: "Application Android",
    status: "live",
    description:
      "Application mobile disponible sur Google Play. Interface moderne, expérience utilisateur fluide et fonctionnalités pensées pour le quotidien des utilisateurs.",
    url: "https://play.google.com/store/apps/details?id=com.wip.wewe.guis",
    gradient: "from-[#1a0d2e] via-[#1e0f3a] to-[#130a24]",
    glow: "rgba(139,92,246,0.28)",
    glowRgb: "139,92,246",
    accent: "#a78bfa",
    accentDim: "rgba(139,92,246,0.13)",
    tags: ["Android", "Google Play", "Mobile", "UX/UI"],
    icon: Smartphone,
    highlights: [
      "Disponible sur Google Play Store",
      "Interface intuitive mobile-first",
      "Expérience utilisateur optimisée",
      "Design moderne et performant",
    ],
    stats: [
      { label: "Plateforme", value: "Android" },
      { label: "Store", value: "Google Play" },
    ],
    mockLines: [
      { w: "70%", h: 14, mb: 6, opacity: 0.85 },
      { w: "50%", h: 9, mb: 16, opacity: 0.4 },
      { w: "100%", h: 7, mb: 4, opacity: 0.18 },
      { w: "80%", h: 7, mb: 4, opacity: 0.14 },
      { w: "90%", h: 7, mb: 14, opacity: 0.14 },
      { w: "40%", h: 30, mb: 0, opacity: 0.35, radius: 20 },
    ],
  },
  {
    id: "mondouka",
    filter: "ecommerce",
    kind: "web",
    category: "E-commerce",
    name: "Mondouka",
    type: "Boutique en ligne",
    status: "live",
    description:
      "Boutique en ligne moderne avec pages produits optimisées, panier intuitif et système de paiement sécurisé. Une expérience d'achat pensée pour convertir.",
    url: "https://mondouka.com",
    domain: "mondouka.com",
    gradient: "from-[#0d1a2a] via-[#0f2235] to-[#0a1928]",
    glow: "rgba(56,139,253,0.22)",
    glowRgb: "56,139,253",
    accent: "#3b9dff",
    accentDim: "rgba(59,157,255,0.14)",
    tags: ["Boutique", "Panier", "Paiement", "Responsive"],
    icon: ShoppingCart,
    highlights: [
      "Pages produits optimisées conversion",
      "Panier & paiement sécurisé intégrés",
      "Design responsive mobile-first",
      "Interface admin de gestion",
    ],
    stats: [
      { label: "Type", value: "E-commerce" },
      { label: "Mobile", value: "100% responsive" },
    ],
    mockLines: [
      { w: "60%", h: 16, mb: 7, opacity: 0.9 },
      { w: "40%", h: 10, mb: 18, opacity: 0.5 },
      { w: "100%", h: 7, mb: 4, opacity: 0.18 },
      { w: "85%", h: 7, mb: 4, opacity: 0.14 },
      { w: "92%", h: 7, mb: 14, opacity: 0.14 },
      { w: "30%", h: 32, mb: 0, opacity: 0.35, radius: 8 },
    ],
  },
  {
    id: "clamac",
    filter: "web",
    kind: "web",
    category: "Site vitrine",
    name: "Clamac",
    type: "Site vitrine professionnel",
    status: "live",
    description:
      "Site vitrine professionnel pour une entreprise orientée sourcing & B2B. Design épuré, impact immédiat, optimisé pour la confiance et la crédibilité.",
    url: "https://clamac.ae",
    domain: "clamac.ae",
    gradient: "from-[#0f1a10] via-[#152218] to-[#0d1a10]",
    glow: "rgba(52,211,153,0.2)",
    glowRgb: "52,211,153",
    accent: "#34d399",
    accentDim: "rgba(52,211,153,0.12)",
    tags: ["Vitrine", "B2B", "SEO", "Pro"],
    icon: Layout,
    highlights: [
      "Design épuré, identité de marque forte",
      "Structure SEO optimisée dès le départ",
      "Formulaire de contact & tunnel de conversion",
      "Hébergement & mise en ligne inclus",
    ],
    stats: [
      { label: "Type", value: "Site vitrine" },
      { label: "SEO", value: "Optimisé" },
    ],
    mockLines: [
      { w: "55%", h: 16, mb: 7, opacity: 0.9 },
      { w: "70%", h: 10, mb: 18, opacity: 0.44 },
      { w: "100%", h: 7, mb: 4, opacity: 0.17 },
      { w: "78%", h: 7, mb: 4, opacity: 0.13 },
      { w: "88%", h: 7, mb: 14, opacity: 0.13 },
      { w: "28%", h: 32, mb: 0, opacity: 0.3, radius: 8 },
    ],
  },
  {
    id: "djama-saas",
    filter: "tools",
    kind: "web",
    category: "Plateforme SaaS",
    name: "DJAMA Pro",
    type: "Espace client & outils",
    status: "live",
    description:
      "Plateforme SaaS interne regroupant les outils professionnels DJAMA : factures & devis PDF, planning, bloc-notes et espace client sécurisé.",
    gradient: "from-[#0e0a02] via-[#160e04] to-[#1a1206]",
    glow: "rgba(201,165,90,0.26)",
    glowRgb: "201,165,90",
    accent: "#c9a55a",
    accentDim: "rgba(201,165,90,0.12)",
    tags: ["SaaS", "Factures", "Planning", "Dashboard"],
    icon: ReceiptText,
    highlights: [
      "Génération de devis & factures PDF premium",
      "Planning & agenda avec gestion d'événements",
      "Bloc-notes professionnel synchronisé",
      "Espace client sécurisé avec authentification",
    ],
    stats: [
      { label: "Outils", value: "4 modules" },
      { label: "Type", value: "SaaS" },
    ],
    mockLines: [
      { w: "65%", h: 13, mb: 7, opacity: 0.8 },
      { w: "45%", h: 9, mb: 16, opacity: 0.45 },
      { w: "100%", h: 6, mb: 4, opacity: 0.16 },
      { w: "80%", h: 6, mb: 4, opacity: 0.12 },
      { w: "60%", h: 6, mb: 14, opacity: 0.12 },
      { w: "35%", h: 28, mb: 0, opacity: 0.32, radius: 6 },
    ],
  },
  {
    id: "admin",
    filter: "support",
    kind: "service",
    category: "Assistance administrative",
    name: "Entreprises accompagnées",
    type: "Démarches & dossiers",
    status: "confidential",
    description:
      "Gestion des démarches administratives, rédaction de documents officiels, constitution de dossiers et suivi complet pour le compte d'entreprises.",
    gradient: "from-[#1a1208] via-[#201508] to-[#171006]",
    glow: "rgba(249,168,38,0.2)",
    glowRgb: "249,168,38",
    accent: "#f9a826",
    accentDim: "rgba(249,168,38,0.12)",
    tags: ["Administratif", "Dossiers", "Marchés", "Documents"],
    icon: FileText,
    clients: ["EXTENSO MAYOTTE", "ESPACE PUB", "MYPHONE974"],
    highlights: [
      "Rédaction et mise en forme de documents officiels",
      "Suivi et gestion de dossiers complets",
      "Interface avec administrations et organismes",
      "Accompagnement marchés publics & privés",
    ],
    stats: [
      { label: "Clients", value: "3 entreprises" },
      { label: "Confidentialité", value: "Garantie" },
    ],
  },
  {
    id: "fournisseurs",
    filter: "sourcing",
    kind: "service",
    category: "Sourcing international",
    name: "Sourcing fournisseurs",
    type: "Chine · Turquie · Dubaï",
    status: "confidential",
    description:
      "Identification et qualification de fournisseurs en Chine, Turquie et Dubaï. Négociation, vérification des conditions, mise en relation directe et suivi.",
    gradient: "from-[#0d1820] via-[#0f1e2a] to-[#0b1520]",
    glow: "rgba(56,189,248,0.2)",
    glowRgb: "56,189,248",
    accent: "#38bdf8",
    accentDim: "rgba(56,189,248,0.11)",
    tags: ["Chine", "Turquie", "Dubaï", "Import", "Négo"],
    icon: Globe2,
    clients: ["SCAL", "EXTENSO MAYOTTE", "CLAMAC"],
    highlights: [
      "Sourcing qualifié sur 3 marchés internationaux",
      "Vérification et audit des fournisseurs",
      "Négociation des prix et conditions",
      "Suivi commandes et livraisons",
    ],
    stats: [
      { label: "Marchés", value: "3 pays" },
      { label: "Clients", value: "3 entreprises" },
    ],
  },
];

/* ══════════════════════════════════════════════════
   FILTRES
══════════════════════════════════════════════════ */
const FILTERS: { id: FilterId | "all"; label: string; icon: React.ElementType }[] = [
  { id: "all",       label: "Tous",          icon: Sparkles     },
  { id: "web",       label: "Sites web",     icon: Globe        },
  { id: "mobile",    label: "Mobile",        icon: Smartphone   },
  { id: "ecommerce", label: "E-commerce",    icon: ShoppingCart },
  { id: "tools",     label: "Outils pro",    icon: Wrench       },
  { id: "support",   label: "Accompagnement",icon: HeartHandshake },
  { id: "sourcing",  label: "Sourcing",      icon: Globe2       },
];

/* ══════════════════════════════════════════════════
   STATUT BADGE
══════════════════════════════════════════════════ */
const STATUS_CONFIG = {
  live:         { label: "En ligne",       color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.25)",  dot: true  },
  private:      { label: "Privé",          color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)",  dot: false },
  confidential: { label: "Confidentiel",   color: "#f9a826", bg: "rgba(249,168,38,0.12)",  border: "rgba(249,168,38,0.25)",  dot: false },
};

/* ══════════════════════════════════════════════════
   PHONE MOCKUP
══════════════════════════════════════════════════ */
function PhoneMockup({ project }: { project: Project }) {
  return (
    <div className="relative flex justify-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      style={{ transformOrigin: "center bottom" }}>
      <div className="relative w-[160px] rounded-[2.5rem] border-[3px] border-white/15 bg-[#0d0d14] shadow-2xl overflow-hidden">
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 w-16 h-4 rounded-full bg-[#0d0d14]" />
        <div className={`relative overflow-hidden bg-gradient-to-br ${project.gradient} px-4 py-10`} style={{ minHeight: 240 }}>
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl" style={{ background: project.glow }} />
          <div className="relative z-10 space-y-0">
            {project.mockLines?.map((line, i) => (
              <div key={i} className="rounded" style={{
                width: line.w, height: line.h, marginBottom: line.mb,
                background: `rgba(255,255,255,${line.opacity})`,
                borderRadius: line.radius ?? 4,
              }} />
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-4 right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
            style={{ background: project.accentDim }}>
            <project.icon size={17} style={{ color: project.accent }} />
          </div>
        </div>
        <div className="flex justify-center py-3">
          <div className="h-1 w-16 rounded-full bg-white/20" />
        </div>
      </div>
      <div className="absolute -bottom-4 left-1/2 h-8 w-32 -translate-x-1/2 rounded-full blur-xl opacity-40" style={{ background: project.glow }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   BROWSER MOCKUP
══════════════════════════════════════════════════ */
function BrowserMockup({ project }: { project: Project }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_56px_rgba(0,0,0,0.45)] transition-transform duration-700 group-hover:scale-[1.02]"
      style={{ transformOrigin: "center top" }}>
      {/* Barre navigateur */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.05] px-4 py-2.5">
        <div className="flex gap-1.5">
          {["rgba(255,95,86,0.6)","rgba(255,189,46,0.6)","rgba(39,201,63,0.6)"].map((c, i) => (
            <span key={i} className="h-2 w-2 rounded-full" style={{ background: c }} />
          ))}
        </div>
        {project.domain && (
          <div className="mx-auto flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: project.accent, opacity: 0.7 }} />
            <span className="text-[0.6rem] font-medium text-white/35">{project.domain}</span>
          </div>
        )}
      </div>
      {/* Contenu */}
      <div className={`bg-gradient-to-br ${project.gradient} p-5`} style={{ minHeight: 180 }}>
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl" style={{ background: project.glow }} />
        <div className="relative z-10">
          {project.mockLines?.map((line, i) => (
            <div key={i} className="rounded" style={{
              width: line.w, height: line.h, marginBottom: line.mb,
              background: `rgba(255,255,255,${line.opacity})`,
              borderRadius: line.radius ?? 4,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SERVICE VISUAL
══════════════════════════════════════════════════ */
function ServiceVisual({ project }: { project: Project }) {
  return (
    <div className={`relative flex h-full min-h-[200px] items-center justify-center overflow-hidden bg-gradient-to-br ${project.gradient}`}>
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.04) 1.5px, transparent 0)",
        backgroundSize: "24px 24px",
      }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full blur-3xl transition-all duration-700 group-hover:scale-125" style={{ background: project.glow }} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-110"
          style={{ background: project.accentDim, borderColor: `rgba(${project.glowRgb},0.3)`, boxShadow: `0 0 32px rgba(${project.glowRgb},0.2)` }}>
          <project.icon size={30} style={{ color: project.accent }} />
        </div>
        {project.clients && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {project.clients.map((c) => (
              <span key={c} className="rounded-full px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider"
                style={{ background: `rgba(${project.glowRgb},0.12)`, color: project.accent, border: `1px solid rgba(${project.glowRgb},0.25)` }}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROJECT CARD
══════════════════════════════════════════════════ */
function ProjectCard({ project }: { project: Project }) {
  const status = STATUS_CONFIG[project.status];
  const isConfidential = project.status === "confidential";

  return (
    <motion.div
      layout
      variants={cardReveal}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#0e0e10] transition-all duration-500 hover:border-white/[0.14]"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.45)" }}
      whileHover={{ y: -6, boxShadow: `0 28px 64px rgba(${project.glowRgb},0.18)` }}
    >
      {/* Glow au hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 60px rgba(${project.glowRgb},0.07)` }} />

      {/* Visuel */}
      <div className="relative overflow-hidden" style={{ aspectRatio: project.kind === "app" ? "4/3" : "16/9" }}>
        {project.kind === "app"   && <PhoneMockup   project={project} />}
        {project.kind === "web"   && <BrowserMockup project={project} />}
        {project.kind === "service" && <ServiceVisual project={project} />}

        {/* Badges status + catégorie */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
            style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
            {status.dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: status.color }} />}
            {!status.dot && <EyeOff size={9} />}
            {status.label}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <span className="rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider"
            style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {project.category}
          </span>
        </div>
      </div>

      {/* Séparateur lumineux */}
      <div className="h-px w-full opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${project.glowRgb},0.4), transparent)` }} />

      {/* Contenu */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Nom + type */}
        <div>
          <h3 className="text-xl font-extrabold text-white/90">
            <WordLift
              text={project.name}
              yOffset={4}
              stagger={22}
              hoverColor="rgba(255,255,255,1)"
            />
          </h3>
          <p className="mt-0.5 text-xs font-semibold" style={{ color: project.accent }}>
            {project.type}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-white/45">{project.description}</p>

        {/* Points clés */}
        <ul className="flex flex-col gap-1.5">
          {project.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-xs text-white/55">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: project.accent }} />
              {h}
            </li>
          ))}
        </ul>

        {/* Stats */}
        {project.stats && (
          <div className="flex flex-wrap gap-2">
            {project.stats.map(({ label, value }) => (
              <div key={label} className="rounded-xl px-3 py-1.5 text-center"
                style={{ background: project.accentDim, border: `1px solid rgba(${project.glowRgb},0.2)` }}>
                <p className="text-[0.65rem] font-black" style={{ color: project.accent }}>{value}</p>
                <p className="text-[0.55rem] text-white/30">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[0.6rem] font-medium text-white/40">
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-1">
          {project.url && !isConfidential ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200"
              style={{
                background: `rgba(${project.glowRgb},0.10)`,
                color: project.accent,
                border: `1px solid rgba(${project.glowRgb},0.22)`,
              }}
            >
              Voir le projet
              <ExternalLink size={13} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </a>
          ) : (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold opacity-50"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Lock size={12} />
              Mission confidentielle
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════ */
export default function RealisationsPage() {
  const { dict } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterId | "all">("all");

  const filtered = activeFilter === "all"
    ? PROJECTS
    : PROJECTS.filter((p) => p.filter === activeFilter);

  return (
    <div className="bg-[#09090b]">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-24 pt-40">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[350px] w-[500px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[75px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a] hover-glow-gold cursor-default"
          >
            <Sparkles size={11} /> Portfolio & réalisations
          </motion.div>

          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Des réalisations concrètes,", "pensées pour durer."]}
              highlight={1}
              stagger={0.16}
              wordStagger={0.06}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal delay={0.65} as="p" className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/40">
            Sites, apps, outils SaaS, accompagnement administratif et sourcing international —
            un aperçu des missions réalisées pour nos clients.
          </FadeReveal>

          {/* Stats */}
          <FadeReveal delay={0.82} className="mt-12 flex flex-wrap justify-center gap-6 border-t border-white/[0.07] pt-10">
            {[
              { value: "6+",  label: "Projets visibles",         color: "#c9a55a" },
              { value: "50+", label: "Clients accompagnés",      color: "#34d399" },
              { value: "5",   label: "Catégories de missions",   color: "#60a5fa" },
              { value: "3+",  label: "Pays & marchés couverts",  color: "#a78bfa" },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black" style={{ color }}>{value}</p>
                <p className="mt-0.5 text-xs text-white/35">{label}</p>
              </div>
            ))}
          </FadeReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FILTRES
      ══════════════════════════════════════════ */}
      <section className="sticky top-[72px] z-30 border-b border-white/[0.05] bg-[rgba(9,9,11,0.85)] backdrop-blur-xl px-6 py-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FILTERS.map(({ id, label, icon: Icon }) => {
              const isActive = activeFilter === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => setActiveFilter(id as FilterId | "all")}
                  whileTap={{ scale: 0.94 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200"
                  style={{
                    background: isActive ? "rgba(201,165,90,0.15)" : "rgba(255,255,255,0.04)",
                    color: isActive ? "#c9a55a" : "rgba(255,255,255,0.4)",
                    border: isActive ? "1px solid rgba(201,165,90,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Icon size={11} />
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="filter-count"
                      className="ml-0.5 rounded-full bg-[rgba(201,165,90,0.2)] px-1.5 py-0.5 text-[0.55rem] font-black text-[#c9a55a]"
                    >
                      {id === "all" ? PROJECTS.length : PROJECTS.filter((p) => p.filter === id).length}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          GRILLE PROJETS
      ══════════════════════════════════════════ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((project) => (
                <motion.div
                  key={project.id}
                  variants={cardReveal}
                  initial="hidden"
                  animate="visible"
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center"
            >
              <p className="text-white/30">Aucun projet dans cette catégorie pour le moment.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EN COULISSES
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-white/[0.07] bg-[#111113] px-8 py-14 text-center md:px-14"
          >
            {/* Glows */}
            <div className="pointer-events-none absolute left-[-60px] top-[-40px] h-[180px] w-[240px] rounded-full bg-[rgba(201,165,90,0.05)] blur-[55px]" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                <EyeOff size={24} className="text-white/40" />
              </div>

              <h2 className="text-2xl font-extrabold text-white/85 md:text-3xl">
                Et bien plus en coulisses.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/35">
                Un grand nombre de missions réalisées pour nos clients ne sont pas présentées ici.
                Confidentialité oblige — certains projets administratifs, stratégiques ou sensibles
                restent strictement privés.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Lock,        title: "Données protégées",      desc: "Confidentialité stricte sur toutes les missions sensibles.", color: "#c9a55a", rgb: "201,165,90"  },
                  { icon: EyeOff,      title: "Missions non publiques", desc: "Accompagnement, dossiers, sourcing — certains restent privés.", color: "#60a5fa", rgb: "96,165,250" },
                  { icon: Shield,      title: "Discrétion garantie",    desc: "Nos clients peuvent travailler avec nous en toute sérénité.", color: "#34d399", rgb: "52,211,153" },
                ].map(({ icon: Icon, title, desc, color, rgb }) => (
                  <div key={title} className="rounded-[1.25rem] border border-white/[0.06] bg-white/[0.02] p-5 text-left">
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border"
                      style={{ background: `rgba(${rgb},0.10)`, borderColor: `rgba(${rgb},0.22)` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <h3 className="text-sm font-extrabold text-white/75">{title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/35">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MÉTHODE
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={staggerContainer}
          >
            <div className="mb-14 text-center">
              <motion.span
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]"
              >
                <Zap size={10} /> La même exigence sur chaque projet
              </motion.span>
              <motion.h2 variants={fadeIn} className="display-section mt-4 text-white">
                Notre méthode.
              </motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-base text-white/35">
                Chaque projet, quel que soit son type ou sa taille, suit le même processus rigoureux.
              </motion.p>
            </div>

            <motion.div
              variants={staggerContainerFast}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              {[
                { step: "01", icon: Search,         color: "#c9a55a", rgb: "201,165,90",  title: "Compréhension",  desc: "Analyse du besoin et des objectifs."      },
                { step: "02", icon: Code2,           color: "#60a5fa", rgb: "96,165,250",  title: "Conception",     desc: "Architecture, stratégie, planification."  },
                { step: "03", icon: Sparkles,        color: "#a78bfa", rgb: "167,139,250", title: "Design",         desc: "Identité visuelle, UX, interfaces."       },
                { step: "04", icon: Zap,             color: "#34d399", rgb: "52,211,153",  title: "Livraison",      desc: "Développement, tests, mise en ligne."     },
                { step: "05", icon: HeartHandshake,  color: "#f9a826", rgb: "249,168,38",  title: "Accompagnement", desc: "Suivi, ajustements, disponibilité."       },
              ].map(({ step, icon: Icon, color, rgb, title, desc }) => (
                <motion.div
                  key={step}
                  variants={cardReveal}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-[#111113] p-5 transition-all duration-300 hover:border-white/[0.14] hover:-translate-y-1"
                >
                  <div className="pointer-events-none absolute right-3 top-2 text-[3.5rem] font-black leading-none opacity-[0.04] select-none" style={{ color }}>
                    {step}
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ background: `rgba(${rgb},0.10)`, borderColor: `rgba(${rgb},0.22)` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-black uppercase tracking-[0.15em]" style={{ color }}>
                      {step}
                    </p>
                    <h3 className="text-sm font-extrabold text-white/80">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/35">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          AVANTAGES
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={staggerContainer}
          >
            <div className="mb-14 text-center">
              <motion.span variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">
                <Star size={10} /> Ce qui nous différencie
              </motion.span>
              <motion.h2 variants={fadeIn} className="display-section mt-4 text-white">
                L&apos;exigence DJAMA.
              </motion.h2>
            </div>

            <motion.div variants={staggerContainerFast} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Sparkles,     color: "#c9a55a", rgb: "201,165,90",  title: "Design moderne & pro",       desc: "Chaque projet est pensé pour marquer les esprits — esthétique soignée, cohérence visuelle, identité forte." },
                { icon: Zap,          color: "#60a5fa", rgb: "96,165,250",  title: "Performance & optimisation", desc: "Code propre, chargement rapide, hébergement fiable. La performance est au cœur de chaque livraison." },
                { icon: Smartphone,   color: "#34d399", rgb: "52,211,153",  title: "100% responsive",            desc: "Chaque livrable s'adapte parfaitement à tous les écrans — mobile-first par défaut." },
                { icon: TrendingUp,   color: "#a78bfa", rgb: "167,139,250", title: "Orienté résultats",          desc: "Pas seulement beau — efficace. Chaque décision est orientée vers votre croissance." },
                { icon: Shield,       color: "#f9a826", rgb: "249,168,38",  title: "Confidentialité totale",     desc: "Vos données et celles de vos clients sont traitées avec la plus grande rigueur et discrétion." },
                { icon: Users,        color: "#fb7185", rgb: "251,113,133", title: "Accompagnement humain",      desc: "De la conception à la livraison et au-delà, vous êtes guidé à chaque étape par une vraie personne." },
              ].map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div
                  key={title}
                  variants={cardReveal}
                  className="group rounded-[1.5rem] border border-white/[0.07] bg-[#111113] p-6 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ background: `rgba(${rgb},0.10)`, borderColor: `rgba(${rgb},0.22)` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3 className="text-sm font-extrabold text-white/80">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/38">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.18)] bg-[#111113] px-8 py-20 text-center md:px-16"
          >
            <div className="pointer-events-none absolute left-[10%] top-[-40px] h-[180px] w-[240px] rounded-full bg-[rgba(201,165,90,0.08)] blur-[55px]" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">
                <MessageCircle size={11} /> Votre projet
              </div>

              <h2 className="display-section text-white">
                <MultiLineReveal
                  lines={["Vous voulez un projet", "comme ceux-ci ?"]}
                  highlight={1}
                  stagger={0.15}
                  wordStagger={0.07}
                  lineClassName="justify-center"
                />
              </h2>

              <FadeReveal delay={0.3} as="p" className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/35">
                Site, application, outils, accompagnement — discutons de votre projet
                et construisons ensemble la solution qui vous correspond.
              </FadeReveal>

              <FadeReveal delay={0.45} className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/contact" className="btn-primary px-8 py-4 text-base">
                  Demander un devis <ArrowRight size={16} />
                </Link>
                <Link href="/contact" className="btn-ghost px-8 py-4 text-base">
                  Parler de votre projet
                </Link>
              </FadeReveal>

              <FadeReveal delay={0.55} className="mt-8 flex flex-wrap justify-center gap-6">
                {[
                  { icon: CheckCircle2, text: "Sans engagement"      },
                  { icon: Zap,          text: "Réponse sous 24h"     },
                  { icon: FileText,     text: "Devis gratuit & détaillé" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-xs text-white/25">
                    <Icon size={12} className="text-[#c9a55a]" />
                    {text}
                  </span>
                ))}
              </FadeReveal>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
