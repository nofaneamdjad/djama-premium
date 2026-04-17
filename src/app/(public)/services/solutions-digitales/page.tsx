"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Zap, User, Mail, Phone, MessageSquare, Loader2, Send, ArrowLeft,
  BrainCircuit, Clock, BarChart3, FileText, Users, Settings,
  Lightbulb, TrendingUp, Shield, Briefcase, Globe, Database,
  Code2, LayoutDashboard, Layers, GitBranch, Quote, Star,
  Workflow, Link2, ShoppingBag, Lock, Server,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#818cf8";
const ACCENT_RGB = "129,140,248";
const ACCENT2    = "#38bdf8";
const ACCENT2_RGB= "56,189,248";

/* ── Données ─────────────────────────────────────────── */

const AUTOMATISATIONS = [
  { icon: Bot,          color: ACCENT,   rgb: ACCENT_RGB,   title: "Automatisation de tâches",    desc: "Répétition zéro — formulaires, emails, exports, relances, classement : tout tourne sans vous." },
  { icon: Users,        color: "#60a5fa",rgb: "96,165,250",  title: "Intégration CRM",             desc: "Synchronisez votre CRM avec vos outils marketing, formulaires et bases de données." },
  { icon: MessageSquare,color: "#f472b6",rgb: "244,114,182", title: "Chatbots IA",                 desc: "Assistants intelligents pour qualifier les leads, répondre aux clients et escalader si besoin." },
  { icon: Database,     color: "#4ade80",rgb: "74,222,128",  title: "Traitement de données",       desc: "Collecte, nettoyage, enrichissement et agrégation automatique de vos sources de données." },
  { icon: TrendingUp,   color: "#f9a826",rgb: "249,168,38",  title: "Automatisation marketing",   desc: "Campagnes emails, séquences de nurturing, scoring leads — tout orchestré automatiquement." },
  { icon: Link2,        color: "#a78bfa",rgb: "167,139,250", title: "Synchronisation d'outils",   desc: "Connectez Notion, Airtable, Slack, Google Sheets, Stripe, Calendly — sans code, en temps réel." },
];

const TYPES_PLATEFORMES = [
  { icon: Layers,       color: ACCENT,    rgb: ACCENT_RGB,    title: "Plateforme SaaS",           desc: "Application en mode abonnement : gestion clients, facturation, accès multi-utilisateurs avec rôles et permissions.",       tags: ["Multi-user", "Abonnement", "Dashboard"] },
  { icon: Settings,     color: ACCENT2,   rgb: ACCENT2_RGB,   title: "Application métier",        desc: "Outil interne sur mesure pour vos équipes : planification, reporting, gestion de stock, processus RH.",                     tags: ["Interne", "Processus", "Équipe"] },
  { icon: ShoppingBag,  color: "#f9a826", rgb: "249,168,38",  title: "Marketplace / B2B",         desc: "Plateforme mettant en relation vendeurs et acheteurs, prestataires et clients, avec espace dédié, commissions et paiements.", tags: ["Two-sided", "Commissions", "Scale"] },
];

const SCHEMA_STEPS = [
  { icon: User,           color: ACCENT,    rgb: ACCENT_RGB,    label: "Utilisateur",        desc: "Votre client ou équipe" },
  { icon: LayoutDashboard,color: ACCENT2,   rgb: ACCENT2_RGB,   label: "Plateforme web",     desc: "Interface & fonctions" },
  { icon: Bot,            color: "#f472b6", rgb: "244,114,182", label: "Automatisation IA",  desc: "Traitement intelligent" },
  { icon: TrendingUp,     color: "#4ade80", rgb: "74,222,128",  label: "Résultats",          desc: "Données & actions" },
];

