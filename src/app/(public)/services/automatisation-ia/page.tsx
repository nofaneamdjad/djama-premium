"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Zap, User, Mail, Phone, MessageSquare, Loader2, Send,
  BrainCircuit, Clock, BarChart3, FileText, Users, Settings,
  Lightbulb, TrendingUp, Shield, Briefcase, Database,
  Code2, Globe, Layers, Link2, ShoppingCart, Star, Quote,
  Cpu, Workflow, Package, Monitor, Server, GitMerge,
  CheckSquare, Building2, Repeat, PlugZap, Megaphone,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#818cf8";
const ACCENT_RGB = "129,140,248";

/* ─── DATA ──────────────────────────────────────────────────────────── */

const AUTOMATISATIONS = [
  { icon: Repeat,      color: "#60a5fa", rgb: "96,165,250",   title: "Automatisation de tâches",   desc: "Éliminez les tâches répétitives et chronophages. Vos processus tournent seuls, 24h/24, sans erreur." },
  { icon: Users,       color: ACCENT,    rgb: ACCENT_RGB,     title: "Intégration CRM",             desc: "Synchronisez vos données clients entre tous vos outils. Plus de saisie manuelle, zéro doublon." },
  { icon: BrainCircuit,color: "#4ade80", rgb: "74,222,128",   title: "Chatbots IA",                 desc: "Répondez à vos clients instantanément avec des agents IA formés sur votre activité." },
  { icon: Database,    color: "#f9a826", rgb: "249,168,38",   title: "Traitement de données",       desc: "Collectez, transformez et centralisez vos données automatiquement pour prendre de meilleures décisions." },
  { icon: Megaphone,   color: "#f472b6", rgb: "244,114,182",  title: "Automatisation marketing",    desc: "Campagnes email, relances, segmentation — votre marketing tourne en pilote automatique." },
  { icon: PlugZap,     color: "#a78bfa", rgb: "167,139,250",  title: "Synchronisation d'outils",    desc: "Connectez Notion, Slack, Google Sheets, Airtable et vos logiciels métier en un seul flux cohérent." },
];

const PLATEFORMES = [
  {
    icon: Layers,
    color: "#60a5fa",
    rgb: "96,165,250",
    title: "Plateforme SaaS",
    desc: "Construisez votre produit SaaS de A à Z : authentification, abonnements, dashboard, API — prêt à commercialiser.",
    tags: ["Auth & rôles", "Paiement", "API REST", "Dashboard"],
    mockup: [
      { w: "70%", h: 8, color: "129,140,248", opacity: 0.7 },
      { w: "45%", h: 8, color: "129,140,248", opacity: 0.4 },
      { w: "90%", h: 120, color: "129,140,248", opacity: 0.07, isBlock: true },
    ],
  },
  {
    icon: Building2,
    color: ACCENT,
    rgb: ACCENT_RGB,
    title: "Application métier",
    desc: "Logiciel interne taillé pour vos équipes : gestion de projets, suivi clients, reporting — fini les fichiers Excel.",
    tags: ["Multi-utilisateurs", "Gestion", "Reporting", "Notifications"],
    mockup: [
      { w: "55%", h: 8, color: "74,222,128", opacity: 0.7 },
      { w: "80%", h: 8, color: "74,222,128", opacity: 0.4 },
      { w: "90%", h: 120, color: "74,222,128", opacity: 0.07, isBlock: true },
    ],
  },
  {
    icon: ShoppingCart,
    color: "#f472b6",
    rgb: "244,114,182",
    title: "Marketplace / B2B",
    desc: "Plateforme multi-vendeurs, place de marché ou réseau B2B — gérez offreurs, acheteurs et transactions en toute sécurité.",
    tags: ["Multi-vendeurs", "Paiements", "Catalogue", "Gestion des rôles"],
    mockup: [
      { w: "65%", h: 8, color: "244,114,182", opacity: 0.7 },
      { w: "40%", h: 8, color: "244,114,182", opacity: 0.4 },
      { w: "90%", h: 120, color: "244,114,182", opacity: 0.07, isBlock: true },
    ],
  },
];

