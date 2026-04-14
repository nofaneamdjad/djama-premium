"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Shield, Zap, Sun, User, Mail, Phone,
  MessageSquare, Loader2, Send, ArrowLeft,
  Image, Crop, Palette, Monitor, ShoppingBag,
  Briefcase, Star, TrendingUp, Hash,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#d946ef";
const ACCENT_RGB = "217,70,239";

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const CE_QUE_NOUS_FAISONS = [
  { icon: Sun,     color: "#f9a826", rgb: "249,168,38",  title: "Correction lumière & contraste", desc: "Equilibrage de l'exposition, récupération des hautes lumières et des ombres pour un rendu naturel et équilibré." },
  { icon: Palette, color: ACCENT,    rgb: ACCENT_RGB,    title: "Retouche des couleurs",          desc: "Correction colorimétrique, harmonisation de la balance des blancs et cohérence chromatique sur toute la série." },
  { icon: Image,   color: "#60a5fa", rgb: "96,165,250",  title: "Nettoyage visuel",               desc: "Suppression des éléments indésirables : tâches, distractions en arrière-plan, imperfections légères." },
  { icon: Crop,    color: "#f472b6", rgb: "244,114,182", title: "Recadrage & composition",        desc: "Ajustement du cadre pour une composition plus impactante, en respectant les règles visuelles de la plateforme cible." },
  { icon: Hash,    color: "#a78bfa", rgb: "167,139,250", title: "Harmonisation de série",         desc: "Traitement homogène d'un lot de photos pour garantir la cohérence visuelle d'un catalogue, feed ou book." },
  { icon: Monitor, color: "#34d399", rgb: "52,211,153",  title: "Optimisation réseaux & web",     desc: "Export aux bonnes dimensions et résolutions pour vos réseaux sociaux, site e-commerce ou supports de com." },
];

const TYPES_VISUELS = [
  { icon: ShoppingBag, color: "#f9a826", rgb: "249,168,38", title: "Photos produits",          desc: "Mise en valeur de vos articles pour fiches produits, boutique en ligne ou catalogue." },
  { icon: User,        color: "#60a5fa", rgb: "96,165,250", title: "Portraits",                 desc: "Retouche naturelle et professionnelle de portraits pour un rendu humain et soigné." },
  { icon: Star,        color: ACCENT,    rgb: ACCENT_RGB,   title: "Photos branding",           desc: "Visuels de marque cohérents : ambiance, couleurs, identité visuelle respectée." },
  { icon: Hash,        color: "#f472b6", rgb: "244,114,182",title: "Visuels réseaux sociaux",   desc: "Photos retouchées et optimisées pour Instagram, LinkedIn, Facebook et autres plateformes." },
  { icon: Monitor,     color: "#a78bfa", rgb: "167,139,250",title: "Visuels e-commerce",        desc: "Images sur fond blanc ou coloré, retouchées selon les standards des grandes marketplaces." },
];

const POURQUOI = [
  { icon: TrendingUp, color: "#60a5fa", rgb: "96,165,250", title: "Image plus professionnelle", desc: "Une photo bien retouchée reflète immédiatement le sérieux de votre marque et inspire confiance." },
  { icon: Hash,       color: ACCENT,    rgb: ACCENT_RGB,   title: "Cohérence visuelle",         desc: "Un feed, un catalogue ou un site avec des visuels harmonisés renforce votre identité de marque." },
  { icon: ShoppingBag,color: "#f9a826", rgb: "249,168,38", title: "Meilleure présentation",     desc: "Vos produits ressortent mieux, vos clients les imaginent plus facilement — ce qui favorise la conversion." },
  { icon: Zap,        color: "#f472b6", rgb: "244,114,182",title: "Visuels plus attractifs",    desc: "Des photos soignées attirent l'œil, génèrent plus d'engagement et améliorent vos performances sur les réseaux." },
];

const FAQ_ITEMS = [
  { q: "Dois-je fournir les photos en haute résolution ?", a: "Oui, pour obtenir le meilleur résultat possible. Idéalement, envoyez les fichiers originaux en RAW ou JPEG haute qualité. Des fichiers trop compressés limitent les possibilités de retouche." },
  { q: "Combien de modifications sont incluses ?", a: "Nous incluons 1 à 2 rounds de retours par série. Des ajustements supplémentaires peuvent être réalisés si le volume ou la demande évolue." },
  { q: "Dans quels formats livrez-vous les photos ?", a: "Nous livrons en JPEG ou PNG aux résolutions adaptées à votre usage (web, impression, réseaux sociaux). D'autres formats sont disponibles sur demande." },
  { q: "Quel est le délai de livraison ?", a: "Entre 2 et 5 jours ouvrés selon le nombre de visuels. Le délai est précisé lors du devis." },
  { q: "Combien coûte la retouche photo ?", a: "Le tarif dépend du nombre de visuels, du niveau de retouche et de l'usage final. Contactez-nous pour une estimation gratuite et sans engagement." },
];

