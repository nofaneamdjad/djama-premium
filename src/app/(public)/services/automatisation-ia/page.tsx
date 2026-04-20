"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  ArrowLeft, Users, Settings, Shield, Star, LayoutDashboard,
  Code2, Briefcase, TrendingUp, Zap, HelpCircle, BadgeCheck,
  Rocket, BarChart3, Activity, FileText, Bell, Clock,
  ChevronRight, Workflow, Link2, Database, Mail, MessageSquare,
  BrainCircuit, AlertCircle, RefreshCw, Search, Filter,
  Globe, Layers, CheckSquare, GitMerge,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Palette teal / violet — IA futuriste ── */
const T  = "#2dd4bf";   // teal-400
const TR = "45,212,191";
const T2 = "#0d9488";   // teal-600
const V  = "#c084fc";   // purple-400
const VR = "192,132,252";
const G  = "#c9a55a";   // gold DJAMA
const GR = "201,165,90";

/* ═══════════════════════════════ DATA ═══════════════════════════════ */

const CAS_USAGE = [
  { icon: Mail,          c: T,        r: TR,           t: "Automatisation emails",        d: "Séquences de relance, confirmations, onboarding, suivi — chaque email envoyé au bon moment, sans intervention.",   tags: ["Relances", "Onboarding", "Segmentation"] },
  { icon: BrainCircuit,  c: V,        r: VR,           t: "Génération de contenus IA",    d: "Fiches produits, articles, posts LinkedIn, descriptions — l'IA génère, vous validez. 10× plus vite.",              tags: ["GPT-4", "Bulk", "SEO"] },
  { icon: Users,         c: "#f9a826",r: "249,168,38", t: "Qualification de prospects",   d: "Scraping, enrichissement, scoring automatique des leads. Votre CRM rempli de leads chauds sans effort.",           tags: ["Scoring", "CRM", "Enrichissement"] },
  { icon: MessageSquare, c: "#4ade80",r: "74,222,128", t: "Réponses automatiques",        d: "Chatbot IA formé sur votre FAQ, vos offres et votre ton. Répond 24h/24, escalade aux humains si besoin.",           tags: ["Support", "FAQ", "Chatbot"] },
  { icon: Database,      c: "#f472b6",r: "244,114,182",t: "Traitement de données",        d: "Collecte, nettoyage, transformation et synchronisation automatique de vos données entre outils.",                  tags: ["ETL", "Sync", "Nettoyage"] },
  { icon: Workflow,      c: T,        r: TR,           t: "Workflows internes",           d: "Validation, approbation, routage de tâches — vos processus internes s'enchaînent sans friction.",                   tags: ["BPM", "Approbation", "Routing"] },
  { icon: BarChart3,     c: V,        r: VR,           t: "Reporting automatisé",         d: "Dashboards actualisés en temps réel, rapports envoyés chaque lundi, alertes sur anomalie.",                         tags: ["KPIs", "Alertes", "PDF"] },
  { icon: Bot,           c: "#fb923c",r: "251,146,60", t: "Support client intelligent",   d: "Agent IA qui lit les tickets, propose des réponses contextuelles, trie par priorité et assigne automatiquement.",   tags: ["Tickets", "IA agent", "Tri"] },
];

const FONCTIONNALITES = [
  { icon: BrainCircuit,  c: T,        r: TR,           t: "IA conversationnelle",         d: "Assistants formés sur votre base de connaissance, vos tonalités et vos offres." },
  { icon: Bot,           c: V,        r: VR,           t: "Agents IA autonomes",          d: "Agents qui prennent des décisions, exécutent des actions et apprennent de leur contexte." },
  { icon: Zap,           c: "#f9a826",r: "249,168,38", t: "Automatisation de tâches",     d: "Déclencheurs, conditions, actions — vos workflows tournent sans vous." },
  { icon: Link2,         c: "#4ade80",r: "74,222,128", t: "Intégrations API",             d: "Slack, Notion, Airtable, Google Workspace, Stripe, HubSpot et + de 500 outils." },
  { icon: Mail,          c: "#f472b6",r: "244,114,182",t: "CRM / Email / Formulaires",    d: "Synchronisation bidirectionnelle avec vos outils marketing et commerciaux." },
  { icon: FileText,      c: G,        r: GR,           t: "Génération de documents",      d: "Contrats, devis, rapports, fiches — générés et envoyés automatiquement." },
  { icon: LayoutDashboard,c: T,       r: TR,           t: "Dashboards intelligents",      d: "Tableaux de bord auto-actualisés avec vos KPIs, en temps réel." },
  { icon: Bell,          c: V,        r: VR,           t: "Alertes & notifications",      d: "Alertes Slack, email ou SMS sur événements critiques — seuils configurables." },
  { icon: Search,        c: "#fb923c",r: "251,146,60", t: "Scraping & analyse web",       d: "Collecte automatisée de données publiques, veille concurrentielle, enrichissement de leads." },
  { icon: Filter,        c: "#4ade80",r: "74,222,128", t: "Classification intelligente",  d: "IA qui trie, catégorise et priorise vos données, tickets, emails selon vos règles." },
];

