"use client";

// ── Layout — importé ici car cette page est hors du route group (public)
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantDJAMA from "@/components/AssistantDJAMA";
import { LanguageProvider } from "@/lib/language-context";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Mail, Star, Zap, Users2, Shield,
  CheckCircle2, Sparkles, TrendingUp, HeartHandshake,
  Globe, Brain, MessageCircle,
  LayoutDashboard, Smartphone, Palette, Briefcase,
  LineChart, GraduationCap, Code2, BarChart3,
  Receipt, CalendarDays, StickyNote, FolderOpen, Gem,
  Network, Landmark,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import PartnerLogosSection from "@/components/PartnerLogosSection";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";
const GOLDR = "201,165,90";

/* ─────────────────────────────────────────────────────
   CountUp
───────────────────────────────────────────────────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref  = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !done.current) {
        done.current = true;
        let n = 0;
        const step = Math.max(1, Math.ceil(to / 40));
        const id = setInterval(() => {
          n = Math.min(n + step, to);
          setCount(n);
          if (n >= to) clearInterval(id);
        }, 22);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────
   Données
───────────────────────────────────────────────────── */
const ECOSYSTEM = [
  { icon: LayoutDashboard, color: GOLD,       bg: `rgba(${GOLDR},.09)`,      border: `rgba(${GOLDR},.2)`,       category: "Plateforme SaaS",             services: ["Factures automatiques", "Devis automatiques", "Agenda / planning", "Bloc-notes"] },
  { icon: Brain,           color: "#a78bfa",  bg: "rgba(167,139,250,.09)",   border: "rgba(167,139,250,.2)",    category: "IA & Automatisation",         services: ["Coaching IA", "Automatisation business", "Assistant IA"] },
  { icon: Globe,           color: "#60a5fa",  bg: "rgba(96,165,250,.09)",    border: "rgba(96,165,250,.2)",     category: "Création web",                services: ["Site vitrine", "Site e-commerce"] },
  { icon: Smartphone,      color: "#4ade80",  bg: "rgba(74,222,128,.08)",    border: "rgba(74,222,128,.18)",    category: "Développement digital",       services: ["Application mobile", "Plateforme / outil web sur mesure"] },
  { icon: Palette,         color: GOLD,       bg: `rgba(${GOLDR},.09)`,      border: `rgba(${GOLDR},.2)`,       category: "Création visuelle",           services: ["Visuels publicitaires", "Montage vidéo", "Retouche photo"] },
  { icon: Briefcase,       color: "#60a5fa",  bg: "rgba(96,165,250,.09)",    border: "rgba(96,165,250,.2)",     category: "Business & administratif",    services: ["Création auto-entrepreneur", "Déclarations URSSAF", "Assistance administrative"] },
  { icon: LineChart,       color: "#4ade80",  bg: "rgba(74,222,128,.08)",    border: "rgba(74,222,128,.18)",    category: "Développement business",      services: ["Recherche de fournisseurs internationaux", "Marchés publics & privés"] },
  { icon: GraduationCap,  color: "#a78bfa",  bg: "rgba(167,139,250,.09)",   border: "rgba(167,139,250,.2)",    category: "Formation",                   services: ["Soutien scolaire"] },
] as const;

const HERO_SERVICE_GROUPS = [
  { color: "#60a5fa",  items: ["Création de sites web", "Sites e-commerce", "Applications mobiles", "Plateformes sur mesure"] },
  { color: GOLD,       items: ["Factures automatiques", "Devis automatiques", "Agenda / planning", "Bloc-notes"] },
  { color: "#a78bfa",  items: ["Automatisation & IA", "Coaching IA"] },
  { color: GOLD,       items: ["Visuels publicitaires", "Montage vidéo", "Retouche photo"] },
  { color: "#60a5fa",  items: ["Auto-entrepreneur", "Déclarations URSSAF", "Assist. administrative"] },
  { color: "#4ade80",  items: ["Recherche fournisseurs", "Marchés publics"] },
  { color: "#a78bfa",  items: ["Soutien scolaire"] },
] as const;

const SOLUTIONS_TABLE = [
  { icon: Globe,          color: GOLD,       besoin: "Présence en ligne",    solution: "Création de sites web premium",                 resultat: "Une image professionnelle et plus de crédibilité" },
  { icon: Shield,         color: "#60a5fa",  besoin: "Gestion quotidienne",  solution: "Outils, dashboard et espace client",             resultat: "Un pilotage simple, clair et centralisé" },
  { icon: Zap,            color: "#a78bfa",  besoin: "Productivité",         solution: "Automatisation et intelligence artificielle",    resultat: "Gain de temps et meilleures décisions" },
  { icon: TrendingUp,     color: "#4ade80",  besoin: "Croissance",           solution: "Applications, plateformes et outils sur mesure", resultat: "Une structure digitale qui évolue avec vous" },
  { icon: HeartHandshake, color: GOLD,       besoin: "Accompagnement",       solution: "Support humain + assistant IA",                  resultat: "Des réponses rapides et une meilleure orientation" },
] as const;

const SCHEMA_STEPS = [
  { num: "01", icon: Sparkles,   color: GOLD,       bg: `rgba(${GOLDR},.12)`,      border: `rgba(${GOLDR},.22)`,      title: "Idée / besoin",               desc: "Vous arrivez avec un besoin, un projet ou un problème à résoudre." },
  { num: "02", icon: Brain,      color: "#a78bfa",  bg: "rgba(167,139,250,.12)",   border: "rgba(167,139,250,.22)",   title: "Assistant IA DJAMA",          desc: "L'IA vous guide, clarifie vos options et vous aide à choisir la bonne direction." },
  { num: "03", icon: Code2,      color: "#60a5fa",  bg: "rgba(96,165,250,.12)",    border: "rgba(96,165,250,.22)",    title: "Construction de la solution", desc: "Site, application, outil métier, automatisation ou espace client sur mesure." },
  { num: "04", icon: BarChart3,  color: "#4ade80",  bg: "rgba(74,222,128,.10)",    border: "rgba(74,222,128,.20)",    title: "Croissance & gestion",        desc: "Vous pilotez, améliorez et développez votre activité avec une base solide." },
] as const;

