"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail, Phone, MessageCircle, ArrowRight, Clock,
  CheckCircle2, Send, ChevronDown, User, FileText,
  Wallet, Search, Calendar, Headphones, Rocket,
  MessagesSquare, Layers,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const siteData = getSiteData();

function isEmailValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ── Input ── */
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
  const isOk  = validate ? validate(value) : value.length > 0;
  const showOk  = touched && !!value && isOk;
  const showErr = touched && !!value && !!validate && !isOk;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div
        className="flex items-center gap-2.5 rounded-lg border bg-white px-3.5 py-3 transition-all duration-150"
        style={{
          borderColor: showErr ? "#f87171" : showOk ? "#34d399" : focused ? "#c9a55a" : "#e5e7eb",
          boxShadow: focused ? "0 0 0 3px rgba(201,165,90,0.10)" : "none",
        }}
      >
        <Icon size={14} style={{ color: focused || value ? "#c9a55a" : "#9ca3af" }} className="shrink-0" />
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTouched(true); }}
          required={required}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
        <AnimatePresence>
          {showOk && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><CheckCircle2 size={13} className="text-[#34d399]" /></motion.div>}
          {showErr && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><span className="text-[0.58rem] font-bold text-[#f87171]">Invalide</span></motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Select ── */
function FieldSelect({
  label, icon: Icon, placeholder, value, onChange, options,
}: {
  label: string; icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div
        className="flex items-center gap-2.5 rounded-lg border bg-white px-3.5 py-3 transition-all duration-150"
        style={{
          borderColor: value ? "#34d399" : focused ? "#c9a55a" : "#e5e7eb",
          boxShadow: focused ? "0 0 0 3px rgba(201,165,90,0.10)" : "none",
        }}
      >
        <Icon size={14} style={{ color: value || focused ? "#c9a55a" : "#9ca3af" }} className="shrink-0" />
        <select
          value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-white [&>option]:text-gray-900"
          style={{ color: value ? "#111827" : "#9ca3af" }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none shrink-0 text-gray-400" />
        {value && <CheckCircle2 size={13} className="shrink-0 text-[#34d399]" />}
      </div>
    </div>
  );
}

/* ── Textarea ── */
function FieldArea({
  label, placeholder, value, onChange,
}: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div
        className="rounded-lg border bg-white transition-all duration-150"
        style={{
          borderColor: value.length > 10 ? "#34d399" : focused ? "#c9a55a" : "#e5e7eb",
          boxShadow: focused ? "0 0 0 3px rgba(201,165,90,0.10)" : "none",
        }}
      >
        <textarea
          placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          rows={6} required
          className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
        <div className="border-t border-gray-100 px-3.5 py-1.5 text-right">
          <span className="text-[0.6rem] text-gray-300">{value.length} car.</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
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
      setSendError("Impossible d'envoyer le message. Contactez-nous directement.");
    } finally {
      setSending(false);
    }
  }

  const canSubmit = name.trim() && isEmailValid(email) && subject && message.trim().length > 10;

  const fr = lang === "fr";

  /* Options de contact direct (colonne droite) */
  const DIRECT = [
    {
      icon: Calendar,
      color: "#c9a55a", rgb: "201,165,90",
      title: fr ? "Réserver un appel" : "Book a call",
      desc:  fr ? "Échange de 15 min pour évaluer votre projet" : "15-min call to discuss your project",
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
      color: "#7c6fcd", rgb: "124,111,205",
      title: fr ? "Demander un devis" : "Request a quote",
      desc:  fr ? "Obtenez une proposition personnalisée" : "Get a personalised proposal",
      href:  "/contact?besoin=Demande+de+devis",
    },
    {
      icon: Headphones,
      color: "#60a5fa", rgb: "96,165,250",
      title: fr ? "Support & questions" : "Support & questions",
      desc:  fr ? "Vous avez besoin d'aide ? On est là." : "Need help? We're here.",
      href:  `mailto:${contactEmail}`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb]">

      {/* ── PAGE HEADER ── */}
      <div className="border-b border-gray-200 bg-white px-6 pt-[100px] pb-8 sm:pt-[120px]">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="text-[2rem] font-extrabold text-gray-900 sm:text-[2.4rem]">
              {fr ? "Contactez-nous" : "Contact us"}
            </h1>
            <p className="mt-1.5 text-base text-gray-500">
              {fr ? "Vous cherchez quelque chose ? On vous répond sous 24h." : "Looking for something? We reply within 24h."}
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* ════ FORM ════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Form header */}
                  <div className="border-b border-gray-100 px-7 py-5">
                    <p className="text-[1.05rem] font-extrabold text-gray-900">
                      {fr ? "Envoyez-nous un message" : "Send us a message"}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-400">{c.form.subtitle}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5 p-7">
                    {/* Row 1 */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={fr ? "Nom *" : "Name *"} icon={User}
                        placeholder={c.form.namePlaceholder} value={name} onChange={setName} required />
                      <Field label={fr ? "Adresse e-mail *" : "Email *"} icon={Mail}
                        type="email" placeholder={c.form.emailPlaceholder}
                        value={email} onChange={setEmail} required validate={isEmailValid} />
                    </div>

                    {/* Row 2 */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldSelect label={fr ? "Sujet *" : "Subject *"} icon={Search}
                        placeholder={c.form.subjectPlaceholder}
                        value={subject} onChange={setSubject} options={SUBJECTS} />
                      <FieldSelect label={fr ? "Budget estimé" : "Estimated budget"} icon={Wallet}
                        placeholder={c.form.budgetPlaceholder}
                        value={budget} onChange={setBudget} options={BUDGETS} />
                    </div>

                    {/* Message */}
                    <FieldArea label={fr ? "Message *" : "Message *"}
                      placeholder={c.form.messagePlaceholder} value={message} onChange={setMessage} />

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={sending || !canSubmit}
                      whileHover={canSubmit ? { scale: 1.015 } : {}}
                      whileTap={canSubmit ? { scale: 0.985 } : {}}
                      className="group flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold transition-all duration-200 disabled:opacity-40"
                      style={{
                        background: canSubmit ? "#0f172a" : "#e5e7eb",
                        color:      canSubmit ? "#ffffff" : "#9ca3af",
                        boxShadow:  canSubmit ? "0 4px 14px rgba(15,23,42,0.18)" : "none",
                      }}
                    >
                      {sending ? (
                        <>
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                          {c.form.sending}
                        </>
                      ) : (
                        <>{c.form.submit} <Send size={14} /></>
                      )}
                    </motion.button>

                    {sendError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center text-xs text-[#f87171]">{sendError}</motion.p>
                    )}

                    {/* Disclaimer */}
                    <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-400">
                      <span className="mt-0.5 shrink-0 text-base leading-none">ℹ</span>
                      <span>{c.form.disclaimer}</span>
                    </p>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45 }}
                  className="flex flex-col items-center justify-center px-8 py-20 text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                    className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(52,211,153,0.10)] border border-[rgba(52,211,153,0.25)]">
                    <CheckCircle2 size={30} className="text-[#34d399]" />
                  </motion.div>
                  <h3 className="text-xl font-extrabold text-gray-900">{c.form.successTitle}</h3>
                  <p className="mt-2 max-w-xs text-sm text-gray-500">{c.form.successText}</p>
                  <div className="mt-5 flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.07)] px-4 py-2">
                    <Clock size={11} className="text-[#34d399]" />
                    <span className="text-xs font-bold text-[#34d399]">{c.form.successBadge}</span>
                  </div>
                  <button onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setBudget(""); setMessage(""); }}
                    className="mt-7 text-sm font-semibold text-gray-400 transition hover:text-gray-700">
                    {c.form.newMessage}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ════ RIGHT COLUMN ════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="flex flex-col gap-6"
          >
            {/* Direct contact */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <p className="font-extrabold text-gray-900">
                  {fr ? "Contactez-nous directement" : "Contact us directly"}
                </p>
                <p className="mt-0.5 text-sm text-gray-400">
                  {fr ? "Appelez ou écrivez-nous maintenant" : "Call or message us now"}
                </p>
              </div>

              {/* Phone */}
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 transition-colors hover:bg-gray-50">
                <Phone size={15} className="shrink-0 text-[#60a5fa]" />
                <span className="text-sm font-semibold text-gray-700">{contactPhone}</span>
              </a>

              {/* Option cards */}
              <div className="divide-y divide-gray-100">
                {DIRECT.map(({ icon: Icon, color, rgb, title, desc, href, external }) => (
                  <a key={title} href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                      style={{ background: `rgba(${rgb},0.10)`, border: `1px solid rgba(${rgb},0.20)` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 group-hover:text-gray-900">{title}</p>
                      <p className="mt-0.5 text-xs leading-snug text-gray-400">{desc}</p>
                    </div>
                    <ArrowRight size={13} className="mt-1 shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gray-500" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
              {([
                { href: "/services",     icon: Layers,       label: fr ? "Nos services"     : "Our services",  sub: "Sites, apps, accompagnement…" },
                { href: "/realisations", icon: FileText,     label: fr ? "Nos réalisations" : "Our portfolio", sub: "WEWE, Mondouka, Clamac…"     },
              ] as const).map(({ href, icon: Icon, label, sub }) => (
                <Link key={href} href={href}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] transition-transform duration-200 group-hover:scale-105">
                    <Icon size={15} style={{ color: "#c9a55a" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <ArrowRight size={13} className="shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#c9a55a]" />
                </Link>
              ))}
            </div>

            {/* Info box */}
            <div className="rounded-2xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.04)] px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={13} style={{ color: "#c9a55a" }} />
                <p className="text-xs font-bold text-[#c9a55a] uppercase tracking-wide">
                  {fr ? "Délai de réponse" : "Response time"}
                </p>
              </div>
              <p className="text-sm text-gray-600">{c.contactBlock.delayValue}</p>
              <p className="mt-1 text-xs text-gray-400">
                {fr ? "Du lundi au samedi, 8h–20h" : "Mon–Sat, 8am–8pm"}
              </p>
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
}
