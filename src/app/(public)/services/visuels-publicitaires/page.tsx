"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Zap, Target, User, Mail, Phone,
  MessageSquare, Loader2, Send, ArrowLeft,
  Image, Layout, FileImage, Monitor, ShoppingBag,
  Briefcase, Star, TrendingUp, Instagram, Hash,
  Palette, Settings, FileText, LayoutGrid,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#f9a826";
const ACCENT_RGB = "249,168,38";

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const TYPES_VISUELS = [
  { icon: Image,     color: "#f9a826", rgb: "249,168,38",  title: "Posts sponsorisés",          desc: "Visuels carrés ou paysages optimisés pour les publicités sur Meta, Instagram et Facebook Ads." },
  { icon: Layout,    color: "#60a5fa", rgb: "96,165,250",  title: "Stories publicitaires",      desc: "Formats verticaux 9:16 percutants pour des stories sponsorisées qui retiennent l'attention." },
  { icon: Monitor,   color: "#4ade80", rgb: "74,222,128",  title: "Bannières",                  desc: "Bannières display pour campagnes Google Ads, sites partenaires et réseaux publicitaires." },
  { icon: FileImage, color: ACCENT,    rgb: ACCENT_RGB,    title: "Flyers digitaux",            desc: "Flyers événementiels ou promotionnels au format numérique pour diffusion sur les réseaux." },
  { icon: Star,      color: "#f472b6", rgb: "244,114,182", title: "Visuels promotionnels",      desc: "Soldes, offres limitées, lancement de produit — des visuels qui mettent votre offre en avant." },
  { icon: Instagram, color: "#a78bfa", rgb: "167,139,250", title: "Annonces Meta / Instagram",  desc: "Créations pensées nativement pour les formats publicitaires de Meta : single image, carousel, collection." },
];

const CE_QUE_NOUS_TRAVAILLONS = [
  { icon: MessageSquare, color: "#60a5fa", rgb: "96,165,250", title: "Message clair",            desc: "Un visuel publicitaire efficace dit l'essentiel en moins de 3 secondes. On structure votre message pour qu'il frappe juste." },
  { icon: Star,          color: ACCENT,    rgb: ACCENT_RGB,   title: "Design professionnel",    desc: "Mise en page soignée, typographie lisible, hiérarchie visuelle maîtrisée — un rendu qui inspire confiance." },
  { icon: Hash,          color: "#4ade80", rgb: "74,222,128", title: "Branding cohérent",       desc: "Vos couleurs, votre logo, votre ton — on respecte votre identité visuelle pour des publicités reconnaissables." },
  { icon: Megaphone,     color: "#f472b6", rgb: "244,114,182",title: "Mise en avant de l'offre",desc: "Prix, promotion, avantage clé — on met en scène votre proposition de valeur de façon claire et attractive." },
  { icon: Target,        color: "#a78bfa", rgb: "167,139,250",title: "Pensés pour convertir",   desc: "Call-to-action bien placé, visuel qui attire l'œil, message ancré dans les besoins de votre cible." },
];

const POUR_QUI = [
  { icon: Briefcase,   color: "#60a5fa", rgb: "96,165,250", who: "Entreprises",           desc: "Campagnes de notoriété, lancement de service, recrutement — on crée les visuels adaptés à vos objectifs.",   tags: ["B2B", "Notoriété", "Campagne"] },
  { icon: ShoppingBag, color: ACCENT,    rgb: ACCENT_RGB,   who: "Commerces & e-commerce",desc: "Promos, nouveautés, soldes — des visuels conçus pour vendre et générer du trafic vers votre boutique.",      tags: ["Soldes", "Produit", "Vente"] },
  { icon: TrendingUp,  color: "#4ade80", rgb: "74,222,128", who: "Marques",               desc: "Visuels alignés sur votre identité de marque pour maintenir une présence forte et cohérente sur les réseaux.", tags: ["Identité", "Branding", "Feed"] },
  { icon: Star,        color: "#f472b6", rgb: "244,114,182",who: "Entrepreneurs",         desc: "Vous lancez une offre, un service ou un événement — on vous crée des visuels prêts à diffuser.",            tags: ["Lancement", "Offre", "Promo"] },
];

