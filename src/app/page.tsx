"use client";

// ── Layout — importé ici car cette page est hors du route group (public)
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantDJAMA from "@/components/AssistantDJAMA";
import { LanguageProvider } from "@/lib/language-context";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Mail, Star, Zap, Users, Shield,
  CheckCircle2, Sparkles, TrendingUp, HeartHandshake,
  Globe, Brain, MessageCircle,
  LayoutDashboard, Smartphone, Palette, Briefcase, BookOpen,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { useLanguage } from "@/lib/language-context"; // useLanguage nécessite LanguageProvider parent
import { useSiteSettings } from "@/hooks/useSiteSettings";
import PartnerLogosSection from "@/components/PartnerLogosSection";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Composant compte à rebours ────────────────────────────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref    = useRef<HTMLSpanElement>(null);
  const done   = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done.current) {
          done.current = true;
          let n = 0;
          const step = Math.max(1, Math.ceil(to / 35));
          const id = setInterval(() => {
            n = Math.min(n + step, to);
            setCount(n);
            if (n >= to) clearInterval(id);
          }, 28);
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Écosystème ────────────────────────────────────────────── */
const ECOSYSTEM = [
  {
    icon: LayoutDashboard,
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.09)",
    border: "rgba(201,165,90,0.20)",
    category: "Plateforme SaaS",
    services: ["Factures automatiques", "Devis automatiques", "Agenda / planning", "Bloc-notes"],
  },
  {
    icon: Brain,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.09)",
    border: "rgba(167,139,250,0.20)",
    category: "IA & Automatisation",
    services: ["Coaching IA", "Automatisation business", "Assistant IA"],
  },
  {
    icon: Globe,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.09)",
    border: "rgba(96,165,250,0.20)",
    category: "Création web",
    services: ["Site vitrine", "Site e-commerce"],
  },
  {
    icon: Smartphone,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.18)",
    category: "Développement digital",
    services: ["Application mobile", "Plateforme / outil web sur mesure"],
  },
  {
    icon: Palette,
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.09)",
    border: "rgba(201,165,90,0.20)",
    category: "Création visuelle",
    services: ["Visuels publicitaires", "Montage vidéo", "Retouche photo"],
  },
  {
    icon: Briefcase,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.09)",
    border: "rgba(96,165,250,0.20)",
    category: "Business & administratif",
    services: ["Création auto-entrepreneur", "Déclarations URSSAF", "Assistance administrative"],
  },
  {
    icon: TrendingUp,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.18)",
    category: "Développement business",
    services: ["Recherche de fournisseurs internationaux", "Marchés publics & privés"],
  },
  {
    icon: BookOpen,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.09)",
    border: "rgba(167,139,250,0.20)",
    category: "Formation",
    services: ["Soutien scolaire"],
  },
] as const;

/* ── Services principaux ───────────────────────────────────── */
const MAIN_SERVICES = [
  {
    icon: Globe,
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.10)",
    border: "rgba(201,165,90,0.20)",
    title: "Création de sites web",
    excerpt: "Sites vitrine, e-commerce et applications sur mesure.",
    href: "/services",
    cta: "Voir les offres",
  },
  {
    icon: Zap,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.20)",
    title: "Automatisation & IA",
    excerpt: "Automatisez vos tâches répétitives avec des outils intelligents.",
    href: "/services",
    cta: "Voir les offres",
  },
  {
    icon: Brain,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.18)",
    title: "Coaching IA",
    excerpt: "Maîtrisez l'IA en 5 modules intensifs avec un assistant personnel.",
    href: "/services/coaching-ia",
    cta: "Découvrir",
  },
  {
    icon: Users,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.18)",
    title: "Soutien scolaire",
    excerpt: "Accompagnement personnalisé, toutes matières, dès 14€/h.",
    href: "/services/soutien-scolaire",
    cta: "En savoir plus",
  },
] as const;

