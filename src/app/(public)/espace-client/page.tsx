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
  const [parAn, setParAn] = useState(false);
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

      {/* ══ OUTILS ═════════════════════════════════════════ */}
      <section id="outils" className="relative bg-[#ededf3] pb-16 sm:pb-20">
        {/* Arch blanc → transition depuis la section blanche au-dessus */}
        <div
          className="h-[70px] w-full bg-white"
          style={{ borderRadius: "0 0 50% 50% / 0 0 70px 70px" }}
        />

        <div className="mx-auto max-w-5xl px-6 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#c9a55a]/80">
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
            className="grid grid-cols-3 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-6"
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } } }}
                  className="flex flex-col items-center gap-3"
                >
                  <div
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-white shadow-[0_3px_12px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_22px_rgba(0,0,0,0.16)]"
                  >
                    <Icon size={30} style={{ color: tool.g1 }} strokeWidth={1.5} />
                  </div>
                  <p className="max-w-[88px] text-center text-[0.7rem] font-medium leading-tight text-gray-600">
                    {tool.title}
                  </p>
                </motion.div>
              );
            })}
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
      <section id="abonnement" className="bg-[#f5f5f8] py-16 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">

          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.55, ease }}
            className="mb-4 text-center"
          >
            <span className="mb-4 inline-block rounded-full border border-[rgba(61,43,109,0.18)] bg-[rgba(61,43,109,0.07)] px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-[#3d2b6d]">
              Tarifs
            </span>
            <h2 className="mt-3 text-3xl font-black text-gray-900 sm:text-4xl">
              Un plan pour chaque étape
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Sans frais cachés, sans surprise. Changez ou résiliez à tout moment.
            </p>
          </motion.div>

          {/* Toggle Par mois / Par an */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={viewport} transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-14 flex items-center justify-center gap-3"
          >
            <span className={`text-sm font-semibold transition-colors ${parAn ? "text-gray-900" : "text-gray-400"}`}>
              Par an
              {parAn && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-700">
                  −2 mois offerts
                </span>
              )}
            </span>
            <button
              onClick={() => setParAn(!parAn)}
              aria-label="Basculer entre facturation annuelle et mensuelle"
              className="relative h-6 w-11 rounded-full transition-colors duration-300"
              style={{ background: parAn ? "#3d2b6d" : "#d1d5db" }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
                style={{ transform: parAn ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
            <span className={`text-sm font-semibold transition-colors ${!parAn ? "text-gray-900" : "text-gray-400"}`}>
              Par mois
            </span>
          </motion.div>

          {/* 3 Cards */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid items-end gap-4 sm:grid-cols-3"
          >

            {/* ── Gratuit ── */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
            >
              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-gray-400">Gratuit</p>
              <h3 className="mb-5 text-2xl font-black text-gray-900">Découverte</h3>
              <div className="mb-1 flex items-end gap-1">
                <span className="text-[3.2rem] font-black leading-none text-gray-900">0 €</span>
                <span className="mb-1 text-sm text-gray-400">/mois</span>
              </div>
              <p className="mb-7 text-xs text-gray-400">Pour découvrir DJAMA gratuitement.</p>
              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Factures & devis (5 max.)",
                  "Planning",
                  "Bloc-notes",
                  "1 utilisateur",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check size={14} className="mt-0.5 shrink-0 text-gray-400" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-xl border border-gray-300 bg-white py-3 text-center text-sm font-bold text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
              >
                Commencer gratuitement
              </Link>
            </motion.div>

            {/* ── PRO — carte mise en avant ── */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease, delay: 0.08 } } }}
              className="relative flex flex-col rounded-2xl p-7 sm:py-10"
              style={{
                background: "linear-gradient(160deg, #3d2b6d 0%, #2a1d4e 100%)",
                boxShadow: "0 24px 64px rgba(61,43,109,0.40), 0 4px 16px rgba(61,43,109,0.25)",
              }}
            >
              {/* Badge */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-1.5 text-[0.65rem] font-black uppercase tracking-wider text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #c9a55a, #b08d45)" }}
              >
                ★ Recommandé
              </div>

              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.45)]">Pro</p>
              <h3 className="mb-5 text-2xl font-black text-white">Professionnel</h3>

              <div className="mb-1 flex items-end gap-1">
                <span className="text-[3.2rem] font-black leading-none text-white">
                  {parAn ? "9,90 €" : "11,90 €"}
                </span>
                <span className="mb-1 text-sm text-[rgba(255,255,255,0.5)]">/mois</span>
              </div>
              {parAn && (
                <p className="mb-1 text-xs text-[rgba(255,255,255,0.45)] line-through">11,90 €/mois</p>
              )}
              <p className="mb-7 text-xs text-[rgba(255,255,255,0.45)]">
                {parAn ? "Facturé 118,80 €/an — 2 mois offerts." : "Facturation mensuelle, sans engagement."}
              </p>

              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Tout le plan Gratuit",
                  `${TOOL_COUNT} outils professionnels`,
                  "IA Business & Coaching",
                  "Espace Entreprise (équipe, rôles)",
                  "Support prioritaire",
                  "Utilisateurs illimités",
                  "Résiliable à tout moment",
                  "Sans engagement",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[rgba(255,255,255,0.85)]">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: GOLD }} strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <StripeButton label="Commencer maintenant →" />

              <p className="mt-4 text-center text-[0.65rem] text-[rgba(255,255,255,0.35)]">
                Paiement sécurisé · Accès immédiat
              </p>
            </motion.div>

            {/* ── Personnalisé ── */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease, delay: 0.16 } } }}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
            >
              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-gray-400">Sur mesure</p>
              <h3 className="mb-5 text-2xl font-black text-gray-900">Personnalisé</h3>
              <div className="mb-1 flex items-end gap-1">
                <span className="text-[2rem] font-black leading-none text-gray-900">Sur devis</span>
              </div>
              <p className="mb-7 text-xs text-gray-400">À partir de 17,90 €/utilisateur/mois.</p>
              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Tout le plan PRO",
                  "Multi-entreprises",
                  "API & intégrations",
                  "Outils sur mesure",
                  "Hébergement dédié",
                  "Accompagnement personnalisé",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check size={14} className="mt-0.5 shrink-0 text-gray-400" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="block w-full rounded-xl border border-gray-300 bg-white py-3 text-center text-sm font-bold text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
              >
                Nous contacter
              </Link>
            </motion.div>

          </motion.div>

          {/* ── Espace Entreprise callout ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.55, ease, delay: 0.1 }}
            className="mt-12 overflow-hidden rounded-2xl border border-[rgba(61,43,109,0.14)] bg-white"
          >
            <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-start sm:gap-10 sm:p-9">
              {/* Icône + titre */}
              <div className="shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(61,43,109,0.08)" }}>
                  <Building2 size={22} style={{ color: "#3d2b6d" }} strokeWidth={1.8} />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 inline-block rounded-full border border-[rgba(61,43,109,0.18)] bg-[rgba(61,43,109,0.06)] px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-[#3d2b6d]">
                  Inclus dans PRO & Personnalisé
                </div>
                <h3 className="mt-2 text-lg font-black text-gray-900">Espace Entreprise</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Gérez toute votre équipe depuis un tableau de bord centralisé.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Users, text: "Créez des comptes employés en quelques secondes" },
                    { icon: Shield, text: "Gérez les rôles et permissions par outil" },
                    { icon: LogIn, text: "Générez identifiants et mots de passe automatiquement" },
                    { icon: Zap, text: "Invitez ou supprimez des membres à tout moment" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-[#f8f9fc] p-3.5">
                      <Icon size={16} className="mt-0.5 shrink-0 text-[#3d2b6d]" strokeWidth={1.8} />
                      <span className="text-xs leading-snug text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Note de bas */}
          <p className="mt-8 text-center text-[0.65rem] text-gray-400">
            Paiement sécurisé par Stripe · Résiliable à tout moment depuis votre espace · Sans préavis
          </p>
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
