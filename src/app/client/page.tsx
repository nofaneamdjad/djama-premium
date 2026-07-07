"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar, Bell, BarChart2,
  ChevronRight, LogOut, LayoutGrid, ListTodo,
  TrendingUp, TrendingDown,
  Lock, Crown, AlertCircle, CheckCircle2, X,
  Clock, Sparkles, Activity, Settings2, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import OnboardingModal from "@/components/OnboardingModal";
import { APP_ICONS } from "@/components/AppIcons";
import { MODULE_GROUPS } from "@/lib/module-groups";
import { ModuleCard, ModuleGroupSection } from "@/components/ModuleCard";
import { getToolTier } from "@/lib/plans";
import { useTheme } from "@/lib/theme-context";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

/* ── Quick Actions ── */
interface QuickAction { href: string; iconKey: string; label: string }

const ALL_QA_OPTIONS: QuickAction[] = MODULE_GROUPS.flatMap(g =>
  g.modules.map(m => ({ href: m.href, iconKey: m.href, label: m.label }))
);

const DEFAULT_QA: QuickAction[] = [
  { href: "/client/factures",  iconKey: "/client/factures",  label: "Factures"  },
  { href: "/client/depenses",  iconKey: "/client/depenses",  label: "Dépenses"  },
  { href: "/client/tresorerie",iconKey: "/client/tresorerie",label: "Tréso"     },
  { href: "/client/crm",       iconKey: "/client/crm",       label: "CRM"       },
  { href: "/client/bloc-notes",iconKey: "/client/bloc-notes",label: "Notes"     },
  { href: "/client/chrono",    iconKey: "/client/chrono",    label: "Chrono"    },
];