const PROCESSUS = [
  { icon: Search,        c: G,        r: GR,           t: "Audit des besoins",            d: "On cartographie vos processus, identifie les pertes de temps et les gains potentiels.",           dur: "J1–J3"   },
  { icon: CheckSquare,   c: T,        r: TR,           t: "Identification des tâches",    d: "On sélectionne les 20% de tâches qui représentent 80% du temps perdu.",                            dur: "J3–J5"   },
  { icon: GitMerge,      c: V,        r: VR,           t: "Conception du workflow",       d: "Diagramme des flux, logique conditionnelle, points d'entrée et de sortie.",                        dur: "J5–J8"   },
  { icon: Link2,         c: "#f9a826",r: "249,168,38", t: "Intégration outils & IA",      d: "Connexion de vos outils existants, configuration des modèles IA, authentifications.",              dur: "J8–J18"  },
  { icon: Activity,      c: "#4ade80",r: "74,222,128", t: "Tests & validation",           d: "Scénarios de tests réels, validation avec vos équipes, corrections avant déploiement.",            dur: "J18–J22" },
  { icon: Rocket,        c: "#f472b6",r: "244,114,182",t: "Déploiement",                  d: "Mise en production progressive, monitoring actif, documentation des workflows.",                   dur: "J23–J25" },
  { icon: RefreshCw,     c: T,        r: TR,           t: "Optimisation continue",        d: "Analyse des performances, ajustements des modèles IA, nouvelles automatisations.",                 dur: "Mensuel" },
];

const VALEUR_BUSINESS = [
  { icon: Clock,         c: T,        r: TR,           t: "−70% de temps opérationnel",   d: "Les tâches répétitives disparaissent. Vos équipes font ce que seuls des humains peuvent faire." },
  { icon: TrendingUp,    c: V,        r: VR,           t: "3× plus de productivité",       d: "Même équipe, même budget — 3× plus de volume traité grâce aux agents IA." },
  { icon: AlertCircle,   c: "#f9a826",r: "249,168,38", t: "Quasi-zéro erreur humaine",     d: "Les processus automatisés ne se trompent pas. Cohérence parfaite à chaque exécution." },
  { icon: Zap,           c: "#4ade80",r: "74,222,128", t: "Réactivité instantanée",        d: "Vos automatisations répondent en secondes, 24h/24, 7j/7. Aucun délai de traitement." },
  { icon: Users,         c: "#f472b6",r: "244,114,182",t: "Équipe libérée & motivée",      d: "Finis les tableaux Excel et les copier-coller. Vos équipes se concentrent sur l'essentiel." },
  { icon: Rocket,        c: G,        r: GR,           t: "Scalabilité sans recrutement",  d: "Traitez 10× plus de volume sans embaucher. L'IA scale là où une équipe humaine plafonne." },
];

const PROJETS = [
  { icon: Bot,           c: T,        r: TR,           t: "Assistant IA interne",         d: "Agent IA connecté à votre base de connaissances, Notion et Slack. Répond aux questions de vos équipes instantanément.",             result: "−5h/semaine par collaborateur" },
  { icon: Users,         c: V,        r: VR,           t: "Qualification auto de leads",   d: "Pipeline complet : scraping LinkedIn → enrichissement Apollo → scoring IA → envoi séquence Lemlist → mise à jour HubSpot.",       result: "×4 de leads qualifiés traités" },
  { icon: CheckSquare,   c: "#f9a826",r: "249,168,38", t: "Onboarding client automatisé",  d: "À chaque nouveau client signé : création de l'espace, envoi de la séquence email, briefing équipe, alerte comptable.",            result: "0 action manuelle post-signature" },
  { icon: BarChart3,     c: "#4ade80",r: "74,222,128", t: "Reporting intelligent",         d: "Agrégation de vos données Stripe + GA4 + CRM → rapport hebdomadaire PDF envoyé aux décideurs avec alertes sur anomalies.",        result: "Rapport prêt chaque lundi à 8h" },
  { icon: MessageSquare, c: "#f472b6",r: "244,114,182",t: "Service client IA",             d: "Chatbot formé sur votre FAQ + base produit. Gère 80% des tickets entrants, escalade les 20% complexes avec contexte.",             result: "−80% de tickets traités humainement" },
];

