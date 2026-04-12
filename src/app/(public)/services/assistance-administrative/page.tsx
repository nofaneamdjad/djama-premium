"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  FileText, Shield, Clock, User, Mail, Phone, MessageSquare,
  Loader2, Send, ArrowLeft, Zap, Heart, Users, Building2,
  ClipboardList, Search, Inbox, LayoutList, AlertCircle,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease        = [0.16, 1, 0.3, 1] as const;
const ACCENT      = "#34d399";
const ACCENT_RGB  = "52,211,153";

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const POURQUOI = [
  {
    icon: Clock,  color: "#f472b6", rgb: "244,114,182",
    title: "Chronophage",
    desc: "Entre les formulaires en ligne, les pièces justificatives et les délais imposés, une simple démarche peut prendre des heures.",
  },
  {
    icon: AlertCircle, color: "#fb923c", rgb: "251,146,60",
    title: "Complexe et risqué",
    desc: "Une erreur dans un dossier peut entraîner un rejet, un délai supplémentaire ou des pénalités. Mieux vaut ne pas improviser.",
  },
  {
    icon: Heart, color: "#f87171", rgb: "248,113,113",
    title: "Stressant",
    desc: "Faire face à l'administration seul est souvent source de stress. Un accompagnement allège cette charge mentale.",
  },
  {
    icon: Zap, color: ACCENT, rgb: ACCENT_RGB,
    title: "DJAMA simplifie tout",
    desc: "On analyse votre situation, on prépare vos dossiers et on vous guide étape par étape. Vous gagnez du temps, vous évitez les erreurs.",
  },
];

const SERVICES_LISTE = [
  { icon: FileText,     color: "#60a5fa", rgb: "96,165,250",  title: "Rédaction de courriers",        desc: "Rédaction de courriers officiels, lettres de réclamation, demandes d'information ou de révision de décision." },
  { icon: Inbox,        color: "#a78bfa", rgb: "167,139,250", title: "Démarches en ligne",             desc: "Aide à la création de comptes sur les sites officiels (Ameli, impôts, CAF, Mon Service Public...) et réalisation des démarches." },
  { icon: ClipboardList,color: "#c9a55a", rgb: "201,165,90",  title: "Constitution de dossiers",       desc: "Rassemblement, vérification et mise en forme des pièces justificatives pour vos dossiers administratifs." },
  { icon: Search,       color: "#4ade80", rgb: "74,222,128",  title: "Accompagnement officiel",        desc: "Accompagnement dans les démarches auprès des organismes publics : mairie, préfecture, CAF, URSSAF, impôts, CPAM…" },
  { icon: LayoutList,   color: ACCENT,    rgb: ACCENT_RGB,    title: "Organisation & classement",      desc: "Tri, numérisation et organisation de vos documents pour un accès rapide à l'essentiel quand vous en avez besoin." },
  { icon: FolderOpen,   color: "#fb923c", rgb: "251,146,60",  title: "Suivi de dossiers",              desc: "Relances, vérification de l'avancement, alerte en cas de délai ou de pièce manquante. On ne laisse rien traîner." },
];

const POUR_QUI = [
  {
    icon: User,
    color: "#60a5fa", rgb: "96,165,250",
    who: "Particuliers",
    items: [
      "Aides administratives (CAF, logement, allocations…)",
      "Démarches en ligne (impôts, retraite, carte grise…)",
      "Dossiers officiels à constituer ou envoyer",
      "Courriers à rédiger ou litiges à gérer",
    ],
  },
  {
    icon: Building2,
    color: "#c9a55a", rgb: "201,165,90",
    who: "Entrepreneurs & indépendants",
    items: [
      "Gestion administrative quotidienne",
      "Organisation et classement des documents",
      "Aide aux formalités (URSSAF, KBIS, déclarations…)",
      "Rédaction de courriers professionnels",
    ],
  },
];

const ETAPES = [
  { num: "01", icon: Search,        color: "#c9a55a", rgb: "201,165,90",  title: "Analyse de votre besoin",             desc: "On échange sur votre situation, les démarches à effectuer et les documents déjà disponibles." },
  { num: "02", icon: ClipboardList, color: "#60a5fa", rgb: "96,165,250",  title: "Vérification des documents",          desc: "Identification des pièces justificatives nécessaires et vérification de leur conformité." },
  { num: "03", icon: FolderOpen,    color: "#4ade80", rgb: "74,222,128",  title: "Préparation du dossier",              desc: "Mise en forme, rédaction ou organisation des documents selon les exigences de l'organisme concerné." },
  { num: "04", icon: CheckCircle2,  color: ACCENT,    rgb: ACCENT_RGB,    title: "Accompagnement dans les démarches",   desc: "Guidage pas à pas pour soumettre le dossier, respecter les délais et assurer le suivi." },
];

