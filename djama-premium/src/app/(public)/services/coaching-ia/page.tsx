"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Wallet, Loader2, Users, Building2, TrendingUp,
  Zap, Shield, Award, Target, Clock, BookOpen,
  Bot, Calendar, Star, Lock, Globe, BarChart3,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import { supabase } from "@/lib/supabase";
import { COACHING_MODULES } from "@/lib/coaching-content";

const ease = [0.16, 1, 0.3, 1] as const;
const ACCENT = "#a78bfa";
const ACCENT_RGB = "167,139,250";

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Bouton Checkout Coaching IA
───────────────────────────────────────────────────────── */
function CoachingCheckoutButton({ label = "Rejoindre le coaching — 190€" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch("/api/checkout/coaching-ia", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:    user?.id    ?? null,
          userEmail: user?.email ?? null,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur de paiement");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(167,139,250,0.3)] transition-all hover:shadow-[0_8px_48px_rgba(167,139,250,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Redirection…</>
        ) : (
          <><Wallet size={18} /> {label}</>
        )}
      </button>
      {error && (
        <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const OUTCOMES = [
  { icon: Brain,      color: "#a78bfa", label: "Comprendre et démystifier l'IA" },
  { icon: Target,     color: "#c9a55a", label: "Construire des prompts professionnels" },
  { icon: Zap,        color: "#4ade80", label: "Automatiser vos tâches répétitives" },
  { icon: Globe,      color: "#60a5fa", label: "Maîtriser les meilleurs outils IA" },
  { icon: BarChart3,  color: "#fb923c", label: "Créer votre stratégie IA business" },
  { icon: TrendingUp, color: "#f472b6", label: "Gagner 5 à 15h par semaine" },
];

const INCLUDED = [
  "Accès complet aux 5 modules (17 chapitres)",
  "Assistant IA pédagogique disponible 24h/7j",
  "1 session de coaching individuel avec expert",
  "Exercices pratiques applicables immédiatement",
  "Bibliothèque de prompts prêts à l'emploi",
  "Accès pendant 3 mois complets",
  "Mises à jour du contenu incluses",
  "Certificat de complétion DJAMA",
];

const TESTIMONIALS = [
  {
    name:    "Sarah M.",
    role:    "Consultante indépendante",
    text:    "J'ai économisé 2h par jour dès la fin du module 2. Le ROI en moins d'une semaine.",
    rating:  5,
    avatar:  "S",
    color:   "#a78bfa",
  },
  {
    name:    "Thomas R.",
    role:    "Gérant de PME",
    text:    "Formation concrète, exemples adaptés au business. Mes équipes sont maintenant autonomes sur l'IA.",
    rating:  5,
    avatar:  "T",
    color:   "#c9a55a",
  },
  {
    name:    "Layla B.",
    role:    "Freelance marketing",
    text:    "L'assistant IA dans l'espace membre est incroyable. Je l'utilise encore aujourd'hui pour affiner mes prompts.",
    rating:  5,
    avatar:  "L",
    color:   "#4ade80",
  },
];

const ENTERPRISE_FEATURES = [
  { icon: Users,     label: "Formation pour 5 à 50 personnes" },
  { icon: Target,    label: "Programme adapté à votre secteur" },
  { icon: BarChart3, label: "Tableau de bord de suivi équipe" },
  { icon: Calendar,  label: "Sessions live dédiées" },
  { icon: Award,     label: "Certification collective" },
  { icon: Shield,    label: "Accompagnement post-formation" },
];

/* ─────────────────────────────────────────────────────────
   FAQ
───────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: "Faut-il des connaissances techniques pour suivre ce coaching ?",
    a: "Aucune. Le coaching est conçu pour les professionnels, entrepreneurs et particuliers sans background tech. Tout est expliqué avec des exemples concrets du monde réel.",
  },
  {
    q: "Comment accéder à l'espace membre après paiement ?",
    a: "Immédiatement. Après votre paiement, vous recevez un email avec votre lien d'accès personnalisé. Si vous n'avez pas encore de compte, il est créé automatiquement — vous définissez votre mot de passe via le lien.",
  },
  {
    q: "Que comprend la session de coaching individuel ?",
    a: "Une visioconférence de 60 minutes avec un expert DJAMA. Vous pouvez revoir votre progression, débloquer des points durs, affiner votre stratégie IA, ou recevoir un retour sur vos automatisations.",
  },
  {
    q: "L'accès est valable combien de temps ?",
    a: "3 mois à partir du jour de votre paiement. C'est largement suffisant pour compléter le programme au rythme de 2 à 3 heures par semaine. Le contenu reste accessible tant que votre période est active.",
  },
  {
    q: "Est-ce que le contenu est mis à jour ?",
    a: "Oui. Le paysage IA évolue vite — nous mettons à jour les modules régulièrement pour refléter les nouveaux outils et techniques. Vos mises à jour sont incluses pendant votre période d'accès.",
  },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-all hover:border-[rgba(167,139,250,0.2)]"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-white/80 leading-relaxed">{q}</p>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all"
          style={{
            borderColor: open ? `rgba(${ACCENT_RGB},0.35)` : "rgba(255,255,255,0.1)",
            background:  open ? `rgba(${ACCENT_RGB},0.08)` : "transparent",
          }}
        >
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={14} style={{ color: open ? ACCENT : "rgba(255,255,255,0.3)" }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            className="overflow-hidden"
          >
            <p className="border-t border-white/[0.05] px-6 pb-5 pt-4 text-sm leading-relaxed text-white/45">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function CoachingIAPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openMod, setOpenMod] = useState<string | null>("1");

  return (
    <div className="bg-[#07080e]">

      {/* ════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-28 pt-36">
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[600px] w-[700px] rounded-full bg-[rgba(167,139,250,0.09)] blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Fil d'Ariane */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mb-8 flex items-center justify-center gap-2 text-xs text-white/25"
          >
            <Link href="/services" className="transition-colors hover:text-white/50">← Services</Link>
            <span>/</span>
            <span className="text-white/40">Coaching IA</span>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.28)] bg-[rgba(167,139,250,0.09)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#a78bfa]"
          >
            <Brain size={12} /> Formation IA · 190€ / 3 mois
          </motion.div>

          {/* H1 */}
          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Maîtrisez l'IA", "en 3 mois."]}
              highlight={1}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal delay={0.5} as="p" className="mx-auto mt-6 max-w-2xl text-lg leading-[1.8] text-white/50">
            Un programme complet en 5 modules pour comprendre, utiliser et automatiser l&apos;IA dans votre activité. Avec assistant IA pédagogique, exercices pratiques et session coaching individuel.
          </FadeReveal>

          <FadeReveal delay={0.68} className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#offre" className="btn-primary px-8 py-4 text-base" style={{
              background:  "linear-gradient(135deg,#a78bfa,#7c6fcd)",
              boxShadow:   "0 8px 32px rgba(167,139,250,0.3)",
              border:      "none",
            }}>
              <Wallet size={17} /> Rejoindre le coaching
            </a>
            <a href="#programme" className="btn-ghost px-8 py-4 text-base">
              Voir le programme <ArrowRight size={16} />
            </a>
          </FadeReveal>

          {/* Trust strip */}
          <FadeReveal delay={0.85} className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-white/[0.07] pt-8">
            {[
              { icon: "🧠", label: "5 modules complets" },
              { icon: "💬", label: "Assistant IA inclus" },
              { icon: "🎯", label: "1 session coaching" },
              { icon: "⚡", label: "Accès immédiat" },
              { icon: "📅", label: "3 mois d'accès" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-medium text-white/35">
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </FadeReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          2. CE QUE VOUS ALLEZ APPRENDRE
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-14 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
              <Sparkles size={10} /> Résultats concrets
            </motion.span>
            <h2 className="display-section text-[#09090b]">
              Ce que vous allez{" "}
              <span className="text-[#a78bfa]">apprendre.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {OUTCOMES.map(({ icon: Icon, color, label }) => (
              <motion.div
                key={label}
                variants={cardReveal}
                className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-sm font-semibold text-[#09090b]">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          3. PROGRAMME
      ════════════════════════════════════════════════════ */}
      <section id="programme" className="bg-[#07080e] py-24">
        <div className="pointer-events-none absolute left-[5%] h-[400px] w-[600px] rounded-full bg-[rgba(167,139,250,0.04)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
              <BookOpen size={10} /> 5 modules · 17 chapitres
            </motion.span>
            <h2 className="display-section text-white">
              Le programme{" "}
              <span className="text-[#a78bfa]">complet.</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {COACHING_MODULES.map((module, idx) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.45, ease, delay: idx * 0.06 }}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
              >
                <button
                  onClick={() => setOpenMod(openMod === module.id ? null : module.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ background: `rgba(${module.rgb},0.12)`, border: `1px solid rgba(${module.rgb},0.2)` }}
                  >
                    {module.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.65rem] font-bold text-white/25">Module {module.id}</span>
                      <span className="text-[0.65rem] text-white/20">·</span>
                      <span className="text-[0.65rem] text-white/25">{module.duration}</span>
                    </div>
                    <p className="font-semibold text-white">{module.title}</p>
                    <p className="text-xs text-white/40">{module.tagline}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
                      style={{ background: `rgba(${module.rgb},0.1)`, color: `rgb(${module.rgb})` }}
                    >
                      {module.chapters.length} chapitres
                    </span>
                    <motion.div animate={{ rotate: openMod === module.id ? 180 : 0 }} transition={{ duration: 0.22 }}>
                      <ChevronDown size={15} className="text-white/30" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openMod === module.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                        <p className="mb-4 text-sm text-white/40">{module.description}</p>
                        <div className="space-y-2">
                          {module.chapters.map((ch) => (
                            <div key={ch.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-2.5">
                              <span style={{ color: `rgb(${module.rgb})` }}>
                                {ch.type === "exercise" ? "✍️" : ch.type === "quiz" ? "❓" : "📖"}
                              </span>
                              <span className="flex-1 text-sm text-white/65">{ch.title}</span>
                              <span className="flex items-center gap-1 text-[0.65rem] text-white/25">
                                <Clock size={10} /> {ch.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4. TÉMOIGNAGES
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold mb-4 inline-flex">
              <Star size={10} /> Ce qu&apos;ils en disent
            </motion.span>
            <h2 className="display-section text-[#09090b]">
              Ils ont{" "}
              <span className="text-[#a78bfa]">transformé leur activité.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-3"
          >
            {TESTIMONIALS.map(({ name, role, text, rating, avatar, color }) => (
              <motion.div
                key={name}
                variants={cardReveal}
                className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={13} style={{ color: "#f9a826" }} className="fill-current" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-[#374151] italic">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: color }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#09090b]">{name}</p>
                    <p className="text-[0.65rem] text-[#6b7280]">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          5. OFFRE & TARIF
      ════════════════════════════════════════════════════ */}
      <section id="offre" className="bg-[#07080e] py-24">
        <div className="mx-auto max-w-lg px-6">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-[rgba(167,139,250,0.25)] bg-white/[0.03] shadow-[0_40px_80px_rgba(0,0,0,0.3)]"
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[300px] w-[400px] rounded-full bg-[rgba(167,139,250,0.07)] blur-[80px]" />
            </div>
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent" />

            <div className="relative px-8 py-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
                <Brain size={9} /> Coaching IA · Formation complète
              </div>

              <div className="mb-1 flex items-end gap-1.5">
                <span className="text-[4rem] font-black leading-none text-white">190</span>
                <div className="mb-2.5 flex flex-col leading-none">
                  <span className="text-2xl font-black text-white">€</span>
                  <span className="mt-1 text-xs text-white/35">/ 3 mois</span>
                </div>
              </div>
              <p className="mb-7 text-sm text-white/35">
                Paiement unique · Accès 3 mois · Sans abonnement
              </p>

              <div className="divider-gold mb-7" style={{ background: "rgba(167,139,250,0.15)" }} />

              <ul className="mb-8 space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#e5e7eb]">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    {item}
                  </li>
                ))}
              </ul>

              <CoachingCheckoutButton />

              <p className="mt-4 text-center text-[0.7rem] text-white/20">
                🔒 Paiement sécurisé via Stripe · Accès immédiat après paiement
              </p>

              {/* Badges */}
              <div className="mt-6 flex justify-center gap-5">
                {[
                  { icon: Lock,   label: "Sécurisé" },
                  { icon: Zap,    label: "Immédiat" },
                  { icon: Shield, label: "Garanti" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[0.65rem] text-white/25">
                    <Icon size={11} className="text-[#a78bfa]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          6. ENTREPRISES
      ════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0d0a1a] via-[#12102a] to-[#0f0d1f] p-10 sm:p-14">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left */}
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
                  <Building2 size={10} /> Formation entreprise
                </div>
                <h2 className="mb-5 text-3xl font-black leading-tight text-white">
                  Formez votre équipe<br />
                  <span style={{ color: ACCENT }}>à l&apos;IA ensemble.</span>
                </h2>
                <p className="mb-6 text-base leading-relaxed text-white/50">
                  Programme sur mesure pour PME, startups et grandes équipes. Contenu adapté à votre secteur, sessions live dédiées, suivi collectif.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] px-6 py-3 text-sm font-bold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.18)]"
                >
                  <Users size={15} /> Demander un devis entreprise
                </Link>
              </div>

              {/* Right */}
              <div className="grid grid-cols-2 gap-3">
                {ENTERPRISE_FEATURES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3"
                  >
                    <Icon size={15} style={{ color: ACCENT }} />
                    <p className="text-xs font-medium text-white/70">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          7. FAQ
      ════════════════════════════════════════════════════ */}
      <section className="bg-[#07080e] py-24">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
              <MessageSquare size={10} /> Questions fréquentes
            </motion.span>
            <h2 className="display-section text-white">
              Tout ce que vous voulez{" "}
              <span style={{ color: ACCENT }}>savoir.</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.4, ease, delay: i * 0.05 }}
              >
                <FaqItem
                  q={q} a={a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          8. CTA FINAL
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#07080e] py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-[rgba(167,139,250,0.07)] blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.65, ease }}
          className="relative z-10 mx-auto max-w-xl px-6 text-center"
        >
          <span className="badge badge-gold-dark mb-6 inline-flex">
            <Sparkles size={10} /> Commencez aujourd&apos;hui
          </span>
          <h2 className="display-section text-white">
            Votre avantage compétitif,{" "}
            <span style={{ color: ACCENT }}>c&apos;est maintenant.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/40">
            190€ pour 3 mois de formation, d&apos;outils et d&apos;accompagnement.
            Moins que 2 heures de travail économisées en une semaine.
          </p>
          <div className="mt-10">
            <CoachingCheckoutButton label="Accéder au coaching — 190€" />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-5 text-xs text-white/20">
            <span>✓ Accès immédiat</span>
            <span>✓ 5 modules + 17 chapitres</span>
            <span>✓ Assistant IA inclus</span>
            <span>✓ 1 session coaching</span>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
