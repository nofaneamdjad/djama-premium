"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Shield, Zap, Clock, User, Mail, Phone,
  MessageSquare, Loader2, Send, ArrowLeft, Building2,
  ClipboardList, BookOpen, TrendingUp, UserCheck, Briefcase,
  ShoppingBag, Star, FileText, Search,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#fb923c";
const ACCENT_RGB = "251,146,60";

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const POURQUOI = [
  {
    icon: Zap, color: "#fb923c", rgb: "251,146,60",
    title: "Statut rapide à créer",
    desc:  "Le statut auto-entrepreneur est l'un des plus simples à obtenir en France. En quelques jours seulement, votre activité peut être officiellement lancée.",
  },
  {
    icon: ClipboardList, color: "#60a5fa", rgb: "96,165,250",
    title: "Démarches allégées",
    desc:  "Contrairement à d'autres formes juridiques, la micro-entreprise implique peu de formalités administratives. Idéal pour se concentrer sur son activité.",
  },
  {
    icon: TrendingUp, color: "#4ade80", rgb: "74,222,128",
    title: "Idéal pour commencer",
    desc:  "Vous testez votre activité sans prendre de risque financier majeur. Les cotisations sont proportionnelles au chiffre d'affaires réellement encaissé.",
  },
  {
    icon: UserCheck, color: "#f472b6", rgb: "244,114,182",
    title: "Pour tous les profils",
    desc:  "Indépendants, freelances, commerçants, prestataires de services, artisans — le statut auto-entrepreneur s'adapte à une grande variété d'activités.",
  },
];

const ACCOMPAGNEMENT = [
  { icon: BookOpen,     color: "#60a5fa", rgb: "96,165,250",  title: "Explication des étapes",              desc: "On vous explique clairement les étapes de création : déclaration d'activité, choix du code APE, obligations fiscales et sociales." },
  { icon: Search,       color: "#4ade80", rgb: "74,222,128",  title: "Aide au choix de l'activité",         desc: "Vous hésitez sur la nature de votre activité ou son code NAF ? On vous aide à l'identifier correctement pour éviter les erreurs dès le départ." },
  { icon: FileText,     color: ACCENT,    rgb: ACCENT_RGB,    title: "Préparation des informations",        desc: "Nous vous aidons à rassembler toutes les informations nécessaires : identité, adresse, nature de l'activité, régime fiscal choisi." },
  { icon: ClipboardList,color: "#f9a826", rgb: "249,168,38",  title: "Assistance pour le dossier",          desc: "On vous accompagne dans le remplissage correct du formulaire de déclaration sur le site officiel pour éviter tout rejet ou retard." },
  { icon: CheckCircle2, color: "#f472b6", rgb: "244,114,182", title: "Jusqu'à la validation du statut",     desc: "On reste à vos côtés jusqu'à la réception de votre numéro SIRET et la confirmation officielle de votre statut auto-entrepreneur." },
  { icon: MessageSquare,color: "#34d399", rgb: "52,211,153",  title: "Réponses à vos questions",            desc: "Délais, obligations, TVA, plafonds de CA, déclarations URSSAF — on répond simplement à vos questions de démarrage." },
];

