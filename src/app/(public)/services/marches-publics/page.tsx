"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  FileText, Shield, Search, ClipboardList, Send, Loader2,
  Building2, TrendingUp, Clock, Target, AlertCircle,
  ArrowLeft, Mail, Phone, User, MessageSquare, Zap, Award,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#f9a826";
const ACCENT_RGB = "249,168,38";

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const POURQUOI = [
  {
    icon: TrendingUp,
    color: "#60a5fa", rgb: "96,165,250",
    title: "Des opportunités concrètes",
    desc:  "Les marchés publics représentent des centaines de milliards d'euros de commandes chaque année. Des PME à la TPE, toutes peuvent candidater.",
  },
  {
    icon: Shield,
    color: "#4ade80", rgb: "74,222,128",
    title: "Des contrats sécurisés",
    desc:  "Les marchés publics offrent une sécurité contractuelle forte : délais de paiement réglementés, cahier des charges clair, engagements écrits.",
  },
  {
    icon: Clock,
    color: "#a78bfa", rgb: "167,139,250",
    title: "Des projets à long terme",
    desc:  "Décrocher un marché public peut garantir une activité stable sur plusieurs mois ou années — un levier de croissance durable.",
  },
  {
    icon: Award,
    color: ACCENT, rgb: ACCENT_RGB,
    title: "Valoriser votre entreprise",
    desc:  "Répondre à des appels d'offres renforce votre crédibilité, structure vos processus internes et améliore la qualité de vos dossiers commerciaux.",
  },
];

const ACCOMPAGNEMENT = [
  { icon: Search,        color: "#60a5fa", rgb: "96,165,250",  title: "Analyse du dossier",       desc: "Lecture complète du DCE (Dossier de Consultation des Entreprises) : règlement, CCTP, CCAP, BPU. Identification des points-clés et des exigences." },
  { icon: ClipboardList, color: "#4ade80", rgb: "74,222,128",  title: "Exigences administratives", desc: "Vérification des pièces obligatoires (Kbis, attestations fiscales et sociales, DC1, DC2...) et aide à leur préparation." },
  { icon: FileText,      color: "#a78bfa", rgb: "167,139,250", title: "Constitution du dossier",   desc: "Aide à la mise en forme du dossier de candidature et de l'offre technique selon les exigences du cahier des charges." },
  { icon: Target,        color: ACCENT,    rgb: ACCENT_RGB,    title: "Structuration technique",   desc: "Rédaction et organisation claire de la réponse technique : méthodologie, moyens humains et matériels, références, planning." },
  { icon: Sparkles,      color: "#f472b6", rgb: "244,114,182", title: "Relecture & optimisation",  desc: "Revue complète du dossier pour améliorer la clarté, la cohérence et la présentation. Vérification de la conformité avant dépôt." },
  { icon: Shield,        color: "#34d399", rgb: "52,211,153",  title: "Documents obligatoires",    desc: "Préparation des attestations, déclarations sur l'honneur et autres documents réglementaires requis pour la recevabilité du dossier." },
];

const TYPES_MARCHES = [
  { emoji: "🏛️", title: "Marchés publics",      desc: "Collectivités locales, ministères, hôpitaux, établissements publics. Tous les organismes soumis au Code de la commande publique." },
  { emoji: "🏢", title: "Appels d'offres privés", desc: "Grands comptes, ETI et multinationales qui publient leurs propres appels d'offres pour sélectionner leurs prestataires." },
  { emoji: "🤝", title: "Sous-traitance",         desc: "Répondre en tant que sous-traitant d'un titulaire principal, avec un dossier de présentation solide et conforme." },
  { emoji: "🔗", title: "Partenariats & GIE",     desc: "Candidature en groupement d'entreprises (mandataire / cotraitant) pour répondre à des lots plus importants." },
];

const ETAPES = [
  { num: "01", icon: Search,        color: "#c9a55a", rgb: "201,165,90",  title: "Analyse du besoin",                desc: "Échange sur le marché ciblé, le profil de votre entreprise et votre capacité à répondre." },
  { num: "02", icon: FileText,      color: "#60a5fa", rgb: "96,165,250",  title: "Étude du dossier d'appel d'offres", desc: "Lecture approfondie du DCE, identification des exigences et des critères de notation." },
  { num: "03", icon: ClipboardList, color: "#4ade80", rgb: "74,222,128",  title: "Dossier administratif",            desc: "Préparation et vérification des pièces administratives obligatoires pour la candidature." },
  { num: "04", icon: Target,        color: "#a78bfa", rgb: "167,139,250", title: "Réponse technique",                desc: "Structuration et rédaction de l'offre technique selon les attentes du cahier des charges." },
  { num: "05", icon: CheckCircle2,  color: "#34d399", rgb: "52,211,153",  title: "Vérification finale avant dépôt",  desc: "Contrôle de conformité, complétude du dossier et validation avant la date limite de remise." },
];

