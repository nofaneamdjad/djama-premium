"use client";

import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  ArrowRight, ExternalLink, Sparkles, CheckCircle2,
  Zap, Smartphone, Search, Users, ShoppingCart, Layout,
  Building2, Globe2, Star, TrendingUp, Shield,
  Package, FileText,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ══════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════ */
type ProjectKind = "app" | "web" | "service";

interface Project {
  id: string;
  kind: ProjectKind;
  category: string;
  name: string;
  type: string;
  description: string;
  url?: string;
  domain?: string;
  gradient: string;
  glow: string;
  accent: string;
  accentDim: string;
  tags: string[];
  icon: React.ElementType;
  highlights?: string[];
  clients?: string[];
  stats?: { label: string; value: string }[];
  mockLines?: { w: string; h: number; mb: number; opacity: number; radius?: number }[];
}

/* ══════════════════════════════════════════════════
   DONNÉES PROJETS
══════════════════════════════════════════════════ */
const PROJECTS: Project[] = [
  /* ─ Application mobile ─ */
  {
    id: "wewe",
    kind: "app",
    category: "Application mobile",
    name: "WEWE",
    type: "Application mobile Android",
    description:
      "Application mobile WEWE disponible sur Google Play — interface moderne, expérience utilisateur fluide et fonctionnalités pensées pour le quotidien.",
    url: "https://play.google.com/store/apps/details?id=com.wip.wewe.guis",
    gradient: "from-[#1a0d2e] via-[#1e0f3a] to-[#130a24]",
    glow: "rgba(139,92,246,0.28)",
    accent: "#a78bfa",
    accentDim: "rgba(139,92,246,0.13)",
    tags: ["Android", "Google Play", "Mobile", "UX/UI"],
    icon: Smartphone,
    highlights: [
      "Disponible sur Google Play Store",
      "Interface intuitive et design moderne",
      "Expérience utilisateur optimisée mobile-first",
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

  /* ─ E-commerce ─ */
  {
    id: "mondouka",
    kind: "web",
    category: "Site e-commerce",
    name: "Mondouka",
    type: "Site e-commerce",
    description:
      "Boutique en ligne moderne avec pages produits, panier intuitif et système de paiement sécurisé. Une expérience d'achat fluide, pensée pour convertir.",
    url: "https://mondouka.com",
    domain: "mondouka.com",
    gradient: "from-[#0d1a2a] via-[#0f2235] to-[#0a1928]",
    glow: "rgba(56,139,253,0.22)",
    accent: "#3b9dff",
    accentDim: "rgba(59,157,255,0.14)",
    tags: ["Boutique", "Panier", "Paiement", "Responsive"],
    icon: ShoppingCart,
    highlights: [
      "Pages produits optimisées pour la conversion",
      "Panier & paiement sécurisé intégrés",
      "Design responsive mobile-first",
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

  /* ─ Site vitrine ─ */
  {
    id: "clamac",
    kind: "web",
    category: "Site vitrine",
    name: "Clamac",
    type: "Site vitrine",
    description:
      "Site vitrine professionnel pour présenter les services et l'identité d'une entreprise. Design épuré, impact immédiat, optimisé pour la confiance.",
    url: "https://clamac.ae",
    domain: "clamac.ae",
    gradient: "from-[#0f1a10] via-[#152218] to-[#0d1a10]",
    glow: "rgba(52,211,153,0.2)",
    accent: "#34d399",
    accentDim: "rgba(52,211,153,0.12)",
    tags: ["Vitrine", "Services", "Pro", "SEO"],
    icon: Layout,
    highlights: [
      "Design épuré, identité de marque forte",
      "Structure SEO optimisée",
      "Formulaire de contact & conversion",
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

  /* ─ Assistance administrative ─ */
  {
    id: "admin",
    kind: "service",
    category: "Assistance administrative",
    name: "Entreprises accompagnées",
    type: "Assistance & démarches",
    description:
      "Gestion des démarches administratives, rédaction de documents officiels, constitution de dossiers et suivi pour le compte d'entreprises locales.",
    gradient: "from-[#1a1208] via-[#201508] to-[#171006]",
    glow: "rgba(249,168,38,0.2)",
    accent: "#f9a826",
    accentDim: "rgba(249,168,38,0.12)",
    tags: ["Administratif", "Dossiers", "Documents", "Marchés"],
    icon: FileText,
    clients: ["EXTENSO MAYOTTE", "ESPACE PUB", "MYPHONE974"],
    highlights: [
      "Rédaction et mise en forme de documents officiels",
      "Suivi et gestion de dossiers complets",
      "Interface avec les administrations et organismes",
      "Accompagnement marchés publics & privés",
    ],
    stats: [
      { label: "Entreprises", value: "3 clients" },
      { label: "Confidentialité", value: "Garantie" },
    ],
  },

  /* ─ Recherche fournisseurs ─ */
  {
    id: "fournisseurs",
    kind: "service",
    category: "Sourcing international",
    name: "Recherche de fournisseurs",
    type: "Chine · Turquie · Dubaï",
    description:
      "Identification et qualification de fournisseurs en Chine, Turquie, Dubaï et autres marchés. Négociation, vérification des conditions, mise en relation directe.",
    gradient: "from-[#0d1820] via-[#0f1e2a] to-[#0b1520]",
    glow: "rgba(56,189,248,0.2)",
    accent: "#38bdf8",
    accentDim: "rgba(56,189,248,0.11)",
    tags: ["Chine", "Turquie", "Dubaï", "Import", "Négo"],
    icon: Globe2,
    clients: ["SCAL", "EXTENSO MAYOTTE", "CLAMAC"],
    highlights: [
      "Sourcing qualifié Chine, Turquie, Dubaï",
      "Vérification et audit des fournisseurs",
      "Négociation des prix et conditions",
      "Suivi des commandes et livraisons",
    ],
    stats: [
      { label: "Marchés", value: "3 pays" },
      { label: "Entreprises", value: "3 clients" },
    ],
  },
];

/* ══════════════════════════════════════════════════
   FILTRES
══════════════════════════════════════════════════ */
const FILTERS = [
  { id: "all",      label: "Tous les projets" },
  { id: "app",      label: "Applications"     },
  { id: "web",      label: "Sites web"        },
  { id: "service",  label: "Services"         },
];

/* ══════════════════════════════════════════════════
   AVANTAGES
══════════════════════════════════════════════════ */
const ADVANTAGES = [
  { icon: Sparkles,   title: "Design moderne & professionnel",  desc: "Chaque projet est pensé pour marquer les esprits — esthétique soignée, cohérence visuelle, identité forte." },
  { icon: Zap,        title: "Sites rapides & optimisés",       desc: "Performance au cœur de chaque livraison : code propre, chargement rapide, hébergement fiable." },
  { icon: Smartphone, title: "Responsive mobile",               desc: "Vos visiteurs arrivent sur mobile. Chaque site s'adapte parfaitement à tous les écrans." },
  { icon: Search,     title: "SEO de base inclus",              desc: "Structure technique soignée, balises et textes optimisés — pour que Google vous trouve dès le départ." },
  { icon: Shield,     title: "Confidentialité garantie",        desc: "Vos données et celles de vos clients sont traitées avec rigueur et discrétion absolue." },
  { icon: Users,      title: "Accompagnement personnalisé",     desc: "De la conception à la livraison, vous êtes guidé à chaque étape — on ne vous laisse jamais seul." },
];

/* ══════════════════════════════════════════════════
   COMPOSANT : Phone Mockup (app mobile)
══════════════════════════════════════════════════ */
function PhoneMockup({ project }: { project: Project }) {
  return (
    <div className="relative flex justify-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      style={{ transformOrigin: "center bottom" }}>
      {/* Téléphone */}
      <div className="relative w-[160px] rounded-[2.5rem] border-[3px] border-white/15 bg-[#0d0d14] shadow-2xl overflow-hidden">
        {/* Encoche */}
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 w-16 h-4 rounded-full bg-[#0d0d14]" />
        {/* Écran */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${project.gradient} px-4 py-10`} style={{ minHeight: 240 }}>
          {/* Glow */}
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl"
            style={{ background: project.glow }} />
          {/* Skeleton content */}
          <div className="relative z-10 space-y-0">
            {project.mockLines?.map((line, i) => (
              <div key={i} className="rounded" style={{
                width: line.w, height: line.h, marginBottom: line.mb,
                background: `rgba(255,255,255,${line.opacity})`,
                borderRadius: line.radius ?? 4,
              }} />
            ))}
          </div>
          {/* Icône flottante */}
          <div className="pointer-events-none absolute bottom-4 right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
            style={{ background: project.accentDim }}>
            <project.icon size={17} style={{ color: project.accent }} />
          </div>
        </div>
        {/* Barre home */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-16 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Ombre portée */}
      <div className="absolute -bottom-4 left-1/2 h-8 w-32 -translate-x-1/2 rounded-full blur-xl opacity-40"
        style={{ background: project.glow }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPOSANT : Browser Mockup (site web)
══════════════════════════════════════════════════ */
function BrowserMockup({ project }: { project: Project }) {
  return (
    <div className="relative overflow-hidden rounded-xl shadow-2xl transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      style={{ transformOrigin: "center bottom" }}>
      {/* Barre navigateur */}
      <div className="flex h-9 items-center gap-3 bg-[#1a1f2e] px-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md bg-[#0d1117] px-3 py-1">
          <div className="h-2 w-2 rounded-full opacity-50" style={{ background: project.accent }} />
          <span className="text-[11px] font-mono text-white/40">{project.domain}</span>
        </div>
      </div>
      {/* Corps */}
      <div className={`relative bg-gradient-to-br ${project.gradient} px-6 py-7`} style={{ minHeight: 200 }}>
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl"
          style={{ background: project.glow }} />
        <div className="pointer-events-none absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
        }} />
        <div className="relative z-10 space-y-0">
          {project.mockLines?.map((line, i) => (
            <div key={i} className="rounded" style={{
              width: line.w, height: line.h, marginBottom: line.mb,
              background: `rgba(255,255,255,${line.opacity})`,
              borderRadius: line.radius ?? 4,
            }} />
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 backdrop-blur-sm"
          style={{ background: project.accentDim }}>
          <project.icon size={20} style={{ color: project.accent }} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPOSANT : Service Achievement Card (visuel)
══════════════════════════════════════════════════ */
function ServiceVisual({ project }: { project: Project }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${project.gradient} transition-transform duration-700 ease-out group-hover:scale-[1.02]`}
      style={{ minHeight: 220 }}>
      {/* Grille */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }} />
      {/* Glow ambiance */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 rounded-full blur-3xl" style={{ background: project.glow }} />
      </div>
      <div className="pointer-events-none absolute left-[-60px] top-[-60px] h-[200px] w-[200px] rounded-full border border-white/5"
        style={{ background: `radial-gradient(circle, ${project.glow}, transparent 70%)` }} />

      {/* Contenu */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 px-6 py-8">
        {/* Icône + titre */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 backdrop-blur-sm"
            style={{ background: project.accentDim }}>
            <project.icon size={26} style={{ color: project.accent }} />
          </div>
        </div>

        {/* Badges entreprises clientes */}
        {project.clients && (
          <div className="flex flex-wrap justify-center gap-2">
            {project.clients.map((client) => (
              <div key={client}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 backdrop-blur-sm"
                style={{ background: "rgba(0,0,0,0.35)" }}>
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: project.accent }} />
                <span className="text-xs font-bold tracking-wide text-white">{client}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {project.stats && (
          <div className="flex flex-wrap justify-center gap-2">
            {project.stats.map(({ label, value }) => (
              <div key={label}
                className="rounded-xl border border-white/8 px-3 py-1.5 text-center backdrop-blur-sm"
                style={{ background: "rgba(0,0,0,0.25)" }}>
                <p className="text-[11px] font-extrabold" style={{ color: project.accent }}>{value}</p>
                <p className="text-[9px] text-white/40">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPOSANT : Carte projet complète
══════════════════════════════════════════════════ */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 52 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, ease, delay: (index % 3) * 0.11 }}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-[0_4px_20px_rgba(9,9,11,0.06)] transition-all duration-500 hover:-translate-y-2 hover:border-[rgba(201,165,90,0.18)] hover:shadow-[0_32px_64px_rgba(9,9,11,0.12)]"
    >
      {/* ── Zone visuelle ── */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${project.gradient}`}>
        {/* Badge catégorie + lien externe */}
        <div className="absolute left-4 top-4 z-20 flex w-[calc(100%-2rem)] items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest backdrop-blur-sm"
            style={{ background: project.accentDim, color: project.accent, borderColor: `${project.accent}30` }}>
            {project.category}
          </span>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/60 backdrop-blur-sm transition hover:bg-white/20 hover:text-white">
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Mockup selon le type */}
        <div className={`pt-14 ${project.kind === "app" ? "pb-6 flex justify-center" : project.kind === "web" ? "px-5 pt-14 pb-0" : ""}`}>
          {project.kind === "app"     && <PhoneMockup  project={project} />}
          {project.kind === "web"     && <BrowserMockup project={project} />}
          {project.kind === "service" && <ServiceVisual project={project} />}
        </div>
      </div>

      {/* ── Contenu texte ── */}
      <div className="flex flex-1 flex-col p-7">
        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest"
              style={{ background: project.accentDim, color: project.accent, borderColor: `${project.accent}22` }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Titre & sous-type */}
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-xl font-extrabold text-[var(--ink)]">{project.name}</h2>
          <span className="text-sm font-medium text-[var(--muted)]">{project.type}</span>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{project.description}</p>

        {/* Highlights */}
        {project.highlights && (
          <ul className="mt-5 space-y-2">
            {project.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: project.accent }} />
                {h}
              </li>
            ))}
          </ul>
        )}

        {/* Liste des entreprises clientes (pour les services) */}
        {project.clients && (
          <div className="mt-5">
            <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted)]">
              Entreprises accompagnées
            </p>
            <div className="flex flex-wrap gap-2">
              {project.clients.map((client) => (
                <span key={client}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
                  style={{
                    background: project.accentDim,
                    color: project.accent,
                    borderColor: `${project.accent}25`,
                  }}>
                  <div className="h-1 w-1 rounded-full" style={{ background: project.accent }} />
                  {client}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Spacer pour coller le CTA au bas */}
        <div className="flex-1" />

        {/* CTAs */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {project.url ? (
            <a href={project.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:gap-3"
              style={{ background: project.accentDim, color: project.accent, borderColor: `${project.accent}30` }}>
              {project.kind === "app" ? "Voir sur Google Play" : "Voir le site"} <ExternalLink size={13} />
            </a>
          ) : (
            <Link href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:gap-3"
              style={{ background: project.accentDim, color: project.accent, borderColor: `${project.accent}30` }}>
              En savoir plus <ArrowRight size={13} />
            </Link>
          )}
          <Link href="/contact"
            className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]">
            Nous contacter →
          </Link>
        </div>
      </div>

      {/* Barre couleur au hover */}
      <div className="h-[2px] scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)` }} />
    </motion.article>
  );
}

/* ══════════════════════════════════════════════════
   COMPOSANT : Filtre de catégorie
══════════════════════════════════════════════════ */
function CategoryFilter({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {FILTERS.map(({ id, label }) => (
        <motion.button
          key={id}
          onClick={() => onChange(id)}
          whileTap={{ scale: 0.96 }}
          className="relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300"
          style={active === id
            ? { background: "var(--ink)", color: "white" }
            : { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
        >
          {label}
          {active === id && (
            <motion.div layoutId="filter-bg"
              className="absolute inset-0 -z-10 rounded-full bg-[var(--ink)]"
              transition={{ duration: 0.3, ease }} />
          )}
        </motion.button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════ */
export default function RealisationsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = activeFilter === "all"
    ? PROJECTS
    : PROJECTS.filter((p) => p.kind === activeFilter);

  return (
    <div className="bg-white">

      {/* ══ HERO ═══════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-28 pt-32">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-[rgba(176,141,87,0.08)] blur-[100px]" />
        </div>
        <div className="pointer-events-none absolute left-[-80px] top-[30%] h-[300px] w-[300px] rounded-full bg-[rgba(139,92,246,0.06)] blur-[80px]" />
        <div className="pointer-events-none absolute right-[-80px] top-[20%] h-[300px] w-[300px] rounded-full bg-[rgba(56,189,248,0.06)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(176,141,87,0.25)] bg-[rgba(176,141,87,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
            <Sparkles size={11} />
            Nos réalisations
          </motion.div>

          {/* Titre */}
          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Des projets qui font", "la différence."]}
              highlight={1}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          {/* Sous-titre */}
          <FadeReveal delay={0.6} as="p"
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/55">
            Applications mobiles, sites web et accompagnements — découvrez quelques projets
            réalisés pour nos clients, chacun pensé pour convertir et durer.
          </FadeReveal>

          {/* Méta stats */}
          <FadeReveal delay={0.8}
            className="mt-12 flex flex-wrap justify-center gap-10 border-t border-white/8 pt-10">
            {[
              { value: "5+",        label: "projets livrés"       },
              { value: "100%",      label: "clients satisfaits"   },
              { value: "3 pays",    label: "présence internationale" },
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

      {/* ══ PROJETS ════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        {/* En-tête section */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.5, ease }}
          className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">Réalisations</p>
          <h2 className="text-3xl font-extrabold text-[var(--ink)]">Ce que nous avons construit</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
            Chaque projet livré avec le même niveau d'exigence — design, performance, résultat.
          </p>
        </motion.div>

        {/* Filtres */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-12">
          <CategoryFilter active={activeFilter} onChange={setActiveFilter} />
        </motion.div>

        {/* Grille de cartes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-[var(--muted)]">Aucun projet dans cette catégorie.</div>
        )}
      </section>

      {/* ══ POURQUOI DJAMA ═════════════════════════ */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-12 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">Nos engagements</p>
            <h2 className="text-3xl font-extrabold text-[var(--ink)]">Pourquoi choisir DJAMA ?</h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
              Chaque projet respecte les mêmes standards de qualité — sans exception.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                className="group rounded-2xl border border-[var(--border)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(201,165,90,0.3)] hover:shadow-[0_8px_24px_rgba(9,9,11,0.08)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)]">
                  <Icon size={20} className="text-[#c9a55a]" />
                </div>
                <h3 className="font-bold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ CTA FINAL ══════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.7, ease }}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(176,141,87,0.2)] bg-[var(--ink)] p-12 text-center">
          {/* Glows */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[250px] w-[500px] rounded-full bg-[rgba(176,141,87,0.07)] blur-[80px]" />
          </div>
          <div className="pointer-events-none absolute left-0 top-0 h-[200px] w-[200px] rounded-full bg-[rgba(139,92,246,0.06)] blur-[60px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-[200px] w-[200px] rounded-full bg-[rgba(56,189,248,0.06)] blur-[60px]" />

          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5">
              <Star size={11} className="text-[#c9a55a]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#c9a55a]">Votre projet</span>
            </div>
            <h2 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">
              Vous voulez un projet comme ceux-ci ?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/50">
              Sites, applications, services administratifs ou sourcing international —
              nous construisons avec vous ce dont vous avez besoin.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary">
                Demander un devis <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="btn-ghost">
                Voir nos services
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
