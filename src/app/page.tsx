"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantDJAMA from "@/components/AssistantDJAMA";
import { LanguageProvider } from "@/lib/language-context";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Mail, Users2, Shield, ShieldCheck,
  CheckCircle2, Sparkles, HeartHandshake,
  Globe, Brain, MessageCircle,
  Code2, BarChart3, Briefcase,
  Receipt, CalendarRange, StickyNote, Timer, CreditCard, Gem, Star,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
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

const FAQ_ITEMS = [
  { q: "Quels sont vos délais de livraison ?",         a: "Un site vitrine est livré en 7 à 14 jours. Une application mobile ou une plateforme sur mesure prend 3 à 8 semaines selon la complexité. Vous recevez des mises à jour régulières tout au long du projet." },
  { q: "Est-ce que je peux tester DJAMA Pro sans engagement ?", a: "Oui. L'abonnement DJAMA Pro à 11,90€/mois est sans engagement et résiliable à tout moment en un clic. Accès immédiat après paiement." },
  { q: "Comment se passe la demande de devis ?",        a: "Cliquez sur « Démarrer un projet » ou contactez-nous via WhatsApp. Nous répondons sous 24h avec une estimation claire, sans surprise cachée." },
  { q: "Vos services sont-ils disponibles à l'international ?", a: "Oui. Nous accompagnons des clients en France, en Belgique, aux Comores, à La Réunion et dans d'autres pays francophones. Tout se fait à distance, en visio et par messagerie." },
  { q: "Proposez-vous un suivi après livraison ?",      a: "Absolument. Chaque projet inclut une période de support post-livraison. Pour un suivi continu, l'abonnement DJAMA Pro donne accès à notre assistance dédiée." },
  { q: "Le coaching IA est-il adapté aux débutants ?",  a: "Oui. Le coaching IA est conçu pour tous les niveaux — débutants complets comme professionnels qui veulent aller plus vite. Les modules progressent étape par étape." },
  { q: "Quels moyens de paiement acceptez-vous ?",      a: "Nous acceptons les paiements par carte bancaire (Stripe), PayPal et virement bancaire. Tous les paiements sont sécurisés et cryptés." },
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const ctaFinalTitle1   = (settings?.cta_final_title_1  ?? "Prêt à transformer")                          as string;
  const ctaFinalTitle2   = (settings?.cta_final_title_2  ?? "votre activité ?")                            as string;
  const ctaFinalSubtitle = (settings?.cta_final_subtitle ?? "Rejoignez les entrepreneurs qui font confiance à DJAMA.") as string;
  const ctaPrimText      = (settings?.cta_primary_text   ?? "Démarrer maintenant")                         as string;
  const ctaPrimHref      = (settings?.cta_primary_href   ?? "/espace-client")                              as string;
  const ctaSecText       = (settings?.cta_secondary_text ?? "En savoir plus")                              as string;
  const ctaSecHref       = (settings?.cta_secondary_href ?? "/services")                                   as string;

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

        {/* ── Ligne 1 → gauche ── */}
        <div className="relative mb-3">
          {/* Fade masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />

          <div className="animate-ticker flex w-max gap-3">
            {[
              { Icon: Globe,         color: "#60a5fa", label: "Sites web & E-commerce"     },
              { Icon: Code2,         color: "#a78bfa", label: "Applications mobiles"        },
              { Icon: Brain,         color: GOLD,      label: "Coaching IA"                 },
              { Icon: MessageCircle, color: "#34d399", label: "Montage vidéo"               },
              { Icon: Sparkles,      color: "#f472b6", label: "Visuels publicitaires"        },
              { Icon: Receipt,       color: "#6366f1", label: "Factures & devis"            },
              { Icon: Globe,         color: "#60a5fa", label: "Sites web & E-commerce"     },
              { Icon: Code2,         color: "#a78bfa", label: "Applications mobiles"        },
              { Icon: Brain,         color: GOLD,      label: "Coaching IA"                 },
              { Icon: MessageCircle, color: "#34d399", label: "Montage vidéo"               },
              { Icon: Sparkles,      color: "#f472b6", label: "Visuels publicitaires"        },
              { Icon: Receipt,       color: "#6366f1", label: "Factures & devis"            },
            ].map(({ Icon, color, label }, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={15} style={{ color }} strokeWidth={1.8} />
                </div>
                <span className="text-[0.82rem] font-semibold text-gray-700 whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ligne 2 → droite ── */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />

          <div className="animate-ticker-reverse flex w-max gap-3">
            {[
              { Icon: HeartHandshake, color: "#f59e0b", label: "Accompagnement entreprise"  },
              { Icon: Shield,         color: "#34d399", label: "Automatisation IA"           },
              { Icon: Star,           color: "#a78bfa", label: "Retouche photo"              },
              { Icon: Users2,         color: "#60a5fa", label: "Soutien scolaire"            },
              { Icon: Globe,          color: "#f472b6", label: "Sourcing fournisseurs"       },
              { Icon: CreditCard,     color: "#6366f1", label: "Plateforme sur mesure"       },
              { Icon: HeartHandshake, color: "#f59e0b", label: "Accompagnement entreprise"  },
              { Icon: Shield,         color: "#34d399", label: "Automatisation IA"           },
              { Icon: Star,           color: "#a78bfa", label: "Retouche photo"              },
              { Icon: Users2,         color: "#60a5fa", label: "Soutien scolaire"            },
              { Icon: Globe,          color: "#f472b6", label: "Sourcing fournisseurs"       },
              { Icon: CreditCard,     color: "#6366f1", label: "Plateforme sur mesure"       },
            ].map(({ Icon, color, label }, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={15} style={{ color }} strokeWidth={1.8} />
                </div>
                <span className="text-[0.82rem] font-semibold text-gray-700 whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <FadeReveal delay={0.3} className="mt-10 flex justify-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-[0.88rem] font-semibold text-gray-500 transition-all hover:border-[rgba(99,102,241,.4)] hover:bg-[rgba(99,102,241,.05)] hover:text-[#6366f1]"
          >
            Voir tous nos services <ArrowRight size={14} />
          </Link>
        </FadeReveal>
      </section>

      {/* ── Processus ──────────────────────────────────────── */}
      <section className="bg-[#f0f2f5] relative py-16 sm:py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-10 text-center">
            <motion.div
              variants={fadeIn}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.4)] bg-[rgba(201,165,90,.09)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em]"
              style={{ color: "#b08d57" }}
            >
              <Sparkles size={10} /> Notre processus
            </motion.div>
            <h2 className="mt-2 text-[1.9rem] font-extrabold leading-tight text-gray-900 sm:text-[2.4rem]">
              De l&apos;idée à la solution en 4 étapes.
            </h2>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SCHEMA_STEPS.map(({ num, icon: Icon, color, border, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: 0.25, ease } }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,.11)]"
                style={{ borderColor: border }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[0.68rem] font-bold"
                    style={{ background: `${color}22`, color }}
                  >{num}</span>
                  <span className="select-none text-4xl font-extrabold leading-none opacity-[.06]" style={{ color }}>{num}</span>
                </div>
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{ background: `${color}12`, borderColor: `${color}22` }}
                >
                  <Icon size={19} style={{ color }} />
                </div>
                <h3 className="text-[0.88rem] font-bold text-gray-900">{title}</h3>
                <p className="mt-1.5 flex-1 text-[0.78rem] leading-relaxed text-gray-500">{desc}</p>
                <div
                  className="mt-4 h-0.5 w-6 rounded-full transition-all duration-300 group-hover:w-full"
                  style={{ background: `linear-gradient(90deg,${color},${color}33)` }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Social proof ticker ────────────────────────────── */}
      <section className="bg-white py-12 sm:py-16 border-y border-gray-100">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-5xl px-6"
        >
          <div className="mb-8 text-center">
            <motion.div
              variants={fadeIn}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.4)] bg-[rgba(201,165,90,.07)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em]"
              style={{ color: "#b08d57" }}
            >
              <Star size={10} /> Ils nous font confiance
            </motion.div>
            <FadeReveal delay={0.1} as="p" className="mt-2 text-sm text-gray-400">
              50+ projets accompagnés · entrepreneurs, PME et créateurs
            </FadeReveal>
          </div>

          <FadeReveal delay={0.15}>
            <style>{`
              @keyframes djama-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
              .djama-ticker-track { animation: djama-ticker 28s linear infinite; }
              .djama-ticker-wrap:hover .djama-ticker-track { animation-play-state: paused; }
            `}</style>
            <div className="djama-ticker-wrap overflow-hidden rounded-xl border border-gray-200 bg-gray-50 py-3">
              <div className="djama-ticker-track flex items-center whitespace-nowrap">
                {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span key={i} className="inline-flex shrink-0 items-center gap-3 px-5 text-[0.82rem] font-medium text-gray-400">
                    {item}
                    <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: GOLD }} />
                  </span>
                ))}
              </div>
            </div>
          </FadeReveal>
        </motion.div>
      </section>

      <PartnerLogosSection />
      <TestimonialsSection dynamic />

      {/* ── AI section ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f0f2f5] py-16 sm:py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          <div className="mb-12 text-center">
            <motion.div
              variants={fadeIn}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,.35)] bg-[rgba(167,139,250,.09)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em]"
              style={{ color: "#7c5cbf" }}
            >
              <Brain size={10} /> Intelligence Artificielle
            </motion.div>
            <h2 className="mt-2 text-[1.9rem] font-extrabold leading-tight text-gray-900 sm:text-[2.4rem]">
              L&apos;IA au cœur de votre activité.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Coaching card */}
            <motion.div
              variants={cardReveal}
              className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,.08)]"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent" />
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(167,139,250,.12)]">
                  <Brain size={20} style={{ color: "#a78bfa" }} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(167,139,250,.28)] bg-[rgba(167,139,250,.09)] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[#a78bfa]">
                  Nouveau
                </span>
              </div>
              <h3 className="text-[1.1rem] font-extrabold text-gray-900">Coaching IA DJAMA</h3>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-gray-500">
                Apprenez à utiliser l&apos;IA pour gagner du temps, automatiser vos tâches et vendre mieux — 6 modules, 4h d&apos;accompagnement.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {([
                  { val: "6",    sub: "modules",        color: "#a78bfa" },
                  { val: "20",   sub: "chapitres",      color: "#60a5fa" },
                  { val: "4h",   sub: "accompagnement", color: "#4ade80" },
                  { val: "190€", sub: "paiement unique", color: GOLD    },
                ] as const).map(({ val, sub, color }) => (
                  <div key={sub} className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-center">
                    <span className="text-lg font-extrabold leading-none" style={{ color }}>{val}</span>
                    <span className="mt-0.5 text-[0.58rem] text-gray-400">{sub}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(74,222,128,.25)] bg-[rgba(74,222,128,.07)] px-4 py-2">
                <Shield size={12} style={{ color: "#4ade80" }} />
                <span className="text-[0.7rem] font-semibold text-emerald-600">Satisfait ou remboursé 7 jours</span>
              </div>

              <Link href="/services/coaching-ia"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[rgba(167,139,250,.3)] bg-[rgba(167,139,250,.08)] px-5 py-2.5 text-[0.875rem] font-bold text-[#a78bfa] transition-all hover:border-[rgba(167,139,250,.5)] hover:bg-[rgba(167,139,250,.15)]">
                Découvrir le coaching IA <ArrowRight size={13} />
              </Link>
            </motion.div>

            {/* Chat mockup */}
            <motion.div variants={cardReveal}>
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,.10)]">
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                    <Brain size={14} className="text-white" />
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400" />
                  </div>
                  <div>
                    <p className="text-[0.85rem] font-bold text-gray-900">Assistant DJAMA</p>
                    <p className="text-[0.65rem] text-gray-400">En ligne · Répond instantanément</p>
                  </div>
                  <div className="ml-auto flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  {([
                    { type: "ai",   text: "Bonjour ! Quel est votre projet ?\nJe peux vous orienter rapidement." },
                    { type: "user", text: "J'aimerais créer une application." },
                    { type: "ai",   text: "Parfait — mobile ou web ? Je vous propose les meilleures options DJAMA." },
                    { type: "user", text: "Mobile, pour gérer mes clients." },
                    { type: "ai",   text: "Idéal. Notre offre Application Mobile commence à 1 900€. Je vous prépare une estimation ?" },
                  ] as const).map((msg, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.12, duration: 0.4, ease }}
                      className={`flex items-end gap-2.5 ${msg.type === "user" ? "flex-row-reverse" : ""}`}
                    >
                      {msg.type === "ai" && (
                        <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                          <Brain size={11} className="text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.82rem] leading-relaxed whitespace-pre-line ${
                        msg.type === "ai"
                          ? "rounded-tl-sm border border-gray-200 bg-gray-100 text-gray-700"
                          : "rounded-tr-sm bg-[#6366f1] font-medium text-white"
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  <div className="flex items-end gap-2.5">
                    <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c5cbf]">
                      <Brain size={11} className="text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-gray-100 px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {([0, 0.18, 0.36] as const).map((delay, i) => (
                          <motion.div key={i}
                            className="h-1.5 w-1.5 rounded-full bg-gray-400"
                            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.9, delay, repeat: Infinity, ease: "easeInOut" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3.5">
                  <div className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-300">
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

              <FadeReveal delay={0.3} className="mt-4">
                <button
                  onClick={() => {
                    const btn = document.querySelector<HTMLButtonElement>("[aria-label=\"Ouvrir l'assistant DJAMA\"]");
                    btn?.click();
                  }}
                  className="btn-primary w-full justify-center text-[0.9rem]"
                >
                  <MessageCircle size={15} />
                  Parler avec l&apos;assistant IA
                </button>
              </FadeReveal>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="relative z-10 mx-auto max-w-2xl px-6"
        >
          <motion.div variants={fadeIn} className="mb-10 text-center">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.4)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.24em]"
              style={{ color: "#b08d57" }}
            >
              <Sparkles size={10} /> Questions fréquentes
            </div>
            <h2 className="text-[1.8rem] font-extrabold leading-tight text-gray-900 sm:text-[2.2rem]">
              Tout ce que vous<br />voulez savoir.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[0.88rem] text-gray-500">
              Des réponses claires, sans jargon.{" "}
              <a href="/contact" className="font-semibold underline underline-offset-2 transition hover:opacity-75" style={{ color: GOLD }}>
                Contactez-nous.
              </a>
            </p>
          </motion.div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,.06)]">
            {FAQ_ITEMS.map(({ q, a }, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={i} variants={cardReveal}
                  className={`border-b border-gray-100 last:border-0 ${isOpen ? "bg-gray-50" : ""} transition-colors duration-200`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-[0.9rem] font-semibold transition-colors duration-200 ${isOpen ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                      {q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-light transition-colors duration-200"
                      style={{
                        borderColor: isOpen ? "rgba(201,165,90,.5)" : "rgba(0,0,0,.14)",
                        color:       isOpen ? GOLD                  : "rgba(0,0,0,.35)",
                        background:  isOpen ? "rgba(201,165,90,.08)" : "transparent",
                      }}
                    >+</motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <p className="px-6 pb-5 pt-1 text-[0.85rem] leading-[1.8] text-gray-500">{a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <FadeReveal delay={0.3} className="mt-8 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-6">
            <Link href="/contact"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-5 py-2.5 text-[0.82rem] font-semibold text-gray-500 transition hover:border-gray-300 hover:text-gray-700 hover:bg-gray-100">
              <Mail size={13} style={{ color: GOLD }} />
              Poser une question par email
            </Link>
            <Link href="/reserver-appel"
              className="flex items-center gap-2 rounded-xl border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.07)] px-5 py-2.5 text-[0.82rem] font-semibold transition hover:bg-[rgba(201,165,90,.14)]"
              style={{ color: "#b08d57" }}>
              <MessageCircle size={13} />
              Appel découverte gratuit
            </Link>
          </FadeReveal>
        </motion.div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-14">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] px-8 py-20 text-center md:px-20"
          style={{ background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%)" }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[200px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,255,255,.18),transparent)]" />

          <div className="relative z-10">
            <motion.div
              variants={fadeIn}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em] text-white"
            >
              <Sparkles size={10} /> Prêt à commencer ?
            </motion.div>

            <h2 className="text-[2.1rem] font-extrabold leading-tight text-white sm:text-[2.8rem]">
              <MultiLineReveal
                lines={[ctaFinalTitle1, ctaFinalTitle2]}
                highlight={1} stagger={0.13} wordStagger={0.065}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.26} as="p" className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/75">
              {ctaFinalSubtitle}
            </FadeReveal>

            <FadeReveal delay={0.4} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href={ctaPrimHref}
                className="btn-primary group relative overflow-hidden px-8 py-[0.95rem] text-[0.925rem]">
                <span className="relative z-10 flex items-center gap-2">
                  {ctaPrimText}
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
              <Link href={ctaSecHref}
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-white/30 bg-white/10 px-8 py-[0.95rem] text-[0.925rem] font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/50">
                {ctaSecText}
              </Link>
            </FadeReveal>

            <FadeReveal delay={0.52} className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-7">
              <a
                href={`mailto:${data.contact.email}`}
                className="flex items-center gap-2 text-[0.82rem] text-white/65 transition-colors duration-200 hover:text-white/90"
              >
                <Mail size={12} className="text-white/50" />
                {data.contact.email}
              </a>
              <span className="hidden text-white/30 sm:inline">·</span>
              <span className="flex items-center gap-2 text-[0.82rem] text-white/65">
                <CheckCircle2 size={12} className="text-white/50" />
                Sans engagement · Réponse sous 24h
              </span>
              <span className="hidden text-white/30 sm:inline">·</span>
              <span className="flex items-center gap-2 text-[0.82rem] text-white/65">
                <CheckCircle2 size={12} className="text-white/50" />
                Appel découverte gratuit · 30 min
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