/* ── Types ── */
interface TodayTask  { id: string; title: string; priority: string; due_date: string }
interface NextEvent  { id: string; title: string; start_at: string; event_type: string }

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}
function getDay() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtEventTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtEventDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dMidnight     = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
  const diffDays = Math.round((dMidnight.getTime() - todayMidnight.getTime()) / 86_400_000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function priorityColor(p: string) {
  if (p === "urgent") return "#ef4444";
  if (p === "high")   return "#f97316";
  if (p === "low")    return "#94a3b8";
  return "#a78bfa";
}


function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────── */
export default function CockpitPage() {
  const { isPremium, isFree } = useSubscription();
  const { isDark, accent } = useTheme();

  /* ── État KPIs ── */
  const [firstName,      setFirstName]      = useState("");
  const [initial,        setInitial]        = useState("?");
  const [kpiLoading,     setKpiLoading]     = useState(true);
  const [caMonth,        setCaMonth]        = useState(0);
  const [depensesMonth,  setDepensesMonth]  = useState(0);
  const [nbContacts,     setNbContacts]     = useState(0);
  const [nbFactures,     setNbFactures]     = useState(0);
  const [caEvo,          setCaEvo]          = useState<number | null>(null);

  /* ── État "Aujourd'hui" ── */
  const [todayTasks,   setTodayTasks]   = useState<TodayTask[]>([]);
  const [nextEvent,    setNextEvent]    = useState<NextEvent | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [nbTasks,      setNbTasks]      = useState(0);
  const [lastFac,      setLastFac]      = useState<{ numero: string; montant_ttc: number; date_emission: string; client_nom: string } | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);

  /* ── UI ── */
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [search,       setSearch]       = useState("");
  const [showAlert,    setShowAlert]    = useState(true);
  const [quickActions, setQuickActions] = useState<QuickAction[]>(DEFAULT_QA);
  const [editingQA,    setEditingQA]    = useState(false);
  const [pickerDraft,  setPickerDraft]  = useState<QuickAction[]>(DEFAULT_QA);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ── Chargement données ── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      /* ── Nom / Société ── */
      const metaCompany = (
        (user.user_metadata?.company_name as string | undefined)
        || (user.user_metadata?.company as string | undefined)
        || (user.user_metadata?.organization as string | undefined)
        || ""
      ).trim();

      const metaFullName = (
        (user.user_metadata?.full_name as string | undefined)
        || (user.user_metadata?.name as string | undefined)
        || ""
      ).trim();

      /* ── Quick Actions préférées ── */
      const { data: qaPref } = await supabase
        .from("user_preferences")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "quick_actions")
        .maybeSingle();
      if (Array.isArray(qaPref?.value) && qaPref.value.length > 0) {
        const loaded = qaPref.value as QuickAction[];
        setQuickActions(loaded);
        setPickerDraft(loaded);
      }

      const { data: uaRow } = await supabase
        .from("user_access")
        .select("name")
        .eq("email", user.email!)
        .maybeSingle();
      const accessName = ((uaRow as { name?: string } | null)?.name ?? "").trim();

      const emailSlug = user.email?.split("@")[0] ?? "";
      const emailFormatted = emailSlug
        .replace(/[._-]/g, " ")
        .split(" ")
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");

      const displayName = metaCompany || accessName || metaFullName || emailFormatted;

      setFirstName(displayName);
      setInitial(displayName.charAt(0).toUpperCase());

      const now   = new Date();
      const y     = now.getFullYear();
      const m     = String(now.getMonth() + 1).padStart(2, "0");
      const start = `${y}-${m}-01`;
      const end   = `${y}-${m}-31`;
      const prevM = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevY = now.getMonth() === 0 ? y - 1 : y;
      const pS    = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
      const pE    = `${prevY}-${String(prevM).padStart(2, "0")}-31`;
      const today = todayStr();

      const [facRes, prevRes, crmRes, pendRes, expRes] = await Promise.all([
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", start).lte("date_emission", end),
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", pS).lte("date_emission", pE),
        supabase.from("clients_crm").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("factures").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("statut", ["envoyée", "en_attente"]),
        supabase.from("expenses").select("amount").eq("user_id", user.id).gte("date", start).lte("date", end),
      ]);

      const ca     = (facRes.data  ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const caPrev = (prevRes.data ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const exp    = (expRes.data  ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);

      setCaMonth(ca);
      setDepensesMonth(exp);
      setNbContacts(crmRes.count ?? 0);
      setNbFactures(pendRes.count ?? 0);
      if (caPrev > 0) setCaEvo(Math.round(((ca - caPrev) / caPrev) * 100));
      setKpiLoading(false);

      /* ── Données "Aujourd'hui" ── */
      const [taskRes, eventRes, overdueRes, allTasksRes, lastFacRes] = await Promise.all([
        supabase
          .from("productivity_tasks")
          .select("id, title, priority, due_date")
          .eq("user_id", user.id)
          .neq("status", "done")
          .lte("due_date", today)
          .order("due_date", { ascending: true })
          .limit(3),
        supabase
          .from("planning_events")
          .select("id, title, start_at, event_type")
          .eq("user_id", user.id)
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("type", "facture")
          .eq("statut", "envoyée")
          .lt("due_date", today),
        supabase
          .from("productivity_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "done"),
        supabase
          .from("factures")
          .select("numero, montant_ttc, date_emission, client_nom")
          .eq("user_id", user.id)
          .order("date_emission", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setTodayTasks((taskRes.data ?? []) as TodayTask[]);
      setNextEvent(eventRes.data as NextEvent | null);
      setOverdueCount(overdueRes.count ?? 0);
      setNbTasks(allTasksRes.count ?? 0);
      setLastFac(lastFacRes.data as typeof lastFac ?? null);
      setTodayLoading(false);
    })();
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ── Sauvegarder quick actions ── */
  async function saveQuickActions(actions: QuickAction[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_preferences").upsert(
      { user_id: user.id, key: "quick_actions", value: actions, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  }

  /* ── Recherche modules ── */
  const allModules = useMemo(
    () => MODULE_GROUPS.flatMap(g => g.modules.map(m => ({ ...m, group: g.label }))),
    []
  );
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return MODULE_GROUPS;
    const q = search.toLowerCase();
    return MODULE_GROUPS
      .map(g => ({ ...g, modules: g.modules.filter(m => m.label.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q)) }))
      .filter(g => g.modules.length > 0);
  }, [search]);

  const totalModules = allModules.length;
  const netMonth = caMonth - depensesMonth;

  /* ─────────────────────────────────────────────────
     RENDU
  ───────────────────────────────────────────────── */
  return (
    <div className={`min-h-full overflow-x-hidden ${isDark ? "bg-[#07080e]" : "bg-[#f4f5f9]"}`}>

      <OnboardingModal name={firstName} />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: isDark
          ? "linear-gradient(155deg,#07080e 0%,#0d1117 50%,#07080e 100%)"
          : "linear-gradient(155deg,#eef0f8 0%,#e6e9f5 50%,#eef0f8 100%)" }}
      >
        {/* Shimmer gold line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease }}
          className="absolute inset-x-0 top-0 h-[1.5px] origin-left"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,165,90,0.8) 35%, rgba(201,165,90,0.4) 65%, transparent 100%)" }}
        />

        {/* Orb ambiance */}
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.07, 0.15, 0.07] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-24 left-1/2 h-[360px] w-[560px] -translate-x-1/2 rounded-full blur-[100px]"
          style={{ background: "rgba(201,165,90,0.22)" }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="pointer-events-none absolute bottom-10 right-0 h-[220px] w-[320px] rounded-full blur-[80px]"
          style={{ background: "rgba(99,102,241,0.1)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pt-5 pb-8 lg:px-8">

          {/* ── Top bar ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease }}
            className="flex items-start justify-between mb-6"
          >
            <div>
              <p className={`text-[9.5px] font-semibold uppercase tracking-[0.2em] capitalize ${isDark ? "text-white/25" : "text-gray-400"}`}>
                {getDay()}
              </p>
              <p className={`mt-1 text-[22px] font-black leading-tight tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                {getGreeting()}
                {firstName && (
                  <span style={{ color: GOLD }}>{`, ${firstName.split(" ")[0]}`}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {/* Bell */}
              <Link href={overdueCount > 0 ? "/client/factures?statut=retard" : "/client/factures"}>
                <motion.div whileTap={{ scale: 0.88 }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
                  }}>
                  <Bell size={14} className={isDark ? "text-white/50" : "text-gray-500"} />
                  {(nbFactures + overdueCount) > 0 && <NotifBadge count={nbFactures + overdueCount} />}
                </motion.div>
              </Link>
              {/* Avatar menu */}
              <div className="relative" ref={menuRef}>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-black text-black shadow-[0_0_18px_rgba(201,165,90,0.45)]"
                  style={{ background: "linear-gradient(135deg,#d4aa5f,#b08d45)" }}
                >{initial}</motion.button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -6 }}
                      transition={{ duration: 0.16, ease }}
                      className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.25)]"
                      style={{
                        background: isDark ? "#0e1420" : "#ffffff",
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.10)",
                      }}
                    >
                      <div className={`px-4 py-3 ${isDark ? "border-b border-white/8" : "border-b border-gray-100"}`}>
                        <p className={`text-[12px] font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{firstName}</p>
                        <div className="mt-1">
                          {isPremium ? (
                            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold w-fit"
                              style={{ background: "rgba(201,165,90,0.12)", color: GOLD }}>
                              <Crown size={7} /> DJAMA PRO
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-gray-400">Plan Gratuit</span>
                          )}
                        </div>
                      </div>
                      {[
                        { icon: LayoutGrid, label: "Dashboard",  href: "/client" },
                        { icon: Crown,      label: "Abonnement", href: "/client/abonnements" },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                            <Icon size={13} className={isDark ? "text-white/40" : "text-gray-400"} />
                            <span className={`flex-1 text-[12.5px] font-medium ${isDark ? "text-white/70" : "text-gray-700"}`}>{item.label}</span>
                            <ChevronRight size={11} className={isDark ? "text-white/30" : "text-gray-400"} />
                          </Link>
                        );
                      })}
                      <button
                        onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-red-50 ${isDark ? "border-t border-white/8" : "border-t border-gray-100"}`}
                      >
                        <LogOut size={13} className="text-red-400" />
                        <span className="text-[12.5px] font-medium text-red-400">Se déconnecter</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ── KPI Hero card ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.07, ease }}
            className="rounded-3xl p-5 mb-4"
            style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
              backdropFilter: "blur(16px)",
              boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <BarChart2 size={12} style={{ color: GOLD }} />
                <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${isDark ? "text-white/30" : "text-gray-400"}`}>
                  CA · {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
              </div>
              {!kpiLoading && caEvo !== null && (
                <div className="flex items-center gap-1 rounded-xl px-2.5 py-1"
                  style={{
                    background: caEvo >= 0 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                    border: `1px solid ${caEvo >= 0 ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.18)"}`,
                  }}>
                  {caEvo >= 0
                    ? <TrendingUp size={10} color="#4ade80" />
                    : <TrendingDown size={10} color="#f87171" />}
                  <span className="text-[11px] font-black ml-0.5" style={{ color: caEvo >= 0 ? "#4ade80" : "#f87171" }}>
                    {caEvo >= 0 ? "+" : ""}{caEvo}%
                  </span>
                </div>
              )}
              {!kpiLoading && caEvo === null && (
                <div className="flex items-center gap-1 rounded-xl px-2.5 py-1"
                  style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.16)" }}>
                  <Sparkles size={9} style={{ color: GOLD }} />
                  <span className="text-[10px] font-bold" style={{ color: GOLD }}>Premier mois</span>
                </div>
              )}
            </div>

            {/* Grand nombre */}
            <div className="mb-4">
              {kpiLoading ? (
                <div className="h-[52px] w-44 rounded-xl animate-pulse mt-2" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.2, ease }}
                  className={`text-[3.4rem] font-black leading-none tracking-tight mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {fmtEurInt(caMonth)}
                </motion.p>
              )}
            </div>

            {/* Barre dépenses */}
            {!kpiLoading && (caMonth > 0 || depensesMonth > 0) && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[9px] font-medium ${isDark ? "text-white/25" : "text-gray-400"}`}>
                    Dépenses {fmtEurInt(depensesMonth)}
                  </span>
                  <span className="text-[9px] font-semibold" style={{
                    color: caMonth > 0 && depensesMonth / caMonth > 0.7 ? "#f87171" : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"
                  }}>
                    {caMonth > 0 ? Math.round((depensesMonth / caMonth) * 100) : 0}% du CA
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${caMonth > 0 ? Math.min((depensesMonth / caMonth) * 100, 100) : 0}%` }}
                    transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background: caMonth > 0 && depensesMonth / caMonth > 0.7
                        ? "linear-gradient(90deg,#f87171,#ef4444)"
                        : caMonth > 0 && depensesMonth / caMonth > 0.4
                          ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                          : "linear-gradient(90deg,#4ade80,#22c55e)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mini stats KPI */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Contacts",   val: kpiLoading ? "—" : String(nbContacts), color: "#60a5fa" },
                { label: "En attente", val: kpiLoading ? "—" : String(nbFactures), color: nbFactures > 0 ? "#f87171" : "#4ade80" },
                { label: "Tâches",     val: kpiLoading ? "—" : String(nbTasks),    color: nbTasks > 0 ? "#fbbf24" : "#4ade80"   },
              ].map(s => (
                <div key={s.label}
                  className="flex flex-col items-center justify-center rounded-xl py-2.5"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <span className="text-[15px] font-black tabular-nums" style={{ color: s.color }}>{s.val}</span>
                  <span className={`mt-0.5 text-[8.5px] text-center ${isDark ? "text-white/25" : "text-gray-400"}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Net badge row ── */}
          {!kpiLoading && caMonth > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25, ease }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.85)",
                  border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
                }}>
                <span className={`text-[9px] uppercase tracking-wide font-semibold ${isDark ? "text-white/30" : "text-gray-400"}`}>Net</span>
                <span className="text-[13px] font-black" style={{ color: netMonth >= 0 ? "#16a34a" : "#f87171" }}>
                  {netMonth >= 0 ? "+" : ""}{fmtEurInt(netMonth)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.85)",
                  border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
                }}>
                <span className={`text-[9px] uppercase tracking-wide font-semibold ${isDark ? "text-white/30" : "text-gray-400"}`}>Dép.</span>
                <span className="text-[13px] font-black text-red-500">{fmtEurInt(depensesMonth)}</span>
              </div>
            </motion.div>
          )}

          {/* ── Quick Actions ── */}
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? "text-white/25" : "text-gray-400"}`}>Raccourcis</span>
            <button
              onClick={() => { setPickerDraft(quickActions); setEditingQA(true); }}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${isDark ? "text-white/40 hover:text-white/70" : "text-gray-500 hover:text-gray-700"}`}
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
            >
              <Settings2 size={10} /> Modifier
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
            className="grid gap-2 sm:gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(quickActions.length, 6)}, 1fr)` }}
          >
            {quickActions.map((a, i) => {
              const isLocked = getToolTier(a.href) === "premium" && isFree;
              return (
                <motion.div key={a.href + i}
                  initial={{ opacity: 0, y: 14, scale: 0.82 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.26 + i * 0.05 }}
                >
                  <Link href={isLocked ? "/client/abonnements" : a.href} className="relative flex flex-col items-center gap-1.5 transition active:scale-95">
                    <div className="relative h-[44px] w-[44px] sm:h-[52px] sm:w-[52px] overflow-hidden rounded-[12px] sm:rounded-[15px] shadow-[0_6px_18px_rgba(0,0,0,0.32)]"
                      style={{ opacity: isLocked ? 0.68 : 1 }}>
                      {APP_ICONS[a.iconKey]}
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide text-center leading-tight ${isDark ? "text-white/70" : "text-gray-600"}`}>{a.label}</span>
                    {isLocked && (
                      <div className="absolute top-0 right-0 flex h-[16px] w-[16px] items-center justify-center rounded-full shadow"
                        style={{ background: GOLD, border: "1.5px solid rgba(255,255,255,0.5)" }}>
                        <Lock size={7} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

        </div>

        {/* ── Dégradé de transition ── */}
        <div className="h-8 w-full" style={{ background: isDark ? "linear-gradient(to bottom, transparent, #0a0b0f)" : "linear-gradient(to bottom, transparent, #f4f5f9)" }} />
      </div>

      {/* ══════════════════════════════════════════
          CONTENU CLAIR
      ══════════════════════════════════════════ */}
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-3 sm:px-6 lg:px-8">

        {/* ── Alerte factures en retard ── */}
        <AnimatePresence>
          {overdueCount > 0 && showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.28, ease }}
              className="overflow-hidden mb-4"
            >
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <p className="flex-1 text-[12px] font-semibold text-red-700">
                  {overdueCount} facture{overdueCount > 1 ? "s" : ""} en retard de paiement
                </p>
                <Link href="/client/factures?statut=retard"
                  className="shrink-0 text-[11px] font-bold text-red-600 underline underline-offset-2">
                  Voir
                </Link>
                <button onClick={() => setShowAlert(false)} className="shrink-0 text-red-400 hover:text-red-600 transition-colors ml-1">
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PRO banner (free) ── */}
        <AnimatePresence>
          {isFree && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease }}
              className="mb-4"
            >
              <Link href="/client/abonnements">
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:opacity-95"
                  style={{ background: "linear-gradient(135deg,rgba(201,165,90,0.12) 0%,rgba(180,143,69,0.08) 100%)", border: "1px solid rgba(201,165,90,0.22)" }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
                    <Crown size={14} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-bold" style={{ color: isDark ? GOLD : "#92681e" }}>Passez à DJAMA PRO</p>
                    <p className={`text-[10.5px] ${isDark ? "text-amber-400/60" : "text-amber-700/60"}`}>Débloquez tous les modules · 11,90€/mois</p>
                  </div>
                  <ChevronRight size={14} style={{ color: GOLD }} />
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Checklist démarrage (compte neuf) ── */}
        <AnimatePresence>
          {!kpiLoading && !todayLoading && caMonth === 0 && nbContacts === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease }}
              className="mb-5 rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(201,165,90,0.18)", background: "rgba(201,165,90,0.04)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
                <Sparkles size={12} style={{ color: GOLD }} />
                <span className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                  Démarrage rapide
                </span>
              </div>
              {/* Steps */}
              {([
                { done: true,                  label: "Créer votre compte DJAMA",          href: null,                    sub: "C'est fait !" },
                { done: false,                 label: "Personnaliser votre profil",         href: "/client/profil",        sub: "Logo, SIRET, RIB" },
                { done: nbContacts > 0,        label: "Ajouter votre premier client",       href: "/client/crm",           sub: "Base clients CRM" },
                { done: (nbFactures ?? 0) > 0, label: "Envoyer votre 1ère facture",         href: "/client/factures",      sub: "Commencez à facturer" },
              ] as { done: boolean; label: string; href: string | null; sub: string }[]).map((step, i) => (
                <Link key={i} href={step.done || !step.href ? "#" : step.href}
                  onClick={e => { if (step.done || !step.href) e.preventDefault(); }}>
                  <div className={`flex items-center gap-3 px-4 py-2.5 transition ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"}`}
                    style={{ borderTop: i > 0 ? `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` : "none" }}>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ background: step.done ? "rgba(34,197,94,0.15)" : "rgba(201,165,90,0.1)" }}>
                      {step.done
                        ? <CheckCircle2 size={13} className="text-emerald-500" />
                        : <span className="text-[9px] font-bold" style={{ color: GOLD }}>{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11.5px] font-semibold leading-tight ${step.done ? (isDark ? "line-through text-white/30" : "line-through text-gray-300") : (isDark ? "text-white/75" : "text-gray-700")}`}>
                        {step.label}
                      </p>
                      <p className={`text-[9.5px] mt-0.5 ${isDark ? "text-white/25" : "text-gray-400"}`}>{step.sub}</p>
                    </div>
                    {!step.done && step.href && <ChevronRight size={11} className={`shrink-0 ${isDark ? "text-white/20" : "text-gray-300"}`} />}
                  </div>
                </Link>
              ))}
              {/* Barre de progression */}
              <div className="px-4 pb-3.5 pt-1 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${([true, false, nbContacts > 0, (nbFactures ?? 0) > 0].filter(Boolean).length / 4) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.3, ease }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg,#c9a55a,#e8c87a)" }}
                  />
                </div>
                <span className="text-[9px] font-bold" style={{ color: GOLD }}>
                  {[true, false, nbContacts > 0, (nbFactures ?? 0) > 0].filter(Boolean).length}/4
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Section "Aujourd'hui" ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-1 rounded-full" style={{ background: accent }} />
            <h2 className={`text-[12px] font-black uppercase tracking-[0.15em] ${isDark ? "text-white/30" : "text-gray-400"}`}>Aujourd&apos;hui</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">

            {/* Card Tâches */}
            <Link href="/client/productivite">
              <motion.div
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden rounded-2xl p-4 transition-all"
                style={{
                  background: isDark
                    ? "linear-gradient(145deg, rgba(190,24,93,0.10) 0%, rgba(15,10,20,0.95) 60%)"
                    : "linear-gradient(145deg, rgba(190,24,93,0.07) 0%, #ffffff 65%)",
                  border: "1px solid rgba(190,24,93,0.18)",
                  boxShadow: isDark
                    ? "0 4px 24px rgba(190,24,93,0.08), inset 0 1px 0 rgba(255,255,255,0.04)"
                    : "0 2px 16px rgba(190,24,93,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="pointer-events-none absolute -top-8 -left-4 h-24 w-24 rounded-full blur-2xl"
                  style={{ background: "rgba(190,24,93,0.12)" }} />

                <div className="relative flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "rgba(190,24,93,0.10)", border: "1px solid rgba(190,24,93,0.18)" }}>
                    <ListTodo size={15} style={{ color: "#e879a0" }} />
                  </div>
                  {!todayLoading && (
                    <span className="text-[24px] font-black tabular-nums leading-none"
                      style={{ color: nbTasks > 0 ? "#e879a0" : "#22c55e" }}>
                      {nbTasks}
                    </span>
                  )}
                </div>

                <p className={`relative text-[12px] font-bold mb-2 ${isDark ? "text-white/85" : "text-gray-800"}`}>Tâches</p>

                {todayLoading ? (
                  <div className="space-y-2">
                    {[0, 1].map(i => (
                      <div key={i} className="h-2 rounded-full animate-pulse"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", width: i === 0 ? "85%" : "60%" }} />
                    ))}
                  </div>
                ) : todayTasks.length > 0 ? (
                  <div className="relative space-y-1.5">
                    {todayTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-1"
                        style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(190,24,93,0.05)" }}>
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: priorityColor(t.priority) }} />
                        <p className={`text-[10px] truncate leading-tight ${isDark ? "text-white/55" : "text-gray-600"}`}>{t.title}</p>
                      </div>
                    ))}
                    {todayTasks.length > 2 && (
                      <p className={`text-[9px] px-2 ${isDark ? "text-white/30" : "text-gray-400"}`}>+{todayTasks.length - 2} autres</p>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-semibold text-emerald-500">Tout est bon !</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-bold"
                      style={{ background: "rgba(190,24,93,0.08)", border: "1px solid rgba(190,24,93,0.18)", color: "#e879a0" }}>
                      + Nouvelle tâche
                    </span>
                  </div>
                )}
              </motion.div>
            </Link>

            {/* Card Agenda */}
            <Link href="/client/planning">
              <motion.div
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden rounded-2xl p-4 transition-all"
                style={{
                  background: isDark
                    ? "linear-gradient(145deg, rgba(79,70,229,0.10) 0%, rgba(10,12,22,0.95) 60%)"
                    : "linear-gradient(145deg, rgba(79,70,229,0.07) 0%, #ffffff 65%)",
                  border: "1px solid rgba(79,70,229,0.18)",
                  boxShadow: isDark
                    ? "0 4px 24px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.04)"
                    : "0 2px 16px rgba(79,70,229,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="pointer-events-none absolute -top-8 -left-4 h-24 w-24 rounded-full blur-2xl"
                  style={{ background: "rgba(79,70,229,0.12)" }} />

                <div className="relative flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "rgba(79,70,229,0.10)", border: "1px solid rgba(79,70,229,0.18)" }}>
                    <Calendar size={15} style={{ color: "#818cf8" }} />
                  </div>
                  {!todayLoading && nextEvent && (
                    <span className="text-[24px] font-black tabular-nums leading-none"
                      style={{ color: "#818cf8" }}>
                      {new Date(nextEvent.start_at).getDate()}
                    </span>
                  )}
                </div>

                <p className={`relative text-[12px] font-bold mb-2 ${isDark ? "text-white/85" : "text-gray-800"}`}>Agenda</p>

                {todayLoading ? (
                  <div className="space-y-2">
                    <div className="h-2 rounded-full animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", width: "75%" }} />
                    <div className="h-2 rounded-full animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", width: "50%" }} />
                  </div>
                ) : nextEvent ? (
                  <div className="relative space-y-1">
                    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                      style={{ background: isDark ? "rgba(79,70,229,0.08)" : "rgba(79,70,229,0.06)" }}>
                      <Clock size={9} style={{ color: "#818cf8" }} className="shrink-0" />
                      <p className={`text-[10px] font-semibold truncate leading-tight ${isDark ? "text-white/70" : "text-gray-700"}`}>{nextEvent.title}</p>
                    </div>
                    <p className={`text-[9px] px-2 ${isDark ? "text-white/30" : "text-gray-400"}`}>
                      {fmtEventDate(nextEvent.start_at)} · {fmtEventTime(nextEvent.start_at)}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <p className={`text-[10px] mb-2.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>Journée libre</p>
                    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-bold"
                      style={{ background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.18)", color: "#818cf8" }}>
                      + Planifier
                    </span>
                  </div>
                )}
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* ── Dernière facture (activité récente) ── */}
        {!todayLoading && lastFac && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.18, ease }}
            className="mb-5"
          >
            <Link href="/client/factures">
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
                  border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
                  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.05)",
                }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(37,99,235,0.08)" }}>
                  <Activity size={15} style={{ color: "#2563eb" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-bold truncate ${isDark ? "text-white/80" : "text-gray-800"}`}>
                    Dernière facture — <span className={isDark ? "text-white/40" : "text-gray-400"}>{lastFac.client_nom || "client"}</span>
                  </p>
                  <p className={`text-[10.5px] ${isDark ? "text-white/35" : "text-gray-400"}`}>
                    {lastFac.numero} · {new Date(lastFac.date_emission).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`shrink-0 text-[13px] font-black ${isDark ? "text-white" : "text-gray-900"}`}>{fmtEurInt(lastFac.montant_ttc)}</span>
                <ChevronRight size={13} className={`shrink-0 ${isDark ? "text-gray-400" : "text-gray-400"}`} />
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── Barre de recherche ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.22, ease }}
          className="relative mb-5"
        >
          <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un module…"
            className={`w-full rounded-2xl py-3 pl-11 pr-10 text-[13px] outline-none transition ${isDark ? "text-white placeholder:text-white/30" : "text-gray-800 placeholder:text-gray-400"}`}
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
              border: search ? `1px solid rgba(201,165,90,0.4)` : isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              boxShadow: search
                ? `0 0 0 3px rgba(201,165,90,0.08), 0 2px 12px rgba(0,0,0,0.15)`
                : isDark ? "0 2px 10px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}>
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* ── Résultats recherche ── */}
        {search.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease }}
            className="mb-5"
          >
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 rounded-2xl"
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
                  border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
                }}>
                <Search size={22} className="text-gray-400" />
                <p className="text-[12px] text-gray-400">Aucun module pour &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredGroups.flatMap(g => g.modules).map((mod, mi) => (
                  <ModuleCard
                    key={mod.href + mi}
                    mod={mod}
                    index={mi}
                    isPremium={isPremium}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Module groups ── */}
        {!search.trim() && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {MODULE_GROUPS.map((group, gi) => (
              <ModuleGroupSection
                key={group.label}
                group={group}
                groupIndex={gi}
                isPremium={isPremium}
                isFree={isFree}
              />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-10 flex flex-col items-center gap-3">
          {isFree && (
            <Link
              href="/client/abonnements"
              className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[12px] font-bold text-white transition hover:opacity-90 shadow-[0_4px_14px_rgba(201,165,90,0.3)]"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}
            >
              <Crown size={12} /> Passer à DJAMA PRO — 11,90€/mois
            </Link>
          )}
          <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            DJAMA PRO · {totalModules} modules · Données en temps réel
          </p>
        </div>
      </div>

      {/* ══ MODAL PICKER QUICK ACTIONS ══ */}
      <AnimatePresence>
        {editingQA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingQA(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 pb-8"
              style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-black text-white">Mes raccourcis</h3>
                <button onClick={() => setEditingQA(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <X size={14} className="text-white/60" />
                </button>
              </div>
              <p className="text-[11px] text-white/35 mb-4">
                Choisissez jusqu'à <strong className="text-white/55">6 modules</strong> à afficher en accès rapide
              </p>

              {/* Grille tous les modules */}
              <div className="grid grid-cols-4 gap-3 max-h-[52vh] overflow-y-auto pr-1">
                {ALL_QA_OPTIONS.map((opt) => {
                  const selected = pickerDraft.some(a => a.href === opt.href);
                  const atMax    = pickerDraft.length >= 6;
                  const icon     = APP_ICONS[opt.iconKey];
                  if (!icon) return null;
                  return (
                    <button
                      key={opt.href}
                      onClick={() => {
                        if (selected) {
                          setPickerDraft(d => d.filter(a => a.href !== opt.href));
                        } else if (!atMax) {
                          setPickerDraft(d => [...d, opt]);
                        }
                      }}
                      className="relative flex flex-col items-center gap-1.5 rounded-xl py-2 transition"
                      style={{
                        opacity: !selected && atMax ? 0.3 : 1,
                        background: selected ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                        border: selected ? "1.5px solid rgba(34,197,94,0.35)" : "1.5px solid rgba(255,255,255,0.06)",
                        cursor: !selected && atMax ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="relative h-[44px] w-[44px] overflow-hidden rounded-[12px]">
                        {icon}
                        {selected && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: "rgba(0,0,0,0.28)" }}>
                            <Check size={18} strokeWidth={3} className="text-green-400" />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-semibold text-white/60 text-center leading-tight line-clamp-2 px-0.5">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sélection actuelle */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] text-white/35">Sélection :</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-2 w-2 rounded-full"
                      style={{ background: i < pickerDraft.length ? "#22c55e" : "rgba(255,255,255,0.12)" }} />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-white/50">{pickerDraft.length}/6</span>
              </div>

              {/* Boutons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setPickerDraft(DEFAULT_QA)}
                  className="flex-1 rounded-xl py-2.5 text-[12px] font-semibold text-white/40 transition hover:text-white/60"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Réinitialiser
                </button>
                <button
                  onClick={async () => {
                    setQuickActions(pickerDraft);
                    setEditingQA(false);
                    await saveQuickActions(pickerDraft);
                  }}
                  disabled={pickerDraft.length === 0}
                  className="flex-2 flex-1 rounded-xl py-2.5 text-[12px] font-bold text-white transition"
                  style={{ background: pickerDraft.length === 0 ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg,#22c55e,#16a34a)" }}
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
