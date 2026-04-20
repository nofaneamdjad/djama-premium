"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  ArrowLeft, Users, Settings, Bell, Shield, Star, LayoutDashboard,
  Code2, Briefcase, TrendingUp, Lock, Palette, Globe, Database,
  CreditCard, Zap, HelpCircle, BadgeCheck, Rocket, HeartHandshake,
  RefreshCw, BarChart3, Activity, GitBranch, Layers, Box,
  MessageSquare, ShoppingCart, WifiOff, Search, Clock,
  ChevronRight, CheckSquare,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Palette cyan / indigo — tech premium ──────── */
const C  = "#22d3ee";   // cyan-400
const CR = "34,211,238";
const C2 = "#0891b2";   // cyan-600
const I  = "#818cf8";   // indigo-400
const IR = "129,140,248";
const G  = "#c9a55a";   // gold DJAMA
const GR = "201,165,90";

/* ═══════════════════════════════════════ DATA ══════════════════════════════════════ */

const POURQUOI_APP = [
  { icon: Users,      c: C,        r: CR,           t: "Fidélisation maximale",     d: "Vos utilisateurs reviennent 3× plus souvent via une app que via un site. L'icône sur leur écran = présence permanente dans leur quotidien." },
  { icon: Bell,       c: I,        r: IR,           t: "Push notifications",        d: "Parlez à vos utilisateurs en temps réel, sans algorithme. Un push bien ciblé convertit à 7–10% — aucun canal email ne rivalise." },
  { icon: TrendingUp, c: "#f9a826",r: "249,168,38", t: "Revenus récurrents",        d: "Abonnements, achats in-app, freemium — les apps mobiles génèrent des modèles de revenus stables et prédictibles." },
  { icon: Palette,    c: "#f472b6",r: "244,114,182",t: "Image de marque premium",   d: "Avoir une app native = signal de sérieux. Vos concurrents n'en ont pas. C'est un avantage compétitif immédiat." },
  { icon: Activity,   c: "#4ade80",r: "74,222,128", t: "Expérience native",         d: "Gestes naturels, performances fluides, accès caméra/GPS/contacts — l'expérience mobile qu'un site web ne peut pas offrir." },
  { icon: BarChart3,  c: G,        r: GR,           t: "Analytics comportementaux", d: "Comprenez chaque action de vos utilisateurs. Optimisez l'UX, augmentez la rétention, prenez des décisions basées sur les données." },
];

const TYPES_APP = [
  {
    icon: Briefcase,
    c: C, r: CR,
    t: "App business / service",
    d: "Prise de rendez-vous, devis en ligne, espace client, service après-vente. Votre activité dans la poche de vos clients.",
    tags: ["RDV", "Client", "Service"],
  },
  {
    icon: ShoppingCart,
    c: "#f9a826", r: "249,168,38",
    t: "App e-commerce",
    d: "Boutique mobile native, panier, paiement Apple Pay / Google Pay, suivi commandes et programme de fidélité.",
    tags: ["Ventes", "Panier", "Paiement"],
  },
  {
    icon: Layers,
    c: I, r: IR,
    t: "App SaaS / plateforme",
    d: "Dashboard, gestion de compte, analytics, onboarding — le cœur de votre produit SaaS dans une app mobile optimisée.",
    tags: ["SaaS", "Dashboard", "API"],
  },
  {
    icon: Box,
    c: "#4ade80", r: "74,222,128",
    t: "Outil interne (B2E)",
    d: "Application terrain pour vos équipes : planning, pointage, reporting, accès aux données — offline-first si nécessaire.",
    tags: ["Terrain", "RH", "Reporting"],
  },
  {
    icon: Rocket,
    c: "#f472b6", r: "244,114,182",
    t: "MVP startup",
    d: "Validez votre idée vite. On vous aide à définir le périmètre MVP, concevoir, développer et lancer en App Store/Play Store.",
    tags: ["MVP", "Validation", "Lancement"],
  },
];

