"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowRight, ExternalLink, Sparkles, CheckCircle2,
  Zap, Smartphone, Search, Users, ShoppingCart, Layout,
  Globe2, Star, TrendingUp, Shield, FileText,
  Lock, EyeOff, Code2, Wrench, HeartHandshake,
  MessageCircle, ReceiptText, Globe,
  Timer, Briefcase,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import {
  staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport,
} from "@/lib/animations";
import { useLanguage } from "@/lib/language-context";
import { fetchRealisations } from "@/lib/db/realisations";
import { WordLift, GlowReveal } from "@/components/ui/HoverText";
import type { RealisationRow } from "@/types/db";

const ease = [0.16, 1, 0.3, 1] as const;

/* ══════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════ */
type FilterId = "all" | "web" | "mobile" | "ecommerce" | "tools" | "support" | "sourcing" | "design";

type MLine = { w: string; h: number; mb: number; opacity: number; radius?: number };

// Propriétés visuelles dérivées depuis RealisationRow (contenu = Supabase, visuel = local)
interface ProjectDisplay {
  id: string;
  name: string;
  category: string;
  tag: string;
  description: string;
  year: number;
  url: string | null;
  highlights: string[];
  gradient: string;
  glow: string;
  glowRgb: string;
  accent: string;
  accentDim: string;
  mockLines: MLine[];
  kind: "app" | "web" | "service";
  icon: React.ElementType;
  domain?: string;
  filter: FilterId;
  isLive: boolean;
  tags: string[];
  // Médias
  mediaType:    string | null;
  imageUrl:     string | null;
  videoUrl:     string | null;
  thumbnailUrl: string | null;
}

/* ── Helpers visuels ─────────────────────────────────────── */
function hexToRgb(hex: string): string {
  const c = hex.replace("#", "");
  return `${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)}`;
}

const GRADIENT_MAP: Record<string, string> = {
  "#c9a55a": "from-[#0e0a02] via-[#160e04] to-[#1a1206]",
  "#60a5fa": "from-[#0d1a2a] via-[#0f2235] to-[#0a1928]",
  "#a78bfa": "from-[#1a0d2e] via-[#1e0f3a] to-[#130a24]",
  "#4ade80": "from-[#0f1a10] via-[#152218] to-[#0d1a10]",
  "#f472b6": "from-[#1a0814] via-[#220a1a] to-[#160610]",
  "#38bdf8": "from-[#051820] via-[#0a2035] to-[#051520]",
  "#f9a826": "from-[#1a1208] via-[#201508] to-[#171006]",
  "#34d399": "from-[#0a1a14] via-[#0f2018] to-[#0a1a12]",
};

const DEFAULT_MOCKLINES: Record<"app" | "web" | "service", MLine[]> = {
  app: [
    { w: "70%", h: 14, mb: 6,  opacity: 0.85 },
    { w: "50%", h: 9,  mb: 16, opacity: 0.4  },
    { w: "100%",h: 7,  mb: 4,  opacity: 0.18 },
    { w: "80%", h: 7,  mb: 4,  opacity: 0.14 },
    { w: "90%", h: 7,  mb: 14, opacity: 0.14 },
    { w: "40%", h: 30, mb: 0,  opacity: 0.35, radius: 20 },
  ],
  web: [
    { w: "60%", h: 16, mb: 7,  opacity: 0.9  },
    { w: "40%", h: 10, mb: 18, opacity: 0.5  },
    { w: "100%",h: 7,  mb: 4,  opacity: 0.18 },
    { w: "85%", h: 7,  mb: 4,  opacity: 0.14 },
    { w: "92%", h: 7,  mb: 14, opacity: 0.14 },
    { w: "30%", h: 32, mb: 0,  opacity: 0.35, radius: 8  },
  ],
  service: [
    { w: "55%", h: 16, mb: 7,  opacity: 0.9  },
    { w: "70%", h: 10, mb: 18, opacity: 0.44 },
    { w: "100%",h: 7,  mb: 4,  opacity: 0.17 },
    { w: "78%", h: 7,  mb: 4,  opacity: 0.13 },
    { w: "88%", h: 7,  mb: 14, opacity: 0.13 },
    { w: "28%", h: 32, mb: 0,  opacity: 0.3,  radius: 8  },
  ],
};

