"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronRight,
  TrendingUp, TrendingDown,
  Crown, AlertCircle, CheckCircle2, X,
  Sparkles, Check,
  FileText, CreditCard, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import { MODULE_GROUPS } from "@/lib/module-groups";
import { ModuleCard, ModuleGroupSection } from "@/components/ModuleCard";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#c9a55a";

function lighten(hex: string, t = 0.32): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (n: number) => Math.min(255, Math.round(n + (255 - n) * t)).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

const MODULE_BY_HREF = Object.fromEntries(
  MODULE_GROUPS.flatMap(g => g.modules.map(m => [m.href, m]))
);

interface QuickAction { href: string; iconKey: string; label: string }

const DEFAULT_QA: QuickAction[] = [
  { href: "/client/factures",   iconKey: "/client/factures",   label: "Factures"  },
  { href: "/client/depenses",   iconKey: "/client/depenses",   label: "Dépenses"  },
  { href: "/client/tresorerie", iconKey: "/client/tresorerie", label: "Tréso"     },
  { href: "/client/crm",        iconKey: "/client/crm",        label: "CRM"       },
  { href: "/client/bloc-notes", iconKey: "/client/bloc-notes", label: "Notes"     },
  { href: "/client/chrono",     iconKey: "/client/chrono",     label: "Chrono"    },
];

interface TodayTask   { id: string; title: string; priority: string; due_date: string }
interface NextEvent   { id: string; title: string; start_at: string; event_type: string }
interface LastExpense { id: string; description: string; amount: number; date: string; category: string }
interface LastContact { id: string; nom: string; created_at: string }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}
function getDay() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function fmtEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtEventDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function priorityColor(p: string) {
  if (p === "urgent") return "#ef4444";
  if (p === "high")   return "#f97316";
  if (p === "low")    return "#94a3b8";
  return "#a78bfa";
}

function tok(isDark: boolean) {
  return {
    bg:         isDark ? "#111111"                 : "#ffffff",
    bgSoft:     isDark ? "#181818"                 : "#f8f8f8",
    bgSubtle:   isDark ? "#212121"                 : "#f0f0f0",
    border:     isDark ? "rgba(255,255,255,0.08)"  : "#e5e5e5",
    borderSoft: isDark ? "rgba(255,255,255,0.05)"  : "#ececec",
    text:       isDark ? "rgba(255,255,255,0.92)"  : "#111111",
    text2:      isDark ? "rgba(255,255,255,0.65)"  : "#444444",
    text3:      isDark ? "rgba(255,255,255,0.42)"  : "#707070",
    text4:      isDark ? "rgba(255,255,255,0.35)"  : "#999999",
  };
}

