"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  Star,
  Users,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Languages,
  Pencil,
  Music,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  MessageSquare,
  Phone,
  Mail,
  User,
  ChevronDown,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Types ──────────────────────────────────────── */
type FormData = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  niveau: string;
  matiere: string;
  typeHeure: string;
  message: string;
  date: string;
  heure: string;
};

/* ── Data ──────────────────────────────────────── */
const NIVEAUX = [
  "Primaire (CE1 – CM2)",
  "Collège (6e – 3e)",
  "Lycée (2nde – Terminale)",
  "BTS / Prépa",
  "Adulte / Reconversion",
];

const MATIERES = [
  { label: "Mathématiques", icon: Calculator },
  { label: "Physique-Chimie", icon: FlaskConical },
  { label: "Français", icon: Pencil },
  { label: "Anglais", icon: Globe },
  { label: "Arabe", icon: Languages },
  { label: "Histoire-Géo", icon: BookOpen },
  { label: "Sciences", icon: FlaskConical },
  { label: "Autre matière", icon: Music },
];

const TYPES_COURS = ["Cours individuel", "Cours en duo", "Cours en petit groupe"];

const CRENEAUX = [
  "08h00", "09h00", "10h00", "11h00",
  "14h00", "15h00", "16h00", "17h00",
  "18h00", "19h00", "20h00",
];

const AVANTAGES = [
  {
    icon: Star,
    title: "Premier cours 100 % gratuit",
    desc: "Aucun engagement, aucune carte bancaire. Vous testez, vous décidez.",
  },
  {
    icon: Users,
    title: "Suivi personnalisé",
    desc: "Chaque élève avance à son rythme avec un programme adapté à ses besoins.",
  },
  {
    icon: ShieldCheck,
    title: "Pédagogie éprouvée",
    desc: "Méthode structurée, explications simples, résultats visibles dès les premières séances.",
  },
  {
    icon: Clock,
    title: "Flexibilité totale",
    desc: "Créneaux flexibles en ligne, disponibles le soir et le week-end.",
  },
];

const STATS = [
  { value: "98%", label: "Élèves satisfaits" },
  { value: "6e", label: "À terminale" },
  { value: "100%", label: "En ligne" },
  { value: "+50", label: "Cours dispensés" },
];

