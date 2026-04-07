"use client";

import { useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Phone, Mail, User, MessageSquare,
  CheckCircle2, ChevronRight, ChevronLeft, ArrowRight,
  Sparkles, Target, Zap, Shield, Loader2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   CONFIGURATION — modifier ici vos disponibilités
   ─────────────────────────────────────────────────────────────
   SLOTS_BY_WEEKDAY : tableau indexé par jour de semaine
     0 = Dimanche, 1 = Lundi, … 6 = Samedi
   Mettez un tableau vide [] pour bloquer un jour.
─────────────────────────────────────────────────────────────── */
const SLOTS_BY_WEEKDAY: Record<number, string[]> = {
  0: [],                                          // Dimanche — fermé
  1: ["09h00", "10h00", "11h00", "14h00", "15h00", "17h00"], // Lundi
  2: ["09h00", "10h00", "11h00", "14h00", "15h00", "17h00"], // Mardi
  3: ["09h00", "10h00", "14h00", "15h00", "17h00"],           // Mercredi
  4: ["09h00", "10h00", "11h00", "14h00", "15h00", "17h00"], // Jeudi
  5: ["09h00", "10h00", "11h00", "14h00"],                    // Vendredi
  6: ["10h00", "11h00"],                                       // Samedi
};

/* Nombre de jours à afficher en avance */
const DAYS_AHEAD = 14;

/* ─────────────────────────────────────────────────────────────
   CONSTANTES DESIGN
─────────────────────────────────────────────────────────────── */
const ACCENT     = "#c9a55a";
const ACCENT_RGB = "201,165,90";
const ease       = [0.16, 1, 0.3, 1] as const;

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MOIS  = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];

const REQUEST_TYPES = [
  "Création de site web",
  "Application mobile / web",
  "Coaching IA",
  "Soutien scolaire",
  "Accompagnement administratif",
  "Autre demande",
];

