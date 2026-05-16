"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail, Phone, MessageCircle, ArrowRight, Sparkles, Clock,
  CheckCircle2, Send, ChevronDown, User, FileText, Wallet,
  Search, Zap, Shield, Star, BadgeCheck,
  MessagesSquare, Rocket, Layers, Calendar,
} from "lucide-react";
import { cardRevealBlur, fadeIn, viewport } from "@/lib/animations";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD     = "#c9a55a";
const GOLD_RGB = "201,165,90";
const siteData = getSiteData();

function isEmailValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ─── Input ─── */
function PremiumInput({
  icon: Icon, type = "text", placeholder, value, onChange, required, validate,
}: {
  icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; validate?: (v: string) => boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isValid = validate ? validate(value) : value.length > 0;
  const showOk  = touched && !!value && isValid;
  const showErr = touched && !!value && !!validate && !isValid;

  const borderColor = showErr  ? "rgba(248,113,113,0.5)"
    : showOk   ? "rgba(52,211,153,0.5)"
    : focused  ? `rgba(${GOLD_RGB},0.5)`
    : "rgba(0,0,0,0.10)";
  const shadow = focused ? `0 0 0 3px rgba(${GOLD_RGB},0.08)` : "none";

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-[#fafafa] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor, boxShadow: shadow }}>
      <Icon size={15} className="shrink-0 transition-colors duration-200"
        style={{ color: focused || value ? GOLD : "rgba(0,0,0,0.25)" }} />
      <input type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setTouched(true); }}
        required={required}
        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-300 outline-none" />
      <AnimatePresence>
        {showOk && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.18 }}>
            <CheckCircle2 size={14} className="text-[#34d399]" />
          </motion.div>
        )}
        {showErr && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.18 }}>
            <span className="text-[0.6rem] font-bold text-[#f87171]">Format invalide</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Textarea ─── */