const SCHEMA_STEPS = [
  { icon: User,        label: "Utilisateur",              color: "#60a5fa", rgb: "96,165,250" },
  { icon: Monitor,     label: "Plateforme web",           color: ACCENT,    rgb: ACCENT_RGB   },
  { icon: BrainCircuit,label: "Automatisation IA",        color: "#4ade80", rgb: "74,222,128" },
  { icon: BarChart3,   label: "Résultats / données",      color: "#f9a826", rgb: "249,168,38" },
];

const FONCTIONNALITES = [
  { label: "Développement sur mesure",   icon: Code2,         color: "129,140,248" },
  { label: "Dashboard administrateur",   icon: BarChart3,     color: "96,165,250"  },
  { label: "API / intégrations",         icon: Link2,         color: "74,222,128"  },
  { label: "Automatisations IA",         icon: BrainCircuit,  color: "249,168,38"  },
  { label: "Gestion utilisateurs",       icon: Users,         color: "244,114,182" },
  { label: "Maintenance & support",      icon: Shield,        color: "52,211,153"  },
];

const TECHNOLOGIES = [
  { icon: Code2,        color: "#60a5fa", rgb: "96,165,250",  label: "Next.js",             desc: "Framework React pour apps rapides et SEO-friendly." },
  { icon: Server,       color: ACCENT,    rgb: ACCENT_RGB,    label: "Node.js",              desc: "Backend performant et scalable pour vos APIs." },
  { icon: Link2,        color: "#4ade80", rgb: "74,222,128",  label: "API & webhooks",       desc: "Connectez vos services et déclenchez des actions en temps réel." },
  { icon: BrainCircuit, color: "#f9a826", rgb: "249,168,38",  label: "OpenAI / IA",         desc: "GPT-4, embeddings, vision — intégrés à vos outils métier." },
  { icon: Database,     color: "#f472b6", rgb: "244,114,182", label: "Bases de données",     desc: "PostgreSQL, MongoDB, Redis — architecture adaptée à votre scale." },
  { icon: Workflow,     color: "#a78bfa", rgb: "167,139,250", label: "Workflows automatisés",desc: "Make, n8n, Zapier ou solutions custom — au choix." },
];

const CAS_USAGE = [
  {
    icon: Users,
    color: "#60a5fa",
    rgb: "96,165,250",
    title: "Automatisation de prospection",
    desc: "Scraping, enrichissement de leads, envoi de séquences email personnalisées et suivi CRM — 100% automatisé.",
    resultat: "×5 de leads qualifiés sans effort supplémentaire",
    bars: [30, 55, 75, 90, 100],
  },
  {
    icon: Building2,
    color: ACCENT,
    rgb: ACCENT_RGB,
    title: "Plateforme de gestion interne",
    desc: "Application sur mesure pour gérer projets, équipes, clients et reporting — remplace 4 outils disparates.",
    resultat: "−8h/semaine gagnées par collaborateur",
    bars: [40, 60, 80, 95, 100],
  },
  {
    icon: Layers,
    color: "#4ade80",
    rgb: "74,222,128",
    title: "Outil SaaS pour clients",
    desc: "Produit SaaS commercialisé en abonnement : portail client, facturation automatique, support intégré.",
    resultat: "MRR lancé en 3 mois après développement",
    bars: [20, 45, 70, 88, 100],
  },
];

const TEMOIGNAGES = [
  { name: "Alexandre M.", activite: "Fondateur SaaS", note: 5, avis: "DJAMA a livré notre plateforme SaaS en 8 semaines. Qualité du code irréprochable, fonctionnalités exactement conformes au brief. On a pu onboarder nos premiers clients dès le premier mois." },
  { name: "Sarah K.",      activite: "Directrice marketing", note: 5, avis: "Nos automatisations marketing ont transformé notre processus d'acquisition. On gagne 12 heures par semaine et nos relances sont bien plus efficaces qu'avant." },
  { name: "Julien P.",     activite: "CEO agence digitale", note: 5, avis: "Application métier interne développée sur mesure en un mois. L'équipe a compris nos besoins dès le premier échange. On ne reviendrait à Excel pour rien au monde." },
];

