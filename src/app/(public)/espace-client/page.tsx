"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  FileText, CalendarRange, StickyNote, Brain, Timer, CreditCard, Globe,
  CheckCircle2, ArrowRight, Sparkles, Shield, Zap, Lock, Wallet,
  AlertTriangle, MessageCircle, Users, LogIn, BadgeCheck,
  ChevronRight,
} from "lucide-react";
import StripeButton from "@/components/ui/StripeButton";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────
   BANNER — accès refusé
───────────────────────────────────────────────────────── */
function AccessBanner() {
  const params = useSearchParams();
  if (params.get("acces") !== "requis") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-[rgba(201,165,90,0.22)] bg-white px-4 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
    >
      <AlertTriangle size={14} className="shrink-0 text-[#c9a55a]" />
      <p className="text-sm font-semibold text-gray-900">
        Cet outil est réservé aux abonnés.{" "}
        <span className="text-[#c9a55a]">Abonnez-vous ci-dessous.</span>
      </p>
      <Link
        href="#abonnement"
        className="ml-2 rounded-full border border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.1)] px-3 py-1 text-xs font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.2)]"
      >
        Voir l&apos;offre ↓
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Redirection automatique si déjà abonné
───────────────────────────────────────────────────────── */
function AlreadySubscribedRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (params.get("annule") === "1" || params.get("acces") === "requis") return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const meta = user.user_metadata ?? {};
      const active =
        meta.subscription_active === true ||
        (meta.abonnement === "outils_djama" && meta.statut === "actif");
      if (active) router.replace("/client");
    });
  }, [params, router]);
  return null;
}

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const TOOLS = [
  { icon: FileText,    title: "Factures & Devis",     desc: "Créez des documents pro avec logo, TVA et export PDF.",            color: "#c9a55a", rgb: "201,165,90"  },
  { icon: CalendarRange, title: "Agenda",             desc: "Rendez-vous, équipes et tâches organisés en un seul endroit.",     color: "#60a5fa", rgb: "96,165,250"  },
  { icon: Brain,       title: "Coach Business IA",    desc: "Analyse vos données réelles et vous guide chaque jour.",          color: "#a78bfa", rgb: "167,139,250" },
  { icon: Users,       title: "CRM Client",           desc: "Contacts, prospects et historique client centralisés.",           color: "#22d3ee", rgb: "34,211,238"  },
  { icon: Wallet,      title: "Trésorerie",           desc: "Solde, flux et prévisions financières en temps réel.",           color: "#34d399", rgb: "52,211,153"  },
  { icon: Timer,       title: "Chrono Pro",           desc: "Temps par projet et client pour mesurer votre rentabilité.",      color: "#fb923c", rgb: "251,146,60"  },
  { icon: CreditCard,  title: "Dépenses Pro",         desc: "Frais professionnels classés par catégorie et suivis.",          color: "#f43f5e", rgb: "244,63,94"   },
  { icon: Shield,      title: "Contrats IA",          desc: "Contrats personnalisés générés en quelques secondes.",           color: "#eab308", rgb: "234,179,8"   },
  { icon: Globe,       title: "Sourcing IA",          desc: "Fournisseurs mondiaux, marchés publics & privés via l'IA.",      color: "#f59e0b", rgb: "245,158,11"  },
  { icon: StickyNote,  title: "Bloc-notes pro",       desc: "Notes par catégorie avec export PDF et sauvegarde auto.",        color: "#4ade80", rgb: "74,222,128"  },
] as const;

const INCLUS = [
  "Accès immédiat aux 11 outils",
  "Coach Business IA — analyse de vos données réelles",
  "Factures & devis illimités avec export PDF",
  "CRM, contacts, prospects et historique",
  "Agenda, RDV, planification d'équipe",
  "Trésorerie, dépenses et flux financiers",
  "Contrats IA générés en un clic",
  "Sourcing IA — marchés publics & fournisseurs",
  "Chrono par projet et par client",
  "Bloc-notes professionnel avec catégories",
  "Sans engagement — résiliable à tout moment",
] as const;

const STEPS = [
  { n: "01", title: "Choisissez votre offre", desc: "Un seul plan à 11,90€/mois, tout inclus." },
  { n: "02", title: "Créez votre compte",    desc: "Accès envoyé par email en moins de 2 minutes." },
  { n: "03", title: "Utilisez vos outils",   desc: "Tableau de bord prêt dès la première connexion." },
] as const;


