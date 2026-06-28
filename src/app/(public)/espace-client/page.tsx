"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  FileText, CalendarRange, StickyNote, Brain, Timer, CreditCard,
  Globe, Shield, Wallet, Users, LogIn, Sparkles, Zap,
  ChevronRight, CheckCircle2, AlertTriangle, X, Check,
  Truck, Package, ListTodo, Star, Mic, Search, BarChart2,
  LayoutDashboard, BrainCircuit, Rocket, Building2, Banknote,
  TrendingUp, Clock, DollarSign, Frown, Smile, ArrowRight,
  ChevronDown, ChevronUp,
} from "lucide-react";
import StripeButton from "@/components/ui/StripeButton";
import { viewport } from "@/lib/animations";
import { useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

/* ── Bannière accès refusé ── */
function AccessBanner() {
  const params = useSearchParams();
  if (params.get("acces") !== "requis") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-[rgba(201,165,90,0.22)] bg-white px-4 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
    >
      <AlertTriangle size={14} className="shrink-0 text-[#c9a55a]" />
      <p className="text-sm font-semibold text-gray-900">
        Cet outil est réservé aux abonnés.{" "}
        <span className="text-[#c9a55a]">Abonnez-vous ci-dessous.</span>
      </p>
      <Link href="#abonnement"
        className="ml-2 rounded-full border border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.1)] px-3 py-1 text-xs font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.2)]">
        Voir l&apos;offre ↓
      </Link>
    </motion.div>
  );
}

/* ── Redirection si déjà abonné ── */
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

/* ── Outils ── */
const TOOLS = [
  { icon: FileText,      title: "Factures & devis",      g1: "#f59e0b", g2: "#f97316", desc: "Créez et envoyez en 30 secondes" },
  { icon: CalendarRange, title: "Agenda & Planification", g1: "#3b82f6", g2: "#6366f1", desc: "Gérez vos rendez-vous & tâches" },
  { icon: StickyNote,    title: "Bloc-notes pro",         g1: "#10b981", g2: "#059669", desc: "Notes texte, vocal & canvas IA" },
  { icon: Brain,         title: "Coach Business IA",      g1: "#8b5cf6", g2: "#7c3aed", desc: "Conseils personnalisés 24h/24" },
  { icon: Users,         title: "CRM Client",             g1: "#06b6d4", g2: "#0284c7", desc: "Suivez chaque client & relance" },
  { icon: Timer,         title: "Chrono Pro",             g1: "#f97316", g2: "#ef4444", desc: "Suivi du temps par projet" },
  { icon: CreditCard,    title: "Dépenses Pro",           g1: "#ef4444", g2: "#be123c", desc: "Catégorisez toutes vos dépenses" },
  { icon: Wallet,        title: "Trésorerie",             g1: "#10b981", g2: "#0891b2", desc: "Solde & prévisions en temps réel" },
  { icon: Shield,        title: "Contrats IA",            g1: "#eab308", g2: "#ca8a04", desc: "Générez un contrat en 1 clic" },
  { icon: Search,        title: "Sourcing IA",            g1: "#f59e0b", g2: "#b45309", desc: "Trouvez les meilleurs fournisseurs" },
  { icon: Truck,         title: "Fournisseurs",           g1: "#22c55e", g2: "#16a34a", desc: "Base fournisseurs centralisée" },
  { icon: Package,       title: "Stocks",                 g1: "#0ea5e9", g2: "#0369a1", desc: "Gérez votre inventaire" },
  { icon: ListTodo,      title: "Tâches & Projets",       g1: "#a855f7", g2: "#7c3aed", desc: "Kanban & suivi de projets" },
  { icon: Mic,           title: "Bloc-note Vocal",        g1: "#ec4899", g2: "#be185d", desc: "Dictez, l'IA transcrit" },
  { icon: Globe,         title: "Réseaux Sociaux",        g1: "#38bdf8", g2: "#0284c7", desc: "Planifiez vos publications" },
  { icon: Star,          title: "Réputation",             g1: "#facc15", g2: "#f59e0b", desc: "Suivez vos avis & notoriété" },
  { icon: BarChart2,     title: "Tableau de bord",        g1: "#60a5fa", g2: "#3b82f6", desc: "KPIs & analytics en un coup d'œil" },
  { icon: Zap,           title: "Assistant IA",           g1: "#c084fc", g2: "#a855f7", desc: "Automatisez tâches répétitives" },
  { icon: Building2,     title: "Portail Client",         g1: "#3b82f6", g2: "#7c3aed", desc: "Espace dédié pour vos clients" },
  { icon: Banknote,      title: "Paie & RH",              g1: "#10b981", g2: "#065f46", desc: "Gérez salaires & équipe" },
];
const TOOL_COUNT = TOOLS.length;

