"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  ArrowLeft, Users, Settings, Shield, Star, LayoutDashboard,
  Code2, Briefcase, TrendingUp, Lock, Globe, Database,
  CreditCard, Zap, HelpCircle, BadgeCheck, Rocket, GitBranch,
  BarChart3, Activity, Layers, FileText, Bell, Clock,
  ChevronRight, Workflow, Link2, Building2, PieChart,
  UserCheck, Package, Key, Mail, Download, RefreshCw,
  Gauge, AlertCircle,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Palette violet / bleu — enterprise SaaS ── */
const P  = "#a78bfa";
const PR = "167,139,250";
const P2 = "#7c3aed";
const B  = "#60a5fa";
const BR = "96,165,250";
const G  = "#c9a55a";
const GR = "201,165,90";

/* ═══════════════════════════════ DATA ═══════════════════════════════ */

const CAS_USAGE = [
  { icon: Layers,        c: P,        r: PR,           t: "Plateforme SaaS",          d: "Application en mode abonnement avec multi-tenant, facturation automatique, dashboard client et gestion des accès par rôle.",     tags: ["Multi-tenant", "Abonnement", "API"] },
  { icon: Settings,      c: B,        r: BR,           t: "Outil métier interne",      d: "Workflow RH, planification d'équipe, gestion de stock, reporting opérationnel — un outil pensé pour vos processus réels.",        tags: ["Équipes", "Process", "Reporting"] },
  { icon: Building2,     c: "#f9a826",r: "249,168,38", t: "Plateforme B2B",            d: "Portail entre votre entreprise et vos partenaires ou clients professionnels : commandes, contrats, suivi, facturation.",          tags: ["B2B", "Portail", "Facturation"] },
  { icon: UserCheck,     c: "#4ade80",r: "74,222,128", t: "Espace client / extranet",  d: "Espace sécurisé où vos clients suivent leurs dossiers, téléchargent des documents, échangent avec vos équipes.",                  tags: ["Client", "Documents", "Sécurisé"] },
  { icon: LayoutDashboard,c: "#f472b6",r: "244,114,182",t: "Portail de gestion",        d: "Interface centralisée pour administrer vos entités, agences ou filiales — droits granulaires, vue consolidée, exports.",          tags: ["Multi-entité", "Admin", "Droits"] },
  { icon: PieChart,      c: G,        r: GR,           t: "Dashboard analytique",      d: "Agrégation de vos sources de données en un tableau de bord temps réel : KPIs, alertes, rapports automatiques.",                   tags: ["KPIs", "Temps réel", "Exports"] },
];

const FONCTIONNALITES = [
  { icon: Key,            c: P,        r: PR,           t: "Authentification",          d: "SSO, OAuth, MFA, invitations — accès sécurisé pour tous les utilisateurs." },
  { icon: Shield,         c: B,        r: BR,           t: "Rôles & permissions",       d: "Droits granulaires par rôle, ressource ou organisation. Zero trust par défaut." },
  { icon: LayoutDashboard,c: "#f9a826",r: "249,168,38", t: "Dashboard sur mesure",      d: "Tableaux de bord dynamiques, widgets configurables, vues personnalisées." },
  { icon: Database,       c: "#4ade80",r: "74,222,128", t: "Base de données",           d: "Modélisation métier complexe, requêtes optimisées, historique, soft-delete." },
  { icon: Workflow,       c: "#f472b6",r: "244,114,182",t: "Automatisations",           d: "Triggers, webhooks, jobs planifiés, notifications — la logique métier automatisée." },
  { icon: CreditCard,     c: G,        r: GR,           t: "Facturation",               d: "Abonnements Stripe, paiements, factures PDF, relances, webhooks comptables." },
  { icon: Link2,          c: P,        r: PR,           t: "API REST / GraphQL",        d: "Endpoints documentés, versioning, rate limiting, auth par clé API." },
  { icon: Bell,           c: B,        r: BR,           t: "Notifications",             d: "Email, SMS, in-app, push — canal et fréquence configurables par utilisateur." },
  { icon: UserCheck,      c: "#f9a826",r: "249,168,38", t: "Espace client",             d: "Portail dédié avec documents, historique, messages et suivi de dossier." },
  { icon: BarChart3,      c: "#4ade80",r: "74,222,128", t: "Reporting",                 d: "Rapports automatiques, graphiques interactifs, exports planifiés." },
  { icon: Download,       c: "#f472b6",r: "244,114,182",t: "Exports (PDF / CSV)",       d: "Génération à la demande ou programmée — données brutes et documents formatés." },
  { icon: Users,          c: G,        r: GR,           t: "Multi-utilisateurs",        d: "Organisations, équipes, sous-comptes — arborescence illimitée selon vos besoins." },
];