/* ── Composants UI ───────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[0.68rem] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
      {children}
    </label>
  );
}

function PInput({
  value, onChange, placeholder, type = "text", icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  icon?: React.ElementType;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Icon size={14} style={{ color: focused ? "rgb(var(--gold))" : "var(--muted)" }} />
        </div>
      )}
      <motion.div
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow: "0 0 0 2px rgba(var(--gold), 0.35)" }}
      />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors duration-200 hover:border-[rgba(var(--gold),0.4)] ${Icon ? "pl-11 pr-4" : "px-4"}`}
      />
    </div>
  );
}

function PSelect({
  value, onChange, options, placeholder, icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  icon?: React.ElementType;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Icon size={14} style={{ color: focused ? "rgb(var(--gold))" : "var(--muted)" }} />
        </div>
      )}
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 z-10 text-[var(--muted)]"
      />
      <motion.div
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow: "0 0 0 2px rgba(var(--gold), 0.35)" }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 text-sm text-[var(--ink)] outline-none transition-colors duration-200 hover:border-[rgba(var(--gold),0.4)] ${Icon ? "pl-11 pr-10" : "px-4 pr-10"}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function PTextarea({
  value, onChange, placeholder, rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow: "0 0 0 2px rgba(var(--gold), 0.35)" }}
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors duration-200 hover:border-[rgba(var(--gold),0.4)] resize-none"
      />
    </div>
  );
}

/* ── Sélecteur de créneaux ─────────────────────── */
function CreneauGrid({
  selected, onSelect,
}: {
  selected: string;
  onSelect: (h: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CRENEAUX.map((h) => {
        const active = selected === h;
        return (
          <motion.button
            key={h}
            type="button"
            onClick={() => onSelect(h)}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={`relative rounded-xl border py-2.5 text-xs font-bold transition-all duration-200 ${
              active
                ? "border-[rgba(var(--gold),0.6)] bg-[rgba(var(--gold),0.1)] text-[rgb(var(--gold))] shadow-[0_0_12px_rgba(var(--gold),0.2)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[rgba(var(--gold),0.3)] hover:text-[var(--ink)]"
            }`}
          >
            {active && (
              <motion.div
                layoutId="creneau-bg"
                className="absolute inset-0 rounded-xl bg-[rgba(var(--gold),0.08)]"
                transition={{ duration: 0.25, ease }}
              />
            )}
            <span className="relative">{h}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Sélecteur de matière ──────────────────────── */
function MatiereGrid({
  selected, onSelect,
}: {
  selected: string;
  onSelect: (m: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MATIERES.map(({ label, icon: Icon }) => {
        const active = selected === label;
        return (
          <motion.button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold transition-all duration-200 ${
              active
                ? "border-[rgba(var(--gold),0.6)] bg-[rgba(var(--gold),0.08)] text-[rgb(var(--gold))]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[rgba(var(--gold),0.3)] hover:text-[var(--ink)]"
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Page principale ────────────────────────────── */
export default function SoutienScolairePage() {
  const [form, setForm] = useState<FormData>({
    prenom: "", nom: "", email: "", telephone: "",
    niveau: "", matiere: "", typeHeure: "",
    message: "", date: "", heure: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.prenom.trim())  e.prenom    = "Requis";
    if (!form.nom.trim())     e.nom       = "Requis";
    if (!form.email.trim())   e.email     = "Requis";
    if (!form.niveau)         e.niveau    = "Requis";
    if (!form.matiere)        e.matiere   = "Requis";
    if (!form.date)           e.date      = "Requis";
    if (!form.heure)          e.heure     = "Choisissez un créneau";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <main className="bg-white overflow-x-hidden">

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden px-4 pb-24 pt-20">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[rgba(var(--gold),0.07)] blur-[100px]" />
          <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-[rgba(59,157,255,0.05)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <FadeReveal delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
              <GraduationCap size={13} />
              Soutien scolaire — Premier cours gratuit
            </div>
          </FadeReveal>

          {/* Titre */}
          <div className="mt-6">
            <MultiLineReveal
              lines={["Réservez votre premier", "cours d'essai gratuit"]}
              highlight={1}
              delay={0.1}
              className="justify-center"
              lineClassName="text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl"
            />
          </div>

          {/* Sous-titre */}
          <FadeReveal delay={0.45} className="mt-6">
            <p className="mx-auto max-w-2xl text-base text-white/50 md:text-lg">
              Accompagnement personnalisé de la 6e à la Terminale. Cours en ligne, méthode claire,
              suivi régulier — et votre premier cours est <span className="font-bold text-white/80">100&nbsp;% offert</span>.
            </p>
          </FadeReveal>

          {/* Stats */}
          <FadeReveal delay={0.6}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              {STATS.map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-2xl font-extrabold text-[rgb(var(--gold))]">{value}</span>
                  <span className="text-xs text-white/35 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </FadeReveal>

          {/* Scroll cue */}
          <FadeReveal delay={0.75}>
            <div className="mt-12 flex justify-center">
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5"
              >
                <ChevronDown size={16} className="text-white/40" />
              </motion.div>
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* ═══ AVANTAGES ═══════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <FadeReveal className="mb-10 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Pourquoi choisir{" "}
            <span className="text-[rgb(var(--gold))]">DJAMA Soutien&nbsp;?</span>
          </h2>
        </FadeReveal>

        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {AVANTAGES.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardReveal}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group rounded-2xl border border-[var(--border)] bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(var(--gold),0.1)]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.07)] transition-colors duration-300 group-hover:bg-[rgba(var(--gold),0.14)]">
                <Icon size={18} className="text-[rgb(var(--gold))]" />
              </div>
              <h3 className="text-sm font-extrabold text-[var(--ink)]">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ FORMULAIRE ══════════════════════════════════════ */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <FadeReveal className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))] mb-4">
            <Sparkles size={11} />
            Inscription gratuite
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Réservez votre cours d'essai
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Remplissez ce formulaire et nous vous confirmons votre créneau sous 24h.
          </p>
        </FadeReveal>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="flex flex-col items-center gap-5 rounded-3xl border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.04)] px-8 py-16 text-center shadow-[0_8px_40px_rgba(var(--gold),0.08)]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--gold),0.12)]"
              >
                <CheckCircle2 size={30} className="text-[rgb(var(--gold))]" />
              </motion.div>
              <div>
                <h3 className="text-xl font-extrabold text-[var(--ink)]">
                  Votre demande a bien été envoyée&nbsp;!
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Nous vous recontactons dans les <strong>24h</strong> pour confirmer votre créneau.
                  Premier cours 100&nbsp;% gratuit, sans engagement.
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[rgb(var(--gold))]" /> Aucun paiement requis</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[rgb(var(--gold))]" /> Aucun engagement</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[rgb(var(--gold))]" /> Confirmation sous 24h</span>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* ── Identité ── */}
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--gold),0.08)]">
                    <User size={14} className="text-[rgb(var(--gold))]" />
                  </div>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
                    Vos coordonnées
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Prénom *</FieldLabel>
                    <PInput
                      value={form.prenom}
                      onChange={(v) => setField("prenom", v)}
                      placeholder="Prénom de l'élève"
                    />
                    {errors.prenom && <p className="mt-1 text-xs text-red-500">{errors.prenom}</p>}
                  </div>
                  <div>
                    <FieldLabel>Nom *</FieldLabel>
                    <PInput
                      value={form.nom}
                      onChange={(v) => setField("nom", v)}
                      placeholder="Nom de famille"
                    />
                    {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
                  </div>
                  <div>
                    <FieldLabel>Adresse e-mail *</FieldLabel>
                    <PInput
                      value={form.email}
                      onChange={(v) => setField("email", v)}
                      placeholder="votre@email.com"
                      type="email"
                      icon={Mail}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <FieldLabel>Téléphone</FieldLabel>
                    <PInput
                      value={form.telephone}
                      onChange={(v) => setField("telephone", v)}
                      placeholder="+33 6 00 00 00 00"
                      type="tel"
                      icon={Phone}
                    />
                  </div>
                </div>
              </div>

              {/* ── Niveau ── */}
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--gold),0.08)]">
                    <GraduationCap size={14} className="text-[rgb(var(--gold))]" />
                  </div>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
                    Niveau scolaire *
                  </span>
                </div>
                <PSelect
                  value={form.niveau}
                  onChange={(v) => setField("niveau", v)}
                  options={NIVEAUX}
                  placeholder="Sélectionner le niveau"
                />
                {errors.niveau && <p className="mt-1 text-xs text-red-500">{errors.niveau}</p>}
              </div>

              {/* ── Matière ── */}
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--gold),0.08)]">
                    <BookOpen size={14} className="text-[rgb(var(--gold))]" />
                  </div>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
                    Matière souhaitée *
                  </span>
                </div>
                <MatiereGrid
                  selected={form.matiere}
                  onSelect={(v) => setField("matiere", v)}
                />
                {errors.matiere && <p className="mt-2 text-xs text-red-500">{errors.matiere}</p>}
              </div>

              {/* ── Type de cours ── */}
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--gold),0.08)]">
                    <Users size={14} className="text-[rgb(var(--gold))]" />
                  </div>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
                    Type de cours
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TYPES_COURS.map((t) => {
                    const active = form.typeHeure === t;
                    return (
                      <motion.button
                        key={t}
                        type="button"
                        onClick={() => setField("typeHeure", t)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-200 ${
                          active
                            ? "border-[rgba(var(--gold),0.6)] bg-[rgba(var(--gold),0.08)] text-[rgb(var(--gold))]"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[rgba(var(--gold),0.3)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {t}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Date & créneau ── */}
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--gold),0.08)]">
                    <CalendarDays size={14} className="text-[rgb(var(--gold))]" />
                  </div>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
                    Date &amp; créneau *
                  </span>
                </div>
                <div className="mb-4">
                  <FieldLabel>Date souhaitée</FieldLabel>
                  <PInput
                    value={form.date}
                    onChange={(v) => setField("date", v)}
                    placeholder=""
                    type="date"
                    icon={CalendarDays}
                  />
                  {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                </div>
                <div>
                  <FieldLabel>Heure souhaitée</FieldLabel>
                  <CreneauGrid
                    selected={form.heure}
                    onSelect={(v) => setField("heure", v)}
                  />
                  {errors.heure && <p className="mt-2 text-xs text-red-500">{errors.heure}</p>}
                </div>
              </div>

              {/* ── Message ── */}
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--gold),0.08)]">
                    <MessageSquare size={14} className="text-[rgb(var(--gold))]" />
                  </div>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
                    Message ou précisions
                  </span>
                </div>
                <PTextarea
                  value={form.message}
                  onChange={(v) => setField("message", v)}
                  placeholder="Décrivez les difficultés rencontrées, les objectifs, ou toute autre information utile…"
                  rows={4}
                />
              </div>

              {/* ── Garanties ── */}
              <div className="flex flex-wrap items-center justify-center gap-4 py-2 text-xs text-[var(--muted)]">
                {[
                  "Premier cours 100% gratuit",
                  "Sans engagement",
                  "Confirmation sous 24h",
                  "Cours 100% en ligne",
                ].map((g) => (
                  <span key={g} className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-[rgb(var(--gold))]" />
                    {g}
                  </span>
                ))}
              </div>

              {/* ── Bouton ── */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.985 }}
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-6 py-4 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_24px_rgba(201,165,90,0.35)] transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(201,165,90,0.5)] disabled:opacity-60"
              >
                {/* shimmer */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center justify-center gap-2.5">
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black/70"
                      />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <GraduationCap size={16} />
                      Réserver mon cours d'essai gratuit
                      <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      {/* ═══ CTA DARK FINAL ══════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <FadeReveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#0f1117] p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[350px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(var(--gold),0.07)] blur-[80px]" />
            </div>
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.08)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
                <Star size={10} />
                Aucun risque
              </div>
              <h2 className="mt-2 text-2xl font-extrabold text-white md:text-3xl">
                Votre premier cours est offert.
              </h2>
              <p className="mt-3 text-sm text-white/45">
                Essayez sans rien payer. Si vous êtes satisfait, nous continuons ensemble.
                Sinon, aucune obligation.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-white/30">
                {["Aucune carte bancaire", "Aucun abonnement caché", "Cours en ligne sécurisé"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <ShieldCheck size={11} className="text-[rgb(var(--gold))]" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeReveal>
      </section>

    </main>
  );
}