const FONCTIONNALITES = [
  { icon: Lock,          c: C,        r: CR,           t: "Authentification",          d: "Email, Google, Apple Sign-In, biométrie (Face ID / Touch ID), MFA." },
  { icon: LayoutDashboard,c: I,       r: IR,           t: "Dashboard & analytics",     d: "Tableaux de bord dynamiques, graphiques temps réel, KPIs personnalisés." },
  { icon: CreditCard,    c: "#4ade80",r: "74,222,128", t: "Paiements in-app",          d: "Stripe, Apple Pay, Google Pay, abonnements, achats one-time." },
  { icon: Bell,          c: "#f9a826",r: "249,168,38", t: "Notifications push",        d: "Notifications ciblées, segmentées, programmables — via Firebase ou OneSignal." },
  { icon: Database,      c: "#f472b6",r: "244,114,182",t: "Base de données temps réel",d: "Synchronisation live entre utilisateurs. Chat, collaboration, mises à jour instantanées." },
  { icon: Globe,         c: G,        r: GR,           t: "Intégrations API",          d: "Connexion à vos outils existants : ERP, CRM, logistique, paiement, IA." },
  { icon: WifiOff,       c: "#fb923c",r: "251,146,60", t: "Mode offline",              d: "L'app fonctionne sans connexion et synchronise dès le retour du réseau." },
  { icon: Activity,      c: "#e879f9",r: "232,121,249",t: "Analytics & tracking",      d: "Mixpanel, Amplitude, Firebase Analytics — comprenez chaque comportement utilisateur." },
];

const PROCESSUS = [
  { icon: BarChart3,    c: G,        r: GR,           t: "Stratégie",        d: "Brief, personas, user stories, choix technologique, architecture.",  duration: "Jours 1–3"  },
  { icon: GitBranch,    c: C,        r: CR,           t: "Wireframes",       d: "Parcours utilisateurs, arborescence, maquettes fil de fer.",           duration: "Jours 4–7"  },
  { icon: Palette,      c: I,        r: IR,           t: "Design UI/UX",     d: "Interface premium, design system, prototypage interactif.",           duration: "Jours 8–14" },
  { icon: Code2,        c: "#4ade80",r: "74,222,128", t: "Développement",    d: "Code natif ou cross-platform (React Native / Flutter), API, back-end.",duration: "Jours 15–35"},
  { icon: CheckSquare,  c: "#f9a826",r: "249,168,38", t: "Tests & QA",       d: "Tests unitaires, tests utilisateurs, corrections, performance.",     duration: "Jours 36–42"},
  { icon: Rocket,       c: "#f472b6",r: "244,114,182",t: "Publication",      d: "Soumission App Store & Google Play, validations, mise en ligne.",    duration: "Jours 43–50"},
  { icon: RefreshCw,    c: "#fb923c",r: "251,146,60", t: "Maintenance",      d: "Mises à jour OS, nouvelles fonctionnalités, monitoring continu.",    duration: "Mensuel"    },
];

const PREUVES = [
  { icon: Code2,        c: C,        r: CR,           t: "React Native & Flutter",     d: "Cross-platform natif : une codebase, deux stores. Performance identique à du natif pur." },
  { icon: Palette,      c: I,        r: IR,           t: "Design system sur mesure",   d: "Composants, tokens, guidelines — une identité visuelle cohérente sur chaque écran." },
  { icon: Zap,          c: "#f9a826",r: "249,168,38", t: "Performance Lighthouse 90+", d: "Animations à 60fps, temps de chargement < 1s, Lighthouse 90+ sur toutes les pages." },
  { icon: Shield,       c: "#4ade80",r: "74,222,128", t: "Sécurité & conformité",      d: "Chiffrement des données, authentification forte, conformité RGPD et CCPA." },
  { icon: TrendingUp,   c: "#f472b6",r: "244,114,182",t: "Architecture scalable",      d: "Infrastructure prête à supporter 10 ou 10 000 utilisateurs. Aucune refonte nécessaire." },
  { icon: HeartHandshake,c: G,       r: GR,           t: "Accompagnement complet",     d: "De l'idée au store, un expert dédié. Pas de sous-traitance, pas d'intermédiaire." },
];

const FAQ = [
  { q: "Combien coûte une application mobile ?",              a: "Le prix dépend du périmètre fonctionnel, de la complexité UX et de l'infrastructure back-end. On commence par un atelier stratégique gratuit pour définir le périmètre exact, puis on vous soumet un devis détaillé. Les projets démarrent généralement autour de 4 000€ pour un MVP solide." },
  { q: "Combien de temps pour développer une app ?",         a: "Un MVP bien défini peut être livré en 6 à 10 semaines. Une app plus complexe avec back-end, paiements et temps réel prend 3 à 5 mois. On établit un planning détaillé sprint par sprint avant de commencer." },
  { q: "iOS et Android sont-ils tous les deux couverts ?",   a: "Oui. On travaille en React Native ou Flutter pour couvrir les deux plateformes avec une seule codebase. Aucun compromis sur la performance : l'expérience est native sur les deux stores." },
  { q: "Que se passe-t-il après la publication ?",           a: "On propose des contrats de maintenance mensuelle : monitoring, mises à jour iOS/Android, corrections de bugs, nouvelles fonctionnalités. Votre app reste à jour et fonctionnelle dans le temps." },
  { q: "Avez-vous de l'expérience avec des apps existantes ?",a: "Oui. On reprend des projets existants pour les refondre, ajouter des fonctionnalités ou améliorer les performances. Un audit technique gratuit permet d'évaluer l'état du code avant tout engagement." },
  { q: "Gérez-vous aussi le back-end et l'API ?",            a: "Absolument. On conçoit et développe l'architecture complète : API REST ou GraphQL, base de données, authentification, notifications push, hébergement cloud (Vercel, Railway, AWS)." },
];

