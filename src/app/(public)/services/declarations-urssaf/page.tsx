"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Shield, AlertCircle, Zap, Clock, User, Mail, Phone,
  MessageSquare, Loader2, Send, ArrowLeft, Building2,
  ClipboardList, BookOpen, TrendingUp, UserCheck, Briefcase,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#a78bfa";
const ACCENT_RGB = "167,139,250";

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const POURQUOI = [
  {
    icon: TrendingUp, color: "#60a5fa", rgb: "96,165,250",
    title: "Une obligation légale",
    desc:  "Tout auto-entrepreneur ou indépendant doit déclarer son chiffre d'affaires à l'URSSAF, même s'il est nul. Une absence de déclaration entraîne des pénalités.",
  },
  {
    icon: AlertCircle, color: "#f9a826", rgb: "249,168,38",
    title: "Des erreurs fréquentes",
    desc:  "Mauvaise période déclarée, chiffre erroné, oubli de déclaration… Les erreurs sont courantes chez les nouveaux entrepreneurs et peuvent coûter cher.",
  },
  {
    icon: Clock, color: "#f87171", rgb: "248,113,113",
    title: "Des délais stricts",
    desc:  "Les déclarations sont mensuelles ou trimestrielles. Dépasser les échéances expose à des majorations de cotisations pouvant aller jusqu'à 5 %.",
  },
  {
    icon: Zap, color: ACCENT, rgb: ACCENT_RGB,
    title: "DJAMA vous accompagne",
    desc:  "On vous guide pas à pas pour comprendre vos obligations, préparer vos déclarations et éviter les erreurs — sans stress ni mauvaise surprise.",
  },
];

const ACCOMPAGNEMENT = [
  { icon: FileText,     color: "#60a5fa", rgb: "96,165,250",  title: "Aide à la déclaration de CA",       desc: "Nous vous aidons à saisir correctement votre chiffre d'affaires sur le portail URSSAF selon votre périodicité (mensuelle ou trimestrielle)." },
  { icon: ClipboardList,color: "#4ade80", rgb: "74,222,128",  title: "Démarches URSSAF",                  desc: "Accompagnement pour toutes les démarches sur autoentrepreneur.urssaf.fr : création de compte, mise à jour, paiement des cotisations." },
  { icon: UserCheck,    color: ACCENT,    rgb: ACCENT_RGB,    title: "Auto-entrepreneurs",                desc: "Un accompagnement spécifique pour les micro-entrepreneurs : comprendre le taux de cotisation, les plafonds, les déclarations de début d'activité." },
  { icon: BookOpen,     color: "#f9a826", rgb: "249,168,38",  title: "Explication des obligations",       desc: "On vous explique clairement vos obligations sociales : fréquence, montant des cotisations, abattement forfaitaire, dates limites." },
  { icon: Building2,    color: "#f472b6", rgb: "244,114,182", title: "Organisation des documents",        desc: "Aide au classement et à l'archivage des justificatifs (bordereaux de déclaration, avis de paiement) pour tenir votre comptabilité à jour." },
  { icon: Shield,       color: "#34d399", rgb: "52,211,153",  title: "Premières déclarations",            desc: "Un accompagnement renforcé pour les entrepreneurs qui débutent : on s'assure que la première déclaration est correcte et déposée dans les délais." },
];

const POUR_QUI = [
  {
    icon: UserCheck, color: "#60a5fa", rgb: "96,165,250",
    who: "Auto-entrepreneurs",
    desc: "Vous venez de créer votre micro-entreprise ou vous cherchez à mieux gérer vos déclarations mensuelles ou trimestrielles.",
    tags: ["Micro-entreprise", "Déclaration CA", "Première déclaration"],
  },
  {
    icon: Briefcase, color: ACCENT, rgb: ACCENT_RGB,
    who: "Indépendants",
    desc: "Freelances, consultants, artisans — vous exercez en nom propre et avez besoin d'aide pour vos obligations sociales.",
    tags: ["Freelance", "Cotisations", "Régularité"],
  },
  {
    icon: Zap, color: "#f9a826", rgb: "249,168,38",
    who: "Créateurs d'entreprise",
    desc: "Vous lancez votre activité et avez besoin d'un accompagnement pour comprendre vos premières obligations URSSAF.",
    tags: ["Lancement", "Nouvelles obligations", "Démarrage"],
  },
  {
    icon: TrendingUp, color: "#4ade80", rgb: "74,222,128",
    who: "Petites activités",
    desc: "Vous exercez une activité complémentaire ou saisonnière et souhaitez être aidé pour déclarer sans erreur.",
    tags: ["Activité secondaire", "Saisonnier", "Simplicité"],
  },
];

const ETAPES = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90",  title: "Échange initial",                 desc: "On discute de votre situation : statut, périodicité, chiffre d'affaires et problèmes rencontrés." },
  { num: "02", icon: BookOpen,      color: "#60a5fa", rgb: "96,165,250",  title: "Explication de vos obligations",  desc: "On vous explique clairement ce que vous devez déclarer, quand et comment calculer vos cotisations." },
  { num: "03", icon: FileText,      color: ACCENT,    rgb: ACCENT_RGB,    title: "Préparation de la déclaration",   desc: "On prépare ensemble les informations à saisir sur le portail URSSAF pour éviter toute erreur." },
  { num: "04", icon: CheckCircle2,  color: "#4ade80", rgb: "74,222,128",  title: "Validation et suivi",             desc: "On vérifie que la déclaration est bien enregistrée et que les cotisations ont bien été prises en compte." },
];