const CE_QUE_VOUS_OBTENEZ = [
  { label: "Brief & direction artistique", desc: "On analyse vos objectifs, votre audience et votre charte graphique pour cadrer les visuels.",   icon: Palette,    color: "249,168,38"  },
  { label: "Création des visuels",         desc: "Conception des visuels dans les formats demandés — 1 à 30 déclinaisons selon le pack.",          icon: Sparkles,   color: "96,165,250"  },
  { label: "2 séries de retouches",        desc: "Deux allers-retours inclus pour ajuster les visuels selon vos retours.",                         icon: Settings,   color: "74,222,128"  },
  { label: "Fichiers sources + exports",   desc: "Vous recevez les fichiers PNG/JPG haute résolution + les sources éditables (AI, PSD ou Figma).", icon: FileText,   color: "249,168,38"  },
  { label: "Déclinaisons multi-formats",   desc: "Adaptation automatique au format Stories, Post carré, bannière web et format print si besoin.",  icon: LayoutGrid, color: "244,114,182" },
];

const EXEMPLES_PROJETS = [
  { icon: Megaphone, color: "#f9a826", rgb: "249,168,38", titre: "Campagne Instagram",      desc: "Pack de 10 visuels pour une boutique mode — stories + posts + bannière pour le lancement d'une collection.",          resultat: "+2 400 clics sur la campagne Meta Ads" },
  { icon: Star,      color: "#60a5fa", rgb: "96,165,250", titre: "Identité pub restaurant", desc: "Visuels menu du jour, promotions hebdomadaires et stories pour un restaurant gastronomique parisien.",                  resultat: "Taux d'engagement stories multiplié par 3" },
  { icon: Zap,       color: "#4ade80", rgb: "74,222,128", titre: "Visuels Google Ads",      desc: "Bannières display en 5 formats pour une campagne de notoriété — avec variantes A/B pour les tests.",                   resultat: "CTR de 4.2% vs 1.1% en moyenne secteur" },
];

const FAQ_ITEMS = [
  { q: "Dois-je fournir mon logo et mes couleurs ?", a: "Oui, idéalement. Si vous avez une charte graphique ou un kit de marque, partagez-le avec nous. Si ce n'est pas le cas, nous pouvons vous proposer un style cohérent basé sur vos préférences." },
  { q: "Combien de visuels puis-je commander à la fois ?", a: "Il n'y a pas de minimum ni de maximum. Vous pouvez commander un seul visuel ou un lot complet. Les tarifs sont dégressifs à partir de 5 visuels." },
  { q: "Quels formats de fichiers livrez-vous ?", a: "Nous livrons en PNG, JPEG ou PDF selon l'usage. Les fichiers sont fournis aux dimensions exactes demandées (ex. 1080x1080, 1080x1920, etc.)." },
  { q: "Combien de modifications sont incluses ?", a: "2 rounds de retours sont inclus par visuel. Des modifications supplémentaires sont possibles sur devis si le projet évolue significativement." },
  { q: "Combien coûte la création d'un visuel publicitaire ?", a: "Le tarif varie selon le nombre de visuels, la complexité et les formats. Contactez-nous pour une estimation gratuite et sans engagement." },
];

const TYPE_VISUEL_OPTIONS = ["Post sponsorisé", "Story publicitaire", "Bannière web", "Flyer digital", "Visuel promotionnel", "Annonce Meta / Instagram", "Autre"];
const PLATEFORME_OPTIONS  = ["Instagram", "Facebook", "LinkedIn", "TikTok", "Google Ads", "Site web", "Autre"];