/* ─────────────────────────────────────────────────────────────
   HELPERS
─────────────────────────────────────────────────────────────── */
function getAvailableDays(): { date: Date; slots: string[] }[] {
  const days: { date: Date; slots: string[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const slots = SLOTS_BY_WEEKDAY[d.getDay()] ?? [];
    if (slots.length > 0) days.push({ date: d, slots });
  }
  return days;
}

function formatDayLabel(date: Date): string {
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]}`;
}

function formatSlotLabel(date: Date, time: string): string {
  const day = JOURS[date.getDay()];
  const month = MOIS[date.getMonth()];
  return `${day} ${date.getDate()} ${month} — ${time}`;
}

/* ─────────────────────────────────────────────────────────────
   PAGE
─────────────────────────────────────────────────────────────── */
export default function ReserverAppelPage() {
  const availableDays = useMemo(() => getAvailableDays(), []);

  /* Pagination calendrier */
  const [weekOffset,      setWeekOffset]      = useState(0);
  const [selectedDay,     setSelectedDay]     = useState<Date | null>(null);
  const [selectedSlot,    setSelectedSlot]    = useState<string | null>(null);

  /* Formulaire */
  const [fullName,     setFullName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [phone,        setPhone]        = useState("");
  const [subject,      setSubject]      = useState("");
  const [requestType,  setRequestType]  = useState("");
  const [message,      setMessage]      = useState("");

  /* États */
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  /* Jours affichés (7 par page) */
  const DAYS_PER_PAGE = 7;
  const visibleDays = availableDays.slice(
    weekOffset * DAYS_PER_PAGE,
    (weekOffset + 1) * DAYS_PER_PAGE
  );
  const canPrev = weekOffset > 0;
  const canNext = (weekOffset + 1) * DAYS_PER_PAGE < availableDays.length;

  function selectDay(day: { date: Date; slots: string[] }) {
    setSelectedDay(day.date);
    setSelectedSlot(null);
  }

  const slotLabel = selectedDay && selectedSlot
    ? formatSlotLabel(selectedDay, selectedSlot)
    : null;

  /* ── Build ISO datetime from selected day + slot ("09h00") ── */
  function buildScheduledAt(day: Date, slot: string): string {
    const [h, m] = slot.replace("h", ":").split(":").map(Number);
    const dt = new Date(day);
    dt.setHours(h, m ?? 0, 0, 0);
    return dt.toISOString();
  }

  const submittingRef = useRef(false);

  /* ── Soumission ─────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slotLabel || !selectedDay || !selectedSlot) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const payload = {
      client_name:  fullName.trim(),
      client_email: email.trim(),
      service:      requestType,
      scheduled_at: buildScheduledAt(selectedDay, selectedSlot),
      duration_min: 30,
      status:       "en attente",
      notes: [
        phone    ? `Tél : ${phone.trim()}`    : null,
        subject  ? `Besoin : ${subject.trim()}` : null,
        message  ? `Message : ${message.trim()}` : null,
      ].filter(Boolean).join(" | "),
    };

    console.log("[Reservation Public] insert payload:", payload);

    const { error: insertError } = await supabase
      .from("reservations")
      .insert([payload]);

    submittingRef.current = false;
    setSubmitting(false);

    if (insertError) {
      console.error("[Reservation Public] insert error:", insertError);
      setError(
        insertError.message ||
        "Impossible d'enregistrer votre réservation. Veuillez réessayer."
      );
      return;
    }

    console.log("[Reservation Public] insert success for:", email);
    setSubmitted(true);
  }

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#07080e]">

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-16 pt-28">
        {/* Fond */}
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-grid absolute inset-0 opacity-25" />
          <div className="absolute left-1/2 top-0 h-[480px] w-[600px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,0.07)] blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          {/* Fil d'Ariane */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mb-7 flex items-center justify-center gap-2 text-xs text-white/25"
          >
            <Link href="/" className="transition-colors hover:text-white/50">Accueil</Link>
            <ChevronRight size={10} />
            <Link href="/contact" className="transition-colors hover:text-white/50">Contact</Link>
            <ChevronRight size={10} />
            <span className="text-white/40">Appel découverte</span>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.28)] bg-[rgba(201,165,90,0.08)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#c9a55a]"
          >
            <Calendar size={11} /> Appel gratuit · 30 minutes
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.05 }}
            className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl"
          >
            Réservez votre{" "}
            <span style={{ color: ACCENT }}>appel découverte</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.12 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/45"
          >
            Un échange de 30 minutes, sans engagement, pour comprendre votre projet
            et voir comment DJAMA peut vous aider concrètement.
          </motion.p>

          {/* Bénéfices */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.22 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-5"
          >
            {[
              { icon: Clock,   label: "30 min chrono" },
              { icon: Zap,     label: "Sans engagement" },
              { icon: Target,  label: "Conseil personnalisé" },
              { icon: Shield,  label: "100% gratuit" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-white/35">
                <Icon size={12} style={{ color: ACCENT }} />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          CONTENU PRINCIPAL
      ════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 pb-24">

        <AnimatePresence mode="wait">
          {submitted ? (
            /* ── Confirmation ──────────────────────────────── */
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease }}
              className="mx-auto max-w-xl py-16 text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)]">
                <CheckCircle2 size={40} className="text-[#34d399]" />
              </div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)] px-3 py-1 text-xs font-bold text-[#34d399]">
                <Sparkles size={10} /> Réservation confirmée
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">
                Votre appel est réservé&nbsp;!
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/45">
                Un email de confirmation vient d'être envoyé à <strong className="text-white">{email}</strong>.
                {slotLabel && (
                  <> Nous vous attendons le <strong className="text-[#c9a55a]">{slotLabel}</strong>.</>
                )}
              </p>

              {/* Ce que vous pouvez préparer */}
              <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-left">
                <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-white/30">
                  Pour bien préparer votre appel
                </p>
                <ul className="space-y-3">
                  {[
                    "Notez vos 2–3 objectifs principaux avant l'appel",
                    "Préparez vos questions sur nos services",
                    "Pensez à votre budget et vos délais souhaités",
                    "Si vous avez un site existant, notez son URL",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-3 text-sm text-white/50">
                      <ChevronRight size={14} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] px-5 py-3 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80"
              >
                Retour à l'accueil <ArrowRight size={14} />
              </Link>
            </motion.div>

          ) : (
            /* ── Sélecteur + Formulaire ────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="grid gap-8 lg:grid-cols-[1fr_420px]"
            >

              {/* ── Colonne gauche : Calendrier + créneaux ── */}
              <div>
                {/* Titre section */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">Choisissez un créneau</h2>
                  <p className="mt-1 text-sm text-white/35">
                    Sélectionnez un jour puis l'heure qui vous convient.
                  </p>
                </div>

                {/* Navigation jours */}
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={() => { setWeekOffset((p) => p - 1); setSelectedDay(null); setSelectedSlot(null); }}
                    disabled={!canPrev}
                    className="flex items-center gap-1 rounded-xl border border-white/[0.08] px-3 py-1.5 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                  >
                    <ChevronLeft size={13} /> Précédent
                  </button>
                  <span className="text-xs text-white/25">
                    {availableDays.length > 0
                      ? `${visibleDays[0] ? formatDayLabel(visibleDays[0].date) : ""} – ${visibleDays[visibleDays.length - 1] ? formatDayLabel(visibleDays[visibleDays.length - 1].date) : ""}`
                      : "Aucune disponibilité"
                    }
                  </span>
                  <button
                    onClick={() => { setWeekOffset((p) => p + 1); setSelectedDay(null); setSelectedSlot(null); }}
                    disabled={!canNext}
                    className="flex items-center gap-1 rounded-xl border border-white/[0.08] px-3 py-1.5 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                  >
                    Suivant <ChevronRight size={13} />
                  </button>
                </div>

                {/* Grille des jours */}
                <div className="mb-6 grid grid-cols-7 gap-2">
                  {visibleDays.map((day) => {
                    const isSelected = selectedDay?.toDateString() === day.date.toDateString();
                    return (
                      <button
                        key={day.date.toISOString()}
                        onClick={() => selectDay(day)}
                        className="flex flex-col items-center rounded-2xl border py-3 text-center transition-all duration-200"
                        style={{
                          borderColor: isSelected ? `rgba(${ACCENT_RGB},0.5)` : "rgba(255,255,255,0.07)",
                          background:  isSelected ? `rgba(${ACCENT_RGB},0.12)` : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span className="text-[0.6rem] font-semibold uppercase tracking-wider" style={{ color: isSelected ? ACCENT : "rgba(255,255,255,0.3)" }}>
                          {JOURS[day.date.getDay()]}
                        </span>
                        <span className="mt-1 text-base font-bold" style={{ color: isSelected ? ACCENT : "rgba(255,255,255,0.75)" }}>
                          {day.date.getDate()}
                        </span>
                        <span className="text-[0.55rem]" style={{ color: isSelected ? `rgba(${ACCENT_RGB},0.7)` : "rgba(255,255,255,0.2)" }}>
                          {MOIS[day.date.getMonth()]}
                        </span>
                        <span className="mt-1.5 rounded-full px-1.5 py-0.5 text-[0.5rem] font-bold" style={{ background: isSelected ? `rgba(${ACCENT_RGB},0.2)` : "rgba(255,255,255,0.05)", color: isSelected ? ACCENT : "rgba(255,255,255,0.2)" }}>
                          {day.slots.length} dispo
                        </span>
                      </button>
                    );
                  })}

                  {/* Remplissage si moins de 7 jours */}
                  {visibleDays.length < DAYS_PER_PAGE &&
                    Array.from({ length: DAYS_PER_PAGE - visibleDays.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="rounded-2xl border border-white/[0.04] bg-white/[0.01] py-3" />
                    ))
                  }
                </div>

                {/* Créneaux horaires */}
                <AnimatePresence mode="wait">
                  {selectedDay && (
                    <motion.div
                      key={selectedDay.toISOString()}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, ease }}
                    >
                      <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-white/30">
                        Créneaux disponibles — {formatDayLabel(selectedDay)}
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {(SLOTS_BY_WEEKDAY[selectedDay.getDay()] ?? []).map((slot) => {
                          const isActive = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-all duration-150"
                              style={{
                                borderColor: isActive ? `rgba(${ACCENT_RGB},0.5)` : "rgba(255,255,255,0.08)",
                                background:  isActive ? `rgba(${ACCENT_RGB},0.12)` : "rgba(255,255,255,0.03)",
                                color:       isActive ? ACCENT : "rgba(255,255,255,0.6)",
                              }}
                            >
                              <Clock size={12} />
                              {slot}
                            </button>
                          );
                        })}
                      </div>

                      {selectedSlot && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease }}
                          className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] px-4 py-3"
                        >
                          <CheckCircle2 size={14} className="text-[#34d399]" />
                          <span className="text-sm font-semibold text-[#34d399]">
                            Créneau sélectionné : {formatSlotLabel(selectedDay, selectedSlot)}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {!selectedDay && (
                    <motion.div
                      key="no-day"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-6 py-8 text-center"
                    >
                      <Calendar size={28} className="mx-auto mb-3 text-white/15" />
                      <p className="text-sm text-white/25">
                        Sélectionnez un jour ci-dessus pour voir les créneaux disponibles
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info appel */}
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: Clock,    label: "Durée",       value: "30 min" },
                    { icon: Phone,    label: "Format",      value: "Téléphone" },
                    { icon: Zap,      label: "Réponse",     value: "< 2h" },
                    { icon: Shield,   label: "Engagement",  value: "Aucun" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center"
                    >
                      <Icon size={16} className="mx-auto mb-2" style={{ color: ACCENT }} />
                      <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/25">{label}</p>
                      <p className="mt-0.5 text-sm font-bold text-white/70">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Colonne droite : Formulaire ─────────────── */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6">

                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-white">Vos informations</h2>
                    <p className="mt-1 text-sm text-white/35">
                      {slotLabel
                        ? <><span className="font-semibold" style={{ color: ACCENT }}>{slotLabel}</span></>
                        : "Choisissez d'abord un créneau à gauche"
                      }
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Nom */}
                    <Field icon={<User size={14} />} label="Nom complet">
                      <input
                        type="text"
                        placeholder="Prénom Nom"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                      />
                    </Field>

                    {/* Email */}
                    <Field icon={<Mail size={14} />} label="Email">
                      <input
                        type="email"
                        placeholder="votre@email.fr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                      />
                    </Field>

                    {/* Téléphone */}
                    <Field icon={<Phone size={14} />} label="Téléphone / WhatsApp">
                      <input
                        type="tel"
                        placeholder="+33 6 00 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                      />
                    </Field>

                    {/* Type de demande */}
                    <Field icon={<Sparkles size={14} />} label="Type de demande">
                      <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value)}
                        required
                        style={{ color: requestType ? "white" : "rgba(255,255,255,0.2)" }}
                        className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#111113] [&>option]:text-white"
                      >
                        <option value="" disabled>Sélectionner…</option>
                        {REQUEST_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </Field>

                    {/* Sujet / Besoin */}
                    <Field icon={<Target size={14} />} label="Votre besoin principal">
                      <input
                        type="text"
                        placeholder="Décrivez votre projet en quelques mots"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                      />
                    </Field>

                    {/* Message optionnel */}
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-semibold uppercase tracking-widest text-white/25">
                        Message (optionnel)
                      </label>
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 focus-within:border-[rgba(201,165,90,0.35)] transition-colors">
                        <div className="flex items-start gap-3">
                          <MessageSquare size={14} className="mt-0.5 shrink-0 text-white/25" />
                          <textarea
                            placeholder="Contexte, questions, contraintes spécifiques…"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-white/20 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Erreur */}
                    {error && (
                      <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
                        {error}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting || !slotLabel || !fullName || !email || !requestType || !subject}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        background:  "linear-gradient(135deg, #c9a55a, #a07a3a)",
                        boxShadow:   "0 8px 32px rgba(201,165,90,0.25)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 48px rgba(201,165,90,0.4)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(201,165,90,0.25)"; }}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Confirmation…</>
                      ) : (
                        <><Calendar size={16} /> Confirmer mon appel</>
                      )}
                    </button>

                    <p className="text-center text-[0.65rem] text-white/20">
                      🔒 Vos données restent confidentielles · Aucun engagement
                    </p>
                  </form>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

/* ── Sous-composant champ formulaire ────────────────────────── */
function Field({
  icon, label, children,
}: {
  icon:     React.ReactNode;
  label:    string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.6rem] font-semibold uppercase tracking-widest text-white/25">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 focus-within:border-[rgba(201,165,90,0.35)] transition-colors">
        <span className="shrink-0 text-white/25">{icon}</span>
        {children}
      </div>
    </div>
  );
}