const TABLE_INCLUS = [
  { label: "Développement sur mesure",     icon: Code2,          color: "129,140,248" },
  { label: "Dashboard administrateur",     icon: LayoutDashboard,color: "96,165,250"  },
  { label: "API & intégrations tierces",   icon: Link2,          color: "74,222,128"  },
  { label: "Automatisations IA",           icon: Bot,            color: "249,168,38"  },
  { label: "Gestion des utilisateurs",     icon: Users,          color: "244,114,182" },
  { label: "Authentification sécurisée",   icon: Lock,           color: "167,139,250" },
  { label: "Hébergement & déploiement",    icon: Server,         color: "52,211,153"  },
  { label: "Maintenance & support",        icon: Shield,         color: "201,165,90"  },
];

const TECHNOLOGIES = [
  { label: "Next.js",       color: ACCENT,    rgb: ACCENT_RGB,    icon: Globe    },
  { label: "Node.js",       color: "#4ade80", rgb: "74,222,128",  icon: Server   },
  { label: "REST & GraphQL",color: ACCENT2,   rgb: ACCENT2_RGB,   icon: Link2    },
  { label: "OpenAI / IA",   color: "#f472b6", rgb: "244,114,182", icon: BrainCircuit },
  { label: "PostgreSQL",     color: "#f9a826", rgb: "249,168,38",  icon: Database },
  { label: "Make / Zapier",  color: "#a78bfa", rgb: "167,139,250", icon: Workflow },
];

const CAS_USAGE = [
  { icon: Users,        color: ACCENT,    rgb: ACCENT_RGB,    titre: "Automatisation prospection",  desc: "Séquence de prospection B2B automatisée : enrichissement des leads, envoi d'emails personnalisés, scoring et relances planifiées dans le CRM.",            resultat: "+40% de leads traités sans effort humain" },
  { icon: LayoutDashboard, color: ACCENT2, rgb: ACCENT2_RGB, titre: "Plateforme de gestion interne", desc: "Dashboard métier avec authentification, gestion des utilisateurs, suivi des tâches, reporting hebdo automatisé et intégration Slack.",              resultat: "Reporting manuel réduit de 80%" },
  { icon: BrainCircuit, color: "#f472b6", rgb: "244,114,182", titre: "SaaS pour clients",            desc: "Application SaaS en mode abonnement pour gérer les clients, factures, accès aux ressources et messages — interface admin + espace client dédié.", resultat: "200 clients actifs en 6 mois" },
];

const TEMOIGNAGES = [
  { name: "Romain T.", activite: "Directeur commercial",     note: 5, avis: "DJAMA a automatisé notre processus de qualification — on économise 3h par jour. La solution est fiable, documentée et notre équipe l'a adoptée immédiatement." },
  { name: "Léa M.",   activite: "Fondatrice d'un SaaS RH",   note: 5, avis: "Notre plateforme a été livrée en 10 semaines avec un design propre et toutes les fonctionnalités demandées. L'équipe est réactive et vraiment à l'écoute." },
  { name: "Karim B.", activite: "CEO agence marketing",      note: 5, avis: "Le chatbot IA développé par DJAMA gère 70% de nos demandes entrantes. Nos commerciaux se concentrent sur les vrais prospects. ROI visible en 2 semaines." },
];

const FAQ_ITEMS = [
  { q: "Combien de temps pour créer une plateforme ?", a: "Un MVP fonctionnel est livrable en 4 à 12 semaines selon la complexité. Nous découpons en sprints pour livrer de la valeur rapidement et valider ensemble." },
  { q: "Puis-je automatiser mes tâches avec l'IA ?", a: "Oui. Nous analysons vos processus et construisons des automatisations sur mesure — Make, Zapier, n8n, APIs, LLM — adaptées à vos outils existants." },
  { q: "Puis-je connecter la plateforme à mes outils actuels ?", a: "Oui. Nous développons des APIs et intégrations pour connecter votre plateforme à vos outils existants : CRM, ERP, email, calendrier, paiement, etc." },
  { q: "Puis-je faire évoluer la plateforme après livraison ?", a: "Absolument. Toutes nos plateformes sont conçues pour évoluer. Nous pouvons ajouter des modules, modifier l'interface et intégrer de nouveaux outils." },
  { q: "La maintenance est-elle incluse ?", a: "Un suivi post-lancement est inclus. Pour une maintenance long terme (mises à jour, monitoring, évolutions), nous proposons des contrats dédiés." },
  { q: "Dois-je être technique pour utiliser la solution ?", a: "Non. Nous concevons des interfaces accessibles avec interfaces d'administration simples. Vous n'avez besoin d'aucune compétence technique." },
];