const TEMOIGNAGES = [
  { i: "R", c: CR,  n: "Romain S.",  r: "Fondateur SaaS",    s: 5, t: "DJAMA a su transformer notre vision produit en une app fluide et scalable. On est passés de 0 à 2000 utilisateurs actifs en 3 mois après le lancement." },
  { i: "A", c: IR,  n: "Aïcha M.",   r: "CEO startup santé",  s: 5, t: "L'expertise UX a fait toute la différence. Notre taux de rétention à J7 est de 68% — bien au-dessus de la moyenne du secteur. Un travail d'orfèvre." },
  { i: "N", c: GR,  n: "Nicolas F.", r: "Directeur digital",  s: 5, t: "De l'idée au store en 8 semaines. Qualité du code, respect du budget, communication irréprochable. On a lancé notre MVP et levé des fonds dans la foulée." },
];

/* ═══════════════════════════════════════ PAGE ══════════════════════════════════════ */
export default function ApplicationMobilePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-[#07070a] text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-28">

        {/* Backgrounds */}
        <div className="pointer-events-none absolute inset-0">
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.022]"
            style={{ backgroundImage: `linear-gradient(rgba(${CR},.7) 1px,transparent 1px),linear-gradient(90deg,rgba(${CR},.7) 1px,transparent 1px)`, backgroundSize: "52px 52px" }} />
          {/* Orbs */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [.06, .13, .06] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-48 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px]"
            style={{ background: `radial-gradient(circle,rgba(${CR},1) 0%,transparent 70%)` }} />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [.04, .09, .04] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: `radial-gradient(circle,rgba(${IR},1) 0%,transparent 70%)` }} />
          <div className="absolute right-1/4 bottom-0 w-[280px] h-[280px] rounded-full blur-[80px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${GR},1) 0%,transparent 70%)` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: .45, ease }}
                className="mb-5"
              >
                <Link href="/services"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
                  <ArrowLeft size={11} /> Tous les services
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease, delay: .05 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[.72rem] font-bold"
                style={{ borderColor: `rgba(${CR},.3)`, background: `rgba(${CR},.08)`, color: C }}
              >
                <Smartphone size={11} /> Application mobile iOS / Android
                <span className="ml-1 rounded-full px-2 py-0.5 text-[.6rem] font-extrabold text-[#07070a]"
                  style={{ background: C }}>SUR MESURE</span>
              </motion.div>

              <h1 className="mb-5 text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.07] tracking-tight">
                <MultiLineReveal
                  lines={["Votre application", "mobile, pensée", "pour scaler."]}
                  highlight={2}
                  stagger={.13}
                  wordStagger={.055}
                  delay={.08}
                  lineClassName="justify-start"
                />
              </h1>

              <FadeReveal delay={.28}>
                <p className="mb-7 max-w-lg text-base sm:text-lg leading-relaxed text-white/50">
                  iOS, Android, cross-platform — on conçoit des applications natives qui fidélisent vos utilisateurs, génèrent des revenus récurrents et positionnent votre marque à un niveau supérieur.
                </p>
              </FadeReveal>

              {/* "Sur devis" block */}
              <FadeReveal delay={.36}>
                <div className="mb-7 inline-flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5"
                  style={{ borderColor: `rgba(${CR},.22)`, background: `rgba(${CR},.06)` }}>
                  <div>
                    <p className="text-[.65rem] font-bold uppercase tracking-widest text-white/35 mb-0.5">Tarif</p>
                    <p className="text-[1.6rem] font-extrabold leading-none" style={{ color: C }}>Sur devis</p>
                    <p className="text-[.62rem] text-white/35 mt-0.5">Après atelier stratégique gratuit</p>
                  </div>
                  <div className="h-12 w-px bg-white/[0.08]" />
                  <div className="space-y-1">
                    {["Devis gratuit & sans engagement", "MVP dès 6 semaines", "iOS + Android couverts"].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-xs text-white/55">
                        <CheckCircle2 size={11} className="shrink-0" style={{ color: C }} /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeReveal>

              <FadeReveal delay={.44}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact?besoin=Application+mobile"
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(34,211,238,0.3)]"
                    style={{ background: `linear-gradient(135deg,${C2},${C})`, color: "#07070a" }}>
                    Parler de mon application <ArrowRight size={15} />
                  </Link>
                  <a href="#processus"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                    Voir la méthode
                  </a>
                </div>
              </FadeReveal>
            </div>

            {/* Right: phone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 36, scale: .93 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .8, ease, delay: .32 }}
              className="relative flex justify-center"
            >
              {/* Glow behind phone */}
              <div className="pointer-events-none absolute inset-0 flex justify-center items-center">
                <div className="w-[280px] h-[500px] rounded-full blur-3xl opacity-[0.22]"
                  style={{ background: `radial-gradient(ellipse,rgba(${CR},.8) 0%,rgba(${IR},.4) 55%,transparent 75%)` }} />
              </div>

              {/* Phone frame */}
              <div className="relative w-[230px] sm:w-[260px]">
                <div className="relative overflow-hidden rounded-[36px] border-[2px] shadow-[0_60px_120px_rgba(0,0,0,.85)]"
                  style={{ borderColor: "rgba(255,255,255,.12)", background: "#0d0d10" }}>

                  {/* Dynamic island */}
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-20 h-5 rounded-full"
                      style={{ background: "#111116" }}>
                      <div className="flex items-center justify-center gap-1.5 h-full">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: C }} />
                        <div className="w-5 h-1.5 rounded-full bg-white/20" />
                      </div>
                    </div>
                  </div>

                  {/* Status bar */}
                  <div className="flex items-center justify-between px-5 py-1">
                    <span className="text-[.55rem] font-bold text-white/60">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex items-end gap-0.5 h-2.5">
                        {[60, 80, 100, 80].map((h, i) => (
                          <div key={i} className="w-0.5 rounded-sm bg-white/50" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <div className="w-3 h-1.5 rounded-sm border border-white/40 ml-0.5">
                        <div className="h-full w-3/4 rounded-sm" style={{ background: C }} />
                      </div>
                    </div>
                  </div>

                  {/* App header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]"
                    style={{ background: "rgba(255,255,255,.025)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: `rgba(${CR},.2)` }}>
                        <div className="w-3 h-3 rounded-sm" style={{ background: C }} />
                      </div>
                      <span className="text-[.65rem] font-extrabold text-white">MonApp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,.06)" }}>
                        <Bell size={9} style={{ color: C }} />
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full text-[.35rem] flex items-center justify-center text-[#07070a] font-extrabold"
                          style={{ background: C }}>3</div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-white/10" />
                    </div>
                  </div>

                  {/* Dashboard content */}
                  <div className="px-3 pt-3 pb-2" style={{ background: "#0a0a0e" }}>
                    {/* Revenue card */}
                    <div className="rounded-2xl p-3 mb-2.5"
                      style={{ background: `linear-gradient(135deg,rgba(${CR},.15) 0%,rgba(${IR},.1) 100%)`, border: `1px solid rgba(${CR},.2)` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[.52rem] font-bold text-white/50 uppercase tracking-wider">Revenus</span>
                        <span className="text-[.52rem] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `rgba(${CR},.15)`, color: C }}>+18%</span>
                      </div>
                      <p className="text-lg font-extrabold mb-1" style={{ color: C }}>€12,450</p>
                      {/* Mini sparkline */}
                      <div className="flex items-end gap-0.5 h-5">
                        {[35, 55, 40, 70, 50, 80, 60, 90, 65, 100].map((h, i) => (
                          <motion.div key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: .9 + i * .05, duration: .35, ease }}
                            className="flex-1 rounded-sm"
                            style={{ background: i === 9 ? C : `rgba(${CR},.25)` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                      {[
                        ["2,847", "Utilisateurs", CR],
                        ["94%",   "Rétention J7", IR],
                      ].map(([v, l, c]) => (
                        <div key={l} className="rounded-xl border border-white/[0.06] p-2.5"
                          style={{ background: "#111116" }}>
                          <p className="text-sm font-extrabold mb-0.5" style={{ color: `rgba(${c},.9)` }}>{v}</p>
                          <p className="text-[.52rem] text-white/35">{l}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action list */}
                    <div className="space-y-1.5">
                      {[
                        [Activity,      "Analytics",     CR],
                        [CreditCard,    "Paiements",     IR],
                        [MessageSquare, "Messages",      "249,168,38"],
                      ].map(([Icon, label, c]) => (
                        <div key={label as string}
                          className="flex items-center justify-between rounded-xl border border-white/[0.05] px-3 py-2"
                          style={{ background: "#111116" }}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                              style={{ background: `rgba(${c},.12)` }}>
                              <Icon size={10} style={{ color: `rgba(${c},.9)` }} />
                            </div>
                            <span className="text-[.6rem] font-semibold text-white/70">{label as string}</span>
                          </div>
                          <ChevronRight size={9} className="text-white/25" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="flex items-center justify-around border-t border-white/[0.07] px-2 py-2.5"
                    style={{ background: "#0d0d10" }}>
                    {[LayoutDashboard, BarChart3, Bell, Settings].map((Icon, i) => (
                      <div key={i}
                        className="flex flex-col items-center gap-0.5 w-10 py-1 rounded-xl transition-all"
                        style={i === 0 ? { background: `rgba(${CR},.1)` } : {}}>
                        <Icon size={14} style={{ color: i === 0 ? C : "rgba(255,255,255,.3)" }} />
                        {i === 0 && <div className="w-1 h-1 rounded-full" style={{ background: C }} />}
                      </div>
                    ))}
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center py-2">
                    <div className="w-20 h-1 rounded-full bg-white/25" />
                  </div>
                </div>

                {/* Phone side buttons (decorative) */}
                <div className="absolute -right-[3px] top-24 w-[3px] h-14 rounded-r-full bg-white/10" />
                <div className="absolute -left-[3px] top-20 w-[3px] h-8 rounded-l-full bg-white/10" />
                <div className="absolute -left-[3px] top-32 w-[3px] h-12 rounded-l-full bg-white/10" />
              </div>

              {/* Floating chips */}
              <motion.div
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                className="absolute top-12 -right-2 sm:right-0 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                style={{ background: "#14141a" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: `rgba(${CR},.15)` }}>
                    <Star size={9} style={{ color: C }} />
                  </div>
                  <div>
                    <p className="text-[.58rem] font-bold text-white">4.9 ★ App Store</p>
                    <p className="text-[.5rem] text-white/35">1 200+ avis</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 }}
                className="absolute top-1/3 -left-2 sm:-left-4 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                style={{ background: "#14141a" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-3 h-5 rounded-sm" style={{ background: `rgba(${CR},.7)` }} />
                    <div className="w-3 h-5 rounded-sm" style={{ background: `rgba(${IR},.7)` }} />
                  </div>
                  <div>
                    <p className="text-[.58rem] font-bold text-white">iOS + Android</p>
                    <p className="text-[.5rem] text-white/35">Cross-platform</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 right-4 sm:right-8 rounded-xl border px-3.5 py-2 hidden sm:flex items-center gap-2"
                style={{ borderColor: `rgba(${CR},.28)`, background: `rgba(${CR},.08)` }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C }} />
                <p className="text-[.58rem] font-semibold" style={{ color: C }}>MVP en 6 semaines</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <div className="border-y border-white/[0.05] py-5 px-5"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            ["6 sem.",  "Délai MVP moyen",              CR],
            ["3×",     "Plus de rétention vs site web", IR],
            ["4.9★",   "Note moyenne App Store",        "249,168,38"],
            ["100%",   "Couverture iOS & Android",      "244,114,182"],
          ].map(([v, l, c]) => (
            <motion.div key={l} {...fadeIn} viewport={viewport} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold mb-0.5" style={{ color: `rgba(${c},.9)` }}>{v}</p>
              <p className="text-[.68rem] text-white/40 font-medium">{l}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. POURQUOI UNE APP MOBILE
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Smartphone size={12} style={{ color: C }} /> Pourquoi une app ?
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              L&apos;app mobile, <span style={{ color: C }}>votre canal le plus puissant</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              En 2025, les utilisateurs passent 90% de leur temps mobile dans des applications. Pas dans un navigateur.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POURQUOI_APP.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .22 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 120%,rgba(${item.r},.12) 0%,transparent 65%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={19} style={{ color: item.c }} />
                </div>
                <p className="font-bold text-white text-sm mb-1.5">{item.t}</p>
                <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. TYPES D'APPLICATIONS
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${IR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Layers size={12} style={{ color: C }} /> Types d&apos;applications
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Quel type <span style={{ color: C }}>d&apos;application vous convient ?</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Chaque projet est unique. On s&apos;adapte à votre secteur, vos utilisateurs et vos objectifs business.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TYPES_APP.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .22 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 0% 100%,rgba(${item.r},.1) 0%,transparent 60%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={19} style={{ color: item.c }} />
                </div>
                <p className="font-bold text-white text-sm mb-1.5">{item.t}</p>
                <p className="text-xs text-white/45 leading-relaxed mb-3">{item.d}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map(tag => (
                    <span key={tag}
                      className="text-[.6rem] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `rgba(${item.r},.1)`, color: `rgba(${item.r},.9)` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. FONCTIONNALITÉS
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Code2 size={12} style={{ color: C }} /> Fonctionnalités
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Tout ce qu&apos;on peut <span style={{ color: C }}>intégrer dans votre app</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Authentification, paiements, temps réel, offline — on maîtrise l&apos;ensemble de l&apos;écosystème mobile.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FONCTIONNALITES.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -4, transition: { duration: .2 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 120%,rgba(${item.r},.1) 0%,transparent 60%)` }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={16} style={{ color: item.c }} />
                </div>
                <p className="font-bold text-white text-sm mb-1">{item.t}</p>
                <p className="text-xs text-white/40 leading-relaxed">{item.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. PROCESSUS — 7 ÉTAPES
      ══════════════════════════════════════════ */}
      <section id="processus" className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 w-[400px] h-[400px] rounded-full blur-[110px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${CR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Zap size={12} style={{ color: C }} /> Notre méthode
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              De l&apos;idée à l&apos;App Store <span style={{ color: C }}>en 7 étapes</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Un processus éprouvé, piloté sprint par sprint, avec des points de validation à chaque étape clé.
            </motion.p>
          </motion.div>

          {/* Desktop — 4 + 3 staggered */}
          <div className="hidden lg:block space-y-8">
            {/* Row 1: 4 steps */}
            <div className="relative">
              <motion.div
                initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.3, ease, delay: .4 }}
                className="absolute top-9 left-[12%] right-[12%] h-px origin-left"
                style={{ background: `linear-gradient(90deg,${C},${I})` }}
              />
              <div className="grid grid-cols-4 gap-4">
                {PROCESSUS.slice(0, 4).map((e, i) => (
                  <motion.div key={e.t}
                    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: .2 + i * .11, duration: .5, ease }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="relative w-[70px] h-[70px] rounded-2xl border-2 flex items-center justify-center mb-4 z-10"
                      style={{ borderColor: `rgba(${e.r},.4)`, background: `rgba(${e.r},.08)` }}>
                      <e.icon size={21} style={{ color: e.c }} />
                      <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-[.58rem] font-extrabold flex items-center justify-center text-[#07070a]"
                        style={{ background: e.c }}>{i + 1}</span>
                    </div>
                    <p className="font-bold text-white text-sm mb-1">{e.t}</p>
                    <p className="text-xs text-white/45 leading-relaxed mb-2 max-w-[140px]">{e.d}</p>
                    <span className="text-[.6rem] font-bold px-2.5 py-1 rounded-full border border-white/[0.08]"
                      style={{ color: e.c }}>
                      {e.duration}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
            {/* Row 2: 3 steps (offset) */}
            <div className="relative px-[12.5%]">
              <motion.div
                initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                viewport={{ once: true }} transition={{ duration: 1, ease, delay: .8 }}
                className="absolute top-9 left-[20%] right-[20%] h-px origin-left"
                style={{ background: `linear-gradient(90deg,${I},${C})` }}
              />
              <div className="grid grid-cols-3 gap-4">
                {PROCESSUS.slice(4).map((e, i) => (
                  <motion.div key={e.t}
                    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: .5 + i * .12, duration: .5, ease }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="relative w-[70px] h-[70px] rounded-2xl border-2 flex items-center justify-center mb-4 z-10"
                      style={{ borderColor: `rgba(${e.r},.4)`, background: `rgba(${e.r},.08)` }}>
                      <e.icon size={21} style={{ color: e.c }} />
                      <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-[.58rem] font-extrabold flex items-center justify-center text-[#07070a]"
                        style={{ background: e.c }}>{i + 5}</span>
                    </div>
                    <p className="font-bold text-white text-sm mb-1">{e.t}</p>
                    <p className="text-xs text-white/45 leading-relaxed mb-2 max-w-[140px]">{e.d}</p>
                    <span className="text-[.6rem] font-bold px-2.5 py-1 rounded-full border border-white/[0.08]"
                      style={{ color: e.c }}>
                      {e.duration}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile — vertical */}
          <div className="lg:hidden space-y-3 relative">
            <div className="absolute left-[22px] top-6 bottom-6 w-px"
              style={{ background: `linear-gradient(180deg,transparent,rgba(${CR},.35),rgba(${IR},.35),transparent)` }} />
            {PROCESSUS.map((e, i) => (
              <motion.div key={e.t}
                initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * .07, duration: .4, ease }}
                className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 ml-10"
              >
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `rgba(${e.r},.12)` }}>
                  <e.icon size={16} style={{ color: e.c }} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[.5rem] font-extrabold flex items-center justify-center text-[#07070a]"
                    style={{ background: e.c }}>{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-white text-sm">{e.t}</p>
                    <span className="text-[.6rem] font-bold" style={{ color: e.c }}>{e.duration}</span>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed">{e.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. SUR MESURE — BLOC PREMIUM
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [.03, .07, .03] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[130px]"
            style={{ background: `radial-gradient(ellipse,rgba(${CR},.8) 0%,rgba(${IR},.6) 50%,transparent 70%)` }}
          />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-10">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Sparkles size={12} style={{ color: G }} /> Notre engagement
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Un projet <span style={{ color: C }}>100% sur mesure</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Pas de template, pas de no-code fragile. Chaque ligne de code est écrite pour votre projet, votre audience, votre vision.
            </motion.p>
          </motion.div>

          {/* 3 piliers */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: .6, ease }}
            className="relative rounded-3xl border overflow-hidden"
            style={{ borderColor: `rgba(${CR},.18)`, background: `rgba(${CR},.04)` }}
          >
            {/* Top gradient line */}
            <div className="h-px w-full"
              style={{ background: `linear-gradient(90deg,transparent,rgba(${CR},.5),rgba(${IR},.5),transparent)` }} />

            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
              {[
                {
                  icon: Box,    c: C, r: CR,
                  t: "Chaque projet est unique",
                  d: "On commence par comprendre votre vision, vos utilisateurs et vos contraintes. Le périmètre se construit avec vous, pas pour vous.",
                },
                {
                  icon: BarChart3, c: I, r: IR,
                  t: "Devis personnalisé",
                  d: "Après un atelier stratégique gratuit, vous recevez une proposition détaillée : fonctionnalités, planning, budget. Aucune surprise.",
                },
                {
                  icon: HeartHandshake, c: G, r: GR,
                  t: "Accompagnement 360°",
                  d: "Stratégie, design, développement, publication, maintenance — un seul interlocuteur de A à Z. Pas de sous-traitance.",
                },
              ].map(item => (
                <div key={item.t} className="p-7 flex flex-col items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: `rgba(${item.r},.12)` }}>
                    <item.icon size={20} style={{ color: item.c }} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white mb-2">{item.t}</p>
                    <p className="text-sm text-white/45 leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="border-t border-white/[0.06] px-7 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ background: "rgba(255,255,255,.01)" }}>
              <p className="text-sm text-white/45 max-w-md text-center sm:text-left">
                Discutons de votre projet lors d&apos;un <strong className="text-white/70">appel de 30 min gratuit</strong> — sans engagement.
              </p>
              <Link href="/contact?besoin=Application+mobile"
                className="shrink-0 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                style={{ background: `linear-gradient(135deg,${C2},${C})`, color: "#07070a" }}>
                Réserver mon atelier <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          7. EXPERTISE & PREUVES
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <BadgeCheck size={12} style={{ color: G }} /> Notre expertise
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Pourquoi choisir <span style={{ color: C }}>DJAMA</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Une app mobile c&apos;est un investissement stratégique. On s&apos;assure qu&apos;il tient sur la durée.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PREUVES.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -4, transition: { duration: .2 } }}
                className="group relative flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 0% 100%,rgba(${item.r},.1) 0%,transparent 60%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={18} style={{ color: item.c }} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm mb-1">{item.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. TÉMOIGNAGES
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[500px] h-[200px] rounded-full blur-[80px] opacity-[0.05]"
            style={{ background: `radial-gradient(ellipse,rgba(${CR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Star size={12} style={{ color: "#f9a826" }} /> Ce qu&apos;ils ont lancé
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Des projets <span style={{ color: C }}>qui ont décollé</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-3 gap-4">
            {TEMOIGNAGES.map(t => (
              <motion.div key={t.n} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .2 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col gap-4 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 110%,rgba(${t.c},.08) 0%,transparent 60%)` }} />
                <div className="flex gap-0.5">
                  {Array.from({ length: t.s }).map((_, i) => (
                    <Star key={i} size={13} fill="#f9a826" stroke="none" />
                  ))}
                </div>
                <p className="text-sm text-white/65 leading-relaxed flex-1 italic">&ldquo;{t.t}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#07070a] shrink-0"
                    style={{ background: `rgba(${t.c},.9)` }}>{t.i}</div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{t.n}</p>
                    <p className="text-xs text-white/40">{t.r}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          9. FAQ
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-2xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <HelpCircle size={12} style={{ color: C }} /> Questions fréquentes
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Vos questions, <span style={{ color: C }}>nos réponses</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-2.5">
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={cardReveal}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: openFaq === i ? `rgba(${CR},.3)` : "rgba(255,255,255,.07)",
                  background:  openFaq === i ? `rgba(${CR},.05)` : "rgba(255,255,255,.03)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-white/88 leading-snug">{item.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: .22 }} className="shrink-0">
                    <ChevronDown size={14} style={{ color: openFaq === i ? C : "rgba(255,255,255,.38)" }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }}
                    >
                      <p className="px-5 pb-4 text-sm text-white/55 leading-relaxed border-t border-white/[0.05] pt-3">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          10. CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-28 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [.05, .11, .05] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full blur-[150px]"
            style={{ background: `radial-gradient(ellipse,rgba(${CR},1) 0%,rgba(${IR},.7) 45%,transparent 70%)` }}
          />
          <div className="absolute inset-0 opacity-[0.014]"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.9) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>

        <div className="max-w-3xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport}
            className="relative rounded-3xl border p-8 sm:p-14 text-center overflow-hidden"
            style={{ borderColor: `rgba(${CR},.2)`, background: `rgba(${CR},.04)` }}
          >
            {/* Corners */}
            <div className="absolute top-0 left-0 w-28 h-28 rounded-br-3xl border-b border-r"
              style={{ borderColor: `rgba(${CR},.12)` }} />
            <div className="absolute bottom-0 right-0 w-28 h-28 rounded-tl-3xl border-t border-l"
              style={{ borderColor: `rgba(${CR},.12)` }} />
            {/* Floating orbs in card */}
            <div className="pointer-events-none absolute -top-12 right-8 w-40 h-40 rounded-full blur-3xl opacity-15"
              style={{ background: `rgba(${CR},1)` }} />
            <div className="pointer-events-none absolute -bottom-12 left-8 w-36 h-36 rounded-full blur-3xl opacity-12"
              style={{ background: `rgba(${IR},1)` }} />

            <motion.div variants={fadeIn}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-7">
              <Rocket size={12} style={{ color: C }} /> Votre app vous attend
            </motion.div>

            <motion.h2 variants={fadeIn}
              className="relative text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold mb-5 leading-tight">
              Transformons votre idée<br />
              <span style={{
                background: `linear-gradient(135deg,${C},${I})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                en application réelle.
              </span>
            </motion.h2>

            <motion.p variants={fadeIn}
              className="relative text-white/45 text-base max-w-md mx-auto mb-9">
              Atelier stratégique gratuit de 30 min. On définit ensemble le périmètre, la stack et le budget — sans engagement.
            </motion.p>

            <motion.div variants={fadeIn} className="relative flex flex-col sm:flex-row justify-center gap-3 mb-9">
              <Link href="/contact?besoin=Application+mobile"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold transition-all duration-200 hover:scale-[1.02] shadow-[0_0_40px_rgba(34,211,238,0.2)] hover:shadow-[0_0_60px_rgba(34,211,238,0.38)]"
                style={{ background: `linear-gradient(135deg,${C2},${C})`, color: "#07070a" }}>
                Parler de mon application <ArrowRight size={15} />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                Voir nos réalisations
              </Link>
            </motion.div>

            <motion.div variants={fadeIn}
              className="relative flex flex-wrap justify-center gap-5 sm:gap-7">
              {[
                [Clock,      "Atelier gratuit 30 min"],
                [Shield,     "Sans engagement"],
                [Smartphone, "iOS + Android"],
                [Star,       "Devis sous 48h"],
              ].map(([Icon, l]) => (
                <div key={l as string} className="flex items-center gap-1.5 text-xs text-white/35">
                  <Icon size={11} style={{ color: C }} />
                  {l as string}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