const FAQ = [
  { q: "Combien coûte une automatisation ?",                          a: "Cela dépend de la complexité des processus à automatiser et des intégrations nécessaires. Un workflow simple démarre à partir de 800 €. Un système complet avec agents IA et intégrations multiples peut aller de 3 000 € à 10 000 €. On définit le périmètre exact lors d'un atelier gratuit." },
  { q: "Combien de temps pour mettre en place une automatisation ?",  a: "Un workflow simple peut être opérationnel en 5 à 10 jours. Un système d'agents IA complet avec intégrations multiples prend 3 à 5 semaines. On travaille par sprints avec des livrables à chaque étape." },
  { q: "Quels outils pouvez-vous connecter ?",                        a: "Plus de 500 outils via notre stack d'intégration : HubSpot, Salesforce, Notion, Airtable, Slack, Google Workspace, Stripe, Shopify, Lemlist, Apollo, Make, n8n, Zapier — ou directement via API REST." },
  { q: "C'est adapté à une petite entreprise ?",                       a: "Absolument. Les TPE et PME sont souvent celles qui bénéficient le plus de l'automatisation : elles ont peu de ressources et des tâches très répétitives. On adapte le périmètre au budget et à la maturité digitale." },
  { q: "Qui maintient les automatisations après livraison ?",          a: "On propose des contrats de maintenance mensuelle : monitoring des workflows, mises à jour si un outil tiers change son API, ajout de nouvelles automatisations, support prioritaire. Vous restez aussi libres de gérer vous-même — tout est documenté." },
];