const AI_POINTS = [
  "Comprendre votre besoin en profondeur",
  "Être orienté vers la bonne solution DJAMA",
  "Gagner du temps sur votre réflexion",
  "Préparer un projet solide et réaliste",
] as const;

const TICKER_ITEMS = [
  "Sites web", "Plateformes SaaS", "Automatisation", "Applications",
  "E-commerce", "Outils métiers", "IA", "Design", "SEO",
] as const;

const STAT_ICONS   = [Users2, LineChart, Zap, HeartHandshake] as const;
const STAT_COLORS  = [GOLD, "#60a5fa", "#4ade80", "#a78bfa"] as const;

const ESPACE_TOOLS = [
  { icon: Receipt,         color: GOLD,       title: "Factures & devis",       desc: "Créez et envoyez des documents professionnels en quelques clics." },
  { icon: CalendarDays,    color: "#60a5fa",  title: "Agenda & planning",      desc: "Gérez vos rendez-vous et organisez vos journées sans effort." },
  { icon: StickyNote,      color: "#a78bfa",  title: "Bloc-notes pro",         desc: "Notez vos idées, tâches et mémos en un endroit centralisé." },
  { icon: LayoutDashboard, color: "#4ade80",  title: "Tableau de bord",        desc: "Pilotez votre activité avec une vue claire et complète." },
  { icon: FolderOpen,      color: GOLD,       title: "Espace documents",       desc: "Stockez et retrouvez vos fichiers clients en toute sécurité." },
] as const;

const ESPACE_BENEFITS = [
  { text: "Gain de temps immédiat",    color: GOLD },
  { text: "Image professionnelle",     color: "#60a5fa" },
  { text: "Gestion 100% centralisée",  color: "#4ade80" },
  { text: "Accessible sur tous vos appareils", color: "#a78bfa" },
  { text: "Interface simple et fluide", color: GOLD },
  { text: "Outils toujours à jour",    color: "#60a5fa" },
] as const;

const ESPACE_PILLARS = [
  { val: "5",       label: "outils inclus",    color: GOLD      },
  { val: "11,90€",  label: "par mois",         color: "#60a5fa" },
  { val: "0",       label: "engagement",       color: "#4ade80" },
  { val: "✓",       label: "accès immédiat",   color: "#a78bfa" },
] as const;

