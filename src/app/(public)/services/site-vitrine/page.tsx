"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Zap, User, Mail, Phone, MessageSquare, Loader2, Send, ArrowLeft,
  Globe, Search, Smartphone, Shield, TrendingUp, Star,
  Briefcase, ShoppingBag, Users, Building2, Code2, Palette,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#4ade80";
const ACCENT_RGB = "74,222,128";

const POUR_QUI = [
  { icon: Briefcase,  color: "#60a5fa", rgb: "96,165,250",  who: "Entrepreneurs",       desc: "Vous lancez votre activité et avez besoin d'une vitrine crédible pour rassurer vos premiers clients.",  tags: ["Lancement", "Crédibilité", "Confiance"] },
  { icon: ShoppingBag,color: ACCENT,    rgb: ACCENT_RGB,    who: "Commerces",           desc: "Boutique physique, restaurant, salon — présentez vos services, horaires et localisation simplement.",      tags: ["Adresse", "Horaires", "Réservation"] },
  { icon: Star,       color: "#f9a826", rgb: "249,168,38",  who: "Prestataires",        desc: "Freelances, artisans, consultants — montrez votre expertise, vos réalisations et vos tarifs.",            tags: ["Portfolio", "Expertise", "Contact"] },
  { icon: Building2,  color: "#f472b6", rgb: "244,114,182", who: "Cabinets & professions libérales", desc: "Médecins, avocats, comptables — un site sobre et professionnel qui inspire confiance.",   tags: ["Professionnel", "Confiance", "RGPD"] },
  { icon: Users,      color: "#a78bfa", rgb: "167,139,250", who: "Associations & marques", desc: "Présentez votre mission, vos actions et vos membres dans un site clair et bien structuré.",          tags: ["Mission", "Équipe", "Adhérents"] },
];

const CE_QUE_COMPREND = [
  { icon: Palette,   color: "#60a5fa", rgb: "96,165,250",  title: "Design personnalisé",       desc: "Un design unique adapté à votre identité visuelle : couleurs, typographie, ambiance — rien de générique." },
  { icon: Code2,     color: ACCENT,    rgb: ACCENT_RGB,    title: "Développement propre",      desc: "Code structuré, rapide et maintenable. Pas de page builder lourd — un site qui performe vraiment." },
  { icon: Smartphone,color: "#f9a826", rgb: "249,168,38",  title: "Responsive mobile",         desc: "Votre site s'affiche parfaitement sur smartphone, tablette et desktop — sans compromis." },
  { icon: Search,    color: "#f472b6", rgb: "244,114,182", title: "SEO de base",               desc: "Balises méta, titres optimisés, structure sémantique — les fondations pour être trouvé sur Google." },
  { icon: MessageSquare, color: "#a78bfa", rgb: "167,139,250", title: "Formulaire de contact", desc: "Formulaire fonctionnel avec notifications email pour ne rater aucune demande entrante." },
  { icon: Shield,    color: "#34d399", rgb: "52,211,153",  title: "Sécurité & conformité",    desc: "HTTPS, mentions légales, politique de confidentialité — votre site est conforme et sécurisé." },
];

const AVANTAGES = [
  { icon: Star,       color: "#f9a826", rgb: "249,168,38",  title: "Image professionnelle",   desc: "Un site bien fait inspire confiance et vous distingue de la concurrence dès le premier regard." },
  { icon: Globe,      color: "#60a5fa", rgb: "96,165,250",  title: "Visibilité en ligne",     desc: "Soyez trouvé par vos prospects sur Google, réseaux sociaux et annuaires professionnels." },
  { icon: MessageSquare, color: ACCENT, rgb: ACCENT_RGB,   title: "Contact simplifié",       desc: "Formulaire, téléphone, carte — vos clients peuvent vous joindre facilement depuis n'importe quel écran." },
  { icon: TrendingUp, color: "#f472b6", rgb: "244,114,182",title: "Présence 24h/24",          desc: "Votre site travaille pour vous même quand vous dormez — présentez, rassurer, convertir en continu." },
];

const ETAPES = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90", title: "Échange & brief",          desc: "On parle de votre activité, votre cible, vos concurrents et vos attentes pour le site." },
  { num: "02", icon: Palette,       color: "#60a5fa", rgb: "96,165,250", title: "Maquette & design",        desc: "On vous soumet une maquette du site pour validation avant de commencer le développement." },
  { num: "03", icon: Code2,         color: ACCENT,    rgb: ACCENT_RGB,   title: "Développement",            desc: "Développement du site, intégration du contenu, tests sur tous les supports." },
  { num: "04", icon: CheckCircle2,  color: "#4ade80", rgb: "74,222,128", title: "Mise en ligne & formation","desc": "Publication sur votre domaine, formation à la gestion du contenu et suivi post-lancement." },
];

