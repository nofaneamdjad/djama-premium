"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, Users, Timer, CreditCard, FileText, Search,
  Wallet, StickyNote, Calendar, CalendarRange, Brain, Zap, Star, Mic,
  TrendingUp, Package, ClipboardList, Bell, Plus, BarChart2,
  ChevronRight, LogOut, Settings, LayoutGrid,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";

/* ══════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════════════════ */
const ease = [0.22, 1, 0.36, 1] as const;

/* ══════════════════════════════════════════════════════════════════════════
   MODULE CATALOGUE
══════════════════════════════════════════════════════════════════════════ */
type Module = {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;   // icon color
  bg: string;      // icon container bg
};

const MODULES: Module[] = [
  { href: "/client/factures",      label: "Factures",       icon: ReceiptText,   color: "#2563eb", bg: "#dbeafe" },
  { href: "/client/crm",           label: "CRM",            icon: Users,         color: "#7c3aed", bg: "#ede9fe" },
  { href: "/client/depenses",      label: "Dépenses",       icon: CreditCard,    color: "#ea580c", bg: "#ffedd5" },
  { href: "/client/tresorerie",    label: "Trésorerie",     icon: Wallet,        color: "#059669", bg: "#d1fae5" },
  { href: "/client/contrats",      label: "Contrats IA",    icon: FileText,      color: "#b45309", bg: "#fef3c7" },
  { href: "/client/stocks",        label: "Stocks",         icon: Package,       color: "#0d9488", bg: "#ccfbf1" },
  { href: "/client/planning",      label: "Planning",       icon: Calendar,      color: "#4f46e5", bg: "#e0e7ff" },
  { href: "/client/planification", label: "Équipe",         icon: CalendarRange, color: "#0891b2", bg: "#cffafe" },
  { href: "/client/taches",        label: "Tâches",         icon: ClipboardList, color: "#be185d", bg: "#fce7f3" },
  { href: "/client/chrono",        label: "Chrono",         icon: Timer,         color: "#7c3aed", bg: "#f3e8ff" },
  { href: "/client/notes",         label: "Notes IA",       icon: StickyNote,    color: "#92400e", bg: "#fef9c3" },
  { href: "/client/bloc-note",     label: "Bloc-note",      icon: Mic,           color: "#9d174d", bg: "#fce7f3" },
  { href: "/client/sourcing",      label: "Sourcing IA",    icon: Search,        color: "#6d28d9", bg: "#ede9fe" },
  { href: "/client/assistant",     label: "Assistant IA",   icon: Zap,           color: "#0369a1", bg: "#e0f2fe" },
  { href: "/client/reputation",    label: "Réputation",     icon: Star,          color: "#b91c1c", bg: "#fee2e2" },
  { href: "/coaching-ia/espace",   label: "Coaching IA",    icon: Brain,         color: "#9d174d", bg: "#fdf2f8" },
  { href: "/client/fournisseurs",  label: "Fournisseurs",   icon: TrendingUp,    color: "#166534", bg: "#dcfce7" },
  { href: "/client/dashboard",     label: "Dashboard",      icon: BarChart2,     color: "#3730a3", bg: "#e0e7ff" },
];

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════ */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getDay() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════════════════════════════════════ */

/** Carte module — icône colorée + label */
function ModuleCard({ mod, index }: { mod: Module; index: number }) {
  const Icon = mod.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.08 + index * 0.022, ease }}
    >
      <Link href={mod.href} className="group block">
        <motion.div
          whileTap={{ scale: 0.91 }}
          whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.07)] cursor-pointer select-none"
        >
          {/* Icon container */}
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
            style={{ background: mod.bg }}
          >
            <Icon size={22} style={{ color: mod.color }} strokeWidth={1.8} />
          </div>
          {/* Label */}
          <span
            className="text-center text-[10.5px] font-semibold leading-tight"
            style={{ color: "#374151" }}
          >
            {mod.label}
          </span>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/** KPI chip — scroll horizontal */