const TEMOIGNAGES = [
  { i: "L", c: TR,  n: "Laura V.",    r: "Directrice commerciale",   s: 5, t: "Notre qualification de leads était un enfer. Aujourd'hui tout est automatisé : scraping, scoring, séquence email. On traite 4× plus de prospects sans effort." },
  { i: "T", c: VR,  n: "Thomas R.",   r: "CEO, scale-up e-commerce", s: 5, t: "L'assistant IA interne fait gagner 5h par semaine à chaque membre de l'équipe. ROI atteint en 3 semaines. Un des meilleurs investissements qu'on ait faits." },
  { i: "A", c: GR,  n: "Amira S.",    r: "Fondatrice, agence RH",    s: 5, t: "L'onboarding client était notre goulot d'étranglement. Maintenant c'est 100% automatique dès la signature. Nos clients sont impressionnés par la réactivité." },
];

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default function AutomatisationIAPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-[#07070a] text-white overflow-x-hidden">

      {/* ══════════════ 1. HERO ══════════════ */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-28">

        {/* BG */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.016]"
            style={{ backgroundImage: `linear-gradient(rgba(${TR},.6) 1px,transparent 1px),linear-gradient(90deg,rgba(${TR},.6) 1px,transparent 1px)`, backgroundSize: "52px 52px" }} />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [.05, .13, .05] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-48 top-1/3 w-[700px] h-[700px] rounded-full blur-[150px]"
            style={{ background: `radial-gradient(circle,rgba(${TR},1) 0%,transparent 70%)` }} />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [.04, .09, .04] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: `radial-gradient(circle,rgba(${VR},1) 0%,transparent 70%)` }} />
          <div className="absolute right-1/4 bottom-0 w-[260px] h-[260px] rounded-full blur-[80px] opacity-[0.04]"
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
                style={{ borderColor: `rgba(${TR},.3)`, background: `rgba(${TR},.08)`, color: T }}
              >
                <BrainCircuit size={11} /> Automatisation & Intelligence Artificielle
                <span className="ml-1 rounded-full px-2 py-0.5 text-[.6rem] font-extrabold text-[#07070a]"
                  style={{ background: T }}>SUR DEVIS</span>
              </motion.div>

              <h1 className="mb-5 text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.07] tracking-tight">
                <MultiLineReveal
                  lines={["Automatisez votre", "business avec", "l'IA."]}
                  highlight={2}
                  stagger={.13}
                  wordStagger={.055}
                  delay={.08}
                  lineClassName="justify-start"
                />
              </h1>

              <FadeReveal delay={.28}>
                <p className="mb-7 max-w-lg text-base sm:text-lg leading-relaxed text-white/50">
                  Emails, leads, données, support, reporting — on automatise les tâches répétitives qui consomment votre énergie et bloque votre croissance. Vos processus tournent seuls, vous pilotez les résultats.
                </p>
              </FadeReveal>

              <FadeReveal delay={.36}>
                <div className="mb-7 inline-flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5"
                  style={{ borderColor: `rgba(${TR},.22)`, background: `rgba(${TR},.06)` }}>
                  <div>
                    <p className="text-[.65rem] font-bold uppercase tracking-widest text-white/35 mb-0.5">Investissement</p>
                    <p className="text-[1.6rem] font-extrabold leading-none" style={{ color: T }}>Sur devis</p>
                    <p className="text-[.62rem] text-white/35 mt-0.5">Après audit gratuit de vos processus</p>
                  </div>
                  <div className="h-12 w-px bg-white/[0.08]" />
                  <div className="space-y-1">
                    {["Audit gratuit & sans engagement", "Premiers résultats en 2 semaines", "ROI mesurable dès le 1er mois"].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-xs text-white/55">
                        <CheckCircle2 size={11} className="shrink-0" style={{ color: T }} /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeReveal>

              <FadeReveal delay={.44}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact?besoin=Automatisation+IA"
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(45,212,191,0.32)]"
                    style={{ background: `linear-gradient(135deg,${T2},${T})`, color: "#07070a" }}>
                    Parler de mon automatisation <ArrowRight size={15} />
                  </Link>
                  <a href="#processus"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                    Voir la méthode
                  </a>
                </div>
              </FadeReveal>
            </div>

            {/* Right: AI console mockup */}
            <motion.div
              initial={{ opacity: 0, y: 36, scale: .93 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .85, ease, delay: .3 }}
              className="relative flex justify-center"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0 flex justify-center items-center">
                <div className="w-[380px] h-[320px] rounded-full blur-3xl opacity-[0.18]"
                  style={{ background: `radial-gradient(ellipse,rgba(${TR},.7) 0%,rgba(${VR},.4) 55%,transparent 75%)` }} />
              </div>

              {/* Console card */}
              <div className="relative w-full max-w-[480px] rounded-2xl border-[1.5px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,.8)]"
                style={{ borderColor: `rgba(${TR},.2)`, background: "#0b0b10" }}>

                {/* Console header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]"
                  style={{ background: "#0e0e14" }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[.6rem] font-mono font-bold text-white/35">DJAMA AI Engine</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T }} />
                    <span className="text-[.55rem] font-bold" style={{ color: T }}>LIVE</span>
                  </div>
                </div>

                {/* Pipeline tabs */}
                <div className="flex border-b border-white/[0.05] overflow-x-auto"
                  style={{ background: "#0d0d12" }}>
                  {[
                    { label: "Lead Pipeline", active: true,  c: TR },
                    { label: "Email auto",    active: false, c: VR },
                    { label: "Support IA",    active: false, c: GR },
                  ].map(tab => (
                    <div key={tab.label}
                      className="px-4 py-2.5 text-[.58rem] font-bold whitespace-nowrap border-b-[1.5px] transition-all"
                      style={{
                        borderColor:  tab.active ? `rgba(${tab.c},1)` : "transparent",
                        color:        tab.active ? `rgba(${tab.c},.9)` : "rgba(255,255,255,.3)",
                        background:   tab.active ? `rgba(${tab.c},.05)` : "transparent",
                      }}>
                      {tab.label}
                    </div>
                  ))}
                </div>

                {/* Live log feed */}
                <div className="p-4 space-y-2 font-mono" style={{ background: "#0b0b10" }}>
                  {[
                    { icon: CheckCircle2, c: TR,           text: "Email reçu → parsing NLP",        sub: "lead@entreprise.fr",    ok: true,  delay: .6  },
                    { icon: BrainCircuit, c: VR,           text: "Analyse IA — scoring en cours",   sub: "modèle v2.4",           ok: null,  delay: .85 },
                    { icon: Activity,     c: TR,           text: "Score calculé : 87/100",          sub: "🔥 Hot lead",           ok: true,  delay: 1.1 },
                    { icon: CheckCircle2, c: "74,222,128", text: "Tag ajouté : \"Hot Lead\"",        sub: "HubSpot sync",          ok: true,  delay: 1.35},
                    { icon: Zap,          c: VR,           text: "Séquence email déclenchée",       sub: "J0 → J3 → J7 → J14",   ok: true,  delay: 1.6 },
                    { icon: Bell,         c: GR,           text: "Slack notif → @commercial",       sub: "#leads-chauds",         ok: true,  delay: 1.85},
                  ].map((log, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: log.delay, duration: .3, ease }}
                      className="flex items-center gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: `rgba(${log.c},.12)` }}>
                        <log.icon size={10} style={{ color: `rgba(${log.c},.9)` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[.6rem] text-white/75">{log.text}</span>
                        <span className="ml-2 text-[.55rem] text-white/30">{log.sub}</span>
                      </div>
                      {log.ok !== null && (
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ delay: log.delay + .2 }}
                          className="text-[.5rem] font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: `rgba(${log.c},.12)`, color: `rgba(${log.c},.85)` }}>
                          ✓ ok
                        </motion.span>
                      )}
                    </motion.div>
                  ))}

                  {/* Animated typing cursor */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `rgba(${TR},.08)` }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T }} />
                    </div>
                    <span className="text-[.6rem] text-white/25 font-mono">
                      Traitement pipeline suivant
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                        _
                      </motion.span>
                    </span>
                  </div>
                </div>

                {/* Stats footer */}
                <div className="border-t border-white/[0.05] px-4 py-3 flex items-center justify-between"
                  style={{ background: "#0e0e14" }}>
                  {[
                    ["247", "leads traités",   TR],
                    ["23",  "convertis",        VR],
                    ["9.3%","taux conversion",  GR],
                  ].map(([v, l, c]) => (
                    <div key={l} className="text-center">
                      <p className="text-sm font-extrabold" style={{ color: `rgba(${c},.9)` }}>{v}</p>
                      <p className="text-[.5rem] text-white/30 font-mono">{l}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: "87%" }}
                        transition={{ delay: 2, duration: 1.2, ease }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg,${T2},${T})` }}
                      />
                    </div>
                    <span className="text-[.52rem] font-bold" style={{ color: T }}>87%</span>
                  </div>
                </div>
              </div>

              {/* Floating chips */}
              <motion.div
                initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute top-4 -right-2 sm:right-0 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                style={{ background: "#14141c" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: `rgba(${TR},.15)` }}>
                    <Zap size={9} style={{ color: T }} />
                  </div>
                  <div>
                    <p className="text-[.58rem] font-bold text-white">500+ outils connectés</p>
                    <p className="text-[.5rem] text-white/35">Slack, Notion, HubSpot…</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
                className="absolute bottom-20 -left-2 sm:-left-4 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                style={{ background: "#14141c" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: `rgba(${VR},.15)` }}>
                    <BrainCircuit size={9} style={{ color: V }} />
                  </div>
                  <div>
                    <p className="text-[.58rem] font-bold text-white">GPT-4 + agents IA</p>
                    <p className="text-[.5rem] text-white/35">Modèles entraînés</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 right-4 sm:right-8 rounded-xl border px-3.5 py-2 hidden sm:flex items-center gap-2"
                style={{ borderColor: `rgba(${TR},.28)`, background: `rgba(${TR},.08)` }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T }} />
                <p className="text-[.58rem] font-semibold" style={{ color: T }}>ROI dès le 1er mois</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ STATS BAR ══════════════ */}
      <div className="border-y border-white/[0.05] py-5 px-5"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            ["−70%",  "Temps opérationnel",             TR],
            ["3×",    "Productivité équipe",             VR],
            ["24/7",  "Automatisations actives",         "249,168,38"],
            ["<2 sem","Premiers résultats",              GR],
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
                <BrainCircuit size={12} style={{ color: T }} /> L&apos;automatisation par l&apos;IA
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-5 leading-tight">
                Vos processus tournent.<br />
                <span style={{ color: T }}>Vous récupérez votre temps.</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 leading-relaxed mb-5">
                L&apos;automatisation par l&apos;IA, c&apos;est connecter vos outils, définir des règles métier intelligentes, et laisser des agents IA exécuter à votre place — <strong className="text-white/75">sans erreur, sans délai, sans relâche</strong>.
              </motion.p>
              <motion.p variants={fadeIn} className="text-white/50 leading-relaxed mb-7">
                Pas besoin de tout refondre. On commence par les 3 tâches qui vous coûtent le plus de temps, on les automatise en 2 semaines, et vous mesurez le gain immédiatement.
              </motion.p>
              <motion.div variants={fadeIn}>
                <Link href="/contact?besoin=Automatisation+IA"
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: `linear-gradient(135deg,${T2},${T})`, color: "#07070a" }}>
                  Identifier mes gains <ArrowRight size={14} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: why without automation you lose */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .6, ease }}
              className="relative rounded-3xl border overflow-hidden"
              style={{ borderColor: `rgba(${TR},.15)`, background: `rgba(${TR},.04)` }}
            >
              <div className="h-px w-full"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${TR},.5),rgba(${VR},.4),transparent)` }} />
              <div className="p-7">
                <p className="text-xs font-bold uppercase tracking-widest mb-5"
                  style={{ color: T }}>Sans automatisation, vous perdez</p>
                <div className="space-y-4">
                  {[
                    { icon: Clock,      c: "#ef4444", r: "239,68,68",   t: "Des heures chaque jour",        d: "Copier-coller, saisie manuelle, relances oubliées, emails répétitifs — estimé à 2h+ par jour pour la plupart des équipes." },
                    { icon: AlertCircle,c: "#f97316", r: "249,115,22",  t: "En erreurs et incohérences",    d: "Un humain se trompe. L'IA non. Chaque saisie manuelle est un risque d'erreur, de doublon, de donnée manquante." },
                    { icon: TrendingUp, c: "#eab308", r: "234,179,8",   t: "En compétitivité",              d: "Vos concurrents automatisent déjà. Pendant que vous saisissez, eux prospectent, répondent et livrent." },
                    { icon: Users,      c: "#6366f1", r: "99,102,241",  t: "En engagement équipe",          d: "Les tâches répétitives démotivent. Automatiser libère vos équipes pour le travail à valeur ajoutée." },
                  ].map(item => (
                    <div key={item.t} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `rgba(${item.r},.12)` }}>
                        <item.icon size={16} style={{ color: `rgba(${item.r},.9)` }} />
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
          <div className="absolute right-0 top-1/4 w-[400px] h-[400px] rounded-full blur-[110px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${VR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Zap size={12} style={{ color: T }} /> Ce qu&apos;on automatise
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              8 automatisations qui <span style={{ color: T }}>changent tout</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              De la prospection au support client — chaque processus peut être automatisé avec l&apos;IA.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CAS_USAGE.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .22 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 0% 110%,rgba(${item.r},.1) 0%,transparent 60%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={18} style={{ color: item.c }} />
                </div>
                <p className="font-bold text-white text-sm mb-1.5">{item.t}</p>
                <p className="text-xs text-white/45 leading-relaxed mb-3">{item.d}</p>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span key={tag}
                      className="text-[.58rem] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `rgba(${item.r},.1)`, color: `rgba(${item.r},.85)` }}>
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
              <Settings size={12} style={{ color: T }} /> Fonctionnalités
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              L&apos;arsenal complet <span style={{ color: T }}>de l&apos;automatisation IA</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* ══════════════ 5. AVANT / APRÈS ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[110px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${TR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Zap size={12} style={{ color: T }} /> Avant / Après
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              La transformation <span style={{ color: T }}>est immédiate</span>
            </motion.h2>
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
                <p className="font-extrabold text-white">Sans automatisation</p>
                <span className="ml-auto text-[.6rem] font-bold px-2 py-0.5 rounded-full text-red-400"
                  style={{ background: "rgba(239,68,68,.1)" }}>Aujourd&apos;hui</span>
              </div>
              <div className="space-y-4">
                {[
                  { l: "Email reçu",        a: "→ lu manuellement",      t: "2 min par email × 50/jour = 1h40" },
                  { l: "Lead entrant",      a: "→ saisie CRM à la main", t: "5 min par lead × 30/jour = 2h30" },
                  { l: "Relance oubliée",   a: "→ prospect perdu",        t: "−15% de conversions estimées" },
                  { l: "Rapport mensuel",   a: "→ 4h de compilation",     t: "Données souvent obsolètes" },
                  { l: "Question client",   a: "→ réponse le lendemain",  t: "Satisfaction en chute libre" },
                ].map(item => (
                  <div key={item.l} className="flex items-start gap-3 rounded-xl border border-red-500/10 p-3"
                    style={{ background: "rgba(239,68,68,.03)" }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white/70">{item.l}</span>
                        <span className="text-xs text-white/40">{item.a}</span>
                      </div>
                      <p className="text-[.65rem] text-red-400/70 font-medium">{item.t}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* APRÈS */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .55, ease, delay: .1 }}
              className="rounded-3xl border p-7 relative overflow-hidden"
              style={{ borderColor: `rgba(${TR},.2)`, background: `rgba(${TR},.04)` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${TR},.5),rgba(${VR},.4),transparent)` }} />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `rgba(${TR},.12)` }}>
                  <CheckCircle2 size={16} style={{ color: T }} />
                </div>
                <p className="font-extrabold text-white">Avec DJAMA Automate</p>
                <span className="ml-auto text-[.6rem] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `rgba(${TR},.1)`, color: T }}>Après déploiement</span>
              </div>
              <div className="space-y-4">
                {[
                  { l: "Email reçu",       a: "→ parsé & catégorisé IA",  t: "<3 sec — aucune intervention" },
                  { l: "Lead entrant",     a: "→ scoré & CRM mis à jour",  t: "0 saisie — sync instantanée" },
                  { l: "Relance J+3",      a: "→ envoyée automatiquement", t: "+18% de taux de conversion" },
                  { l: "Rapport mensuel",  a: "→ généré chaque lundi 8h",  t: "Données fraîches, PDF en boîte" },
                  { l: "Question client",  a: "→ réponse IA en <30 sec",   t: "Satisfaction +40 points NPS" },
                ].map(item => (
                  <div key={item.l} className="flex items-start gap-3 rounded-xl border p-3"
                    style={{ borderColor: `rgba(${TR},.1)`, background: `rgba(${TR},.04)` }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white/75">{item.l}</span>
                        <span className="text-xs text-white/45">{item.a}</span>
                      </div>
                      <p className="text-[.65rem] font-bold" style={{ color: T }}>{item.t}</p>
                    </div>
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: T }} />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Flow diagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: .6, ease, delay: .2 }}
            className="mt-8 rounded-2xl border border-white/[0.07] p-6 overflow-hidden"
            style={{ background: "rgba(255,255,255,.015)" }}
          >
            <p className="text-[.68rem] font-bold uppercase tracking-widest text-white/30 text-center mb-6">
              Flux automatisé — exemple pipeline lead
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-0">
              {[
                { icon: Mail,          c: TR,           l: "Email reçu",       sub: "Déclencheur" },
                { icon: BrainCircuit,  c: VR,           l: "Analyse IA",       sub: "NLP + scoring" },
                { icon: Filter,        c: "249,168,38", l: "Qualification",    sub: "Score > 70 ?" },
                { icon: Zap,           c: TR,           l: "Action auto",      sub: "CRM + séquence" },
                { icon: Bell,          c: VR,           l: "Notification",     sub: "Slack + email" },
                { icon: BarChart3,     c: GR,           l: "Reporting",        sub: "KPIs mis à jour" },
              ].map((node, i, arr) => (
                <div key={node.l} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5 px-2">
                    <div className="w-11 h-11 rounded-2xl border flex items-center justify-center"
                      style={{ borderColor: `rgba(${node.c},.3)`, background: `rgba(${node.c},.08)` }}>
                      <node.icon size={17} style={{ color: `rgba(${node.c},.9)` }} />
                    </div>
                    <p className="text-[.56rem] font-bold text-white/60 text-center">{node.l}</p>
                    <p className="text-[.5rem] text-white/30 text-center">{node.sub}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden sm:flex items-center gap-0.5 mb-5">
                      <motion.div
                        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }} transition={{ delay: .4 + i * .12, duration: .35 }}
                        className="w-6 h-px origin-left"
                        style={{ background: `linear-gradient(90deg,rgba(${node.c},.5),rgba(${arr[i+1].c},.5))` }}
                      />
                      <div className="w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px]"
                        style={{ borderLeftColor: `rgba(${arr[i+1].c},.4)` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ 6. PROCESSUS — 7 ÉTAPES ══════════════ */}
      <section id="processus" className="py-16 sm:py-24 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 w-[350px] h-[350px] rounded-full blur-[100px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${TR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <GitMerge size={12} style={{ color: T }} /> Notre méthode
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              De l&apos;audit au <span style={{ color: T }}>pilotage automatique</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              7 étapes pour transformer vos processus en flux intelligents — les premiers gains en 2 semaines.
            </motion.p>
          </motion.div>

          {/* Desktop: 4 + 3 */}
          <div className="hidden lg:block space-y-8">
            {[PROCESSUS.slice(0, 4), PROCESSUS.slice(4)].map((row, rowIdx) => (
              <div key={rowIdx} className={`relative ${rowIdx === 1 ? "px-[12.5%]" : ""}`}>
                <motion.div
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.3, ease, delay: rowIdx === 0 ? .35 : .75 }}
                  className="absolute top-9 origin-left h-px"
                  style={{
                    left:       rowIdx === 0 ? "11%" : "16%",
                    right:      rowIdx === 0 ? "11%" : "16%",
                    background: rowIdx === 0
                      ? `linear-gradient(90deg,${T},${V})`
                      : `linear-gradient(90deg,${V},${T})`,
                  }}
                />
                <div className={`grid gap-4 ${rowIdx === 0 ? "grid-cols-4" : "grid-cols-3"}`}>
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

          {/* Mobile */}
          <div className="lg:hidden space-y-3 relative">
            <div className="absolute left-[22px] top-6 bottom-6 w-px"
              style={{ background: `linear-gradient(180deg,transparent,rgba(${TR},.35),rgba(${VR},.35),transparent)` }} />
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

      {/* ══════════════ 7. VALEUR BUSINESS ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <TrendingUp size={12} style={{ color: G }} /> Impact business
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Ce que l&apos;IA <span style={{ color: T }}>fait pour vos résultats</span>
            </motion.h2>
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

      {/* ══════════════ 8. EXEMPLES DE PROJETS ══════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[200px] rounded-full blur-[100px] opacity-[0.05]"
            style={{ background: `radial-gradient(ellipse,rgba(${TR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Briefcase size={12} style={{ color: T }} /> Exemples concrets
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              5 projets qu&apos;on peut <span style={{ color: T }}>livrer pour vous</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-3">
            {PROJETS.map((item, i) => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ x: 4, transition: { duration: .18 } }}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 0% 50%,rgba(${item.r},.07) 0%,transparent 55%)` }} />
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[.6rem] font-extrabold text-white/20 w-5 text-center">{String(i+1).padStart(2,'0')}</span>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `rgba(${item.r},.12)` }}>
                    <item.icon size={20} style={{ color: item.c }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm mb-1">{item.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2 rounded-xl border px-3 py-1.5"
                  style={{ borderColor: `rgba(${item.r},.2)`, background: `rgba(${item.r},.06)` }}>
                  <Zap size={10} style={{ color: item.c }} />
                  <span className="text-[.62rem] font-bold whitespace-nowrap" style={{ color: item.c }}>{item.result}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ 9. TÉMOIGNAGES ══════════════ */}
      <section className="py-16 sm:py-20 px-5"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Star size={12} style={{ color: "#f9a826" }} /> Ils ont automatisé avec nous
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Des résultats <span style={{ color: T }}>dès les premières semaines</span>
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
              <HelpCircle size={12} style={{ color: T }} /> Questions fréquentes
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Vos questions, <span style={{ color: T }}>nos réponses</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-2.5">
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={cardReveal}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: openFaq === i ? `rgba(${TR},.3)` : "rgba(255,255,255,.07)",
                  background:  openFaq === i ? `rgba(${TR},.05)` : "rgba(255,255,255,.03)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-white/88 leading-snug">{item.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: .22 }} className="shrink-0">
                    <ChevronDown size={14} style={{ color: openFaq === i ? T : "rgba(255,255,255,.38)" }} />
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
            animate={{ scale: [1, 1.12, 1], opacity: [.04, .1, .04] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full blur-[150px]"
            style={{ background: `radial-gradient(ellipse,rgba(${TR},1) 0%,rgba(${VR},.7) 45%,transparent 70%)` }}
          />
          <div className="absolute inset-0 opacity-[0.012]"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.9) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        </div>

        <div className="max-w-3xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport}
            className="relative rounded-3xl border p-8 sm:p-14 text-center overflow-hidden"
            style={{ borderColor: `rgba(${TR},.2)`, background: `rgba(${TR},.04)` }}
          >
            <div className="absolute top-0 left-0 w-28 h-28 rounded-br-3xl border-b border-r"
              style={{ borderColor: `rgba(${TR},.12)` }} />
            <div className="absolute bottom-0 right-0 w-28 h-28 rounded-tl-3xl border-t border-l"
              style={{ borderColor: `rgba(${TR},.12)` }} />
            <div className="pointer-events-none absolute -top-12 right-8 w-44 h-44 rounded-full blur-3xl opacity-[0.14]"
              style={{ background: `rgba(${TR},1)` }} />
            <div className="pointer-events-none absolute -bottom-12 left-8 w-36 h-36 rounded-full blur-3xl opacity-[0.1]"
              style={{ background: `rgba(${VR},1)` }} />

            <motion.div variants={fadeIn}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-7">
              <BrainCircuit size={12} style={{ color: T }} /> L&apos;IA travaille pendant que vous dormez
            </motion.div>

            <motion.h2 variants={fadeIn}
              className="relative text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold mb-5 leading-tight">
              Arrêtez de faire<br />
              <span style={{
                background: `linear-gradient(135deg,${T},${V})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                ce que l&apos;IA peut faire.
              </span>
            </motion.h2>

            <motion.p variants={fadeIn}
              className="relative text-white/45 text-base max-w-md mx-auto mb-9">
              Audit gratuit de vos processus — on identifie ensemble les 3 tâches à automatiser en priorité et on vous montre ce que ça représente en heures gagnées par semaine.
            </motion.p>

            <motion.div variants={fadeIn} className="relative flex flex-col sm:flex-row justify-center gap-3 mb-9">
              <Link href="/contact?besoin=Automatisation+IA"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold transition-all duration-200 hover:scale-[1.02] shadow-[0_0_40px_rgba(45,212,191,0.2)] hover:shadow-[0_0_60px_rgba(45,212,191,0.38)]"
                style={{ background: `linear-gradient(135deg,${T2},${T})`, color: "#07070a" }}>
                Parler de mon automatisation <ArrowRight size={15} />
              </Link>
              <Link href="/realisations"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                Voir nos réalisations
              </Link>
            </motion.div>

            <motion.div variants={fadeIn}
              className="relative flex flex-wrap justify-center gap-5 sm:gap-7">
              {[
                [Clock,      "Audit gratuit & rapide"],
                [Shield,     "Sans engagement"],
                [BadgeCheck, "Résultats en 2 semaines"],
                [Star,       "ROI mesurable dès J30"],
              ].map(([Icon, l]) => (
                <div key={l as string} className="flex items-center gap-1.5 text-xs text-white/35">
                  <Icon size={11} style={{ color: T }} />
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