const FAQ_ITEMS = [
  {
    q: "DJAMA peut-il faire les démarches à ma place ?",
    a: "DJAMA vous accompagne et prépare vos dossiers, mais certaines démarches officielles requièrent votre signature ou votre identification personnelle. Nous vous guidons pour que vous validiez vous-même l'essentiel.",
  },
  {
    q: "Quels organismes couvrez-vous ?",
    a: "Mairie, préfecture, CAF, CPAM, URSSAF, impôts, retraite, Pôle emploi/France Travail, logement social, et bien d'autres. Dites-nous votre besoin, on évalue.",
  },
  {
    q: "Est-ce que vous remplacez un avocat ou un expert-comptable ?",
    a: "Non. DJAMA aide à l'organisation et à la préparation de dossiers administratifs. Pour des conseils juridiques ou fiscaux complexes, nous vous orientons vers les professionnels compétents.",
  },
  {
    q: "Combien coûte le service ?",
    a: "L'accompagnement est sur devis en fonction du type et de la complexité de la démarche. Contactez-nous pour une estimation rapide et gratuite.",
  },
  {
    q: "Mes données sont-elles confidentielles ?",
    a: "Oui. Toutes les informations et documents que vous partagez avec DJAMA sont traités avec la plus stricte confidentialité et ne sont jamais transmis à des tiers.",
  },
];