/* ── Hero — groupes de services (carte droite) ─────────────── */
const HERO_SERVICE_GROUPS = [
  {
    color: "#60a5fa",
    items: ["Création de sites web", "Sites e-commerce", "Applications mobiles", "Plateformes sur mesure"],
  },
  {
    color: "#c9a55a",
    items: ["Factures automatiques", "Devis automatiques", "Agenda / planning", "Bloc-notes"],
  },
  {
    color: "#a78bfa",
    items: ["Automatisation & IA", "Coaching IA"],
  },
  {
    color: "#c9a55a",
    items: ["Visuels publicitaires", "Montage vidéo", "Retouche photo"],
  },
  {
    color: "#60a5fa",
    items: ["Auto-entrepreneur", "Déclarations URSSAF", "Assist. administrative"],
  },
  {
    color: "#4ade80",
    items: ["Recherche fournisseurs", "Marchés publics"],
  },
  {
    color: "#a78bfa",
    items: ["Soutien scolaire"],
  },
] as const;

/* ── Tableau solutions ─────────────────────────────────────── */
const SOLUTIONS_TABLE = [
  { icon: Globe,          color: "#c9a55a", besoin: "Présence en ligne",    solution: "Création de sites web premium",                 resultat: "Une image professionnelle et plus de crédibilité" },
  { icon: Shield,         color: "#60a5fa", besoin: "Gestion quotidienne",  solution: "Outils, dashboard et espace client",             resultat: "Un pilotage simple, clair et centralisé" },
  { icon: Zap,            color: "#a78bfa", besoin: "Productivité",         solution: "Automatisation et intelligence artificielle",    resultat: "Gain de temps et meilleures décisions" },
  { icon: TrendingUp,     color: "#4ade80", besoin: "Croissance",           solution: "Applications, plateformes et outils sur mesure", resultat: "Une structure digitale qui évolue avec votre entreprise" },
  { icon: HeartHandshake, color: "#c9a55a", besoin: "Accompagnement",       solution: "Support humain + assistant IA",                  resultat: "Des réponses rapides et une meilleure orientation" },
] as const;

/* ── Schéma visuel ─────────────────────────────────────────── */
const SCHEMA_STEPS = [
  { num: "01", icon: Sparkles,   color: "#c9a55a", bg: "rgba(201,165,90,0.12)",  border: "rgba(201,165,90,0.22)",  title: "Idée / besoin",              desc: "Vous arrivez avec un besoin, un projet ou un problème à résoudre." },
  { num: "02", icon: Brain,      color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.22)", title: "Assistant IA DJAMA",         desc: "L'IA vous guide, clarifie vos options et vous aide à choisir la bonne direction." },
  { num: "03", icon: Zap,        color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.22)",  title: "Construction de la solution",desc: "Site, application, outil métier, automatisation ou espace client sur mesure." },
  { num: "04", icon: TrendingUp, color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.20)",  title: "Croissance & gestion",       desc: "Vous pilotez, améliorez et développez votre activité avec une base solide." },
] as const;

/* ── Points IA ─────────────────────────────────────────────── */
const AI_POINTS = [
  "Comprendre votre besoin en profondeur",
  "Être orienté vers la bonne solution DJAMA",
  "Gagner du temps sur votre réflexion",
  "Préparer un projet solide et réaliste",
] as const;

/* ── Conversation IA ───────────────────────────────────────── */
const CHAT_MSGS = [
  { role: "user" as const, text: "Pourquoi choisir DJAMA ?" },
  { role: "ai"   as const, text: "DJAMA est une plateforme qui regroupe plusieurs services digitaux au même endroit : création de sites, automatisation, outils, IA et accompagnement." },
  { role: "user" as const, text: "Et si je veux créer un projet ?" },
  { role: "ai"   as const, text: "Nous analysons votre besoin et proposons une solution adaptée : site web, outil personnalisé ou automatisation." },
  { role: "user" as const, text: "Est-ce que vous utilisez l'IA ?" },
  { role: "ai"   as const, text: "Oui. DJAMA utilise l'intelligence artificielle pour automatiser certaines tâches et accélérer votre travail." },
  { role: "user" as const, text: "Donc je peux gagner du temps ?" },
  { role: "ai"   as const, text: "Exactement. L'objectif est de simplifier votre activité et vous permettre de vous concentrer sur l'essentiel." },
  { role: "user" as const, text: "Parfait. Je vais contacter DJAMA. Merci !" },
  { role: "ai"   as const, text: "Avec plaisir. Notre équipe est prête à vous accompagner." },
];

function ChatSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const started     = useRef(false);
  const [visible,   setVisible]   = useState(0);
  const [isTyping,  setIsTyping]  = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visible, isTyping]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started.current) return;
        started.current = true;
        let idx = 0;
        function next() {
          if (idx >= CHAT_MSGS.length) return;
          const msg = CHAT_MSGS[idx];
          const cur = idx++;
          if (msg.role === "user") {
            setTimeout(() => { setVisible(cur + 1); next(); }, cur === 0 ? 600 : 450);
          } else {
            setTimeout(() => {
              setIsTyping(true);
              setTimeout(() => { setIsTyping(false); setVisible(cur + 1); next(); }, 750);
            }, 450);
          }
        }
        next();
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[var(--surface)] py-24">
      <div className="mx-auto max-w-2xl px-6">

        {/* En-tête */}
        <div className="mb-10 text-center">
          <span className="badge badge-gold-light"><Brain size={10} /> Intelligence artificielle</span>
          <h2 className="display-section mt-4 text-[var(--ink)]">
            <MultiLineReveal
              lines={["Demandez à l'IA pourquoi", "choisir DJAMA"]}
              highlight={1}
              stagger={0.1}
              wordStagger={0.05}
              lineClassName="justify-center"
            />
          </h2>
        </div>

        {/* Carte chat */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-[0_32px_80px_rgba(0,0,0,0.45)]">

          {/* Barre de titre */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#111114] px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(167,139,250,0.15)]">
              <Brain size={15} className="text-[#a78bfa]" />
            </div>
            <div>
              <p className="text-[0.85rem] font-bold text-white">DJAMA IA</p>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                <p className="text-[0.7rem] text-white/38">En ligne</p>
              </div>
            </div>
            <div className="ml-auto flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
            </div>
          </div>

          {/* Zone messages */}
          <div className="flex flex-col gap-3 overflow-y-auto px-5 py-5" style={{ maxHeight: "390px" }}>

            {CHAT_MSGS.slice(0, visible).map((msg, i) => (
              <div key={i} className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "ai" && (
                  <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(167,139,250,0.15)]">
                    <Brain size={12} className="text-[#a78bfa]" />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={
                    msg.role === "user"
                      ? "max-w-[72%] rounded-2xl rounded-br-sm bg-[#c9a55a] px-4 py-2.5 text-[0.82rem] font-semibold leading-relaxed text-[#1a1308]"
                      : "max-w-[78%] rounded-2xl rounded-bl-sm border border-white/[0.06] bg-[#18181c] px-4 py-2.5 text-[0.82rem] leading-relaxed text-white/72"
                  }
                >
                  {msg.text}
                </motion.div>
              </div>
            ))}

            {/* Indicateur de frappe */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-end gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(167,139,250,0.15)]">
                    <Brain size={12} className="text-[#a78bfa]" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm border border-white/[0.06] bg-[#18181c] px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-white/28"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Fausse barre de saisie */}
          <div className="flex items-center gap-3 border-t border-white/[0.06] bg-[#111114] px-4 py-3.5">
            <div className="flex-1 rounded-xl bg-white/[0.04] px-4 py-2.5">
              <p className="text-[0.78rem] text-white/18">Écrivez votre message…</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.12)]">
              <ArrowRight size={15} className="text-[#c9a55a]/50" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Constantes ─────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Sites web", "Plateformes SaaS", "Automatisation", "Applications",
  "E-commerce", "Outils métiers", "IA", "Design", "SEO",
] as const;
const STAT_ICONS   = [Users, TrendingUp, Zap, HeartHandshake] as const;
const STAT_COLORS  = ["#c9a55a", "#60a5fa", "#4ade80", "#a78bfa"] as const;

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
/* ── Wrapper : fournit LanguageProvider + layout public ──────── */
export default function Page() {
  return (
    <LanguageProvider>
      <Navbar />
      <main><HomeContent /></main>
      <Footer />
      <AssistantDJAMA />
    </LanguageProvider>
  );
}