export default function CockpitPage() {
  const { isPremium, isFree } = useSubscription();
  const { isDark, accent } = useTheme();
  const t = tok(isDark);

  const [firstName,     setFirstName]     = useState("");
  const [kpiLoading,    setKpiLoading]    = useState(true);
  const [caMonth,       setCaMonth]       = useState(0);
  const [depensesMonth, setDepensesMonth] = useState(0);
  const [nbContacts,    setNbContacts]    = useState(0);
  const [nbFactures,    setNbFactures]    = useState(0);
  const [caEvo,         setCaEvo]         = useState<number | null>(null);

  const [todayTasks,   setTodayTasks]   = useState<TodayTask[]>([]);
  const [nextEvent,    setNextEvent]    = useState<NextEvent | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [nbTasks,      setNbTasks]      = useState(0);
  const [lastFac,      setLastFac]      = useState<{ numero: string; montant_ttc: number; date_emission: string; client_nom: string } | null>(null);
  const [lastExpense,  setLastExpense]  = useState<LastExpense | null>(null);
  const [lastContact,  setLastContact]  = useState<LastContact | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);

  const [showAlert,   setShowAlert]   = useState(true);
  const [search,      setSearch]      = useState("");
  const [quickActions,setQuickActions]= useState<QuickAction[]>(DEFAULT_QA);
  const [editingQA,   setEditingQA]   = useState(false);
  const [pickerDraft, setPickerDraft] = useState<QuickAction[]>(DEFAULT_QA);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const metaCompany  = ((user.user_metadata?.company_name as string | undefined) || (user.user_metadata?.company as string | undefined) || (user.user_metadata?.organization as string | undefined) || "").trim();
      const metaFullName = ((user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || "").trim();

      const { data: qaPref } = await supabase.from("user_preferences").select("value").eq("user_id", user.id).eq("key", "quick_actions").maybeSingle();
      if (Array.isArray(qaPref?.value) && qaPref.value.length > 0) {
        const loaded = qaPref.value as QuickAction[];
        setQuickActions(loaded);
        setPickerDraft(loaded);
      }

      const { data: uaRow } = await supabase.from("user_access").select("name").eq("email", user.email!).maybeSingle();
      const accessName = ((uaRow as { name?: string } | null)?.name ?? "").trim();
      const emailSlug  = user.email?.split("@")[0] ?? "";
      const emailFmt   = emailSlug.replace(/[._-]/g, " ").split(" ").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      setFirstName(metaCompany || accessName || metaFullName || emailFmt);

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
      const exp    = (expRes.data  ?? []).reduce((s, e) => s + (e.amount    ?? 0), 0);

      setCaMonth(ca);
      setDepensesMonth(exp);
      setNbContacts(crmRes.count ?? 0);
      setNbFactures(pendRes.count ?? 0);
      if (caPrev > 0) setCaEvo(Math.round(((ca - caPrev) / caPrev) * 100));
      setKpiLoading(false);

      const [taskRes, eventRes, overdueRes, allTasksRes, lastFacRes, lastExpRes, lastContactRes] = await Promise.all([
        supabase.from("productivity_tasks").select("id, title, priority, due_date").eq("user_id", user.id).neq("status", "done").lte("due_date", today).order("due_date", { ascending: true }).limit(3),
        supabase.from("planning_events").select("id, title, start_at, event_type").eq("user_id", user.id).gte("start_at", new Date().toISOString()).order("start_at", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "facture").eq("statut", "envoyée").lt("due_date", today),
        supabase.from("productivity_tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "done"),
        supabase.from("factures").select("numero, montant_ttc, date_emission, client_nom").eq("user_id", user.id).order("date_emission", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("expenses").select("id, description, amount, date, category").eq("user_id", user.id).order("date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("clients_crm").select("id, nom, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      setTodayTasks((taskRes.data ?? []) as TodayTask[]);
      setNextEvent(eventRes.data as NextEvent | null);
      setOverdueCount(overdueRes.count ?? 0);
      setNbTasks(allTasksRes.count ?? 0);
      setLastFac(lastFacRes.data as typeof lastFac ?? null);
      setLastExpense(lastExpRes.data as LastExpense | null);
      setLastContact(lastContactRes.data as LastContact | null);
      setTodayLoading(false);
    })();
  }, []);

  async function saveQuickActions(actions: QuickAction[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_preferences").upsert(
      { user_id: user.id, key: "quick_actions", value: actions, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  }

  const allModules = useMemo(() => MODULE_GROUPS.flatMap(g => g.modules.map(m => ({ ...m, group: g.label }))), []);
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return MODULE_GROUPS;
    const q = search.toLowerCase();
    return MODULE_GROUPS
      .map(g => ({ ...g, modules: g.modules.filter(m => m.label.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q)) }))
      .filter(g => g.modules.length > 0);
  }, [search]);

  const totalModules = allModules.length;
  const isNewUser = !kpiLoading && caMonth === 0 && nbContacts === 0;

  const kpis = [
    { label: "CA du mois",   value: kpiLoading ? "—" : fmtEurInt(caMonth),      sub: caEvo !== null ? `${caEvo >= 0 ? "+" : ""}${caEvo}% vs préc.` : "ce mois",    trend: caEvo,  href: "/client/factures",  color: "#22c55e" },
    { label: "Dépenses",     value: kpiLoading ? "—" : fmtEurInt(depensesMonth), sub: "ce mois",                                                                      trend: null,   href: "/client/depenses",  color: "#ef4444" },
    { label: "En attente",   value: kpiLoading ? "—" : String(nbFactures),       sub: nbFactures === 1 ? "facture" : "factures",                                       trend: null,   href: "/client/factures",  color: GOLD      },
    { label: "Contacts CRM", value: kpiLoading ? "—" : String(nbContacts),       sub: "dans la base",                                                                  trend: null,   href: "/client/crm",       color: "#60a5fa" },
  ] as const;

  return (
    <div className="min-h-full" style={{ background: t.bgSoft }}>

      <div className="mx-auto max-w-6xl px-5 pt-5 pb-12 lg:px-8">

        {/* ── En-tête ── */}
        <div className="mb-5">
          <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] capitalize" style={{ color: t.text3 }}>
            {getDay()}
          </p>
          <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight" style={{ color: t.text }}>
            {getGreeting()}
            {firstName && <span style={{ color: GOLD }}>{`, ${firstName.split(" ")[0]}`}</span>}
          </h1>
        </div>

        {/* ── Alerte retards ── */}
        <AnimatePresence>
          {overdueCount > 0 && showAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
                <AlertCircle size={13} className="shrink-0 text-red-500" />
                <p className="flex-1 text-[0.72rem] font-semibold text-red-600">
                  {overdueCount} facture{overdueCount > 1 ? "s" : ""} en retard de paiement
                </p>
                <Link href="/client/factures?statut=retard"
                  className="shrink-0 text-[0.65rem] font-bold text-red-600 underline underline-offset-2">
                  Voir →
                </Link>
                <button onClick={() => setShowAlert(false)} className="shrink-0 text-red-400 hover:text-red-600 transition">
                  <X size={11} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PRO banner ── */}
        {isFree && (
          <Link href="/client/abonnements" className="block mb-4">
            <div className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition hover:opacity-92"
              style={{ background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.20)" }}>
              <Crown size={12} style={{ color: GOLD }} />
              <span className="text-[0.72rem] font-semibold" style={{ color: GOLD }}>Passez à DJAMA PRO</span>
              <span className="text-[0.65rem]" style={{ color: t.text4 }}>· Débloquez tous les modules · 11,90€/mois</span>
              <ChevronRight size={11} className="ml-auto shrink-0" style={{ color: GOLD, opacity: 0.5 }} />
            </div>
          </Link>
        )}

        {/* ── 4 KPI tiles ── */}
        <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href}>
              <div
                className="rounded p-3 transition hover:opacity-90"
                style={{ background: t.bgSoft, border: `1px solid ${t.border}` }}
              >
                <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em]" style={{ color: t.text3 }}>
                  {kpi.label}
                </p>
                <p className="mb-1 text-[1.35rem] font-semibold leading-none tabular-nums" style={{ color: t.text }}>
                  {kpi.value}
                </p>
                <div className="flex items-center gap-1">
                  {kpi.trend !== null && (
                    kpi.trend >= 0
                      ? <TrendingUp size={10} className="text-emerald-500" />
                      : <TrendingDown size={10} className="text-red-400" />
                  )}
                  <p className="text-[0.58rem] font-medium"
                    style={{ color: kpi.trend !== null ? (kpi.trend >= 0 ? "#22c55e" : "#ef4444") : t.text4 }}>
                    {kpi.sub}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Raccourcis ── */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: t.text3 }}>Raccourcis</span>
            <button
              onClick={() => setEditingQA(true)}
              className="text-[0.6rem] font-medium transition hover:opacity-70"
              style={{ color: t.text3 }}
            >
              Modifier
            </button>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${quickActions.length}, 1fr)` }}>
            {quickActions.map((qa) => {
              const mod = MODULE_BY_HREF[qa.href];
              if (!mod) return null;
              const Icon = mod.icon;
              const light = lighten(mod.color, 0.35);
              return (
                <Link key={qa.href} href={qa.href}>
                  <div className="flex flex-col items-center gap-1 transition hover:opacity-80">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 48, height: 48, borderRadius: 13,
                        background: `linear-gradient(145deg, ${light} 0%, ${mod.color} 100%)`,
                        boxShadow: `0 2px 8px ${mod.color}38`,
                      }}
                    >
                      <Icon size={20} color="white" strokeWidth={1.7} />
                    </div>
                    <span className="w-full truncate text-center text-[0.58rem] font-semibold" style={{ color: t.text3 }}>
                      {qa.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── 2 colonnes : Activité récente + Aujourd'hui ── */}
        <div className="mb-5 grid gap-4 lg:grid-cols-12">

          {/* Colonne gauche — Activité récente */}
          <div className="lg:col-span-7">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: t.text3 }}>Activité récente</span>
              <Link href="/client/factures"
                className="text-[0.6rem] font-medium transition hover:opacity-70"
                style={{ color: t.text3 }}>
                Voir tout →
              </Link>
            </div>

            <div className="overflow-hidden rounded-lg" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
              {todayLoading ? (
                <div className="space-y-3 p-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md animate-pulse" style={{ background: t.bgSubtle }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 rounded animate-pulse" style={{ background: t.bgSubtle, width: "55%" }} />
                        <div className="h-1.5 rounded animate-pulse" style={{ background: t.bgSubtle, width: "35%" }} />
                      </div>
                      <div className="h-2 w-12 rounded animate-pulse" style={{ background: t.bgSubtle }} />
                    </div>
                  ))}
                </div>
              ) : (lastFac || lastExpense || lastContact) ? (
                <div>
                  {lastFac && (
                    <Link href="/client/factures">
                      <div
                        className="flex items-center gap-3 px-4 py-3 transition"
                        style={{
                          borderBottom: (lastExpense || lastContact) ? `1px solid ${t.borderSoft}` : "none",
                        }}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                          style={{ background: "rgba(34,197,94,0.08)" }}>
                          <FileText size={12} style={{ color: "#22c55e" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.75rem] font-semibold" style={{ color: t.text }}>
                            {lastFac.client_nom || "—"}
                            <span className="ml-1.5 font-normal" style={{ color: t.text4, fontSize: "0.65rem" }}>{lastFac.numero}</span>
                          </p>
                          <p className="text-[0.6rem]" style={{ color: t.text4 }}>
                            Facture · {new Date(lastFac.date_emission).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className="shrink-0 text-[0.78rem] font-bold tabular-nums" style={{ color: t.text }}>
                          {fmtEurInt(lastFac.montant_ttc)}
                        </span>
                      </div>
                    </Link>
                  )}
                  {lastExpense && (
                    <Link href="/client/depenses">
                      <div
                        className="flex items-center gap-3 px-4 py-3 transition"
                        style={{ borderBottom: lastContact ? `1px solid ${t.borderSoft}` : "none" }}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                          style={{ background: "rgba(239,68,68,0.08)" }}>
                          <CreditCard size={12} style={{ color: "#ef4444" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.75rem] font-semibold" style={{ color: t.text }}>
                            {lastExpense.description || lastExpense.category || "Dépense"}
                          </p>
                          <p className="text-[0.6rem]" style={{ color: t.text4 }}>
                            Dépense · {new Date(lastExpense.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className="shrink-0 text-[0.78rem] font-bold tabular-nums text-red-400">
                          −{fmtEurInt(lastExpense.amount)}
                        </span>
                      </div>
                    </Link>
                  )}
                  {lastContact && (
                    <Link href="/client/crm">
                      <div className="flex items-center gap-3 px-4 py-3 transition">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                          style={{ background: "rgba(96,165,250,0.08)" }}>
                          <Users size={12} style={{ color: "#60a5fa" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.75rem] font-semibold" style={{ color: t.text }}>{lastContact.nom}</p>
                          <p className="text-[0.6rem]" style={{ color: t.text4 }}>
                            Contact · {new Date(lastContact.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <ChevronRight size={12} style={{ color: t.text4 }} />
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="mb-3 text-[0.72rem] font-medium" style={{ color: t.text3 }}>Aucune activité récente</p>
                  <Link href="/client/factures"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.68rem] font-semibold transition hover:opacity-85"
                    style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}28`, color: GOLD }}>
                    + Créer une facture
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite — Aujourd'hui */}
          <div className="space-y-3 lg:col-span-5">

            {/* Tâches du jour */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: t.text3 }}>Tâches du jour</span>
                <Link href="/client/productivite"
                  className="text-[0.6rem] font-medium transition hover:opacity-70"
                  style={{ color: t.text3 }}>
                  Voir tout {nbTasks > 0 && `(${nbTasks})`} →
                </Link>
              </div>
              <div className="overflow-hidden rounded-lg" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                {todayLoading ? (
                  <div className="space-y-2 p-3">
                    {[0, 1].map(i => (
                      <div key={i} className="h-8 rounded-md animate-pulse" style={{ background: t.bgSubtle }} />
                    ))}
                  </div>
                ) : todayTasks.length > 0 ? (
                  <div>
                    {todayTasks.map((task, i) => (
                      <Link key={task.id} href="/client/productivite">
                        <div
                          className="flex items-center gap-3 px-3.5 py-2.5 transition"
                          style={{ borderBottom: i < todayTasks.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}
                        >
                          <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: priorityColor(task.priority) }} />
                          <span className="flex-1 truncate text-[0.72rem] font-medium" style={{ color: t.text2 }}>
                            {task.title}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-3">
                    <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
                    <span className="text-[0.72rem] font-medium text-emerald-600">Aucune tâche en retard</span>
                  </div>
                )}
              </div>
            </div>

            {/* Prochain événement */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: t.text3 }}>Prochain événement</span>
                <Link href="/client/planning"
                  className="text-[0.6rem] font-medium transition hover:opacity-70"
                  style={{ color: t.text3 }}>
                  Agenda →
                </Link>
              </div>
              <div className="rounded-lg" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                {todayLoading ? (
                  <div className="p-3">
                    <div className="h-8 rounded-md animate-pulse" style={{ background: t.bgSubtle }} />
                  </div>
                ) : nextEvent ? (
                  <Link href="/client/planning">
                    <div className="flex items-center gap-3 px-3.5 py-3 transition">
                      <div className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-md"
                        style={{ background: "rgba(79,70,229,0.10)" }}>
                        <span className="text-[0.42rem] font-bold uppercase leading-none" style={{ color: "#818cf8" }}>
                          {new Date(nextEvent.start_at).toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                        <span className="text-[0.85rem] font-semibold leading-none tabular-nums" style={{ color: "#818cf8" }}>
                          {new Date(nextEvent.start_at).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.72rem] font-semibold" style={{ color: t.text }}>{nextEvent.title}</p>
                        <p className="text-[0.6rem]" style={{ color: t.text4 }}>
                          {fmtEventDate(nextEvent.start_at)} · {fmtEventTime(nextEvent.start_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between px-3.5 py-3">
                    <span className="text-[0.72rem]" style={{ color: t.text3 }}>Journée libre</span>
                    <Link href="/client/planning"
                      className="text-[0.65rem] font-semibold transition hover:opacity-80"
                      style={{ color: accent }}>
                      + Planifier
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Checklist démarrage ── */}
        <AnimatePresence>
          {!kpiLoading && !todayLoading && isNewUser && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-5 overflow-hidden rounded-lg"
              style={{ background: t.bg, border: "1px solid rgba(201,165,90,0.20)" }}
            >
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
                <Sparkles size={11} style={{ color: GOLD }} />
                <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>Démarrage rapide</span>
                <div className="ml-2 flex-1">
                  <div className="h-1 overflow-hidden rounded-full" style={{ background: t.bgSubtle }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${([true, false, nbContacts > 0, nbFactures > 0].filter(Boolean).length / 4) * 100}%`,
                        background: GOLD,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
                <span className="text-[0.58rem] font-bold" style={{ color: GOLD }}>
                  {[true, false, nbContacts > 0, nbFactures > 0].filter(Boolean).length}/4
                </span>
              </div>
              {([
                { done: true,           label: "Créer votre compte DJAMA",    href: null,               sub: "C'est fait !" },
                { done: false,          label: "Personnaliser votre profil",   href: "/client/profil",   sub: "Logo, SIRET, RIB" },
                { done: nbContacts > 0, label: "Ajouter votre premier client", href: "/client/crm",      sub: "Base clients CRM" },
                { done: nbFactures > 0, label: "Envoyer votre 1ère facture",   href: "/client/factures", sub: "Commencez à facturer" },
              ] as { done: boolean; label: string; href: string | null; sub: string }[]).map((step, i) => (
                <Link key={i} href={step.done || !step.href ? "#" : step.href}
                  onClick={e => { if (step.done || !step.href) e.preventDefault(); }}>
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 transition"
                    style={{ borderTop: i > 0 ? `1px solid ${t.borderSoft}` : "none" }}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ background: step.done ? "rgba(34,197,94,0.12)" : "rgba(201,165,90,0.10)" }}>
                      {step.done
                        ? <CheckCircle2 size={11} className="text-emerald-500" />
                        : <span className="text-[0.5rem] font-bold" style={{ color: GOLD }}>{i + 1}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[0.72rem] font-semibold leading-tight"
                        style={{ color: step.done ? t.text4 : t.text, textDecoration: step.done ? "line-through" : "none" }}
                      >
                        {step.label}
                      </p>
                      <p className="text-[0.6rem]" style={{ color: t.text4 }}>{step.sub}</p>
                    </div>
                    {!step.done && step.href && <ChevronRight size={11} style={{ color: t.text4 }} />}
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Séparateur Modules ── */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: t.border }} />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em]" style={{ color: t.text3 }}>Modules</span>
          <div className="h-px flex-1" style={{ background: t.border }} />
        </div>

        {/* ── Recherche modules ── */}
        <div className="relative mb-4">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.text4 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un module…"
            className="w-full rounded-lg py-2 pl-8 pr-8 text-[0.78rem] outline-none transition"
            style={{
              background: t.bg,
              border: search ? `1px solid ${GOLD}50` : `1px solid ${t.border}`,
              color: t.text,
            }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70"
              style={{ color: t.text4 }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* ── Résultats recherche ── */}
        {search.trim() && (
          <div className="mb-4">
            {filteredGroups.length === 0 ? (
              <div className="rounded-lg py-8 text-center" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                <Search size={18} style={{ color: t.text4, margin: "0 auto 8px" }} />
                <p className="text-[0.72rem]" style={{ color: t.text3 }}>Aucun module pour &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredGroups.flatMap(g => g.modules).map((mod, mi) => (
                  <ModuleCard key={mod.href + mi} mod={mod} index={mi} isPremium={isPremium} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Module groups ── */}
        {!search.trim() && (
          <div>
            {MODULE_GROUPS.map((group, gi) => (
              <ModuleGroupSection key={group.label} group={group} groupIndex={gi} isPremium={isPremium} isFree={isFree} />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {isFree && (
            <Link
              href="/client/abonnements"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[0.72rem] font-bold transition hover:opacity-90"
              style={{ background: GOLD, color: "#0a0a0a" }}
            >
              <Crown size={11} /> Passer à DJAMA PRO — 11,90€/mois
            </Link>
          )}
          <p className="text-[0.58rem]" style={{ color: t.text4 }}>
            DJAMA · {totalModules} modules · Données en temps réel
          </p>
        </div>
      </div>

      {/* ══ MODAL PICKER RACCOURCIS ══ */}
      <AnimatePresence>
        {editingQA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingQA(false); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="w-full rounded-t-2xl p-5 pb-8 sm:max-w-lg sm:rounded-2xl"
              style={{ background: isDark ? "#181818" : "#ffffff", border: `1px solid ${t.border}` }}
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-[1rem] font-bold" style={{ color: t.text }}>Mes raccourcis</h3>
                <button onClick={() => setEditingQA(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition hover:opacity-70"
                  style={{ background: t.bgSubtle }}>
                  <X size={13} style={{ color: t.text3 }} />
                </button>
              </div>
              <p className="mb-4 text-[0.65rem]" style={{ color: t.text3 }}>
                Choisissez jusqu&apos;à <strong>6 modules</strong> à afficher en accès rapide
              </p>

              <div className="grid max-h-[52vh] grid-cols-4 gap-2 overflow-y-auto pr-1">
                {MODULE_GROUPS.flatMap(g => g.modules).map((mod) => {
                  const selected = pickerDraft.some(a => a.href === mod.href);
                  const atMax    = pickerDraft.length >= 6;
                  const Icon     = mod.icon;
                  const light    = lighten(mod.color, 0.35);
                  return (
                    <motion.button
                      key={mod.href}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => {
                        if (selected) setPickerDraft(d => d.filter(a => a.href !== mod.href));
                        else if (!atMax) setPickerDraft(d => [...d, { href: mod.href, iconKey: mod.href, label: mod.label }]);
                      }}
                      className="relative flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 transition"
                      style={{
                        opacity: !selected && atMax ? 0.28 : 1,
                        background: selected ? t.bgSubtle : "transparent",
                        cursor: !selected && atMax ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="relative">
                        <div
                          className="relative flex items-center justify-center overflow-hidden"
                          style={{
                            width: 48, height: 48, borderRadius: 13,
                            background: `linear-gradient(145deg, ${light} 0%, ${mod.color} 100%)`,
                            boxShadow: selected ? `0 0 0 2px #22c55e` : "0 2px 8px rgba(0,0,0,0.20)",
                          }}
                        >
                          <Icon size={20} color="white" strokeWidth={1.8} />
                        </div>
                        {selected && (
                          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full"
                            style={{ background: "#22c55e", border: `1.5px solid ${isDark ? "#181818" : "#ffffff"}` }}>
                            <Check size={8} color="white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="line-clamp-2 px-0.5 text-center text-[0.58rem] font-semibold leading-tight"
                        style={{ color: selected ? t.text : t.text3 }}>
                        {mod.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full transition-all"
                      style={{ background: i < pickerDraft.length ? "#22c55e" : t.bgSubtle }} />
                  ))}
                </div>
                <span className="text-[0.6rem] font-bold" style={{ color: t.text4 }}>{pickerDraft.length}/6</span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setPickerDraft(DEFAULT_QA)}
                  className="flex-1 rounded-xl py-2.5 text-[0.72rem] font-semibold transition hover:opacity-80"
                  style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.text3 }}
                >
                  Réinitialiser
                </button>
                <button
                  onClick={async () => { setQuickActions(pickerDraft); setEditingQA(false); await saveQuickActions(pickerDraft); }}
                  disabled={pickerDraft.length === 0}
                  className="flex-[2] rounded-xl py-2.5 text-[0.78rem] font-bold text-white transition"
                  style={{ background: pickerDraft.length === 0 ? "rgba(34,197,94,0.18)" : "#22c55e" }}
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