const PROCESSUS = [
  { icon: BarChart3,   c: G,        r: GR,           t: "Audit & cadrage",     d: "Analyse de l'existant, ateliers métier, définition du périmètre fonctionnel.",  dur: "J1–J5"   },
  { icon: GitBranch,   c: P,        r: PR,           t: "Architecture",        d: "Modélisation des données, choix de stack, schéma d'infrastructure cloud.",       dur: "J6–J10"  },
  { icon: Layers,      c: B,        r: BR,           t: "UX / Wireframes",     d: "Parcours utilisateurs, arborescence, maquettes fil de fer validées avec vous.",  dur: "J11–J18" },
  { icon: Sparkles,    c: "#f472b6",r: "244,114,182",t: "Design UI",           d: "Interface premium, design system, composants réutilisables, prototypage.",       dur: "J19–J26" },
  { icon: Code2,       c: "#4ade80",r: "74,222,128", t: "Développement",       d: "Sprints agiles, revues hebdomadaires, démo à chaque fin de sprint.",             dur: "J27–J60" },
  { icon: Link2,       c: P,        r: PR,           t: "Intégrations",        d: "Connexion aux APIs tierces, Stripe, CRM, ERP, outils internes.",                 dur: "J55–J65" },
  { icon: Activity,    c: B,        r: BR,           t: "Tests & QA",          d: "Tests end-to-end, audit de sécurité, tests de charge, corrections.",             dur: "J66–J75" },
  { icon: Rocket,      c: G,        r: GR,           t: "Déploiement",         d: "Mise en production, monitoring, onboarding équipe, documentation.",              dur: "J76–J80" },
];

const VALEUR_BUSINESS = [
  { icon: Clock,       c: P,        r: PR,           t: "−60% de temps opérationnel",   d: "Les tâches manuelles répétitives disparaissent. Vos équipes se concentrent sur la valeur ajoutée." },
  { icon: AlertCircle, c: B,        r: BR,           t: "−80% d'erreurs humaines",       d: "Processus automatisés, données centralisées, validations en temps réel." },
  { icon: Gauge,       c: "#f9a826",r: "249,168,38", t: "Pilotage en temps réel",        d: "Toutes vos données dans un seul tableau de bord. Décisions basées sur les faits, pas l'intuition." },
  { icon: TrendingUp,  c: "#4ade80",r: "74,222,128", t: "Expérience client améliorée",   d: "Portail client intuitif, réponses automatisées, suivi transparent = rétention et satisfaction en hausse." },
  { icon: Users,       c: "#f472b6",r: "244,114,182",t: "+40% de productivité équipe",   d: "Workflows intégrés, notifications pertinentes, accès mobile — vos équipes travaillent mieux, ensemble." },
  { icon: Rocket,      c: G,        r: GR,           t: "Scalabilité sans refonte",      d: "Architecture conçue pour grandir. De 10 à 10 000 utilisateurs sans réécrire une ligne." },
];

const FAQ = [
  { q: "Quel est le budget pour une plateforme sur mesure ?",        a: "Les projets démarrent généralement autour de 5 000 € pour une plateforme simple, et atteignent 15 000–40 000 € pour un SaaS ou outil métier complexe. Un atelier de cadrage gratuit nous permet de définir le périmètre exact et de vous soumettre un devis précis." },
  { q: "Combien de temps prend le développement ?",                   a: "Un premier périmètre fonctionnel peut être livré en 6 à 10 semaines. Une plateforme complète avec intégrations et multi-tenant prend généralement 3 à 5 mois. On travaille en sprints agiles avec des démonstrations à chaque étape." },
  { q: "Quelle technologie utilisez-vous ?",                          a: "Next.js (React) pour le front-end, Node.js / Prisma pour l'API, PostgreSQL pour la base de données, et des hébergeurs cloud (Vercel, Railway, AWS) selon la criticité du projet. Stack moderne, sécurisée et maintenable." },
  { q: "La plateforme est-elle maintenable par mon équipe ?",         a: "Oui. On livre une documentation technique complète et on peut former votre équipe. Le code est propre, testé et structuré pour être repris. On propose aussi des contrats de TMA (tierce maintenance applicative) si vous préférez déléguer." },
  { q: "Comment gérez-vous la sécurité et le RGPD ?",                a: "Authentification forte (MFA), chiffrement des données sensibles, gestion des droits fine, logs d'audit, hébergement en Europe. On peut réaliser un audit de sécurité dédié et vous accompagner sur la conformité RGPD." },
  { q: "Peut-on faire évoluer la plateforme après la livraison ?",    a: "C'est au cœur de notre philosophie. L'architecture est conçue pour l'évolutivité. On propose des cycles d'itération post-lancement : nouvelles fonctionnalités, optimisation des performances, intégrations supplémentaires." },
];