function PremiumTextarea({
  placeholder, value, onChange, rows = 5,
}: { placeholder: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const [focused, setFocused] = useState(false);
  const borderColor = value.length > 10 ? "rgba(52,211,153,0.45)"
    : focused ? `rgba(${GOLD_RGB},0.5)` : "rgba(0,0,0,0.10)";
  const shadow = focused ? `0 0 0 3px rgba(${GOLD_RGB},0.08)` : "none";
  return (
    <div className="rounded-2xl border bg-[#fafafa] transition-all duration-200"
      style={{ borderColor, boxShadow: shadow }}>
      <div className="flex items-start gap-3 px-4 pt-4">
        <FileText size={15} className="mt-0.5 shrink-0 transition-colors duration-200"
          style={{ color: focused || value ? GOLD : "rgba(0,0,0,0.25)" }} />
        <textarea placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          rows={rows} required
          className="flex-1 resize-none bg-transparent pb-4 text-sm text-gray-900 placeholder-gray-300 outline-none" />
      </div>
      <div className="border-t border-gray-100 px-4 py-2 text-right">
        <span className="text-[0.6rem] text-gray-300">{value.length} caractères</span>
      </div>
    </div>
  );
}

/* ─── Select ─── */
function PremiumSelect({
  icon: Icon, placeholder, value, onChange, options,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = value ? "rgba(52,211,153,0.45)"
    : focused ? `rgba(${GOLD_RGB},0.5)` : "rgba(0,0,0,0.10)";
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border bg-[#fafafa] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor }}>
      <Icon size={15} className="shrink-0 transition-colors duration-200"
        style={{ color: value || focused ? GOLD : "rgba(0,0,0,0.25)" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-white [&>option]:text-gray-900"
        style={{ color: value ? "#111827" : "#9ca3af" }}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="pointer-events-none shrink-0 text-gray-300" />
      {value && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
          <CheckCircle2 size={13} className="text-[#34d399]" />
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function ContactPage() {
  return <Suspense><ContactPageContent /></Suspense>;
}

function ContactPageContent() {
  const { dict, lang } = useLanguage();
  const c = dict.contact;
  const { get } = useSiteSettings();

  const contactEmail    = get("contact.email")    || siteData.contact.email;
  const contactWhatsapp = get("contact.whatsapp") || siteData.contact.whatsapp;
  const contactPhone    = get("contact.phone")    || siteData.contact.phone;

  const SUBJECTS = c.form.subjects.map((s) => ({ value: s, label: s }));
  const BUDGETS  = c.form.budgets;

  const searchParams = useSearchParams();
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [budget,  setBudget]  = useState("");
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const besoin = searchParams.get("besoin");
    if (besoin) setSubject(besoin);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid(email)) return;
    setSending(true); setSendError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim() || null, budget: budget || null, message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Erreur serveur");
      }
      setSent(true);
    } catch {
      setSendError("Impossible d'envoyer le message. Veuillez réessayer ou nous contacter directement.");
    } finally {
      setSending(false);
    }
  }

  const canSubmit = name.trim() && isEmailValid(email) && subject && message.trim().length > 10;

  const CHANNELS = [
    { href: `mailto:${contactEmail}`,                              label: c.contactBlock.emailLabel,    value: contactEmail,    icon: Mail,           color: GOLD,      rgb: GOLD_RGB,    badge: null,       external: false },
    { href: `https://wa.me/${contactWhatsapp.replace(/\D/g,"")}`, label: c.contactBlock.whatsappLabel, value: contactWhatsapp, icon: MessageCircle,  color: "#25d366", rgb: "37,211,102", badge: "En ligne", external: true  },
    { href: `tel:${contactPhone.replace(/\s/g,"")}`,              label: c.contactBlock.phoneLabel,    value: contactPhone,    icon: Phone,          color: "#60a5fa", rgb: "96,165,250", badge: null,       external: false },
  ] as const;

  const PROCESS_STEPS = [
    { num: "01", icon: Send,          color: GOLD,      rgb: GOLD_RGB,      title: c.process.steps[0]?.title ?? "Envoi",        desc: c.process.steps[0]?.desc ?? "" },
    { num: "02", icon: MessagesSquare,color: "#7c6fcd", rgb: "124,111,205", title: c.process.steps[1]?.title ?? "Analyse",      desc: c.process.steps[1]?.desc ?? "" },
    { num: "03", icon: Search,        color: "#34d399", rgb: "52,211,153",  title: c.process.steps[2]?.title ?? "Proposition",  desc: c.process.steps[2]?.desc ?? "" },
    { num: "04", icon: Rocket,        color: "#f9a826", rgb: "249,168,38",  title: c.process.steps[3]?.title ?? "Lancement",    desc: c.process.steps[3]?.desc ?? "" },
  ];

  return (
    <div className="bg-white">

      {/* ═══════════════════════════════════════════
          HERO — homepage style
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white px-5 pb-12 pt-[108px] sm:pb-16 sm:pt-[132px]">
        {/* Orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-80px] h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-35 blur-[90px]"
            style={{ background: `radial-gradient(circle,rgba(${GOLD_RGB},0.22),transparent 70%)` }} />
          <div className="absolute right-[-60px] top-[60px] h-[200px] w-[200px] rounded-full opacity-22 blur-[70px]"
            style={{ background: "radial-gradient(circle,rgba(124,111,205,0.3),transparent 70%)" }} />
          <div className="absolute bottom-[20px] left-[-40px] h-[170px] w-[170px] rounded-full opacity-18 blur-[60px]"
            style={{ background: "radial-gradient(circle,rgba(52,211,153,0.25),transparent 70%)" }} />
        </div>

        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.13 } } }}
          className="relative z-10 mx-auto max-w-lg text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeIn}
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em]"
            style={{ borderColor: `rgba(${GOLD_RGB},0.28)`, background: `rgba(${GOLD_RGB},0.07)`, color: GOLD }}>
            <Sparkles size={9} /> {c.hero.badge}
          </motion.div>

          {/* Title */}
          <motion.h1 variants={fadeIn}
            className="text-[2.4rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-[3rem]">
            {lang === "fr"
              ? <>Parlons de votre <span style={{ color: GOLD }}>projet.</span></>
              : <>Let&apos;s talk about your <span style={{ color: GOLD }}>project.</span></>}
          </motion.h1>

          <motion.p variants={fadeIn}
            className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-gray-500">
            {c.hero.subtitle}
          </motion.p>

          {/* Stats chips */}
          <motion.div variants={fadeIn} className="mt-8 grid grid-cols-3 gap-3">
            {([
              { icon: Clock,      value: "24h", label: lang === "fr" ? "Réponse\nrapide"   : "Fast\nreply"      },
              { icon: BadgeCheck, value: "✓",   label: lang === "fr" ? "Devis\ngratuit"    : "Free\nquote"      },
              { icon: Shield,     value: "0€",  label: lang === "fr" ? "Sans\nengagement"  : "No\ncommitment"   },
            ] as const).map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-2xl px-2 py-4"
                style={{ background: `rgba(${GOLD_RGB},0.06)` }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `rgba(${GOLD_RGB},0.12)`, color: GOLD }}>
                  <Icon size={16} />
                </div>
                <span className="text-[1.2rem] font-extrabold leading-none text-gray-900">{value}</span>
                <span className="text-center text-[0.64rem] leading-snug text-gray-500" style={{ whiteSpace: "pre-line" }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          CANAUX DE CONTACT
      ═══════════════════════════════════════════ */}
      <section className="px-6 pb-6 pt-2">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {CHANNELS.map(({ href, label, value, icon: Icon, color, rgb, badge, external }) => (
              <motion.a key={href} href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                variants={cardRevealBlur}
                className="group relative flex items-center gap-4 overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,.10)] sm:flex-col sm:items-center sm:p-5 sm:text-center"
                whileHover={{ borderColor: `rgba(${rgb},0.35)` }}
                transition={{ duration: 0.28, ease }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg,transparent,rgba(${rgb},0.6),transparent)` }} />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-110 sm:h-12 sm:w-12"
                  style={{ background: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.22)` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1 sm:flex-none">
                  <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-gray-400">{label}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-gray-700 sm:max-w-[160px]">{value}</p>
                </div>
                {badge
                  ? <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-black" style={{ background: `rgba(${rgb},0.12)`, color }}>{badge}</span>
                  : <ArrowRight size={14} className="shrink-0 transition-all duration-200 group-hover:translate-x-0.5 sm:hidden" style={{ color: `rgba(${rgb},0.5)` }} />
                }
              </motion.a>
            ))}
          </motion.div>

          <div className="mt-8 flex items-center gap-5">
            <div className="h-px flex-1 bg-gray-100" />
            <p className="shrink-0 text-[0.68rem] font-semibold text-gray-300">
              {lang === "fr" ? "ou remplissez le formulaire" : "or fill out the form"}
            </p>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FORMULAIRE + SIDEBAR
      ═══════════════════════════════════════════ */}
      <section className="px-6 pb-12 pt-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* ── FORM ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.65, ease }}
              className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,.08)]"
            >
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Form header */}
                    <div className="relative border-b border-gray-100 px-7 py-6 sm:px-8 sm:py-7">
                      <div className="absolute inset-x-0 top-0 h-[3px]"
                        style={{ background: "linear-gradient(90deg,#c9a55a,#e8cc94,#c9a55a)" }} />
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
                          style={{ borderColor: `rgba(${GOLD_RGB},0.25)`, background: `rgba(${GOLD_RGB},0.08)` }}>
                          <Send size={17} style={{ color: GOLD }} />
                        </div>
                        <div>
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>{c.form.subtitle}</p>
                          <p className="mt-0.5 text-[1.05rem] font-extrabold text-gray-900">{c.form.title}</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 p-7 sm:p-8">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">
                            {lang === "fr" ? "Votre nom *" : "Your name *"}
                          </label>
                          <PremiumInput icon={User} placeholder={c.form.namePlaceholder} value={name} onChange={setName} required />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">
                            {lang === "fr" ? "Adresse e-mail *" : "Email address *"}
                          </label>
                          <PremiumInput icon={Mail} type="email" placeholder={c.form.emailPlaceholder} value={email} onChange={setEmail} required validate={isEmailValid} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">
                          {lang === "fr" ? "Sujet de votre demande *" : "Subject *"}
                        </label>
                        <PremiumSelect icon={Search} placeholder={c.form.subjectPlaceholder} value={subject} onChange={setSubject} options={SUBJECTS} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">
                          {lang === "fr" ? "Budget estimé" : "Estimated budget"}
                        </label>
                        <PremiumSelect icon={Wallet} placeholder={c.form.budgetPlaceholder} value={budget} onChange={setBudget} options={BUDGETS} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">
                          {lang === "fr" ? "Décrivez votre projet *" : "Describe your project *"}
                        </label>
                        <PremiumTextarea placeholder={c.form.messagePlaceholder} value={message} onChange={setMessage} rows={5} />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={sending || !canSubmit}
                        whileHover={canSubmit ? { scale: 1.02, y: -1 } : {}}
                        whileTap={canSubmit ? { scale: 0.98 } : {}}
                        className="group relative w-full overflow-hidden rounded-2xl py-4 text-sm font-extrabold transition-all duration-300 disabled:opacity-40"
                        style={{
                          background: canSubmit ? "linear-gradient(90deg,#c9a55a,#e8cc94,#c9a55a)" : "rgba(0,0,0,0.05)",
                          backgroundSize: "200% 100%",
                          color: canSubmit ? "#0f172a" : "rgba(0,0,0,0.28)",
                          boxShadow: canSubmit ? `0 8px 24px rgba(${GOLD_RGB},0.28)` : "none",
                        }}
                      >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <span className="relative flex items-center justify-center gap-2">
                          {sending ? (
                            <>
                              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                className="inline-block h-4 w-4 rounded-full border-2 border-[#0f172a]/30 border-t-[#0f172a]" />
                              {c.form.sending}
                            </>
                          ) : (
                            <>{c.form.submit} <Send size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>
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
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease }}
                    className="flex flex-col items-center justify-center px-8 py-16 text-center sm:py-24">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)]">
                      <CheckCircle2 size={38} className="text-[#34d399]" />
                    </motion.div>
                    <motion.h3 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="text-2xl font-extrabold text-gray-900">{c.form.successTitle}</motion.h3>
                    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">{c.form.successText}</motion.p>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                      className="mt-6 flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.07)] px-4 py-2">
                      <Clock size={12} className="text-[#34d399]" />
                      <span className="text-xs font-bold text-[#34d399]">{c.form.successBadge}</span>
                    </motion.div>
                    <button onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setBudget(""); setMessage(""); }}
                      className="mt-8 text-sm font-bold text-gray-400 transition hover:text-gray-700">
                      {c.form.newMessage}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── SIDEBAR ── */}
            <div className="flex flex-col gap-4">

              {/* Contact info */}
              <motion.div initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, ease, delay: 0.1 }}
                className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,.08)]">
                <div className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg,#c9a55a,#e8cc94,#c9a55a)" }} />
                <div className="relative p-6 sm:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.span className="h-2 w-2 rounded-full bg-emerald-400"
                        animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.15em] text-gray-400">{c.contactBlock.title}</p>
                    </div>
                    <span className="rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.07)] px-2.5 py-1 text-[0.55rem] font-black uppercase tracking-widest text-[#34d399]">
                      {lang === "fr" ? "Disponible" : "Available"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {CHANNELS.map(({ href, label, value, icon: Icon, color, rgb, badge, external }) => (
                      <a key={href} href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white hover:shadow-[0_2px_10px_rgba(0,0,0,.06)]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110"
                          style={{ background: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.22)` }}>
                          <Icon size={17} style={{ color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400">{label}</p>
                          <p className="mt-0.5 truncate text-[0.82rem] font-semibold text-gray-700">{value}</p>
                        </div>
                        {badge
                          ? <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-black" style={{ background: `rgba(${rgb},0.12)`, color }}>{badge}</span>
                          : <ArrowRight size={12} className="shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: `rgba(${rgb},0.45)` }} />
                        }
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
                    className="group mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold transition-all duration-300"
                    style={{ background: `rgba(${GOLD_RGB},0.08)`, border: `1px solid rgba(${GOLD_RGB},0.28)`, color: GOLD }}>
                    <Calendar size={14} />
                    {c.contactBlock.bookBtn}
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>

              {/* Quick links */}
              {([
                { href: "/services",     label: lang === "fr" ? "Voir nos services"  : "Our services",     sub: "Sites, apps, administratif…", icon: Layers },
                { href: "/realisations", label: lang === "fr" ? "Nos réalisations"   : "Our portfolio",    sub: "WEWE, Mondouka, Clamac…",     icon: Star   },
              ] as const).map(({ href, label, sub, icon: Icon }, i) => (
                <motion.div key={href} initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.55, ease, delay: 0.2 + i * 0.08 }}>
                  <Link href={href}
                    className="group flex items-center justify-between rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_6px_20px_rgba(0,0,0,.09)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,.25)] bg-[rgba(201,165,90,.09)] transition-all duration-300 group-hover:scale-110">
                        <Icon size={16} style={{ color: GOLD }} />
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

      {/* ═══════════════════════════════════════════
          PROCESSUS — dark navy schema
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#1e1035 100%)" }}>
        {/* Gold top line */}
        <div className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: "linear-gradient(90deg,transparent,#c9a55a,transparent)" }} />

        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.6, ease }}
            className="mb-16 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.30)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#c9a55a]">
              <Zap size={9} /> {c.process.badge}
            </span>
            <h2 className="mt-4 text-[1.9rem] font-extrabold leading-[1.12] text-white sm:text-[2.4rem]">
              {c.process.title}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[0.88rem] text-white/40">{c.process.subtitle}</p>
          </motion.div>

          {/* Steps */}
          <div className="flex flex-col items-center gap-0 sm:flex-row sm:items-start sm:justify-between">
            {PROCESS_STEPS.map((step, i) => (
              <Fragment key={step.num}>
                <motion.div
                  initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport} transition={{ duration: 0.55, ease, delay: i * 0.15 }}
                  className="flex w-full flex-col items-center text-center sm:w-[20%]"
                >
                  <span className="mb-3 text-[0.58rem] font-black tracking-[0.22em]"
                    style={{ color: `rgba(${step.rgb},0.55)` }}>
                    {step.num}
                  </span>
                  <motion.div
                    className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl"
                    style={{ background: `rgba(${step.rgb},0.12)`, border: `1.5px solid rgba(${step.rgb},0.28)` }}
                    animate={{ boxShadow: [`0 0 0px rgba(${step.rgb},0)`, `0 0 24px rgba(${step.rgb},0.28)`, `0 0 0px rgba(${step.rgb},0)`] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}>
                    <step.icon size={24} style={{ color: step.color }} />
                  </motion.div>
                  <p className="mt-4 text-[0.9rem] font-extrabold text-white">{step.title}</p>
                  <p className="mt-1.5 max-w-[160px] text-[0.72rem] leading-snug text-white/40">{step.desc}</p>
                </motion.div>

                {i < PROCESS_STEPS.length - 1 && (
                  <div className="flex shrink-0 items-center justify-center py-3 sm:mt-[32px] sm:w-[6%] sm:py-0">
                    <motion.div className="h-8 w-px sm:hidden"
                      initial={{ scaleY: 0, opacity: 0 }} whileInView={{ scaleY: 1, opacity: 1 }}
                      viewport={viewport} transition={{ duration: 0.4, delay: i * 0.15 + 0.25 }}
                      style={{ background: "linear-gradient(180deg,rgba(201,165,90,0.12),rgba(201,165,90,0.5),rgba(201,165,90,0.12))", transformOrigin: "top" }} />
                    <motion.svg className="hidden sm:block" width="36" height="16" viewBox="0 0 36 16"
                      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                      viewport={viewport} transition={{ duration: 0.3, delay: i * 0.15 + 0.2 }}>
                      <motion.path d="M2 8 L28 8 M22 3 L28 8 L22 13"
                        stroke="rgba(201,165,90,0.45)" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" fill="none"
                        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
                        viewport={viewport} transition={{ duration: 0.7, ease, delay: i * 0.15 + 0.28 }} />
                    </motion.svg>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA FINAL — compact strip
      ═══════════════════════════════════════════ */}
      <section className="bg-white px-5 pb-16 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-2xl overflow-hidden rounded-3xl"
          style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#1e1035 100%)" }}>
          <div className="h-[3px] w-full"
            style={{ background: "linear-gradient(90deg,#c9a55a,#e8cc94,#c9a55a)" }} />
          <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">
            <h2 className="text-[1.55rem] font-extrabold leading-[1.18] text-white sm:text-[1.9rem]">
              {lang === "fr"
                ? <>Prêt à démarrer ? <span style={{ color: GOLD }}>Écrivez-nous.</span></>
                : <>Ready to start? <span style={{ color: GOLD }}>Write to us.</span></>}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {([
                { icon: BadgeCheck, label: lang === "fr" ? "Devis gratuit"    : "Free quote"       },
                { icon: Clock,      label: lang === "fr" ? "Réponse sous 24h" : "Reply within 24h" },
                { icon: Shield,     label: lang === "fr" ? "Sans engagement"  : "No commitment"    },
              ] as const).map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-white/55">
                  <Icon size={11} style={{ color: GOLD }} /> {label}
                </span>
              ))}
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.18 }}>
                <motion.a
                  href="#"
                  onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-extrabold text-[#0f172a] transition-all duration-300 hover:brightness-110"
                  style={{ background: "linear-gradient(90deg,#c9a55a,#e8cc94,#c9a55a)", backgroundSize: "200% 100%" }}>
                  {lang === "fr" ? "Envoyer ma demande" : "Send my request"}
                  <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
                    <ArrowRight size={15} />
                  </motion.span>
                </motion.a>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.18 }}>
                <a href={`https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl border px-7 py-3.5 text-sm font-bold text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
