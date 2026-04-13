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

const CE_QUE_VOUS_OBTENEZ = [
  { label: "Maquette & design",          desc: "Design personnalisé validé avec vous avant développement — aucune surprise.",                    icon: Palette,       color: "74,222,128"  },
  { label: "Développement responsive",   desc: "Site rapide, optimisé mobile, tablette et desktop — sans page builder lourd.",                   icon: Smartphone,    color: "96,165,250"  },
  { label: "SEO de base",                desc: "Balises méta, titres H1-H6, sitemap, robots.txt — les fondations pour être trouvé sur Google.",  icon: Search,        color: "249,168,38"  },
  { label: "Formulaire de contact",      desc: "Formulaire fonctionnel avec notifications email pour ne rater aucune demande.",                  icon: MessageSquare, color: "244,114,182" },
  { label: "Mise en ligne",              desc: "Configuration du domaine, hébergement, certificat SSL — votre site est accessible immédiatement.", icon: Globe,        color: "167,139,250" },
  { label: "Formation & support",        desc: "On vous apprend à gérer votre contenu et on reste disponibles après la livraison.",              icon: Shield,        color: "52,211,153"  },
];

const EXEMPLES_PROJETS = [
  { icon: Briefcase,  color: "#4ade80", rgb: "74,222,128",  titre: "Cabinet d'avocat",        desc: "Site 5 pages sobre et professionnel avec système de prise de RDV et formulaire de premier contact.",               resultat: "+60% de contacts entrants vs. avant" },
  { icon: ShoppingBag,color: "#60a5fa", rgb: "96,165,250",  titre: "Artisan électricien",     desc: "Site vitrine local avec galerie de réalisations, zones d'intervention et devis en ligne — bien référencé localement.", resultat: "Top 3 Google sur sa zone en 2 mois" },
  { icon: Star,       color: "#f9a826", rgb: "249,168,38",  titre: "Coach sportif freelance", desc: "Portfolio avec programmes, tarifs, témoignages clients et agenda de réservation pour séances individuelles.",          resultat: "Complet sur 3 mois après lancement" },
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
        <section
          className="relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, #0d1a10 0%, #060d08 40%, #03080a 70%, #020508 100%)",
            minHeight: "min(80vh, 720px)",
          }}
        >
          {/* Grille de fond subtile */}
          <div className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(74,222,128,0.04) 1.5px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Glow gauche */}
          <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)" }} />
          {/* Glow droite */}
          <div className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 pb-16 pt-28 lg:flex-row lg:gap-16 lg:pb-0 lg:pt-0" style={{ minHeight: "min(80vh, 720px)" }}>

            {/* ── GAUCHE : texte ── */}
            <div className="flex flex-1 flex-col items-start lg:py-16">
              {/* Retour */}
              <motion.div {...fadeIn} className="mb-7">
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 transition-colors hover:text-white">
                  <ArrowLeft size={13} /> Tous les services
                </Link>
              </motion.div>

              {/* Badge */}
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold"
                style={{ borderColor: `rgba(${ACCENT_RGB},0.3)`, background: `rgba(${ACCENT_RGB},0.07)`, color: ACCENT }}>
                <Monitor size={12} /> Site vitrine professionnel
              </motion.div>

              {/* Titre */}
              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                <MultiLineReveal
                  lines={["Site vitrine", "professionnel"]}
                  highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08}
                  lineClassName="justify-start"
                />
              </h1>

              {/* Sous-titre */}
              <FadeReveal delay={0.2}>
                <p className="mb-8 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
                  Un site rapide, crédible et optimisé SEO pour présenter votre activité et générer des contacts qualifiés.
                </p>
              </FadeReveal>

              {/* Boutons CTA */}
              <FadeReveal delay={0.3}>
                <div className="mb-8 flex flex-wrap gap-3">
                  <Link href="#devis" className="btn-primary px-7 py-3.5 text-sm">
                    Créer mon site vitrine <ArrowRight size={15} />
                  </Link>
                  <Link href="#exemples"
                    className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/65 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
                    Voir des exemples
                  </Link>
                </div>
              </FadeReveal>

              {/* Badges */}
              <FadeReveal delay={0.42}>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { emoji: "⚡", label: "Livraison rapide" },
                    { emoji: "📈", label: "SEO optimisé" },
                    { emoji: "📱", label: "Mobile first" },
                  ].map(({ emoji, label }) => (
                    <span key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/60">
                      {emoji} {label}
                    </span>
                  ))}
                </div>
              </FadeReveal>
            </div>

            {/* ── DROITE : mockup navigateur ── */}
            <div className="w-full flex-shrink-0 lg:w-[52%] lg:py-12">
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                className="relative mx-auto w-full max-w-[560px]"
              >
                {/* Halo derrière le mockup */}
                <div className="pointer-events-none absolute -inset-6 rounded-3xl blur-3xl"
                  style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.10) 0%, rgba(56,189,248,0.06) 50%, transparent 70%)" }} />

                {/* Fenêtre navigateur */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                  style={{ background: "#0d0d0f" }}>

                  {/* Barre de navigation du navigateur */}
                  <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3"
                    style={{ background: "#111115" }}>
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                      <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                      <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.04] px-3 py-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                      <span className="flex-1 text-[0.6rem] text-white/30">www.votre-site.fr</span>
                      <Globe size={10} className="text-white/20" />
                    </div>
                  </div>

                  {/* Contenu du site mockup */}
                  <div className="p-0">

                    {/* Nav mockup */}
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3"
                      style={{ background: "#0a0a0c" }}>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-md" style={{ background: `rgba(${ACCENT_RGB},0.25)` }} />
                        <div className="h-2 w-16 rounded-full bg-white/20" />
                      </div>
                      <div className="hidden items-center gap-4 sm:flex">
                        {["Services", "À propos", "Contact"].map((t) => (
                          <div key={t} className="h-1.5 rounded-full bg-white/15" style={{ width: `${t.length * 5}px` }} />
                        ))}
                      </div>
                      <div className="h-6 w-16 rounded-full" style={{ background: `rgba(${ACCENT_RGB},0.2)` }} />
                    </div>

                    {/* Hero mockup */}
                    <div className="px-5 py-6" style={{ background: "linear-gradient(135deg, #0e160f 0%, #0a1214 100%)" }}>
                      <div className="mb-2 h-2 w-20 rounded-full" style={{ background: `rgba(${ACCENT_RGB},0.35)` }} />
                      <div className="mb-1.5 h-4 w-3/4 rounded-full bg-white/50" />
                      <div className="mb-1 h-4 w-1/2 rounded-full bg-white/30" />
                      <div className="mb-4 mt-3 space-y-1.5">
                        <div className="h-2 w-full rounded-full bg-white/10" />
                        <div className="h-2 w-4/5 rounded-full bg-white/10" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-7 w-24 rounded-xl" style={{ background: `rgba(${ACCENT_RGB},0.35)` }} />
                        <div className="h-7 w-20 rounded-xl border border-white/10" />
                      </div>
                    </div>

                    {/* Cards mockup */}
                    <div className="grid grid-cols-3 gap-2 p-4" style={{ background: "#0d0d0f" }}>
                      {[ACCENT, "#60a5fa", "#f9a826"].map((c, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.07] p-3" style={{ background: "#111115" }}>
                          <div className="mb-2 h-6 w-6 rounded-lg" style={{ background: `rgba(${i === 0 ? ACCENT_RGB : i === 1 ? "96,165,250" : "249,168,38"},0.15)` }} />
                          <div className="mb-1 h-1.5 w-full rounded-full bg-white/25" />
                          <div className="h-1.5 w-2/3 rounded-full bg-white/12" />
                        </div>
                      ))}
                    </div>

                    {/* Footer mockup */}
                    <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3"
                      style={{ background: "#090909" }}>
                      <div className="h-1.5 w-24 rounded-full bg-white/10" />
                      <div className="flex gap-3">
                        {[1, 2, 3].map((n) => <div key={n} className="h-5 w-5 rounded-full bg-white/[0.07]" />)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge flottant SEO */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -right-3 top-16 hidden rounded-2xl border border-white/[0.12] px-3.5 py-2.5 shadow-xl lg:block"
                  style={{ background: "#141418" }}
                >
                  <div className="flex items-center gap-2">
                    <Search size={13} style={{ color: ACCENT }} />
                    <div>
                      <p className="text-[0.6rem] font-bold text-white">SEO optimisé</p>
                      <p className="text-[0.55rem] text-white/35">Top 3 Google en 2 mois</p>
                    </div>
                  </div>
                </motion.div>

                {/* Badge flottant mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85, duration: 0.5 }}
                  className="absolute -left-3 bottom-16 hidden rounded-2xl border border-white/[0.12] px-3.5 py-2.5 shadow-xl lg:block"
                  style={{ background: "#141418" }}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone size={13} style={{ color: "#60a5fa" }} />
                    <div>
                      <p className="text-[0.6rem] font-bold text-white">Mobile first</p>
                      <p className="text-[0.55rem] text-white/35">100% responsive</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* POUR QUI */}
        <section className="bg-[#030f08] py-14 sm:py-24">
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
        <section className="bg-[#09090b] py-14 sm:py-24">
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
        <section className="bg-[#030f08] py-14 sm:py-24">
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
        <section className="bg-[#09090b] py-14 sm:py-24">
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

        {/* CE QUE VOUS OBTENEZ */}
        <section className="bg-[#030f08] py-14 sm:py-24">
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
        <section id="exemples" className="bg-[#09090b] py-14 sm:py-24">
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
        <section id="devis" className="bg-[#030f08] py-14 sm:py-24">
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
        <section className="relative overflow-hidden bg-[#030f08] pb-14 pt-14 sm:pb-24 sm:pt-20">
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