const FAQ_ITEMS = [
  {
    q: "DJAMA garantit-il l'obtention du marché ?",
    a: "Non. DJAMA accompagne la préparation et la structuration du dossier. La décision d'attribution appartient exclusivement à l'organisme qui publie l'appel d'offres. Nous ne pouvons pas influencer ni garantir le résultat.",
  },
  {
    q: "Mon entreprise peut-elle répondre à des marchés publics ?",
    a: "La plupart des entreprises peuvent candidater, quelle que soit leur taille. Certains marchés sont spécifiquement réservés aux PME. Nous analysons votre profil pour identifier les opportunités adaptées.",
  },
  {
    q: "Quels documents faut-il préparer ?",
    a: "En général : Kbis récent, attestations fiscales et sociales, assurance professionnelle, références clients, et les formulaires réglementaires DC1/DC2 ou DUME. La liste précise dépend du marché.",
  },
  {
    q: "Combien de temps prend la préparation d'un dossier ?",
    a: "En fonction de la complexité du marché, comptez de quelques jours à plusieurs semaines. Il est impératif de respecter la date limite de dépôt fixée par l'acheteur.",
  },
  {
    q: "Accompagnez-vous aussi les marchés privés ?",
    a: "Oui. Notre accompagnement couvre les appels d'offres privés, la sous-traitance et les candidatures en groupement, avec la même rigueur qu'un marché public.",
  },
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
  const isValid  = validate ? validate(value) : value.length > 0;
  const showOk   = touched && value && isValid;
  const showErr  = touched && value && validate && !isValid;
  const border   = showErr  ? "rgba(248,113,113,0.5)"
                 : showOk   ? "rgba(52,211,153,0.45)"
                 : focused  ? "rgba(249,168,38,0.5)"
                 : "rgba(255,255,255,0.09)";
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? "0 0 0 3px rgba(249,168,38,0.08)" : "none" }}
    >
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
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

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(249,168,38,0.25)] hover:shadow-sm"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-[#09090b] leading-relaxed">{q}</p>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{
            borderColor: open ? `rgba(${ACCENT_RGB},0.4)` : "rgba(0,0,0,0.1)",
            background:  open ? `rgba(${ACCENT_RGB},0.08)` : "transparent",
          }}
        >
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown size={14} style={{ color: open ? ACCENT : "#6b7280" }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="border-t border-black/[0.05] px-6 pb-5 pt-4 text-sm leading-relaxed text-[#4b5563]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FORMULAIRE DE DEMANDE
───────────────────────────────────────────────────────── */
function DevisForm() {
  const [nom,        setNom]        = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [email,      setEmail]      = useState("");
  const [telephone,  setTelephone]  = useState("");
  const [projet,     setProjet]     = useState("");
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const canSubmit = nom && entreprise && isEmailValid(email) && projet.length > 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    `${nom} — ${entreprise}`,
          email,
          phone:   telephone,
          source:  "devis",
          subject: "Demande d'accompagnement marchés publics",
          message: projet,
        }),
      });
      if (!res.ok) throw new Error("Envoi échoué");
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Réessayez ou contactez-nous par email.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.05)] p-10 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(52,211,153,0.12)]">
          <CheckCircle2 size={26} className="text-[#34d399]" />
        </div>
        <h3 className="mb-2 text-lg font-extrabold text-white">Demande envoyée !</h3>
        <p className="text-sm text-white/50">
          Nous reviendrons vers vous sous 24h pour discuter de votre projet.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.55, ease }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={User}      placeholder="Votre nom"                  value={nom}        onChange={setNom}        required />
        <FieldInput icon={Building2} placeholder="Nom de l'entreprise"        value={entreprise} onChange={setEntreprise} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={Mail}  type="email" placeholder="Adresse email"     value={email}     onChange={setEmail}     validate={isEmailValid} required />
        <FieldInput icon={Phone} type="tel"   placeholder="Téléphone (optionnel)" value={telephone} onChange={setTelephone} />
      </div>

      {/* Textarea projet */}
      <div
        className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: projet.length > 10 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}
      >
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: projet ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea
            placeholder="Décrivez votre projet ou l'appel d'offres auquel vous souhaitez répondre…"
            value={projet}
            onChange={(e) => setProjet(e.target.value)}
            rows={5}
            required
            className="flex-1 resize-none bg-transparent pb-4 text-sm text-white placeholder-white/25 outline-none"
          />
        </div>
        <div className="border-t border-white/[0.05] px-4 py-2 text-right">
          <span className="text-[0.6rem] text-white/20">{projet.length} caractères</span>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || sending}
        className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? (
          <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</>
        ) : (
          <><Send size={17} /> Envoyer ma demande de devis</>
        )}
      </button>

      <p className="text-center text-[0.68rem] text-white/20">
        🔒 Vos informations restent confidentielles · Réponse sous 24h · Sans engagement
      </p>
    </motion.form>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function MarchesPublicsPage() {
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
            <div className="h-[350px] w-[500px] rounded-full bg-[rgba(249,168,38,0.07)] blur-[90px]" />
          </div>
          <div className="pointer-events-none absolute right-[-60px] top-[30%] h-[280px] w-[280px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <FadeReveal delay={0.05}>
              <span className="badge badge-gold-dark mb-6 inline-flex">
                <Briefcase size={10} /> Accompagnement marchés publics & privés
              </span>
            </FadeReveal>

            <h1 className="display-hero text-white">
              <MultiLineReveal
                lines={["Répondez aux appels d'offres", "avec un dossier solide"]}
                highlight={1}
                stagger={0.12}
                wordStagger={0.055}
                delay={0.08}
                lineClassName="justify-center"
              />
            </h1>

            <FadeReveal delay={0.6} as="p" className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-[1.85] text-white/50">
              DJAMA accompagne les entreprises dans la préparation et la structuration
              de leur réponse aux appels d&apos;offres — de l&apos;analyse du dossier
              jusqu&apos;à la vérification finale avant dépôt.
            </FadeReveal>

            {/* Mention transparence */}
            <FadeReveal delay={0.75}>
              <div className="mx-auto mt-7 flex max-w-lg items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 text-left">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-[rgba(249,168,38,0.7)]" />
                <p className="text-xs leading-relaxed text-white/40">
                  Nous n&apos;assurons <strong className="text-white/65 font-semibold">pas l&apos;obtention du marché</strong>.
                  Notre rôle est de vous aider à préparer le meilleur dossier possible.
                  La décision finale appartient à l&apos;organisme acheteur.
                </p>
              </div>
            </FadeReveal>

            <FadeReveal delay={0.9} className="mt-9 flex flex-wrap justify-center gap-3">
              <a
                href="#devis"
                className="btn-primary px-8 py-4 text-base"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #e08e10)` } as React.CSSProperties}
              >
                Demander un devis <ArrowRight size={16} />
              </a>
              <a href="#methode" className="btn-ghost px-8 py-4 text-base">
                Voir notre méthode <ChevronDown size={16} />
              </a>
            </FadeReveal>

            {/* Stats */}
            <FadeReveal delay={1.05} className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4 border-t border-white/[0.06] pt-10">
              {[
                { val: "Sur devis", label: "Tarif selon le projet" },
                { val: "24h",       label: "Délai de réponse" },
                { val: "100%",      label: "Confidentiel" },
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
            2. POURQUOI LES MARCHÉS PUBLICS
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
              className="mb-14 text-center"
            >
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <TrendingUp size={10} /> Pourquoi candidater
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Pourquoi répondre aux{" "}
                <span className="text-[#c9a55a]">marchés publics&nbsp;?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#6b7280]">
                Les marchés publics sont accessibles à toutes les entreprises et
                représentent une source de revenus stable, contractualisée et sécurisée.
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {POURQUOI.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div
                  key={title}
                  variants={cardReveal}
                  className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)]"
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}
                  >
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
            3. NOTRE ACCOMPAGNEMENT
        ════════════════════════════════════════════════════ */}
        <section className="bg-[var(--surface)] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
              className="mb-14 text-center"
            >
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <Zap size={10} /> Ce que nous faisons
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Notre{" "}
                <span className="text-[#c9a55a]">accompagnement concret</span>
              </h2>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {ACCOMPAGNEMENT.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div
                  key={title}
                  variants={cardReveal}
                  className="flex gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:border-[rgba(201,165,90,0.3)] hover:shadow-md"
                >
                  <div
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}
                  >
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
            4. TYPES DE MARCHÉS
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
              className="mb-14 text-center"
            >
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <Briefcase size={10} /> Périmètre
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Les types de marchés{" "}
                <span className="text-[#c9a55a]">couverts</span>
              </h2>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2"
            >
              {TYPES_MARCHES.map(({ emoji, title, desc }) => (
                <motion.div
                  key={title}
                  variants={cardReveal}
                  className="flex items-start gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:border-[rgba(249,168,38,0.3)] hover:shadow-md"
                >
                  <span className="mt-0.5 text-2xl">{emoji}</span>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-[#09090b]">{title}</h3>
                    <p className="text-xs leading-relaxed text-[#6b7280]">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            5. NOTRE MÉTHODE
        ════════════════════════════════════════════════════ */}
        <section id="methode" className="hero-dark relative overflow-hidden py-24">
          <div className="pointer-events-none absolute left-[10%] top-[20%] h-[300px] w-[400px] rounded-full bg-[rgba(249,168,38,0.05)] blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
              className="mb-14 text-center"
            >
              <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
                <ClipboardList size={10} /> Processus
              </motion.span>
              <h2 className="display-section text-white">
                Notre méthode{" "}
                <span className="text-gold">étape par étape</span>
              </h2>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="flex flex-col gap-4"
            >
              {ETAPES.map(({ num, icon: Icon, color, rgb, title, desc }) => (
                <motion.div
                  key={num}
                  variants={cardReveal}
                  className="flex items-start gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.05]"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                    style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.22)`, color }}
                  >
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
            6. MENTION TRANSPARENCE
        ════════════════════════════════════════════════════ */}
        <section className="bg-[var(--surface)] py-16">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.55, ease }}
              className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(249,168,38,0.25)] bg-[#09090b] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[200px] w-[350px] rounded-full bg-[rgba(249,168,38,0.06)] blur-[60px]" />
              </div>
              <div className="relative flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.25)` }}
                >
                  <Shield size={20} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="mb-2 text-base font-extrabold text-white">Transparence & honnêteté</p>
                  <p className="text-sm leading-relaxed text-white/55">
                    DJAMA accompagne les entreprises dans la <strong className="text-white/80 font-semibold">préparation
                    et la structuration</strong> de leur réponse aux appels d&apos;offres.
                    Nous ne garantissons pas l&apos;obtention d&apos;un marché.
                    La décision finale appartient toujours à l&apos;organisme qui publie l&apos;appel d&apos;offres.
                  </p>
                  <p className="mt-3 text-xs text-white/30">
                    Notre engagement : vous préparer le dossier le plus solide possible pour maximiser vos chances.
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
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
              className="mb-10 text-center"
            >
              <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
                <FileText size={10} /> Demande d&apos;accompagnement
              </motion.span>
              <h2 className="display-section text-white">
                Parlez-nous de{" "}
                <span className="text-gold">votre projet</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/40">
                Décrivez l&apos;appel d&apos;offres auquel vous souhaitez répondre.
                Nous reviendrons vers vous sous 24h avec une proposition adaptée.
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
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
              className="mb-12 text-center"
            >
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <MessageSquare size={10} /> Questions fréquentes
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Vous avez{" "}
                <span className="text-[#c9a55a]">des questions&nbsp;?</span>
              </h2>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="space-y-3"
            >
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
            <div className="h-[400px] w-[600px] rounded-full bg-[rgba(249,168,38,0.06)] blur-[90px]" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.65, ease }}
            className="relative z-10 mx-auto max-w-2xl px-6 text-center"
          >
            <span className="badge badge-gold-dark mb-6 inline-flex">
              <Sparkles size={10} /> Prêt à candidater&nbsp;?
            </span>
            <h2 className="display-section text-white">
              Un dossier solide,{" "}
              <span className="text-gold">c&apos;est tout ce qu&apos;il faut.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/45">
              Confiez-nous la préparation de votre réponse. Concentrez-vous sur votre métier.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a href="#devis" className="btn-primary px-8 py-4 text-base">
                <FileText size={17} />
                Demander un devis
              </a>
              <Link href="/services" className="btn-ghost px-8 py-4 text-base">
                <ArrowLeft size={16} />
                Voir tous les services
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-white/25">
              <span>✓ Réponse sous 24h</span>
              <span>✓ Sur devis</span>
              <span>✓ Sans engagement</span>
              <span>✓ 100% confidentiel</span>
            </div>
          </motion.div>
        </section>

      </main>
      <Footer />
    </>
  );
}