function getKind(category: string): "app" | "web" | "service" {
  const c = category.toLowerCase();
  if (c.includes("mobile") || c.includes("app") || c.includes("android")) return "app";
  if (c.includes("accompagnement") || c.includes("admin") || c.includes("sourcing") || c.includes("conseil")) return "service";
  return "web";
}

function getFilter(category: string, tag: string): FilterId {
  const c = (category + " " + tag).toLowerCase();
  if (c.includes("mobile") || c.includes("android") || c.includes("ios")) return "mobile";
  if (c.includes("e-commerce") || c.includes("ecommerce") || c.includes("boutique")) return "ecommerce";
  if (c.includes("saas") || c.includes("outil") || c.includes("plateforme") || c.includes("dashboard")) return "tools";
  if (c.includes("accompagnement") || c.includes("admin") || c.includes("assistance")) return "support";
  if (c.includes("sourcing") || c.includes("fournisseur")) return "sourcing";
  return "web";
}

function getCatIcon(category: string): React.ElementType {
  const c = category.toLowerCase();
  if (c.includes("mobile") || c.includes("app")) return Smartphone;
  if (c.includes("e-commerce") || c.includes("boutique")) return ShoppingCart;
  if (c.includes("saas") || c.includes("outil") || c.includes("plateforme")) return ReceiptText;
  if (c.includes("accompagnement") || c.includes("admin")) return FileText;
  if (c.includes("sourcing")) return Globe2;
  return Layout;
}

function toDisplay(r: RealisationRow): ProjectDisplay {
  const acc = r.accent_color || "#c9a55a";
  const rgb = hexToRgb(acc);
  const kind = getKind(r.category);
  let domain: string | undefined;
  try { if (r.url) domain = new URL(r.url).hostname.replace("www.", ""); } catch {}
  return {
    id:          r.id,
    name:        r.name,
    category:    r.category,
    tag:         r.tag,
    description: r.description,
    year:        r.year,
    url:         r.url,
    highlights:  r.highlights ?? [],
    gradient:    GRADIENT_MAP[acc] ?? "from-[#0e0e10] via-[#121214] to-[#0c0c0e]",
    glow:        `rgba(${rgb},0.26)`,
    glowRgb:     rgb,
    accent:      acc,
    accentDim:   `rgba(${rgb},0.12)`,
    mockLines:   DEFAULT_MOCKLINES[kind],
    kind,
    icon:        getCatIcon(r.category),
    domain,
    filter:      getFilter(r.category, r.tag),
    isLive:      !!r.url,
    tags:        r.tag ? r.tag.split(",").map(t => t.trim()).filter(Boolean) : [],
    mediaType:   r.media_type    ?? null,
    imageUrl:    r.image_url     ?? null,
    videoUrl:    r.video_url     ?? null,
    thumbnailUrl:r.thumbnail_url ?? null,
  };
}