const TEMOIGNAGES = [
  { i: "M", c: PR,  n: "Marc D.",     r: "CEO, SaaS RH",           s: 5, t: "DJAMA a construit notre plateforme RH de A à Z en 10 semaines. Authentification, rôles, dashboard analytics — tout est parfait. On a pu lever des fonds avec cette démo." },
  { i: "S", c: BR,  n: "Sophie L.",   r: "Directrice ops, PME",    s: 5, t: "Notre extranet client a transformé notre relation commerciale. Les clients accèdent à leurs dossiers en temps réel. Les appels de suivi ont diminué de 70%." },
  { i: "K", c: GR,  n: "Karim B.",    r: "CTO, scale-up B2B",      s: 5, t: "La qualité technique est impressionnante. API bien documentée, tests complets, architecture scalable. On est passés de 50 à 2000 clients sans aucune refonte." },
];

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default function PlateformeWebSurMesurePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-[#07070a] text-white overflow-x-hidden">

      {/* ══════════════ 1. HERO ══════════════ */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-28">

        {/* BG */}
        <div className="pointer-events-none absolute inset-0">
          {/* grid */}
          <div className="absolute inset-0 opacity-[0.018]"
            style={{ backgroundImage: `linear-gradient(rgba(${PR},.7) 1px,transparent 1px),linear-gradient(90deg,rgba(${PR},.7) 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />
          {/* orbs */}
          <motion.div
            animate={{ scale: [1, 1.14, 1], opacity: [.05, .12, .05] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-56 top-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px]"
            style={{ background: `radial-gradient(circle,rgba(${PR},1) 0%,transparent 70%)` }} />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [.03, .08, .03] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
            className="absolute right-0 top-0 w-[550px] h-[550px] rounded-full blur-[130px]"
            style={{ background: `radial-gradient(circle,rgba(${BR},1) 0%,transparent 70%)` }} />
          <div className="absolute right-1/3 bottom-0 w-[300px] h-[300px] rounded-full blur-[90px] opacity-[0.04]"
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
                style={{ borderColor: `rgba(${PR},.3)`, background: `rgba(${PR},.08)`, color: P }}
              >
                <Server size={11} /> Plateforme web sur mesure
                <span className="ml-1 rounded-full px-2 py-0.5 text-[.6rem] font-extrabold text-[#07070a]"
                  style={{ background: P }}>SUR DEVIS</span>
              </motion.div>

              <h1 className="mb-5 text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.07] tracking-tight">
                <MultiLineReveal
                  lines={["Votre outil digital,", "construit pour", "votre business."]}
                  highlight={2}
                  stagger={.13}
                  wordStagger={.055}
                  delay={.08}
                  lineClassName="justify-start"
                />
              </h1>

              <FadeReveal delay={.28}>
                <p className="mb-7 max-w-lg text-base sm:text-lg leading-relaxed text-white/50">
                  SaaS, outil métier, extranet client, portail B2B — on conçoit des plateformes web sur mesure qui automatisent vos processus, centralisent vos données et font gagner du temps à vos équipes.
                </p>
              </FadeReveal>

              {/* "Sur devis" block */}
              <FadeReveal delay={.36}>
                <div className="mb-7 inline-flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5"
                  style={{ borderColor: `rgba(${PR},.22)`, background: `rgba(${PR},.06)` }}>
                  <div>
                    <p className="text-[.65rem] font-bold uppercase tracking-widest text-white/35 mb-0.5">Investissement</p>
                    <p className="text-[1.6rem] font-extrabold leading-none" style={{ color: P }}>Sur devis</p>
                    <p className="text-[.62rem] text-white/35 mt-0.5">Après atelier de cadrage gratuit</p>
                  </div>
                  <div className="h-12 w-px bg-white/[0.08]" />
                  <div className="space-y-1">
                    {["Cadrage gratuit & sans engagement", "Devis détaillé sous 48h", "Architecture pensée pour scaler"].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-xs text-white/55">
                        <CheckCircle2 size={11} className="shrink-0" style={{ color: P }} /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeReveal>

              <FadeReveal delay={.44}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact?besoin=Plateforme+web+sur+mesure"
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(167,139,250,0.32)]"
                    style={{ background: `linear-gradient(135deg,${P2},${P})`, color: "#07070a" }}>
                    Discuter de ma plateforme <ArrowRight size={15} />
                  </Link>
                  <a href="#processus"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                    Voir la méthode
                  </a>
                </div>
              </FadeReveal>
            </div>

            {/* Right: dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, y: 36, scale: .93 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .85, ease, delay: .3 }}
              className="relative flex justify-center"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0 flex justify-center items-center">
                <div className="w-[420px] h-[300px] rounded-full blur-3xl opacity-[0.18]"
                  style={{ background: `radial-gradient(ellipse,rgba(${PR},.8) 0%,rgba(${BR},.4) 55%,transparent 75%)` }} />
              </div>

              {/* Browser frame */}
              <div className="relative w-full max-w-[480px]">
                <div className="rounded-2xl border-[1.5px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,.85)]"
                  style={{ borderColor: "rgba(255,255,255,.1)", background: "#0d0d12" }}>

                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07]"
                    style={{ background: "#111118" }}>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 rounded-md bg-white/[0.05] px-3 py-1.5 mx-4">
                      <Lock size={9} className="text-white/30 shrink-0" />
                      <span className="text-[.6rem] text-white/35 truncate">app.masolution.io/dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: `rgba(${PR},.15)` }}>
                        <Bell size={9} style={{ color: P }} />
                      </div>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[.52rem] font-extrabold text-[#07070a]"
                        style={{ background: P }}>M</div>
                    </div>
                  </div>

                  {/* App layout */}
                  <div className="flex" style={{ background: "#0a0a0f", minHeight: "300px" }}>
                    {/* Sidebar */}
                    <div className="w-12 sm:w-14 border-r border-white/[0.05] flex flex-col items-center py-4 gap-3 shrink-0"
                      style={{ background: "#0d0d12" }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-2"
                        style={{ background: `linear-gradient(135deg,${P2},${P})` }}>
                        <Server size={13} className="text-white" />
                      </div>
                      {[LayoutDashboard, Users, BarChart3, Settings, Shield].map((Icon, i) => (
                        <div key={i}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                          style={i === 0 ? { background: `rgba(${PR},.15)` } : {}}>
                          <Icon size={14} style={{ color: i === 0 ? P : "rgba(255,255,255,.25)" }} />
                        </div>
                      ))}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-4 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[.65rem] font-extrabold text-white">Tableau de bord</p>
                          <p className="text-[.52rem] text-white/35">Vue globale · Avril 2025</p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[.55rem] font-semibold"
                          style={{ color: P, borderColor: `rgba(${PR},.2)`, background: `rgba(${PR},.06)` }}>
                          <Activity size={9} /> Temps réel
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          ["1,248", "Utilisateurs",  PR,  "+12%"],
                          ["€38k",  "Revenus",        BR,  "+24%"],
                          ["98.4%", "Disponibilité", GR,  "stable"],
                        ].map(([v, l, c, trend]) => (
                          <div key={l} className="rounded-xl border border-white/[0.06] p-2.5"
                            style={{ background: "#111118" }}>
                            <p className="text-[.85rem] font-extrabold mb-0.5" style={{ color: `rgba(${c},.95)` }}>{v}</p>
                            <p className="text-[.5rem] text-white/35 mb-1">{l}</p>
                            <span className="text-[.48rem] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: `rgba(${c},.1)`, color: `rgba(${c},.8)` }}>{trend}</span>
                          </div>
                        ))}
                      </div>

                      {/* Chart area */}
                      <div className="rounded-xl border border-white/[0.06] p-3 mb-4"
                        style={{ background: "#111118" }}>
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-[.58rem] font-bold text-white/70">Activité utilisateurs</p>
                          <div className="flex gap-1">
                            {["7j", "30j", "90j"].map((t, i) => (
                              <span key={t} className="text-[.48rem] px-1.5 py-0.5 rounded font-semibold"
                                style={i === 1 ? { background: `rgba(${PR},.15)`, color: P } : { color: "rgba(255,255,255,.25)" }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Bar chart */}
                        <div className="flex items-end gap-[3px] h-10">
                          {[28,42,35,58,47,72,55,80,62,88,70,95].map((h, i) => (
                            <motion.div key={i}
                              initial={{ height: 0 }} animate={{ height: `${h}%` }}
                              transition={{ delay: .7 + i * .055, duration: .38, ease }}
                              className="flex-1 rounded-sm"
                              style={{ background: i >= 10 ? P : `rgba(${PR},.22)` }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Recent activity */}
                      <div className="space-y-1.5">
                        {[
                          [UserCheck,    "Marie Dupont",   "Nouveau compte créé",     PR],
                          [CreditCard,   "Abonnement Pro", "Paiement validé — €149",  BR],
                          [FileText,     "Rapport Q1",     "Exporté en PDF",           GR],
                        ].map(([Icon, title, sub, c]) => (
                          <div key={title as string}
                            className="flex items-center gap-2 rounded-lg border border-white/[0.05] px-2.5 py-2"
                            style={{ background: "#111118" }}>
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: `rgba(${c},.12)` }}>
                              <Icon size={10} style={{ color: `rgba(${c},.85)` }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[.55rem] font-bold text-white/80 truncate">{title as string}</p>
                              <p className="text-[.48rem] text-white/35 truncate">{sub as string}</p>
                            </div>
                            <ChevronRight size={8} className="text-white/20 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating chips */}
                <motion.div
                  initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                  className="absolute -top-3 -right-3 sm:right-0 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                  style={{ background: "#14141c" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ background: `rgba(${PR},.15)` }}>
                      <Shield size={9} style={{ color: P }} />
                    </div>
                    <div>
                      <p className="text-[.58rem] font-bold text-white">RGPD compliant</p>
                      <p className="text-[.5rem] text-white/35">Hébergé en Europe</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 }}
                  className="absolute bottom-16 -left-3 sm:-left-5 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                  style={{ background: "#14141c" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-end gap-0.5 h-5">
                      {[40,65,50,80,60,90].map((h, i) => (
                        <div key={i} className="w-1 rounded-sm"
                          style={{ height: `${h}%`, background: i === 5 ? B : `rgba(${BR},.3)` }} />
                      ))}
                    </div>
                    <div>
                      <p className="text-[.58rem] font-bold text-white">Uptime 99.9%</p>
                      <p className="text-[.5rem] text-white/35">Infrastructure cloud</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-4 right-6 sm:right-10 rounded-xl border px-3.5 py-2 hidden sm:flex items-center gap-2"
                  style={{ borderColor: `rgba(${PR},.28)`, background: `rgba(${PR},.08)` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: P }} />
                  <p className="text-[.58rem] font-semibold" style={{ color: P }}>Architecture scalable</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ STATS BAR ══════════════ */}
      <div className="border-y border-white/[0.05] py-5 px-5"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            ["−60%",  "Tâches manuelles économisées", PR],
            ["99.9%", "Uptime garanti",                BR],
            ["<48h",  "Devis après cadrage",           "249,168,38"],
            ["10×",   "ROI moyen sur 24 mois",         GR],
          ].map(([v, l, c]) => (
            <motion.div key={l} {...fadeIn} viewport={viewport} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold mb-0.5" style={{ color: `rgba(${c},.9)` }}>{v}</p>
              <p className="text-[.68rem] text-white/40 font-medium">{l}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══════════════ 2. PRÉSENTATION ══════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left */}
            <motion.div {...staggerContainer} viewport={viewport}>
              <motion.div variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-5">
                <Server size={12} style={{ color: P }} /> C&apos;est quoi une plateforme web ?
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-5 leading-tight">
                Plus qu&apos;un site web.<br />
                <span style={{ color: P }}>Un vrai produit digital.</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 leading-relaxed mb-6">
                Un site vitrine informe. Une plateforme web <strong className="text-white/75">fait tourner votre activité</strong>. Elle gère vos utilisateurs, automatise vos processus, centralise vos données et s&apos;interface avec vos outils existants.
              </motion.p>
              <motion.div variants={fadeIn} className="space-y-3 mb-8">
                {[
                  ["Vous avez des processus métier complexes à digitaliser"],
                  ["Vous gérez des utilisateurs avec des rôles différents"],
                  ["Vos équipes utilisent plusieurs outils non connectés"],
                  ["Vous voulez proposer un espace client ou partenaire"],
                  ["Vous construisez un produit SaaS ou une marketplace"],
                ].map(([t]) => (
                  <div key={t} className="flex items-center gap-3 text-sm text-white/65">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `rgba(${PR},.12)` }}>
                      <CheckCircle2 size={12} style={{ color: P }} />
                    </div>
                    {t}
                  </div>
                ))}
              </motion.div>
              <motion.div variants={fadeIn}>
                <Link href="/contact?besoin=Plateforme+web+sur+mesure"
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: `linear-gradient(135deg,${P2},${P})`, color: "#07070a" }}>
                  Parler de mon projet <ArrowRight size={14} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: when to use */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .65, ease }}
              className="relative rounded-3xl border overflow-hidden"
              style={{ borderColor: `rgba(${PR},.15)`, background: `rgba(${PR},.04)` }}
            >
              <div className="h-px w-full"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${PR},.5),rgba(${BR},.4),transparent)` }} />
              <div className="p-7">
                <p className="text-xs font-bold uppercase tracking-widest mb-5"
                  style={{ color: P }}>Quand choisir une plateforme ?</p>
                <div className="space-y-4">
                  {[
                    { icon: AlertCircle,  c: "#f9a826", r: "249,168,38", t: "Site web insuffisant",  d: 'Votre site "présente" mais ne gère rien. Vos équipes compensent avec des tableurs et des emails.' },
                    { icon: Users,        c: P,         r: PR,           t: "Multi-utilisateurs",    d: "Vous avez des clients, partenaires ou équipes qui ont besoin d&apos;accès différents à vos données." },
                    { icon: Workflow,     c: B,         r: BR,           t: "Processus répétitifs",  d: "Des tâches manuelles reviennent chaque semaine : saisies, envois, vérifications, exports." },
                    { icon: TrendingUp,   c: G,         r: GR,           t: "Croissance à anticiper",d: "Votre activité scale. Vos outils actuels ne tiendront pas. Il faut une base technique solide." },
                  ].map(item => (
                    <div key={item.t} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `rgba(${item.r},.12)` }}>
                        <item.icon size={16} style={{ color: item.c }} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm mb-0.5">{item.t}</p>
                        <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ 3. CAS D'USAGE ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-1/3 w-[450px] h-[450px] rounded-full blur-[110px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${PR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Briefcase size={12} style={{ color: P }} /> Cas d&apos;usage
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Des plateformes pour <span style={{ color: P }}>chaque besoin métier</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Chaque secteur a ses spécificités. On adapte l&apos;architecture, l&apos;UX et les fonctionnalités à votre contexte exact.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAS_USAGE.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .22 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 0% 110%,rgba(${item.r},.1) 0%,transparent 60%)` }} />
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

      {/* ══════════════ 4. FONCTIONNALITÉS ══════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Code2 size={12} style={{ color: P }} /> Fonctionnalités
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Tout ce que <span style={{ color: P }}>votre plateforme peut faire</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Authentification, rôles, facturation, API — on maîtrise l&apos;ensemble de la stack pour vous livrer un produit complet.
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

      {/* ══════════════ 5. PROBLÈME / SOLUTION ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[110px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${PR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Zap size={12} style={{ color: P }} /> Avant / Après
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              La différence <span style={{ color: P }}>une plateforme fait</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Le chaos des outils dispersés vs. une plateforme centrale qui pilote tout.
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* AVANT */}
            <motion.div
              initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .55, ease }}
              className="rounded-3xl border p-7 relative overflow-hidden"
              style={{ borderColor: "rgba(239,68,68,.18)", background: "rgba(239,68,68,.03)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg,transparent,rgba(239,68,68,.4),transparent)" }} />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,.12)" }}>
                  <AlertCircle size={16} className="text-red-400" />
                </div>
                <p className="font-extrabold text-white">Sans plateforme</p>
                <span className="ml-auto text-[.6rem] font-bold px-2 py-0.5 rounded-full text-red-400"
                  style={{ background: "rgba(239,68,68,.1)" }}>Situation actuelle</span>
              </div>
              <div className="space-y-3">
                {[
                  ["Emails + tableurs + appels pour chaque demande client"],
                  ["5–6 outils non connectés — doublon de saisie permanent"],
                  ["Aucune visibilité en temps réel sur l'activité"],
                  ["Erreurs humaines sur les données critiques"],
                  ["Mise à jour manuelle des statuts et documents"],
                  ["Impossible de déléguer sans former longuement"],
                ].map(([t]) => (
                  <div key={t} className="flex items-start gap-3 text-sm text-white/55">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-red-400/60" />
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* APRÈS */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .55, ease, delay: .1 }}
              className="rounded-3xl border p-7 relative overflow-hidden"
              style={{ borderColor: `rgba(${PR},.2)`, background: `rgba(${PR},.04)` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${PR},.5),rgba(${BR},.4),transparent)` }} />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `rgba(${PR},.12)` }}>
                  <CheckCircle2 size={16} style={{ color: P }} />
                </div>
                <p className="font-extrabold text-white">Avec votre plateforme</p>
                <span className="ml-auto text-[.6rem] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `rgba(${PR},.1)`, color: P }}>Objectif atteint</span>
              </div>
              <div className="space-y-3">
                {[
                  ["Espace client dédié — autonomie totale, zéro email de suivi"],
                  ["Un seul outil, toutes les données synchronisées en temps réel"],
                  ["Dashboard live avec KPIs, alertes et rapports automatiques"],
                  ["Validation automatique — aucune saisie en double"],
                  ["Statuts mis à jour automatiquement à chaque action"],
                  ["Rôles et permissions — délégation en un clic"],
                ].map(([t]) => (
                  <div key={t} className="flex items-start gap-3 text-sm text-white/75">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: P }} />
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Flow diagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: .6, ease, delay: .2 }}
            className="mt-8 rounded-2xl border border-white/[0.07] p-6 relative overflow-hidden"
            style={{ background: "rgba(255,255,255,.015)" }}
          >
            <p className="text-[.7rem] font-bold uppercase tracking-widest text-white/35 text-center mb-6">
              Architecture centralisée
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {[
                { icon: Users,          c: PR,           l: "Utilisateurs" },
                { icon: LayoutDashboard,c: PR,           l: "Dashboard" },
                { icon: Database,       c: BR,           l: "Base de données" },
                { icon: Workflow,       c: "249,168,38", l: "Automatisations" },
                { icon: Bell,           c: "74,222,128", l: "Notifications" },
                { icon: Link2,          c: GR,           l: "API tierces" },
              ].map((node, i, arr) => (
                <div key={node.l} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl border flex items-center justify-center"
                      style={{ borderColor: `rgba(${node.c},.3)`, background: `rgba(${node.c},.08)` }}>
                      <node.icon size={16} style={{ color: `rgba(${node.c},.9)` }} />
                    </div>
                    <p className="text-[.55rem] font-semibold text-white/40">{node.l}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden sm:flex items-center gap-0.5 mb-4">
                      <div className="w-4 h-px bg-white/15" />
                      <div className="w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ 6. PROCESSUS — 8 ÉTAPES ══════════════ */}
      <section id="processus" className="py-16 sm:py-24 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 w-[350px] h-[350px] rounded-full blur-[100px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${BR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <GitBranch size={12} style={{ color: P }} /> Notre méthode
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              De la vision à la <span style={{ color: P }}>mise en production</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              8 étapes structurées, sprints agiles, points de validation à chaque phase — zéro surprise.
            </motion.p>
          </motion.div>

          {/* Desktop: 4 + 4 rows */}
          <div className="hidden lg:block space-y-8">
            {[PROCESSUS.slice(0, 4), PROCESSUS.slice(4)].map((row, rowIdx) => (
              <div key={rowIdx} className="relative">
                <motion.div
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease, delay: rowIdx === 0 ? .35 : .75 }}
                  className="absolute top-9 left-[11%] right-[11%] h-px origin-left"
                  style={{ background: rowIdx === 0
                    ? `linear-gradient(90deg,${P},${B})`
                    : `linear-gradient(90deg,${B},${P})` }}
                />
                <div className="grid grid-cols-4 gap-4">
                  {row.map((e, i) => (
                    <motion.div key={e.t}
                      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ delay: (rowIdx === 0 ? .15 : .55) + i * .1, duration: .5, ease }}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="relative w-[70px] h-[70px] rounded-2xl border-2 flex items-center justify-center mb-4 z-10"
                        style={{ borderColor: `rgba(${e.r},.4)`, background: `rgba(${e.r},.08)` }}>
                        <e.icon size={21} style={{ color: e.c }} />
                        <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-[.58rem] font-extrabold flex items-center justify-center text-[#07070a]"
                          style={{ background: e.c }}>{rowIdx * 4 + i + 1}</span>
                      </div>
                      <p className="font-bold text-white text-sm mb-1">{e.t}</p>
                      <p className="text-xs text-white/45 leading-relaxed mb-2 max-w-[140px]">{e.d}</p>
                      <span className="text-[.6rem] font-bold px-2.5 py-1 rounded-full border border-white/[0.08]"
                        style={{ color: e.c }}>{e.dur}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="lg:hidden space-y-3 relative">
            <div className="absolute left-[22px] top-6 bottom-6 w-px"
              style={{ background: `linear-gradient(180deg,transparent,rgba(${PR},.35),rgba(${BR},.35),transparent)` }} />
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
                    <span className="text-[.6rem] font-bold" style={{ color: e.c }}>{e.dur}</span>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed">{e.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 7. SUR MESURE ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [.03, .07, .03] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[140px]"
            style={{ background: `radial-gradient(ellipse,rgba(${PR},.8) 0%,rgba(${BR},.6) 50%,transparent 70%)` }}
          />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-10">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Sparkles size={12} style={{ color: G }} /> Notre engagement
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Un produit <span style={{ color: P }}>100% sur mesure</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Aucun template, aucune limitation no-code. Chaque fonctionnalité est pensée pour votre activité et vos contraintes réelles.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: .6, ease }}
            className="relative rounded-3xl border overflow-hidden"
            style={{ borderColor: `rgba(${PR},.18)`, background: `rgba(${PR},.04)` }}
          >
            <div className="h-px w-full"
              style={{ background: `linear-gradient(90deg,transparent,rgba(${PR},.5),rgba(${BR},.4),transparent)` }} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
              {[
                { icon: Package,      c: P,  r: PR, t: "Projet unique",          d: "On part de vos vrais besoins métier — pas d'une liste de modules préfaits." },
                { icon: Settings,     c: B,  r: BR, t: "Fonctionnalités exactes",d: "Ni trop, ni pas assez. Chaque fonctionnalité a une raison d'être dans votre workflow." },
                { icon: Briefcase,    c: G,  r: GR, t: "Accompagnement stratégique",d: "On questionne vos processus, pas seulement vos wireframes." },
                { icon: RefreshCw,    c: P,  r: PR, t: "Évolutivité totale",     d: "Architecture pensée pour grandir. Nouvelles features sans réécriture." },
              ].map(item => (
                <div key={item.t} className="p-6 flex flex-col items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `rgba(${item.r},.12)` }}>
                    <item.icon size={18} style={{ color: item.c }} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-sm mb-1.5">{item.t}</p>
                    <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.06] px-7 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ background: "rgba(255,255,255,.01)" }}>
              <p className="text-sm text-white/45 max-w-md text-center sm:text-left">
                Démarrons par un <strong className="text-white/70">atelier de cadrage gratuit de 45 min</strong> pour définir ensemble votre périmètre et votre ROI.
              </p>
              <Link href="/contact?besoin=Plateforme+web+sur+mesure"
                className="shrink-0 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                style={{ background: `linear-gradient(135deg,${P2},${P})`, color: "#07070a" }}>
                Réserver le cadrage <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ 8. VALEUR BUSINESS ══════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <TrendingUp size={12} style={{ color: G }} /> Impact business
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Ce que ça change <span style={{ color: P }}>pour votre entreprise</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Une plateforme n&apos;est pas un coût — c&apos;est un levier de performance opérationnelle et de croissance.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALEUR_BUSINESS.map(item => (
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
                <p className="font-bold text-sm mb-1.5" style={{ color: item.c }}>{item.t}</p>
                <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ 9. TÉMOIGNAGES ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[500px] h-[200px] rounded-full blur-[80px] opacity-[0.05]"
            style={{ background: `radial-gradient(ellipse,rgba(${PR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Star size={12} style={{ color: "#f9a826" }} /> Clients qui nous font confiance
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Des plateformes <span style={{ color: P }}>qui font leurs preuves</span>
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

      {/* ══════════════ 10. FAQ ══════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-2xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <HelpCircle size={12} style={{ color: P }} /> Questions fréquentes
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Vos questions, <span style={{ color: P }}>nos réponses</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-2.5">
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={cardReveal}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: openFaq === i ? `rgba(${PR},.3)` : "rgba(255,255,255,.07)",
                  background:  openFaq === i ? `rgba(${PR},.05)` : "rgba(255,255,255,.03)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-white/88 leading-snug">{item.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: .22 }} className="shrink-0">
                    <ChevronDown size={14} style={{ color: openFaq === i ? P : "rgba(255,255,255,.38)" }} />
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

      {/* ══════════════ 11. CTA FINAL ══════════════ */}
      <section className="py-16 sm:py-28 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [.04, .1, .04] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full blur-[150px]"
            style={{ background: `radial-gradient(ellipse,rgba(${PR},1) 0%,rgba(${BR},.7) 45%,transparent 70%)` }}
          />
          <div className="absolute inset-0 opacity-[0.012]"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.9) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        </div>

        <div className="max-w-3xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport}
            className="relative rounded-3xl border p-8 sm:p-14 text-center overflow-hidden"
            style={{ borderColor: `rgba(${PR},.2)`, background: `rgba(${PR},.04)` }}
          >
            {/* Corners */}
            <div className="absolute top-0 left-0 w-28 h-28 rounded-br-3xl border-b border-r"
              style={{ borderColor: `rgba(${PR},.12)` }} />
            <div className="absolute bottom-0 right-0 w-28 h-28 rounded-tl-3xl border-t border-l"
              style={{ borderColor: `rgba(${PR},.12)` }} />
            {/* Orbs */}
            <div className="pointer-events-none absolute -top-12 right-8 w-44 h-44 rounded-full blur-3xl opacity-[0.14]"
              style={{ background: `rgba(${PR},1)` }} />
            <div className="pointer-events-none absolute -bottom-12 left-8 w-36 h-36 rounded-full blur-3xl opacity-[0.1]"
              style={{ background: `rgba(${BR},1)` }} />

            <motion.div variants={fadeIn}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-7">
              <Server size={12} style={{ color: P }} /> Votre plateforme vous attend
            </motion.div>

            <motion.h2 variants={fadeIn}
              className="relative text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold mb-5 leading-tight">
              Un projet sérieux mérite<br />
              <span style={{
                background: `linear-gradient(135deg,${P},${B})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                une équipe à sa hauteur.
              </span>
            </motion.h2>

            <motion.p variants={fadeIn}
              className="relative text-white/45 text-base max-w-md mx-auto mb-9">
              Atelier de cadrage gratuit de 45 min — on analyse vos besoins, on esquisse l&apos;architecture et on vous soumet un devis précis. Sans engagement.
            </motion.p>

            <motion.div variants={fadeIn} className="relative flex flex-col sm:flex-row justify-center gap-3 mb-9">
              <Link href="/contact?besoin=Plateforme+web+sur+mesure"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold transition-all duration-200 hover:scale-[1.02] shadow-[0_0_40px_rgba(167,139,250,0.2)] hover:shadow-[0_0_60px_rgba(167,139,250,0.38)]"
                style={{ background: `linear-gradient(135deg,${P2},${P})`, color: "#07070a" }}>
                Discuter de ma plateforme <ArrowRight size={15} />
              </Link>
              <Link href="/realisations"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                Voir nos réalisations
              </Link>
            </motion.div>

            <motion.div variants={fadeIn}
              className="relative flex flex-wrap justify-center gap-5 sm:gap-7">
              {[
                [Clock,     "Cadrage gratuit 45 min"],
                [Shield,    "Sans engagement"],
                [BadgeCheck,"Devis sous 48h"],
                [Star,      "Architecture pensée pour durer"],
              ].map(([Icon, l]) => (
                <div key={l as string} className="flex items-center gap-1.5 text-xs text-white/35">
                  <Icon size={11} style={{ color: P }} />
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
