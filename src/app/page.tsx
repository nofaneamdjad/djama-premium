"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantDJAMA from "@/components/AssistantDJAMA";
import { LanguageProvider } from "@/lib/language-context";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Mail, Users2, Shield, ShieldCheck,
  CheckCircle2, Sparkles, HeartHandshake,
  Globe, Brain,
  Code2, BarChart3, Briefcase,
  Receipt, CalendarRange, StickyNote, Timer, CreditCard, Gem, Star,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import PartnerLogosSection from "@/components/PartnerLogosSection";
import TestimonialsSection from "@/components/TestimonialsSection";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";

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

function SmartStat({ value }: { value: string }) {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return <>{value}</>;
  return <><CountUp to={parseInt(match[1], 10)} />{match[2]}</>;
}

const SCHEMA_STEPS = [
  { num: "01", icon: Sparkles,  color: GOLD,       bg: `rgba(${GOLDR},.07)`,    border: `rgba(${GOLDR},.22)`,    title: "Idée / besoin",               desc: "Vous arrivez avec un besoin, un projet ou un problème à résoudre." },
  { num: "02", icon: Brain,     color: "#a78bfa",  bg: "rgba(167,139,250,.07)", border: "rgba(167,139,250,.22)", title: "Assistant IA DJAMA",          desc: "L'IA vous guide, clarifie vos options et vous aide à choisir la bonne direction." },
  { num: "03", icon: Code2,     color: "#60a5fa",  bg: "rgba(96,165,250,.07)",  border: "rgba(96,165,250,.22)",  title: "Construction de la solution", desc: "Site, application, outil métier, automatisation ou espace client sur mesure." },
  { num: "04", icon: BarChart3, color: "#4ade80",  bg: "rgba(74,222,128,.06)",  border: "rgba(74,222,128,.20)",  title: "Croissance & gestion",        desc: "Vous pilotez, améliorez et développez votre activité avec une base solide." },
] as const;

const TICKER_ITEMS = [
  "Sites web", "Plateformes SaaS", "Automatisation", "Applications",
  "E-commerce", "Outils métiers", "IA", "Design", "SEO",
] as const;

const ESPACE_TOOLS = [
  { icon: Receipt,       color: GOLD,       title: "Factures & devis",       desc: "Documents pro en quelques clics." },
  { icon: CalendarRange, color: "#60a5fa",  title: "Agenda & Planification",  desc: "Rendez-vous, équipes et tâches." },
  { icon: StickyNote,    color: "#4ade80",  title: "Bloc-notes pro",          desc: "Idées et mémos centralisés." },
  { icon: Brain,         color: "#a78bfa",  title: "Coach Business IA",       desc: "Conseils précis et actionnables." },
  { icon: Users2,        color: "#22d3ee",  title: "CRM Client",              desc: "Contacts, prospects et historique." },
  { icon: Timer,         color: "#fb923c",  title: "Chrono Pro",              desc: "Temps par projet et rentabilité." },
  { icon: CreditCard,    color: "#f43f5e",  title: "Dépenses Pro",            desc: "Frais pro par catégorie." },
  { icon: Shield,        color: "#34d399",  title: "Trésorerie",              desc: "Flux, solde et finances." },
  { icon: Shield,        color: "#eab308",  title: "Contrats IA",             desc: "Contrats personnalisés en secondes." },
  { icon: Globe,         color: "#f59e0b",  title: "Sourcing IA",             desc: "Fournisseurs et marchés publics." },
] as const;


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

const HERO_STATS = [
  { value: "50+",  label: "clients\naccompagnés", Icon: Users2      },
  { value: "100+", label: "projets\nlivrés",       Icon: Briefcase   },
  { value: "Sans", label: "engagement",            Icon: ShieldCheck },
];

