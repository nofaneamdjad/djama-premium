"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  Mail, Phone, MessageCircle, ArrowRight, Sparkles,
  Clock, CheckCircle2, Send, ChevronDown,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { getSiteData } from "@/lib/site-data";

const ease = [0.16, 1, 0.3, 1] as const;
const data = getSiteData();

/* ─── Sujets du formulaire ───────────────────── */
const SUBJECTS = [
  "Création de site web",
  "Application mobile",
  "Assistance administrative",
  "Recherche de fournisseurs",
  "Accompagnement marchés publics",
  "Autre demande",
];

/* ─── Champ animé ────────────────────────────── */
function Field({
  label, children, delay = 0,
}: { label: string; children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease, delay }}
      className="flex flex-col gap-1.5"
    >
      <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
        {label}
      </label>
      {children}
    </motion.div>
  );
}

/* ─── Input animé ────────────────────────────── */
function AnimatedInput({
  type = "text", placeholder, value, onChange, required,
}: {
  type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{ opacity: focused ? 1 : 0, scale: focused ? 1 : 0.97 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: "0 0 0 2px rgba(201,165,90,0.45)",
          background: "rgba(201,165,90,0.03)",
        }}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className="relative w-full rounded-2xl border border-[var(--border)] bg-white px-5 py-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors duration-200 hover:border-[rgba(201,165,90,0.4)]"
      />
    </div>
  );
}

/* ─── Textarea animé ─────────────────────────── */
function AnimatedTextarea({
  placeholder, value, onChange, rows = 5,
}: {
  placeholder: string; value: string;
  onChange: (v: string) => void; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{ opacity: focused ? 1 : 0, scale: focused ? 1 : 0.97 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: "0 0 0 2px rgba(201,165,90,0.45)", background: "rgba(201,165,90,0.03)" }}
      />
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={rows}
        required
        className="relative w-full resize-none rounded-2xl border border-[var(--border)] bg-white px-5 py-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors duration-200 hover:border-[rgba(201,165,90,0.4)]"
      />
    </div>
  );
}

/* ─── Select animé ───────────────────────────── */
function AnimatedSelect({
  value, onChange,
}: {
  value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: "0 0 0 2px rgba(201,165,90,0.45)", background: "rgba(201,165,90,0.03)" }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="relative w-full appearance-none rounded-2xl border border-[var(--border)] bg-white px-5 py-3.5 text-sm text-[var(--ink)] outline-none transition-colors duration-200 hover:border-[rgba(201,165,90,0.4)]"
      >
        <option value="">Sélectionner un sujet…</option>
        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
    </div>
  );
}