/* ══════════════════════════════════════════════════
   ÉTUDES DE CAS — IMPACT FINANCIER
══════════════════════════════════════════════════ */
const CASE_STUDIES = [
  {
    id: "cs1",
    icon: Briefcase,
    profile: "Consultant IT freelance",
    sector: "Services B2B · Indépendant",
    color: "#c9a55a",
    rgb: "201,165,90",
    solution: "DJAMA Pro",
    solutionHref: "/abonnement",
    problem: "5 abonnements séparés (facturation, CRM, agenda, comptabilité, contrats) pour 90€/mois — interfaces multiples, données dispersées, 3h/semaine perdues en admin.",
    after: "Migration sur DJAMA Pro : 11 outils centralisés, 1 seul espace, accès immédiat — tout synchronisé.",
    stats: [
      { value: "-78€",  label: "économisés / mois",    icon: TrendingUp, color: "#34d399"  },
      { value: "-2h30", label: "admin / semaine",      icon: Timer,      color: "#60a5fa"  },
      { value: "12",    label: "factures auto / an",   icon: Zap,        color: "#c9a55a"  },
    ],
  },
  {
    id: "cs2",
    icon: Globe,
    profile: "Artisan plombier",
    sector: "BTP · Services locaux",
    color: "#60a5fa",
    rgb: "96,165,250",
    solution: "Site vitrine",
    solutionHref: "/services/site-vitrine",
    problem: "Zéro présence en ligne, acquisition 100% bouche-à-oreille. Périodes creuses de -40% de CA en été et en janvier.",
    after: "Site vitrine professionnel livré en 10 jours, référencement local Google Maps, formulaire de devis intégré.",
    stats: [
      { value: "+35%",    label: "contacts entrants",  icon: TrendingUp, color: "#34d399"  },
      { value: "3 mois",  label: "pour rentabiliser",  icon: Zap,        color: "#60a5fa"  },
      { value: "+8 000€", label: "de CA en 6 mois",    icon: Star,       color: "#c9a55a"  },
    ],
  },
  {
    id: "cs3",
    icon: ShoppingCart,
    profile: "Vendeuse e-commerce mode",
    sector: "Retail · Indépendant",
    color: "#a78bfa",
    rgb: "167,139,250",
    solution: "Coaching IA",
    solutionHref: "/services/coaching-ia",
    problem: "2h/jour perdues sur rédaction de fiches produits, emails et posts réseaux sociaux — sans outil IA ni méthode.",
    after: "Formation Coaching IA DJAMA (190€) : maîtrise de ChatGPT et Claude, prompts métier prêts à l'emploi.",
    stats: [
      { value: "-1h30", label: "rédaction / jour",         icon: Timer,      color: "#4ade80"  },
      { value: "3×",    label: "fiches produits plus vite", icon: Zap,        color: "#a78bfa"  },
      { value: "+22%",  label: "de conversion boutique",   icon: TrendingUp, color: "#c9a55a"  },
    ],
  },
  {
    id: "cs4",
    icon: Globe2,
    profile: "Distributeur multi-produits",
    sector: "Commerce · PME 5 pers.",
    color: "#f59e0b",
    rgb: "245,158,11",
    solution: "Sourcing international",
    solutionHref: "/services/recherche-fournisseurs",
    problem: "Marges commerciales bloquées à 18% avec fournisseurs locaux. Coûts d'achat trop élevés pour rester compétitif face aux grandes enseignes.",
    after: "Sourcing DJAMA : 3 fournisseurs internationaux qualifiés, mise en relation directe, négociation incluse.",
    stats: [
      { value: "+20 pts", label: "de marge brute",      icon: TrendingUp,  color: "#34d399"  },
      { value: "-24 000€",label: "d'achats / an",       icon: Star,        color: "#f59e0b"  },
      { value: "38%",     label: "marge atteinte",      icon: CheckCircle2, color: "#c9a55a" },
    ],
  },
] as const;

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
   PHONE MOCKUP
