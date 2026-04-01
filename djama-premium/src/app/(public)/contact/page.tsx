"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  Mail, Phone, MessageCircle, ArrowRight, Sparkles, Clock,
  CheckCircle2, Send, ChevronDown, User, FileText, Wallet,
  Search, Zap, Shield, Star, Users, Calendar,
  MessageSquare, TrendingUp, Layers,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";

const ease = [0.16, 1, 0.3, 1] as const;
const siteData = getSiteData();

/* ── Validation ───────────────────────────────── */
function isEmailValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ── Input premium dark ───────────────────────── */
function PremiumInput({
  icon: Icon, type = "text", placeholder, value, onChange,
  required, validate,
}: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; validate?: (v: string) => boolean;
}) {
  const [focused, setFocused]   = useState(false);
  const [touched, setTouched]   = useState(false);
  const isValid = validate ? validate(value) : value.length > 0;
  const showOk  = touched && value && isValid;
  const showErr = touched && value && validate && !isValid;

  const borderColor = showErr ? "rgba(248,113,113,0.5)" : showOk ? "rgba(52,211,153,0.45)" : focused ? "rgba(201,165,90,0.5)" : "rgba(255,255,255,0.09)";
  const shadowColor = showErr ? "0 0 0 3px rgba(248,113,113,0.12)" : showOk ? "0 0 0 3px rgba(52,211,153,0.12)" : focused ? "0 0 0 3px rgba(201,165,90,0.1)" : "none";

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor, boxShadow: shadowColor }}
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
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
            <CheckCircle2 size={14} className="text-[#34d399]" />
          </motion.div>
        )}
        {showErr && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
            <span className="text-[0.6rem] font-bold text-[#f87171]">Format invalide</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Textarea premium dark ────────────────────── */
function PremiumTextarea({
  placeholder, value, onChange, rows = 5,
}: { placeholder: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const [focused, setFocused] = useState(false);
  const borderColor = value.length > 10 ? "rgba(52,211,153,0.35)" : focused ? "rgba(201,165,90,0.45)" : "rgba(255,255,255,0.09)";
  const shadowColor = focused ? "0 0 0 3px rgba(201,165,90,0.08)" : "none";
  return (
    <div
      className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
      style={{ borderColor, boxShadow: shadowColor }}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <FileText size={15} className="mt-0.5 shrink-0" style={{ color: focused || value ? "#c9a55a" : "rgba(255,255,255,0.25)" }} />
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={rows}
          required
          className="flex-1 resize-none bg-transparent pb-4 text-sm text-white placeholder-white/25 outline-none"
        />
      </div>
      {/* Compteur caractères */}
      <div className="border-t border-white/[0.05] px-4 py-2 text-right">
        <span className="text-[0.6rem] text-white/20">{value.length} caractères</span>
      </div>
    </div>
  );
}

/* ── Select premium dark ──────────────────────── */
function PremiumSelect({
  icon: Icon, placeholder, value, onChange, options,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = value ? "rgba(52,211,153,0.35)" : focused ? "rgba(201,165,90,0.45)" : "rgba(255,255,255,0.09)";
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
        className="flex-1 appearance-none bg-transparent text-sm text-white outline-none [&>option]:bg-[#111113] [&>option]:text-white"
        style={{ color: value ? "white" : "rgba(255,255,255,0.25)" }}
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

/* ════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════ */
export default function ContactPage() {
  const { dict } = useLanguage();
  const c = dict.contact;

  const SUBJECTS = c.form.subjects.map((s) => ({ value: s, label: s }));
  const BUDGETS  = c.form.budgets;

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [budget,  setBudget]  = useState("");
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid(email)) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1600);
  }

  const canSubmit = name.trim() && isEmailValid(email) && subject && message.trim().length > 10;

  const TRUST_ICONS = [Zap, Users, CheckCircle2, TrendingUp, Star, Shield] as const;
  const TRUST_COLORS = [
    { color: "#c9a55a", rgb: "201,165,90"  },
    { color: "#60a5fa", rgb: "96,165,250"  },
    { color: "#4ade80", rgb: "74,222,128"  },
    { color: "#f9a826", rgb: "249,168,38"  },
    { color: "#a78bfa", rgb: "167,139,250" },
    { color: "#f87171", rgb: "248,113,113" },
  ] as const;

  const PROCESS_ICONS = [Send, Search, MessageSquare, TrendingUp] as const;
  const PROCESS_COLORS = [
    { color: "#c9a55a", rgb: "201,165,90"  },
    { color: "#60a5fa", rgb: "96,165,250"  },
    { color: "#4ade80", rgb: "74,222,128"  },
    { color: "#a78bfa", rgb: "167,139,250" },
  ] as const;

  return (
    <div className="bg-[#09090b]">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-28 pt-40">
        {/* Backgrounds */}
        <div className="hero-grid absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[350px] w-[500px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[70px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">

          {/* Badge animé */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]"
          >
            <Sparkles size={11} /> {c.hero.badge}
          </motion.div>

          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={c.hero.titleLines}
              highlight={1}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          <div className="pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 h-24 w-64 rounded-full bg-[rgba(201,165,90,0.15)] blur-[40px]" />

          <FadeReveal delay={0.65} as="p" className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/45">
            {c.hero.subtitle}
          </FadeReveal>

          {/* Badges animés */}
          <FadeReveal delay={0.82} className="mt-10 flex flex-wrap justify-center gap-3">
            {c.hero.badges.map(({ text, color, rgb }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease, delay: 0.85 + i * 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.72rem] font-bold"
                style={{
                  background: `rgba(${rgb}, 0.08)`,
                  borderColor: `rgba(${rgb}, 0.22)`,
                  color,
                }}
              >
                {i === 0 && <Clock size={12} />}
                {i === 1 && <Users size={12} />}
                {i === 2 && <MessageCircle size={12} />}
                {text}
              </motion.div>
            ))}
          </FadeReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FORMULAIRE + INFOS
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

            {/* ── Formulaire ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease }}
              className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#111113]"
            >
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Header formulaire */}
                    <div className="border-b border-white/[0.06] px-8 py-7">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.1)] border border-[rgba(201,165,90,0.2)]">
                          <Send size={15} className="text-[#c9a55a]" />
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-[#c9a55a]">
                            {c.form.subtitle}
                          </p>
                          <p className="text-base font-extrabold text-white">
                            {c.form.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Champs */}
                    <form onSubmit={handleSubmit} className="space-y-4 p-8">
                      {/* Nom + Email */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/35">
                            Votre nom *
                          </label>
                          <PremiumInput
                            icon={User}
                            placeholder={c.form.namePlaceholder}
                            value={name}
                            onChange={setName}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/35">
                            Adresse e-mail *
                          </label>
                          <PremiumInput
                            icon={Mail}
                            type="email"
                            placeholder={c.form.emailPlaceholder}
                            value={email}
                            onChange={setEmail}
                            required
                            validate={isEmailValid}
                          />
                        </div>
                      </div>

                      {/* Sujet */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/35">
                          Sujet de votre demande *
                        </label>
                        <PremiumSelect
                          icon={Search}
                          placeholder={c.form.subjectPlaceholder}
                          value={subject}
                          onChange={setSubject}
                          options={SUBJECTS}
                        />
                      </div>

                      {/* Budget */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/35">
                          Budget estimé
                        </label>
                        <PremiumSelect
                          icon={Wallet}
                          placeholder={c.form.budgetPlaceholder}
                          value={budget}
                          onChange={setBudget}
                          options={BUDGETS}
                        />
                      </div>

                      {/* Message */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-white/35">
                          Décrivez votre projet *
                        </label>
                        <PremiumTextarea
                          placeholder={c.form.messagePlaceholder}
                          value={message}
                          onChange={setMessage}
                          rows={5}
                        />
                      </div>

                      {/* Submit */}
                      <motion.button
                        type="submit"
                        disabled={sending || !canSubmit}
                        whileHover={canSubmit ? { scale: 1.02, y: -1 } : {}}
                        whileTap={canSubmit ? { scale: 0.98 } : {}}
                        className="group relative w-full overflow-hidden rounded-2xl py-4 text-sm font-extrabold transition-all duration-300 disabled:opacity-40"
                        style={{
                          background: canSubmit
                            ? "linear-gradient(135deg, #c9a55a 0%, #b08d57 100%)"
                            : "rgba(255,255,255,0.06)",
                          color: canSubmit ? "#09090b" : "rgba(255,255,255,0.3)",
                          boxShadow: canSubmit ? "0 8px 32px rgba(201,165,90,0.25)" : "none",
                        }}
                      >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <span className="relative flex items-center justify-center gap-2">
                          {sending ? (
                            <>
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                className="inline-block h-4 w-4 rounded-full border-2 border-[#09090b]/30 border-t-[#09090b]"
                              />
                              {c.form.sending}
                            </>
                          ) : (
                            <>
                              {c.form.submit}
                              <Send size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </>
                          )}
                        </span>
                      </motion.button>

                      <p className="text-center text-[0.68rem] text-white/20">
                        {c.form.disclaimer}
                      </p>
                    </form>
                  </motion.div>
                ) : (
                  /* ── Succès ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease }}
                    className="flex flex-col items-center justify-center px-8 py-24 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)]"
                    >
                      <CheckCircle2 size={38} className="text-[#34d399]" />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-extrabold text-white"
                    >
                      {c.form.successTitle}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mt-3 max-w-xs text-sm leading-relaxed text-white/45"
                    >
                      {c.form.successText}
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] px-4 py-2"
                    >
                      <Clock size={12} className="text-[#34d399]" />
                      <span className="text-xs font-bold text-[#34d399]">{c.form.successBadge}</span>
                    </motion.div>
                    <button
                      onClick={() => {
                        setSent(false); setName(""); setEmail("");
                        setSubject(""); setBudget(""); setMessage("");
                      }}
                      className="mt-8 text-sm font-bold text-white/30 transition hover:text-white/60"
                    >
                      {c.form.newMessage}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Bloc contact droite ── */}
            <div className="flex flex-col gap-4">

              {/* Carte principale dark */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: 0.1 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#111113] p-7"
              >
                <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[rgba(201,165,90,0.07)] blur-[70px]" />

                <div className="relative">
                  <div className="mb-5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/30">
                      {c.contactBlock.title}
                    </p>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">{c.contactBlock.title}</h3>
                  <p className="mt-1.5 text-sm text-white/35">
                    {c.contactBlock.subtitle}
                  </p>

                  {/* Canaux */}
                  <div className="mt-6 space-y-2.5">
                    {/* Email */}
                    <a
                      href={`mailto:${siteData.contact.email}`}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-all duration-200 hover:border-[rgba(201,165,90,0.25)] hover:bg-[rgba(201,165,90,0.05)]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.1)] border border-[rgba(201,165,90,0.2)]">
                        <Mail size={15} className="text-[#c9a55a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{c.contactBlock.emailLabel}</p>
                        <p className="truncate text-sm font-semibold text-white/75">{siteData.contact.email}</p>
                      </div>
                      <ArrowRight size={13} className="shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-[#c9a55a]" />
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${siteData.contact.whatsapp.replace(/\D/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-all duration-200 hover:border-[rgba(37,211,102,0.3)] hover:bg-[rgba(37,211,102,0.05)]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.2)]">
                        <MessageCircle size={15} className="text-[#25d366]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{c.contactBlock.whatsappLabel}</p>
                        <p className="text-sm font-semibold text-white/75">{siteData.contact.whatsapp}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[rgba(37,211,102,0.15)] px-2 py-0.5 text-[0.55rem] font-black text-[#25d366]">
                        En ligne
                      </span>
                    </a>

                    {/* Téléphone */}
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(96,165,250,0.1)] border border-[rgba(96,165,250,0.2)]">
                        <Phone size={15} className="text-[#60a5fa]" />
                      </div>
                      <div>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{c.contactBlock.phoneLabel}</p>
                        <p className="text-sm font-semibold text-white/75">{siteData.contact.whatsapp}</p>
                      </div>
                    </div>

                    {/* Délai */}
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)]">
                        <Clock size={15} className="text-[#34d399]" />
                      </div>
                      <div>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{c.contactBlock.delayLabel}</p>
                        <p className="text-sm font-semibold text-white/75">{c.contactBlock.delayValue}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bouton Réserver un appel */}
                  <a
                    href={`https://wa.me/${siteData.contact.whatsapp.replace(/\D/g, "")}?text=Bonjour%2C%20je%20souhaite%20r%C3%A9server%20un%20appel%20d%C3%A9couverte.`}
                    target="_blank" rel="noopener noreferrer"
                    className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] py-3 text-sm font-bold text-[#c9a55a] transition-all duration-200 hover:bg-[rgba(201,165,90,0.14)] hover:border-[rgba(201,165,90,0.4)]"
                  >
                    <Calendar size={14} />
                    {c.contactBlock.bookBtn}
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </motion.div>

              {/* Liens rapides */}
              {[
                { href: "/services",     label: "Voir nos services",  sub: "Sites, apps, administratif…", icon: Layers },
                { href: "/realisations", label: "Nos réalisations",   sub: "WEWE, Mondouka, Clamac…",     icon: Star   },
              ].map(({ href, label, sub, icon: Icon }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, ease, delay: 0.2 + i * 0.08 }}
                >
                  <Link
                    href={href}
                    className="group flex items-center justify-between rounded-[1.5rem] border border-white/[0.07] bg-[#111113] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(201,165,90,0.2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.08)] border border-[rgba(201,165,90,0.15)]">
                        <Icon size={15} className="text-[#c9a55a]" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white/75 group-hover:text-white">{label}</p>
                        <p className="text-xs text-white/30">{sub}</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-[#c9a55a]" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMMENT ÇA SE PASSE
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={staggerContainer}
          >
            <div className="mb-16 text-center">
              <motion.span variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">
                <Zap size={10} /> {c.process.badge}
              </motion.span>
              <motion.h2 variants={fadeIn} className="display-section mt-4 text-white">
                {c.process.title}
              </motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-base text-white/35">
                {c.process.subtitle}
              </motion.p>
            </div>

            <motion.div
              variants={staggerContainerFast}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {c.process.steps.map(({ step, title, desc }, i) => {
                const Icon = PROCESS_ICONS[i];
                const { color, rgb } = PROCESS_COLORS[i];
                return (
                  <motion.div
                    key={step}
                    variants={cardReveal}
                    className="group relative flex flex-col gap-5 overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#111113] p-6 transition-all duration-400 hover:border-white/[0.13] hover:-translate-y-1"
                    style={{ "--step-color": color } as React.CSSProperties}
                  >
                    {/* Numéro en fond */}
                    <div
                      className="pointer-events-none absolute right-4 top-2 text-[4rem] font-black leading-none opacity-[0.04] select-none"
                      style={{ color }}
                    >
                      {step}
                    </div>

                    {/* Icône */}
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl border"
                      style={{
                        background: `rgba(${rgb}, 0.10)`,
                        borderColor: `rgba(${rgb}, 0.22)`,
                      }}
                    >
                      <Icon size={22} style={{ color }} />
                    </div>

                    {/* Numéro badge */}
                    <div>
                      <span
                        className="text-[0.6rem] font-black uppercase tracking-[0.18em]"
                        style={{ color }}
                      >
                        Étape {step}
                      </span>
                      <h3 className="mt-1 text-[0.95rem] font-extrabold text-white/85">{title}</h3>
                    </div>

                    <p className="text-xs leading-relaxed text-white/40">{desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION CONFIANCE
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={staggerContainer}
          >
            <div className="mb-14 text-center">
              <motion.span variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">
                <Shield size={10} /> {c.trust.badge}
              </motion.span>
              <motion.h2 variants={fadeIn} className="display-section mt-4 text-white">
                {c.trust.title}
              </motion.h2>
            </div>

            <motion.div variants={staggerContainerFast} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.trust.items.map(({ title, desc }, i) => {
                const Icon = TRUST_ICONS[i];
                const { color, rgb } = TRUST_COLORS[i];
                return (
                  <motion.div
                    key={title}
                    variants={cardReveal}
                    className="group rounded-[1.5rem] border border-white/[0.07] bg-[#111113] p-6 transition-all duration-300 hover:border-white/[0.13] hover:bg-white/[0.04]"
                  >
                    <div
                      className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border"
                      style={{ background: `rgba(${rgb}, 0.10)`, borderColor: `rgba(${rgb}, 0.22)` }}
                    >
                      <Icon size={20} style={{ color }} />
                    </div>
                    <h3 className="text-[0.9rem] font-extrabold text-white/85">{title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/38">{desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease }}
          >
            <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#c9a55a]">{c.finalCta.label}</p>
            <h2 className="display-section mt-3 text-white">{c.finalCta.title}</h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/35">
              Envoyez votre demande maintenant — nous vous répondons sous 24h avec une proposition adaptée.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="btn-primary px-8 py-4"
              >
                {c.finalCta.btn1} <ArrowRight size={16} />
              </a>
              <a
                href={`https://wa.me/${siteData.contact.whatsapp.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[1.25rem] border border-[rgba(37,211,102,0.25)] bg-[rgba(37,211,102,0.07)] px-8 py-4 text-sm font-bold text-[#25d366] transition-all hover:bg-[rgba(37,211,102,0.12)]"
              >
                <MessageCircle size={16} /> {c.finalCta.btn2}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