const FAQ_ITEMS = [
  { q: "Combien de temps pour créer une plateforme ?",       a: "Entre 4 et 12 semaines selon la complexité. Un MVP fonctionnel peut être livré en 3–4 semaines pour valider rapidement." },
  { q: "Puis-je automatiser mes tâches avec l'IA ?",         a: "Oui. Nous analysons vos processus et identifions les tâches automatisables : emails, relances, traitement de données, génération de documents, chatbots, etc." },
  { q: "Puis-je connecter la plateforme à mes outils ?",     a: "Absolument. Nous intégrons vos outils existants (CRM, ERP, Google Workspace, Slack, Stripe...) via des APIs et webhooks dédiés." },
  { q: "Puis-je faire évoluer la plateforme ?",              a: "La plateforme est conçue pour grandir avec vous. Architecture modulaire, API versionnée, documentation technique — évolution facile et maîtrisée." },
  { q: "La maintenance est-elle incluse ?",                  a: "Un suivi post-livraison est inclus. Nous proposons également des contrats de maintenance mensuelle pour les mises à jour, la supervision et le support continu." },
];

/* ─── HELPERS ────────────────────────────────────────────────────────── */

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={13} fill="#f9a826" stroke="none" />
      ))}
    </div>
  );
}

/* ─── CONTACT FORM HELPERS ───────────────────────────────────────────── */
const ACCENT_C     = "#818cf8";
const ACCENT_RGB_C = "129,140,248";