const FAQ_ITEMS = [
  {
    q: "DJAMA peut-il faire les déclarations à ma place ?",
    a: "Non. Seul le titulaire du compte peut valider et soumettre une déclaration sur autoentrepreneur.urssaf.fr. DJAMA vous accompagne dans la préparation et la vérification, mais c'est vous qui soumettez.",
  },
  {
    q: "Cela remplace-t-il un expert-comptable ?",
    a: "Non. DJAMA propose un accompagnement administratif de base. Pour une comptabilité complète, des optimisations fiscales ou une gestion complexe, un expert-comptable reste indispensable.",
  },
  {
    q: "Que se passe-t-il si j'oublie de déclarer ?",
    a: "L'URSSAF peut appliquer une majoration de 5 % sur les cotisations dues, et une pénalité forfaitaire de 1,5 % par mois de retard. Un accompagnement régulier aide à éviter ces situations.",
  },
  {
    q: "Je suis auto-entrepreneur avec zéro CA ce mois-ci, dois-je quand même déclarer ?",
    a: "Oui, absolument. Même avec un chiffre d'affaires nul, la déclaration est obligatoire. Vous indiquez 0 € et la déclaration est validée sans cotisation à payer.",
  },
  {
    q: "Combien coûte votre accompagnement ?",
    a: "La prestation est sur devis selon votre situation et la fréquence du suivi souhaité. Contactez-nous pour une estimation gratuite et sans engagement.",
  },
];

