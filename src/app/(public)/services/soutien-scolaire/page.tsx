"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, ArrowRight, CheckCircle2, Sparkles,
  Calendar, User, Mail, BookOpen, Clock, MessageSquare,
  ChevronDown, Star, Shield, Zap, Heart,
  ArrowLeft, Loader2, Send, Users, Award,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import type { RdvPayload } from "@/app/api/rdv/route";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────────────────── */

const NIVEAUX = {
  "Collège": ["6ème", "5ème", "4ème", "3ème"],
  "Lycée":   ["2nde", "1ère", "Terminale"],
};

const MATIERES = [
  { label: "Mathématiques",         emoji: "📐", color: "#60a5fa", rgb: "96,165,250" },
  { label: "Physique-Chimie",       emoji: "🔬", color: "#a78bfa", rgb: "167,139,250" },
  { label: "Français",              emoji: "📖", color: "#c9a55a", rgb: "201,165,90"  },
  { label: "Anglais",               emoji: "🌍", color: "#4ade80", rgb: "74,222,128"  },
  { label: "Histoire-Géographie",   emoji: "🗺️", color: "#fb923c", rgb: "251,146,60"  },
  { label: "SVT",                   emoji: "🌱", color: "#34d399", rgb: "52,211,153"  },
  { label: "NSI / Informatique",    emoji: "💻", color: "#7c6fcd", rgb: "124,111,205" },
  { label: "Philosophie",           emoji: "🧠", color: "#f472b6", rgb: "244,114,182" },
];

const ETAPES = [
  {
    num:   "01",
    icon:  Calendar,
    title: "Vous remplissez le formulaire",
    desc:  "Indiquez le niveau, la matière et vos disponibilités. C'est rapide — moins de 2 minutes.",
    color: "#c9a55a",
    rgb:   "201,165,90",
  },
  {
    num:   "02",
    icon:  MessageSquare,
    title: "On vous rappelle sous 24h",
    desc:  "Notre équipe vous contacte pour valider la date, l'heure et les objectifs du premier cours.",
    color: "#60a5fa",
    rgb:   "96,165,250",
  },
  {
    num:   "03",
    icon:  BookOpen,
    title: "La séance a lieu en ligne",
    desc:  "Via Google Meet ou Zoom, selon votre préférence. L'élève n'a besoin de rien installer.",
    color: "#4ade80",
    rgb:   "74,222,128",
  },
  {
    num:   "04",
    icon:  Star,
    title: "Suivi et progression réguliers",
    desc:  "Exercices, méthode, retours clairs. L'élève progresse à son rythme avec un suivi personnalisé.",
    color: "#a78bfa",
    rgb:   "167,139,250",
  },
];

const ATOUTS = [
  {
    icon:  Award,
    color: "#c9a55a",
    rgb:   "201,165,90",
    title: "Méthode éprouvée",
    desc:  "Des cours structurés : rappel de cours, exercices guidés, exercices autonomes. L'élève comprend vraiment.",
  },
  {
    icon:  Heart,
    color: "#f472b6",
    rgb:   "244,114,182",
    title: "Bienveillance avant tout",
    desc:  "Pas de pression, pas de jugement. L'élève pose toutes ses questions dans un cadre rassurant.",
  },
  {
    icon:  Zap,
    color: "#4ade80",
    rgb:   "74,222,128",
    title: "Flexibilité totale",
    desc:  "Cours le soir, le week-end, pendant les vacances. On s'adapte à votre emploi du temps.",
  },
  {
    icon:  Shield,
    color: "#60a5fa",
    rgb:   "96,165,250",
    title: "Tarif transparent",
    desc:  "14€/h, sans frais cachés, sans abonnement imposé. Vous payez uniquement les séances effectuées.",
  },
];

const STATS = [
  { value: "14€",    label: "de l'heure",          color: "#c9a55a" },
  { value: "7",      label: "niveaux couverts",     color: "#60a5fa" },
  { value: "8+",     label: "matières disponibles", color: "#4ade80" },
  { value: "100 %",  label: "en ligne",             color: "#a78bfa" },
];