/* ── Comparaison prix ── */
const COMPETITORS = [
  { name: "Logiciel facturation",  alt: "Freebe / Debitoor",  price: 15 },
  { name: "CRM",                   alt: "Pipedrive / HubSpot", price: 35 },
  { name: "Gestion de projet",     alt: "Monday / Asana",      price: 22 },
  { name: "Notes & docs",          alt: "Notion / Evernote",   price: 10 },
  { name: "Comptabilité",          alt: "Pennylane / Indy",    price: 28 },
  { name: "Assistant IA",          alt: "ChatGPT Plus",        price: 20 },
  { name: "Suivi du temps",        alt: "Toggl / Harvest",     price: 12 },
  { name: "Contrats en ligne",     alt: "DocuSign / Yousign",  price: 25 },
];

/* ── FAQ ── */
const FAQS = [
  {
    q: "Puis-je résilier à tout moment ?",
    a: "Oui, sans préavis ni pénalité. Vous restez libre à 100%. L'accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Toutes vos données sont chiffrées et hébergées en Europe (Supabase EU). Nous ne revendons jamais vos informations. Conformité RGPD garantie.",
  },
  {
    q: "Est-ce que je peux essayer avant de m'abonner ?",
    a: "Contactez-nous via WhatsApp ou le formulaire de contact — nous vous offrons un accès démo sur demande.",
  },
  {
    q: "Combien de temps pour prendre en main les outils ?",
    a: "La plupart de nos utilisateurs sont opérationnels en moins de 10 minutes. L'interface est conçue pour être intuitive, sans formation requise.",
  },
  {
    q: "Les mises à jour sont-elles incluses ?",
    a: "Oui. Nouveaux outils, améliorations, corrections — tout est inclus dans votre abonnement sans surcoût.",
  },
  {
    q: "Y a-t-il un support client ?",
    a: "Oui, support réactif par WhatsApp et email. Nous répondons généralement en moins de 2h en semaine.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-bold text-gray-900">{q}</span>
        {open ? <ChevronUp size={16} className="shrink-0 text-[#c9a55a]" /> : <ChevronDown size={16} className="shrink-0 text-gray-400" />}
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-gray-500">{a}</p>
      )}
    </div>
  );
}