function KpiChip({
  label, value, sub, color, loading,
}: {
  label: string; value: string; sub?: string;
  color: string; loading: boolean;
}) {
  return (
    <div className="shrink-0 flex flex-col rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)] px-4 py-3 min-w-[120px]">
      <p className="text-[10px] font-medium" style={{ color: "#9ca3af" }}>{label}</p>
      {loading ? (
        <div className="mt-1 h-4 w-14 animate-pulse rounded-md bg-gray-100" />
      ) : (
        <p className="mt-0.5 text-[15px] font-bold leading-none" style={{ color }}>{value}</p>
      )}
      {sub && !loading && (
        <p className="mt-0.5 text-[10px]" style={{ color: "#9ca3af" }}>{sub}</p>
      )}
    </div>
  );
}

/** Badge notification */
function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function CockpitPage() {
  const [firstName,   setFirstName]   = useState("");
  const [initial,     setInitial]     = useState("?");
  const [kpiLoading,  setKpiLoading]  = useState(true);
  const [caMonth,     setCaMonth]     = useState(0);
  const [nbContacts,  setNbContacts]  = useState(0);
  const [nbFactures,  setNbFactures]  = useState(0);
  const [caEvo,       setCaEvo]       = useState<number | null>(null);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Load user + KPIs */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const emailName = user.email?.split("@")[0] ?? "";
      const name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      setFirstName(name);
      setInitial(name.charAt(0).toUpperCase());

      const now    = new Date();
      const y      = now.getFullYear();
      const m      = String(now.getMonth() + 1).padStart(2, "0");
      const start  = `${y}-${m}-01`;
      const end    = `${y}-${m}-31`;
      const prevM  = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevY  = now.getMonth() === 0 ? y - 1 : y;
      const pStart = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
      const pEnd   = `${prevY}-${String(prevM).padStart(2, "0")}-31`;

      const [facRes, prevRes, crmRes, pendRes] = await Promise.all([
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", start).lte("date_emission", end),
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", pStart).lte("date_emission", pEnd),
        supabase.from("clients_crm").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("factures").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("statut", ["envoyée", "en_attente"]),
      ]);

      const ca     = (facRes.data  ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const caPrev = (prevRes.data ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      setCaMonth(ca);
      setNbContacts(crmRes.count ?? 0);
      setNbFactures(pendRes.count ?? 0);
      if (caPrev > 0) setCaEvo(Math.round(((ca - caPrev) / caPrev) * 100));
      setKpiLoading(false);
    })();
  }, []);

  /* Close menu on outside click */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const caEvoLabel = caEvo !== null
    ? `${caEvo >= 0 ? "+" : ""}${caEvo}% vs mois dernier`
    : "ce mois";

  /* ── Render ── */
  return (
    /* Light container — overrides the dark body background for this page */
    <div className="min-h-full" style={{ background: "#f0f2f5" }}>
      <div
        className="mx-auto max-w-lg px-4 pb-16 pt-5"
        style={{ color: "#111827" }}
      >

        {/* ════════════════ HEADER ════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="mb-5 flex items-center justify-between"
        >
          {/* Left — greeting */}
          <div>
            <p className="text-[11px] font-semibold" style={{ color: "#9ca3af" }}>
              {getDay()}
            </p>
            <h1 className="text-[18px] font-bold leading-tight" style={{ color: "#111827" }}>
              {getGreeting()}{firstName ? `, ${firstName}` : ""} 👋
            </h1>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <Link href="/client/dashboard" className="relative">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform active:scale-90"
                style={{ color: "#6b7280" }}
              >
                <Bell size={17} />
              </div>
              {nbFactures > 0 && <NotifBadge count={nbFactures} />}
            </Link>

            {/* Avatar + menu */}
            <div className="relative" ref={menuRef}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setMenuOpen(o => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                {initial}
              </motion.button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -8 }}
                    transition={{ duration: 0.18, ease }}
                    className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
                    style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <p className="text-[12px] font-semibold" style={{ color: "#111827" }}>{firstName}</p>
                      <p className="text-[11px]" style={{ color: "#9ca3af" }}>DJAMA PRO</p>
                    </div>
                    {[
                      { icon: LayoutGrid, label: "Dashboard", href: "/client/dashboard" },
                      { icon: Settings,   label: "Paramètres", href: "/client/abonnements" },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50"
                        >
                          <Icon size={14} style={{ color: "#6b7280" }} />
                          <span className="text-[13px] font-medium" style={{ color: "#374151" }}>{item.label}</span>
                          <ChevronRight size={12} className="ml-auto" style={{ color: "#d1d5db" }} />
                        </Link>
                      );
                    })}
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/";
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-red-50"
                      style={{ borderTop: "1px solid #f3f4f6" }}
                    >
                      <LogOut size={14} style={{ color: "#ef4444" }} />
                      <span className="text-[13px] font-medium" style={{ color: "#ef4444" }}>Se déconnecter</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ════════════════ PRIMARY CTA ════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease }}
          className="mb-5"
        >
          <Link href="/client/factures">
            <motion.div
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(99,102,241,0.35)" }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 font-semibold text-white shadow-[0_4px_20px_rgba(99,102,241,0.28)] cursor-pointer"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                <Plus size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[15px]">Nouvelle facture</span>
              <ChevronRight size={16} className="ml-auto mr-1 opacity-70" />
            </motion.div>
          </Link>
        </motion.div>

        {/* ════════════════ KPI STRIP ════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease }}
          className="mb-6 flex gap-3 overflow-x-auto pb-1 scrollbar-none"
        >
          <KpiChip
            label="CA ce mois"
            value={fmtEurInt(caMonth)}
            sub={caEvoLabel}
            color="#2563eb"
            loading={kpiLoading}
          />
          <KpiChip
            label="Contacts"
            value={String(nbContacts)}
            sub="dans le CRM"
            color="#7c3aed"
            loading={kpiLoading}
          />
          <KpiChip
            label="En attente"
            value={String(nbFactures)}
            sub="à relancer"
            color={nbFactures > 0 ? "#ea580c" : "#059669"}
            loading={kpiLoading}
          />
          <KpiChip
            label="Modules"
            value={String(MODULES.length)}
            sub="disponibles"
            color="#0d9488"
            loading={false}
          />
        </motion.div>

        {/* ════════════════ SECTION TITLE ════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="mb-3 flex items-center justify-between"
        >
          <p className="text-[12px] font-semibold" style={{ color: "#6b7280" }}>
            Vos applications
          </p>
          <p className="text-[11px]" style={{ color: "#9ca3af" }}>
            {MODULES.length} modules
          </p>
        </motion.div>

        {/* ════════════════ MODULE GRID ════════════════ */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {MODULES.map((mod, i) => (
            <ModuleCard key={mod.href} mod={mod} index={i} />
          ))}
        </div>

        {/* ════════════════ QUICK LINKS ════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.55, ease }}
          className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)]"
        >
          <p className="px-4 pt-4 text-[11px] font-semibold" style={{ color: "#9ca3af" }}>
            ACCÈS RAPIDES
          </p>
          {[
            { href: "/client/assistant",  label: "Assistant IA",       sub: "Relances auto · Questions",    icon: Zap,          color: "#0369a1", bg: "#e0f2fe" },
            { href: "/client/tresorerie", label: "Trésorerie",         sub: "Cash-flow · Flux consolidés",  icon: Wallet,       color: "#059669", bg: "#d1fae5" },
            { href: "/client/dashboard",  label: "Tableau de bord",    sub: "Rapport · Graphiques",         icon: BarChart2,    color: "#3730a3", bg: "#e0e7ff" },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group block">
                <div
                  className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-gray-50 active:bg-gray-100"
                  style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : undefined }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: item.bg }}
                  >
                    <Icon size={16} style={{ color: item.color }} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: "#111827" }}>
                      {item.label}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: "#9ca3af" }}>{item.sub}</p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{ color: "#d1d5db" }}
                  />
                </div>
              </Link>
            );
          })}
        </motion.div>

        {/* ════════════════ FOOTER ════════════════ */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center text-[11px]"
          style={{ color: "#9ca3af" }}
        >
          DJAMA PRO · {MODULES.length} modules · Données en temps réel
        </motion.p>

      </div>
    </div>
  );
}
