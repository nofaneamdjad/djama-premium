"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail, Phone, MessageCircle, Clock,
  CheckCircle2, Send, ChevronDown, User, FileText,
  Wallet, Search, Calendar, Headphones,
  MessagesSquare, Layers, ArrowUpRight, Globe2,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const siteData = getSiteData();
const GOLD = "#c9a55a";
const GOLDR = "201,165,90";
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
      <label className="text-[0.65rem] font-black uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</label>
      <div
        className="flex items-center gap-2.5 rounded-xl px-4 py-3.5 transition-all duration-150"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${showErr ? "#f87171" : showOk ? "#4ade80" : focused ? GOLD : "rgba(255,255,255,0.10)"}`,
          boxShadow: focused ? `0 0 0 3px rgba(${GOLDR},0.10)` : "none",
        }}
      >
        <Icon size={14} style={{ color: focused || value ? GOLD : "rgba(255,255,255,0.30)" }} className="shrink-0" />
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTouched(true); }}
          required={required}
          className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
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
      <label className="text-[0.65rem] font-black uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</label>
      <div
        className="flex items-center gap-2.5 rounded-xl px-4 py-3.5 transition-all duration-150"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${value ? "#4ade80" : focused ? GOLD : "rgba(255,255,255,0.10)"}`,
          boxShadow: focused ? `0 0 0 3px rgba(${GOLDR},0.10)` : "none",
        }}
      >
        <Icon size={14} style={{ color: value || focused ? GOLD : "rgba(255,255,255,0.30)" }} className="shrink-0" />
        <select
          value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#0d1829] [&>option]:text-white"
          style={{ color: value ? "#fff" : "rgba(255,255,255,0.25)" }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
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
      <label className="text-[0.65rem] font-black uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</label>
      <div
        className="rounded-xl transition-all duration-150"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${value.length > 10 ? "#4ade80" : focused ? GOLD : "rgba(255,255,255,0.10)"}`,
          boxShadow: focused ? `0 0 0 3px rgba(${GOLDR},0.10)` : "none",
        }}
      >
        <textarea
          placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          rows={5} required
          className="w-full resize-none bg-transparent px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none"
        />
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2">
          <span className="text-[0.6rem]" style={{ color: value.length > 10 ? "#4ade80" : "rgba(255,255,255,0.25)" }}>
            {value.length > 10 ? "✓ Parfait" : `min. 10 caractères`}
          </span>
          <span className="text-[0.6rem]" style={{ color: "rgba(255,255,255,0.25)" }}>{value.length} car.</span>
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
  const isAR = lang === "ar";
  const isEN = lang === "en";

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
      setSendError(
        isAR ? "تعذّر إرسال الرسالة. تواصل معنا مباشرة."
        : isEN ? "Couldn't send the message. Contact us directly."
        : "Impossible d'envoyer le message. Contactez-nous directement."
      );
    } finally {
      setSending(false);
    }
  }

  const canSubmit = name.trim() && isEmailValid(email) && subject && message.trim().length > 10;

  const t = {
    badge:      isAR ? "وكالة عالمية · ردّ خلال 24 ساعة" : isEN ? "Global agency · Reply within 24h" : "Agence mondiale · Réponse sous 24h",
    h1a:        isAR ? "لنبدأ" : isEN ? "Let's build" : "Démarrons",
    h1b:        isAR ? "مشروعك." : isEN ? "your project." : "votre projet.",
    sub:        isAR ? "فكرة، حاجة، سؤال؟ صِف لنا مشروعك — نردّ عليك بحلّ واضح وملائم، بدون أي التزام." : isEN ? "An idea, a need, a question? Describe your project — we reply with a clear and tailored proposal, no commitment." : "Une idée, un besoin, une question ? Décrivez votre projet — nous répondons avec une proposition claire et adaptée, sans engagement.",
    formTitle:  isAR ? "أرسل لنا رسالة" : isEN ? "Send us a message" : "Envoyez-nous un message",
    formSub:    isAR ? "نستجيب خلال 24 ساعة" : isEN ? "We reply within 24 hours" : "Réponse sous 24 heures",
    nameLbl:    isAR ? "الاسم *" : isEN ? "Name *" : "Nom *",
    emailLbl:   isAR ? "البريد الإلكتروني *" : isEN ? "Email *" : "Adresse e-mail *",
    subjectLbl: isAR ? "الموضوع *" : isEN ? "Subject *" : "Sujet *",
    budgetLbl:  isAR ? "الميزانية التقديرية" : isEN ? "Estimated budget" : "Budget estimé",
    msgLbl:     isAR ? "رسالتك *" : isEN ? "Message *" : "Message *",
    submitBtn:  isAR ? "إرسال الرسالة" : isEN ? "Send the message" : "Envoyer le message",
    sending:    isAR ? "جارٍ الإرسال…" : isEN ? "Sending…" : "Envoi en cours…",
    successT:   isAR ? "تم الإرسال!" : isEN ? "Message sent!" : "Message envoyé !",
    successP:   isAR ? "شكراً لك. سنردّ عليك خلال 24 ساعة — تحقّق من بريدك الإلكتروني." : isEN ? "Thank you! We'll reply within 24h — check your inbox." : "Merci ! Nous vous répondons sous 24h — surveillez votre boîte e-mail.",
    successBadge: isAR ? "ردّ متوقع خلال 24 ساعة" : isEN ? "Reply expected within 24h" : "Réponse attendue sous 24h",
    newMsg:     isAR ? "إرسال رسالة أخرى ←" : isEN ? "Send another message →" : "Envoyer un autre message →",
    disclaimer: isAR ? "الدفع بعد الاتفاق : PayPal أو تحويل بنكي · بدون التزام" : isEN ? "Payment accepted after agreement: PayPal or bank transfer · No commitment" : "Paiement accepté après accord : PayPal ou virement bancaire · Sans engagement",
    channelsTitle: isAR ? "تواصل مباشر" : isEN ? "Direct contact" : "Contact direct",
    channelsSub:   isAR ? "اختر القناة التي تناسبك" : isEN ? "Choose the channel that suits you" : "Choisissez le canal qui vous convient",
    ch_call_title: isAR ? "احجز مكالمة" : isEN ? "Book a call" : "Réserver un appel",
    ch_call_desc:  isAR ? "محادثة 15 دقيقة مجانية" : isEN ? "Free 15-min discovery call" : "Échange découverte 15 min gratuit",
    ch_wa_title:   isAR ? "واتساب" : isEN ? "WhatsApp" : "WhatsApp",
    ch_wa_desc:    isAR ? "ردّ سريع عبر الرسائل" : isEN ? "Quick reply by message" : "Réponse rapide par message",
    ch_email_title: isAR ? "البريد الإلكتروني" : isEN ? "Email" : "E-mail",
    ch_email_desc:  isAR ? "للطلبات التفصيلية" : isEN ? "For detailed requests" : "Pour les demandes détaillées",
    ch_phone_title: isAR ? "الهاتف" : isEN ? "Phone" : "Téléphone",
    ch_phone_desc:  isAR ? "الاتصال المباشر" : isEN ? "Direct call" : "Appel direct",
    links_title:   isAR ? "استكشف" : isEN ? "Explore" : "Explorer",
    delay_label:   isAR ? "وقت الاستجابة" : isEN ? "Response time" : "Délai de réponse",
    delay_value:   isAR ? "خلال 24 ساعة" : isEN ? "Within 24 hours" : "Sous 24 heures",
    delay_sub:     isAR ? "الاثنين – السبت، 8ص – 8م" : isEN ? "Mon–Sat, 8am–8pm" : "Lun–Sam, 8h–20h",
    trust1:        isAR ? "مدفوع بعد الاتفاق" : isEN ? "Paid after agreement" : "Payé après accord",
    trust2:        isAR ? "ردّ خلال 24 ساعة" : isEN ? "Reply in 24h" : "Réponse 24h",
    trust3:        isAR ? "بدون التزام" : isEN ? "No commitment" : "Sans engagement",
  };

  const CHANNELS = [
    {
      icon: Calendar,
      label: t.ch_call_title,
      desc:  t.ch_call_desc,
      href: "/reserver-appel",
      accent: GOLD,
      rgb: GOLDR,
      action: isAR ? "احجز" : isEN ? "Book now" : "Réserver",
    },
    {
      icon: MessagesSquare,
      label: t.ch_wa_title,
      desc:  t.ch_wa_desc,
      href: `https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`,
      accent: "#25d366",
      rgb: "37,211,102",
      action: isAR ? "ابدأ محادثة" : isEN ? "Start chat" : "Démarrer",
      external: true,
    },
    {
      icon: Mail,
      label: t.ch_email_title,
      desc:  contactEmail,
      href: `mailto:${contactEmail}`,
      accent: "#a78bfa",
      rgb: "167,139,250",
      action: isAR ? "مراسلة" : isEN ? "Write" : "Écrire",
    },
    {
      icon: Phone,
      label: t.ch_phone_title,
      desc:  contactPhone,
      href: `tel:${contactPhone.replace(/\s/g, "")}`,
      accent: "#38bdf8",
      rgb: "56,189,248",
      action: isAR ? "اتصل" : isEN ? "Call" : "Appeler",
    },
  ];

  const EXPLORE = [
    { href: "/services",     icon: Layers,   label: isAR ? "خدماتنا" : isEN ? "Our services"  : "Nos services",     sub: isAR ? "مواقع، تطبيقات، ذكاء اصطناعي…" : isEN ? "Sites, apps, AI coaching…" : "Sites, apps, coaching IA…"  },
    { href: "/realisations", icon: FileText, label: isAR ? "أعمالنا" : isEN ? "Our portfolio" : "Nos réalisations",  sub: isAR ? "WEWE، Mondouka، Clamac…"         : "WEWE, Mondouka, Clamac…"                                          },
  ];

  const BG_MAIN = "linear-gradient(160deg, #0b0f1a 0%, #0d1829 55%, #071525 100%)";

  return (
    <main className="overflow-x-hidden" style={{ background: BG_MAIN }}>

      {/* ═══ HERO ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pb-14 pt-32 sm:pb-20 sm:pt-44">
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[130px]" style={{ background: `rgba(${GOLDR},0.07)` }} />
          <div className="absolute right-[-5%] bottom-0 h-[350px] w-[350px] rounded-full blur-[100px]" style={{ background: "rgba(167,139,250,0.06)" }} />
          <div className="absolute left-[-8%] top-[40%] h-[280px] w-[280px] rounded-full blur-[90px]" style={{ background: "rgba(37,211,102,0.04)" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Globe badge */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ color: GOLD, borderColor: `rgba(${GOLDR},0.25)`, backgroundColor: `rgba(${GOLDR},0.08)` }}>
              <Globe2 size={11} style={{ color: GOLD }} />
              {t.badge}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.08 }}
            className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl md:text-[3.8rem]"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t.h1a}{" "}<span style={{ color: GOLD }}>{t.h1b}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.18 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {t.sub}
          </motion.p>

          {/* Quick trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.28 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {[
              { label: t.trust1, color: GOLD, rgb: GOLDR },
              { label: t.trust2, color: "#38bdf8", rgb: "56,189,248" },
              { label: t.trust3, color: "#4ade80", rgb: "74,222,128" },
            ].map((b) => (
              <span key={b.label}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
                style={{ color: b.color, background: `rgba(${b.rgb},0.10)`, border: `1px solid rgba(${b.rgb},0.22)` }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />
                {b.label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════ */}
      <section className="relative px-4 pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* ════ FORM ════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
              className="overflow-hidden rounded-3xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
            >
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Form header */}
                    <div className="relative overflow-hidden border-b px-8 py-6" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                        style={{ background: `linear-gradient(90deg, ${GOLD}90, ${GOLD}30, transparent)` }} />
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ background: `rgba(${GOLDR},0.12)`, border: `1px solid rgba(${GOLDR},0.22)` }}>
                          <Send size={16} style={{ color: GOLD }} />
                        </div>
                        <div>
                          <p className="font-extrabold text-white">{t.formTitle}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{t.formSub}</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 p-8">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={t.nameLbl} icon={User}
                          placeholder={c.form.namePlaceholder} value={name} onChange={setName} required />
                        <Field label={t.emailLbl} icon={Mail}
                          type="email" placeholder={c.form.emailPlaceholder}
                          value={email} onChange={setEmail} required validate={isEmailValid} />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldSelect label={t.subjectLbl} icon={Search}
                          placeholder={c.form.subjectPlaceholder}
                          value={subject} onChange={setSubject} options={SUBJECTS} />
                        <FieldSelect label={t.budgetLbl} icon={Wallet}
                          placeholder={c.form.budgetPlaceholder}
                          value={budget} onChange={setBudget} options={BUDGETS} />
                      </div>

                      <FieldArea label={t.msgLbl}
                        placeholder={c.form.messagePlaceholder} value={message} onChange={setMessage} />

                      <motion.button
                        type="submit"
                        disabled={sending || !canSubmit}
                        whileHover={canSubmit ? { scale: 1.012 } : {}}
                        whileTap={canSubmit ? { scale: 0.988 } : {}}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-extrabold transition-all duration-200 disabled:opacity-35"
                        style={{
                          background: canSubmit
                            ? `linear-gradient(135deg, ${GOLD} 0%, #b08d45 100%)`
                            : "rgba(255,255,255,0.07)",
                          color: canSubmit ? "#000" : "rgba(255,255,255,0.30)",
                          boxShadow: canSubmit ? `0 4px 24px rgba(${GOLDR},0.30)` : "none",
                        }}
                      >
                        {canSubmit && (
                          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        )}
                        {sending ? (
                          <>
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black/60" />
                            {t.sending}
                          </>
                        ) : (
                          <span className="relative flex items-center gap-2">{t.submitBtn} <Send size={14} /></span>
                        )}
                      </motion.button>

                      {sendError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-xs text-red-400">{sendError}</motion.p>
                      )}

                      <p className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
                        <span className="mt-0.5 shrink-0">ℹ</span>
                        <span>{t.disclaimer}</span>
                      </p>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-col items-center justify-center px-8 py-28 text-center">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
                      style={{ background: `rgba(74,222,128,0.10)`, border: `1.5px solid rgba(74,222,128,0.25)` }}>
                      <CheckCircle2 size={36} className="text-[#4ade80]" />
                    </motion.div>
                    <h3 className="text-2xl font-extrabold text-white">{t.successT}</h3>
                    <p className="mt-2 max-w-xs text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{t.successP}</p>
                    <div className="mt-5 flex items-center gap-2 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.07)] px-5 py-2.5">
                      <Clock size={11} className="text-[#4ade80]" />
                      <span className="text-xs font-bold text-[#4ade80]">{t.successBadge}</span>
                    </div>
                    <button onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setBudget(""); setMessage(""); }}
                      className="mt-8 text-sm font-semibold transition"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}>
                      {t.newMsg}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ════ SIDEBAR ══════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="flex flex-col gap-4"
            >
              {/* ── Direct channel cards ── */}
              <div className="overflow-hidden rounded-3xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

                {/* Header */}
                <div className="relative border-b px-6 py-5" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: "linear-gradient(90deg, rgba(167,139,250,0.7), rgba(167,139,250,0.15), transparent)" }} />
                  <p className="font-extrabold text-white">{t.channelsTitle}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{t.channelsSub}</p>
                </div>

                {/* Channel cards */}
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {CHANNELS.map(({ icon: Icon, label, desc, href, accent, rgb, action, external }) => (
                    <a key={label} href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="group flex items-center gap-4 px-6 py-4 transition-all duration-200"
                      style={{ textDecoration: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${rgb},0.05)`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {/* Icon tile */}
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                        style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.25)` }}
                      >
                        <Icon size={17} style={{ color: accent }} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white">{label}</p>
                        <p className="mt-0.5 truncate text-[0.72rem]" style={{ color: "rgba(255,255,255,0.38)" }}>{desc}</p>
                      </div>

                      {/* Action chip */}
                      <span
                        className="shrink-0 rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider opacity-0 transition-all duration-200 group-hover:opacity-100"
                        style={{ background: `rgba(${rgb},0.15)`, color: accent }}
                      >
                        {action}
                      </span>

                      <ArrowUpRight size={13} className="shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: "rgba(255,255,255,0.22)" }} />
                    </a>
                  ))}
                </div>
              </div>

              {/* ── Response time badge ── */}
              <div className="relative overflow-hidden rounded-3xl px-6 py-5"
                style={{ background: `rgba(${GOLDR},0.06)`, border: `1px solid rgba(${GOLDR},0.18)` }}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, ${GOLD}80, ${GOLD}20, transparent)` }} />
                <div className="mb-2 flex items-center gap-2">
                  <Clock size={13} style={{ color: GOLD }} />
                  <p className="text-[0.62rem] font-black uppercase tracking-widest" style={{ color: GOLD }}>
                    {t.delay_label}
                  </p>
                </div>
                <p className="text-sm font-semibold text-white">{t.delay_value}</p>
                <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{t.delay_sub}</p>
              </div>

              {/* ── Explore links ── */}
              <div className="overflow-hidden rounded-3xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="border-b px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <p className="text-[0.65rem] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>
                    {t.links_title}
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {EXPLORE.map(({ href, icon: Icon, label, sub }) => (
                    <Link key={href} href={href}
                      className="group flex items-center gap-3 px-6 py-4 transition-all duration-200"
                      style={{ textDecoration: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${GOLDR},0.05)`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                        style={{ background: `rgba(${GOLDR},0.10)`, border: `1px solid rgba(${GOLDR},0.20)` }}>
                        <Icon size={15} style={{ color: GOLD }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white">{label}</p>
                        <p className="text-[0.7rem]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>
                      </div>
                      <ArrowUpRight size={12} className="shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: "rgba(255,255,255,0.20)" }} />
                    </Link>
                  ))}
                </div>
              </div>

              {/* ── Support direct pill ── */}
              <a href={`mailto:${contactEmail}`}
                className="group flex items-center gap-3 overflow-hidden rounded-3xl px-6 py-4 transition-all duration-200"
                style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.10)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.06)"; }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}>
                  <Headphones size={15} style={{ color: "#a78bfa" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">
                    {isAR ? "الدعم والمساعدة" : isEN ? "Support & help" : "Support & aide"}
                  </p>
                  <p className="text-[0.7rem]" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {isAR ? "هل تحتاج مساعدة؟ نحن هنا." : isEN ? "Need help? We're here." : "Besoin d'aide ? On est là."}
                  </p>
                </div>
                <MessageCircle size={13} className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: "#a78bfa" }} />
              </a>

            </motion.div>
          </div>
        </div>
      </section>

    </main>
  );
}