const FAQ_ITEMS = [
  {
    q: "Comment se déroule le premier cours ?",
    a: "Le premier cours est toujours un bilan. Le professeur cerne les lacunes, comprend comment l'élève apprend, et définit un plan de travail personnalisé. C'est rassurant pour tout le monde.",
  },
  {
    q: "Faut-il s'engager sur plusieurs séances ?",
    a: "Non. Vous n'êtes engagé sur aucune durée minimale. Vous pouvez prendre une séance, plusieurs, ou arrêter à tout moment. Aucun abonnement, aucune pénalité.",
  },
  {
    q: "Quel logiciel utilise-t-on pour les cours ?",
    a: "Google Meet ou Zoom — c'est gratuit et ne nécessite aucune installation. L'élève a juste besoin d'un ordinateur ou d'une tablette avec une connexion internet.",
  },
  {
    q: "Les cours sont-ils adaptés aux élèves en grande difficulté ?",
    a: "Oui. Nous travaillons avec des élèves de tous niveaux, y compris ceux qui ont des lacunes importantes. L'approche est progressive, patiente, et sans jugement.",
  },
  {
    q: "Peut-on préparer un examen spécifique (Brevet, Bac) ?",
    a: "Absolument. On peut cibler les révisions sur le Brevet, le Bac général ou technologique, un contrôle précis, ou un rattrapage en fin d'année.",
  },
  {
    q: "Comment payer les séances ?",
    a: "Le paiement est convenu directement lors de la prise de contact. Virement bancaire, PayPal ou autre selon votre préférence. Aucune carte bancaire requise à l'inscription.",
  },
];

const LEVELS_FOR_SELECT = [
  ...NIVEAUX["Collège"].map((l) => ({ value: l, label: `Collège — ${l}` })),
  ...NIVEAUX["Lycée"].map((l) => ({ value: l, label: `Lycée — ${l}` })),
];

const SUBJECTS_FOR_SELECT = MATIERES.map((m) => ({ value: m.label, label: `${m.emoji} ${m.label}` }));

const AVAILABILITY_OPTIONS = [
  { value: "semaine-matin",      label: "En semaine — le matin" },
  { value: "semaine-apres-midi", label: "En semaine — l'après-midi" },
  { value: "semaine-soir",       label: "En semaine — le soir" },
  { value: "samedi",             label: "Le samedi" },
  { value: "dimanche",           label: "Le dimanche" },
  { value: "vacances",           label: "Pendant les vacances scolaires" },
  { value: "flexible",           label: "Flexible — à définir ensemble" },
];