const TYPE_PHOTO_OPTIONS = ["Photos produits", "Portraits / photos personnelles", "Photos branding", "Visuels réseaux sociaux", "Visuels e-commerce", "Autre"];
const NB_VISUELS_OPTIONS = ["1 à 5 visuels", "6 à 20 visuels", "21 à 50 visuels", "Plus de 50 visuels"];

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
    <div className="cursor-pointer rounded-2xl border border-[rgba(255,255,255,0.12)] bg-white transition-all duration-200 hover:border-[rgba(217,70,239,0.4)] hover:shadow-md" onClick={onToggle}>
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
  const [nom,       setNom]       = useState("");
  const [email,     setEmail]     = useState("");
  const [tel,       setTel]       = useState("");
  const [typePhoto, setTypePhoto] = useState("");
  const [nbVisuels, setNbVisuels] = useState("");
  const [message,   setMessage]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const canSubmit = nom && isEmailValid(email) && typePhoto && message.length > 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nom, email, phone: tel, source: "devis",
          subject: `Retouche photo — ${typePhoto}${nbVisuels ? ` / ${nbVisuels}` : ""}`, message }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch { setError("Une erreur est survenue. Réessayez ou contactez-nous directement."); }
    finally { setSending(false); }
  }

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.05)] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(52,211,153,0.12)]">
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
        <FieldSelect icon={Camera} placeholder="Type de photo" value={typePhoto} onChange={setTypePhoto} options={TYPE_PHOTO_OPTIONS} />
      </div>
      <FieldSelect icon={Image} placeholder="Nombre de visuels" value={nbVisuels} onChange={setNbVisuels} options={NB_VISUELS_OPTIONS} />
      <div className="rounded-2xl border bg-white/[0.09] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre besoin (style souhaité, contexte, usage prévu…)" value={message}
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
export default function RetouchePhotoPage() {
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
              <Camera size={13} /> Retouche & photo
            </motion.div>
            <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <MultiLineReveal lines={["Retouche photo", "professionnelle"]}
                highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08} lineClassName="justify-center" />
            </h1>
            <FadeReveal delay={0.2}>
              <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
                Nous améliorons vos visuels pour un rendu propre, cohérent et professionnel.
              </p>
            </FadeReveal>
            <motion.div variants={staggerContainerFast} initial="hidden" animate="show" className="mb-10 flex flex-wrap justify-center gap-4">
              {[{ label: "À partir de 5€", sub: "par visuel" }, { label: "2–5 jours", sub: "délai de livraison" }, { label: "Séries & lots", sub: "tarifs dégressifs" }].map(({ label, sub }) => (
                <motion.div key={label} variants={cardReveal} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-6 py-3.5 text-center">
                  <p className="text-lg font-extrabold" style={{ color: ACCENT }}>{label}</p>
                  <p className="text-[0.65rem] text-white/35">{sub}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
              <Link href="/contact?besoin=Retouche+photo" className="btn-primary px-8 py-4 text-base">Demander un devis <ArrowRight size={16} /></Link>
            </motion.div>
          </div>
        </section>

        {/* CE QUE NOUS FAISONS */}
        <section className="bg-[#110815] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Nos retouches</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que nous faisons pour vous</motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/60 max-w-xl mx-auto">Chaque visuel est traité avec soin pour correspondre à votre image de marque.</motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CE_QUE_NOUS_FAISONS.map(({ icon: Icon, color, rgb, title, desc }) => (
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

        {/* TYPES DE VISUELS */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Types de photos</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Quels types de visuels ?</motion.h2>
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

        {/* POURQUOI C'EST UTILE */}
        <section className="bg-[#110815] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Les bénéfices</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Pourquoi retoucher vos photos ?</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POURQUOI.map(({ icon: Icon, color, rgb, title, desc }) => (
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

        {/* TÉMOIGNAGES */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Avis clients</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce qu'en disent nos clients</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-3">
              {[
                { initial: "L", color: "#d946ef", rgb: "217,70,239", name: "Laura B.", role: "Fondatrice de boutique en ligne", stars: 5, text: "Mes photos produits étaient correctes mais pas vendeuses. Après retouche DJAMA, mes fiches produits ont clairement amélioré mon taux de conversion." },
                { initial: "M", color: "#60a5fa", rgb: "96,165,250", name: "Marc G.", role: "Photographe professionnel", stars: 5, text: "J'utilise DJAMA pour les traitements en série. Rapide, cohérent, fidèle à mon style. Excellent rapport qualité/prix pour des lots de 20+ photos." },
                { initial: "N", color: "#f9a826", rgb: "249,168,38", name: "Nadia S.", role: "Community manager", stars: 5, text: "Les visuels livrés correspondent exactement à la charte graphique demandée. Délai respecté, retouches propres. Je reviens régulièrement." },
              ].map(({ initial, color, rgb, name, role, stars, text }) => (
                <motion.div key={name} variants={cardReveal} className="rounded-3xl border border-white/[0.1] bg-white/[0.05] p-6">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} size={13} style={{ color: "#f9a826", fill: "#f9a826" }} />
                    ))}
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-white/70">"{text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-[#07070a]" style={{ background: color }}>
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{name}</p>
                      <p className="text-xs text-white/40">{role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA DEVIS */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}>
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Passez à l'action</motion.p>
              <motion.h2 variants={fadeIn} className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Prêt à sublimer vos photos ?</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mb-8 max-w-md text-sm text-white/60">
                Partagez vos visuels et vos attentes — on vous répond sous 24h avec un devis personnalisé.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4">
                <Link href="/contact?besoin=Retouche+photo" className="btn-primary px-8 py-4 text-base">
                  Demander un devis <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.p variants={fadeIn} className="mt-5 text-xs text-white/25">🔒 Sans engagement · Réponse sous 24h · Devis gratuit</motion.p>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#110815] py-14 sm:py-24">
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
              <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Prêt à sublimer vos photos ?</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/50 max-w-md mx-auto">Envoyez-nous vos visuels — on les retouche avec soin pour un rendu professionnel et cohérent.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact?besoin=Retouche+photo" className="btn-primary px-8 py-4 text-base">Demander un devis <ArrowRight size={16} /></Link>
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
