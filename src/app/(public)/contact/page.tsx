"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail, Phone, MessageCircle, ArrowRight, Sparkles, Clock,
  CheckCircle2, Send, ChevronDown, User, FileText, Wallet,
  Search, Zap, Shield, Star, Users2, Calendar,
  MessagesSquare, TrendingUp, Layers, Rocket,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, cardRevealBlur, fadeIn, blurReveal, viewport } from "@/lib/animations";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ease = [0.16, 1, 0.3, 1] as const;
const siteData = getSiteData();

function isEmailValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function PremiumInput({
  icon: Icon, type = "text", placeholder, value, onChange,
  required, validate,
}: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; validate?: (v: string) => boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isValid  = validate ? validate(value) : value.length > 0;
  const showOk   = touched && value && isValid;
  const showErr  = touched && value && validate && !isValid;

  const borderColor = showErr  ? "rgba(248,113,113,0.5)"
    : showOk   ? "rgba(52,211,153,0.5)"
    : focused  ? "rgba(99,102,241,0.55)"
    : "rgba(0,0,0,0.12)";
  const shadowColor = showErr  ? "0 0 0 3px rgba(248,113,113,0.10)"
    : showOk   ? "0 0 0 3px rgba(52,211,153,0.10)"
    : focused  ? "0 0 0 3px rgba(99,102,241,0.08)"
    : "none";

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 transition-all duration-200"
      style={{ borderColor, boxShadow: shadowColor }}
    >
      <Icon size={15} className="shrink-0 transition-colors duration-200"
        style={{ color: focused || value ? "#6366f1" : "rgba(0,0,0,0.28)" }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setTouched(true); }}
        required={required}
        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-300 outline-none"
      />
      <AnimatePresence>
        {showOk && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
            <CheckCircle2 size={14} className="text-[#34d399]" />
          </motion.div>
        )}
        {showErr && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
            <span className="text-[0.6rem] font-bold text-[#f87171]">Format invalide</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PremiumTextarea({
  placeholder, value, onChange, rows = 5,
}: { placeholder: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const [focused, setFocused] = useState(false);
  const borderColor = value.length > 10 ? "rgba(52,211,153,0.45)" : focused ? "rgba(99,102,241,0.52)" : "rgba(0,0,0,0.12)";
  const shadowColor = focused ? "0 0 0 3px rgba(99,102,241,0.08)" : "none";
  return (
    <div
      className="rounded-2xl border bg-white transition-all duration-200"
      style={{ borderColor, boxShadow: shadowColor }}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <FileText size={15} className="mt-0.5 shrink-0 transition-colors duration-200"
          style={{ color: focused || value ? "#6366f1" : "rgba(0,0,0,0.28)" }} />
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={rows}
          required
          className="flex-1 resize-none bg-transparent pb-4 text-sm text-gray-900 placeholder-gray-300 outline-none"
        />
      </div>
      <div className="border-t border-gray-100 px-4 py-2 text-right">
        <span className="text-[0.6rem] text-gray-300">{value.length} caractères</span>
      </div>
    </div>
  );
}

function PremiumSelect({
  icon: Icon, placeholder, value, onChange, options,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = value ? "rgba(52,211,153,0.45)" : focused ? "rgba(99,102,241,0.52)" : "rgba(0,0,0,0.12)";
  return (
    <div
      className="relative flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 transition-all duration-200"
      style={{ borderColor }}
    >
      <Icon size={15} className="shrink-0 transition-colors duration-200"
        style={{ color: value || focused ? "#6366f1" : "rgba(0,0,0,0.28)" }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-white [&>option]:text-gray-900"
        style={{ color: value ? "#111827" : "#9ca3af" }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none shrink-0 text-gray-300" />
      {value && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
          <CheckCircle2 size={13} className="shrink-0 text-[#34d399]" />
        </motion.div>
      )}
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense>
      <ContactPageContent />
    </Suspense>
  );
}

function ContactPageContent() {
  const { dict } = useLanguage();
  const c = dict.contact;

  const { get } = useSiteSettings();
  const rawContactTitle   = get("contact.page.title");
  const contactTitleLines = rawContactTitle ? [rawContactTitle] : c.hero.titleLines;
  const contactSubtitle   = get("contact.page.subtitle") || c.hero.subtitle;
  const contactEmail      = get("contact.email")         || siteData.contact.email;
  const contactWhatsapp   = get("contact.whatsapp")      || siteData.contact.whatsapp;
  const contactPhone      = get("contact.phone")         || siteData.contact.phone;

  const SUBJECTS = c.form.subjects.map((s) => ({ value: s, label: s }));
  const BUDGETS  = c.form.budgets;

  const searchParams = useSearchParams();

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [budget,  setBudget]  = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const besoin = searchParams.get("besoin");
    if (besoin) setSubject(besoin);
  }, [searchParams]);

  const [sent,      setSent]      = useState(false);
  const [sending,   setSending]   = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid(email)) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim() || null, budget: budget || null, message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Erreur serveur");
      }
      setSent(true);
    } catch (err) {
      console.error("Contact submit error:", err);
      setSendError("Impossible d'envoyer le message. Veuillez réessayer ou nous contacter directement.");
    } finally {
      setSending(false);
    }
  }

  const canSubmit = name.trim() && isEmailValid(email) && subject && message.trim().length > 10;

  const TRUST_ICONS  = [Zap, Users2, CheckCircle2, TrendingUp, Star, Shield] as const;
  const TRUST_COLORS = [
    { color: "#c9a55a", rgb: "201,165,90"  },
    { color: "#60a5fa", rgb: "96,165,250"  },
    { color: "#4ade80", rgb: "74,222,128"  },
    { color: "#f9a826", rgb: "249,168,38"  },
    { color: "#a78bfa", rgb: "167,139,250" },
    { color: "#f87171", rgb: "248,113,113" },
  ] as const;

  const PROCESS_ICONS  = [Send, Search, MessagesSquare, Rocket] as const;
  const PROCESS_COLORS = [
    { color: "#6366f1", rgb: "99,102,241"  },
    { color: "#60a5fa", rgb: "96,165,250"  },
    { color: "#4ade80", rgb: "74,222,128"  },
    { color: "#a78bfa", rgb: "167,139,250" },
  ] as const;

  const CHANNELS = [
    { href: `mailto:${contactEmail}`, label: c.contactBlock.emailLabel, value: contactEmail, icon: Mail, color: "#c9a55a", rgb: "201,165,90", badge: null, external: false },
    { href: `https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`, label: c.contactBlock.whatsappLabel, value: contactWhatsapp, icon: MessageCircle, color: "#25d366", rgb: "37,211,102", badge: "En ligne", external: true },
    { href: `tel:${contactPhone.replace(/\s/g, "")}`, label: c.contactBlock.phoneLabel, value: contactPhone, icon: Phone, color: "#60a5fa", rgb: "96,165,250", badge: null, external: false },
  ] as const;

  return (
    <div className="bg-white">

      {/* HERO */}
      <section className="relative overflow-hidden pb-12 pt-[108px] sm:pb-20 sm:pt-[140px]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-[rgba(99,102,241,.05)] blur-[90px]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,.25)] bg-[rgba(99,102,241,.08)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em]"
            style={{ color: "#6366f1" }}
          >
            <Sparkles size={11} /> {c.hero.badge}
          </motion.div>

          <h1 className="text-[2.8rem] font-extrabold leading-tight tracking-tight text-gray-900 sm:text-[3.5rem]">
            <MultiLineReveal
              lines={contactTitleLines}
              highlight={1}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center text-gray-900"
            />
          </h1>

          <FadeReveal delay={0.55} as="p" className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
            {contactSubtitle}
          </FadeReveal>

          <FadeReveal delay={0.72} className="mt-8 flex flex-wrap justify-center gap-2.5">
            {c.hero.badges.map(({ text, color, rgb }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease, delay: 0.75 + i * 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.72rem] font-bold"
                style={{ background: `rgba(${rgb}, 0.07)`, borderColor: `rgba(${rgb}, 0.2)`, color }}
              >
                {i === 0 && <Clock size={12} />}
                {i === 1 && <Users2 size={12} />}
                {i === 2 && <MessageCircle size={12} />}
                {text}
              </motion.div>
            ))}
          </FadeReveal>
        </div>
      </section>

      {/* CANAUX DE CONTACT */}
      <section className="px-6 pb-4 pt-2 sm:pb-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {CHANNELS.map(({ href, label, value, icon: Icon, color, rgb, badge, external }) => (
              <motion.a
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                variants={blurReveal}
                className="group relative flex items-center gap-4 overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,.1)] sm:flex-col sm:items-center sm:p-5 sm:text-center"
                whileHover={{ borderColor: `rgba(${rgb}, 0.35)` }}
                transition={{ duration: 0.28, ease }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb}, 0.6), transparent)` }}
                />
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-110 sm:h-12 sm:w-12"
                  style={{ background: `rgba(${rgb}, 0.1)`, borderColor: `rgba(${rgb}, 0.22)` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1 sm:flex-none">
                  <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-gray-400">{label}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-gray-700 sm:max-w-[160px]">{value}</p>
                </div>
                {badge ? (
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-black" style={{ background: `rgba(${rgb}, 0.12)`, color }}>
                    {badge}
                  </span>
                ) : (
                  <ArrowRight size={14} className="shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 sm:hidden" style={{ color: `rgba(${rgb}, 0.5)` }} />
                )}
              </motion.a>
            ))}
          </motion.div>

          <div className="mt-8 flex items-center gap-5">
            <div className="h-px flex-1 bg-gray-100" />
            <p className="shrink-0 text-[0.68rem] font-semibold text-gray-300">ou remplissez le formulaire</p>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
        </div>
      </section>

      {/* FORMULAIRE + INFOS */}
      <section className="px-6 pb-10 pt-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* Formulaire */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease }}
              className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,.08)]"
            >
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    <div className="relative border-b border-gray-100 px-7 py-6 sm:px-8 sm:py-7">
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366f1] to-transparent opacity-60" />
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(99,102,241,.25)] bg-[rgba(99,102,241,.08)]">
                          <Send size={17} style={{ color: "#6366f1" }} />
                        </div>
                        <div>
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#6366f1]">
                            {c.form.subtitle}
                          </p>
                          <p className="mt-0.5 text-[1.05rem] font-extrabold text-gray-900">
                            {c.form.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 p-7 sm:p-8">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">Votre nom *</label>
                          <PremiumInput icon={User} placeholder={c.form.namePlaceholder} value={name} onChange={setName} required />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">Adresse e-mail *</label>
                          <PremiumInput icon={Mail} type="email" placeholder={c.form.emailPlaceholder} value={email} onChange={setEmail} required validate={isEmailValid} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">Sujet de votre demande *</label>
                        <PremiumSelect icon={Search} placeholder={c.form.subjectPlaceholder} value={subject} onChange={setSubject} options={SUBJECTS} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">Budget estimé</label>
                        <PremiumSelect icon={Wallet} placeholder={c.form.budgetPlaceholder} value={budget} onChange={setBudget} options={BUDGETS} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">Décrivez votre projet *</label>
                        <PremiumTextarea placeholder={c.form.messagePlaceholder} value={message} onChange={setMessage} rows={5} />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={sending || !canSubmit}
                        whileHover={canSubmit ? { scale: 1.02, y: -1 } : {}}
                        whileTap={canSubmit ? { scale: 0.98 } : {}}
                        className="group relative w-full overflow-hidden rounded-2xl py-4 text-sm font-extrabold transition-all duration-300 disabled:opacity-40"
                        style={{
                          background: canSubmit ? "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)" : "rgba(0,0,0,0.05)",
                          color: canSubmit ? "#ffffff" : "rgba(0,0,0,0.28)",
                          boxShadow: canSubmit ? "0 8px 24px rgba(99,102,241,0.3)" : "none",
                        }}
                      >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <span className="relative flex items-center justify-center gap-2">
                          {sending ? (
                            <>
                              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                              {c.form.sending}
                            </>
                          ) : (
                            <>{c.form.submit}<Send size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>
                          )}
                        </span>
                      </motion.button>

                      {sendError && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.06)] px-4 py-3.5">
                          <span className="mt-0.5 shrink-0 text-[#f87171]">!</span>
                          <p className="text-[0.81rem] leading-relaxed text-[#f87171]">{sendError}</p>
                        </motion.div>
                      )}

                      <p className="text-center text-[0.66rem] text-gray-300">{c.form.disclaimer}</p>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }}
                    className="flex flex-col items-center justify-center px-8 py-16 sm:py-24 text-center">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)]">
                      <CheckCircle2 size={38} className="text-[#34d399]" />
                    </motion.div>
                    <motion.h3 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-extrabold text-gray-900">{c.form.successTitle}</motion.h3>
                    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">{c.form.successText}</motion.p>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                      className="mt-6 flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.07)] px-4 py-2">
                      <Clock size={12} className="text-[#34d399]" />
                      <span className="text-xs font-bold text-[#34d399]">{c.form.successBadge}</span>
                    </motion.div>
                    <button onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setBudget(""); setMessage(""); }}
                      className="mt-8 text-sm font-bold text-gray-400 transition hover:text-gray-700">{c.form.newMessage}</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Colonne droite */}
            <div className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: 0.1 }}
                className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,.08)]"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent opacity-60" />
                <div className="relative p-6 sm:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.span className="h-2 w-2 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.15em] text-gray-400">{c.contactBlock.title}</p>
                    </div>
                    <span className="rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.07)] px-2.5 py-1 text-[0.55rem] font-black uppercase tracking-widest text-[#34d399]">Disponible</span>
                  </div>

                  <h3 className="text-[1.05rem] font-extrabold text-gray-900">{c.contactBlock.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{c.contactBlock.subtitle}</p>

                  <div className="mt-5 space-y-2.5">
                    {CHANNELS.map(({ href, label, value, icon: Icon, color, rgb, badge, external }) => (
                      <a key={href} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5 transition-all duration-250 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white hover:shadow-[0_2px_10px_rgba(0,0,0,.06)]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-250 group-hover:scale-110" style={{ background: `rgba(${rgb}, 0.1)`, borderColor: `rgba(${rgb}, 0.22)` }}>
                          <Icon size={17} style={{ color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400">{label}</p>
                          <p className="mt-0.5 truncate text-[0.82rem] font-semibold text-gray-700">{value}</p>
                        </div>
                        {badge ? (
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-black" style={{ background: `rgba(${rgb}, 0.12)`, color }}>{badge}</span>
                        ) : (
                          <ArrowRight size={12} className="shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: `rgba(${rgb}, 0.45)` }} />
                        )}
                      </a>
                    ))}

                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)]">
                        <Clock size={17} className="text-[#34d399]" />
                      </div>
                      <div>
                        <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400">{c.contactBlock.delayLabel}</p>
                        <p className="mt-0.5 text-[0.82rem] font-semibold text-gray-700">{c.contactBlock.delayValue}</p>
                      </div>
                    </div>
                  </div>

                  <Link href="/reserver-appel"
                    className="group mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.08)] py-3.5 text-sm font-bold transition-all duration-250 hover:border-[rgba(201,165,90,.45)] hover:bg-[rgba(201,165,90,.14)]"
                    style={{ color: "#b08d57" }}>
                    <Calendar size={14} />
                    {c.contactBlock.bookBtn}
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>

              {[
                { href: "/services",     label: "Voir nos services",  sub: "Sites, apps, administratif…", icon: Layers },
                { href: "/realisations", label: "Nos réalisations",   sub: "WEWE, Mondouka, Clamac…",     icon: Star   },
              ].map(({ href, label, sub, icon: Icon }, i) => (
                <motion.div key={href} initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, ease, delay: 0.2 + i * 0.08 }}>
                  <Link href={href}
                    className="group flex items-center justify-between rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_6px_20px_rgba(0,0,0,.09)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,.25)] bg-[rgba(201,165,90,.09)] transition-all duration-250 group-hover:scale-110">
                        <Icon size={16} style={{ color: "#c9a55a" }} />
                      </div>
                      <div>
                        <p className="text-[0.88rem] font-extrabold text-gray-700 transition-colors duration-200 group-hover:text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#c9a55a]" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESSUS */}
      <section className="relative border-t border-gray-100 bg-[#f8f9fa] px-6 py-24 overflow-hidden">
        <div className="relative mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}>
            <div className="mb-14 text-center">
              <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,.25)] bg-[rgba(99,102,241,.07)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#6366f1" }}>
                <Zap size={10} /> {c.process.badge}
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-[1.9rem] font-extrabold text-gray-900 sm:text-[2.4rem]">{c.process.title}</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-base text-gray-500">{c.process.subtitle}</motion.p>
            </div>

            <motion.div variants={staggerContainerFast} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {c.process.steps.map(({ step, title, desc }, i) => {
                const Icon = PROCESS_ICONS[i];
                const { color, rgb } = PROCESS_COLORS[i];
                return (
                  <motion.div key={step} variants={cardRevealBlur}
                    className="group relative flex flex-col gap-4 overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,.05)] transition-all duration-350 hover:border-gray-300 hover:-translate-y-1.5 hover:shadow-[0_8px_28px_rgba(0,0,0,.1)]">
                    <span className="pointer-events-none absolute -right-1 -top-5 select-none text-[6rem] font-black leading-none text-black/[.04]" aria-hidden="true">{step}</span>
                    <div className="relative inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl border" style={{ background: `rgba(${rgb}, 0.1)`, borderColor: `rgba(${rgb}, 0.22)` }}>
                      <Icon size={23} style={{ color }} />
                    </div>
                    <div>
                      <span className="text-[0.58rem] font-black uppercase tracking-[0.18em]" style={{ color }}>Étape {step}</span>
                      <h3 className="mt-1 text-[0.92rem] font-extrabold text-gray-900">{title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-500">{desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION CONFIANCE */}
      <section className="border-t border-gray-100 bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}>
            <div className="mb-12 text-center">
              <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.07)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#b08d57" }}>
                <Shield size={10} /> {c.trust.badge}
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-[1.9rem] font-extrabold text-gray-900 sm:text-[2.4rem]">{c.trust.title}</motion.h2>
            </div>

            <motion.div variants={staggerContainerFast} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.trust.items.map(({ title, desc }, i) => {
                const Icon = TRUST_ICONS[i];
                const { color, rgb } = TRUST_COLORS[i];
                return (
                  <motion.div key={title} variants={cardRevealBlur}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,.05)] transition-all duration-300 hover:border-gray-300 hover:-translate-y-1 hover:shadow-[0_6px_24px_rgba(0,0,0,.09)]">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border" style={{ background: `rgba(${rgb}, 0.1)`, borderColor: `rgba(${rgb}, 0.22)` }}>
                      <Icon size={21} style={{ color }} />
                    </div>
                    <h3 className="text-[0.9rem] font-extrabold text-gray-900">{title}</h3>
                    <p className="mt-2 text-[0.82rem] leading-relaxed text-gray-500">{desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-gray-100 px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}
            transition={{ duration: 0.75, ease }}
            className="relative overflow-hidden rounded-[2.5rem] px-10 py-14 sm:px-14 text-white"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%)" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[200px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,255,255,.18),transparent)]" />
            <div className="relative">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-white/70">{c.finalCta.label}</p>
              <h2 className="mt-3 text-[1.9rem] font-extrabold leading-tight sm:text-[2.4rem]">{c.finalCta.title}</h2>
              <p className="mx-auto mt-4 max-w-md text-base text-white/70">Envoyez votre demande maintenant — nous vous répondons sous 24h avec une proposition adaptée.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <motion.a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="btn-primary px-8 py-4" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
                  {c.finalCta.btn1} <ArrowRight size={16} />
                </motion.a>
                <motion.a href={`https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/30 bg-white/15 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/25"
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
                  <MessageCircle size={16} /> {c.finalCta.btn2}
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