/* ─────────────────────────────────────────────────────────
   COMPOSANTS FORMULAIRE
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

  const borderColor = showErr
    ? "rgba(248,113,113,0.5)"
    : showOk
    ? "rgba(52,211,153,0.45)"
    : focused
    ? "rgba(201,165,90,0.5)"
    : "rgba(255,255,255,0.09)";
  const shadow = focused ? "0 0 0 3px rgba(201,165,90,0.09)" : "none";

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor, boxShadow: shadow }}
    >
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? "#c9a55a" : "rgba(255,255,255,0.25)" }} />
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

function FieldSelect({
  icon: Icon, placeholder, value, onChange, options,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = value
    ? "rgba(52,211,153,0.35)"
    : focused
    ? "rgba(201,165,90,0.45)"
    : "rgba(255,255,255,0.09)";

  return (
    <div
      className="relative flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor }}
    >
      <Icon size={15} className="shrink-0" style={{ color: value || focused ? "#c9a55a" : "rgba(255,255,255,0.25)" }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ color: value ? "white" : "rgba(255,255,255,0.25)" }}
        className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#111113] [&>option]:text-white"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none shrink-0 text-white/25" />
      {value && <CheckCircle2 size={13} className="shrink-0 text-[#34d399]" />}
    </div>
  );
}

function FieldTextarea({
  placeholder, value, onChange,
}: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  const borderColor = value.length > 10
    ? "rgba(52,211,153,0.35)"
    : focused
    ? "rgba(201,165,90,0.45)"
    : "rgba(255,255,255,0.09)";
  return (
    <div
      className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
      style={{ borderColor, boxShadow: focused ? "0 0 0 3px rgba(201,165,90,0.08)" : "none" }}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: focused || value ? "#c9a55a" : "rgba(255,255,255,0.25)" }} />
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={4}
          className="flex-1 resize-none bg-transparent pb-4 text-sm text-white placeholder-white/25 outline-none"
        />
      </div>
      <div className="border-t border-white/[0.05] px-4 py-2 text-right">
        <span className="text-[0.6rem] text-white/20">{value.length} caractères</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FAQ ACCORDION
───────────────────────────────────────────────────────── */
function FaqItem({ q, a, open, onToggle }: {
  q: string; a: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div
      className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(201,165,90,0.2)] hover:shadow-sm"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-[#09090b] leading-relaxed">{q}</p>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{
            borderColor: open ? "rgba(201,165,90,0.4)" : "rgba(0,0,0,0.1)",
            background:  open ? "rgba(201,165,90,0.08)" : "transparent",
          }}
        >
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown size={14} style={{ color: open ? "#c9a55a" : "#6b7280" }} />
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
            <p className="border-t border-black/[0.05] px-6 pb-5 pt-4 text-sm leading-relaxed text-[#4b5563]">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function SoutienScolairePage() {

  /* ── Formulaire ─────────────────────────────────────────── */
  const [parentName,   setParentName]   = useState("");
  const [studentName,  setStudentName]  = useState("");
  const [email,        setEmail]        = useState("");
  const [level,        setLevel]        = useState("");
  const [subject,      setSubject]      = useState("");
  const [availability, setAvailability] = useState("");
  const [message,      setMessage]      = useState("");
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);

  /* ── FAQ ────────────────────────────────────────────────── */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const canSubmit =
    parentName.trim() &&
    studentName.trim() &&
    isEmailValid(email) &&
    level &&
    subject &&
    availability;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || sending) return;

    setSending(true);
    setFormError(null);

    const payload: RdvPayload = {
      parentName:   parentName.trim(),
      studentName:  studentName.trim(),
      email:        email.trim(),
      level,
      subject,
      availability,
      message:      message.trim(),
    };

    try {
      const res  = await fetch("/api/rdv", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'envoi");
      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white">

      {/* ════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-28 pt-36">
        {/* Glow principal */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-[rgba(96,165,250,0.07)] blur-[100px]" />
          <div className="absolute h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">

          {/* Fil d'Ariane */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mb-8 flex items-center justify-center gap-2 text-xs text-white/25"
          >
            <Link href="/services" className="transition-colors hover:text-white/50">
              ← Services
            </Link>
            <span>/</span>
            <span className="text-white/40">Soutien scolaire</span>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(96,165,250,0.28)] bg-[rgba(96,165,250,0.09)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#60a5fa]"
          >
            <GraduationCap size={12} />
            Cours particuliers en ligne — 6e à Terminale
          </motion.div>

          {/* H1 */}
          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Donnez à votre enfant", "les clés de la réussite."]}
              highlight={1}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal
            delay={0.5}
            as="p"
            className="mx-auto mt-6 max-w-xl text-lg leading-[1.8] text-white/50"
          >
            Des cours particuliers bienveillants, efficaces et accessibles — en ligne, selon vos disponibilités, avec un suivi personnalisé pour progresser vraiment.
          </FadeReveal>

          {/* CTA */}
          <FadeReveal delay={0.68} className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="#rdv"
              className="btn-primary px-8 py-4 text-base"
            >
              <Calendar size={17} />
              Réserver une séance
            </a>
            <a href="#comment" className="btn-ghost px-8 py-4 text-base">
              Comment ça marche <ArrowRight size={16} />
            </a>
          </FadeReveal>

          {/* Trust strip */}
          <FadeReveal
            delay={0.85}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-white/[0.07] pt-8"
          >
            {[
              { icon: "💰", label: "14€ / heure" },
              { icon: "🎓", label: "6e à Terminale" },
              { icon: "💻", label: "100 % en ligne" },
              { icon: "⚡", label: "Accès rapide" },
              { icon: "🔒", label: "Sans engagement" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-medium text-white/35">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </FadeReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          2. STATS RAPIDES
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainerFast}
          className="mx-auto grid max-w-3xl grid-cols-2 gap-8 px-6 sm:grid-cols-4"
        >
          {STATS.map(({ value, label, color }) => (
            <motion.div key={label} variants={cardReveal} className="text-center">
              <p className="text-4xl font-black leading-none" style={{ color }}>
                {value}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-[#6b7280]">
                {label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════
          3. NIVEAUX & MATIÈRES
      ════════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
              <Sparkles size={10} /> Niveaux & matières
            </motion.span>
            <h2 className="display-section text-[#09090b]">
              Du collège au{" "}
              <span className="text-[#c9a55a]">bac.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-[#6b7280]">
              Tous les niveaux, toutes les matières clés — des cours ciblés sur les véritables besoins de l&apos;élève.
            </p>
          </motion.div>

          {/* Niveaux */}
          <div className="mb-14 grid gap-6 sm:grid-cols-2">
            {(Object.entries(NIVEAUX) as [string, string[]][]).map(([cycle, levels], idx) => (
              <motion.div
                key={cycle}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.55, ease, delay: idx * 0.1 }}
                className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      background: idx === 0 ? "rgba(96,165,250,0.1)" : "rgba(201,165,90,0.1)",
                    }}
                  >
                    <GraduationCap
                      size={16}
                      style={{ color: idx === 0 ? "#60a5fa" : "#c9a55a" }}
                    />
                  </div>
                  <h3 className="font-bold text-[#09090b]">{cycle}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {levels.map((lvl) => (
                    <span
                      key={lvl}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{
                        background:   idx === 0 ? "rgba(96,165,250,0.08)"  : "rgba(201,165,90,0.08)",
                        color:        idx === 0 ? "#60a5fa" : "#c9a55a",
                        border:       `1px solid ${idx === 0 ? "rgba(96,165,250,0.2)" : "rgba(201,165,90,0.2)"}`,
                      }}
                    >
                      {lvl}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Matières */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {MATIERES.map(({ label, emoji, color, rgb }) => (
              <motion.div
                key={label}
                variants={cardReveal}
                className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                  style={{ background: `rgba(${rgb},0.1)` }}
                >
                  {emoji}
                </div>
                <span className="text-xs font-semibold leading-tight text-[#09090b]">
                  {label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4. COMMENT ÇA SE PASSE
      ════════════════════════════════════════════════════ */}
      <section id="comment" className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
              <Zap size={10} /> Processus simple
            </motion.span>
            <h2 className="display-section text-[#09090b]">
              Comment ça{" "}
              <span className="text-[#c9a55a]">se passe&nbsp;?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base text-[#6b7280]">
              De la demande au premier cours — en moins de 24 heures.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {ETAPES.map(({ num, icon: Icon, title, desc, color, rgb }) => (
              <motion.div
                key={num}
                variants={cardReveal}
                className="relative rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm"
              >
                {/* Numéro */}
                <span
                  className="mb-4 block text-5xl font-black leading-none"
                  style={{ color: `rgba(${rgb},0.12)` }}
                >
                  {num}
                </span>
                {/* Icône */}
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `rgba(${rgb},0.1)` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="mb-2 text-sm font-bold leading-snug text-[#09090b]">{title}</h3>
                <p className="text-xs leading-relaxed text-[#6b7280]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          5. TARIF
      ════════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-lg px-6">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.28)] bg-[#09090b] shadow-[0_40px_80px_rgba(0,0,0,0.22)]"
          >
            {/* Glow interne */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[300px] w-[400px] rounded-full bg-[rgba(176,141,87,0.08)] blur-[80px]" />
            </div>
            {/* Filet top */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

            <div className="relative px-8 py-10">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
                <Star size={9} /> Tarif unique
              </div>

              {/* Prix */}
              <div className="mb-1 flex items-end gap-1.5">
                <span className="text-[4.5rem] font-black leading-none text-white">14</span>
                <div className="mb-3 flex flex-col leading-none">
                  <span className="text-2xl font-black text-white">€</span>
                  <span className="mt-1 text-xs text-white/35">/ heure</span>
                </div>
              </div>
              <p className="mb-7 text-sm text-white/35">
                Sans engagement · Aucun abonnement · Paiement à la séance
              </p>

              <div className="divider-gold mb-7" />

              {/* Inclus */}
              <ul className="mb-8 space-y-3">
                {[
                  "Cours en ligne (Google Meet / Zoom)",
                  "Rappel de cours + exercices guidés",
                  "Suivi personnalisé de la progression",
                  "Disponible soir, week-end, vacances",
                  "De la 6e à la Terminale",
                  "Toutes les matières principales",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#e5e7eb]">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="#rdv"
                className="btn-primary w-full justify-center py-4 text-base"
              >
                <Calendar size={17} />
                Réserver une séance
              </a>

              <p className="mt-4 text-center text-[0.7rem] text-white/25">
                Réponse garantie sous 24h · Sans engagement
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          6. POURQUOI DJAMA
      ════════════════════════════════════════════════════ */}
      <section className="hero-dark relative overflow-hidden py-24">
        <div className="pointer-events-none absolute left-[10%] top-[20%] h-[300px] w-[400px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
              <Shield size={10} /> Pourquoi nous choisir
            </motion.span>
            <h2 className="display-section text-white">
              Pourquoi choisir{" "}
              <span className="text-gold">DJAMA&nbsp;?</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {ATOUTS.map(({ icon: Icon, color, rgb, title, desc }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}
                >
                  <Icon size={19} style={{ color }} />
                </div>
                <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                <p className="text-xs leading-relaxed text-white/45">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          7. FORMULAIRE DE RDV
      ════════════════════════════════════════════════════ */}
      <section id="rdv" className="hero-dark py-24">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
              <Calendar size={10} /> Prise de rendez-vous
            </motion.span>
            <h2 className="display-section text-white">
              Réservez votre{" "}
              <span className="text-gold">première séance.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base text-white/45">
              Remplissez le formulaire — on vous répond sous 24h pour confirmer l&apos;heure et la date.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.65, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-sm"
          >
            <AnimatePresence mode="wait">
              {sent ? (
                /* ── Succès ──────────────────────────────── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease }}
                  className="py-12 text-center"
                >
                  <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)]"
                    style={{ boxShadow: "0 0 40px rgba(52,211,153,0.15)" }}
                  >
                    <CheckCircle2 size={38} className="text-[#34d399]" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-white">Demande envoyée&nbsp;!</h3>
                  <p className="mb-8 text-sm leading-relaxed text-white/50">
                    On revient vers vous sous <strong className="text-white">24h</strong> pour confirmer
                    la date et l&apos;heure de la première séance.<br />
                    Un email de confirmation vient d&apos;être envoyé à <strong className="text-white">{email}</strong>.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/" className="btn-ghost px-6 py-3 text-sm">
                      Retour à l&apos;accueil
                    </Link>
                    <Link href="/services" className="btn-ghost px-6 py-3 text-sm">
                      Voir tous nos services
                    </Link>
                  </div>
                </motion.div>
              ) : (
                /* ── Formulaire ──────────────────────────── */
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* Ligne 1 : Noms */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-widest text-white/35">
                        Parent / Tuteur <span className="text-[#c9a55a]">*</span>
                      </label>
                      <FieldInput
                        icon={User}
                        placeholder="Votre nom et prénom"
                        value={parentName}
                        onChange={setParentName}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-widest text-white/35">
                        Nom de l&apos;élève <span className="text-[#c9a55a]">*</span>
                      </label>
                      <FieldInput
                        icon={Users}
                        placeholder="Prénom de l'élève"
                        value={studentName}
                        onChange={setStudentName}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-widest text-white/35">
                      Email <span className="text-[#c9a55a]">*</span>
                    </label>
                    <FieldInput
                      icon={Mail}
                      type="email"
                      placeholder="votre@email.fr"
                      value={email}
                      onChange={setEmail}
                      validate={isEmailValid}
                      required
                    />
                  </div>

                  {/* Ligne 2 : Niveau + Matière */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-widest text-white/35">
                        Niveau scolaire <span className="text-[#c9a55a]">*</span>
                      </label>
                      <FieldSelect
                        icon={GraduationCap}
                        placeholder="Sélectionner un niveau"
                        value={level}
                        onChange={setLevel}
                        options={LEVELS_FOR_SELECT}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-widest text-white/35">
                        Matière souhaitée <span className="text-[#c9a55a]">*</span>
                      </label>
                      <FieldSelect
                        icon={BookOpen}
                        placeholder="Sélectionner une matière"
                        value={subject}
                        onChange={setSubject}
                        options={SUBJECTS_FOR_SELECT}
                      />
                    </div>
                  </div>

                  {/* Disponibilités */}
                  <div>
                    <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-widest text-white/35">
                      Disponibilités préférées <span className="text-[#c9a55a]">*</span>
                    </label>
                    <FieldSelect
                      icon={Clock}
                      placeholder="Quand êtes-vous disponible ?"
                      value={availability}
                      onChange={setAvailability}
                      options={AVAILABILITY_OPTIONS}
                    />
                  </div>

                  {/* Message optionnel */}
                  <div>
                    <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-widest text-white/35">
                      Message (optionnel)
                    </label>
                    <FieldTextarea
                      placeholder="Décrivez les difficultés de l'élève, les objectifs, un examen à préparer…"
                      value={message}
                      onChange={setMessage}
                    />
                  </div>

                  {/* Error */}
                  {formError && (
                    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
                      {formError}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit || sending}
                    className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <Send size={17} />
                        Envoyer ma demande
                      </>
                    )}
                  </button>

                  <p className="text-center text-[0.68rem] text-white/20">
                    🔒 Vos données restent confidentielles · Réponse sous 24h · Sans engagement
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          8. FAQ
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
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
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="space-y-3"
          >
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <motion.div key={i} variants={cardReveal}>
                <FaqItem
                  q={q}
                  a={a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
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
          <div className="h-[400px] w-[600px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[90px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.65, ease }}
          className="relative z-10 mx-auto max-w-2xl px-6 text-center"
        >
          <span className="badge badge-gold-dark mb-6 inline-flex">
            <Sparkles size={10} /> Prêt à commencer&nbsp;?
          </span>
          <h2 className="display-section text-white">
            Un seul cours peut{" "}
            <span className="text-gold">tout changer.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/45">
            Réservez une séance aujourd&apos;hui. Sans engagement, sans risque.
            On s&apos;adapte à votre emploi du temps.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#rdv" className="btn-primary px-8 py-4 text-base">
              <Calendar size={17} />
              Réserver maintenant — 14€/h
            </a>
            <Link href="/services" className="btn-ghost px-8 py-4 text-base">
              <ArrowLeft size={16} />
              Voir tous les services
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-white/25">
            <span>✓ Réponse sous 24h</span>
            <span>✓ Cours en ligne</span>
            <span>✓ Sans engagement</span>
            <span>✓ 14€/h tout inclus</span>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