function isEmailValid(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function FieldInput({ icon: Icon, type = "text", placeholder, value, onChange, validate, required }: {
  icon: React.ElementType; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; validate?: (v: string) => boolean; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isValid  = validate ? validate(value) : value.length > 0;
  const showOk   = touched && value && isValid;
  const showErr  = touched && value && validate && !isValid;
  const border   = showErr ? "rgba(248,113,113,0.5)" : showOk ? "rgba(52,211,153,0.45)" : focused ? `rgba(${ACCENT_RGB_C},0.5)` : "rgba(255,255,255,0.09)";
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB_C},0.08)` : "none" }}>
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? ACCENT_C : "rgba(255,255,255,0.25)" }} />
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setTouched(true); }} required={required}
        className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none" />
      <AnimatePresence>
        {showOk && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><CheckCircle2 size={14} className="text-[#34d399]" /></motion.div>}
      </AnimatePresence>
    </div>
  );
}

function FieldSelect({ icon: Icon, placeholder, value, onChange, options }: {
  icon: React.ElementType; placeholder: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  const [focused, setFocused] = useState(false);
  const border = focused ? `rgba(${ACCENT_RGB_C},0.5)` : value ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.09)";
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB_C},0.08)` : "none" }}>
      <Icon size={15} className="shrink-0" style={{ color: value ? ACCENT_C : "rgba(255,255,255,0.25)" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
        style={{ color: value ? "white" : "rgba(255,255,255,0.25)" }}>
        <option value="" disabled hidden style={{ background: "#0f0f12" }}>{placeholder}</option>
        {options.map((o) => <option key={o} value={o} style={{ background: "#0f0f12", color: "white" }}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="shrink-0 opacity-40" />
    </div>
  );
}

function FieldTextarea({ icon: Icon, placeholder, value, onChange, required }: {
  icon: React.ElementType; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const border = focused ? `rgba(${ACCENT_RGB_C},0.5)` : value ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)";
  return (
    <div className="flex gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB_C},0.08)` : "none" }}>
      <Icon size={15} className="mt-0.5 shrink-0" style={{ color: focused || value ? ACCENT_C : "rgba(255,255,255,0.25)" }} />
      <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} required={required} rows={4}
        className="flex-1 resize-none bg-transparent text-sm text-white placeholder-white/25 outline-none" />
    </div>
  );
}

const BESOIN_OPTIONS = ["Automatisation de processus", "Chatbot / Assistant IA", "Plateforme SaaS", "Application métier interne", "Marketplace / B2B", "Intégration d'outils", "Autre"];
const BUDGET_OPTIONS = ["< 2 000 €", "2 000 – 5 000 €", "5 000 – 15 000 €", "15 000 € et +", "Je ne sais pas encore"];

/* ─── PAGE ───────────────────────────────────────────────────────────── */

export default function AutomatisationIAPage() {
  /* contact form */
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [besoin,  setBesoin]  = useState("");
  const [budget,  setBudget]  = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  /* faq */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const canSubmit = name && isEmailValid(email) && besoin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1600));
    setSending(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white overflow-x-hidden">
      <Navbar />

      {/* ══════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-12 sm:pt-32 sm:pb-20 px-6 overflow-hidden">
        {/* bg glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full opacity-[0.07]"
            style={{ background: `radial-gradient(circle, rgba(${ACCENT_RGB},1) 0%, transparent 70%)` }} />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full opacity-[0.05]"
            style={{ background: `radial-gradient(circle, rgba(96,165,250,1) 0%, transparent 70%)` }} />
          {/* grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">

            {/* LEFT */}
            <div>
              {/* badge */}
              <motion.div {...fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-8">
                <Sparkles size={13} style={{ color: ACCENT }} />
                Automatisation · IA · Plateformes web
              </motion.div>

              <MultiLineReveal
                lines={["Automatisation, IA", "et plateformes web", "sur mesure"]}
                className="text-4xl sm:text-5xl font-bold leading-tight mb-6"
                highlight={2}
              />

              <FadeReveal delay={0.25}>
                <p className="text-white/55 text-lg leading-relaxed mb-8 max-w-lg">
                  Nous concevons des outils métiers, plateformes SaaS et automatisations intelligentes pour digitaliser et optimiser votre activité.
                </p>
              </FadeReveal>

              {/* badges */}
              <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="flex flex-wrap gap-3 mb-10">
                {[
                  { emoji: "🤖", label: "Automatisation intelligente" },
                  { emoji: "⚡", label: "Gain de temps" },
                  { emoji: "🔗", label: "Intégration avec vos outils" },
                ].map((b) => (
                  <span key={b.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/80">
                    {b.emoji} {b.label}
                  </span>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div {...fadeIn} transition={{ delay: 0.45 }} className="flex flex-wrap gap-4">
                <a href="/contact?besoin=Automatisation+%26+IA"
                  className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.03]"
                  style={{ background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.9), rgba(96,165,250,0.8))` }}>
                  Parler de mon projet <ArrowRight size={16} />
                </a>
                <a href="#cas-usage"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/[0.09] hover:text-white">
                  Voir des exemples
                </a>
              </motion.div>
            </div>

            {/* RIGHT — workflow illustration */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease }} className="hidden lg:block">
              <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 overflow-hidden">
                {/* header bar */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-[#f87171]" />
                  <div className="w-3 h-3 rounded-full bg-[#f9a826]" />
                  <div className="w-3 h-3 rounded-full bg-[#4ade80]" />
                  <div className="ml-4 flex-1 h-6 rounded-lg bg-white/[0.05] flex items-center px-3">
                    <span className="text-[10px] text-white/30">app.djama.fr/dashboard</span>
                  </div>
                </div>

                {/* dashboard mockup */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Tâches auto.", val: "1 248", color: ACCENT_RGB, up: "+18%" },
                    { label: "Leads qualifiés", val: "342",   color: "96,165,250", up: "+34%" },
                    { label: "Gain temps/sem.", val: "12h",   color: "74,222,128", up: "+100%" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
                      <p className="text-[10px] text-white/40 mb-1">{kpi.label}</p>
                      <p className="text-xl font-bold text-white mb-1" style={{ color: `rgba(${kpi.color},0.9)` }}>{kpi.val}</p>
                      <span className="text-[10px] text-[#4ade80]">{kpi.up}</span>
                    </div>
                  ))}
                </div>

                {/* chart area */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 mb-4">
                  <p className="text-[10px] text-white/40 mb-3">Automatisations déclenchées / semaine</p>
                  <div className="flex items-end gap-2 h-20">
                    {[35, 52, 48, 70, 65, 88, 95].map((h, i) => (
                      <motion.div key={i}
                        initial={{ height: 0 }} animate={{ height: `${h}%` }}
                        transition={{ delay: 0.6 + i * 0.08, duration: 0.6, ease }}
                        className="flex-1 rounded-t-md"
                        style={{ background: `rgba(${ACCENT_RGB},${0.4 + i * 0.08})` }} />
                    ))}
                  </div>
                </div>

                {/* workflow nodes */}
                <div className="flex items-center gap-2 overflow-hidden">
                  {["Trigger", "IA", "CRM", "Email", "Slack"].map((node, i) => (
                    <div key={node} className="flex items-center gap-2">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.1 }}
                        className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-[10px] font-medium text-white/70 whitespace-nowrap">
                        {node}
                      </motion.div>
                      {i < 4 && <div className="w-3 h-px bg-white/20 shrink-0" />}
                    </div>
                  ))}
                </div>

                {/* animated pulse */}
                <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute top-4 right-4 w-2 h-2 rounded-full"
                  style={{ background: `rgba(${ACCENT_RGB},1)`, boxShadow: `0 0 8px rgba(${ACCENT_RGB},0.8)` }} />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 2 — CE QUE NOUS POUVONS AUTOMATISER
      ══════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-1 opacity-40"
            style={{ background: `linear-gradient(90deg,transparent,rgba(${ACCENT_RGB},0.6),transparent)` }} />
        </div>

        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
              <Zap size={13} style={{ color: ACCENT }} /> Automatisation intelligente
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-4">
              Ce que nous pouvons <span style={{ color: ACCENT }}>automatiser</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto">
              De la réponse client au reporting hebdomadaire — chaque tâche répétitive peut être automatisée intelligemment.
            </motion.p>
          </motion.div>

          <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AUTOMATISATIONS.map((item) => (
              <motion.div key={item.title} variants={cardReveal}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 hover:border-white/[0.14] hover:bg-white/[0.055] transition-all duration-300">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `rgba(${item.rgb},0.12)` }}>
                  <item.icon size={22} style={{ color: item.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 3 — TYPES DE PLATEFORMES
      ══════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent" />

        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
              <Layers size={13} style={{ color: ACCENT }} /> Plateformes sur mesure
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-4">
              Quel type de <span style={{ color: ACCENT }}>plateforme</span> ?
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto">
              Nous développons trois grandes familles de plateformes — adaptées à votre modèle économique et à vos utilisateurs.
            </motion.p>
          </motion.div>

          <motion.div {...staggerContainerFast} viewport={viewport} className="grid md:grid-cols-3 gap-6">
            {PLATEFORMES.map((p) => (
              <motion.div key={p.title} variants={cardReveal}
                className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 hover:border-white/[0.13] transition-all duration-300 flex flex-col">
                {/* mockup dashboard */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 mb-6 overflow-hidden">
                  {/* title bars */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: `rgba(${p.rgb},0.8)` }} />
                    <div className="h-1.5 rounded-full flex-1" style={{ background: `rgba(${p.rgb},0.2)`, maxWidth: p.mockup[0].w }} />
                  </div>
                  <div className="h-1.5 rounded-full mb-4" style={{ background: `rgba(${p.rgb},0.12)`, width: p.mockup[1].w }} />
                  {/* chart area */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="flex items-end gap-1.5 h-16">
                      {[45, 70, 55, 85, 65, 95, 80].map((h, i) => (
                        <motion.div key={i}
                          initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }}
                          transition={{ delay: 0.2 + i * 0.07, duration: 0.5, ease }}
                          className="flex-1 rounded-t"
                          style={{ background: `rgba(${p.rgb},${0.3 + i * 0.07})` }} />
                      ))}
                    </div>
                  </div>
                  {/* stats row */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {["", "", ""].map((_, i) => (
                      <div key={i} className="h-6 rounded-lg" style={{ background: `rgba(${p.rgb},0.08)` }} />
                    ))}
                  </div>
                </div>

                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `rgba(${p.rgb},0.12)` }}>
                  <p.icon size={20} style={{ color: p.color }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-5 flex-1">{p.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] text-white/60">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 4 — SCHÉMA VISUEL
      ══════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-1 opacity-30"
            style={{ background: `linear-gradient(90deg,transparent,rgba(${ACCENT_RGB},0.5),transparent)` }} />
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
              <GitMerge size={13} style={{ color: ACCENT }} /> Comment ça fonctionne
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-4">
              De l'utilisateur aux <span style={{ color: ACCENT }}>résultats</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto">
              Un flux simple et puissant : chaque interaction utilisateur déclenche une chaîne d'automatisations qui produisent des résultats concrets.
            </motion.p>
          </motion.div>

          {/* flow diagram */}
          <div className="flex flex-col items-center gap-0">
            {SCHEMA_STEPS.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5, ease }}
                  className="relative rounded-2xl border px-10 py-5 flex items-center gap-4 w-full max-w-sm"
                  style={{ borderColor: `rgba(${step.rgb},0.3)`, background: `rgba(${step.rgb},0.06)` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `rgba(${step.rgb},0.15)` }}>
                    <step.icon size={20} style={{ color: step.color }} />
                  </div>
                  <span className="text-base font-semibold text-white">{step.label}</span>
                  {/* pulse for first */}
                  {i === 0 && (
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }} transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -right-1 -top-1 w-3 h-3 rounded-full"
                      style={{ background: step.color }} />
                  )}
                </motion.div>

                {/* arrow */}
                {i < SCHEMA_STEPS.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    whileInView={{ opacity: 1, height: 40 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.1, duration: 0.4 }}
                    className="flex flex-col items-center overflow-hidden">
                    <div className="w-px flex-1" style={{ background: `linear-gradient(to bottom, rgba(${SCHEMA_STEPS[i].rgb},0.5), rgba(${SCHEMA_STEPS[i+1].rgb},0.5))` }} />
                    <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                      <ChevronDown size={16} style={{ color: `rgba(${SCHEMA_STEPS[i+1].rgb},0.7)` }} />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 5 — TABLEAU DES FONCTIONNALITÉS
      ══════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
              <CheckSquare size={13} style={{ color: ACCENT }} /> Ce qui est inclus
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-4">
              Fonctionnalités <span style={{ color: ACCENT }}>incluses</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto">
              Chaque projet comprend les éléments essentiels pour un produit robuste et évolutif dès le premier jour.
            </motion.p>
          </motion.div>

          <motion.div {...staggerContainerFast} viewport={viewport} className="rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            {FONCTIONNALITES.map((f, i) => (
              <motion.div key={f.label} variants={cardReveal}
                className={`flex items-center justify-between px-6 py-5 ${i < FONCTIONNALITES.length - 1 ? "border-b border-white/[0.06]" : ""} hover:bg-white/[0.03] transition-colors`}>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `rgba(${f.color},0.1)` }}>
                    <f.icon size={17} style={{ color: `rgba(${f.color},1)` }} />
                  </div>
                  <span className="text-sm font-medium text-white/85">{f.label}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10 px-3 py-1">
                  <CheckCircle2 size={14} className="text-[#4ade80]" />
                  <span className="text-xs font-semibold text-[#4ade80]">Inclus</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 6 — TECHNOLOGIES
      ══════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent" />

        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
              <Cpu size={13} style={{ color: ACCENT }} /> Stack technique
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-4">
              Technologies <span style={{ color: ACCENT }}>possibles</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto">
              Nous choisissons les meilleures technologies selon votre projet — performance, scalabilité et maintenabilité garanties.
            </motion.p>
          </motion.div>

          <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TECHNOLOGIES.map((tech) => (
              <motion.div key={tech.label} variants={cardReveal}
                className="group flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.13] hover:bg-white/[0.055] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `rgba(${tech.rgb},0.12)` }}>
                  <tech.icon size={20} style={{ color: tech.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{tech.label}</h3>
                  <p className="text-xs text-white/45 leading-relaxed">{tech.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 7 — CAS D'USAGE
      ══════════════════════════════════════════════ */}
      <section id="cas-usage" className="py-12 sm:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
              <Briefcase size={13} style={{ color: ACCENT }} /> Exemples concrets
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-4">
              Cas d'<span style={{ color: ACCENT }}>usage</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto">
              Des exemples réels de ce que nous avons construit — et les résultats obtenus.
            </motion.p>
          </motion.div>

          <motion.div {...staggerContainerFast} viewport={viewport} className="grid md:grid-cols-3 gap-6">
            {CAS_USAGE.map((cas) => (
              <motion.div key={cas.title} variants={cardReveal}
                className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col">
                {/* mini chart mockup */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 mb-5 overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: `rgba(${cas.rgb},0.9)` }} />
                    <div className="h-1.5 w-20 rounded-full" style={{ background: `rgba(${cas.rgb},0.2)` }} />
                  </div>
                  <div className="flex items-end gap-2 h-14">
                    {cas.bars.map((h, i) => (
                      <motion.div key={i}
                        initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease }}
                        className="flex-1 rounded-t"
                        style={{ background: `rgba(${cas.rgb},${0.3 + i * 0.12})` }} />
                    ))}
                  </div>
                  <div className="mt-3 h-1.5 rounded-full" style={{ background: `rgba(${cas.rgb},0.15)`, width: "70%" }} />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `rgba(${cas.rgb},0.12)` }}>
                    <cas.icon size={18} style={{ color: cas.color }} />
                  </div>
                  <h3 className="font-bold text-white">{cas.title}</h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-4 flex-1">{cas.desc}</p>
                <div className="flex items-center gap-2 rounded-xl border border-[#4ade80]/20 bg-[#4ade80]/[0.07] px-3 py-2">
                  <TrendingUp size={13} className="text-[#4ade80] shrink-0" />
                  <span className="text-xs font-semibold text-[#4ade80]">{cas.resultat}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 8 — TÉMOIGNAGES
      ══════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.018] to-transparent" />

        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
              <Star size={13} style={{ color: "#f9a826" }} /> Avis clients
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-4">
              Ce que disent nos <span style={{ color: ACCENT }}>clients</span>
            </motion.h2>
          </motion.div>

          <motion.div {...staggerContainerFast} viewport={viewport} className="grid md:grid-cols-3 gap-6">
            {TEMOIGNAGES.map((t) => (
              <motion.div key={t.name} variants={cardReveal}
                className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-7 flex flex-col gap-5">
                <Quote size={28} style={{ color: `rgba(${ACCENT_RGB},0.35)` }} />
                <p className="text-sm text-white/65 leading-relaxed flex-1 italic">"{t.avis}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-white/40">{t.activite}</p>
                  </div>
                  <Stars n={t.note} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 9 — FAQ
      ══════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
              <Lightbulb size={13} style={{ color: ACCENT }} /> Questions fréquentes
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-4">
              FAQ
            </motion.h2>
          </motion.div>

          <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div key={i} variants={cardReveal}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-white/[0.03] transition-colors">
                  <span className="font-medium text-white/90 text-sm">{item.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown size={16} className="text-white/40 shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                      <div className="px-6 pb-5 text-sm text-white/55 leading-relaxed border-t border-white/[0.05] pt-4">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 10 — CTA FINAL
      ══════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: `radial-gradient(circle, rgba(${ACCENT_RGB},1) 0%, transparent 70%)` }} />
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport}
            className="relative rounded-3xl border border-white/[0.1] bg-white/[0.03] p-12 text-center overflow-hidden">
            <div className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{ background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.06) 0%, transparent 60%)` }} />

            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-8">
              <Sparkles size={13} style={{ color: ACCENT }} /> Prêt à démarrer ?
            </motion.div>

            <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-bold mb-5">
              Automatisez et digitalisez<br />
              <span style={{ color: ACCENT }}>votre activité</span>
            </motion.h2>

            <motion.p variants={fadeIn} className="text-white/50 text-lg max-w-xl mx-auto mb-10">
              Plateforme sur mesure, automatisations IA, intégrations métier — discutons de votre projet, sans engagement.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4">
              <a href="/contact?besoin=Automatisation+%26+IA"
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all hover:opacity-90 hover:scale-[1.03]"
                style={{ background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.9), rgba(96,165,250,0.8))` }}>
                Discuter de mon projet <ArrowRight size={16} />
              </a>
            </motion.div>

            {/* trust row */}
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-6 mt-10">
              {[
                { icon: Clock,      label: "Réponse sous 24h" },
                { icon: Shield,     label: "Sans engagement" },
                { icon: Sparkles,   label: "Devis gratuit" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-xs text-white/40">
                  <t.icon size={13} style={{ color: ACCENT }} />
                  {t.label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>


      <Footer />
    </div>
  );
}