const FAQ_ITEMS = [
  { q: "Puis-je modifier le contenu moi-même ?", a: "Oui. Nous intégrons un système de gestion de contenu (CMS) simple si vous souhaitez modifier vos textes, images et pages sans avoir à nous contacter." },
  { q: "Le nom de domaine et l'hébergement sont-ils inclus ?", a: "Ces éléments sont généralement à votre charge (environ 15–30€/an). Nous vous guidons pour les commander et nous occupons de la configuration technique." },
  { q: "Combien de temps faut-il pour créer un site vitrine ?", a: "Entre 2 et 4 semaines selon le nombre de pages et la disponibilité pour les retours. Un site simple peut être livré en 1 semaine." },
  { q: "Mon site sera-t-il bien référencé sur Google ?", a: "Nous appliquons les bonnes pratiques SEO de base (titres, métas, structure). Pour un référencement avancé, nous proposons un accompagnement SEO dédié." },
  { q: "Combien coûte un site vitrine ?", a: "Le tarif dépend du nombre de pages et des fonctionnalités. Contactez-nous pour un devis transparent et sans engagement." },
];

const ACTIVITE_OPTIONS = ["Commerce / Boutique physique", "Prestataire de services", "Profession libérale / Cabinet", "Restaurant / Hôtel", "Association / Organisation", "Autre"];
const NB_PAGES_OPTIONS = ["1 à 3 pages (mini-site)", "4 à 6 pages", "7 à 10 pages", "Plus de 10 pages"];

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
    <div className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(74,222,128,0.25)] hover:shadow-sm" onClick={onToggle}>
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
  const [nbPages,  setNbPages]  = useState("");
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
        body: JSON.stringify({ name: nom, email, phone: tel, source: "devis",
          subject: `Site vitrine — ${activite}${nbPages ? ` / ${nbPages}` : ""}`, message }) });
      if (!res.ok) throw new Error(); setSent(true);
    } catch { setError("Une erreur est survenue. Réessayez ou contactez-nous directement."); } finally { setSending(false); }
  }

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.05)] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(74,222,128,0.12)]">
        <CheckCircle2 size={26} style={{ color: ACCENT }} />
      </div>
      <h3 className="mb-2 text-lg font-extrabold text-white">Demande envoyée !</h3>
      <p className="text-sm text-white/50">Nous vous répondons sous 24h avec une estimation personnalisée.</p>
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
      <FieldSelect icon={Monitor} placeholder="Nombre de pages souhaitées" value={nbPages} onChange={setNbPages} options={NB_PAGES_OPTIONS} />
      <div className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre besoin (pages souhaitées, style, références, contraintes…)" value={message}
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
        {sending ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</> : <><Send size={17} /> Créer mon site vitrine</>}
      </button>
      <p className="text-center text-[0.68rem] text-white/20">🔒 Confidentialité garantie · Réponse sous 24h · Sans engagement</p>
    </motion.form>
  );
}

export default function SiteVitrinePage() {
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
              <Monitor size={13} /> Site vitrine
            </motion.div>
            <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <MultiLineReveal lines={["Site vitrine", "professionnel"]}
                highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08} lineClassName="justify-center" />
            </h1>
            <FadeReveal delay={0.2}>
              <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
                Un site propre, rapide et crédible pour présenter votre activité, rassurer vos clients et générer des contacts.
              </p>
            </FadeReveal>
            <motion.div variants={staggerContainerFast} initial="hidden" animate="show" className="mb-10 flex flex-wrap justify-center gap-4">
              {[{ label: "À partir de 490€", sub: "site vitrine complet" }, { label: "2–4 semaines", sub: "délai de livraison" }, { label: "Responsive", sub: "mobile + desktop" }].map(({ label, sub }) => (
                <motion.div key={label} variants={cardReveal} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-6 py-3.5 text-center">
                  <p className="text-lg font-extrabold" style={{ color: ACCENT }}>{label}</p>
                  <p className="text-[0.65rem] text-white/35">{sub}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
              <Link href="#devis" className="btn-primary px-8 py-4 text-base">Créer mon site vitrine <ArrowRight size={16} /></Link>
            </motion.div>
          </div>
        </section>

        {/* POUR QUI */}
        <section className="bg-[#0c0c0e] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Profils concernés</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Pour qui est ce service ?</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* CE QUE COMPREND LE SITE */}
        <section className="bg-[#09090b] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Inclus dans le service</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que comprend votre site</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CE_QUE_COMPREND.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* AVANTAGES */}
        <section className="bg-[#0c0c0e] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Les bénéfices</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Pourquoi avoir un site vitrine</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AVANTAGES.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ÉTAPES */}
        <section className="bg-[#09090b] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Notre méthode</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">4 étapes pour votre site</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="space-y-6">
              {ETAPES.map(({ num, icon: Icon, color, rgb, title, desc }) => (
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

        {/* FORMULAIRE */}
        <section id="devis" className="bg-[#0c0c0e] py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Passez à l'action</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Créons votre site ensemble</motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/45">Dites-nous ce dont vous avez besoin — on revient vers vous sous 24h.</motion.p>
            </motion.div>
            <DevisForm />
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#09090b] py-24">
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
        <section className="relative overflow-hidden bg-[#0c0c0e] pb-24 pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.4) 0%, transparent 70%)` }} />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.6, ease }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `rgba(${ACCENT_RGB},0.12)` }}>
                <Sparkles size={26} style={{ color: ACCENT }} />
              </div>
              <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Votre présence en ligne, enfin propre</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/50 max-w-md mx-auto">Un site vitrine professionnel qui vous représente bien et vous génère des contacts — sans complexité inutile.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="#devis" className="btn-primary px-8 py-4 text-base">Créer mon site vitrine <ArrowRight size={16} /></Link>
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