const totalCompetitor = COMPETITORS.reduce((s, c) => s + c.price, 0);

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function EspaceClientPage() {
  return (
    <div className="overflow-x-hidden bg-white text-gray-900">
      <Suspense>
        <AlreadySubscribedRedirect />
        <AccessBanner />
      </Suspense>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="relative bg-white pt-[110px] pb-20 sm:pt-[148px] sm:pb-28">
        <div className="mx-auto max-w-3xl px-6 text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.28)] bg-[rgba(201,165,90,0.07)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <Sparkles size={10} /> {TOOL_COUNT} outils · Entrepreneurs
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.08 }}
            className="text-[2.8rem] font-black leading-[1.06] text-[#1a1a2e] sm:text-[5rem]"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Tout votre business sur
            <br />
            <span className="relative mt-1 inline-block px-2">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-[8px]"
                style={{ background: "#f5c435", transform: "rotate(-1.2deg) scaleX(1.04)" }}
              />
              <span className="relative">une plateforme.</span>
            </span>
          </motion.h1>

          {/* Sous-titre manuscrit */}
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.22 }}
            className="mt-5 text-[2rem] leading-tight text-gray-700 sm:text-[2.6rem]"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}
          >
            Simple, efficace, et{" "}
            <span className="relative inline-block">
              abordable
              <svg
                aria-hidden="true"
                className="absolute -bottom-1 left-0 w-full overflow-visible"
                viewBox="0 0 120 8"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ height: "8px" }}
              >
                <path
                  d="M1,6 Q15,1 30,5.5 Q45,9.5 60,4.5 Q75,0 90,5 Q105,9 119,4"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {" "}!
          </motion.p>

          {/* CTAs + annotation */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.42 }}
            className="relative mt-10"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="#abonnement"
                className="rounded-[14px] px-7 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#3d2b6d", boxShadow: "0 4px 22px rgba(61,43,109,0.3)" }}
              >
                Lancez-vous — C&apos;est gratuit
              </Link>
              <Link
                href="/contact"
                className="rounded-[14px] border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-500 shadow-sm transition hover:border-gray-300 hover:text-gray-700"
              >
                Rencontrer un conseiller
              </Link>
            </div>

            {/* Annotation manuscrite — desktop uniquement */}
            <div
              className="pointer-events-none absolute hidden items-start gap-1 sm:flex"
              style={{ left: "calc(50% + 215px)", top: "50%", transform: "translateY(-50%) rotate(-4deg)" }}
            >
              <svg width="50" height="44" viewBox="0 0 50 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M44,5 Q26,4 16,18 Q9,28 12,37" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M8,34 L12,38 L16,33" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p
                className="text-left leading-snug text-gray-500"
                style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: "1.1rem" }}
              >
                11,90 € / mois<br />
                pour TOUTES les apps
              </p>
            </div>
          </motion.div>

          {/* Garanties */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-5"
          >
            {["Sans engagement", "Stripe sécurisé", "Accès immédiat", "Support réactif"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-[0.72rem] text-gray-400">
                <CheckCircle2 size={10} className="text-[#c9a55a]/60" /> {t}
              </span>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { value: String(TOOL_COUNT),                   label: "Outils inclus",           color: GOLD       },
              { value: `${totalCompetitor}€ → 11,90€`,       label: "Économie mensuelle",       color: "#10b981"  },
              { value: "+50",                                label: "Entrepreneurs actifs",     color: "#8b5cf6"  },
              { value: "100%",                               label: "Accès immédiat",           color: "#06b6d4"  },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[0.7rem] font-medium text-gray-400">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ PROBLÈME vs SOLUTION ══════════════════════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
              <Sparkles size={9} /> Avant / Après
            </span>
            <h2 className="mt-4 text-2xl font-black text-gray-900 sm:text-3xl">
              Arrêtez de jongler.<br />
              <span style={{ color: GOLD }}>Commencez à piloter.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Sans DJAMA */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport} transition={{ duration: 0.5, ease }}
              className="rounded-2xl border border-red-100 bg-red-50/50 p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
                  <Frown size={18} className="text-red-500" />
                </div>
                <p className="font-black text-gray-900">Sans DJAMA</p>
              </div>
              <ul className="space-y-3">
                {[
                  `${COMPETITORS.length}+ abonnements à gérer chaque mois`,
                  `${totalCompetitor}€/mois minimum en outils séparés`,
                  "Données éparpillées entre 10 apps différentes",
                  "Heures perdues à synchroniser et basculer entre outils",
                  "Aucune vue globale de votre activité",
                  "Support dispersé, mots de passe partout",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <X size={14} className="mt-0.5 shrink-0 text-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Avec DJAMA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport} transition={{ duration: 0.5, ease }}
              className="rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.04)] p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.15)]">
                  <Smile size={18} style={{ color: GOLD }} />
                </div>
                <p className="font-black text-gray-900">Avec DJAMA</p>
              </div>
              <ul className="space-y-3">
                {[
                  `1 seul abonnement, ${TOOL_COUNT} outils inclus`,
                  "11,90€/mois seulement — économisez 90%",
                  "Toutes vos données centralisées au même endroit",
                  "Interface unifiée, tout accessible en 1 clic",
                  "Dashboard en temps réel de votre activité",
                  "Un seul support, réponse en moins de 2h",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ COMPARAISON PRIX ══════════════════════════════ */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-10 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
              <DollarSign size={9} /> Comparaison tarifaire
            </span>
            <h2 className="mt-4 text-2xl font-black text-gray-900 sm:text-3xl">
              Ce que coûterait tout ça<br />
              <span style={{ color: GOLD }}>séparément.</span>
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Voici ce que les entrepreneurs paient en moyenne avec des outils individuels.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50 px-5 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">
              <span>Outil</span>
              <span>Alternative du marché</span>
              <span className="text-right">Prix/mois</span>
            </div>

            {/* Rows */}
            {COMPETITORS.map((c, i) => (
              <div key={c.name} className={`grid grid-cols-3 items-center px-5 py-3.5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-400">{c.alt}</span>
                <span className="text-right text-sm font-bold text-red-500">~{c.price}€</span>
              </div>
            ))}

            {/* Total séparé */}
            <div className="grid grid-cols-3 items-center border-t border-gray-200 bg-red-50 px-5 py-4">
              <span className="text-sm font-black text-gray-900">Total séparé</span>
              <span className="text-xs text-gray-500">8 outils seulement</span>
              <span className="text-right text-lg font-black text-red-500">{totalCompetitor}€/mois</span>
            </div>

            {/* DJAMA */}
            <div className="grid grid-cols-3 items-center border-t-2 border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.05)] px-5 py-5">
              <div>
                <span className="text-sm font-black text-gray-900">DJAMA Premium</span>
                <p className="mt-0.5 text-[0.65rem] text-[#c9a55a] font-bold">{TOOL_COUNT} outils inclus</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-emerald-700">
                  Économie {Math.round((1 - 11.9 / totalCompetitor) * 100)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black" style={{ color: GOLD }}>11,90€</span>
                <p className="text-[0.65rem] text-gray-400">/mois</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={viewport} transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 text-center"
          >
            <Link href="#abonnement"
              className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: "0 4px 20px rgba(201,165,90,0.35)" }}>
              Économiser {totalCompetitor - 12}€/mois maintenant <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ AVANTAGES ══════════════════════════════════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
              Conçu pour <span style={{ color: GOLD }}>les entrepreneurs qui avancent vite.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                icon: LayoutDashboard, g1: "#f59e0b", g2: "#f97316",
                title: "Tout en un seul endroit",
                desc: `Fini les 10 onglets ouverts en même temps. Vos ${TOOL_COUNT} outils sont dans un seul dashboard, synchronisés en temps réel.`,
              },
              {
                icon: BrainCircuit, g1: "#8b5cf6", g2: "#7c3aed",
                title: "L'IA qui travaille pour vous",
                desc: "Coach business, génération de contrats, transcription vocale, automatisations — l'IA DJAMA vous fait gagner 2h par jour.",
              },
              {
                icon: Rocket, g1: "#10b981", g2: "#059669",
                title: "Opérationnel en 2 minutes",
                desc: "Inscription, paiement, accès immédiat. Pas de formation, pas de configuration complexe. Vous êtes productif dès aujourd'hui.",
              },
              {
                icon: Clock, g1: "#3b82f6", g2: "#6366f1",
                title: "Accès 24h/24, partout",
                desc: "Depuis votre téléphone, tablette ou ordinateur. Interface responsive pensée pour les entrepreneurs en déplacement.",
              },
              {
                icon: TrendingUp, g1: "#ec4899", g2: "#be185d",
                title: "Vos données, votre tableau de bord",
                desc: "Visualisez vos revenus, dépenses, clients actifs et KPIs en temps réel. Prenez les bonnes décisions, au bon moment.",
              },
              {
                icon: Shield, g1: "#eab308", g2: "#ca8a04",
                title: "Données sécurisées & RGPD",
                desc: "Chiffrement de bout en bout, hébergement en Europe, conformité RGPD. Vos données restent les vôtres, point final.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } }}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px]"
                    style={{
                      background: `linear-gradient(145deg, ${item.g1}, ${item.g2})`,
                      boxShadow: `0 6px 18px ${item.g2}40`,
                    }}
                  >
                    <Icon size={22} color="white" strokeWidth={1.8} />
                  </div>
                  <h3 className="mb-2 text-sm font-black text-gray-900">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-400">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══ OUTILS ═════════════════════════════════════════ */}
      <section id="outils" className="border-t border-gray-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#c9a55a]/70">
              {TOOL_COUNT} outils inclus
            </p>
            <h2 className="text-xl font-black text-gray-900 sm:text-3xl">
              Tout ce dont vous avez besoin,{" "}
              <span style={{ color: GOLD }}>enfin réuni.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } } }}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                >
                  <div
                    className="flex h-[58px] w-[58px] items-center justify-center rounded-[17px] shadow-md transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(145deg, ${tool.g1}, ${tool.g2})`,
                      boxShadow: `0 6px 16px ${tool.g2}40`,
                    }}
                  >
                    <Icon size={25} color="white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-bold leading-tight text-gray-700">{tool.title}</p>
                    <p className="mt-0.5 text-[0.62rem] leading-snug text-gray-400">{tool.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════ */}
      <section className="border-t border-gray-100 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-10 text-center"
          >
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
              Questions fréquentes
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Tout ce que vous devez savoir avant de vous lancer.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={viewport} transition={{ duration: 0.5 }}
            className="rounded-2xl border border-gray-200 bg-white px-6 shadow-sm"
          >
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ ABONNEMENT ═════════════════════════════════════ */}
      <section id="abonnement" className="border-t border-gray-100 bg-[#f8f9fa] py-16 sm:py-24">
        <div className="mx-auto max-w-md px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.6, ease }}
          >
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
                Un prix simple,<br /><span style={{ color: GOLD }}>tout compris.</span>
              </h2>
              <p className="mt-3 text-sm text-gray-500">
                Pas de frais cachés. Pas de surprise. Tout inclus.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.30)] bg-white shadow-[0_4px_32px_rgba(0,0,0,.08)]">
              <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

              <div className="p-8">
                <div className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]">
                  <Sparkles size={7} /> Abonnement mensuel
                </div>

                <div className="flex items-start gap-1">
                  <span className="mt-3 text-lg font-bold text-[#c9a55a]">€</span>
                  <span className="text-[5rem] font-black leading-none tracking-tighter text-gray-900">11,90</span>
                </div>
                <p className="mt-1 text-[0.72rem] text-gray-400">par mois · tout compris · sans engagement</p>

                <div className="my-5 h-px w-full bg-gradient-to-r from-[#c9a55a]/20 to-transparent" />

                <ul className="mb-7 grid grid-cols-2 gap-y-2 gap-x-3">
                  {[
                    `${TOOL_COUNT} outils inclus`,
                    "Coach Business IA",
                    "Factures illimitées",
                    "CRM & contacts",
                    "Trésorerie & dépenses",
                    "Stocks & fournisseurs",
                    "Équipe & planning",
                    "Notes IA & vocal",
                    "Contrats IA",
                    "Mises à jour incluses",
                    "Support réactif",
                    "Sans engagement",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-[0.72rem] text-gray-600">
                      <CheckCircle2 size={11} className="shrink-0 text-[#c9a55a]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <StripeButton label="Commencer maintenant →" />

                <p className="mt-3 text-center text-[0.62rem] text-gray-400">
                  Paiement sécurisé · Accès immédiat · Résiliable à tout moment
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <Link href="/login" className="text-[0.68rem] font-semibold text-[#c9a55a]/70 transition hover:text-[#c9a55a]">
                    Déjà abonné ? Se connecter →
                  </Link>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              </div>
            </div>

            {/* Garantie */}
            <div className="mt-5 flex items-center justify-center gap-2 text-center">
              <Shield size={13} className="text-gray-400" />
              <p className="text-xs text-gray-400">
                Résiliez à tout moment depuis votre espace — aucune question posée.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA FINAL ══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-16 sm:py-20"
        style={{ background: "linear-gradient(135deg,#080c18 0%,#0f172a 60%,#130d2a 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[600px] rounded-full blur-[120px]" style={{ background: "rgba(201,165,90,0.08)" }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a55a]/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.6, ease }}
          >
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-widest text-[#c9a55a]/60">Prêt à vous lancer ?</p>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Rejoignez les entrepreneurs<br />
              qui ont choisi <span style={{ color: GOLD }}>DJAMA.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm text-white/45">
              {TOOL_COUNT} outils professionnels. 11,90€/mois. Sans engagement. Accès immédiat.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="#abonnement"
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: "0 4px 24px rgba(201,165,90,0.4)" }}>
                Commencer — 11,90€/mois <ArrowRight size={14} />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-sm font-medium text-white/55 transition hover:bg-white/10 hover:text-white/80">
                Nous contacter
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════ */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
          <p className="text-[0.68rem] text-gray-300">© 2025 DJAMA · Tous droits réservés</p>
          <div className="flex items-center gap-5 text-[0.68rem] text-gray-400">
            <a href="mailto:contact@djama.space" className="transition hover:text-[#c9a55a]">contact@djama.space</a>
            <Link href="/login" className="transition hover:text-[#c9a55a]">Se connecter</Link>
            <Link href="/" className="transition hover:text-gray-600">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