══════════════════════════════════════════════════ */
function PhoneMockup({ project }: { project: ProjectDisplay }) {
  return (
    <div className="relative flex justify-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      style={{ transformOrigin: "center bottom" }}>
      <div className="relative w-[160px] rounded-[2.5rem] border-[3px] border-gray-200 bg-gray-100 shadow-2xl overflow-hidden">
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 w-16 h-4 rounded-full bg-gray-100" />
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
          <div className="h-1 w-16 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="absolute -bottom-4 left-1/2 h-8 w-32 -translate-x-1/2 rounded-full blur-xl opacity-30" style={{ background: project.glow }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   BROWSER MOCKUP
══════════════════════════════════════════════════ */
function BrowserMockup({ project }: { project: ProjectDisplay }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 shadow-[0_24px_56px_rgba(0,0,0,0.12)] transition-transform duration-700 group-hover:scale-[1.02]"
      style={{ transformOrigin: "center top" }}>
      {/* Barre navigateur */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <div className="flex gap-1.5">
          {["rgba(255,95,86,0.6)","rgba(255,189,46,0.6)","rgba(39,201,63,0.6)"].map((c, i) => (
            <span key={i} className="h-2 w-2 rounded-full" style={{ background: c }} />
          ))}
        </div>
        {project.domain && (
          <div className="mx-auto flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: project.accent, opacity: 0.7 }} />
            <span className="text-[0.6rem] font-medium text-gray-400">{project.domain}</span>
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
function ServiceVisual({ project }: { project: ProjectDisplay }) {
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
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MÉDIA IMAGE
══════════════════════════════════════════════════ */
function MediaImage({ project }: { project: ProjectDisplay }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={project.imageUrl!}
        alt={project.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {/* Voile gradient en bas */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, rgba(255,255,255,0.85), transparent)" }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MÉDIA VIDÉO  (YouTube / Vimeo / direct .mp4)
══════════════════════════════════════════════════ */
function getVideoEmbed(url: string): { type: "youtube" | "vimeo" | "direct"; src: string } {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return { type: "youtube", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1` };
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return { type: "vimeo", src: `https://player.vimeo.com/video/${vmMatch[1]}?dnt=1` };
  return { type: "direct", src: url };
}

function MediaVideo({ project }: { project: ProjectDisplay }) {
  const embed = getVideoEmbed(project.videoUrl!);
  const thumbnail = project.thumbnailUrl;

  if (embed.type === "direct") {
    return (
      <div className="relative h-full w-full bg-gray-100">
        {thumbnail && (
          <Image src={thumbnail} alt={project.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover opacity-60" />
        )}
        <video
          src={embed.src}
          poster={thumbnail ?? undefined}
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
          onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
          onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-gray-100">
      {thumbnail ? (
        <Image src={thumbnail} alt={project.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
      ) : (
        <iframe
          src={embed.src}
          title={project.name}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )}
      {thumbnail && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm"
            style={{ boxShadow: `0 0 32px rgba(${project.glowRgb},0.3)` }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 translate-x-0.5 text-gray-700">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROJECT CARD
══════════════════════════════════════════════════ */
function ProjectCard({ project }: { project: ProjectDisplay }) {
  const statusBadge = project.isLive
    ? { label: "En ligne",     color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)",  dot: true  }
    : { label: "Confidentiel", color: "#f9a826", bg: "rgba(249,168,38,0.10)",  border: "rgba(249,168,38,0.25)",  dot: false };
  const isConfidential = !project.isLive;

  return (
    <motion.div
      layout
      variants={cardReveal}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-500 hover:border-gray-300"
      whileHover={{ y: -6, boxShadow: `0 28px 64px rgba(${project.glowRgb},0.12)` }}
    >
      {/* Visuel */}
      <div className="relative overflow-hidden" style={{ aspectRatio: project.kind === "app" ? "4/3" : "16/9" }}>
        {project.mediaType === "image" && project.imageUrl
          ? <MediaImage project={project} />
          : project.mediaType === "video" && project.videoUrl
            ? <MediaVideo project={project} />
            : project.kind === "app"
              ? <PhoneMockup   project={project} />
              : project.kind === "web"
                ? <BrowserMockup project={project} />
                : <ServiceVisual project={project} />
        }

        {/* Badges status + catégorie */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
            style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}>
            {statusBadge.dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: statusBadge.color }} />}
            {!statusBadge.dot && <EyeOff size={9} />}
            {statusBadge.label}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <span className="rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.85)", color: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(0,0,0,0.08)" }}>
            {project.category}
          </span>
        </div>
      </div>

      {/* Séparateur lumineux */}
      <div className="h-px w-full opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${project.glowRgb},0.4), transparent)` }} />

      {/* Contenu */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Nom + catégorie */}
        <div>
          <h3 className="text-xl font-extrabold text-gray-800">
            <WordLift
              text={project.name}
              yOffset={4}
              stagger={22}
              hoverColor="rgba(0,0,0,1)"
            />
          </h3>
          <p className="mt-0.5 text-xs font-semibold" style={{ color: project.accent }}>
            {project.category}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-500">{project.description}</p>

        {/* Points clés */}
        <ul className="flex flex-col gap-1.5">
          {project.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-xs text-gray-600">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: project.accent }} />
              {h}
            </li>
          ))}
        </ul>

        {/* Stats basées sur l'année */}
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl px-3 py-1.5 text-center"
            style={{ background: project.accentDim, border: `1px solid rgba(${project.glowRgb},0.2)` }}>
            <p className="text-[0.65rem] font-black" style={{ color: project.accent }}>{project.year}</p>
            <p className="text-[0.55rem] text-gray-400">Année</p>
          </div>
          {project.isLive && (
            <div className="rounded-xl px-3 py-1.5 text-center"
              style={{ background: project.accentDim, border: `1px solid rgba(${project.glowRgb},0.2)` }}>
              <p className="text-[0.65rem] font-black" style={{ color: project.accent }}>En ligne</p>
              <p className="text-[0.55rem] text-gray-400">Statut</p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[0.6rem] font-medium text-gray-500">
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
                background: `rgba(${project.glowRgb},0.08)`,
                color: project.accent,
                border: `1px solid rgba(${project.glowRgb},0.22)`,
              }}
            >
              Voir le projet
              <ExternalLink size={13} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </a>
          ) : (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold opacity-50"
              style={{ background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.08)" }}>
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
  const [rows, setRows]     = useState<RealisationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealisations()
      .then(data => setRows(data.filter(r => r.status === "publié")))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const display = rows.map(toDisplay);

  const filtered = activeFilter === "all"
    ? display
    : display.filter(p => p.filter === activeFilter);

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-12 pt-[108px] sm:pb-24 sm:pt-[128px] bg-white">
        {/* Animated orbs */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[380px] w-[560px] animate-float-slow rounded-full bg-[rgba(201,165,90,0.05)] blur-[75px]" />
        </div>
        <div className="pointer-events-none absolute right-[10%] top-[35%] h-[240px] w-[240px] animate-float-delayed rounded-full bg-[rgba(96,165,250,0.03)] blur-[55px]" />
        <div className="pointer-events-none absolute left-[8%] top-[45%] h-[180px] w-[180px] animate-float rounded-full bg-[rgba(167,139,250,0.03)] blur-[45px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a] cursor-default"
          >
            <span className="relative flex h-1.5 w-1.5 rounded-full bg-[#c9a55a]" />
            <Sparkles size={11} /> Portfolio & réalisations
          </motion.div>

          <h1 className="display-hero text-gray-900">
            <MultiLineReveal
              lines={["Des missions avec impact,", "des résultats mesurables."]}
              highlight={1}
              stagger={0.16}
              wordStagger={0.06}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal delay={0.65} as="p" className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-gray-500">
            Sites, apps, coaching IA, sourcing, accompagnement — des missions avec un impact financier
            concret et mesurable. Résultats réels, clients anonymisés.
          </FadeReveal>

          {/* Stats */}
          <FadeReveal delay={0.82} className="mt-12 flex flex-wrap justify-center gap-6 border-t border-gray-200 pt-10">
            {[
              { value: "50+",   label: "Clients accompagnés",    color: "#c9a55a" },
              { value: "100+", label: "Missions livrées",       color: "#34d399" },
              { value: "3 ans",label: "d'expérience",           color: "#60a5fa" },
              { value: "3+",   label: "Pays & marchés",         color: "#a78bfa" },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black" style={{ color }}>{value}</p>
                <p className="mt-0.5 text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </FadeReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          IMPACT FINANCIER — ÉTUDES DE CAS
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#f8f9fa] py-20 sm:py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          {/* Header */}
          <div className="mb-14 text-center">
            <motion.div variants={fadeIn}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(52,211,153,.3)] bg-[rgba(52,211,153,.08)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em] text-[#34d399]"
            >
              <TrendingUp size={11} />
              Résultats concrets &amp; mesurés
            </motion.div>
            <motion.h2 variants={fadeIn} className="display-section text-gray-900">
              Impact financier réel.
            </motion.h2>
            <FadeReveal delay={0.2} as="p" className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500">
              Chaque mission vise un retour sur investissement concret. Voici 4 exemples représentatifs — noms et détails anonymisés pour respecter la confidentialité.
            </FadeReveal>
          </div>

          {/* Case study cards — grille 2×2 */}
          <motion.div variants={staggerContainerFast} className="grid gap-5 sm:grid-cols-2">
            {CASE_STUDIES.map(({ id, icon: Icon, profile, sector, color, rgb, solution, solutionHref, problem, after, stats }) => (
              <motion.div key={id} variants={cardReveal}
                whileHover={{ y: -6, transition: { duration: 0.3, ease } }}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-300 hover:border-gray-300"
              >
                {/* Top accent */}
                <div className="h-[2.5px] w-full transition-all duration-300 group-hover:h-[4px]"
                  style={{ background: `linear-gradient(90deg,transparent,${color},transparent)` }} />

                <div className="relative flex flex-1 flex-col p-6">
                  {/* Header profil */}
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
                        style={{ background: `rgba(${rgb},.12)`, borderColor: `rgba(${rgb},.28)`, boxShadow: `0 0 14px rgba(${rgb},.12)` }}>
                        <Icon size={20} style={{ color }} />
                      </div>
                      <div>
                        <p className="text-[0.88rem] font-extrabold text-gray-800">{profile}</p>
                        <p className="text-[0.7rem] text-gray-400">{sector}</p>
                      </div>
                    </div>
                    <Link href={solutionHref}
                      className="shrink-0 rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[.16em] transition-all duration-200 hover:brightness-110"
                      style={{ borderColor: `rgba(${rgb},.3)`, background: `rgba(${rgb},.08)`, color }}>
                      {solution}
                    </Link>
                  </div>

                  {/* 3 stats chiffrées */}
                  <div className="mb-5 grid grid-cols-3 gap-2.5">
                    {stats.map(({ value, label, icon: StatIcon, color: statColor }) => (
                      <div key={label}
                        className="flex flex-col items-center rounded-2xl border border-gray-200 bg-gray-50 px-2 py-3.5 text-center"
                      >
                        <StatIcon size={13} className="mb-1.5 shrink-0" style={{ color: statColor }} />
                        <p className="text-[1.05rem] font-black leading-none" style={{ color: statColor }}>{value}</p>
                        <p className="mt-1 text-[0.58rem] leading-tight text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Avant → Après */}
                  <div className="mt-auto space-y-2">
                    <div className="flex items-start gap-2.5 rounded-xl border border-[rgba(239,68,68,.15)] bg-[rgba(239,68,68,.04)] px-3.5 py-3">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[rgba(239,68,68,.2)] text-[0.55rem] font-black text-[rgba(239,68,68,.8)]">✕</span>
                      <p className="text-[0.78rem] leading-relaxed text-gray-600">{problem}</p>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-xl border border-[rgba(52,211,153,.18)] bg-[rgba(52,211,153,.04)] px-3.5 py-3">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#34d399]" />
                      <p className="text-[0.78rem] leading-relaxed text-gray-700">{after}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Disclaimer */}
          <FadeReveal delay={0.4} className="mt-8 flex justify-center">
            <p className="flex items-center gap-2 text-center text-[0.72rem] text-gray-400">
              <Shield size={11} className="shrink-0" />
              Résultats basés sur des missions réelles — noms, secteurs et chiffres partiellement anonymisés pour respecter la confidentialité client.
            </p>
          </FadeReveal>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          FILTRES
      ══════════════════════════════════════════ */}
      <section className="sticky top-[72px] z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl px-6 py-4">
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
                    background: isActive ? "rgba(201,165,90,0.12)" : "rgba(0,0,0,0.03)",
                    color: isActive ? "#c9a55a" : "rgba(0,0,0,0.4)",
                    border: isActive ? "1px solid rgba(201,165,90,0.35)" : "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Icon size={11} />
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="filter-count"
                      className="ml-0.5 rounded-full bg-[rgba(201,165,90,0.15)] px-1.5 py-0.5 text-[0.55rem] font-black text-[#c9a55a]"
                    >
                      {id === "all" ? display.length : display.filter((p) => p.filter === id).length}
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
      <section className="px-6 py-10 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[480px] animate-pulse rounded-[1.75rem] border border-gray-200 bg-gray-100" />
              ))}
            </div>
          ) : (
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
          )}

          {!loading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 sm:py-24 text-center"
            >
              <p className="text-gray-400">Aucun projet dans cette catégorie pour le moment.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EN COULISSES
      ══════════════════════════════════════════ */}
      <section className="border-t border-gray-200 px-6 py-12 sm:py-24 bg-[#f8f9fa]">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white px-8 py-14 text-center shadow-[0_2px_10px_rgba(0,0,0,.06)] md:px-14"
          >
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                <EyeOff size={24} className="text-gray-400" />
              </div>

              <h2 className="text-2xl font-extrabold text-gray-800 md:text-3xl">
                Et bien plus en coulisses.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-500">
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
                  <div key={title} className="rounded-[1.25rem] border border-gray-200 bg-gray-50 p-5 text-left">
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border"
                      style={{ background: `rgba(${rgb},0.10)`, borderColor: `rgba(${rgb},0.22)` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-700">{title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{desc}</p>
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
      <section className="border-t border-gray-200 px-6 py-12 sm:py-24 bg-white">
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
              <motion.h2 variants={fadeIn} className="display-section mt-4 text-gray-900">
                Notre méthode.
              </motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-base text-gray-500">
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
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-300 hover:border-gray-300 hover:-translate-y-1"
                >
                  <div className="pointer-events-none absolute right-3 top-2 text-[3.5rem] font-black leading-none opacity-[0.04] select-none text-gray-900">
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
                    <h3 className="text-sm font-extrabold text-gray-800">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
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
      <section className="border-t border-gray-200 px-6 py-12 sm:py-24 bg-[#f8f9fa]">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={staggerContainer}
          >
            <div className="mb-14 text-center">
              <motion.span variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">
                <Star size={10} /> Ce qui nous différencie
              </motion.span>
              <motion.h2 variants={fadeIn} className="display-section mt-4 text-gray-900">
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
                  className="group rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-300 hover:border-gray-300"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ background: `rgba(${rgb},0.10)`, borderColor: `rgba(${rgb},0.22)` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-800">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="border-t border-gray-200 px-6 py-10 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="relative overflow-hidden rounded-[2rem] px-8 py-10 sm:py-20 text-center md:px-16"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%)" }}
          >
            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white">
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

              <FadeReveal delay={0.3} as="p" className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/80">
                Site, application, outils, accompagnement — discutons de votre projet
                et construisons ensemble la solution qui vous correspond.
              </FadeReveal>

              <FadeReveal delay={0.45} className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/contact" className="btn-primary px-8 py-4 text-base">
                  Demander un devis <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-white/30 bg-white/10 px-8 py-[0.95rem] font-bold text-white transition hover:bg-white/20"
                >
                  Parler de votre projet
                </Link>
              </FadeReveal>

              <FadeReveal delay={0.55} className="mt-8 flex flex-wrap justify-center gap-6">
                {[
                  { icon: CheckCircle2, text: "Sans engagement"      },
                  { icon: Zap,          text: "Réponse sous 24h"     },
                  { icon: FileText,     text: "Devis gratuit & détaillé" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-xs text-white/70">
                    <Icon size={12} className="text-white/80" />
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