const POUR_QUI = [
  {
    icon: Briefcase, color: "#60a5fa", rgb: "96,165,250",
    who: "Freelances",
    desc: "Développeurs, graphistes, consultants, rédacteurs — vous voulez facturer vos prestations de manière légale et professionnelle.",
    tags: ["Prestation intellectuelle", "Facturation", "Indépendance"],
  },
  {
    icon: ShoppingBag, color: ACCENT, rgb: ACCENT_RGB,
    who: "Vendeurs",
    desc: "Vous vendez des produits physiques ou en ligne et souhaitez régulariser votre activité commerciale dans un cadre légal simple.",
    tags: ["Vente en ligne", "Commerce", "Marketplace"],
  },
  {
    icon: Star, color: "#f9a826", rgb: "249,168,38",
    who: "Prestataires de services",
    desc: "Coiffeurs à domicile, assistants virtuels, livreurs, coachs — vous proposez des services et souhaitez démarrer en toute légalité.",
    tags: ["Services à la personne", "Coaching", "À domicile"],
  },
  {
    icon: Rocket, color: "#f472b6", rgb: "244,114,182",
    who: "Créateurs d'activité",
    desc: "Vous avez une idée, un projet, une passion que vous voulez monétiser. Le statut auto-entrepreneur est votre premier tremplin.",
    tags: ["Projet", "Passion", "Premier pas"],
  },
  {
    icon: UserCheck, color: "#4ade80", rgb: "74,222,128",
    who: "Personnes en reconversion",
    desc: "Vous changez de voie et souhaitez tester votre nouvelle activité de façon légale, sans risquer de tout perdre dès le départ.",
    tags: ["Reconversion", "Transition", "Légalité"],
  },
];

const ETAPES = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90",  title: "Prise de contact",                desc: "On fait connaissance et vous expliquez votre projet : activité souhaitée, objectifs, questions que vous vous posez." },
  { num: "02", icon: Search,        color: "#60a5fa", rgb: "96,165,250",  title: "Analyse de votre activité",       desc: "On identifie le bon code d'activité, le régime fiscal adapté et on lève les doutes sur votre situation personnelle." },
  { num: "03", icon: FileText,      color: ACCENT,    rgb: ACCENT_RGB,    title: "Préparation du dossier",          desc: "On rassemble toutes les informations nécessaires et on vous guide dans le remplissage du formulaire officiel." },
  { num: "04", icon: CheckCircle2,  color: "#4ade80", rgb: "74,222,128",  title: "Accompagnement jusqu'à la création", desc: "On reste disponible jusqu'à la réception de votre SIRET et la confirmation officielle de votre statut. Bienvenue dans l'entrepreneuriat !" },
];

const FAQ_ITEMS = [
  {
    q: "DJAMA crée-t-il le statut à ma place ?",
    a: "Non. La déclaration d'activité doit être effectuée par vous-même sur le site officiel (autoentrepreneur.urssaf.fr). DJAMA vous accompagne dans chaque étape, vous aide à préparer les informations et reste disponible pendant la démarche.",
  },
  {
    q: "Combien de temps faut-il pour créer son auto-entreprise ?",
    a: "La déclaration en ligne prend en général moins de 30 minutes si vous avez toutes vos informations. La réception du numéro SIRET intervient généralement sous 1 à 5 jours ouvrés.",
  },
  {
    q: "Ai-je besoin d'un expert-comptable pour créer mon auto-entreprise ?",
    a: "Non, ce n'est pas obligatoire pour la création. Le statut auto-entrepreneur est justement pensé pour être accessible sans expertise comptable. DJAMA vous guide pour que tout se passe bien dès le départ.",
  },
  {
    q: "Quelle différence entre auto-entrepreneur et micro-entreprise ?",
    a: "Ce sont deux termes pour désigner le même statut. Depuis 2016, le terme officiel est \"micro-entrepreneur\", mais l'expression \"auto-entrepreneur\" reste couramment utilisée. Les règles sont identiques.",
  },
  {
    q: "Combien coûte votre accompagnement ?",
    a: "La prestation est sur devis selon votre projet et vos besoins. Contactez-nous pour une estimation gratuite et sans engagement.",
  },
];

const ACTIVITE_OPTIONS = [
  "Prestation de services (conseil, formation, coaching…)",
  "Activité commerciale (vente de produits)",
  "Activité artisanale",
  "Activité libérale",
  "Vente en ligne / e-commerce",
  "Autre",
];