const TYPE_OPTIONS = [
  "Courrier officiel à rédiger",
  "Démarche en ligne (CAF, impôts, CPAM…)",
  "Constitution d'un dossier administratif",
  "Organisation / classement de documents",
  "Suivi d'un dossier en cours",
  "Déclaration URSSAF / formalités entreprise",
  "Autre démarche administrative",
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
    <div
      className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB},0.08)` : "none" }}
    >
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <input
        type={type} placeholder={placeholder} value={value}
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
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ color: value ? "white" : "rgba(255,255,255,0.25)" }}
        className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#111113] [&>option]:text-white"
      >
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
    <div
      className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(52,211,153,0.25)] hover:shadow-sm"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-[#09090b] leading-relaxed">{q}</p>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{ borderColor: open ? `rgba(${ACCENT_RGB},0.4)` : "rgba(0,0,0,0.1)", background: open ? `rgba(${ACCENT_RGB},0.08)` : "transparent" }}
        >
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown size={14} style={{ color: open ? ACCENT : "#6b7280" }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
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
  const [nom,       setNom]       = useState("");
  const [email,     setEmail]     = useState("");
  const [telephone, setTelephone] = useState("");
  const [type,      setType]      = useState("");
  const [message,   setMessage]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const canSubmit = nom && isEmailValid(email) && type && message.length > 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nom, email, phone: telephone,
          source: "devis",
          subject: `Assistance administrative — ${type}`,
          message,
        }),
      });
      if (!res.ok) throw new Error("Envoi échoué");
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Réessayez ou écrivez-nous directement.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.05)] p-10 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(52,211,153,0.12)]">
          <CheckCircle2 size={26} className="text-[#34d399]" />
        </div>
        <h3 className="mb-2 text-lg font-extrabold text-white">Demande envoyée !</h3>
        <p className="text-sm text-white/50">Nous reviendrons vers vous sous 24h pour vous accompagner.</p>
      </motion.div>
    );
  }

  return (
    <motion.form onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
      transition={{ duration: 0.55, ease }} className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={User}  placeholder="Votre nom"     value={nom}       onChange={setNom}       required />
        <FieldInput icon={Mail}  type="email" placeholder="Adresse email" value={email} onChange={setEmail} validate={isEmailValid} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={Phone} type="tel" placeholder="Téléphone (optionnel)" value={telephone} onChange={setTelephone} />
        <FieldSelect icon={ClipboardList} placeholder="Type de demande" value={type} onChange={setType} options={TYPE_OPTIONS} />
      </div>
      <div
        className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: message.length > 10 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}
      >
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea
            placeholder="Décrivez votre démarche ou vos besoins administratifs…"
            value={message} onChange={(e) => setMessage(e.target.value)}
            rows={5} required
            className="flex-1 resize-none bg-transparent pb-4 text-sm text-white placeholder-white/25 outline-none"
          />
        </div>
        <div className="border-t border-white/[0.05] px-4 py-2 text-right">
          <span className="text-[0.6rem] text-white/20">{message.length} caractères</span>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">{error}</p>
      )}

      <button type="submit" disabled={!canSubmit || sending}
        className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</> : <><Send size={17} /> Envoyer ma demande de devis</>}
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
export default function AssistanceAdministrativePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main>

        {/* ════════════════════════════════════════════════════
            1. HERO
        ════════════════════════════════════════════════════ */}
        <section className="hero-dark hero-grid relative overflow-hidden pb-28 pt-36">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <div className="h-[350px] w-[500px] rounded-full bg-[rgba(52,211,153,0.07)] blur-[90px]" />
          </div>
          <div className="pointer-events-none absolute right-[-60px] top-[30%] h-[280px] w-[280px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <FadeReveal delay={0.05}>
              <span className="badge badge-gold-dark mb-6 inline-flex">
                <FolderOpen size={10} /> Assistance administrative
              </span>
            </FadeReveal>

            <h1 className="display-hero text-white">
              <MultiLineReveal
                lines={["L'administration,", "on s'en occupe avec vous"]}
                highlight={1}
                stagger={0.12} wordStagger={0.055} delay={0.08}
                lineClassName="justify-center"
              />
            </h1>

            <FadeReveal delay={0.6} as="p" className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-[1.85] text-white/50">
              DJAMA vous accompagne dans la gestion, l&apos;organisation et la préparation
              de vos démarches administratives — particuliers et professionnels.
            </FadeReveal>

            <FadeReveal delay={0.9} className="mt-9 flex flex-wrap justify-center gap-3">
              <a href="#devis" className="btn-primary px-8 py-4 text-base"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #22c55e)` } as React.CSSProperties}
              >
                Demander un devis <ArrowRight size={16} />
              </a>
              <a href="#services" className="btn-ghost px-8 py-4 text-base">
                Nos services <ChevronDown size={16} />
              </a>
            </FadeReveal>

            <FadeReveal delay={1.0} className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4 border-t border-white/[0.06] pt-10">
              {[
                { val: "Sur devis",   label: "Tarif selon la demande" },
                { val: "24h",         label: "Délai de réponse" },
                { val: "100%",        label: "Confidentiel" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-black text-white">{val}</p>
                  <p className="mt-0.5 text-xs text-white/35">{label}</p>
                </div>
              ))}
            </FadeReveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            2. POURQUOI SE FAIRE ACCOMPAGNER
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <Users size={10} /> Pourquoi se faire aider
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                L&apos;administration peut vite{" "}
                <span className="text-[#c9a55a]">devenir un casse-tête</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#6b7280]">
                Formulaires, délais, pièces justificatives… DJAMA prend en charge
                l&apos;organisation et la préparation pour que vous puissiez avancer sereinement.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {POURQUOI.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)]"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}>
                    <Icon size={19} style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-[#09090b]">{title}</h3>
                  <p className="text-xs leading-relaxed text-[#6b7280]">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            3. NOS SERVICES
        ════════════════════════════════════════════════════ */}
        <section id="services" className="bg-[var(--surface)] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <Zap size={10} /> Ce que nous faisons
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Nos services{" "}
                <span className="text-[#c9a55a]">d&apos;assistance</span>
              </h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {SERVICES_LISTE.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="flex gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:border-[rgba(52,211,153,0.3)] hover:shadow-md"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-sm font-bold text-[#09090b]">{title}</h3>
                    <p className="text-xs leading-relaxed text-[#6b7280]">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            4. POUR QUI
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <Users size={10} /> Profils concernés
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Pour{" "}
                <span className="text-[#c9a55a]">qui&nbsp;?</span>
              </h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-6 sm:grid-cols-2"
            >
              {POUR_QUI.map(({ icon: Icon, color, rgb, who, items }) => (
                <motion.div key={who} variants={cardReveal}
                  className="overflow-hidden rounded-[1.5rem] border border-[#e5e7eb] bg-white shadow-sm transition-all duration-300 hover:border-transparent hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-[#f3f4f6] p-6 pb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}>
                      <Icon size={19} style={{ color }} />
                    </div>
                    <h3 className="text-base font-extrabold text-[#09090b]">{who}</h3>
                  </div>
                  {/* Items */}
                  <ul className="space-y-3 p-6">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[#4b5563]">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            5. NOTRE MÉTHODE
        ════════════════════════════════════════════════════ */}
        <section className="hero-dark relative overflow-hidden py-24">
          <div className="pointer-events-none absolute left-[10%] top-[20%] h-[300px] w-[400px] rounded-full bg-[rgba(52,211,153,0.05)] blur-[80px]" />
          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
                <ClipboardList size={10} /> Processus
              </motion.span>
              <h2 className="display-section text-white">
                Notre méthode{" "}
                <span className="text-gold">simple et claire</span>
              </h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast} className="flex flex-col gap-4">
              {ETAPES.map(({ num, icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={num} variants={cardReveal}
                  className="flex items-start gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.05]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                    style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.22)`, color }}>
                    {num}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <Icon size={15} style={{ color }} />
                      <h3 className="text-sm font-bold text-white">{title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            6. TRANSPARENCE
        ════════════════════════════════════════════════════ */}
        <section className="bg-[var(--surface)] py-16">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
              transition={{ duration: 0.55, ease }}
              className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(52,211,153,0.22)] bg-[#09090b] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[200px] w-[350px] rounded-full bg-[rgba(52,211,153,0.05)] blur-[60px]" />
              </div>
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.25)` }}>
                  <Shield size={20} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="mb-2 text-base font-extrabold text-white">Transparence & limites de notre accompagnement</p>
                  <p className="text-sm leading-relaxed text-white/55">
                    DJAMA accompagne ses clients dans leurs démarches administratives
                    et l&apos;organisation de leurs dossiers.
                    Nous <strong className="text-white/80 font-semibold">ne remplaçons pas les administrations</strong> ni
                    les organismes officiels.
                    Pour des conseils juridiques ou fiscaux, nous vous orientons vers les professionnels compétents.
                  </p>
                  <p className="mt-3 text-xs text-white/30">
                    Toutes les informations partagées avec DJAMA sont traitées avec la stricte confidentialité.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            7. FORMULAIRE DEVIS
        ════════════════════════════════════════════════════ */}
        <section id="devis" className="hero-dark py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-10 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
                <FileText size={10} /> Demande d&apos;accompagnement
              </motion.span>
              <h2 className="display-section text-white">
                Dites-nous ce dont{" "}
                <span className="text-gold">vous avez besoin</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/40">
                Décrivez votre démarche en quelques mots. Nous vous répondons sous 24h
                avec une proposition adaptée à votre situation.
              </p>
            </motion.div>
            <DevisForm />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            8. FAQ
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-12 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <MessageSquare size={10} /> Questions fréquentes
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Vous avez{" "}
                <span className="text-[#c9a55a]">des questions&nbsp;?</span>
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast} className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <motion.div key={i} variants={cardReveal}>
                  <FaqItem q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            9. CTA FINAL
        ════════════════════════════════════════════════════ */}
        <section className="hero-dark relative overflow-hidden py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <div className="h-[400px] w-[600px] rounded-full bg-[rgba(52,211,153,0.06)] blur-[90px]" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ duration: 0.65, ease }}
            className="relative z-10 mx-auto max-w-2xl px-6 text-center"
          >
            <span className="badge badge-gold-dark mb-6 inline-flex">
              <Sparkles size={10} /> Prêt à simplifier vos démarches&nbsp;?
            </span>
            <h2 className="display-section text-white">
              Arrêtez de subir{" "}
              <span className="text-gold">l&apos;administration.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/45">
              Confiez-nous vos dossiers. On s&apos;occupe de l&apos;organisation,
              vous vous concentrez sur l&apos;essentiel.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a href="#devis" className="btn-primary px-8 py-4 text-base">
                <FileText size={17} /> Demander un devis
              </a>
              <Link href="/services" className="btn-ghost px-8 py-4 text-base">
                <ArrowLeft size={16} /> Voir tous les services
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-white/25">
              <span>✓ Réponse sous 24h</span>
              <span>✓ Sur devis</span>
              <span>✓ Particuliers & pros</span>
              <span>✓ 100% confidentiel</span>
            </div>
          </motion.div>
        </section>

      </main>
      <Footer />
    </>
  );
}
