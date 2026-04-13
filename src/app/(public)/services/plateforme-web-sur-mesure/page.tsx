"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Zap, User, Mail, Phone, MessageSquare, Loader2, Send, ArrowLeft,
  LayoutDashboard, ShoppingCart, Users, Settings, Database,
  Calendar, Shield, TrendingUp, Code2, Briefcase, Star, Lock,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#38bdf8";
const ACCENT_RGB = "56,189,248";

const EXEMPLES = [
  { icon: Users,          color: "#60a5fa", rgb: "96,165,250",  title: "Espace client",              desc: "Un portail dédié où vos clients suivent leurs commandes, accèdent à leurs documents et communiquent avec vous." },
  { icon: LayoutDashboard,color: ACCENT,    rgb: ACCENT_RGB,    title: "Tableau de bord",            desc: "Dashboard analytique sur mesure pour piloter vos KPIs, visualiser vos données et prendre de meilleures décisions." },
  { icon: Settings,       color: "#4ade80", rgb: "74,222,128",  title: "Gestion interne",            desc: "Outil métier pour gérer vos équipes, processus, stocks, plannings ou tout autre workflow interne." },
  { icon: ShoppingCart,   color: "#f9a826", rgb: "249,168,38",  title: "Suivi de commandes",         desc: "Interface de suivi en temps réel pour vous et vos clients — statuts, notifications, historique." },
  { icon: Code2,          color: "#f472b6", rgb: "244,114,182", title: "SaaS métier",                desc: "Plateforme logicielle en mode abonnement : gestion de clients, facturation, accès multi-utilisateurs." },
  { icon: Calendar,       color: "#a78bfa", rgb: "167,139,250", title: "Plateforme de réservation",  desc: "Système de réservation en ligne avec disponibilités, paiement intégré et notifications automatiques." },
];

const FONCTIONNALITES = [
  { icon: Lock,    color: "#60a5fa", rgb: "96,165,250",  title: "Authentification sécurisée",  desc: "Connexion par email, OAuth (Google, GitHub) ou SSO — avec gestion des rôles et des permissions." },
  { icon: Database,color: ACCENT,    rgb: ACCENT_RGB,    title: "Base de données sur mesure",  desc: "Architecture de données pensée pour votre métier, performante et évolutive." },
  { icon: Settings,color: "#4ade80", rgb: "74,222,128",  title: "Tableau d'administration",   desc: "Interface d'admin pour gérer vos utilisateurs, contenus et paramètres sans intervention technique." },
  { icon: Zap,     color: "#f9a826", rgb: "249,168,38",  title: "Notifications & alertes",     desc: "Emails transactionnels, notifications push, alertes internes — tout est configurable." },
  { icon: TrendingUp, color: "#f472b6", rgb: "244,114,182", title: "Analytics intégrés",      desc: "Tableaux de bord avec métriques clés pour suivre l'usage de votre plateforme en temps réel." },
  { icon: Shield,  color: "#a78bfa", rgb: "167,139,250", title: "Sécurité & conformité",      desc: "HTTPS, protection des données, RGPD — votre plateforme est construite avec les meilleures pratiques." },
];

const POUR_QUI = [
  { icon: Briefcase, color: "#60a5fa", rgb: "96,165,250", who: "Startups & scale-ups",     desc: "Vous avez besoin d'un outil numérique qui grandit avec vous et supporte votre croissance.",       tags: ["MVP", "SaaS", "Growth"] },
  { icon: Users,     color: ACCENT,    rgb: ACCENT_RGB,   who: "PME & ETI",                desc: "Remplacez vos outils génériques par une solution taillée pour vos processus métier spécifiques.",  tags: ["Métier", "Processus", "Équipe"] },
  { icon: Star,      color: "#4ade80", rgb: "74,222,128", who: "E-commerce avancé",        desc: "Espace revendeur, gestion multi-boutiques, logistique connectée — au-delà des solutions standards.", tags: ["Multi-boutique", "B2B", "Revendeur"] },
  { icon: Settings,  color: "#f9a826", rgb: "249,168,38", who: "Organisations & associations", desc: "Adhérents, événements, cotisations, documents partagés — gérez tout sur une seule plateforme.", tags: ["Adhérents", "Événements", "Docs"] },
];