/* ─────────────────────────────────────────────────────────
   SOUS-COMPOSANTS
───────────────────────────────────────────────────────── */
function isEmailValid(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function FieldInput({ icon: Icon, type = "text", placeholder, value, onChange, validate, required }: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  validate?: (v: string) => boolean; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isValid = validate ? validate(value) : value.length > 0;
  const showOk  = touched && value && isValid;
  const showErr = touched && value && validate && !isValid;
  const border  = showErr ? "rgba(248,113,113,0.5)" : showOk ? "rgba(52,211,153,0.45)" : focused ? `rgba(${ACCENT_RGB},0.5)` : "rgba(255,255,255,0.09)";
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white/[0.09] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB},0.08)` : "none" }}>
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <input type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setTouched(true); }}
        required={required}
        className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none" />
      <AnimatePresence>
        {showOk && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><CheckCircle2 size={14} className="text-[#34d399]" /></motion.div>}
      </AnimatePresence>
    </div>
  );
}

function FieldSelect({ icon: Icon, placeholder, value, onChange, options }: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; options: string[];
}) {
  const [focused, setFocused] = useState(false);
  const border = value ? "rgba(52,211,153,0.35)" : focused ? `rgba(${ACCENT_RGB},0.45)` : "rgba(255,255,255,0.09)";
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border bg-white/[0.09] px-4 py-3.5 transition-all duration-200" style={{ borderColor: border }}>
      <Icon size={15} className="shrink-0" style={{ color: value || focused ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
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
    <div className="cursor-pointer rounded-2xl border border-[rgba(255,255,255,0.12)] bg-white transition-all duration-200 hover:border-[rgba(249,168,38,0.4)] hover:shadow-md" onClick={onToggle}>
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
  const [nom,        setNom]        = useState("");
  const [email,      setEmail]      = useState("");
  const [tel,        setTel]        = useState("");
  const [typeVisuel, setTypeVisuel] = useState("");
  const [plateforme, setPlateforme] = useState("");
  const [message,    setMessage]    = useState("");
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const canSubmit = nom && isEmailValid(email) && typeVisuel && message.length > 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nom, email, phone: tel, source: "devis",
          subject: `Visuels publicitaires — ${typeVisuel}${plateforme ? ` / ${plateforme}` : ""}`, message }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch { setError("Une erreur est survenue. Réessayez ou contactez-nous directement."); }
    finally { setSending(false); }
  }

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.05)] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(249,168,38,0.12)]">
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
        <FieldSelect icon={Image} placeholder="Type de visuel" value={typeVisuel} onChange={setTypeVisuel} options={TYPE_VISUEL_OPTIONS} />
      </div>
      <FieldSelect icon={Monitor} placeholder="Plateforme cible" value={plateforme} onChange={setPlateforme} options={PLATEFORME_OPTIONS} />
      <div className="rounded-2xl border bg-white/[0.09] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre objectif publicitaire (offre à promouvoir, cible, message clé, références…)" value={message}
            onChange={(e) => setMessage(e.target.value)} rows={5} required
            className="flex-1 resize-none bg-transparent pb-4 text-sm text-white placeholder-white/40 outline-none" />
        </div>
        <div className="border-t border-white/[0.05] px-4 py-2 text-right">
          <span className="text-[0.6rem] text-white/20">{message.length} caractères</span>
        </div>
      </div>
      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={!canSubmit || sending}
        className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50">
        {sending ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</> : <><Send size={17} /> Demander un devis</>}
      </button>
      <p className="text-center text-[0.68rem] text-white/20">🔒 Confidentialité garantie · Réponse sous 24h · Sans engagement</p>
    </motion.form>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function VisuelsPublicitairesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main>

        {/* HERO */}
        <section className="relative overflow-hidden bg-[#09090b] pb-14 pt-24 sm:pb-24 sm:pt-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/4 rounded-full opacity-30"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.35) 0%, transparent 70%)` }} />
          </div>
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <motion.div {...fadeIn} className="mb-8">
              <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 transition-colors hover:text-white">
                <ArrowLeft size={13} /> Tous les services
              </Link>
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.05 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium"
              style={{ borderColor: `rgba(${ACCENT_RGB},0.3)`, background: `rgba(${ACCENT_RGB},0.08)`, color: ACCENT }}>
              <Megaphone size={13} /> Publicité & communication
            </motion.div>
            <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <MultiLineReveal lines={["Création de visuels", "publicitaires"]}
                highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08} lineClassName="justify-center" />
            </h1>
            <FadeReveal delay={0.2}>
              <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
                Nous concevons des visuels impactants pour vos réseaux sociaux, campagnes publicitaires et supports de communication.
              </p>
            </FadeReveal>
            <motion.div variants={staggerContainerFast} initial="hidden" animate="show" className="mb-10 flex flex-wrap justify-center gap-4">
              {[{ label: "À partir de 19€", sub: "par visuel" }, { label: "24–48h", sub: "délai de livraison" }, { label: "2 retours", sub: "inclus" }].map(({ label, sub }) => (
                <motion.div key={label} variants={cardReveal} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-6 py-3.5 text-center">
                  <p className="text-lg font-extrabold" style={{ color: ACCENT }}>{label}</p>
                  <p className="text-[0.65rem] text-white/35">{sub}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
              <Link href="#devis" className="btn-primary px-8 py-4 text-base">Demander un devis <ArrowRight size={16} /></Link>
            </motion.div>
          </div>
        </section>

        {/* TYPES DE VISUELS */}
        <section className="bg-[#130e01] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Formats disponibles</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Types de visuels publicitaires</motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/60 max-w-xl mx-auto">Posts, stories, bannières, flyers — on couvre tous les formats de vos campagnes.</motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TYPES_VISUELS.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.13] bg-white/[0.07] p-6 shadow-sm transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.11]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/60">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CE QUE NOUS TRAVAILLONS */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Notre approche</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que nous travaillons sur chaque visuel</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CE_QUE_NOUS_TRAVAILLONS.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.13] bg-white/[0.07] p-6 shadow-sm transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.11]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/60">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* POUR QUI */}
        <section className="bg-[#130e01] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Profils concernés</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce service est fait pour vous si…</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POUR_QUI.map(({ icon: Icon, color, rgb, who, desc, tags }) => (
                <motion.div key={who} variants={cardReveal} className="group rounded-3xl border border-white/[0.13] bg-white/[0.07] p-6 shadow-sm transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.11]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{who}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-white/60">{desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full border px-2.5 py-1 text-[0.6rem] font-medium"
                        style={{ borderColor: `rgba(${rgb},0.25)`, color, background: `rgba(${rgb},0.07)` }}>{t}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CE QUE VOUS OBTENEZ */}
        <section className="bg-[#130e01] py-14 sm:py-24">
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
        <section id="devis" className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Passez à l'action</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Demandez votre devis</motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/60">Partagez votre objectif publicitaire — on crée les visuels qui font la différence.</motion.p>
            </motion.div>
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.04] p-5 sm:p-8 shadow-2xl">
              <DevisForm />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#130e01] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Questions fréquentes</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Vous avez des questions ?</motion.h2>
            </motion.div>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <FaqItem key={i} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative overflow-hidden bg-[#09090b] pb-14 pt-14 sm:pb-24 sm:pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.4) 0%, transparent 70%)` }} />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.6, ease }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `rgba(${ACCENT_RGB},0.12)` }}>
                <Sparkles size={26} style={{ color: ACCENT }} />
              </div>
              <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Prêt à lancer votre campagne ?</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/50 max-w-md mx-auto">Décrivez votre objectif — on crée les visuels qui attirent l'attention et donnent envie d'agir.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="#devis" className="btn-primary px-8 py-4 text-base">Demander un devis <ArrowRight size={16} /></Link>
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/70 transition-all hover:bg-white/[0.07] hover:text-white">
                  Voir tous nos services
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