/* ─── Carte info contact ─────────────────────── */
function ContactItem({
  icon: Icon, label, value, href, accent, delay,
}: {
  icon: React.ElementType; label: string; value: string;
  href?: string; accent: string; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const inner = (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10"
        style={{ background: `${accent}18` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, ease, delay }}
    >
      {href ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="block rounded-2xl border border-white/8 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/5">
          {inner}
        </a>
      ) : (
        <div className="rounded-2xl border border-white/8 p-4">{inner}</div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════ */
export default function ContactPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1400);
  }

  return (
    <div className="bg-white">

      {/* ══ HERO ═══════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-24 pt-32">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-[rgba(176,141,87,0.08)] blur-[100px]" />
        </div>
        <div className="pointer-events-none absolute left-[-100px] top-1/2 h-[280px] w-[280px] rounded-full bg-[rgba(52,211,153,0.05)] blur-[80px]" />
        <div className="pointer-events-none absolute right-[-80px] top-[20%] h-[280px] w-[280px] rounded-full bg-[rgba(59,157,255,0.05)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(176,141,87,0.25)] bg-[rgba(176,141,87,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <Sparkles size={11} />
            Contactez-nous
          </motion.div>

          {/* Titre animé eau */}
          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Parlons de votre", "projet."]}
              highlight={1}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          {/* Sous-titre */}
          <FadeReveal delay={0.6} as="p"
            className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/55">
            Une idée, un besoin, une question ? Décrivez-nous votre projet —
            nous vous répondons rapidement avec une solution claire et adaptée.
          </FadeReveal>

          {/* Promesses */}
          <FadeReveal delay={0.8}
            className="mt-10 flex flex-wrap justify-center gap-6 border-t border-white/8 pt-8">
            {[
              { icon: Clock,        text: "Réponse sous 24h"        },
              { icon: CheckCircle2, text: "Accompagnement sur mesure" },
              { icon: MessageCircle,text: "WhatsApp disponible"      },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-white/50">
                <Icon size={14} className="text-[#c9a55a]" />
                {text}
              </div>
            ))}
          </FadeReveal>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══ FORMULAIRE + INFOS ═════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* ── Formulaire ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="rounded-[2rem] border border-[var(--border)] bg-white p-8 shadow-[0_4px_24px_rgba(9,9,11,0.07)] md:p-10"
          >
            {!sent ? (
              <>
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#c9a55a]">Formulaire de contact</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[var(--ink)]">Envoyez-nous un message</h2>
                  <p className="mt-1.5 text-sm text-[var(--muted)]">
                    Tous les champs sont importants — plus votre demande est précise, mieux nous pouvons vous aider.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Nom + Email côte à côte */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Votre nom" delay={0.05}>
                      <AnimatedInput
                        placeholder="Jean Dupont"
                        value={name}
                        onChange={setName}
                        required
                      />
                    </Field>
                    <Field label="Adresse e-mail" delay={0.1}>
                      <AnimatedInput
                        type="email"
                        placeholder="vous@exemple.com"
                        value={email}
                        onChange={setEmail}
                        required
                      />
                    </Field>
                  </div>

                  {/* Sujet */}
                  <Field label="Sujet de votre demande" delay={0.15}>
                    <AnimatedSelect value={subject} onChange={setSubject} />
                  </Field>

                  {/* Message */}
                  <Field label="Votre message" delay={0.2}>
                    <AnimatedTextarea
                      placeholder="Décrivez votre projet, vos besoins, votre budget approximatif… Plus c'est détaillé, mieux nous pouvons vous aider."
                      value={message}
                      onChange={setMessage}
                      rows={6}
                    />
                  </Field>

                  {/* Submit */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                  >
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={sending}
                      className="group relative w-full overflow-hidden rounded-2xl bg-[var(--ink)] px-6 py-4 text-sm font-extrabold text-white shadow-[0_4px_20px_rgba(9,9,11,0.25)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(9,9,11,0.35)] disabled:opacity-70"
                    >
                      {/* Glow hover */}
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative flex items-center justify-center gap-2">
                        {sending ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                            />
                            Envoi en cours…
                          </>
                        ) : (
                          <>
                            Envoyer le message
                            <Send size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </>
                        )}
                      </span>
                    </motion.button>
                  </motion.div>

                  <p className="text-center text-xs text-[var(--muted)]">
                    Paiement accepté : PayPal ou virement bancaire.
                  </p>
                </form>
              </>
            ) : (
              /* ── État succès ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.25)]"
                >
                  <CheckCircle2 size={32} className="text-[#34d399]" />
                </motion.div>
                <h3 className="text-2xl font-extrabold text-[var(--ink)]">Message envoyé !</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
                  Merci pour votre message. Nous vous répondons dans les 24h — surveillez votre boîte e-mail.
                </p>
                <button
                  onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
                  className="mt-8 text-sm font-bold text-[#c9a55a] transition hover:underline"
                >
                  Envoyer un autre message
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* ── Infos contact ── */}
          <div className="flex flex-col gap-5">
            {/* Carte principale */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.1 }}
              className="relative overflow-hidden rounded-[2rem] bg-[var(--ink)] p-8"
            >
              {/* Glows */}
              <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-[200px] w-[200px] rounded-full bg-[rgba(176,141,87,0.08)] blur-[60px]" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[150px] w-[150px] rounded-full bg-[rgba(59,157,255,0.05)] blur-[50px]" />

              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-[#c9a55a]">Contact direct</p>
                <h3 className="mt-2 text-xl font-extrabold text-white">
                  On est là pour vous
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  Choisissez le canal qui vous convient — nous répondons rapidement sur tous.
                </p>

                <div className="mt-6 space-y-3">
                  <ContactItem
                    icon={Mail}
                    label="E-mail"
                    value={data.contact.email}
                    href={`mailto:${data.contact.email}`}
                    accent="#c9a55a"
                    delay={0.15}
                  />
                  <ContactItem
                    icon={Phone}
                    label="WhatsApp / Téléphone"
                    value={data.contact.whatsapp}
                    href={`https://wa.me/${data.contact.whatsapp.replace(/\D/g, "")}`}
                    accent="#25d366"
                    delay={0.2}
                  />
                  <ContactItem
                    icon={Clock}
                    label="Délai de réponse"
                    value="Sous 24 heures"
                    accent="#3b9dff"
                    delay={0.25}
                  />
                </div>
              </div>
            </motion.div>

            {/* Carte "voir nos services" */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease, delay: 0.25 }}
            >
              <Link href="/services"
                className="group flex items-center justify-between rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_2px_10px_rgba(9,9,11,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(201,165,90,0.3)] hover:shadow-[0_12px_32px_rgba(9,9,11,0.1)]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#c9a55a]">Explorer</p>
                  <p className="mt-1 font-extrabold text-[var(--ink)]">Voir nos services</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">Sites, apps, administratif…</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] transition-all duration-300 group-hover:bg-[rgba(201,165,90,0.15)]">
                  <ArrowRight size={16} className="text-[#c9a55a] transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>

            {/* Carte réalisations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease, delay: 0.3 }}
            >
              <Link href="/realisations"
                className="group flex items-center justify-between rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(201,165,90,0.3)] hover:shadow-[0_12px_32px_rgba(9,9,11,0.08)]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#c9a55a]">Portfolio</p>
                  <p className="mt-1 font-extrabold text-[var(--ink)]">Nos réalisations</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">WEWE, Mondouka, Clamac…</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] transition-all duration-300 group-hover:bg-[rgba(201,165,90,0.15)]">
                  <ArrowRight size={16} className="text-[#c9a55a] transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
