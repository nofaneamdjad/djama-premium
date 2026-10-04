"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Crown, AlertCircle, X,
  Sparkles, Check, FileText, CreditCard, Users,
  TrendingUp, TrendingDown, AlertTriangle, Clock,
  CheckCircle2, Calendar, ArrowRight, Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import { APP_REGISTRY } from "@/lib/app-registry";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#c9a55a";

const APP_BY_ROUTE = Object.fromEntries(APP_REGISTRY.map(a => [a.route, a]));

interface QuickAction { href: string; label: string }

const DEFAULT_QA: QuickAction[] = [
  { href: "/client/factures",   label: "Factures"     },
  { href: "/client/depenses",   label: "Dépenses"     },
  { href: "/client/tresorerie", label: "Trésorerie"   },
  { href: "/client/crm",        label: "CRM"          },
  { href: "/client/bloc-notes", label: "Notes"        },
  { href: "/client/chrono",     label: "Chronomètre"  },
];

const AI_CHIPS = [
  "Rédige une offre commerciale",
  "Génère un rapport mensuel",
  "Analyse mes dépenses",
  "Crée une présentation",
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
  const diff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
     new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000
  );
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
    bg:         isDark ? "#111111"                : "#ffffff",
    bgSoft:     isDark ? "#181818"                : "#f8f8f8",
    bgSubtle:   isDark ? "#212121"                : "#f0f0f0",
    glass:      isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
    border:     isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5",
    borderSoft: isDark ? "rgba(255,255,255,0.05)" : "#ececec",
    text:       isDark ? "rgba(255,255,255,0.92)" : "#111111",
    text2:      isDark ? "rgba(255,255,255,0.65)" : "#444444",
    text3:      isDark ? "rgba(255,255,255,0.42)" : "#707070",
    text4:      isDark ? "rgba(255,255,255,0.28)" : "#999999",
  };
}