const METHODE = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90", title: "Cadrage du projet",          desc: "On analyse vos besoins, vos utilisateurs cibles et les fonctionnalités prioritaires pour bien démarrer." },
  { num: "02", icon: LayoutDashboard,color: "#60a5fa",rgb: "96,165,250", title: "Architecture & design",      desc: "Conception de l'architecture technique, wireframes, choix des technologies adaptées à votre contexte." },
  { num: "03", icon: Code2,          color: ACCENT,   rgb: ACCENT_RGB,   title: "Développement par sprints",  desc: "Développement itératif avec des livraisons régulières pour valider chaque fonctionnalité ensemble." },
  { num: "04", icon: CheckCircle2,   color: "#4ade80",rgb: "74,222,128", title: "Livraison & accompagnement", desc: "Déploiement, formation de votre équipe, documentation et support post-lancement." },
];

const CE_QUE_VOUS_OBTENEZ = [
  { label: "Cadrage & architecture",     desc: "Analyse des besoins, choix techniques, roadmap et spécifications fonctionnelles.",              icon: LayoutDashboard, color: "56,189,248"  },
  { label: "Design UX/UI",               desc: "Maquettes et prototypes interactifs validés avec vous avant tout développement.",                 icon: Star,            color: "96,165,250"  },
  { label: "Développement full-stack",   desc: "Frontend, backend, base de données — livré en sprints avec démos régulières.",                   icon: Code2,           color: "74,222,128"  },
  { label: "Authentification & sécurité",desc: "Gestion des utilisateurs, rôles, permissions, HTTPS, conformité RGPD.",                          icon: Lock,            color: "249,168,38"  },
  { label: "Déploiement & formation",    desc: "Mise en production, formation de votre équipe, documentation technique complète.",                icon: Shield,          color: "244,114,182" },
  { label: "Maintenance & support",      desc: "Suivi post-lancement, corrections, évolutions et mise à jour de sécurité.",                      icon: Settings,        color: "167,139,250" },
];

const EXEMPLES_PROJETS = [
  { icon: Users,          color: "#38bdf8", rgb: "56,189,248",  titre: "Portail clients SaaS",       desc: "Espace client sécurisé avec tableau de bord, suivi des commandes, facturation et messagerie intégrée.",     resultat: "NPS client passé de 6.2 à 8.7/10" },
  { icon: LayoutDashboard,color: "#60a5fa", rgb: "96,165,250",  titre: "Dashboard analytique",       desc: "Interface de pilotage temps réel connectée à 3 sources de données, avec graphiques et exports automatisés.",  resultat: "Reporting manuel réduit de 80%" },
  { icon: Calendar,       color: "#4ade80", rgb: "74,222,128",  titre: "Plateforme de réservation",  desc: "Système de réservation en ligne avec paiement Stripe, calendrier dynamique et notifications automatiques.",    resultat: "200+ réservations/mois en autonomie" },
];

const FAQ_ITEMS = [
  { q: "Quelle est la différence avec un site web classique ?", a: "Un site web présente votre activité. Une plateforme web sur mesure est un outil fonctionnel avec des utilisateurs connectés, des données persistantes et des actions métier spécifiques." },
  { q: "Quelles technologies utilisez-vous ?", a: "Nous travaillons principalement avec Next.js, React, Node.js, PostgreSQL et Supabase. Le choix dépend de vos besoins spécifiques, de l'échelle et du budget." },
  { q: "Combien de temps faut-il pour développer une plateforme ?", a: "Un MVP fonctionnel peut être livré en 4 à 12 semaines selon la complexité. Nous découpons le projet en sprints pour vous livrer de la valeur rapidement." },
  { q: "Puis-je gérer la plateforme moi-même après livraison ?", a: "Oui. Nous intégrons une interface d'administration accessible sans compétences techniques et nous vous formons à son utilisation." },
  { q: "Quel est le budget minimum pour une plateforme sur mesure ?", a: "Cela dépend fortement de la complexité. Contactez-nous avec votre projet — nous ferons une estimation honnête et transparente." },
];