const STATUT_OPTIONS = [
  "Auto-entrepreneur / Micro-entrepreneur",
  "Indépendant / Freelance",
  "Entreprise individuelle (EI)",
  "Créateur d'entreprise (en cours de création)",
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
    <div className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(167,139,250,0.25)] hover:shadow-sm" onClick={onToggle}>
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
  const [nom,     setNom]     = useState("");
  const [email,   setEmail]   = useState("");
  const [tel,     setTel]     = useState("");
  const [statut,  setStatut]  = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const canSubmit = nom && isEmailValid(email) && statut && message.length > 5;

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
          subject: `Déclarations URSSAF — ${statut}`,
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
        className="rounded-3xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.05)] p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(167,139,250,0.12)]">
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
        <FieldSelect icon={Briefcase} placeholder="Votre statut" value={statut} onChange={setStatut} options={STATUT_OPTIONS} />
      </div>
      <div className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre besoin (première déclaration, erreur passée, fréquence, question…)" value={message}
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
export default function DeclarationsUrssafPage() {
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
            <div className="h-[350px] w-[500px] rounded-full bg-[rgba(167,139,250,0.08)] blur-[90px]" />
          </div>
          <div className="pointer-events-none absolute right-[-60px] top-[30%] h-[280px] w-[280px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <FadeReveal delay={0.05}>
              <span className="badge badge-gold-dark mb-6 inline-flex">
                <FileText size={10} /> Déclarations URSSAF
              </span>
            </FadeReveal>

            <h1 className="display-hero text-white">
              <MultiLineReveal
                lines={["Déclarez sereinement,", "sans erreur ni stress"]}
                highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08}
                lineClassName="justify-center"
              />
            </h1>

            <FadeReveal delay={0.6} as="p" className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-[1.85] text-white/50">
              DJAMA accompagne les auto-entrepreneurs et indépendants dans leurs
              déclarations URSSAF et leurs obligations sociales — pas à pas,
              sans jargon compliqué.
            </FadeReveal>

            <FadeReveal delay={0.75}>
              <div className="mx-auto mt-7 flex max-w-lg items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 text-left">
                <AlertCircle size={15} className="mt-0.5 shrink-0" style={{ color: "rgba(167,139,250,0.7)" }} />
                <p className="text-xs leading-relaxed text-white/40">
                  DJAMA propose un <strong className="text-white/65 font-semibold">accompagnement administratif</strong>.
                  Nous ne remplaçons pas un expert-comptable ni les organismes officiels.
                </p>
              </div>
            </FadeReveal>

            <FadeReveal delay={0.9} className="mt-9 flex flex-wrap justify-center gap-3">
              <a href="#devis" className="btn-primary px-8 py-4 text-base"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)` } as React.CSSProperties}>
                Demander un devis <ArrowRight size={16} />
              </a>
              <a href="#accompagnement" className="btn-ghost px-8 py-4 text-base">
                Notre accompagnement <ChevronDown size={16} />
              </a>
            </FadeReveal>

            <FadeReveal delay={1.0} className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4 border-t border-white/[0.06] pt-10">
              {[
                { val: "À partir de 29€", label: "Tarif de base" },
                { val: "24h",             label: "Délai de réponse" },
                { val: "100%",            label: "Confidentiel" },
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
            2. POURQUOI C'EST IMPORTANT
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <ClipboardList size={10} /> Pourquoi c&apos;est crucial
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Les déclarations URSSAF,{" "}
                <span className="text-[#c9a55a]">une obligation à ne pas négliger</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#6b7280]">
                Beaucoup d&apos;entrepreneurs découvrent trop tard les conséquences
                d&apos;une déclaration manquée ou erronée. On vous aide à éviter ça.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POURQUOI.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)]">
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
            3. NOTRE ACCOMPAGNEMENT
        ════════════════════════════════════════════════════ */}
        <section id="accompagnement" className="bg-[var(--surface)] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <Zap size={10} /> Ce que nous faisons
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Notre{" "}
                <span className="text-[#c9a55a]">accompagnement</span>
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ACCOMPAGNEMENT.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal}
                  className="flex gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm transition-all duration-300 hover:border-[rgba(167,139,250,0.3)] hover:shadow-md">
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
          <div className="mx-auto max-w-5xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
                <User size={10} /> Profils concernés
              </motion.span>
              <h2 className="display-section text-[#09090b]">
                Ce service est fait{" "}
                <span className="text-[#c9a55a]">pour vous si…</span>
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POUR_QUI.map(({ icon: Icon, color, rgb, who, desc, tags }) => (
                <motion.div key={who} variants={cardReveal}
                  className="overflow-hidden rounded-[1.5rem] border border-[#e5e7eb] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center gap-3 p-5 pb-4"
                    style={{ background: `rgba(${rgb},0.06)`, borderBottom: `1px solid rgba(${rgb},0.12)` }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <p className="text-sm font-extrabold text-[#09090b]">{who}</p>
                  </div>
                  <div className="p-5">
                    <p className="mb-4 text-xs leading-relaxed text-[#6b7280]">{desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span key={t} className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold"
                          style={{ background: `rgba(${rgb},0.08)`, color, border: `1px solid rgba(${rgb},0.18)` }}>
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

        {/* ════════════════════════════════════════════════════
            5. NOTRE MÉTHODE
        ════════════════════════════════════════════════════ */}
        <section className="hero-dark relative overflow-hidden py-24">
          <div className="pointer-events-none absolute left-[10%] top-[20%] h-[300px] w-[400px] rounded-full bg-[rgba(167,139,250,0.06)] blur-[80px]" />
          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-14 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
                <ClipboardList size={10} /> Processus
              </motion.span>
              <h2 className="display-section text-white">
                Comment ça{" "}
                <span className="text-gold">se passe&nbsp;?</span>
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast} className="flex flex-col gap-4">
              {ETAPES.map(({ num, icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={num} variants={cardReveal}
                  className="flex items-start gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.05]">
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
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
              transition={{ duration: 0.55, ease }}
              className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(167,139,250,0.22)] bg-[#09090b] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[200px] w-[350px] rounded-full bg-[rgba(167,139,250,0.05)] blur-[60px]" />
              </div>
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.25)` }}>
                  <Shield size={20} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="mb-2 text-base font-extrabold text-white">Accompagnement administratif — pas expertise comptable</p>
                  <p className="text-sm leading-relaxed text-white/55">
                    DJAMA propose un accompagnement administratif pour aider les entrepreneurs
                    dans leurs démarches URSSAF. Nous ne remplaçons pas un{" "}
                    <strong className="text-white/80 font-semibold">expert-comptable</strong> ni
                    les organismes officiels. Pour toute question fiscale ou juridique complexe,
                    nous vous orientons vers les professionnels compétents.
                  </p>
                  <p className="mt-3 text-xs text-white/30">
                    Seul le titulaire du compte peut valider une déclaration sur autoentrepreneur.urssaf.fr.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            7. FORMULAIRE
        ════════════════════════════════════════════════════ */}
        <section id="devis" className="hero-dark py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="mb-10 text-center">
              <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
                <FileText size={10} /> Demande d&apos;accompagnement
              </motion.span>
              <h2 className="display-section text-white">
                Parlons de{" "}
                <span className="text-gold">votre situation</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/40">
                Dites-nous votre statut et ce que vous souhaitez mettre en place.
                Nous vous répondons sous 24h.
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
            <div className="h-[400px] w-[600px] rounded-full bg-[rgba(167,139,250,0.06)] blur-[90px]" />
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ duration: 0.65, ease }}
            className="relative z-10 mx-auto max-w-2xl px-6 text-center">
            <span className="badge badge-gold-dark mb-6 inline-flex">
              <Sparkles size={10} /> Plus de stress avec l&apos;URSSAF
            </span>
            <h2 className="display-section text-white">
              Vos déclarations,{" "}
              <span className="text-gold">bien faites dès le départ.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/45">
              On vous guide étape par étape. Fini les erreurs, les oublis et les pénalités.
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
              <span>✓ À partir de 29€</span>
              <span>✓ Réponse sous 24h</span>
              <span>✓ Auto-entrepreneurs & indépendants</span>
              <span>✓ Sans engagement</span>
            </div>
          </motion.div>
        </section>

      </main>
      <Footer />
    </>
  );
}