function HomeContent() {
  const data                  = getSiteData();
  useLanguage();
  const { settings }          = useSiteSettings();


  return (
    <div className="overflow-hidden">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-5 pb-14 pt-[108px] sm:pb-20 sm:pt-[132px]">

        {/* ── Orbes gradient animées ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* Violet — haut droite */}
          <div
            className="hero-orb-1 absolute -top-32 -right-24 h-[480px] w-[480px] rounded-full blur-[90px]"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 68%)" }}
          />
          {/* Or DJAMA — bas gauche */}
          <div
            className="hero-orb-2 absolute -bottom-16 -left-28 h-[380px] w-[380px] rounded-full blur-[80px]"
            style={{ background: `radial-gradient(circle, rgba(${GOLDR},0.20) 0%, transparent 68%)` }}
          />
          {/* Rose — centre haut */}
          <div
            className="hero-orb-3 absolute top-0 left-1/2 -translate-x-1/2 h-[340px] w-[560px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 70%)" }}
          />
        </div>

        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-10 mx-auto max-w-md text-center"
        >
          {/* Badge */}
          <motion.div
            variants={fadeIn}
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em]"
            style={{
              borderColor: "rgba(99,102,241,0.22)",
              background: "rgba(99,102,241,0.06)",
              color: "#6366f1",
            }}
          >
            <Sparkles size={11} />
            Plateforme tout-en-un
          </motion.div>

          {/* Titre */}
          <motion.h1
            variants={fadeIn}
            className="text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-[3.6rem]"
          >
            Tout votre business<br />
            sur{" "}
            <span className="relative inline whitespace-nowrap">
              {/* Marker doré — dessiné de gauche à droite */}
              <span
                aria-hidden
                className="hero-marker absolute inset-x-[-2px] bottom-[2px]"
                style={{
                  height: "38%",
                  background: `linear-gradient(90deg, rgba(${GOLDR},0.72) 0%, rgba(${GOLDR},0.42) 100%)`,
                  borderRadius: "4px",
                  zIndex: 0,
                }}
              />
              <span className="relative z-10">une plateforme</span>
            </span>.
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            variants={fadeIn}
            className="mt-5 text-[1.05rem] font-medium text-gray-500"
          >
            Simple, efficace, et{" "}
            <span
              className="font-semibold"
              style={{
                background: "linear-gradient(90deg,#6366f1,#a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              abordable
            </span>{" "}!
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeIn} className="mt-9 flex flex-col gap-3">
            <Link
              href="/espace-client"
              className="hero-btn w-full rounded-2xl py-4 text-center text-[1rem] font-bold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.015] active:scale-[.98]"
            >
              Lancez-vous →
            </Link>
            <Link
              href="/reserver-appel"
              className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-center text-[1rem] font-semibold text-gray-500 shadow-sm transition-all duration-200 hover:border-gray-300 hover:text-gray-700 active:scale-[.98]"
            >
              Rencontrer un conseiller
            </Link>
          </motion.div>

          {/* Stats — 3 cards avec icônes */}
          <motion.div
            variants={fadeIn}
            className="mt-9 grid grid-cols-3 gap-3 border-t border-gray-100 pt-6"
          >
            {HERO_STATS.map(({ value, label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2.5 rounded-2xl px-2 py-4"
                style={{ background: "rgba(99,102,241,0.06)" }}
              >
                {/* Icône */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}
                >
                  <Icon size={18} />
                </div>

                {/* Valeur */}
                <span className="text-[1.35rem] font-extrabold leading-none text-gray-900">
                  <SmartStat value={value} />
                </span>

                {/* Label */}
                <span
                  className="text-center text-[0.7rem] leading-snug text-gray-500"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Espace client tools ────────────────────────────── */}
      <section style={{ background: "#f0f2f5" }} className="py-14 sm:py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-5"
        >
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <motion.div
              variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em] shadow-sm"
              style={{ color: "#6366f1" }}
            >
              <Gem size={11} /> Espace client DJAMA
            </motion.div>

            <motion.h2
              variants={fadeIn}
              className="text-[1.9rem] font-extrabold leading-tight text-gray-900 sm:text-[2.4rem]"
            >
              10 outils pros,{" "}
              <span style={{ color: "#6366f1" }}>1 abonnement</span>.
            </motion.h2>

            <motion.p
              variants={fadeIn}
              className="max-w-sm text-[0.9rem] text-gray-500"
            >
              Tout ce dont vous avez besoin pour piloter votre activité.
            </motion.p>

            <motion.div variants={fadeIn}>
              <Link
                href="/espace-client"
                className="mt-1 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[0.92rem] font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
              >
                S&apos;abonner — 11,90€/mois <ArrowRight size={15} />
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainerFast}
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5"
          >
            {ESPACE_TOOLS.map(({ icon: Icon, color, title }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,.13)" }}
                whileTap={{ scale: 0.93 }}
                transition={{ duration: 0.18, ease }}
              >
                <Link
                  href="/espace-client"
                  className="flex flex-col items-center gap-3 rounded-2xl bg-white px-2 py-5 shadow-[0_2px_10px_rgba(0,0,0,.07)] transition-all duration-200"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: `${color}18` }}
                  >
                    <Icon size={26} style={{ color }} strokeWidth={1.6} />
                  </div>
                  <span className="text-center text-[10.5px] font-semibold leading-tight text-gray-700">
                    {title}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="mt-5 flex flex-wrap items-center justify-center gap-5 rounded-2xl bg-white px-6 py-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] sm:gap-10"
          >
            {([
              { val: "10",     label: "outils inclus",  color: "#6366f1" },
              { val: "11,90€", label: "/ mois",         color: "#c9a55a" },
              { val: "0",      label: "engagement",     color: "#10b981" },
              { val: "✓",      label: "accès immédiat", color: "#f59e0b" },
            ] as const).map(({ val, label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[1.25rem] font-extrabold leading-none" style={{ color }}>{val}</span>
                <span className="text-[0.75rem] font-medium text-gray-400">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Services ticker ────────────────────────────────── */}
      <section className="overflow-hidden bg-white py-14 sm:py-20">

        {/* Header */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto mb-10 max-w-xl px-6 text-center"
        >
          <motion.div
            variants={fadeIn}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,.25)] bg-[rgba(99,102,241,.08)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em]"
            style={{ color: "#6366f1" }}
          >
            <Sparkles size={11} /> Nos services
          </motion.div>
          <motion.h2
            variants={fadeIn}
            className="text-[1.9rem] font-extrabold leading-tight text-gray-900 sm:text-[2.4rem]"
          >
            Tout ce que DJAMA peut faire{" "}
            <span style={{ color: "#6366f1" }}>pour vous</span>.
          </motion.h2>
          <motion.p variants={fadeIn} className="mt-3 text-[0.9rem] text-gray-500">
            Création digitale, outils pros, coaching IA et accompagnement — tout en un seul endroit.
          </motion.p>
        </motion.div>

        {/* ── Grand écran / App Showcase ── */}
        <div className="relative mx-auto mb-14 max-w-5xl px-4 sm:px-6">
          {/* Halo glow derrière l'écran */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 -bottom-6 h-24 rounded-full blur-[40px] opacity-40"
            style={{ background: "linear-gradient(90deg,#6366f1,#a855f7,#6366f1)" }}
          />

          {/* Cadre écran */}
          <div
            className="relative overflow-hidden rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,.16)]"
            style={{
              background: "linear-gradient(135deg,#eef0ff 0%,#f3f0ff 50%,#e8ecff 100%)",
              border: "1.5px solid rgba(255,255,255,0.9)",
            }}
          >
            {/* Reflet haut */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-32"
              style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)" }}
            />

            {/* Barre navigateur */}
            <div className="relative z-10 flex items-center gap-2 border-b border-white/60 bg-white/60 px-5 py-3 backdrop-blur-md">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="ml-3 flex-1 rounded-full bg-white/80 px-4 py-1.5 text-[0.62rem] text-gray-400 backdrop-blur-sm">
                🔒 djama.space — Tous nos services
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-3 w-3 rounded-full bg-gray-200" />
                <div className="h-3 w-3 rounded-full bg-gray-200" />
              </div>
            </div>

            {/* Grille des services */}
            <div className="relative z-10 p-5 sm:p-8">
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:gap-4 lg:grid-cols-8">
                {([
                  { Icon: Globe,         color: "#60a5fa", label: "Site Vitrine",             href: "/services/site-vitrine"               },
                  { Icon: CreditCard,    color: "#4ade80", label: "E-Commerce",               href: "/services/site-ecommerce"             },
                  { Icon: Code2,         color: "#a78bfa", label: "App Mobile",               href: "/services/application-mobile"         },
                  { Icon: BarChart3,     color: "#6366f1", label: "Plateforme Web",           href: "/services/plateforme-web-sur-mesure"  },
                  { Icon: Gem,           color: "#22d3ee", label: "Solutions\nDigitales",     href: "/services/solutions-digitales"        },
                  { Icon: Brain,         color: GOLD,      label: "Automatisation\nIA",       href: "/services/automatisation-ia"          },
                  { Icon: Star,          color: "#f59e0b", label: "Montage\nVidéo",           href: "/services/montage-video"              },
                  { Icon: Sparkles,      color: "#f472b6", label: "Retouche\nPhoto",          href: "/services/retouche-photo"             },
                  { Icon: Sparkles,      color: "#ec4899", label: "Visuels\nPublicitaires",   href: "/services/visuels-publicitaires"      },
                  { Icon: Brain,         color: "#a78bfa", label: "Coaching IA",              href: "/services/coaching-ia"                },
                  { Icon: Users2,        color: "#60a5fa", label: "Soutien\nScolaire",        href: "/services/soutien-scolaire"           },
                  { Icon: HeartHandshake,color: "#34d399", label: "Assistance\nAdmin",        href: "/services/assistance-administrative"  },
                  { Icon: Briefcase,     color: GOLD,      label: "Auto-\nEntrepreneur",      href: "/services/creation-auto-entrepreneur" },
                  { Icon: Receipt,       color: "#6366f1", label: "Déclarations\nURSSAF",     href: "/services/declarations-urssaf"        },
                  { Icon: Globe,         color: "#22d3ee", label: "Marchés\nPublics",         href: "/services/marches-publics"            },
                  { Icon: Shield,        color: "#f97316", label: "Recherche\nFournisseurs",  href: "/services/recherche-fournisseurs"     },
                ] as const).map(({ Icon, color, label, href }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.75, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.045, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.08, y: -5, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.94 }}
                  >
                    <Link
                      href={href}
                      className="flex flex-col items-center gap-2 rounded-2xl p-2 transition-colors duration-200 hover:bg-white/40"
                    >
                      {/* Tuile icône */}
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,.10)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,.18)] sm:h-16 sm:w-16"
                        style={{ background: "#ffffff" }}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                          style={{ background: `${color}18` }}
                        >
                          <Icon size={22} style={{ color }} strokeWidth={1.7} />
                        </div>
                      </div>
                      {/* Label */}
                      <span
                        className="text-center text-[0.58rem] font-semibold leading-tight text-gray-500 sm:text-[0.62rem]"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Barre du bas — status bar */}
              <div className="mt-6 flex items-center justify-between border-t border-white/60 pt-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
                  />
                  <span className="text-[0.6rem] font-semibold text-gray-400">16 services disponibles</span>
                </div>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[0.6rem] font-bold text-[#6366f1] backdrop-blur-sm transition hover:bg-white"
                >
                  Voir tout <ArrowRight size={9} />
                </Link>
              </div>
            </div>

            {/* Reflet bas */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
              style={{ background: "linear-gradient(0deg,rgba(255,255,255,0.3) 0%,transparent 100%)" }}
            />
          </div>

          {/* "Pied" de l'écran */}
          <div className="mx-auto mt-1 h-2 w-32 rounded-b-lg bg-gray-200/80" />
          <div className="mx-auto h-1.5 w-20 rounded-b-xl bg-gray-300/60" />
        </div>

        {/* ── Sunburst "Libérez votre potentiel" ── */}
        <div className="relative flex items-center justify-center overflow-hidden py-12 sm:py-16">

          {/* Rayons animés */}
          {([
            { angle: -148, h: 72,  w: 5, delay: 0.00, heart: true  },
            { angle: -122, h: 52,  w: 4, delay: 0.05, heart: false },
            { angle: -100, h: 88,  w: 5, delay: 0.10, heart: false },
            { angle: -78,  h: 60,  w: 4, delay: 0.14, heart: false },
            { angle: -56,  h: 96,  w: 5, delay: 0.18, heart: false },
            { angle: -35,  h: 56,  w: 4, delay: 0.22, heart: false },
            { angle: -14,  h: 82,  w: 5, delay: 0.26, heart: false },
            { angle: 10,   h: 64,  w: 4, delay: 0.30, heart: false },
            { angle: 35,   h: 90,  w: 5, delay: 0.34, heart: false },
            { angle: 58,   h: 55,  w: 4, delay: 0.38, heart: true  },
            { angle: 82,   h: 72,  w: 5, delay: 0.42, heart: false },
          ] as const).map(({ angle, h, w, delay, heart }, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: `${w}px`,
                height: `${h}px`,
                marginLeft: `-${w / 2}px`,
                marginTop: `-${h}px`,
                borderRadius: "99px",
                background: "linear-gradient(to top, #f59e0b, #fbbf24)",
                transformOrigin: "center bottom",
                transform: `rotate(${angle}deg)`,
              }}
            >
              {heart && (
                <span
                  style={{
                    position: "absolute",
                    top: -16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "14px",
                    lineHeight: 1,
                  }}
                >♥</span>
              )}
            </motion.div>
          ))}

          {/* Texte central */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 px-6 text-center"
          >
            <p
              className="leading-[1.15] text-[2.6rem] sm:text-[3.6rem]"
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Libérez
            </p>
            <p
              className="leading-[1.1] text-[2.6rem] sm:text-[3.6rem]"
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              votre{" "}
              <span
                style={{
                  color: "#0d9488",
                  textDecoration: "underline",
                  textDecorationColor: "#0d9488",
                  textUnderlineOffset: "4px",
                }}
              >
                potentiel de
              </span>
            </p>
            <p
              className="leading-[1.15] text-[2.6rem] sm:text-[3.6rem]"
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 800,
                color: "#0d9488",
              }}
            >
              croissance
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="mt-6"
            >
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-[0.88rem] font-semibold text-gray-500 transition-all hover:border-[rgba(99,102,241,.4)] hover:bg-[rgba(99,102,241,.05)] hover:text-[#6366f1]"
              >
                Voir tous nos services <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ── Processus — stepper compact ───────────────────── */}
      <section className="bg-[#f0f2f5] py-10 sm:py-14">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-4xl px-5"
        >
          {/* Titre court */}
          <motion.div variants={fadeIn} className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.4)] bg-[rgba(201,165,90,.09)] px-3.5 py-1.5 text-[0.63rem] font-bold uppercase tracking-[.22em]" style={{ color: "#b08d57" }}>
              <Sparkles size={9} /> Notre processus
            </div>
            <p className="text-[0.8rem] font-semibold text-gray-400">De l&apos;idée au lancement en 4 étapes</p>
          </motion.div>

          {/* Stepper card */}
          <motion.div
            variants={fadeIn}
            className="relative overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,.07)] border border-gray-100"
          >
            {/* Ligne de connexion */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-[52px] left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] h-px"
              style={{ background: "linear-gradient(90deg,#c9a55a,#a78bfa,#60a5fa,#4ade80)" }}
            />

            <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
              {SCHEMA_STEPS.map(({ num, icon: Icon, color, title }, idx) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col items-center gap-3 px-4 py-7 text-center ${
                    idx < 3 ? "sm:border-r border-gray-100" : ""
                  } ${idx === 1 ? "border-t sm:border-t-0 border-gray-100" : ""} ${idx === 3 ? "border-t sm:border-t-0 border-gray-100" : ""}`}
                >
                  {/* Icône cercle */}
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-full shadow-sm"
                    style={{ background: `${color}15`, border: `2px solid ${color}30` }}
                  >
                    <Icon size={20} style={{ color }} />
                    {/* Numéro badge */}
                    <span
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[0.55rem] font-black text-white shadow-sm"
                      style={{ background: color }}
                    >{num}</span>
                  </div>

                  {/* Titre */}
                  <span className="text-[0.8rem] font-bold leading-snug text-gray-800">{title}</span>
                </motion.div>
              ))}
            </div>

            {/* Barre de progression bottom */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#c9a55a 0%,#a78bfa 33%,#60a5fa 66%,#4ade80 100%)" }} />
          </motion.div>
        </motion.div>
      </section>

      <PartnerLogosSection />
      <TestimonialsSection dynamic />

      {/* ── Formation IA ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f0f2f5] py-12 sm:py-16">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-4xl px-5"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div variants={fadeIn}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,.35)] bg-[rgba(167,139,250,.09)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em]"
              style={{ color: "#7c5cbf" }}
            >
              <Brain size={10} /> Formation Intelligence Artificielle
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-[1.9rem] font-extrabold leading-tight text-gray-900 sm:text-[2.4rem]">
              Maîtrisez l&apos;IA,{" "}
              <span style={{ color: "#a78bfa" }}>transformez votre activité</span>.
            </motion.h2>
            <motion.p variants={fadeIn} className="mt-3 text-[0.9rem] text-gray-500">
              6 modules · 20 chapitres · 4h d&apos;accompagnement expert · Accès 3 mois
            </motion.p>
          </div>

          {/* Card principale */}
          <motion.div variants={cardReveal}
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_6px_30px_rgba(0,0,0,.10)]"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#a78bfa] via-[#7c5cbf] to-[#6366f1]" />

            <div className="grid gap-0 sm:grid-cols-2">

              {/* ── Gauche : ce que vous allez savoir faire ── */}
              <div className="p-6 sm:border-r border-gray-100">
                <p className="mb-4 text-[0.65rem] font-black uppercase tracking-[.18em] text-[#a78bfa]">Ce que vous allez maîtriser</p>

                <ul className="space-y-3">
                  {([
                    { icon: Sparkles,      color: "#a78bfa", text: "Générer emails, devis et contrats en 30 secondes" },
                    { icon: Brain,         color: "#60a5fa", text: "Gagner 5 à 15h de travail par semaine avec l'IA" },
                    { icon: Users2,        color: "#f9a826", text: "Prospecter et trouver des clients grâce à l'IA" },
                    { icon: BarChart3,     color: "#4ade80", text: "Créer du contenu marketing 10× plus vite" },
                    { icon: Briefcase,     color: "#f472b6", text: "Analyser vos données business en quelques secondes" },
                    { icon: HeartHandshake,color: "#34d399", text: "Déléguer vos tâches répétitives à des agents IA" },
                  ] as const).map(({ icon: Icon, color, text }) => (
                    <li key={text} className="flex items-start gap-2.5 text-[0.78rem] text-gray-600">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${color}18` }}>
                        <Icon size={11} style={{ color }} />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>

                {/* Inclus */}
                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5">
                  <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-widest text-gray-400">Inclus dans la formation</p>
                  <ul className="space-y-1.5">
                    {[
                      "Assistant IA pédagogique disponible 24h/7j",
                      "Quiz, résumés IA et fiches PDF pour chaque cours",
                      "Bibliothèque de prompts prêts à l'emploi",
                      "Comparateur interactif : ChatGPT, Claude, Gemini…",
                      "Plan d'action IA personnalisé par module",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[0.73rem] text-gray-500">
                        <CheckCircle2 size={11} className="mt-0.5 shrink-0" style={{ color: "#a78bfa" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[rgba(74,222,128,.25)] bg-[rgba(74,222,128,.07)] px-3 py-2">
                  <Shield size={11} style={{ color: "#4ade80" }} />
                  <span className="text-[0.68rem] font-semibold text-emerald-600">Satisfait ou remboursé — 7 jours, sans justification</span>
                </div>
              </div>

              {/* ── Droite : tarification ── */}
              <div className="flex flex-col gap-3 p-6">

                {/* Option ABONNÉ — mis en avant */}
                <div
                  className="relative overflow-hidden rounded-2xl p-5"
                  style={{ background: "linear-gradient(135deg,rgba(167,139,250,0.10) 0%,rgba(99,102,241,0.08) 100%)", border: "1.5px solid rgba(167,139,250,.4)" }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#a78bfa] px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wide text-white">
                      <Sparkles size={9} /> Abonnés DJAMA Pro
                    </div>
                    <span className="text-[0.65rem] font-bold text-[#4ade80]">✓ Accès immédiat</span>
                  </div>

                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-[2.4rem] font-black leading-none" style={{ color: "#a78bfa" }}>GRATUIT</span>
                    <span className="mb-1.5 text-[0.7rem] font-semibold text-gray-400 line-through">190€</span>
                  </div>
                  <p className="text-[0.75rem] text-gray-500">
                    Inclus avec l&apos;abonnement{" "}
                    <span className="font-bold text-gray-700">DJAMA Pro</span>{" "}
                    à seulement{" "}
                    <span className="font-bold" style={{ color: GOLD }}>11,90€/mois</span>
                  </p>
                  <p className="mt-1 text-[0.68rem] text-gray-400">
                    + 10 outils pros inclus · Sans engagement · Résiliable à tout moment
                  </p>

                  <Link
                    href="/espace-client"
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-[0.875rem] font-bold text-white shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[.98]"
                    style={{ background: "linear-gradient(135deg,#a78bfa,#7c5cbf)" }}
                  >
                    S&apos;abonner — Formation offerte <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Séparateur */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[0.6rem] font-bold text-gray-300 uppercase tracking-wide">ou</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                {/* Option SEUL */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-wide text-gray-400">Achat individuel</p>
                  <div className="mt-1.5 flex items-end gap-2">
                    <span className="text-[1.6rem] font-extrabold leading-none text-gray-800">190€</span>
                    <div className="mb-1 flex flex-col">
                      <span className="text-[0.62rem] font-bold text-gray-400 line-through">350€</span>
                      <span className="text-[0.6rem] text-gray-400">paiement unique · accès 3 mois</span>
                    </div>
                  </div>
                  <Link
                    href="/services/coaching-ia"
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[0.8rem] font-bold text-gray-600 transition hover:border-[rgba(167,139,250,.4)] hover:text-[#a78bfa]"
                  >
                    Voir la formation <ArrowRight size={12} />
                  </Link>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Final CTA — bande compacte ─────────────────────── */}
      <section className="bg-white px-5 pb-16 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#1e1035 100%)",
            boxShadow: "0 20px 60px rgba(99,102,241,0.22), 0 4px 20px rgba(0,0,0,0.18)",
          }}
        >
          {/* Barre dorée top */}
          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg,#c9a55a,#e8cc94,#c9a55a)` }} />

          <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">

            {/* Titre court */}
            <h2 className="text-[1.7rem] font-extrabold leading-tight text-white sm:text-[2.1rem]">
              Lancez votre projet{" "}
              <span style={{ color: GOLD }}>dès aujourd&apos;hui</span>.
            </h2>

            {/* Bullets horizontaux */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {[
                { icon: CheckCircle2, text: "Sans engagement" },
                { icon: CheckCircle2, text: "Réponse sous 24h" },
                { icon: CheckCircle2, text: "Appel offert" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-[0.75rem] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <Icon size={11} style={{ color: "#4ade80" }} />
                  {text}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-[0.92rem] font-bold text-[#0f172a] transition-all duration-200 hover:scale-[1.03] active:scale-[.97]"
                style={{ background: `linear-gradient(135deg,#c9a55a,#e8cc94)` }}
              >
                Démarrer un projet <ArrowRight size={14} />
              </Link>
              <Link
                href="/espace-client"
                className="flex items-center justify-center gap-2 rounded-2xl border px-7 py-3.5 text-[0.92rem] font-bold text-white transition-all duration-200 hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.18)" }}
              >
                Accès espace client
              </Link>
            </div>

          </div>
        </motion.div>
      </section>

    </div>
  );
}
