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
  Clock, ArrowRight, Sparkles, Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import OnboardingModal from "@/components/OnboardingModal";
import { APP_ICONS } from "@/components/AppIcons";
import { MODULE_GROUPS } from "@/lib/module-groups";
import { ModuleCard, ModuleGroupSection } from "@/components/ModuleCard";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

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
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [showAlert, setShowAlert] = useState(true);
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
    <div className="min-h-full overflow-x-hidden" style={{ background: "#eef0f5" }}>

      <OnboardingModal name={firstName} />

      {/* ══════════════════════════════════════════
          HERO SOMBRE
      ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(155deg,#07090f 0%,#0c1526 50%,#070c18 100%)" }}
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

        <div className="relative mx-auto max-w-4xl px-4 pt-5 pb-8">

          {/* ── Top bar ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease }}
            className="flex items-start justify-between mb-6"
          >
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/25 capitalize">
                {getDay()}
              </p>
              <p className="mt-1 text-[22px] font-black text-white leading-tight tracking-tight">
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
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Bell size={14} className="text-white/50" />
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
                      className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl bg-[#0e1420] border border-white/8 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                      style={{ border: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-[12px] font-bold text-white truncate">{firstName}</p>
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
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/5">
                            <Icon size={13} className="text-white/40" />
                            <span className="flex-1 text-[12.5px] font-medium text-white/70">{item.label}</span>
                            <ChevronRight size={11} className="text-gray-300" />
                          </Link>
                        );
                      })}
                      <button
                        onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-red-50 border-t border-gray-100"
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
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <BarChart2 size={12} style={{ color: GOLD }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
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
                <div className="h-[52px] w-44 rounded-xl animate-pulse mt-2" style={{ background: "rgba(255,255,255,0.07)" }} />
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.2, ease }}
                  className="text-[3.4rem] font-black leading-none tracking-tight text-white mt-1"
                >
                  {fmtEurInt(caMonth)}
                </motion.p>
              )}
            </div>

            {/* Barre dépenses */}
            {!kpiLoading && (caMonth > 0 || depensesMonth > 0) && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] text-white/25 font-medium">
                    Dépenses {fmtEurInt(depensesMonth)}
                  </span>
                  <span className="text-[9px] font-semibold" style={{
                    color: caMonth > 0 && depensesMonth / caMonth > 0.7 ? "#f87171" : "rgba(255,255,255,0.3)"
                  }}>
                    {caMonth > 0 ? Math.round((depensesMonth / caMonth) * 100) : 0}% du CA
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
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

            {/* Mini stats ou CTA premier mois */}
            {caMonth === 0 && !kpiLoading ? (
              <Link href="/client/factures">
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition hover:opacity-90"
                  style={{ background: "rgba(201,165,90,0.07)", border: "1px solid rgba(201,165,90,0.15)" }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(201,165,90,0.15)" }}>
                    <ArrowRight size={14} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-white/80">Créez votre première facture</p>
                    <p className="text-[10px] text-white/30">Commencez à suivre votre activité</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Contacts",   val: kpiLoading ? "—" : String(nbContacts), color: "#60a5fa", sub: "CRM" },
                  { label: "En attente", val: kpiLoading ? "—" : String(nbFactures), color: nbFactures > 0 ? "#f87171" : "#4ade80", sub: "Factures" },
                  { label: "Tâches",     val: kpiLoading ? "—" : String(nbTasks),    color: nbTasks > 0 ? "#fbbf24" : "#4ade80",   sub: "Actives" },
                ].map(s => (
                  <div key={s.label}
                    className="flex flex-col items-center justify-center rounded-xl py-2.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-[15px] font-black tabular-nums" style={{ color: s.color }}>{s.val}</span>
                    <span className="mt-0.5 text-[8.5px] text-white/25 text-center">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
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
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-[9px] uppercase tracking-wide text-white/30 font-semibold">Net</span>
                <span className="text-[13px] font-black" style={{ color: netMonth >= 0 ? "#4ade80" : "#f87171" }}>
                  {netMonth >= 0 ? "+" : ""}{fmtEurInt(netMonth)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-[9px] uppercase tracking-wide text-white/30 font-semibold">Dép.</span>
                <span className="text-[13px] font-black text-red-400">{fmtEurInt(depensesMonth)}</span>
              </div>
            </motion.div>
          )}

          {/* ── Quick Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
            className="grid grid-cols-3 gap-3 sm:grid-cols-6"
          >
            {([
              { href: "/client/factures?create=facture", iconKey: "/client/factures", label: "Facture",  locked: false },
              { href: "/client/factures?create=devis",   iconKey: "qa/devis",         label: "Devis",    locked: false },
              { href: "/client/depenses",                iconKey: "/client/depenses", label: "Dépense",  locked: isFree },
              { href: "/client/crm",                     iconKey: "qa/contact",       label: "Contact",  locked: isFree },
              { href: "/client/bloc-notes",              iconKey: "qa/note",          label: "Note",     locked: false },
              { href: "/client/chrono",                  iconKey: "qa/timer",         label: "Timer",    locked: isFree },
            ] as { href: string; iconKey: string; label: string; locked: boolean }[]).map((a, i) => (
              <motion.div key={a.label}
                initial={{ opacity: 0, y: 14, scale: 0.82 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.26 + i * 0.05 }}
              >
                <Link href={a.href} className="relative flex flex-col items-center gap-1.5 transition active:scale-95">
                  <div className="relative h-[52px] w-[52px] overflow-hidden rounded-[15px] shadow-[0_6px_18px_rgba(0,0,0,0.32)]"
                    style={{ opacity: a.locked ? 0.68 : 1 }}>
                    {APP_ICONS[a.iconKey]}
                  </div>
                  <span className="text-[10px] font-semibold text-white/70 tracking-wide">{a.label}</span>
                  {a.locked && (
                    <div className="absolute -top-0.5 -right-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full shadow"
                      style={{ background: GOLD, border: "1.5px solid rgba(255,255,255,0.5)" }}>
                      <Lock size={7} color="white" strokeWidth={3} />
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </div>

        {/* ── Wave ── */}
        <svg viewBox="0 0 1440 56" fill="none" preserveAspectRatio="none"
          className="w-full block" style={{ marginBottom: "-1px", height: "56px" }}>
          <path d="M0,24 C180,56 420,6 720,28 C1020,50 1260,10 1440,32 L1440,56 L0,56 Z" fill="#eef0f5"/>
        </svg>
      </div>

      {/* ══════════════════════════════════════════
          CONTENU CLAIR
      ══════════════════════════════════════════ */}
      <div className="mx-auto max-w-4xl px-4 pb-14 pt-3 sm:px-6">

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
                    <p className="text-[12.5px] font-bold" style={{ color: "#92681e" }}>Passez à DJAMA PRO</p>
                    <p className="text-[10.5px] text-amber-700/60">Débloquez tous les modules · 11,90€/mois</p>
                  </div>
                  <ChevronRight size={14} style={{ color: GOLD }} />
                </div>
              </Link>
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
            <div className="h-1 w-1 rounded-full" style={{ background: GOLD }} />
            <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-white/30">Aujourd&apos;hui</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">

            {/* Card Tâches */}
            <Link href="/client/productivite">
              <motion.div whileTap={{ scale: 0.97 }}
                className="rounded-2xl p-4 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: "rgba(190,24,93,0.08)" }}>
                    <ListTodo size={14} style={{ color: "#be185d" }} />
                  </div>
                  {!todayLoading && (
                    <span className="text-[11px] font-black tabular-nums" style={{ color: nbTasks > 0 ? "#be185d" : "#10b981" }}>
                      {nbTasks}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] font-bold text-white/80 mb-0.5">Tâches</p>
                {todayLoading ? (
                  <div className="space-y-1.5 mt-2">
                    {[0, 1].map(i => (
                      <div key={i} className="h-2 rounded animate-pulse" style={{ background: "#f3f4f6", width: i === 0 ? "80%" : "60%" }} />
                    ))}
                  </div>
                ) : todayTasks.length > 0 ? (
                  <div className="space-y-1.5 mt-1">
                    {todayTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: priorityColor(t.priority) }} />
                        <p className="text-[10.5px] text-white/50 truncate leading-tight">{t.title}</p>
                      </div>
                    ))}
                    {todayTasks.length > 2 && (
                      <p className="text-[9.5px] text-white/30">+{todayTasks.length - 2} de plus</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                    <span className="text-[10.5px] text-white/40">Tout est fait !</span>
                  </div>
                )}
              </motion.div>
            </Link>

            {/* Card Événement */}
            <Link href="/client/planning">
              <motion.div whileTap={{ scale: 0.97 }}
                className="rounded-2xl p-4 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: "rgba(79,70,229,0.08)" }}>
                    <Calendar size={14} style={{ color: "#4f46e5" }} />
                  </div>
                  {!todayLoading && nextEvent && (
                    <span className="text-[11px] font-black tabular-nums text-indigo-600">
                      {new Date(nextEvent.start_at).getDate()}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] font-bold text-white/80 mb-0.5">Agenda</p>
                {todayLoading ? (
                  <div className="space-y-1.5 mt-2">
                    <div className="h-2 rounded animate-pulse" style={{ background: "#f3f4f6", width: "75%" }} />
                    <div className="h-2 rounded animate-pulse" style={{ background: "#f3f4f6", width: "50%" }} />
                  </div>
                ) : nextEvent ? (
                  <div className="mt-1">
                    <p className="text-[10.5px] text-white/80 font-semibold truncate leading-tight">{nextEvent.title}</p>
                    <p className="text-[9.5px] text-white/35 mt-0.5">
                      {fmtEventDate(nextEvent.start_at)} · {fmtEventTime(nextEvent.start_at)}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock size={11} className="text-gray-300 shrink-0" />
                    <span className="text-[10.5px] text-white/35">Aucun événement</span>
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
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all hover:bg-white/6"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(37,99,235,0.08)" }}>
                  <Activity size={15} style={{ color: "#2563eb" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white/80 truncate">
                    Dernière facture — <span className="text-white/40">{lastFac.client_nom || "client"}</span>
                  </p>
                  <p className="text-[10.5px] text-white/35">
                    {lastFac.numero} · {new Date(lastFac.date_emission).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="shrink-0 text-[13px] font-black text-white">{fmtEurInt(lastFac.montant_ttc)}</span>
                <ChevronRight size={13} className="shrink-0 text-gray-300" />
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
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un module…"
            className="w-full rounded-2xl py-3 pl-11 pr-10 text-[13px] text-white placeholder:text-white/30 outline-none transition"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: search ? `1px solid rgba(201,165,90,0.4)` : "1px solid rgba(255,255,255,0.08)",
              boxShadow: search
                ? `0 0 0 3px rgba(201,165,90,0.08), 0 2px 12px rgba(0,0,0,0.2)`
                : "0 2px 10px rgba(0,0,0,0.15)",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
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
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Search size={22} className="text-gray-300" />
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
          <div className="space-y-6">
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
          <p className="text-[10px] text-gray-400">
            DJAMA PRO · {totalModules} modules · Données en temps réel
          </p>
        </div>
      </div>
    </div>
  );
}