/* ── Contenu de la page d'accueil ────────────────────────────── */
function HomeContent() {
  const data  = getSiteData();
  const { dict } = useLanguage();
  const h = dict.home;

  // ── Supabase overrides (fallback sur i18n si Supabase indisponible) ──
  const { get } = useSiteSettings();

  const heroBadge        = get("hero.badge")           || h.hero.badge;
  const heroTitle1       = get("hero.title1")          || h.hero.titleLines[0];
  const heroTitle2       = get("hero.title2")          || h.hero.titleLines[1];
  const heroSubtitle     = get("hero.subtitle")        || h.hero.subtitle;
  const ctaPrimText      = get("cta.primary.text")     || h.hero.cta1;
  const ctaPrimHref      = get("cta.primary.href")     || "/contact";
  const ctaSecText       = get("cta.secondary.text")   || h.hero.cta2;
  const ctaSecHref       = get("cta.secondary.href")   || "/services";
  const ctaFinalTitle1   = get("cta.final.title1")     || h.cta.titleLines[0];
  const ctaFinalTitle2   = get("cta.final.title2")     || h.cta.titleLines[1];
  const ctaFinalSubtitle = get("cta.final.subtitle")   || h.cta.subtitle;

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">

        <div className="pointer-events-none absolute -left-24 -top-8 h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[120px]" />
        <div className="pointer-events-none absolute right-[-60px] top-[30%] h-[300px] w-[300px] rounded-full bg-[rgba(167,139,250,0.05)] blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-40 pt-48">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_260px]">

            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="mb-7">
                <span className="badge badge-gold-dark"><Sparkles size={10} /> {heroBadge}</span>
              </motion.div>

              <h1 className="display-hero text-white">
                <MultiLineReveal lines={[heroTitle1, heroTitle2]} highlight={1} stagger={0.14} wordStagger={0.055} delay={0.06} lineClassName="block" />
              </h1>

              <FadeReveal delay={0.55} as="p" className="mt-6 max-w-[520px] text-[1.05rem] leading-[1.85] text-white/48">
                {heroSubtitle}
              </FadeReveal>

              <FadeReveal delay={0.7} className="mt-9 flex flex-wrap gap-3">
                <Link href={ctaPrimHref} className="btn-primary px-7 py-[0.875rem] text-[0.925rem]">
                  {ctaPrimText} <ArrowRight size={15} />
                </Link>
                <Link href={ctaSecHref} className="btn-ghost px-7 py-[0.875rem] text-[0.925rem]">
                  {ctaSecText}
                </Link>
              </FadeReveal>

              <FadeReveal delay={0.85} className="mt-10 flex items-center gap-5 border-t border-white/[0.06] pt-9">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ zIndex: 5 - i }} className="h-8 w-8 rounded-full border-2 border-[#09090b] bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]" />
                  ))}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-[#c9a55a] text-[#c9a55a]" />)}
                  </div>
                  <p className="text-[0.82rem] text-white/38">
                    <span className="font-semibold text-white/65">{h.hero.socialProof}</span>
                  </p>
                </div>
              </FadeReveal>
            </div>

            {/* Panneau services — desktop */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease }}
              className="hidden lg:block"
            >
              <div className="overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <p className="ml-auto text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/25">DJAMA · Services</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {HERO_SERVICE_GROUPS.map((group, gi) => (
                    <div key={gi}>
                      {gi > 0 && <div className="mb-2 h-px bg-white/[0.05]" />}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {group.items.map((item) => (
                          <div
                            key={item}
                            className="group/s flex items-start gap-1.5 py-[3px] cursor-default"
                          >
                            <div
                              className="mt-[4px] h-[5px] w-[5px] shrink-0 rounded-full transition-transform duration-150 group-hover/s:scale-125"
                              style={{ background: group.color }}
                            />
                            <span className="text-[0.66rem] leading-[1.3] text-white/52 transition-colors duration-150 group-hover/s:text-white/80">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/[0.06] bg-[rgba(201,165,90,0.04)] px-4 py-4 text-center">
                  <p className="text-[2rem] font-black leading-none tracking-tight text-[#c9a55a]">50+</p>
                  <p className="mt-1 text-[0.72rem] text-white/35">clients accompagnés depuis 2022</p>
                  <div className="mt-2.5 flex justify-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={9} className="fill-[#c9a55a] text-[#c9a55a]" />)}
                  </div>
                </div>
              </div>
            </motion.aside>

          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════
          2. STATS
      ══════════════════════════════════════════════ */}
      <section className="border-b border-[var(--border)] py-14">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {h.stats.map(({ value, label, sub }, i) => {
              const Icon  = STAT_ICONS[i];
              const color = STAT_COLORS[i];
              return (
                <motion.div
                  key={label} variants={cardReveal}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)]"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: `${color}14` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <p className="text-[2rem] font-black leading-none tracking-tight text-[var(--ink)]">{value}</p>
                  <div>
                    <p className="text-[0.8rem] font-bold leading-snug text-[var(--ink)]">{label}</p>
                    <p className="mt-0.5 text-[0.72rem] text-[var(--muted)]">{sub}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          3. ÉCOSYSTÈME DIGITAL
      ══════════════════════════════════════════════ */}
      <section className="bg-[var(--ink)] py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          {/* Titre */}
          <div className="mb-14 text-center">
            <motion.div variants={fadeIn} className="mb-6 flex items-center justify-center gap-3">
              <div className="h-px flex-1 max-w-[80px] bg-white/[0.08]" />
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-white/35">
                DJAMA <span className="text-[#c9a55a]">·</span> ÉCOSYSTÈME DIGITAL
              </p>
              <div className="h-px flex-1 max-w-[80px] bg-white/[0.08]" />
            </motion.div>

            <h2 className="display-section text-white">
              <MultiLineReveal
                lines={["Tout ce dont vous avez besoin,", "réuni en une seule plateforme."]}
                highlight={1}
                stagger={0.1}
                wordStagger={0.04}
                lineClassName="justify-center text-white"
              />
            </h2>
            <FadeReveal delay={0.2} as="p" className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/40">
              De la création digitale à la formation, en passant par l'automatisation — DJAMA couvre l'intégralité de votre présence et de votre activité.
            </FadeReveal>
          </div>

          {/* Grille catégories */}
          <motion.div
            variants={staggerContainerFast}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {ECOSYSTEM.map(({ icon: Icon, color, bg, border, category, services }) => (
              <motion.div
                key={category}
                variants={cardReveal}
                className="group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
                style={{ borderColor: border, background: "rgba(255,255,255,0.03)" }}
              >
                {/* Barre top colorée */}
                <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />

                <div className="flex flex-1 flex-col p-5">
                  {/* En-tête catégorie */}
                  <div className="mb-4 flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <Icon size={15} style={{ color }} />
                    </div>
                    <h3 className="text-[0.82rem] font-extrabold text-white/85">{category}</h3>
                  </div>

                  {/* Liste services */}
                  <ul className="flex flex-col gap-2">
                    {services.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-[0.78rem] text-white/45 transition-colors duration-200 group-hover:text-white/60">
                        <div className="h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Chiffre 50+ animé */}
          <motion.div
            variants={fadeIn}
            className="mt-14 flex flex-col items-center gap-3"
          >
            <div className="h-px w-24 bg-white/[0.08]" />
            <p className="text-[3.5rem] font-black leading-none tracking-tight text-[#c9a55a]">
              <CountUp to={50} suffix="+" />
            </p>
            <p className="text-[0.82rem] text-white/35">clients accompagnés depuis 2022</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={11} className="fill-[#c9a55a] text-[#c9a55a]" />)}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          5. TABLEAU SOLUTIONS
      ══════════════════════════════════════════════ */}
      <section className="py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-5xl px-6"
        >
          <div className="mb-14 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> Plateforme complète
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Une seule plateforme pour piloter", "votre présence digitale."]}
                highlight={1}
                stagger={0.1}
                wordStagger={0.045}
                lineClassName="justify-center"
              />
            </h2>
            <FadeReveal delay={0.18} as="p" className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[var(--muted)]">
              DJAMA réunit les outils essentiels pour créer, automatiser, gérer et développer votre activité depuis un seul espace.
            </FadeReveal>
          </div>

          {/* Table desktop */}
          <motion.div variants={staggerContainerFast} className="hidden overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm md:block">
            <div className="grid grid-cols-[1fr_1.4fr_1.4fr] border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3.5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Besoin</p>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#c9a55a]">Solution DJAMA</p>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Résultat</p>
            </div>
            {SOLUTIONS_TABLE.map(({ icon: Icon, color, besoin, solution, resultat }, i) => (
              <motion.div
                key={besoin} variants={cardReveal}
                className={`group grid grid-cols-[1fr_1.4fr_1.4fr] items-center gap-4 px-6 py-5 transition-colors duration-200 hover:bg-[var(--surface)] ${i < SOLUTIONS_TABLE.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: `${color}12` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--ink)]">{besoin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-bold" style={{ color }}>{solution}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#4ade80]" />
                  <span className="text-sm leading-snug text-[var(--muted)]">{resultat}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Cards mobile */}
          <motion.div variants={staggerContainerFast} className="flex flex-col gap-3 md:hidden">
            {SOLUTIONS_TABLE.map(({ icon: Icon, color, besoin, solution, resultat }) => (
              <motion.div key={besoin} variants={cardReveal} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}12` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <span className="font-bold text-[var(--ink)]">{besoin}</span>
                  </div>
                  <p className="mb-2 text-sm font-bold" style={{ color }}>{solution}</p>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#4ade80]" />
                    <p className="text-xs leading-relaxed text-[var(--muted)]">{resultat}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          6. SCHÉMA VISUEL (dark)
      ══════════════════════════════════════════════ */}
      <section className="hero-dark relative overflow-hidden py-28">
        <div className="pointer-events-none absolute left-[20%] top-0 h-[280px] w-[350px] rounded-full bg-[rgba(167,139,250,0.07)] blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 right-[15%] h-[220px] w-[280px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[70px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          <div className="mb-16 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> Notre processus
            </motion.span>
            <h2 className="display-section mt-4 text-white">
              <MultiLineReveal
                lines={["Comment DJAMA transforme", "une idée en solution concrète."]}
                highlight={1}
                stagger={0.1}
                wordStagger={0.045}
                lineClassName="justify-center text-white"
              />
            </h2>
          </div>

          <motion.div variants={staggerContainerFast} className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0">
            {SCHEMA_STEPS.flatMap(({ num, icon: Icon, color, bg, border, title, desc }, i) => {
              const card = (
                <motion.div
                  key={`step-${num}`} variants={cardReveal}
                  className="group relative flex flex-1 flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)]"
                  style={{ borderColor: border, background: bg }}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: `inset 0 0 40px ${color}0d` }} />
                  <div className="mb-5 flex items-center justify-between">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[0.7rem] font-black" style={{ background: `${color}20`, color }}>
                      {num}
                    </span>
                    <span className="text-5xl font-black leading-none opacity-[0.06] select-none" style={{ color }}>{num}</span>
                  </div>
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110" style={{ background: bg, borderColor: border }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="text-[0.9rem] font-extrabold text-white/90">{title}</h3>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-white/45">{desc}</p>
                  <div className="mt-6 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-14" style={{ background: color }} />
                </motion.div>
              );

              if (i < SCHEMA_STEPS.length - 1) {
                return [card, (
                  <div key={`conn-${i}`} className="flex shrink-0 items-center justify-center lg:w-12">
                    <div className="hidden lg:flex lg:flex-col lg:items-center">
                      <div className="h-px w-8 bg-gradient-to-r from-white/15 to-white/08" />
                      <ArrowRight size={13} className="text-white/20 -ml-1 -mt-[9px]" />
                    </div>
                    <div className="flex flex-col items-center lg:hidden">
                      <div className="h-5 w-px bg-white/15" />
                      <div className="h-2 w-2 rotate-45 border-b border-r border-white/20" style={{ marginTop: "-5px" }} />
                    </div>
                  </div>
                )];
              }
              return [card];
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          8. RÉALISATIONS
      ══════════════════════════════════════════════ */}
      <section className="py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-5xl px-6"
        >
          {/* En-tête */}
          <div className="mb-12 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> Nos réalisations
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Des entreprises nous font", "déjà confiance"]}
                highlight={1}
                stagger={0.11}
                wordStagger={0.05}
                lineClassName="justify-center"
              />
            </h2>
            <FadeReveal delay={0.18} as="p" className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)]">
              Depuis 2022, DJAMA accompagne entrepreneurs, entreprises et créateurs dans leurs projets digitaux : sites web, plateformes, automatisation et outils sur mesure.
            </FadeReveal>
          </div>

          {/* Bande défilante */}
          <FadeReveal delay={0.28}>
            <style>{`
              @keyframes djama-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
              .djama-ticker-track { animation: djama-ticker 32s linear infinite; }
              .djama-ticker-wrap:hover .djama-ticker-track { animation-play-state: paused; }
            `}</style>
            <div className="djama-ticker-wrap overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-[1.1rem]">
              <div className="djama-ticker-track flex items-center whitespace-nowrap">
                {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span key={i} className="inline-flex shrink-0 items-center gap-3 px-5 text-[0.85rem] font-semibold text-[var(--muted)]">
                    {item}
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#c9a55a] opacity-70" />
                  </span>
                ))}
              </div>
            </div>
          </FadeReveal>

          {/* Bas de section */}
          <FadeReveal delay={0.4} className="mt-10 flex flex-col items-center gap-6 text-center">
            <p className="text-base text-[var(--muted)]">
              <span className="font-extrabold text-[var(--ink)]">50+ projets</span> accompagnés pour différents clients et entreprises.
            </p>
            <Link href="/realisations" className="btn-primary px-8 py-[0.9rem] text-[0.925rem]">
              Découvrir nos réalisations <ArrowRight size={15} />
            </Link>
          </FadeReveal>

        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          8.5. LOGOS PARTENAIRES
      ══════════════════════════════════════════════ */}
      <PartnerLogosSection />

      {/* ══════════════════════════════════════════════
          9. POURQUOI DJAMA — CHAT IA
      ══════════════════════════════════════════════ */}
      <ChatSection />

      {/* ══════════════════════════════════════════════
          10. MESSAGE IA — DÉTAILLÉ (dark)
      ══════════════════════════════════════════════ */}
      <section className="hero-dark relative overflow-hidden py-28">
        <div className="pointer-events-none absolute left-[-60px] top-[20%] h-[300px] w-[300px] rounded-full bg-[rgba(167,139,250,0.08)] blur-[90px]" />
        <div className="pointer-events-none absolute bottom-[10%] right-[-40px] h-[250px] w-[250px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[80px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_380px]">

            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-dark">
                <Brain size={10} /> Assistant IA
              </motion.span>
              <h2 className="display-section mt-4 text-white">
                <MultiLineReveal lines={["Parlez avec notre IA", "avant même de commencer."]} highlight={0} stagger={0.12} wordStagger={0.05} lineClassName="text-white" />
              </h2>
              <FadeReveal delay={0.22} as="p" className="mt-5 max-w-md text-base leading-[1.85] text-white/48">
                Notre assistant intelligent vous aide à comprendre votre projet, identifier les meilleures options et avancer plus vite avec une vision claire.
              </FadeReveal>

              <FadeReveal delay={0.32} className="mt-7 flex flex-col gap-3">
                {AI_POINTS.map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(167,139,250,0.18)]">
                      <CheckCircle2 size={11} className="text-[#a78bfa]" />
                    </div>
                    <span className="text-sm text-white/60">{point}</span>
                  </div>
                ))}
              </FadeReveal>

              <FadeReveal delay={0.44} className="mt-9">
                <button
                  onClick={() => {
                    const btn = document.querySelector<HTMLButtonElement>("[aria-label=\"Ouvrir l'assistant DJAMA\"]");
                    btn?.click();
                  }}
                  className="btn-primary text-sm"
                >
                  <MessageCircle size={15} />
                  Parler avec l&apos;assistant IA
                </button>
              </FadeReveal>
            </div>

            {/* Carte chat */}
            <motion.div variants={cardReveal}>
              <div className="relative overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.18)] bg-white/[0.03] shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
                <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-[rgba(167,139,250,0.08)] blur-[60px]" />
                <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                    <Brain size={13} className="text-white" />
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#09090b] bg-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Assistant DJAMA</p>
                    <p className="text-[0.6rem] text-white/30">En ligne · Répond instantanément</p>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex gap-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                      <Brain size={10} className="text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-2.5 text-[0.82rem] leading-relaxed text-white/75">
                      Bonjour 👋 Quel est votre projet ?<br />Je peux vous orienter rapidement.
                    </div>
                  </div>
                  <div className="flex flex-row-reverse gap-2.5">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#a78bfa] px-4 py-2.5 text-[0.82rem] font-medium text-white">
                      J&apos;aimerais créer une application.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                      <Brain size={10} className="text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-2.5 text-[0.82rem] leading-relaxed text-white/75">
                      Parfait — mobile ou web ? Pour quel secteur ? Je vous propose les meilleures options DJAMA.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
                  <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs text-white/20">
                    Décrivez votre projet…
                  </div>
                  <button
                    onClick={() => {
                      const btn = document.querySelector<HTMLButtonElement>("[aria-label=\"Ouvrir l'assistant DJAMA\"]");
                      btn?.click();
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf] text-white transition hover:brightness-110"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          11. CTA FINAL
      ══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 pb-28 pt-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.16)] bg-[var(--ink)] px-8 py-24 text-center md:px-20"
        >
          <div className="pointer-events-none absolute left-[10%] top-[-70px] h-[240px] w-[320px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[70px]" />
          <div className="pointer-events-none absolute bottom-[-50px] right-[8%] h-[200px] w-[240px] rounded-full bg-[rgba(96,165,250,0.04)] blur-[60px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> {h.cta.label}
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal lines={[ctaFinalTitle1, ctaFinalTitle2]} highlight={1} stagger={0.13} wordStagger={0.065} lineClassName="justify-center text-white" />
            </h2>

            <FadeReveal delay={0.26} as="p" className="mx-auto mt-5 max-w-md text-[1rem] leading-[1.82] text-white/40">
              {ctaFinalSubtitle}
            </FadeReveal>

            <FadeReveal delay={0.4} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href={ctaPrimHref} className="btn-primary px-8 py-[0.95rem] text-[0.925rem]">
                {ctaPrimText} <ArrowRight size={15} />
              </Link>
              <Link href={ctaSecHref} className="btn-ghost px-8 py-[0.95rem] text-[0.925rem]">
                {ctaSecText}
              </Link>
            </FadeReveal>

            <FadeReveal delay={0.52} className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-7">
              <a href={`mailto:${data.contact.email}`} className="flex items-center gap-2 text-[0.82rem] text-white/28 transition-colors duration-200 hover:text-white/58">
                <Mail size={12} className="text-[#c9a55a]" />
                {data.contact.email}
              </a>
              <span className="hidden text-white/10 sm:inline">·</span>
              <span className="flex items-center gap-2 text-[0.82rem] text-white/28">
                <CheckCircle2 size={12} className="text-[#c9a55a]" />
                Sans engagement · Réponse sous 24h
              </span>
              <span className="hidden text-white/10 sm:inline">·</span>
              <span className="flex items-center gap-2 text-[0.82rem] text-white/28">
                <CheckCircle2 size={12} className="text-[#c9a55a]" />
                Appel découverte gratuit · 30 min
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