function Skeleton({ w, h }: { w?: string; h?: number }) {
  const { isDark } = useTheme();
  return (
    <div
      className="rounded animate-pulse"
      style={{ width: w ?? "100%", height: h ?? 12, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
    />
  );
}

export default function CockpitPage() {
  const { isPremium, isFree } = useSubscription();
  const { isDark } = useTheme();
  const t = tok(isDark);
  const router = useRouter();

  const [firstName,       setFirstName]       = useState("");
  const [kpiLoading,      setKpiLoading]      = useState(true);
  const [caMonth,         setCaMonth]         = useState(0);
  const [depensesMonth,   setDepensesMonth]   = useState(0);
  const [nbContacts,      setNbContacts]      = useState(0);
  const [nbFacturesPend,  setNbFacturesPend]  = useState(0);
  const [caEvo,           setCaEvo]           = useState<number | null>(null);
  const [overdueInv,      setOverdueInv]      = useState(0);

  const [todayLoading,    setTodayLoading]    = useState(true);
  const [todayTasks,      setTodayTasks]      = useState<TodayTask[]>([]);
  const [nextEvent,       setNextEvent]       = useState<NextEvent | null>(null);
  const [overdueTaskCount,setOverdueTaskCount]= useState(0);
  const [nbTasks,         setNbTasks]         = useState(0);
  const [lastFac,         setLastFac]         = useState<{ numero: string; montant_ttc: number; date_emission: string; client_nom: string } | null>(null);
  const [lastExpense,     setLastExpense]     = useState<LastExpense | null>(null);
  const [lastContact,     setLastContact]     = useState<LastContact | null>(null);

  const [quickActions,    setQuickActions]    = useState<QuickAction[]>(DEFAULT_QA);
  const [editingQA,       setEditingQA]       = useState(false);
  const [pickerDraft,     setPickerDraft]     = useState<QuickAction[]>(DEFAULT_QA);
  const [aiQuery,         setAiQuery]         = useState("");
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const metaCompany  = ((user.user_metadata?.company_name as string | undefined) || (user.user_metadata?.company as string | undefined) || "").trim();
      const metaFullName = ((user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || "").trim();

      const [qaPrefRes, uaRow] = await Promise.all([
        supabase.from("user_preferences").select("value").eq("user_id", user.id).eq("key", "quick_actions").maybeSingle(),
        supabase.from("user_access").select("name").eq("email", user.email!).maybeSingle(),
      ]);

      if (Array.isArray(qaPrefRes.data?.value) && (qaPrefRes.data?.value as QuickAction[]).length > 0) {
        const loaded = qaPrefRes.data!.value as QuickAction[];
        setQuickActions(loaded);
        setPickerDraft(loaded);
      }

      const accessName = ((uaRow.data as { name?: string } | null)?.name ?? "").trim();
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

      const [facRes, prevRes, crmRes, pendRes, expRes, overdueInvRes] = await Promise.all([
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", start).lte("date_emission", end),
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", pS).lte("date_emission", pE),
        supabase.from("clients_crm").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("factures").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("statut", ["envoyée", "en_attente"]),
        supabase.from("expenses").select("amount").eq("user_id", user.id).gte("date", start).lte("date", end),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "facture").eq("statut", "envoyée").lt("due_date", today),
      ]);

      const ca     = (facRes.data  ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const caPrev = (prevRes.data ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const exp    = (expRes.data  ?? []).reduce((s, e) => s + (e.amount    ?? 0), 0);

      setCaMonth(ca);
      setDepensesMonth(exp);
      setNbContacts(crmRes.count ?? 0);
      setNbFacturesPend(pendRes.count ?? 0);
      setOverdueInv(overdueInvRes.count ?? 0);
      if (caPrev > 0) setCaEvo(Math.round(((ca - caPrev) / caPrev) * 100));
      setKpiLoading(false);

      const [taskRes, eventRes, overdueTaskRes, allTasksRes, lastFacRes, lastExpRes, lastContactRes] = await Promise.all([
        supabase.from("productivity_tasks").select("id, title, priority, due_date").eq("user_id", user.id).neq("status", "done").lte("due_date", today).order("due_date", { ascending: true }).limit(5),
        supabase.from("planning_events").select("id, title, start_at, event_type").eq("user_id", user.id).gte("start_at", now.toISOString()).order("start_at", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("productivity_tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "done").lte("due_date", today),
        supabase.from("productivity_tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "done"),
        supabase.from("factures").select("numero, montant_ttc, date_emission, client_nom").eq("user_id", user.id).order("date_emission", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("expenses").select("id, description, amount, date, category").eq("user_id", user.id).order("date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("clients_crm").select("id, nom, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      setTodayTasks((taskRes.data ?? []) as TodayTask[]);
      setNextEvent(eventRes.data as NextEvent | null);
      setOverdueTaskCount(overdueTaskRes.count ?? 0);
      setNbTasks(allTasksRes.count ?? 0);
      setLastFac(lastFacRes.data as typeof lastFac ?? null);
      setLastExpense(lastExpRes.data as LastExpense | null);
      setLastContact(lastContactRes.data as LastContact | null);
      setTodayLoading(false);
    })();
  }, []);

  const saveQuickActions = useCallback(async (actions: QuickAction[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_preferences").upsert(
      { user_id: user.id, key: "quick_actions", value: actions, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  }, []);

  const isNewUser = !kpiLoading && caMonth === 0 && nbContacts === 0;

  const alerts = [
    overdueInv > 0 && !dismissedAlerts.includes("overdue_inv") && {
      id: "overdue_inv",
      icon: AlertCircle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.06)",
      border: "rgba(239,68,68,0.18)",
      text: `${overdueInv} facture${overdueInv > 1 ? "s" : ""} en retard de paiement`,
      href: "/client/factures?statut=retard",
    },
    overdueTaskCount > 0 && !dismissedAlerts.includes("overdue_tasks") && {
      id: "overdue_tasks",
      icon: AlertTriangle,
      color: "#f97316",
      bg: "rgba(249,115,22,0.06)",
      border: "rgba(249,115,22,0.18)",
      text: `${overdueTaskCount} tâche${overdueTaskCount > 1 ? "s" : ""} en retard`,
      href: "/client/productivite",
    },
  ].filter(Boolean) as { id: string; icon: typeof AlertCircle; color: string; bg: string; border: string; text: string; href: string }[];

  const kpis = [
    { label: "CA du mois", value: kpiLoading ? null : fmtEurInt(caMonth), sub: caEvo !== null ? `${caEvo >= 0 ? "+" : ""}${caEvo}% vs préc.` : "ce mois", trend: caEvo, href: "/client/factures", empty: !kpiLoading && caMonth === 0 },
    { label: "Dépenses",   value: kpiLoading ? null : fmtEurInt(depensesMonth), sub: "ce mois", trend: null, href: "/client/depenses", empty: !kpiLoading && depensesMonth === 0 },
    { label: "En attente", value: kpiLoading ? null : String(nbFacturesPend), sub: nbFacturesPend === 1 ? "facture" : "factures", trend: null, href: "/client/factures", empty: !kpiLoading && nbFacturesPend === 0 },
    { label: "Contacts",   value: kpiLoading ? null : String(nbContacts), sub: "dans la base", trend: null, href: "/client/crm", empty: !kpiLoading && nbContacts === 0 },
  ];

  const hasSomeData = !kpiLoading && (caMonth > 0 || nbContacts > 0 || nbFacturesPend > 0);
  const hasResumeItems = !todayLoading && (lastFac || lastExpense || lastContact);

  function sendAiQuery(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/client/assistant?q=${encodeURIComponent(trimmed)}`);
  }

  /* ── Picker candidates (all APP_REGISTRY except accueil) ── */
  const pickerApps = APP_REGISTRY.filter(a => a.route !== "/client");

  return (
    <div className="min-h-full" style={{ background: t.bgSoft }}>
      <div className="mx-auto max-w-6xl px-5 pt-6 pb-16 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-6">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] capitalize" style={{ color: t.text3 }}>
            {getDay()}
          </p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight" style={{ color: t.text }}>
            {getGreeting()}
            {firstName && <span style={{ color: GOLD }}>{`, ${firstName.split(" ")[0]}`}</span>}
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: t.text3 }}>
            Voici ce qui mérite votre attention aujourd&apos;hui
          </p>
        </div>

        {/* ── DJAMA AI bar ── */}
        <div className="mb-5">
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: t.glass, border: `1px solid ${t.border}` }}
          >
            <Sparkles size={15} style={{ color: GOLD, flexShrink: 0 }} />
            <input
              type="text"
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendAiQuery(aiQuery); }}
              placeholder="Demander à DJAMA…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
              style={{ color: t.text }}
            />
            {aiQuery && (
              <button
                onClick={() => sendAiQuery(aiQuery)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:opacity-80"
                style={{ background: GOLD }}
              >
                <Send size={12} color="#0a0a0a" />
              </button>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {AI_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendAiQuery(chip)}
                className="rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80"
                style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text3 }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* ── PRO banner ── */}
        {isFree && (
          <Link href="/client/abonnements" className="block mb-4">
            <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition hover:opacity-90"
              style={{ background: "rgba(201,165,90,0.05)", border: "1px solid rgba(201,165,90,0.18)" }}>
              <Crown size={13} style={{ color: GOLD }} />
              <span className="text-[0.8rem] font-semibold" style={{ color: GOLD }}>Passez à DJAMA PRO</span>
              <span className="text-xs" style={{ color: t.text4 }}>· Débloquez tous les modules · 11,90€/mois</span>
              <ChevronRight size={12} className="ml-auto shrink-0" style={{ color: GOLD, opacity: 0.5 }} />
            </div>
          </Link>
        )}

        {/* ── À votre attention ── */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 space-y-2"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: t.text3 }}>
                À votre attention
              </p>
              {alerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                      style={{ background: alert.bg, border: `1px solid ${alert.border}` }}>
                      <Icon size={13} className="shrink-0" style={{ color: alert.color }} />
                      <p className="flex-1 text-sm font-semibold" style={{ color: alert.color }}>
                        {alert.text}
                      </p>
                      <Link href={alert.href}
                        className="shrink-0 text-xs font-bold underline underline-offset-2"
                        style={{ color: alert.color }}>
                        Voir →
                      </Link>
                      <button
                        onClick={() => setDismissedAlerts(d => [...d, alert.id])}
                        className="shrink-0 transition hover:opacity-70"
                        style={{ color: alert.color }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main 2-column layout (desktop) ── */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">

          {/* Left column */}
          <div className="lg:col-span-7 space-y-5">

            {/* ── Aujourd'hui ── */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: t.text3 }}>Aujourd&apos;hui</span>
                <Link href="/client/planning" className="text-xs font-medium transition hover:opacity-70" style={{ color: t.text3 }}>
                  Agenda →
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Tâches */}
                <div className="overflow-hidden rounded-xl" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center justify-between px-3.5 pt-3 pb-2"
                    style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.text2 }}>
                      <Clock size={12} style={{ color: t.text3 }} /> Tâches
                    </span>
                    <Link href="/client/productivite"
                      className="text-xs font-medium" style={{ color: t.text4 }}>
                      {nbTasks > 0 ? `${nbTasks} au total` : ""}
                    </Link>
                  </div>
                  {todayLoading ? (
                    <div className="space-y-2 p-3">
                      <Skeleton h={10} w="70%" />
                      <Skeleton h={10} w="50%" />
                    </div>
                  ) : todayTasks.length > 0 ? (
                    <div className="p-1">
                      {todayTasks.slice(0, 4).map((task) => (
                        <Link key={task.id} href="/client/productivite">
                          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-white/5">
                            <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: priorityColor(task.priority) }} />
                            <span className="flex-1 truncate text-sm" style={{ color: t.text2 }}>{task.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3.5 py-3">
                      <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
                      <span className="text-sm text-emerald-600">Aucun retard</span>
                    </div>
                  )}
                </div>

                {/* Prochain événement */}
                <div className="overflow-hidden rounded-xl" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center justify-between px-3.5 pt-3 pb-2"
                    style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.text2 }}>
                      <Calendar size={12} style={{ color: t.text3 }} /> Événements
                    </span>
                  </div>
                  {todayLoading ? (
                    <div className="space-y-2 p-3">
                      <Skeleton h={10} w="60%" />
                      <Skeleton h={10} w="40%" />
                    </div>
                  ) : nextEvent ? (
                    <Link href="/client/planning">
                      <div className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-white/5">
                        <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg"
                          style={{ background: "rgba(79,70,229,0.10)" }}>
                          <span className="text-[0.42rem] font-bold uppercase leading-none" style={{ color: "#818cf8" }}>
                            {new Date(nextEvent.start_at).toLocaleDateString("fr-FR", { month: "short" })}
                          </span>
                          <span className="text-[0.9rem] font-semibold leading-tight tabular-nums" style={{ color: "#818cf8" }}>
                            {new Date(nextEvent.start_at).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" style={{ color: t.text }}>{nextEvent.title}</p>
                          <p className="text-xs" style={{ color: t.text4 }}>
                            {fmtEventDate(nextEvent.start_at)} · {fmtEventTime(nextEvent.start_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-3.5">
                      <span className="text-sm" style={{ color: t.text3 }}>Journée libre</span>
                      <Link href="/client/planning"
                        className="text-xs font-semibold transition hover:opacity-80"
                        style={{ color: GOLD }}>
                        + Planifier
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Reprendre ── */}
            {hasResumeItems && (
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: t.text3 }}>Reprendre</span>
                  <span className="text-xs" style={{ color: t.text4 }}>Activité récente</span>
                </div>
                <div className="overflow-hidden rounded-xl" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                  {lastFac && (
                    <Link href="/client/factures">
                      <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                        style={{ borderBottom: (lastExpense || lastContact) ? `1px solid ${t.borderSoft}` : "none" }}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "rgba(34,197,94,0.08)" }}>
                          <FileText size={13} style={{ color: "#22c55e" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" style={{ color: t.text }}>
                            {lastFac.client_nom || "—"}
                            <span className="ml-2 font-normal text-xs" style={{ color: t.text4 }}>{lastFac.numero}</span>
                          </p>
                          <p className="text-xs" style={{ color: t.text4 }}>
                            Facture · {new Date(lastFac.date_emission).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className="shrink-0 text-[0.875rem] font-bold tabular-nums" style={{ color: t.text }}>{fmtEurInt(lastFac.montant_ttc)}</span>
                      </div>
                    </Link>
                  )}
                  {lastExpense && (
                    <Link href="/client/depenses">
                      <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                        style={{ borderBottom: lastContact ? `1px solid ${t.borderSoft}` : "none" }}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "rgba(239,68,68,0.08)" }}>
                          <CreditCard size={13} style={{ color: "#ef4444" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" style={{ color: t.text }}>
                            {lastExpense.description || lastExpense.category || "Dépense"}
                          </p>
                          <p className="text-xs" style={{ color: t.text4 }}>
                            Dépense · {new Date(lastExpense.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className="shrink-0 text-[0.875rem] font-bold tabular-nums text-red-400">−{fmtEurInt(lastExpense.amount)}</span>
                      </div>
                    </Link>
                  )}
                  {lastContact && (
                    <Link href="/client/crm">
                      <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "rgba(96,165,250,0.08)" }}>
                          <Users size={13} style={{ color: "#60a5fa" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" style={{ color: t.text }}>{lastContact.nom}</p>
                          <p className="text-xs" style={{ color: t.text4 }}>
                            Contact · {new Date(lastContact.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <ChevronRight size={13} style={{ color: t.text4 }} />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Empty state — new user */}
            {isNewUser && !todayLoading && (
              <div className="overflow-hidden rounded-xl"
                style={{ background: t.glass, border: "1px solid rgba(201,165,90,0.20)" }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
                  <Sparkles size={12} style={{ color: GOLD }} />
                  <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>Démarrage rapide</span>
                  <div className="ml-2 flex-1 h-1 overflow-hidden rounded-full" style={{ background: t.bgSubtle }}>
                    <div className="h-full rounded-full" style={{ width: `${([true, false, nbContacts > 0, nbFacturesPend > 0].filter(Boolean).length / 4) * 100}%`, background: GOLD, transition: "width 0.6s ease" }} />
                  </div>
                  <span className="text-[0.58rem] font-bold" style={{ color: GOLD }}>
                    {[true, false, nbContacts > 0, nbFacturesPend > 0].filter(Boolean).length}/4
                  </span>
                </div>
                {([
                  { done: true,              label: "Créer votre compte DJAMA",    href: null,               sub: "C'est fait !" },
                  { done: false,             label: "Personnaliser votre profil",   href: "/client/profil",   sub: "Logo, SIRET, RIB" },
                  { done: nbContacts > 0,    label: "Ajouter votre premier client", href: "/client/crm",      sub: "Base clients CRM" },
                  { done: nbFacturesPend > 0,label: "Envoyer votre 1ère facture",   href: "/client/factures", sub: "Commencez à facturer" },
                ] as { done: boolean; label: string; href: string | null; sub: string }[]).map((step, i) => (
                  <Link key={i} href={step.done || !step.href ? "#" : step.href}
                    onClick={e => { if (step.done || !step.href) e.preventDefault(); }}>
                    <div className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/5"
                      style={{ borderTop: i > 0 ? `1px solid ${t.borderSoft}` : "none" }}>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: step.done ? "rgba(34,197,94,0.12)" : "rgba(201,165,90,0.10)" }}>
                        {step.done
                          ? <CheckCircle2 size={11} className="text-emerald-500" />
                          : <span className="text-[0.5rem] font-bold" style={{ color: GOLD }}>{i + 1}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight"
                          style={{ color: step.done ? t.text4 : t.text, textDecoration: step.done ? "line-through" : "none" }}>
                          {step.label}
                        </p>
                        <p className="text-[0.6rem]" style={{ color: t.text4 }}>{step.sub}</p>
                      </div>
                      {!step.done && step.href && <ChevronRight size={11} style={{ color: t.text4 }} />}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="mt-5 lg:col-span-5 lg:mt-0 space-y-5">

            {/* ── Aperçu entreprise ── */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: t.text3 }}>Aperçu</span>
                <Link href="/client/dashboard" className="text-xs font-medium transition hover:opacity-70" style={{ color: t.text3 }}>
                  Dashboard →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {kpis.map((kpi) => (
                  <Link key={kpi.label} href={kpi.href}>
                    <div className="rounded-xl p-3 transition hover:opacity-90"
                      style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: t.text3 }}>
                        {kpi.label}
                      </p>
                      {kpi.value === null ? (
                        <Skeleton h={22} w="65%" />
                      ) : kpi.empty ? (
                        <p className="text-xl font-semibold leading-none" style={{ color: t.text4 }}>—</p>
                      ) : (
                        <p className="text-xl font-semibold leading-none tabular-nums" style={{ color: t.text }}>{kpi.value}</p>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        {kpi.trend !== null && !kpi.empty && (
                          kpi.trend >= 0
                            ? <TrendingUp size={10} className="text-emerald-500" />
                            : <TrendingDown size={10} className="text-red-400" />
                        )}
                        <p className="text-xs font-medium"
                          style={{ color: kpi.empty ? t.text4 : (kpi.trend !== null ? (kpi.trend >= 0 ? "#22c55e" : "#ef4444") : t.text4) }}>
                          {kpi.empty ? "Aucune donnée" : kpi.sub}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {!hasSomeData && !kpiLoading && (
                <div className="mt-2 rounded-xl px-3.5 py-2.5 text-center"
                  style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                  <p className="text-xs" style={{ color: t.text4 }}>
                    Les données apparaîtront dès votre première facture ou dépense
                  </p>
                </div>
              )}
            </div>

            {/* ── Raccourcis ── */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: t.text3 }}>Raccourcis</span>
                <button
                  onClick={() => { setPickerDraft(quickActions); setEditingQA(true); }}
                  className="text-xs font-medium transition hover:opacity-70"
                  style={{ color: t.text3 }}
                >
                  Modifier
                </button>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(quickActions.length, 6)}, 1fr)` }}>
                {quickActions.map((qa) => {
                  const app = APP_BY_ROUTE[qa.href];
                  if (!app) return null;
                  const Icon = app.icon;
                  return (
                    <Link key={qa.href} href={qa.href}>
                      <div className="group flex flex-col items-center gap-1 transition hover:opacity-80">
                        <div
                          className="flex items-center justify-center rounded-[13px] transition group-hover:border-[--gold]"
                          style={{
                            width: 48, height: 48,
                            background: t.glass,
                            border: `1px solid ${t.border}`,
                          }}
                        >
                          <Icon size={20} style={{ color: t.text3 }} strokeWidth={1.6} />
                        </div>
                        <span className="w-full truncate text-center text-[0.7rem] font-semibold" style={{ color: t.text3 }}>
                          {qa.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── Accès rapide modules ── */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: t.text3 }}>Applications</span>
                <Link href="/client/apps" className="flex items-center gap-1 text-xs font-medium transition hover:opacity-70" style={{ color: t.text3 }}>
                  Tout voir <ArrowRight size={10} />
                </Link>
              </div>
              <div className="overflow-hidden rounded-xl" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                {[
                  { href: "/client/factures",   icon: FileText, label: "Factures",    sub: nbFacturesPend > 0 ? `${nbFacturesPend} en attente` : "Facturation" },
                  { href: "/client/depenses",   icon: CreditCard, label: "Dépenses",  sub: "Charges & notes de frais" },
                  { href: "/client/crm",        icon: Users, label: "CRM",            sub: nbContacts > 0 ? `${nbContacts} contacts` : "Base clients" },
                  { href: "/client/productivite",icon: CheckCircle2, label: "Productivité", sub: nbTasks > 0 ? `${nbTasks} tâches` : "Tâches & projets" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                        style={{ borderTop: i > 0 ? `1px solid ${t.borderSoft}` : "none" }}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: t.bgSubtle }}>
                          <Icon size={15} style={{ color: t.text3 }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold" style={{ color: t.text }}>{item.label}</p>
                          <p className="text-xs" style={{ color: t.text4 }}>{item.sub}</p>
                        </div>
                        <ChevronRight size={13} style={{ color: t.text4 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        {isFree && (
          <div className="mt-10 flex justify-center">
            <Link
              href="/client/abonnements"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.75rem] font-bold transition hover:opacity-90"
              style={{ background: GOLD, color: "#0a0a0a" }}
            >
              <Crown size={12} /> Passer à DJAMA PRO — 11,90€/mois
            </Link>
          </div>
        )}
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
                {pickerApps.map((app) => {
                  const selected = pickerDraft.some(a => a.href === app.route);
                  const atMax    = pickerDraft.length >= 6;
                  const Icon     = app.icon;
                  return (
                    <motion.button
                      key={app.route}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => {
                        if (selected) setPickerDraft(d => d.filter(a => a.href !== app.route));
                        else if (!atMax) setPickerDraft(d => [...d, { href: app.route, label: app.name }]);
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
                          className="relative flex items-center justify-center overflow-hidden rounded-[13px]"
                          style={{
                            width: 48, height: 48,
                            background: selected ? `${GOLD}18` : t.bgSubtle,
                            border: selected ? `1px solid ${GOLD}40` : `1px solid ${t.border}`,
                            boxShadow: selected ? `0 0 0 2px ${GOLD}50` : "none",
                          }}
                        >
                          <Icon size={20} style={{ color: selected ? GOLD : t.text3 }} strokeWidth={1.7} />
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
                        {app.name}
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
                  onClick={async () => {
                    setQuickActions(pickerDraft);
                    setEditingQA(false);
                    await saveQuickActions(pickerDraft);
                  }}
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