/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function EspaceClientPage() {
  return (
    <div className="overflow-x-hidden bg-white text-gray-900">
      <Suspense>
        <AlreadySubscribedRedirect />
        <AccessBanner />
      </Suspense>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-[108px] pb-24 sm:pt-[128px] sm:pb-36 bg-white">
        {/* Glows — subtler on white */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,0.06)] blur-[130px]" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-[400px] w-[300px] rounded-full bg-[rgba(96,165,250,0.04)] blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-[350px] w-[300px] rounded-full bg-[rgba(167,139,250,0.04)] blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.28)] bg-[rgba(201,165,90,0.08)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#c9a55a]"
          >
            <Sparkles size={9} />
            Espace Client DJAMA
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="text-[2.6rem] font-black leading-[1.1] tracking-tight text-gray-900 sm:text-[4rem] lg:text-[5rem]"
          >
            Gérez votre activité.{" "}
            <br className="hidden sm:block" />
            <span
              className="bg-gradient-to-r from-[#c9a55a] via-[#e8c97a] to-[#c9a55a] bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto" }}
            >
              Tout en un seul endroit.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.35 }}
            className="mx-auto mt-6 max-w-xl text-base leading-[1.85] text-gray-500 sm:text-lg"
          >
            11 outils professionnels réunis en un seul abonnement — factures, CRM, trésorerie,
            Coach IA, contrats et bien plus encore.
          </motion.p>

          {/* CTA bloc */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease, delay: 0.52 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="#abonnement"
              className="group flex items-center gap-2.5 rounded-2xl bg-[#c9a55a] px-9 py-4 text-sm font-bold text-white shadow-[0_8px_32px_rgba(201,165,90,0.35)] transition-all duration-200 hover:bg-[#d9b56a] hover:shadow-[0_12px_40px_rgba(201,165,90,0.5)]"
            >
              <Wallet size={16} />
              S&apos;abonner — 11,90€/mois
              <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#outils"
              className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-9 py-4 text-sm font-semibold text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            >
              Découvrir les outils
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Micro-trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {[
              { icon: Zap,          text: "Accès immédiat" },
              { icon: Lock,         text: "Paiement Stripe" },
              { icon: BadgeCheck,   text: "Sans engagement" },
              { icon: Users,        text: "+50 abonnés" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-[0.72rem] text-gray-400">
                <Icon size={10} className="text-[#c9a55a]" />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DÉJÀ ABONNÉ — carte login immédiate
      ══════════════════════════════════════════════ */}
      <section className="px-6 pb-16 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease }}
          className="mx-auto max-w-2xl"
        >
          <div
            className="relative overflow-hidden rounded-[1.6rem] border border-[rgba(201,165,90,0.25)] bg-white shadow-[0_2px_10px_rgba(0,0,0,.06)]"
          >
            {/* Accent top */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c9a55a]/60 to-transparent" />

            <div className="relative flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.25)]"
                  style={{ background: "rgba(201,165,90,0.10)" }}
                >
                  <LogIn size={19} className="text-[#c9a55a]" />
                </div>
                <div>
                  <p className="text-[0.95rem] font-extrabold text-gray-900">
                    Vous avez déjà un compte ?
                  </p>
                  <p className="mt-0.5 text-[0.78rem] text-gray-400">
                    Connectez-vous pour accéder à votre tableau de bord.
                  </p>
                </div>
              </div>

              <Link
                href="/login"
                className="group flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[rgba(201,165,90,0.40)] bg-[rgba(201,165,90,0.12)] px-6 py-3 text-sm font-bold text-[#c9a55a] transition-all duration-200 hover:border-[rgba(201,165,90,0.65)] hover:bg-[rgba(201,165,90,0.20)] sm:w-auto"
              >
                Se connecter
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          COMMENT ÇA MARCHE
      ══════════════════════════════════════════════ */}
      <section className="border-y border-gray-200 bg-[#f8f9fa] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#c9a55a]/70">
              3 étapes
            </p>
            <h2 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">
              Prêt en moins de 2 minutes.
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-px sm:grid-cols-3"
            style={{ background: "rgba(0,0,0,0.06)", borderRadius: "1.5rem", overflow: "hidden" }}
          >
            {STEPS.map(({ n, title, desc }, i) => (
              <motion.div
                key={n}
                variants={cardReveal}
                className="flex flex-col gap-3 bg-[#f8f9fa] px-8 py-8"
              >
                <span
                  className="text-[2.2rem] font-black leading-none"
                  style={{ color: i === 0 ? "#c9a55a" : "rgba(0,0,0,0.10)" }}
                >
                  {n}
                </span>
                <h3 className="text-[0.92rem] font-extrabold text-gray-900">{title}</h3>
                <p className="text-[0.78rem] leading-relaxed text-gray-400">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          OUTILS
      ══════════════════════════════════════════════ */}
      <section id="outils" className="py-16 sm:py-28 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55, ease }}
            className="mb-14 text-center"
          >
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#c9a55a]/70">
              Ce qui est inclus
            </p>
            <h2 className="text-2xl font-black text-gray-900 sm:text-4xl">
              10 outils,{" "}
              <span className="text-[#c9a55a]">un seul abonnement.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-gray-500">
              Conçus pour les indépendants et entrepreneurs qui veulent aller vite
              sans sacrifier la qualité.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  variants={cardReveal}
                  className="group flex flex-col gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300"
                  whileHover={{ boxShadow: `0 12px 40px rgba(${tool.rgb}, 0.12)` }}
                  transition={{ duration: 0.3, ease }}
                >
                  {/* Icon */}
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      background: `rgba(${tool.rgb}, 0.12)`,
                      borderColor: `rgba(${tool.rgb}, 0.25)`,
                    }}
                  >
                    <Icon size={18} style={{ color: tool.color }} />
                  </div>
                  <div>
                    <p className="text-[0.82rem] font-extrabold text-gray-900">{tool.title}</p>
                    <p className="mt-1 text-[0.72rem] leading-relaxed text-gray-400">{tool.desc}</p>
                  </div>
                  {/* Accent bas */}
                  <div
                    className="mt-auto h-px w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, ${tool.color}, transparent)` }}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <Link
              href="#abonnement"
              className="group inline-flex items-center gap-2 rounded-2xl bg-[#c9a55a] px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_28px_rgba(201,165,90,0.30)] transition-all duration-200 hover:bg-[#d9b56a] hover:shadow-[0_12px_36px_rgba(201,165,90,0.45)]"
            >
              <Wallet size={15} />
              Accéder à tous les outils — 11,90€/mois
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════ */}
      <section id="abonnement" className="bg-[#f8f9fa] py-16 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55, ease }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#c9a55a]/70">
              Tarif unique
            </p>
            <h2 className="text-2xl font-black text-gray-900 sm:text-4xl">
              Tout inclus.{" "}
              <span className="text-[#c9a55a]">Aucune surprise.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* ── Inclus list ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease }}
              className="flex flex-col justify-center gap-3 rounded-[1.75rem] border border-gray-200 bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,.06)]"
            >
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-widest text-gray-400">
                Ce que vous obtenez
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {INCLUS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                    <span className="text-[0.8rem] leading-snug text-gray-600">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-200 pt-6">
                {[
                  { icon: Zap,     text: "Accès immédiat" },
                  { icon: Lock,    text: "Stripe SSL" },
                  { icon: Shield,  text: "RGPD" },
                  { icon: MessageCircle, text: "Support 24h" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-[0.72rem] text-gray-400">
                    <Icon size={11} className="text-[#c9a55a]/70" />
                    {text}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* ── Carte prix ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease, delay: 0.1 }}
              className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.30)] bg-white shadow-[0_2px_10px_rgba(0,0,0,.06)]"
            >
              {/* Top bar */}
              <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

              <div className="relative flex flex-col gap-0 p-8">
                {/* Badge */}
                <div className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]">
                  <Sparkles size={7} /> Abonnement mensuel
                </div>

                {/* Prix */}
                <div className="flex items-start gap-1">
                  <span className="mt-3 text-lg font-bold text-[#c9a55a]">€</span>
                  <span className="text-[5.5rem] font-black leading-none tracking-tighter text-gray-900">
                    11,90
                  </span>
                </div>
                <p className="mt-1 text-[0.75rem] text-gray-400">par mois · tout compris</p>

                <div className="my-6 h-px w-full bg-gradient-to-r from-[#c9a55a]/20 to-transparent" />

                {/* Quick list */}
                <ul className="mb-7 space-y-2">
                  {["11 outils inclus", "Coach Business IA", "Mises à jour continues", "Sans engagement"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[0.78rem] text-gray-600">
                      <CheckCircle2 size={12} className="text-[#c9a55a]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <StripeButton label="Commencer maintenant →" />

                <p className="mt-4 text-center text-[0.65rem] text-gray-400">
                  Paiement sécurisé • Accès immédiat • Résiliable à tout moment
                </p>

                {/* Login séparateur */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <Link href="/login" className="text-[0.7rem] font-semibold text-[#c9a55a]/70 transition hover:text-[#c9a55a]">
                    Déjà abonné ? Se connecter →
                  </Link>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════ */}
      <section
        className="border-t border-gray-200 py-16 sm:py-24"
        style={{ background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%)" }}
      >
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="relative"
          >
            <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white/70">
              Commencer maintenant
            </p>
            <h2 className="text-2xl font-black text-white sm:text-4xl">
              Prêt à simplifier{" "}
              <span className="text-[#c9a55a]">votre gestion ?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm text-white/70">
              Rejoignez les entrepreneurs qui pilotent leur activité avec DJAMA.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="#abonnement"
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#c9a55a] px-9 py-4 text-sm font-bold text-white shadow-[0_8px_32px_rgba(201,165,90,0.32)] transition-all duration-200 hover:bg-[#d9b56a] hover:shadow-[0_12px_40px_rgba(201,165,90,0.48)] sm:w-auto"
              >
                <Wallet size={16} />
                S&apos;abonner — 11,90€/mois
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-9 py-4 text-sm font-bold text-white transition hover:bg-white/20 sm:w-auto"
              >
                <LogIn size={15} />
                Déjà abonné
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="border-t border-gray-200 bg-white py-7">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <p className="text-[0.7rem] text-gray-300">© 2025 DJAMA · Tous droits réservés</p>
          <div className="flex items-center gap-5 text-[0.7rem] text-gray-400">
            <a href="mailto:contact@djama.space" className="transition hover:text-[#c9a55a]">contact@djama.space</a>
            <Link href="/login" className="transition hover:text-[#c9a55a]">Se connecter</Link>
            <Link href="/" className="transition hover:text-gray-600">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
