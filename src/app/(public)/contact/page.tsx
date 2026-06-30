"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail, Phone, MessageCircle, ArrowRight, Clock,
  CheckCircle2, Send, ChevronDown, User, FileText,
  Wallet, Search, Calendar, Headphones, Rocket,
  MessagesSquare, Layers, Star,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const siteData = getSiteData();
const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

function isEmailValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ── Field ──────────────────────────────────────────────── */
function Field({
  label, icon: Icon, type = "text", placeholder, value, onChange,
  required, validate,
}: {
  label: string; icon: React.ElementType; type?: string;
  placeholder: string; value: string; onChange: (v: string) => void;
  required?: boolean; validate?: (v: string) => boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isOk    = validate ? validate(value) : value.length > 0;
  const showOk  = touched && !!value && isOk;
  const showErr = touched && !!value && !!validate && !isOk;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</label>
      <div
        className="flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3.5 transition-all duration-150"
        style={{
          borderColor: showErr ? "#f87171" : showOk ? "#4ade80" : focused ? GOLD : "var(--border)",
          boxShadow: focused ? `0 0 0 3px rgba(201,165,90,0.12)` : "none",
        }}
      >
        <Icon size={14} style={{ color: focused || value ? GOLD : "var(--muted)" }} className="shrink-0" />
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTouched(true); }}
          required={required}
          className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder-[var(--muted)] outline-none"
        />
        <AnimatePresence>
          {showOk && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><CheckCircle2 size={13} className="text-[#4ade80]" /></motion.div>}
          {showErr && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><span className="text-[0.58rem] font-bold text-[#f87171]">Invalide</span></motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── FieldSelect ────────────────────────────────────────── */
function FieldSelect({
  label, icon: Icon, placeholder, value, onChange, options,
}: {
  label: string; icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</label>
      <div
        className="flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3.5 transition-all duration-150"
        style={{
          borderColor: value ? "#4ade80" : focused ? GOLD : "var(--border)",
          boxShadow: focused ? `0 0 0 3px rgba(201,165,90,0.12)` : "none",
        }}
      >
        <Icon size={14} style={{ color: value || focused ? GOLD : "var(--muted)" }} className="shrink-0" />
        <select
          value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-white [&>option]:text-[var(--ink)]"
          style={{ color: value ? "var(--ink)" : "var(--muted)" }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none shrink-0 text-[var(--muted)]" />
        {value && <CheckCircle2 size={13} className="shrink-0 text-[#4ade80]" />}
      </div>
    </div>
  );
}

/* ── FieldArea ──────────────────────────────────────────── */
function FieldArea({
  label, placeholder, value, onChange,
}: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</label>
      <div
        className="rounded-xl border bg-white transition-all duration-150"
        style={{
          borderColor: value.length > 10 ? "#4ade80" : focused ? GOLD : "var(--border)",
          boxShadow: focused ? `0 0 0 3px rgba(201,165,90,0.12)` : "none",
        }}
      >
        <textarea
          placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          rows={5} required
          className="w-full resize-none bg-transparent px-4 py-3.5 text-sm text-[var(--ink)] placeholder-[var(--muted)] outline-none"
        />
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
          <span className="text-[0.6rem] text-[var(--muted)]">
            {value.length > 10 ? "✓ Bon longueur" : `Minimum 10 caractères`}
          </span>
          <span className="text-[0.6rem] text-[var(--muted)]">{value.length} car.</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
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

  const SUBJECTS = c.form.subjects.map((s: string) => ({ value: s, label: s }));
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
      setSendError("Impossible d'envoyer le message. Contactez-nous directement.");
    } finally {
      setSending(false);
    }
  }

  const canSubmit = name.trim() && isEmailValid(email) && subject && message.trim().length > 10;
  const fr = lang === "fr";

  const DIRECT = [
    {
      icon: Calendar,
      color: GOLD, rgb: "201,165,90",
      title: fr ? "Réserver un appel" : "Book a call",
      desc:  fr ? "Échange 15 min pour votre projet" : "15-min call to discuss your project",
      href:  "/reserver-appel",
    },
    {
      icon: MessagesSquare,
      color: "#25d366", rgb: "37,211,102",
      title: "WhatsApp",
      desc:  fr ? "Réponse rapide par message" : "Quick reply by message",
      href:  `https://wa.me/${contactWhatsapp.replace(/\D/g,"")}`,
      external: true,
    },
    {
      icon: Rocket,
      color: "#a78bfa", rgb: "167,139,250",
      title: fr ? "Demander un devis" : "Request a quote",
      desc:  fr ? "Obtenez une proposition personnalisée" : "Get a personalised proposal",
      href:  "/contact?besoin=Demande+de+devis",
    },
    {
      icon: Headphones,
      color: "#38bdf8", rgb: "56,189,248",
      title: fr ? "Support & questions" : "Support & questions",
      desc:  fr ? "Vous avez besoin d'aide ? On est là." : "Need help? We're here.",
      href:  `mailto:${contactEmail}`,
    },
  ];

  return (
    <main className="overflow-x-hidden">

      {/* ═══ HERO ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden px-4 pb-16 pt-32 sm:pb-24 sm:pt-44"
        style={{ background: "linear-gradient(160deg, #1a0e30 0%, #0d1829 50%, #071525 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[120px]" style={{ background: `rgba(201,165,90,0.08)` }} />
          <div className="absolute right-0 bottom-0 h-[250px] w-[250px] rounded-full bg-[rgba(167,139,250,0.05)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD, borderColor: GOLD + "35", backgroundColor: GOLD + "10" }}>
              <Star size={11} fill={GOLD} style={{ color: GOLD }} />
              {fr ? "Réponse sous 24h garantie" : "Reply within 24h guaranteed"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.08 }}
            className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl md:text-[3.5rem]"
          >
            {fr ? (
              <>Démarrons votre<br /><span style={{ color: GOLD }}>projet ensemble.</span></>
            ) : (
              <>Let&apos;s start your<br /><span style={{ color: GOLD }}>project together.</span></>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.18 }}
            className="mx-auto mt-5 max-w-xl text-base text-white/45 sm:text-lg"
          >
            {fr
              ? "Décrivez votre besoin — nous vous répondons avec une proposition claire, sans engagement."
              : "Tell us your need — we'll reply with a clear proposal, no commitment."}
          </motion.p>

          {/* Quick contact pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.28 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <a href={`https://wa.me/${contactWhatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-[rgba(37,211,102,0.3)] bg-[rgba(37,211,102,0.08)] px-4 py-2 text-xs font-bold text-[#25d366] transition hover:bg-[rgba(37,211,102,0.15)]">
              <MessageCircle size={12} /> WhatsApp
            </a>
            <a href={`tel:${contactPhone.replace(/\s/g,"")}`}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white/80">
              <Phone size={12} /> {contactPhone}
            </a>
            <a href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white/80">
              <Mail size={12} /> {contactEmail}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══ MAIN ══════════════════════════════════════════════ */}
      <section className="bg-[#f5f5f8] px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* ════ FORM ════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease }}
              className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm"
            >
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Header */}
                    <div className="relative overflow-hidden border-b border-[var(--border)] px-8 py-6">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${GOLD}80, ${GOLD}20, transparent)` }} />
                      <p className="text-lg font-extrabold text-[var(--ink)]">
                        {fr ? "Envoyez-nous un message" : "Send us a message"}
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{c.form.subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 p-8">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={fr ? "Nom *" : "Name *"} icon={User}
                          placeholder={c.form.namePlaceholder} value={name} onChange={setName} required />
                        <Field label={fr ? "Adresse e-mail *" : "Email *"} icon={Mail}
                          type="email" placeholder={c.form.emailPlaceholder}
                          value={email} onChange={setEmail} required validate={isEmailValid} />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldSelect label={fr ? "Sujet *" : "Subject *"} icon={Search}
                          placeholder={c.form.subjectPlaceholder}
                          value={subject} onChange={setSubject} options={SUBJECTS} />
                        <FieldSelect label={fr ? "Budget estimé" : "Estimated budget"} icon={Wallet}
                          placeholder={c.form.budgetPlaceholder}
                          value={budget} onChange={setBudget} options={BUDGETS} />
                      </div>

                      <FieldArea label={fr ? "Message *" : "Message *"}
                        placeholder={c.form.messagePlaceholder} value={message} onChange={setMessage} />

                      <motion.button
                        type="submit"
                        disabled={sending || !canSubmit}
                        whileHover={canSubmit ? { scale: 1.012 } : {}}
                        whileTap={canSubmit ? { scale: 0.988 } : {}}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-extrabold transition-all duration-200 disabled:opacity-40"
                        style={{
                          background: canSubmit
                            ? `linear-gradient(135deg, ${GOLD} 0%, #b08d45 100%)`
                            : "#e5e7eb",
                          color: canSubmit ? "#000" : "#9ca3af",
                          boxShadow: canSubmit ? `0 4px 20px rgba(201,165,90,0.3)` : "none",
                        }}
                      >
                        {canSubmit && (
                          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        )}
                        {sending ? (
                          <>
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black/70" />
                            {c.form.sending}
                          </>
                        ) : (
                          <span className="relative flex items-center gap-2">{c.form.submit} <Send size={14} /></span>
                        )}
                      </motion.button>

                      {sendError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs text-red-500">{sendError}</motion.p>
                      )}

                      <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--muted)]">
                        <span className="mt-0.5 shrink-0">ℹ</span>
                        <span>{c.form.disclaimer}</span>
                      </p>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-col items-center justify-center px-8 py-24 text-center">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                      className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
                      style={{ background: `rgba(74,222,128,0.10)`, border: `1.5px solid rgba(74,222,128,0.25)` }}>
                      <CheckCircle2 size={36} className="text-[#4ade80]" />
                    </motion.div>
                    <h3 className="text-2xl font-extrabold text-[var(--ink)]">{c.form.successTitle}</h3>
                    <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">{c.form.successText}</p>
                    <div className="mt-5 flex items-center gap-2 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.07)] px-5 py-2.5">
                      <Clock size={11} className="text-[#4ade80]" />
                      <span className="text-xs font-bold text-[#4ade80]">{c.form.successBadge}</span>
                    </div>
                    <button onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setBudget(""); setMessage(""); }}
                      className="mt-8 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]">
                      {c.form.newMessage}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ════ COLONNE DROITE ══════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease }}
              className="flex flex-col gap-4"
            >
              {/* Bloc options directes */}
              <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm">
                <div className="relative border-b border-[var(--border)] px-6 py-5">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, rgba(167,139,250,0.6), rgba(167,139,250,0.1), transparent)` }} />
                  <p className="font-extrabold text-[var(--ink)]">
                    {fr ? "Contact direct" : "Contact us directly"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {fr ? "Choisissez le canal qui vous convient" : "Pick the channel that suits you"}
                  </p>
                </div>

                <a href={`tel:${contactPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4 transition-colors hover:bg-[#f9f7f4]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.20)" }}>
                    <Phone size={14} style={{ color: "#38bdf8" }} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--ink)]">{contactPhone}</span>
                  <ArrowRight size={12} className="ml-auto text-[var(--muted)]" />
                </a>

                <div className="divide-y divide-[var(--border)]">
                  {DIRECT.map(({ icon: Icon, color, rgb, title, desc, href, external }) => (
                    <a key={title} href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="group flex items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f9f7f4]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-105"
                        style={{ background: `rgba(${rgb},0.10)`, border: `1px solid rgba(${rgb},0.22)` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--ink)]">{title}</p>
                        <p className="mt-0.5 text-[0.7rem] text-[var(--muted)]">{desc}</p>
                      </div>
                      <ArrowRight size={12} className="shrink-0 text-[var(--muted)] transition-transform duration-150 group-hover:translate-x-0.5" style={{ color: "var(--muted)" }} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Liens rapides */}
              <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm divide-y divide-[var(--border)]">
                {([
                  { href: "/services",     icon: Layers,   label: fr ? "Nos services"     : "Our services",  sub: "Sites, apps, coaching IA…" },
                  { href: "/realisations", icon: FileText, label: fr ? "Nos réalisations" : "Our portfolio",  sub: "WEWE, Mondouka, Clamac…"   },
                ] as const).map(({ href, icon: Icon, label, sub }) => (
                  <Link key={href} href={href}
                    className="group flex items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f9f7f4]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-105"
                      style={{ backgroundColor: GOLD + "12", border: `1px solid ${GOLD}25` }}>
                      <Icon size={15} style={{ color: GOLD }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--ink)]">{label}</p>
                      <p className="text-[0.7rem] text-[var(--muted)]">{sub}</p>
                    </div>
                    <ArrowRight size={12} className="shrink-0 text-[var(--muted)] transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[#c9a55a]" />
                  </Link>
                ))}
              </div>

              {/* Délai de réponse */}
              <div className="relative overflow-hidden rounded-3xl border px-6 py-5" style={{ borderColor: GOLD + "28", backgroundColor: GOLD + "07" }}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${GOLD}60, ${GOLD}20, transparent)` }} />
                <div className="mb-2 flex items-center gap-2">
                  <Clock size={13} style={{ color: GOLD }} />
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                    {fr ? "Délai de réponse" : "Response time"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--ink)]">{c.contactBlock.delayValue}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {fr ? "Du lundi au samedi, 8h–20h" : "Mon–Sat, 8am–8pm"}
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

    </main>
  );
}