/* ═══════════════════════════════════════════════════════
   WRAPPER
═══════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════
   HOME CONTENT
═══════════════════════════════════════════════════════ */
function HomeContent() {
  const data  = getSiteData();
  const { dict } = useLanguage();
  const h = dict.home;
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
    <div className="bg-[#09090b]">

      {/* ══════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">

        {/* Glow orbs */}
        <div className="pointer-events-none absolute -left-32 -top-16 h-[540px] w-[540px] animate-float-slow rounded-full bg-[rgba(201,165,90,.07)] blur-[130px]" />
        <div className="pointer-events-none absolute right-[-60px] top-[20%] h-[400px] w-[400px] animate-float-delayed rounded-full bg-[rgba(167,139,250,.05)] blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[5%] left-[35%] h-[300px] w-[300px] animate-float rounded-full bg-[rgba(96,165,250,.04)] blur-[90px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-40 pt-44 lg:pb-48 lg:pt-52">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_300px]">

            {/* Left: copy */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease }}
                className="mb-7"
              >
                <span className="badge badge-gold-dark relative inline-flex items-center gap-1.5">
                  <Sparkles size={10} />
                  {heroBadge}
                  <span className="absolute inset-0 rounded-full border border-[rgba(201,165,90,.35)] animate-pulse-ring" />
                </span>
              </motion.div>

              {/* Headline */}
              <h1 className="display-hero text-white">
                <MultiLineReveal
                  lines={[heroTitle1, heroTitle2]}
                  highlight={1}
                  stagger={0.14}
                  wordStagger={0.055}
                  delay={0.06}
                  lineClassName="block"
                />
              </h1>

              {/* Subtitle */}
              <FadeReveal delay={0.55} as="p" className="mt-6 max-w-[520px] text-[1.05rem] leading-[1.85] text-white/50">
                {heroSubtitle}
              </FadeReveal>

              {/* CTAs */}
              <FadeReveal delay={0.7} className="mt-9 flex flex-wrap gap-3">
                <Link href={ctaPrimHref}
                  className="btn-primary group relative overflow-hidden px-7 py-[0.9rem] text-[0.925rem]">
                  <span className="relative z-10 flex items-center gap-2">
                    {ctaPrimText} <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
                </Link>
                <Link href={ctaSecHref} className="btn-ghost px-7 py-[0.9rem] text-[0.925rem]">
                  {ctaSecText}
                </Link>
              </FadeReveal>

              {/* Social proof */}
              <FadeReveal delay={0.85} className="mt-10 flex items-center gap-5 border-t border-white/[.07] pt-9">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ zIndex: 5 - i }}
                      className="h-8 w-8 rounded-full border-2 border-[#09090b] bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f] shadow-[0_0_0_1px_rgba(201,165,90,.3)]" />
                  ))}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-[#c9a55a] text-[#c9a55a]" />)}
                  </div>
                  <p className="text-[0.82rem] text-white/40">
                    <span className="font-semibold text-white/65">{h.hero.socialProof}</span>
                  </p>
                </div>
              </FadeReveal>
            </div>

            {/* Right: floating service panel */}
            <motion.aside
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block"
              style={{ animation: "float 9s ease-in-out infinite 1s" }}
            >
              <div className="overflow-hidden rounded-[1.6rem] border border-white/[.1] bg-white/[.03] shadow-[0_32px_80px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl">
                {/* Window chrome */}
                <div className="flex items-center gap-2 border-b border-white/[.06] bg-white/[.025] px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[rgba(248,113,113,.45)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[rgba(251,191,36,.45)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[rgba(74,222,128,.45)]" />
                  <p className="ml-auto text-[0.58rem] font-bold uppercase tracking-[.18em] text-white/22">DJAMA · Services</p>
                </div>
                <div className="px-4 py-4 space-y-2.5">
                  {HERO_SERVICE_GROUPS.map((group, gi) => (
                    <div key={gi}>
                      {gi > 0 && <div className="mb-2.5 h-px bg-white/[.05]" />}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {group.items.map((item) => (
                          <div key={item} className="group/s flex items-start gap-1.5 py-[3px] cursor-default">
                            <div className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full transition-all duration-200 group-hover/s:scale-150 group-hover/s:shadow-[0_0_4px_currentColor]"
                              style={{ background: group.color }} />
                            <span className="text-[0.65rem] leading-[1.35] text-white/48 transition-colors duration-200 group-hover/s:text-white/82">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/[.06] bg-gradient-to-r from-[rgba(201,165,90,.06)] to-transparent px-4 py-4 text-center">
                  <p className="text-[2.2rem] font-black leading-none tracking-tight" style={{ color: GOLD }}>50+</p>
                  <p className="mt-1 text-[0.68rem] text-white/30">clients accompagnés depuis 2022</p>
                  <div className="mt-2 flex justify-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={9} className="fill-[#c9a55a] text-[#c9a55a]" />)}
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>

        {/* Fade to next section */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#09090b] to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════
          2. STATS — dark glassmorphism
      ══════════════════════════════════════════════ */}
      <section className="border-y border-white/[.05] bg-[#0f0f13] py-10 sm:py-14">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {h.stats.map(({ value, label, sub }, i) => {
              const Icon  = STAT_ICONS[i];
              const color = STAT_COLORS[i];
              return (
                <motion.div key={label} variants={cardReveal}
                  whileHover={{ y: -4, transition: { duration: 0.3, ease } }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.03] p-5 text-center transition-all duration-300 hover:border-white/[.14] hover:bg-white/[.05]">
                  {/* Glow on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                    style={{ background: `radial-gradient(ellipse at 50% -10%, ${color}14 0%, transparent 65%)` }} />
                  <motion.div
                    className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border"
                    style={{ background: `${color}18`, borderColor: `${color}35`, boxShadow: `0 0 16px ${color}28` }}
                    whileHover={{ scale: 1.14, boxShadow: `0 0 28px ${color}60` }}
                    transition={{ duration: 0.22 }}
                  >
                    <Icon size={21} style={{ color }} />
                  </motion.div>
                  <p className="text-[2rem] font-black leading-none tracking-tight text-white">{value}</p>
                  <div className="mt-1.5">
                    <p className="text-[0.78rem] font-bold text-white/70">{label}</p>
                    <p className="mt-0.5 text-[0.7rem] text-white/35">{sub}</p>
                  </div>
                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
                    style={{ background: `linear-gradient(90deg,${color},${color}44)` }} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          3. ESPACE CLIENT — Offre phare
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0e0b18] py-20 sm:py-28">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute left-[-100px] top-[15%] h-[380px] w-[380px] rounded-full bg-[rgba(201,165,90,.06)] blur-[100px]" />
        <div className="pointer-events-none absolute right-[-80px] bottom-[10%] h-[300px] w-[300px] rounded-full bg-[rgba(167,139,250,.05)] blur-[90px]" />
        <div className="pointer-events-none absolute left-[40%] top-[-60px] h-[220px] w-[220px] rounded-full bg-[rgba(96,165,250,.04)] blur-[70px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          {/* ── Header centré ── */}
          <div className="mb-14 text-center">
            <motion.div variants={fadeIn} className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.35)] bg-[rgba(201,165,90,.1)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em]" style={{ color: GOLD }}>
              <Gem size={11} />
              Offre essentielle DJAMA
            </motion.div>
            <h2 className="display-section text-white">
              <MultiLineReveal
                lines={["Vos outils pros, tout-en-un", "à 11,90€ / mois."]}
                highlight={1} stagger={0.1} wordStagger={0.04}
                lineClassName="justify-center text-white"
              />
            </h2>
            <FadeReveal delay={0.2} as="p" className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/40">
              Un seul abonnement pour gérer votre activité d'indépendant. Sans engagement, résiliable à tout moment, accès immédiat.
            </FadeReveal>
          </div>

          {/* ── 4 pilliers ── */}
          <motion.div variants={staggerContainerFast} className="mb-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ESPACE_PILLARS.map(({ val, label, color }) => (
              <motion.div key={label} variants={cardReveal}
                whileHover={{ y: -4, transition: { duration: 0.25, ease } }}
                className="group relative overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-5 text-center transition-all duration-300 hover:border-white/[.15]"
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(ellipse at 50% -20%,${color}18 0%,transparent 70%)` }} />
                <p className="text-[1.9rem] font-black leading-none tracking-tight" style={{ color }}>{val}</p>
                <p className="mt-1.5 text-[0.7rem] font-semibold text-white/40">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Main grid ── */}
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_370px]">

            {/* ── Left : outils + bénéfices ── */}
            <div>
              <motion.p variants={fadeIn} className="mb-5 text-[0.62rem] font-black uppercase tracking-[.24em] text-white/25">
                5 outils inclus dans l'abonnement
              </motion.p>

              {/* Tool cards */}
              <motion.div variants={staggerContainerFast} className="grid gap-3 sm:grid-cols-2">
                {ESPACE_TOOLS.map(({ icon: Icon, color, title, desc }) => (
                  <motion.div key={title} variants={cardReveal}
                    whileHover={{ y: -5, transition: { duration: 0.25, ease } }}
                    className="group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.025] p-4 transition-all duration-300 hover:border-white/[.14] hover:bg-white/[.04]"
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: `radial-gradient(ellipse at 10% 50%,${color}0e 0%,transparent 65%)` }} />
                    <motion.div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                      style={{ background: `${color}15`, borderColor: `${color}30`, boxShadow: `0 0 14px ${color}20` }}
                      whileHover={{ scale: 1.12, boxShadow: `0 0 24px ${color}50` }}
                      transition={{ duration: 0.22 }}
                    >
                      <Icon size={19} style={{ color }} />
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-[0.88rem] font-extrabold text-white/88">{title}</p>
                      <p className="mt-0.5 text-[0.74rem] leading-snug text-white/38">{desc}</p>
                    </div>
                  </motion.div>
                ))}

                {/* Badge "+ à venir" dans la 6e cellule */}
                <motion.div variants={cardReveal}
                  className="flex items-center justify-center rounded-2xl border border-dashed border-white/[.09] bg-transparent px-4 py-4"
                >
                  <p className="text-center text-[0.72rem] font-bold text-white/22">
                    + nouvelles fonctionnalités<br />régulièrement
                  </p>
                </motion.div>
              </motion.div>

              {/* Bénéfices */}
              <motion.div variants={staggerContainerFast} className="mt-5 grid grid-cols-2 gap-2">
                {ESPACE_BENEFITS.map(({ text, color }) => (
                  <motion.div key={text} variants={fadeIn}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[.06] bg-white/[.02] px-3.5 py-2.5"
                  >
                    <CheckCircle2 size={12} style={{ color }} className="shrink-0" />
                    <span className="text-[0.77rem] text-white/52">{text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTAs mobiles (cachés sur desktop) */}
              <FadeReveal delay={0.3} className="mt-8 flex flex-col gap-2.5 sm:flex-row lg:hidden">
                <Link href="/espace-client"
                  className="btn-primary group relative flex-1 justify-center overflow-hidden py-[0.9rem] text-[0.92rem]">
                  <span className="relative z-10 flex items-center gap-2">
                    S'abonner — 11,90€/mois
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
                </Link>
                <Link href="/espace-client"
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[.09] bg-white/[.03] py-[0.9rem] text-sm font-semibold text-white/55 transition-all duration-200 hover:border-white/[.18] hover:text-white/80">
                  Voir les outils <ArrowRight size={13} />
                </Link>
              </FadeReveal>
            </div>

            {/* ── Right : pricing card ── */}
            <motion.div variants={cardReveal} className="hidden lg:block">
              <div className="relative overflow-hidden rounded-[1.75rem] border shadow-[0_32px_70px_rgba(0,0,0,.55)]"
                style={{ borderColor: `rgba(${GOLDR},.28)`, background: "#0f0f13" }}
              >
                {/* Top glow */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_90%_80%_at_50%_0%,rgba(201,165,90,.13),transparent)]" />
                {/* Gold top bar */}
                <div className="h-[2.5px] w-full" style={{ background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }} />

                {/* Header */}
                <div className="border-b px-7 pt-7 pb-6 text-center" style={{ borderColor: `rgba(${GOLDR},.12)` }}>
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.6rem] font-black uppercase tracking-[.22em]"
                    style={{ background: `rgba(${GOLDR},.1)`, borderColor: `rgba(${GOLDR},.25)`, color: GOLD }}>
                    <Sparkles size={9} /> Essentiel DJAMA
                  </div>

                  {/* Prix */}
                  <div className="mt-2 flex items-end justify-center gap-1">
                    <span className="text-[3.4rem] font-black leading-none tracking-tight text-white">11,90</span>
                    <div className="mb-2.5 flex flex-col items-start leading-none">
                      <span className="text-xl font-black" style={{ color: GOLD }}>€</span>
                      <span className="text-[0.62rem] font-bold text-white/32">/mois</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[0.7rem] font-medium text-white/32">
                    Sans engagement · Résiliable à tout moment
                  </p>
                </div>

                {/* Features list */}
                <div className="space-y-2.5 px-7 py-6">
                  {[
                    { label: "Factures & devis illimités",      highlight: false },
                    { label: "Agenda & planning intégré",       highlight: false },
                    { label: "Bloc-notes professionnel",        highlight: false },
                    { label: "Tableau de bord centralisé",      highlight: false },
                    { label: "Espace documents sécurisé",       highlight: false },
                    { label: "Accès immédiat après paiement",   highlight: true  },
                    { label: "Support DJAMA inclus",            highlight: true  },
                  ].map(({ label, highlight }) => (
                    <div key={label} className="flex items-center gap-3">
                      <CheckCircle2 size={14} className="shrink-0"
                        style={{ color: highlight ? GOLD : "rgba(255,255,255,.38)" }} />
                      <span className={`text-[0.82rem] ${highlight ? "font-semibold" : ""}`}
                        style={{ color: highlight ? GOLD : "rgba(255,255,255,.6)" }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="space-y-2.5 px-7 pb-7">
                  <Link href="/espace-client"
                    className="btn-primary group relative w-full justify-center overflow-hidden py-[0.95rem] text-[0.92rem]">
                    <span className="relative z-10 flex items-center gap-2">
                      S'abonner maintenant
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
                  </Link>
                  <Link href="/espace-client"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[.08] bg-white/[.03] py-3 text-sm font-semibold text-white/50 transition-all duration-200 hover:border-white/[.16] hover:text-white/75">
                    Voir tous les outils <ArrowRight size={13} />
                  </Link>
                  <p className="text-center text-[0.62rem] text-white/22">
                    Paiement sécurisé · Données protégées
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          4. ACCOMPAGNEMENT — Fournisseurs & Marchés
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#09090b] py-20 sm:py-28">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute left-[-80px] top-[20%] h-[320px] w-[320px] rounded-full bg-[rgba(245,158,11,.07)] blur-[95px]" />
        <div className="pointer-events-none absolute right-[-60px] bottom-[15%] h-[280px] w-[280px] rounded-full bg-[rgba(251,146,60,.05)] blur-[80px]" />
        <div className="pointer-events-none absolute left-[40%] top-[-40px] h-[200px] w-[200px] rounded-full bg-[rgba(201,165,90,.04)] blur-[65px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          {/* ── Header ── */}
          <div className="mb-14 text-center">
            <motion.div variants={fadeIn}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(245,158,11,.32)] bg-[rgba(245,158,11,.09)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em] text-[#f59e0b]">
              <HeartHandshake size={11} />
              Accompagnement sur mesure
            </motion.div>
            <h2 className="display-section text-white">
              <MultiLineReveal
                lines={["DJAMA vous accompagne", "dans vos projets stratégiques."]}
                highlight={0} stagger={0.1} wordStagger={0.04}
                lineClassName="justify-center text-white"
              />
            </h2>
            <FadeReveal delay={0.18} as="p" className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/40">
              Des outils pour avancer seul, ou un accompagnement sur mesure pour aller plus vite.
            </FadeReveal>

            {/* Differentiator strip */}
            <motion.div variants={fadeIn}
              className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/[.07] bg-white/[.025] p-1.5"
            >
              <div className="flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.22)] bg-[rgba(201,165,90,.09)] px-3.5 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#c9a55a]" />
                <span className="text-[0.62rem] font-bold text-[#c9a55a]">Outils — dès 11,90€/mois</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.09)] px-3.5 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                <span className="text-[0.62rem] font-bold text-[#f59e0b]">Accompagnement — sur devis</span>
              </div>
            </motion.div>
          </div>

          {/* ── Two premium cards ── */}
          <motion.div variants={staggerContainerFast} className="grid gap-5 sm:grid-cols-2">

            {/* Card 1 — Recherche fournisseurs */}
            <motion.div variants={cardReveal}
              whileHover={{ y: -10, transition: { duration: 0.32, ease } }}
              className="group relative overflow-hidden rounded-[1.75rem] border transition-all duration-300 hover:shadow-[0_32px_70px_rgba(245,158,11,.18)]"
              style={{ borderColor: "rgba(245,158,11,.2)", background: "rgba(255,255,255,.025)" }}
            >
              {/* Inner glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                style={{ background: "radial-gradient(ellipse at 50% -15%,rgba(245,158,11,.13) 0%,transparent 65%)" }} />
              {/* Top accent */}
              <div className="h-[2.5px] w-full transition-all duration-300 group-hover:h-[3.5px]"
                style={{ background: "linear-gradient(90deg,transparent,#f59e0b,transparent)" }} />

              <div className="relative p-7">
                {/* Icon + badge */}
                <div className="mb-6 flex items-start justify-between">
                  <motion.div
                    className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl border"
                    style={{ background: "rgba(245,158,11,.14)", borderColor: "rgba(245,158,11,.30)", boxShadow: "0 0 18px rgba(245,158,11,.24)" }}
                    whileHover={{ scale: 1.12, boxShadow: "0 0 34px rgba(245,158,11,.58)" }}
                    transition={{ duration: 0.22 }}
                  >
                    <Network size={24} style={{ color: "#f59e0b" }} />
                  </motion.div>
                  <span className="inline-flex items-center rounded-full border border-[rgba(245,158,11,.28)] bg-[rgba(245,158,11,.09)] px-3 py-1 text-[0.6rem] font-black uppercase tracking-[.18em] text-[#f59e0b]">
                    Sur devis
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white">Recherche de fournisseurs</h3>
                <p className="mt-2.5 text-[0.87rem] leading-relaxed text-white/45">
                  Sourcing international, audit et sélection de fournisseurs adaptés à votre activité. Gagnez du temps sur votre approvisionnement.
                </p>

                {/* Chips */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {["Sourcing international", "Négociation", "Sélection", "B2B"].map((t) => (
                    <span key={t} className="rounded-full border border-[rgba(245,158,11,.2)] bg-[rgba(245,158,11,.07)] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[#f59e0b]">
                      {t}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="/contact?besoin=Recherche+de+fournisseurs"
                  className="group/btn mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(245,158,11,.3)] bg-[rgba(245,158,11,.1)] px-5 py-3 text-sm font-bold text-[#f59e0b] transition-all duration-200 hover:border-[rgba(245,158,11,.55)] hover:bg-[rgba(245,158,11,.18)]"
                >
                  Demander un devis
                  <ArrowRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </motion.div>

            {/* Card 2 — Marchés publics */}
            <motion.div variants={cardReveal}
              whileHover={{ y: -10, transition: { duration: 0.32, ease } }}
              className="group relative overflow-hidden rounded-[1.75rem] border transition-all duration-300 hover:shadow-[0_32px_70px_rgba(251,146,60,.18)]"
              style={{ borderColor: "rgba(251,146,60,.2)", background: "rgba(255,255,255,.025)" }}
            >
              {/* Inner glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                style={{ background: "radial-gradient(ellipse at 50% -15%,rgba(251,146,60,.12) 0%,transparent 65%)" }} />
              {/* Top accent */}
              <div className="h-[2.5px] w-full transition-all duration-300 group-hover:h-[3.5px]"
                style={{ background: "linear-gradient(90deg,transparent,#fb923c,transparent)" }} />

              <div className="relative p-7">
                {/* Icon + badge */}
                <div className="mb-6 flex items-start justify-between">
                  <motion.div
                    className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl border"
                    style={{ background: "rgba(251,146,60,.14)", borderColor: "rgba(251,146,60,.30)", boxShadow: "0 0 18px rgba(251,146,60,.22)" }}
                    whileHover={{ scale: 1.12, boxShadow: "0 0 34px rgba(251,146,60,.55)" }}
                    transition={{ duration: 0.22 }}
                  >
                    <Landmark size={24} style={{ color: "#fb923c" }} />
                  </motion.div>
                  <span className="inline-flex items-center rounded-full border border-[rgba(251,146,60,.28)] bg-[rgba(251,146,60,.09)] px-3 py-1 text-[0.6rem] font-black uppercase tracking-[.18em] text-[#fb923c]">
                    Sur devis
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white">Marchés publics & privés</h3>
                <p className="mt-2.5 text-[0.87rem] leading-relaxed text-white/45">
                  Aide aux appels d'offres, rédaction des dossiers de candidature et accompagnement stratégique pour remporter vos marchés.
                </p>

                {/* Chips */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {["Appels d'offres", "Candidature", "Suivi dossier", "Conseil"].map((t) => (
                    <span key={t} className="rounded-full border border-[rgba(251,146,60,.2)] bg-[rgba(251,146,60,.07)] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[#fb923c]">
                      {t}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="/contact?besoin=Marchés+publics+%26+privés"
                  className="group/btn mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(251,146,60,.3)] bg-[rgba(251,146,60,.1)] px-5 py-3 text-sm font-bold text-[#fb923c] transition-all duration-200 hover:border-[rgba(251,146,60,.55)] hover:bg-[rgba(251,146,60,.18)]"
                >
                  Demander un devis
                  <ArrowRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </motion.div>

          </motion.div>

          {/* ── CTA global ── */}
          <FadeReveal delay={0.35} className="mt-12 flex flex-col items-center gap-4 text-center">
            <p className="text-[0.88rem] text-white/32">
              Besoin d&apos;un conseil personnalisé ?{" "}
              <span className="font-semibold text-white/55">Échangeons directement.</span>
            </p>
            <Link href="/contact"
              className="btn-primary group relative overflow-hidden px-8 py-[0.9rem] text-[0.92rem]">
              <span className="relative z-10 flex items-center gap-2">
                <HeartHandshake size={15} />
                Discuter de mon projet
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
            </Link>
          </FadeReveal>

        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          5. ÉCOSYSTÈME DIGITAL
      ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          {/* Titre */}
          <div className="mb-14 text-center">
            <motion.div variants={fadeIn} className="mb-5 flex items-center justify-center gap-3">
              <div className="h-px flex-1 max-w-[80px] bg-white/[.07]" />
              <p className="text-[0.67rem] font-black uppercase tracking-[.28em] text-white/30">
                DJAMA <span style={{ color: GOLD }}>·</span> ÉCOSYSTÈME DIGITAL
              </p>
              <div className="h-px flex-1 max-w-[80px] bg-white/[.07]" />
            </motion.div>
            <h2 className="display-section text-white">
              <MultiLineReveal
                lines={["Tout ce dont vous avez besoin,", "réuni en une seule plateforme."]}
                highlight={1} stagger={0.1} wordStagger={0.04}
                lineClassName="justify-center text-white"
              />
            </h2>
            <FadeReveal delay={0.2} as="p" className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/40">
              De la création digitale à la formation, en passant par l'automatisation — DJAMA couvre l'intégralité de votre présence et de votre activité.
            </FadeReveal>
          </div>

          {/* Grid */}
          <motion.div variants={staggerContainerFast} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ECOSYSTEM.map(({ icon: Icon, color, bg, border, category, services }) => (
              <motion.div key={category} variants={cardReveal}
                whileHover={{ y: -6, transition: { duration: 0.35, ease } }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,.5)]"
                style={{ borderColor: border, background: "rgba(255,255,255,.025)" }}>
                {/* Glow top */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                  style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}1c 0%, transparent 65%)` }} />
                {/* Top bar */}
                <div className="h-[2px] w-full transition-all duration-300 group-hover:h-[3px]"
                  style={{ background: `linear-gradient(90deg,${color},${color}44)` }} />
                <div className="relative flex flex-1 flex-col p-5">
                  <div className="mb-4 flex items-center gap-2.5">
                    <motion.div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: bg, border: `1.5px solid ${border}`, boxShadow: `0 0 14px ${color}20` }}
                      whileHover={{ scale: 1.14, boxShadow: `0 0 24px ${color}50` }}
                      transition={{ duration: 0.22 }}
                    >
                      <Icon size={19} style={{ color }} />
                    </motion.div>
                    <h3 className="text-[0.83rem] font-extrabold text-white/88">{category}</h3>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {services.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-[0.78rem] text-white/40 transition-colors duration-200 group-hover:text-white/65">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-200 group-hover:scale-110" style={{ background: color }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* 50+ counter */}
          <motion.div variants={fadeIn} className="mt-16 flex flex-col items-center gap-3">
            <div className="h-px w-24 bg-white/[.07]" />
            <p className="text-[4rem] font-black leading-none tracking-tight" style={{ color: GOLD }}>
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
          4. SOLUTIONS (dark, visual cards)
      ══════════════════════════════════════════════ */}
      <section className="bg-[#0e0b18] py-20 sm:py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-5xl px-6"
        >
          <div className="mb-14 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> Plateforme complète
            </motion.span>
            <h2 className="display-section mt-4 text-white">
              <MultiLineReveal
                lines={["Une seule plateforme pour piloter", "votre présence digitale."]}
                highlight={1} stagger={0.1} wordStagger={0.045}
                lineClassName="justify-center text-white"
              />
            </h2>
            <FadeReveal delay={0.18} as="p" className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/40">
              DJAMA réunit les outils essentiels pour créer, automatiser, gérer et développer votre activité depuis un seul espace.
            </FadeReveal>
          </div>

          <motion.div variants={staggerContainerFast} className="flex flex-col gap-3">
            {SOLUTIONS_TABLE.map(({ icon: Icon, color, besoin, solution, resultat }, i) => (
              <motion.div key={besoin} variants={cardReveal}
                whileHover={{ x: 4, transition: { duration: 0.25, ease } }}
                className="group relative grid grid-cols-[auto_1fr] items-center gap-4 overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.03] px-5 py-4 transition-all duration-300 hover:border-white/[.15] hover:bg-white/[.05]">
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 h-full w-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-l-2xl"
                  style={{ background: color }} />
                {/* Icon */}
                <motion.div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                  style={{ background: `${color}16`, borderColor: `${color}32`, boxShadow: `0 0 12px ${color}20` }}
                  whileHover={{ scale: 1.12, boxShadow: `0 0 24px ${color}50` }}
                  transition={{ duration: 0.22 }}
                >
                  <Icon size={20} style={{ color }} />
                </motion.div>
                {/* Content — responsive */}
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm font-bold text-white/70 sm:w-36 shrink-0">{besoin}</span>
                  <span className="flex-1 text-sm font-bold transition-colors duration-200" style={{ color }}>{solution}</span>
                  <div className="flex items-center gap-1.5 sm:w-52 shrink-0">
                    <CheckCircle2 size={13} className="shrink-0 text-[#4ade80]" />
                    <span className="text-[0.78rem] leading-snug text-white/40">{resultat}</span>
                  </div>
                </div>
                {/* Row number */}
                <span className="pointer-events-none absolute right-5 text-4xl font-black opacity-[.04] select-none" style={{ color }}>
                  0{i + 1}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          5. PROCESSUS — timeline animée
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute left-[15%] top-0 h-[280px] w-[350px] rounded-full bg-[rgba(167,139,250,.06)] blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 right-[12%] h-[220px] w-[280px] rounded-full bg-[rgba(201,165,90,.05)] blur-[70px]" />

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
                highlight={1} stagger={0.1} wordStagger={0.045}
                lineClassName="justify-center text-white"
              />
            </h2>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="pointer-events-none absolute top-[52px] left-[12%] right-[12%] hidden h-px lg:block"
              style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.08) 20%,rgba(255,255,255,.08) 80%,transparent)" }} />

            <motion.div variants={staggerContainerFast} className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-3">
              {SCHEMA_STEPS.flatMap(({ num, icon: Icon, color, bg, border, title, desc }, i) => {
                const card = (
                  <motion.div key={`step-${num}`} variants={cardReveal}
                    whileHover={{ y: -6, transition: { duration: 0.3, ease } }}
                    className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,.35)]"
                    style={{ borderColor: border, background: bg }}>
                    {/* Inner glow on hover */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 40px ${color}0e` }} />
                    {/* Header row */}
                    <div className="mb-5 flex items-center justify-between">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[0.7rem] font-black"
                        style={{ background: `${color}22`, color }}>
                        {num}
                      </span>
                      <span className="text-5xl font-black leading-none opacity-[.06] select-none" style={{ color }}>{num}</span>
                    </div>
                    {/* Icon */}
                    <motion.div
                      className="mb-4 inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl border"
                      style={{ background: bg, borderColor: border, boxShadow: `0 0 18px ${color}28` }}
                      whileHover={{ scale: 1.14, boxShadow: `0 0 32px ${color}60` }}
                      transition={{ duration: 0.25 }}
                    >
                      <Icon size={23} style={{ color }} />
                    </motion.div>
                    <h3 className="text-[0.9rem] font-extrabold text-white/90">{title}</h3>
                    <p className="mt-2 flex-1 text-[0.82rem] leading-relaxed text-white/45">{desc}</p>
                    {/* Animated underline */}
                    <div className="mt-5 h-0.5 w-8 rounded-full transition-all duration-400 group-hover:w-full"
                      style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
                  </motion.div>
                );

                if (i < SCHEMA_STEPS.length - 1) {
                  return [card, (
                    <div key={`conn-${i}`} className="flex shrink-0 items-center justify-center lg:w-10">
                      <div className="hidden flex-col items-center lg:flex">
                        <div className="h-px w-6 bg-white/[.12]" />
                        <ArrowRight size={12} className="text-white/18 -ml-1 -mt-[9px]" />
                      </div>
                      <div className="flex flex-col items-center lg:hidden">
                        <div className="h-4 w-px bg-white/[.12]" />
                        <div className="h-2 w-2 rotate-45 border-b border-r border-white/15" style={{ marginTop: "-5px" }} />
                      </div>
                    </div>
                  )];
                }
                return [card];
              })}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          6. RÉALISATIONS + TICKER
      ══════════════════════════════════════════════ */}
      <section className="bg-[#0f0f13] py-16 sm:py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-5xl px-6"
        >
          <div className="mb-10 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> Nos réalisations
            </motion.span>
            <h2 className="display-section mt-4 text-white">
              <MultiLineReveal
                lines={["Des entreprises nous font", "déjà confiance"]}
                highlight={1} stagger={0.11} wordStagger={0.05}
                lineClassName="justify-center text-white"
              />
            </h2>
            <FadeReveal delay={0.18} as="p" className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/40">
              Depuis 2022, DJAMA accompagne entrepreneurs, entreprises et créateurs dans leurs projets digitaux.
            </FadeReveal>
          </div>

          {/* Ticker */}
          <FadeReveal delay={0.25}>
            <style>{`
              @keyframes djama-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
              .djama-ticker-track { animation: djama-ticker 28s linear infinite; }
              .djama-ticker-wrap:hover .djama-ticker-track { animation-play-state: paused; }
            `}</style>
            <div className="djama-ticker-wrap overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.03] py-4">
              <div className="djama-ticker-track flex items-center whitespace-nowrap">
                {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span key={i} className="inline-flex shrink-0 items-center gap-3 px-5 text-[0.85rem] font-semibold text-white/40">
                    {item}
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full opacity-70" style={{ background: GOLD }} />
                  </span>
                ))}
              </div>
            </div>
          </FadeReveal>

          <FadeReveal delay={0.38} className="mt-10 flex flex-col items-center gap-5 text-center">
            <p className="text-base text-white/40">
              <span className="font-extrabold text-white">50+ projets</span> accompagnés pour différents clients et entreprises.
            </p>
            <Link href="/realisations" className="btn-primary px-8 py-[0.9rem] text-[0.925rem]">
              Découvrir nos réalisations <ArrowRight size={15} />
            </Link>
          </FadeReveal>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          7. LOGOS PARTENAIRES
      ══════════════════════════════════════════════ */}
      <PartnerLogosSection />

      {/* ══════════════════════════════════════════════
          8. ASSISTANT IA — section premium consolidée
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0d0b1a] py-20 sm:py-28">
        {/* Glows */}
        <div className="pointer-events-none absolute left-[-60px] top-[20%] h-[320px] w-[320px] rounded-full bg-[rgba(167,139,250,.08)] blur-[90px]" />
        <div className="pointer-events-none absolute bottom-[10%] right-[-40px] h-[260px] w-[260px] rounded-full bg-[rgba(201,165,90,.05)] blur-[80px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_390px]">

            {/* Left: copy */}
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-dark">
                <Brain size={10} /> Assistant IA
              </motion.span>
              <h2 className="display-section mt-4 text-white">
                <MultiLineReveal
                  lines={["Parlez avec notre IA", "avant même de commencer."]}
                  highlight={0} stagger={0.12} wordStagger={0.05}
                  lineClassName="text-white"
                />
              </h2>
              <FadeReveal delay={0.22} as="p" className="mt-5 max-w-md text-base leading-[1.85] text-white/48">
                Notre assistant intelligent vous aide à comprendre votre projet, identifier les meilleures options et avancer plus vite avec une vision claire.
              </FadeReveal>

              <FadeReveal delay={0.32} className="mt-7 flex flex-col gap-3">
                {AI_POINTS.map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(167,139,250,.18)]">
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

            {/* Right: premium chat mockup */}
            <motion.div variants={cardReveal}>
              <div className="relative overflow-hidden rounded-2xl border border-[rgba(167,139,250,.18)] bg-white/[.02] shadow-[0_28px_70px_rgba(0,0,0,.4)]">
                <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-[rgba(167,139,250,.07)] blur-[60px]" />

                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-white/[.07] px-5 py-4">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                    <Brain size={14} className="text-white" />
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d0b1a] bg-green-400" />
                  </div>
                  <div>
                    <p className="text-[0.85rem] font-bold text-white">Assistant DJAMA</p>
                    <p className="text-[0.65rem] text-white/30">En ligne · Répond instantanément</p>
                  </div>
                  <div className="ml-auto flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/[.07]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/[.07]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/[.07]" />
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3 p-5">
                  {[
                    { type: "ai",   text: "Bonjour 👋 Quel est votre projet ?\nJe peux vous orienter rapidement." },
                    { type: "user", text: "J'aimerais créer une application." },
                    { type: "ai",   text: "Parfait — mobile ou web ? Pour quel secteur ? Je vous propose les meilleures options DJAMA." },
                    { type: "user", text: "Mobile, pour gérer mes clients." },
                    { type: "ai",   text: "Idéal. Notre offre Application Mobile commence à 1 900€. Je vous prépare une estimation ?" },
                  ].map((msg, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.12, duration: 0.4, ease }}
                      className={`flex items-end gap-2.5 ${msg.type === "user" ? "flex-row-reverse" : ""}`}>
                      {msg.type === "ai" && (
                        <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                          <Brain size={11} className="text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.82rem] leading-relaxed whitespace-pre-line ${
                        msg.type === "ai"
                          ? "rounded-tl-sm border border-white/[.06] bg-white/[.06] text-white/75"
                          : "rounded-tr-sm bg-[#a78bfa] font-medium text-white"
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  <div className="flex items-end gap-2.5">
                    <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                      <Brain size={11} className="text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-white/[.06] bg-white/[.06] px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {[0, 0.18, 0.36].map((delay, i) => (
                          <motion.div key={i}
                            className="h-1.5 w-1.5 rounded-full bg-white/40"
                            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.9, delay, repeat: Infinity, ease: "easeInOut" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-2 border-t border-white/[.07] bg-white/[.02] px-4 py-3.5">
                  <div className="flex-1 rounded-xl border border-white/[.08] bg-white/[.04] px-3.5 py-2 text-xs text-white/20">
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
          9. CTA FINAL
      ══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border animate-border-glow bg-[#0d0d10] px-8 py-24 text-center md:px-20"
          style={{ borderColor: "rgba(201,165,90,.2)" }}
        >
          {/* Glows */}
          <div className="pointer-events-none absolute left-[8%] top-[-70px] h-[300px] w-[380px] animate-float-slow rounded-full bg-[rgba(201,165,90,.07)] blur-[75px]" />
          <div className="pointer-events-none absolute bottom-[-50px] right-[6%] h-[240px] w-[280px] animate-float-delayed rounded-full bg-[rgba(96,165,250,.05)] blur-[65px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> {h.cta.label}
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={[ctaFinalTitle1, ctaFinalTitle2]}
                highlight={1} stagger={0.13} wordStagger={0.065}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.26} as="p" className="mx-auto mt-5 max-w-md text-[1rem] leading-[1.82] text-white/40">
              {ctaFinalSubtitle}
            </FadeReveal>

            <FadeReveal delay={0.4} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href={ctaPrimHref}
                className="btn-primary group relative overflow-hidden px-8 py-[0.95rem] text-[0.925rem]">
                <span className="relative z-10 flex items-center gap-2">
                  {ctaPrimText} <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
              <Link href={ctaSecHref} className="btn-ghost px-8 py-[0.95rem] text-[0.925rem]">
                {ctaSecText}
              </Link>
            </FadeReveal>

            <FadeReveal delay={0.52} className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-7">
              <a href={`mailto:${data.contact.email}`}
                className="flex items-center gap-2 text-[0.82rem] text-white/28 transition-colors duration-200 hover:text-white/58">
                <Mail size={12} style={{ color: GOLD }} />
                {data.contact.email}
              </a>
              <span className="hidden text-white/10 sm:inline">·</span>
              <span className="flex items-center gap-2 text-[0.82rem] text-white/28">
                <CheckCircle2 size={12} style={{ color: GOLD }} />
                Sans engagement · Réponse sous 24h
              </span>
              <span className="hidden text-white/10 sm:inline">·</span>
              <span className="flex items-center gap-2 text-[0.82rem] text-white/28">
                <CheckCircle2 size={12} style={{ color: GOLD }} />
                Appel découverte gratuit · 30 min
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