/* ─────────────────────────────────────────────────────────
   SOUS-COMPOSANTS
───────────────────────────────────────────────────────── */
function isEmailValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function FieldInput({
  icon: Icon, type = "text", placeholder, value, onChange, validate, required,
}: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  validate?: (v: string) => boolean; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isValid = validate ? validate(value) : value.length > 0;
  const showOk  = touched && value && isValid;
  const showErr = touched && value && validate && !isValid;
  const border  = showErr ? "rgba(248,113,113,0.5)"
                : showOk  ? "rgba(52,211,153,0.45)"
                : focused ? `rgba(${ACCENT_RGB},0.5)`
                : "rgba(255,255,255,0.09)";
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB},0.08)` : "none" }}>
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <input type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setTouched(true); }}
        required={required}
        className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
      />
      <AnimatePresence>
        {showOk && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <CheckCircle2 size={14} className="text-[#34d399]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldSelect({
  icon: Icon, placeholder, value, onChange, options,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; options: string[];
}) {
  const [focused, setFocused] = useState(false);
  const border = value ? "rgba(52,211,153,0.35)" : focused ? `rgba(${ACCENT_RGB},0.45)` : "rgba(255,255,255,0.09)";
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200" style={{ borderColor: border }}>
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
    <div className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(251,146,60,0.25)] hover:shadow-sm" onClick={onToggle}>
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

/* ─────────────────────────────────────────────────────────
   FORMULAIRE
───────────────────────────────────────────────────────── */
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
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nom, email, phone: tel,
          source:  "devis",
          subject: `Création auto-entrepreneur — ${activite}`,
          message,
        }),
      });
      if (!res.ok) throw new Error("Envoi échoué");
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Réessayez ou contactez-nous directement.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-[rgba(251,146,60,0.25)] bg-[rgba(251,146,60,0.05)] p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(251,146,60,0.12)]">
          <CheckCircle2 size={26} style={{ color: ACCENT }} />
        </div>
        <h3 className="mb-2 text-lg font-extrabold text-white">Demande envoyée !</h3>
        <p className="text-sm text-white/50">Nous vous répondons sous 24h pour organiser votre accompagnement.</p>
      </motion.div>
    );
  }

  return (
    <motion.form onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
      transition={{ duration: 0.55, ease }} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={User}  placeholder="Votre nom"     value={nom}   onChange={setNom}   required />
        <FieldInput icon={Mail}  type="email" placeholder="Adresse email"  value={email} onChange={setEmail} validate={isEmailValid} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={Phone} type="tel" placeholder="Téléphone (optionnel)" value={tel} onChange={setTel} />
        <FieldSelect icon={Briefcase} placeholder="Type d'activité" value={activite} onChange={setActivite} options={ACTIVITE_OPTIONS} />
      </div>
      <div className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre projet ou votre besoin (activité, questions, contexte…)" value={message}
            onChange={(e) => setMessage(e.target.value)} rows={5} required
            className="flex-1 resize-none bg-transparent pb-4 text-sm text-white placeholder-white/25 outline-none" />
        </div>
        <div className="border-t border-white/[0.05] px-4 py-2 text-right">
          <span className="text-[0.6rem] text-white/20">{message.length} caractères</span>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">{error}</p>
      )}

      <button type="submit" disabled={!canSubmit || sending}
        className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50">
        {sending
          ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</>
          : <><Send size={17} /> Demander un devis</>}
      </button>
      <p className="text-center text-[0.68rem] text-white/20">
        🔒 Confidentialité garantie · Réponse sous 24h · Sans engagement
      </p>
    </motion.form>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function CreationAutoEntrepreneurPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main>

        {/* ════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#09090b] pb-24 pt-32">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/4 rounded-full opacity-20"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.35) 0%, transparent 70%)` }} />
          </div>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            {/* Back link */}
            <motion.div {...fadeIn} className="mb-8">
              <Link href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 transition-colors hover:text-white">
                <ArrowLeft size={13} /> Tous les services
              </Link>
            </motion.div>

            {/* Badge */}
            <motion.div {...fadeIn} transition={{ delay: 0.05 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium"
              style={{ borderColor: `rgba(${ACCENT_RGB},0.3)`, background: `rgba(${ACCENT_RGB},0.08)`, color: ACCENT }}>
              <Rocket size={13} />
              Lancement d'activité
            </motion.div>

            {/* Title */}
            <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <MultiLineReveal
                lines={["Créez votre auto-entreprise", "simplement"]}
                highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08}
                lineClassName="justify-center"
              />
            </h1>

            <FadeReveal delay={0.2}>
              <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
                DJAMA vous accompagne dans les démarches pour lancer votre activité rapidement et sereinement.
              </p>
            </FadeReveal>

            {/* Stats */}
            <motion.div
              variants={staggerContainerFast} initial="hidden" animate="show"
              className="mb-10 flex flex-wrap justify-center gap-4">
              {[
                { label: "À partir de 29€", sub: "accompagnement sur devis" },
                { label: "48h",             sub: "délai de traitement" },
                { label: "100% Guidé",      sub: "étape par étape" },
              ].map(({ label, sub }) => (
                <motion.div key={label} variants={cardReveal}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-6 py-3.5 text-center">
                  <p className="text-lg font-extrabold" style={{ color: ACCENT }}>{label}</p>
                  <p className="text-[0.65rem] text-white/35">{sub}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
              <Link href="#devis"
                className="btn-primary px-8 py-4 text-base">
                Demander un devis <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Transparency note */}
            <motion.div {...fadeIn} transition={{ delay: 0.45 }}
              className="mt-10 inline-flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 text-left">
              <Shield size={15} className="mt-0.5 shrink-0 text-white/30" />
              <p className="text-[0.72rem] leading-relaxed text-white/35">
                DJAMA accompagne les entrepreneurs dans leurs démarches de création. Nous ne remplaçons pas
                les organismes officiels ni un expert-comptable, mais simplifions les étapes pour vous.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            POURQUOI SE LANCER EN AUTO-ENTREPRENEUR
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#0c0c0e] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}
              className="mb-14 text-center">
              <motion.p variants={fadeIn}
                className="mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: ACCENT }}>
                Pourquoi ce statut
              </motion.p>
              <motion.h2 variants={fadeIn}
                className="text-3xl font-extrabold text-white sm:text-4xl">
                Pourquoi se lancer en auto-entrepreneur
              </motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/45 max-w-xl mx-auto">
                Un statut simple, flexible et accessible — conçu pour ceux qui veulent démarrer vite.
              </motion.p>
            </motion.div>

            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POURQUOI.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: `rgba(${rgb},0.1)` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            CE QUE DJAMA FAIT POUR VOUS
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#09090b] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}
              className="mb-14 text-center">
              <motion.p variants={fadeIn}
                className="mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: ACCENT }}>
                Notre accompagnement
              </motion.p>
              <motion.h2 variants={fadeIn}
                className="text-3xl font-extrabold text-white sm:text-4xl">
                Ce que DJAMA fait pour vous
              </motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/45 max-w-xl mx-auto">
                De la première question à la validation officielle de votre statut — on vous guide à chaque étape.
              </motion.p>
            </motion.div>

            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ACCOMPAGNEMENT.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: `rgba(${rgb},0.1)` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            POUR QUI
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#0c0c0e] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}
              className="mb-14 text-center">
              <motion.p variants={fadeIn}
                className="mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: ACCENT }}>
                Profils concernés
              </motion.p>
              <motion.h2 variants={fadeIn}
                className="text-3xl font-extrabold text-white sm:text-4xl">
                Ce service est fait pour vous si…
              </motion.h2>
            </motion.div>

            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {POUR_QUI.map(({ icon: Icon, color, rgb, who, desc, tags }) => (
                <motion.div key={who} variants={cardReveal}
                  className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: `rgba(${rgb},0.1)` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{who}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-white/45">{desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full border px-2.5 py-1 text-[0.6rem] font-medium"
                        style={{ borderColor: `rgba(${rgb},0.25)`, color, background: `rgba(${rgb},0.07)` }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            LES ÉTAPES
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#09090b] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}
              className="mb-14 text-center">
              <motion.p variants={fadeIn}
                className="mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: ACCENT }}>
                Notre méthode
              </motion.p>
              <motion.h2 variants={fadeIn}
                className="text-3xl font-extrabold text-white sm:text-4xl">
                4 étapes pour lancer votre activité
              </motion.h2>
            </motion.div>

            <div className="relative">
              {/* Vertical line (desktop) */}
              <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />

              <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport}
                className="space-y-6">
                {ETAPES.map(({ num, icon: Icon, color, rgb, title, desc }) => (
                  <motion.div key={num} variants={cardReveal}
                    className="group relative flex gap-6 rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                    {/* Step bubble */}
                    <div className="relative z-10 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border"
                      style={{ background: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.25)` }}>
                      <span className="text-[0.6rem] font-bold" style={{ color: `rgba(${rgb},0.7)` }}>{num}</span>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                      <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                    </div>
                    {/* Number watermark */}
                    <span className="pointer-events-none absolute right-6 top-4 text-5xl font-black opacity-[0.04] select-none"
                      style={{ color }}>{num}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            TRANSPARENCE
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#0c0c0e] py-20">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
              transition={{ duration: 0.55, ease }}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `rgba(${ACCENT_RGB},0.1)` }}>
                <Shield size={22} style={{ color: ACCENT }} />
              </div>
              <h3 className="mb-3 text-lg font-extrabold text-white">Notre engagement de transparence</h3>
              <p className="text-sm leading-relaxed text-white/50">
                DJAMA accompagne les entrepreneurs dans leurs démarches administratives de création d'activité.
                Nous ne remplaçons pas les organismes officiels (URSSAF, CFE, INPI) ni un expert-comptable,
                mais nous aidons à simplifier les étapes et à éviter les erreurs courantes.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {["Accompagnement humain", "Sans jargon", "Réponse sous 48h", "Sans engagement"].map((tag) => (
                  <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[0.65rem] font-medium text-white/40">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FORMULAIRE
        ════════════════════════════════════════════════════ */}
        <section id="devis" className="bg-[#09090b] py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}
              className="mb-10 text-center">
              <motion.p variants={fadeIn}
                className="mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: ACCENT }}>
                Passez à l'action
              </motion.p>
              <motion.h2 variants={fadeIn}
                className="text-3xl font-extrabold text-white sm:text-4xl">
                Demandez votre devis
              </motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/45">
                Dites-nous en quelques mots ce que vous souhaitez créer — on revient vers vous sous 24h.
              </motion.p>
            </motion.div>

            <DevisForm />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FAQ
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#0c0c0e] py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}
              className="mb-10 text-center">
              <motion.p variants={fadeIn}
                className="mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: ACCENT }}>
                Questions fréquentes
              </motion.p>
              <motion.h2 variants={fadeIn}
                className="text-3xl font-extrabold text-white sm:text-4xl">
                Vous avez des questions ?
              </motion.h2>
            </motion.div>

            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <FaqItem key={i} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            CTA FINAL
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#09090b] pb-24 pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.4) 0%, transparent 70%)` }} />
          </div>

          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
              transition={{ duration: 0.6, ease }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: `rgba(${ACCENT_RGB},0.12)` }}>
                <Sparkles size={26} style={{ color: ACCENT }} />
              </div>
              <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
                Prêt à vous lancer ?
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-white/50 max-w-md mx-auto">
                Démarrez votre activité en toute sérénité avec l'accompagnement DJAMA.
                Simple, rapide et sans stress.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="#devis"
                  className="btn-primary px-8 py-4 text-base">
                  Demander un devis <ArrowRight size={16} />
                </Link>
                <Link href="/services"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/70 transition-all hover:bg-white/[0.07] hover:text-white">
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