const TYPE_PLATEFORME_OPTIONS = ["Espace client", "Tableau de bord / Analytics", "Outil de gestion interne", "SaaS / Application métier", "Plateforme de réservation", "Autre"];

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
    <div className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(56,189,248,0.25)] hover:shadow-sm" onClick={onToggle}>
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
  const [nom,          setNom]          = useState("");
  const [email,        setEmail]        = useState("");
  const [tel,          setTel]          = useState("");
  const [typePlateforme, setTypePlateforme] = useState("");
  const [fonctionnalites, setFonctionnalites] = useState("");
  const [message,      setMessage]      = useState("");
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const canSubmit = nom && isEmailValid(email) && typePlateforme && message.length > 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nom, email, phone: tel, source: "devis",
          subject: `Plateforme web sur mesure — ${typePlateforme}`,
          message: `${fonctionnalites ? `Fonctionnalités souhaitées : ${fonctionnalites}\n\n` : ""}${message}` }) });
      if (!res.ok) throw new Error(); setSent(true);
    } catch { setError("Une erreur est survenue. Réessayez ou contactez-nous directement."); } finally { setSending(false); }
  }

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-[rgba(56,189,248,0.25)] bg-[rgba(56,189,248,0.05)] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(56,189,248,0.12)]">
        <CheckCircle2 size={26} style={{ color: ACCENT }} />
      </div>
      <h3 className="mb-2 text-lg font-extrabold text-white">Demande envoyée !</h3>
      <p className="text-sm text-white/50">Nous vous répondons sous 24h pour analyser votre projet.</p>
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
        <FieldSelect icon={Globe} placeholder="Type de plateforme" value={typePlateforme} onChange={setTypePlateforme} options={TYPE_PLATEFORME_OPTIONS} />
      </div>
      <FieldInput icon={Settings} placeholder="Fonctionnalités souhaitées (ex : login, tableau de bord, paiement…)" value={fonctionnalites} onChange={setFonctionnalites} />
      <div className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre projet (objectif, utilisateurs, contexte, contraintes…)" value={message}
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
        {sending ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</> : <><Send size={17} /> Discuter de ma plateforme</>}
      </button>
      <p className="text-center text-[0.68rem] text-white/20">🔒 Confidentialité garantie · Réponse sous 24h · Sans engagement</p>
    </motion.form>
  );
}

export default function PlateformeWebSurMesurePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#09090b] pb-24 pt-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/4 rounded-full opacity-20"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.35) 0%, transparent 70%)` }} />
          </div>
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <motion.div {...fadeIn} className="mb-8">
              <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 transition-colors hover:text-white">
                <ArrowLeft size={13} /> Tous les services
              </Link>
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium"
              style={{ borderColor: `rgba(${ACCENT_RGB},0.3)`, background: `rgba(${ACCENT_RGB},0.08)`, color: ACCENT }}>
              <Globe size={13} /> Développement web
            </motion.div>
            <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <MultiLineReveal lines={["Plateforme web", "sur mesure"]}
                highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08} lineClassName="justify-center" />
            </h1>
            <FadeReveal delay={0.2}>
              <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
                Nous développons des plateformes web adaptées à vos besoins : espace client, outil métier, gestion interne, SaaS ou plateforme B2B.
              </p>
            </FadeReveal>
            <motion.div variants={staggerContainerFast} initial="hidden" animate="show" className="mb-10 flex flex-wrap justify-center gap-4">
              {[{ label: "Sur mesure", sub: "100% adapté à votre métier" }, { label: "Scalable", sub: "grandit avec vous" }, { label: "Livraison par sprints", sub: "résultats rapides" }].map(({ label, sub }) => (
                <motion.div key={label} variants={cardReveal} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-6 py-3.5 text-center">
                  <p className="text-lg font-extrabold" style={{ color: ACCENT }}>{label}</p>
                  <p className="text-[0.65rem] text-white/35">{sub}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
              <Link href="#devis" className="btn-primary px-8 py-4 text-base">Discuter de ma plateforme <ArrowRight size={16} /></Link>
            </motion.div>
          </div>
        </section>

        {/* EXEMPLES */}
        <section className="bg-[#030f16] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Types de plateformes</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Exemples de plateformes que nous créons</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {EXEMPLES.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FONCTIONNALITÉS */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Ce que nous intégrons</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Fonctionnalités possibles</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FONCTIONNALITES.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* POUR QUI */}
        <section className="bg-[#030f16] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Profils concernés</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">À qui s'adresse ce service ?</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POUR_QUI.map(({ icon: Icon, color, rgb, who, desc, tags }) => (
                <motion.div key={who} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{who}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-white/45">{desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => <span key={t} className="rounded-full border px-2.5 py-1 text-[0.6rem] font-medium" style={{ borderColor: `rgba(${rgb},0.25)`, color, background: `rgba(${rgb},0.07)` }}>{t}</span>)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* MÉTHODE */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Notre méthode</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Comment nous travaillons</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="space-y-6">
              {METHODE.map(({ num, icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={num} variants={cardReveal} className="group relative flex gap-6 rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border"
                    style={{ background: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.25)` }}>
                    <span className="text-[0.6rem] font-bold" style={{ color: `rgba(${rgb},0.7)` }}>{num}</span>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                    <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                  </div>
                  <span className="pointer-events-none absolute right-6 top-4 text-5xl font-black opacity-[0.04] select-none" style={{ color }}>{num}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CE QUE VOUS OBTENEZ */}
        <section className="bg-[#030f16] py-14 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Inclus dans votre projet</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que vous obtenez</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="overflow-hidden rounded-3xl border border-white/[0.10]">
              {CE_QUE_VOUS_OBTENEZ.map(({ label, desc, icon: Icon, color }, i) => (
                <motion.div key={label} variants={cardReveal}
                  className={`flex items-start gap-5 p-5 sm:p-6 transition-all duration-200 hover:bg-white/[0.03] ${i > 0 ? "border-t border-white/[0.07]" : ""}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${color},0.1)` }}>
                    <Icon size={18} style={{ color: `rgb(${color})` }} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-bold text-white">{label}</p>
                    <p className="text-xs leading-relaxed text-white/50">{desc}</p>
                  </div>
                  <CheckCircle2 size={16} className="ml-auto mt-1 shrink-0 text-[#34d399]" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* EXEMPLES DE PROJETS */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Références</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Exemples de projets réalisés</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-3">
              {EXEMPLES_PROJETS.map(({ icon: Icon, color, rgb, titre, desc, resultat }) => (
                <motion.div key={titre} variants={cardReveal} className="rounded-3xl border border-white/[0.10] bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/[0.17] hover:bg-white/[0.07]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.12)` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{titre}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-white/50">{desc}</p>
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: `rgba(${rgb},0.25)`, background: `rgba(${rgb},0.06)` }}>
                    <TrendingUp size={12} style={{ color }} />
                    <p className="text-[0.68rem] font-semibold" style={{ color }}>{resultat}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FORMULAIRE */}
        <section id="devis" className="bg-[#030f16] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Passez à l'action</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Discutons de votre projet</motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/45">Décrivez votre besoin — on revient vers vous sous 24h avec une approche concrète.</motion.p>
            </motion.div>
            <DevisForm />
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#09090b] py-14 sm:py-24">
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

        {/* CTA */}
        <section className="relative overflow-hidden bg-[#030f16] pb-14 pt-14 sm:pb-24 sm:pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.4) 0%, transparent 70%)` }} />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.6, ease }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `rgba(${ACCENT_RGB},0.12)` }}>
                <Sparkles size={26} style={{ color: ACCENT }} />
              </div>
              <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Votre plateforme, sur mesure</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/50 max-w-md mx-auto">Pas de template générique — on construit exactement ce dont vous avez besoin, avec les technologies adaptées.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="#devis" className="btn-primary px-8 py-4 text-base">Discuter de ma plateforme <ArrowRight size={16} /></Link>
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/70 transition-all hover:bg-white/[0.07] hover:text-white">Voir tous nos services</Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