const ACTIVITE_OPTIONS = ["E-commerce", "Agence / Freelance", "Commerce / Service", "Cabinet / Profession libérale", "Startup / SaaS", "Industrie / PME", "Autre"];

function isEmailValid(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function FieldInput({ icon: Icon, type = "text", placeholder, value, onChange, validate, required }: {
  icon: React.ElementType; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; validate?: (v: string) => boolean; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isValid = validate ? validate(value) : value.length > 0;
  const showOk  = touched && value && isValid;
  const showErr = touched && value && validate && !isValid;
  const border  = showErr ? "rgba(248,113,113,0.5)" : showOk ? "rgba(52,211,153,0.45)" : focused ? `rgba(${ACCENT_RGB},0.5)` : "rgba(255,255,255,0.09)";
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB},0.08)` : "none" }}>
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? ACCENT : "rgba(255,255,255,0.25)" }} />
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
  const border = value ? "rgba(52,211,153,0.35)" : focused ? `rgba(${ACCENT_RGB},0.45)` : "rgba(255,255,255,0.09)";
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200" style={{ borderColor: border }}>
      <Icon size={15} className="shrink-0" style={{ color: value || focused ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ color: value ? "white" : "rgba(255,255,255,0.25)" }}
        className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#111113] [&>option]:text-white">
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="pointer-events-none shrink-0 text-white/25" />
      {value && <CheckCircle2 size={13} className="shrink-0 text-[#34d399]" />}
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(129,140,248,0.3)] hover:shadow-sm" onClick={onToggle}>
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-[#09090b] leading-relaxed">{q}</p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{ borderColor: open ? `rgba(${ACCENT_RGB},0.4)` : "rgba(0,0,0,0.1)", background: open ? `rgba(${ACCENT_RGB},0.08)` : "transparent" }}>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown size={14} style={{ color: open ? ACCENT : "#6b7280" }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <p className="border-t border-black/[0.05] px-6 pb-5 pt-4 text-sm leading-relaxed text-[#4b5563]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DevisForm() {
  const [nom,      setNom]      = useState("");
  const [email,    setEmail]    = useState("");
  const [tel,      setTel]      = useState("");
  const [activite, setActivite] = useState("");
  const [message,  setMessage]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const canSubmit = nom && isEmailValid(email) && activite && message.length > 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nom, email, phone: tel, source: "devis", subject: `Solutions Digitales — ${activite}`, message }) });
      if (!res.ok) throw new Error(); setSent(true);
    } catch { setError("Une erreur est survenue. Réessayez ou contactez-nous directement."); } finally { setSending(false); }
  }

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-[rgba(129,140,248,0.25)] bg-[rgba(129,140,248,0.05)] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(129,140,248,0.12)]">
        <CheckCircle2 size={26} style={{ color: ACCENT }} />
      </div>
      <h3 className="mb-2 text-lg font-extrabold text-white">Demande envoyée !</h3>
      <p className="text-sm text-white/50">Nous analysons votre projet et revenons vers vous sous 24h.</p>
    </motion.div>
  );

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport} transition={{ duration: 0.55, ease }} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={User} placeholder="Votre nom" value={nom} onChange={setNom} required />
        <FieldInput icon={Mail} type="email" placeholder="Adresse email" value={email} onChange={setEmail} validate={isEmailValid} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={Phone} type="tel" placeholder="Téléphone (optionnel)" value={tel} onChange={setTel} />
        <FieldSelect icon={Briefcase} placeholder="Votre activité" value={activite} onChange={setActivite} options={ACTIVITE_OPTIONS} />
      </div>
      <div className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre projet (automatisation, plateforme, outils à intégrer, objectifs…)" value={message}
            onChange={(e) => setMessage(e.target.value)} rows={5} required
            className="flex-1 resize-none bg-transparent pb-4 text-sm text-white placeholder-white/25 outline-none" />
        </div>
        <div className="border-t border-white/[0.05] px-4 py-2 text-right">
          <span className="text-[0.6rem] text-white/20">{message.length} caractères</span>
        </div>
      </div>
      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={!canSubmit || sending}
        className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50">
        {sending ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</> : <><Send size={17} /> Discuter de mon projet</>}
      </button>
      <p className="text-center text-[0.68rem] text-white/20">🔒 Confidentialité garantie · Réponse sous 24h · Sans engagement</p>
    </motion.form>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export default function SolutionsDigitalesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <main>

        {/* ══ HERO ══════════════════════════════════════════ */}
        <section className="relative overflow-hidden"
          style={{ background: "radial-gradient(ellipse at 30% 50%, #0d0d26 0%, #080814 40%, #050510 70%, #030308 100%)", minHeight: "min(80vh, 720px)" }}>
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(129,140,248,0.05) 1.5px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 pb-16 pt-28 lg:flex-row lg:gap-16 lg:pb-0 lg:pt-0" style={{ minHeight: "min(80vh, 720px)" }}>

            {/* GAUCHE */}
            <div className="flex flex-1 flex-col items-start lg:py-16">
              <motion.div {...fadeIn} className="mb-7">
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 transition-colors hover:text-white">
                  <ArrowLeft size={13} /> Tous les services
                </Link>
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold"
                style={{ borderColor: `rgba(${ACCENT_RGB},0.3)`, background: `rgba(${ACCENT_RGB},0.07)`, color: ACCENT }}>
                <Zap size={12} /> Digital · IA · Plateformes
              </motion.div>
              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                <MultiLineReveal lines={["Automatisation, IA", "et plateformes web"]}
                  highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08} lineClassName="justify-start" />
              </h1>
              <FadeReveal delay={0.2}>
                <p className="mb-8 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
                  Nous concevons des outils métiers, plateformes SaaS et automatisations intelligentes pour digitaliser et optimiser votre activité.
                </p>
              </FadeReveal>
              <FadeReveal delay={0.3}>
                <div className="mb-8 flex flex-wrap gap-3">
                  <Link href="#devis" className="btn-primary px-7 py-3.5 text-sm">Parler de mon projet <ArrowRight size={15} /></Link>
                  <Link href="#exemples" className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/65 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white">Voir des exemples</Link>
                </div>
              </FadeReveal>
              <FadeReveal delay={0.42}>
                <div className="flex flex-wrap gap-2.5">
                  {[{ emoji: "🤖", label: "Automatisation intelligente" }, { emoji: "⚡", label: "Gain de temps" }, { emoji: "🔗", label: "Intégration avec vos outils" }].map(({ emoji, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/60">{emoji} {label}</span>
                  ))}
                </div>
              </FadeReveal>
            </div>

            {/* DROITE — Dashboard / Workflow mockup */}
            <div className="w-full flex-shrink-0 lg:w-[52%] lg:py-12">
              <motion.div initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                className="relative mx-auto w-full max-w-[560px]">
                <div className="pointer-events-none absolute -inset-6 rounded-3xl blur-3xl"
                  style={{ background: "radial-gradient(ellipse, rgba(129,140,248,0.12) 0%, rgba(56,189,248,0.07) 50%, transparent 70%)" }} />

                {/* Fenêtre dashboard */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                  style={{ background: "#0d0d12" }}>
                  {/* Barre nav */}
                  <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3" style={{ background: "#111118" }}>
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                      <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                      <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.04] px-3 py-1">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
                      <span className="flex-1 text-[0.6rem] text-white/30">app.votre-plateforme.fr / dashboard</span>
                    </div>
                  </div>

                  {/* Sidebar + contenu */}
                  <div className="flex" style={{ minHeight: 240 }}>
                    {/* Sidebar */}
                    <div className="hidden w-12 flex-col items-center gap-3 border-r border-white/[0.06] py-4 sm:flex" style={{ background: "#0a0a10" }}>
                      {[LayoutDashboard, Users, BarChart3, Settings, Bot].map((Icon, i) => (
                        <div key={i} className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                          style={{ background: i === 0 ? `rgba(${ACCENT_RGB},0.2)` : "transparent" }}>
                          <Icon size={14} style={{ color: i === 0 ? ACCENT : "rgba(255,255,255,0.25)" }} />
                        </div>
                      ))}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-4 space-y-3">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Tâches auto", val: "1 247", c: ACCENT_RGB },
                          { label: "Temps gagné", val: "38h", c: ACCENT2_RGB },
                          { label: "Erreurs évitées", val: "99%", c: "74,222,128" },
                        ].map(({ label, val, c }) => (
                          <div key={label} className="rounded-xl border border-white/[0.07] p-2.5" style={{ background: "#111118" }}>
                            <p className="mb-0.5 text-[0.55rem] text-white/35">{label}</p>
                            <p className="text-sm font-black" style={{ color: `rgb(${c})` }}>{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Workflow schéma */}
                      <div className="rounded-xl border border-white/[0.07] p-3" style={{ background: "#111118" }}>
                        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-wider text-white/30">Workflow actif</p>
                        <div className="flex items-center gap-1">
                          {[
                            { icon: User,    c: ACCENT_RGB,    label: "Leads" },
                            { icon: Bot,     c: "244,114,182", label: "IA Score" },
                            { icon: Mail,    c: ACCENT2_RGB,   label: "Email auto" },
                            { icon: CheckCircle2, c: "74,222,128", label: "CRM" },
                          ].map(({ icon: Icon, c, label }, i) => (
                            <div key={i} className="flex flex-1 flex-col items-center">
                              <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-xl"
                                style={{ background: `rgba(${c},0.15)` }}>
                                <Icon size={11} style={{ color: `rgb(${c})` }} />
                              </div>
                              <p className="text-center text-[0.5rem] text-white/35">{label}</p>
                              {i < 3 && <div className="absolute mt-3.5 ml-[calc(25%*(${i+1}))]" />}
                            </div>
                          ))}
                        </div>
                        {/* Ligne de connexion */}
                        <div className="mt-1 h-px w-full" style={{ background: `linear-gradient(90deg, rgba(${ACCENT_RGB},0.3), rgba(${ACCENT2_RGB},0.3), rgba(74,222,128,0.3))` }} />
                      </div>

                      {/* Activité récente */}
                      <div className="space-y-1.5">
                        {[
                          { icon: Bot,      c: ACCENT_RGB,    txt: "Lead qualifié automatiquement",  time: "Il y a 2 min" },
                          { icon: Mail,     c: ACCENT2_RGB,   txt: "Email de suivi envoyé",           time: "Il y a 5 min" },
                          { icon: Database, c: "74,222,128",  txt: "Données synchronisées CRM",       time: "Il y a 8 min" },
                        ].map(({ icon: Icon, c, txt, time }) => (
                          <div key={txt} className="flex items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2" style={{ background: "#111118" }}>
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: `rgba(${c},0.15)` }}>
                              <Icon size={10} style={{ color: `rgb(${c})` }} />
                            </div>
                            <p className="flex-1 text-[0.6rem] text-white/55">{txt}</p>
                            <p className="text-[0.55rem] text-white/25">{time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge IA */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -right-3 top-12 hidden rounded-2xl border border-white/[0.12] px-3 py-2 shadow-xl lg:block" style={{ background: "#141420" }}>
                  <div className="flex items-center gap-2">
                    <Bot size={12} style={{ color: ACCENT }} />
                    <div><p className="text-[0.6rem] font-bold text-white">IA active</p><p className="text-[0.55rem] text-white/35">1 247 tâches auto</p></div>
                  </div>
                </motion.div>
                {/* Badge intégrations */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85, duration: 0.5 }}
                  className="absolute -left-3 bottom-12 hidden rounded-2xl border border-white/[0.12] px-3 py-2 shadow-xl lg:block" style={{ background: "#141420" }}>
                  <div className="flex items-center gap-2">
                    <Link2 size={12} style={{ color: ACCENT2 }} />
                    <div><p className="text-[0.6rem] font-bold text-white">Intégrations</p><p className="text-[0.55rem] text-white/35">CRM, Slack, Stripe…</p></div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══ CE QUE NOUS AUTOMATISONS ══════════════════════ */}
        <section className="bg-[#0d0d1a] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Automatisation IA</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que nous pouvons automatiser</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-xl text-sm text-white/45">Des solutions concrètes pour chaque type de tâche répétitive dans votre activité.</motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {AUTOMATISATIONS.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.06]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/50">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ TYPES DE PLATEFORMES ══════════════════════════ */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT2 }}>Plateformes web</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Types de plateformes que nous créons</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-6 sm:grid-cols-3">
              {TYPES_PLATEFORMES.map(({ icon: Icon, color, rgb, title, desc, tags }) => (
                <motion.div key={title} variants={cardReveal}
                  className="overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.06]">
                  {/* Mini dashboard mockup */}
                  <div className="border-b border-white/[0.07] p-4" style={{ background: "#111118" }}>
                    <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 mb-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-white/10" />
                        <div className="h-2 w-2 rounded-full bg-white/10" />
                        <div className="h-2 w-2 rounded-full bg-white/10" />
                      </div>
                      <div className="h-3 flex-1 rounded-md bg-white/[0.04]" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="rounded-lg p-2" style={{ background: i === 0 ? `rgba(${rgb},0.12)` : "rgba(255,255,255,0.03)" }}>
                          <div className="mb-1 h-1 w-full rounded-full bg-white/15" />
                          <div className="h-2 w-1/2 rounded-full font-bold" style={{ background: i === 0 ? `rgba(${rgb},0.5)` : "rgba(255,255,255,0.1)" }} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {[1, 2].map(n => (
                        <div key={n} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="h-5 w-5 rounded-lg shrink-0" style={{ background: `rgba(${rgb},0.15)` }} />
                          <div className="flex-1 h-1.5 rounded-full bg-white/15" />
                          <div className="h-4 w-8 rounded-md" style={{ background: `rgba(${rgb},0.2)` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: `rgba(${rgb},0.12)` }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <h3 className="text-sm font-bold text-white">{title}</h3>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-white/50">{desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(t => (
                        <span key={t} className="rounded-full px-2.5 py-1 text-[0.6rem] font-medium"
                          style={{ background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.2)`, color }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ SCHÉMA VISUEL — FLUX ══════════════════════════ */}
        <section className="bg-[#0d0d1a] py-14 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Comment ça fonctionne</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Votre activité, optimisée</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-sm text-white/45">De l'utilisateur final aux résultats — une chaîne digitale fluide et automatisée.</motion.p>
            </motion.div>

            {/* Schéma desktop horizontal */}
            <div className="hidden sm:block">
              <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={staggerContainerFast}
                className="relative grid grid-cols-4 gap-0">
                <div className="absolute left-[12.5%] right-[12.5%] top-[28px] h-px"
                  style={{ background: `linear-gradient(90deg, rgba(${ACCENT_RGB},0.2), rgba(${ACCENT_RGB},0.5), rgba(56,189,248,0.5), rgba(74,222,128,0.3))` }} />
                {SCHEMA_STEPS.map(({ icon: Icon, color, rgb, label, desc }, i) => (
                  <motion.div key={label} variants={cardReveal} className="group flex flex-col items-center px-4 text-center">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                      className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2"
                      style={{ background: `rgba(${rgb},0.14)`, borderColor: `rgba(${rgb},0.5)`, boxShadow: `0 0 24px rgba(${rgb},0.2)` }}>
                      <Icon size={20} style={{ color }} />
                    </motion.div>
                    <p className="mb-1 text-sm font-bold text-white">{label}</p>
                    <p className="text-[0.7rem] text-white/40">{desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Schéma mobile vertical */}
            <div className="sm:hidden">
              <motion.div initial="hidden" whileInView="show" viewport={viewport} variants={staggerContainerFast} className="space-y-0">
                {SCHEMA_STEPS.map(({ icon: Icon, color, rgb, label, desc }, i) => (
                  <motion.div key={label} variants={cardReveal} className="relative flex gap-4">
                    {i < SCHEMA_STEPS.length - 1 && (
                      <div className="absolute left-[19px] top-[48px] h-full w-px" style={{ background: `rgba(${rgb},0.25)` }} />
                    )}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2"
                      style={{ background: `rgba(${rgb},0.14)`, borderColor: `rgba(${rgb},0.45)` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 pb-6 pt-1">
                      <p className="mb-0.5 text-sm font-bold text-white">{label}</p>
                      <p className="text-xs text-white/40">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══ TABLEAU FONCTIONNALITÉS ═══════════════════════ */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Inclus dans votre projet</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que vous obtenez</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-md text-sm text-white/45">Tout ce qui est compris dans chaque solution digitale livrée par DJAMA.</motion.p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.5, ease }}
              className="overflow-hidden rounded-3xl border border-white/[0.10]">
              <div className="grid grid-cols-[1fr_80px] items-center border-b border-white/[0.10] px-5 py-3.5"
                style={{ background: "rgba(129,140,248,0.05)" }}>
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-white/35">Fonctionnalité</p>
                <p className="text-center text-[0.65rem] font-black uppercase tracking-widest text-white/35">Inclus</p>
              </div>
              {TABLE_INCLUS.map(({ label, icon: Icon, color }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport}
                  transition={{ duration: 0.35, delay: i * 0.06, ease }}
                  className={`grid grid-cols-[1fr_80px] items-center px-5 py-4 transition-all hover:bg-white/[0.03] ${i > 0 ? "border-t border-white/[0.06]" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${color},0.1)` }}>
                      <Icon size={14} style={{ color: `rgb(${color})` }} />
                    </div>
                    <p className="text-sm text-white/80">{label}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.3)" }}>
                      <CheckCircle2 size={13} style={{ color: ACCENT }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ TECHNOLOGIES ══════════════════════════════════ */}
        <section className="bg-[#0d0d1a] py-14 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Notre stack</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Technologies utilisées</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-md text-sm text-white/45">Des outils modernes, éprouvés et adaptés à chaque type de projet.</motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {TECHNOLOGIES.map(({ label, color, rgb, icon: Icon }) => (
                <motion.div key={label} variants={cardReveal}
                  className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.06]"
                  whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <p className="text-sm font-semibold text-white/80">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ CAS D'USAGE ══════════════════════════════════ */}
        <section id="exemples" className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Cas d'usage</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Exemples de projets réalisés</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid items-start gap-6 sm:grid-cols-3">
              {CAS_USAGE.map(({ icon: Icon, color, rgb, titre, desc, resultat }) => (
                <motion.div key={titre} variants={cardReveal}
                  className="overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.06]">
                  {/* Mini dashboard mockup */}
                  <div className="p-4 border-b border-white/[0.07]" style={{ background: "#111118" }}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                        <div className="h-1.5 w-16 rounded-full bg-white/20" />
                      </div>
                      <div className="h-4 w-12 rounded-md" style={{ background: `rgba(${rgb},0.2)` }} />
                    </div>
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {[0, 1].map(i => (
                        <div key={i} className="rounded-xl p-2" style={{ background: i === 0 ? `rgba(${rgb},0.1)` : "rgba(255,255,255,0.03)" }}>
                          <div className="mb-0.5 h-1 w-full rounded-full bg-white/15" />
                          <div className="h-2.5 w-1/2 rounded-full" style={{ background: i === 0 ? `rgba(${rgb},0.5)` : "rgba(255,255,255,0.15)" }} />
                        </div>
                      ))}
                    </div>
                    {/* Activity */}
                    {[1, 2].map(n => (
                      <div key={n} className="flex items-center gap-2 rounded-lg px-2 py-1.5 mb-1" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="h-5 w-5 shrink-0 rounded-lg" style={{ background: `rgba(${rgb},0.15)` }} />
                        <div className="flex-1 h-1.5 rounded-full bg-white/15" />
                        <div className="h-3 w-8 rounded-md bg-white/10" />
                      </div>
                    ))}
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${rgb},0.12)` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <h3 className="text-sm font-bold text-white">{titre}</h3>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-white/50">{desc}</p>
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: `rgba(${rgb},0.25)`, background: `rgba(${rgb},0.06)` }}>
                      <TrendingUp size={11} style={{ color }} />
                      <p className="text-[0.65rem] font-semibold" style={{ color }}>{resultat}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ TÉMOIGNAGES ══════════════════════════════════ */}
        <section className="bg-[#0d0d1a] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Avis clients</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que disent nos clients</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid items-start gap-5 sm:grid-cols-3">
              {TEMOIGNAGES.map(({ name, activite, note, avis }) => (
                <motion.div key={name} variants={cardReveal}
                  className="flex flex-col rounded-3xl border border-white/[0.10] bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/[0.17] hover:bg-white/[0.07]">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: note }).map((_, i) => <Star key={i} size={13} fill="#f9a826" style={{ color: "#f9a826" }} />)}
                  </div>
                  <Quote size={20} className="mb-3 opacity-20" style={{ color: ACCENT }} />
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-white/65">{avis}</p>
                  <div className="flex items-center gap-3 border-t border-white/[0.07] pt-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-[0.65rem] font-black"
                      style={{ background: `rgba(${ACCENT_RGB},0.15)`, color: ACCENT }}>
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{name}</p>
                      <p className="text-[0.65rem] text-white/35">{activite}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ FORMULAIRE ═══════════════════════════════════ */}
        <section id="devis" className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Passez à l'action</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Parlons de votre projet</motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/45">Décrivez votre besoin — on analyse et on revient vers vous sous 24h avec une proposition concrète.</motion.p>
            </motion.div>
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.04] p-5 sm:p-8 shadow-2xl">
              <DevisForm />
            </div>
          </div>
        </section>

        {/* ══ FAQ ══════════════════════════════════════════ */}
        <section className="bg-[#0d0d1a] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Questions fréquentes</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Vous avez des questions ?</motion.h2>
            </motion.div>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }, i) => <FaqItem key={i} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />)}
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#09090b] pb-14 pt-14 sm:pb-24 sm:pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.4) 0%, transparent 70%)` }} />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.6, ease }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `rgba(${ACCENT_RGB},0.12)` }}>
                <Sparkles size={26} style={{ color: ACCENT }} />
              </div>
              <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Automatisez et digitalisez votre activité</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/50 max-w-md mx-auto">Dites-nous ce que vous voulez optimiser — on construit la solution qui vous libère du temps et accélère votre croissance.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="#devis" className="btn-primary px-8 py-4 text-base">Discuter de mon projet <ArrowRight size={16} /></Link>
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/70 transition-all hover:bg-white/[0.07] hover:text-white">Voir tous nos services</Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
    </>
  );
}
