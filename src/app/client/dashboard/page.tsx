"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ReceiptText, Users, Timer, Receipt, FileText, Search,
  TrendingUp, StickyNote, Star, Zap, CalendarRange,
  Clock, Euro, UserCheck, TrendingDown, ArrowUpRight,
  AlertTriangle, ChevronRight, BarChart3,
  FileBarChart2, Loader2, X, ShieldCheck, Lightbulb,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt, fmtDuration } from "@/lib/format";

const GOLD = "#c9a55a";
const NAVY = "#0a0f1e";

const TOOLS = [
  { href: "/client/factures",    label: "Factures & Devis",  desc: "Créez et envoyez vos documents",     icon: ReceiptText,  hue: "#3b82f6" },
  { href: "/client/crm",         label: "CRM Contacts",      desc: "Gérez vos prospects et clients",     icon: Users,        hue: "#6366f1" },
  { href: "/client/chrono",      label: "Chrono Pro",        desc: "Suivez le temps par projet",         icon: Timer,        hue: "#a78bfa" },
  { href: "/client/depenses",    label: "Dépenses",          desc: "Catégorisez vos frais pros",         icon: Receipt,      hue: "#f97316" },
  { href: "/client/contrats",    label: "Contrats IA",       desc: "Générez des contrats en secondes",   icon: FileText,     hue: GOLD      },
  { href: "/client/sourcing",    label: "Sourcing IA",       desc: "Trouvez les meilleurs fournisseurs", icon: Search,       hue: "#818cf8" },
  { href: "/client/tresorerie",  label: "Trésorerie",        desc: "Pilotez votre cash-flow",            icon: TrendingUp,   hue: "#10b981" },
  { href: "/client/bloc-notes",  label: "Bloc-notes",        desc: "Capturez vos idées rapidement",      icon: StickyNote,   hue: "#fbbf24" },
  { href: "/client/reputation",  label: "Réputation",        desc: "Collectez et gérez vos avis",        icon: Star,         hue: "#f59e0b" },
  { href: "/client/assistant",   label: "Assistant IA",      desc: "Relances et actions intelligentes",  icon: Zap,          hue: "#22d3ee" },
  { href: "/client/planification",label: "Planification",    desc: "Organisez l'agenda de l'équipe",     icon: CalendarRange,hue: "#0ea5e9" },
] as const;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bonjour";
  if (h >= 12 && h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function startOfWeekISO(): string {
  const d = new Date(), day = d.getDay(), diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function fmtFullDate(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());
}

interface Stats {
  caThisMois: number;
  heuresSemaine: number;
  depensesMois: number;
  contactsActifs: number;
}
interface MonthRevenue { label: string; amount: number; }
interface TopClient { name: string; amount: number; }
interface OverdueInvoice {
  id: string; numero: string; client_nom: string;
  total_ttc: number; date_echeance: string | null;
}
type Rapport = {
  mois: string; score_sante: number; resume_executif: string;
  kpis: { revenu_total: number; depenses_totales: number; resultat_net: number; taux_recouvrement: string; nb_factures: number; nb_clients: number };
  top_clients: { nom: string; montant: number }[];
  top_depenses: { categorie: string; montant: number }[];
  points_forts: string[]; alertes: string[];
  recommandations: string[]; objectif_mois_prochain: string;
};

const SHORT_MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function ToolCard({ item }: { item: typeof TOOLS[number] }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="group block">
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 transition-colors duration-150 hover:border-white/[0.11] hover:bg-white/[0.04]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${item.hue}1a`, border: `1px solid ${item.hue}30` }}>
          <Icon size={14} style={{ color: item.hue }} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8rem] font-semibold text-white/80 leading-tight group-hover:text-white transition-colors">
            {item.label}
          </p>
          <p className="truncate text-[0.67rem] text-white/30">{item.desc}</p>
        </div>
        <ArrowUpRight size={12} className="shrink-0 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [userName,      setUserName]      = useState("");
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [revenues,      setRevenues]      = useState<MonthRevenue[]>([]);
  const [topClients,    setTopClients]    = useState<TopClient[]>([]);
  const [overdue,       setOverdue]       = useState<OverdueInvoice[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [rapportOpen,    setRapportOpen]    = useState(false);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [rapport,        setRapport]        = useState<Rapport | null>(null);

  useEffect(() => {
    async function loadAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email?.split("@")[0] || "";
        setUserName(name);
      }

      const weekStart  = startOfWeekISO();
      const monthStart = startOfMonthISO();

      const [docsRes, timeRes, expRes, crmRes] = await Promise.all([
        supabase.from("documents").select("total_ttc").eq("type","facture").in("statut",["envoyé","payé"]).gte("created_at", new Date(monthStart+"T00:00:00").toISOString()),
        supabase.from("time_entries").select("duration_minutes").gte("date", weekStart),
        supabase.from("expenses").select("amount").gte("date", monthStart),
        supabase.from("contacts").select("id",{ count:"exact", head:true }).eq("status","actif"),
      ]);

      setStats({
        caThisMois:     (docsRes.data ?? []).reduce((s,d) => s+(d.total_ttc ?? 0), 0),
        heuresSemaine:  (timeRes.data ?? []).reduce((s,e) => s+(e.duration_minutes ?? 0), 0),
        depensesMois:   (expRes.data  ?? []).reduce((s,e) => s+(e.amount ?? 0), 0),
        contactsActifs: crmRes.count ?? 0,
      });
      setStatsLoading(false);

      const today = new Date();
      const monthData: MonthRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const start = d.toISOString().slice(0,10);
        const end   = new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10);
        const { data } = await supabase.from("documents").select("total_ttc").eq("type","facture").eq("statut","payé").gte("date_document",start).lte("date_document",end);
        monthData.push({ label: SHORT_MONTHS[d.getMonth()], amount: (data ?? []).reduce((s,r) => s+(r.total_ttc ?? 0), 0) });
      }
      setRevenues(monthData);

      const threeAgo = new Date(today.getFullYear(), today.getMonth()-3, 1).toISOString().slice(0,10);
      const { data: paidDocs } = await supabase.from("documents").select("client_nom,total_ttc").eq("type","facture").eq("statut","payé").gte("date_document",threeAgo);
      const clientMap = new Map<string,number>();
      for (const d of (paidDocs ?? [])) {
        const n = (d.client_nom as string) || "Inconnu";
        clientMap.set(n, (clientMap.get(n) ?? 0) + ((d.total_ttc as number) ?? 0));
      }
      setTopClients([...clientMap.entries()].sort((a,b) => b[1]-a[1]).slice(0,5).map(([name,amount]) => ({ name, amount })));

      const { data: overdueDocs } = await supabase.from("documents").select("id,numero,client_nom,total_ttc,date_echeance").eq("type","facture").eq("statut","en_retard").order("date_echeance",{ascending:true}).limit(5);
      setOverdue((overdueDocs ?? []) as OverdueInvoice[]);
      setChartsLoading(false);
    }
    loadAll();
  }, []);

  async function runRapport() {
    const now = new Date();
    setRapportLoading(true); setRapportOpen(true); setRapport(null);
    try {
      const res = await fetch("/api/rapport-mensuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: now.getFullYear(), month: now.getMonth() }),
      });
      if (!res.ok) throw new Error("Erreur rapport");
      setRapport(await res.json());
    } catch { setRapportOpen(false); }
    finally { setRapportLoading(false); }
  }

  const kpis = [
    { label: "CA facturé ce mois",    value: stats ? fmtEurInt(stats.caThisMois)    : "—", icon: Euro,        href: "/client/factures" },
    { label: "Heures cette semaine",  value: stats ? (stats.heuresSemaine > 0 ? fmtDuration(stats.heuresSemaine) : "0h") : "—", icon: Clock, href: "/client/chrono" },
    { label: "Dépenses ce mois",      value: stats ? fmtEurInt(stats.depensesMois)  : "—", icon: TrendingDown, href: "/client/depenses" },
    { label: "Contacts actifs",       value: stats ? String(stats.contactsActifs)   : "—", icon: UserCheck,   href: "/client/crm" },
  ];

  return (
    <div className="min-h-full pb-16" style={{ background: NAVY }}>

            <div className="border-b border-white/[0.06] bg-[rgba(7,12,24,0.9)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
              <LayoutDashboard size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-[0.9rem] font-semibold text-white">Tableau de bord</h1>
              <p className="text-[0.65rem] text-white/35">Vue d'ensemble de votre activité</p>
            </div>
          </div>
          <button
            onClick={runRapport}
            disabled={rapportLoading}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[0.75rem] font-medium text-white/50 transition hover:bg-white/[0.07] hover:text-white/80 disabled:opacity-50"
          >
            {rapportLoading ? <Loader2 size={12} className="animate-spin" /> : <FileBarChart2 size={12} />}
            <span className="hidden sm:inline">Rapport mensuel</span>
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl space-y-7 px-5 py-7 sm:px-8">

        {/* Greeting */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-5 py-4">
          <p className="text-[0.68rem] font-medium text-white/30 capitalize">{fmtFullDate()}</p>
          <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">
            {getGreeting()}{userName ? `, ${userName}` : ""}
          </h2>
          <p className="mt-0.5 text-[0.8rem] text-white/35">Voici un résumé de votre activité DJAMA PRO.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.label} href={kpi.href} className="group block">
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05]">
                    <Icon size={14} className="text-white/50" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] font-medium text-white/35">{kpi.label}</p>
                    {statsLoading
                      ? <div className="mt-1 h-4 w-16 animate-pulse rounded-md bg-white/[0.06]" />
                      : <p className="mt-0.5 text-[0.95rem] font-semibold text-white/90 leading-none">{kpi.value}</p>
                    }
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Overdue alert */}
        {!chartsLoading && overdue.length > 0 && (
          <Link href="/client/tresorerie" className="block">
            <div className="flex items-center gap-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5 transition-colors hover:bg-red-500/[0.1]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
                <AlertTriangle size={14} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.8rem] font-semibold text-white/90">
                  {overdue.length} facture{overdue.length > 1 ? "s" : ""} en retard
                </p>
                <p className="text-[0.68rem] text-white/35 truncate">
                  {overdue.map(i => i.client_nom || i.numero).join(", ")}
                </p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-red-400/50" />
            </div>
          </Link>
        )}

        {/* Revenue chart + Top clients */}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">

          {/* Revenue chart */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                  <BarChart3 size={13} className="text-white/50" />
                </div>
                <div>
                  <p className="text-[0.8rem] font-semibold text-white/80">Revenus encaissés</p>
                  <p className="text-[0.65rem] text-white/35">6 derniers mois</p>
                </div>
              </div>
              {!chartsLoading && revenues.length > 0 && (
                <p className="text-[0.8rem] font-semibold" style={{ color: GOLD }}>
                  {fmtEurInt(revenues.reduce((s,r) => s+r.amount, 0))}
                </p>
              )}
            </div>
            {chartsLoading ? (
              <div className="flex items-end gap-3 h-28">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex-1 animate-pulse rounded-lg bg-white/5" style={{ height: `${40+i*10}%` }} />
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-2 h-32 sm:gap-3">
                {(() => {
                  const max = Math.max(...revenues.map(r => r.amount), 1);
                  return revenues.map((r, i) => {
                    const pct = Math.max((r.amount / max) * 100, r.amount > 0 ? 8 : 2);
                    const isLast = i === revenues.length - 1;
                    return (
                      <div key={r.label} className="group flex flex-1 flex-col items-center gap-1.5">
                        <div className="relative w-full" style={{ height: "96px" }}>
                          <div className="absolute bottom-0 w-full overflow-hidden rounded-t-md transition-all duration-700"
                            style={{
                              height: `${pct}%`,
                              background: isLast
                                ? `${GOLD}cc`
                                : "rgba(255,255,255,0.07)",
                            }}
                          />
                          {r.amount > 0 && (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#070c18] px-2 py-1 text-[0.6rem] font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {fmtEurInt(r.amount)}
                            </div>
                          )}
                        </div>
                        <span className={`text-[0.6rem] font-medium ${isLast ? "" : "text-white/30"}`}
                          style={isLast ? { color: GOLD } : {}}>
                          {r.label}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Top clients */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                <Star size={13} className="text-white/50" />
              </div>
              <div>
                <p className="text-[0.8rem] font-semibold text-white/80">Meilleurs clients</p>
                <p className="text-[0.65rem] text-white/35">3 mois glissants</p>
              </div>
            </div>
            {chartsLoading ? (
              <div className="space-y-2.5">
                {[1,2,3].map(i => <div key={i} className="h-9 animate-pulse rounded-lg bg-white/5" />)}
              </div>
            ) : topClients.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users size={18} className="text-white/15" />
                <p className="text-[0.75rem] text-white/25">Aucun encaissement récent</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {topClients.map((c, i) => {
                  const max = topClients[0].amount;
                  const pct = Math.round((c.amount / max) * 100);
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75rem] font-medium text-white/70 truncate max-w-[140px]">{c.name}</span>
                        <span className="text-[0.75rem] font-semibold" style={{ color: GOLD }}>{fmtEurInt(c.amount)}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                          className="h-full rounded-full"
                          style={{ background: i === 0 ? GOLD : `${GOLD}55` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rapport mensuel panel */}
        <AnimatePresence>
          {rapportOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                    <FileBarChart2 size={12} className="text-white/50" />
                  </div>
                  <span className="text-[0.85rem] font-semibold text-white">
                    Rapport — {new Date().toLocaleDateString("fr-FR",{ month:"long", year:"numeric" })}
                  </span>
                </div>
                <button onClick={() => setRapportOpen(false)} className="text-white/25 transition hover:text-white/60">
                  <X size={14} />
                </button>
              </div>

              {rapportLoading ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
                  <p className="text-[0.8rem] text-white/40">Génération du rapport en cours…</p>
                </div>
              ) : rapport && (
                <div className="p-5 space-y-5">
                  {/* Score + résumé */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
                        <circle cx="32" cy="32" r="26" fill="none"
                          stroke={rapport.score_sante >= 70 ? "#10b981" : rapport.score_sante >= 40 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 26}`}
                          strokeDashoffset={`${2 * Math.PI * 26 * (1 - rapport.score_sante / 100)}`}
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <span className="text-base font-bold"
                        style={{ color: rapport.score_sante >= 70 ? "#10b981" : rapport.score_sante >= 40 ? "#f59e0b" : "#ef4444" }}>
                        {rapport.score_sante}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[0.65rem] font-medium text-white/35">Santé financière</p>
                      <p className="mt-1 text-[0.82rem] leading-relaxed text-white/60">{rapport.resume_executif}</p>
                    </div>
                  </div>

                  {/* KPIs */}
                  {rapport.kpis && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[
                        { label: "Revenu encaissé",   value: fmtEurInt(rapport.kpis.revenu_total)     },
                        { label: "Dépenses totales",  value: fmtEurInt(rapport.kpis.depenses_totales)  },
                        { label: "Résultat net",      value: fmtEurInt(rapport.kpis.resultat_net)      },
                        { label: "Taux recouvrement", value: rapport.kpis.taux_recouvrement            },
                        { label: "Factures",          value: String(rapport.kpis.nb_factures)          },
                        { label: "Clients actifs",    value: String(rapport.kpis.nb_clients)           },
                      ].map(k => (
                        <div key={k.label} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
                          <p className="text-[0.62rem] font-medium text-white/35">{k.label}</p>
                          <p className="mt-0.5 text-[0.95rem] font-semibold text-white/85">{k.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Points forts + Alertes */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {rapport.points_forts?.length > 0 && (
                      <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <ShieldCheck size={11} className="text-emerald-400" />
                          <span className="text-[0.65rem] font-semibold text-emerald-400/80">Points forts</span>
                        </div>
                        <ul className="space-y-1.5">
                          {rapport.points_forts.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-[0.75rem] text-white/55">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/70" />{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rapport.alertes?.length > 0 && (
                      <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.05] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <AlertTriangle size={11} className="text-amber-400" />
                          <span className="text-[0.65rem] font-semibold text-amber-400/80">Alertes</span>
                        </div>
                        <ul className="space-y-1.5">
                          {rapport.alertes.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-[0.75rem] text-white/55">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/70" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommandations */}
                  {rapport.recommandations?.length > 0 && (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Lightbulb size={11} className="text-white/50" />
                        <span className="text-[0.65rem] font-semibold text-white/40">Recommandations</span>
                      </div>
                      <ol className="space-y-1.5">
                        {rapport.recommandations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[0.75rem] text-white/55">
                            <span className="shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-[0.55rem] font-semibold text-white/50">{i+1}</span>
                            {r}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Objectif */}
                  {rapport.objectif_mois_prochain && (
                    <div className="flex items-start gap-3 rounded-lg border p-4"
                      style={{ borderColor: `${GOLD}25`, background: `${GOLD}0a` }}>
                      <TrendingUp size={13} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
                      <div>
                        <p className="mb-1 text-[0.65rem] font-semibold" style={{ color: `${GOLD}aa` }}>Objectif mois prochain</p>
                        <p className="text-[0.78rem] text-white/60">{rapport.objectif_mois_prochain}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tools grid */}
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-[0.72rem] font-semibold text-white/40">Vos outils</h2>
            <div className="flex-1 border-t border-white/[0.05]" />
            <span className="text-[0.65rem] text-white/25">{TOOLS.length} modules</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.href} item={tool} />
            ))}
          </div>
        </div>

        <p className="text-center text-[0.63rem] text-white/15">
          DJAMA PRO · Données mises à jour en temps réel
        </p>
      </div>
    </div>
  );
}
