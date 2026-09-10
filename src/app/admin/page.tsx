"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, CreditCard, Shield, TrendingUp, MessageSquare,
  ArrowUpRight, ArrowRight, ArrowUp, ArrowDown, Minus,
  Clock, UserPlus, Wallet, AlertCircle, Mail, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Filler,
  type ChartOptions,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Filler);

const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";
const BORDER = "rgba(255,255,255,0.07)";
const CARD   = "#131620";

/* ─── Helpers ─────────────────────────────────────────────── */
function formatEur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}
function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function last6Months() {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short" });
}

/* ─── Tendance ────────────────────────────────────────────── */
function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-[0.7rem] text-white/25">—</span>;
  if (previous === 0) return <span className="flex items-center gap-0.5 text-[0.7rem] text-emerald-400"><ArrowUp size={10} />Nouveau</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span className="flex items-center gap-0.5 text-[0.7rem] text-white/30"><Minus size={10} />stable</span>;
  return (
    <span className={`flex items-center gap-0.5 text-[0.7rem] font-semibold ${pct > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {pct > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(pct)}% vs mois prec.
    </span>
  );
}

/* ─── Stat Card ────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon: Icon, iconColor, iconBg, href, loading, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
  href?: string; loading: boolean; trend?: { current: number; previous: number };
}) {
  const inner = (
    <div
      className={`group flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-150 ${href ? "hover:border-white/[0.12] hover:bg-[#161923]" : ""}`}
      style={{ background: CARD, borderColor: BORDER }}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: iconBg }}>
          <Icon size={15} style={{ color: iconColor }} strokeWidth={2} />
        </div>
        {href && <ArrowUpRight size={13} className="text-white/15 transition-colors group-hover:text-white/45" />}
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-lg bg-white/[0.07]" />
        ) : (
          <p className="text-[1.65rem] font-black leading-none tracking-tight text-white tabular-nums">{value}</p>
        )}
        <p className="mt-1.5 text-[0.75rem] font-semibold text-white/50">{label}</p>
        {!loading && (
          <div className="mt-1 flex items-center gap-2">
            {sub && <span className="text-[0.7rem] text-white/25">{sub}</span>}
            {trend && <Trend {...trend} />}
          </div>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Options Chart.js communes ────────────────────────────── */
const LINE_OPTS: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: { tooltip: { backgroundColor: "#1e2130", titleColor: "#fff", bodyColor: "rgba(255,255,255,0.55)", borderColor: BORDER, borderWidth: 1, padding: 10, cornerRadius: 8 } },
  scales: {
    x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } } },
    y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } }, beginAtZero: true },
  },
};
const BAR_OPTS: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { tooltip: { backgroundColor: "#1e2130", titleColor: "#fff", bodyColor: "rgba(255,255,255,0.55)", borderColor: BORDER, borderWidth: 1, padding: 10, cornerRadius: 8 } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } } },
    y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } }, beginAtZero: true },
  },
};

/* ─── Badge statut ─────────────────────────────────────────── */
function Badge({ s }: { s: string }) {
  const cls =
    s === "payée" || s === "confirmé" || s === "actif" || s === "traité" ? "text-emerald-400 bg-emerald-400/10" :
    s === "en attente" || s === "nouveau" || s === "lu" || s === "en cours" ? "text-amber-400 bg-amber-400/10" :
    s === "annulé" || s === "échoué" || s === "inactif" ? "text-red-400 bg-red-400/10" :
    "text-white/30 bg-white/[0.05]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.62rem] font-bold ${cls}`}>{s}</span>
  );
}

/* ─── Dashboard ────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshAt, setRefreshAt] = useState(Date.now());

  const [kpi, setKpi] = useState({
    totalUsers: 0, newUsersMonth: 0, newUsersPrev: 0, newUsersWeek: 0, newUsersToday: 0,
    premium: 0, gratuit: 0,
    mrrMois: 0, mrrPrev: 0,
    paiementsEchoues: 0,
    messagesAttente: 0,
    accesActifs: 0,
  });

  const [charts, setCharts] = useState({
    months: last6Months(),
    inscriptions: [] as number[],
    revenus: [] as number[],
  });

  const [recentMessages, setRecentMessages] = useState<{ id: string; name: string; email: string; subject: string | null; status: string; created_at: string }[]>([]);
  const [recentClients,  setRecentClients]  = useState<{ id: string; name: string; email: string; created_at: string; statut: string }[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const now = new Date();
      const months = last6Months();
      const startOf6M = `${months[0]}-01`;
      const startMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endPrev   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      const startWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
      const startDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        clientsRes, accessRes, messagesRes,
        invMoisRes, invPrevRes, invWeekRes, invDayRes,
        invoicesMoisRes, invoicesPrevRes, invoicesEchecsRes,
        recentMsgRes, recentClientsRes, invoices6MRes, clients6MRes,
      ] = await Promise.all([
        sb.from("clients").select("id, statut"),
        sb.from("user_access").select("id, espace_premium, outils_saas"),
        sb.from("contact_messages").select("id").eq("status", "nouveau"),
        sb.from("clients").select("id").gte("created_at", startMois),
        sb.from("clients").select("id").gte("created_at", startPrev).lte("created_at", endPrev),
        sb.from("clients").select("id").gte("created_at", startWeek),
        sb.from("clients").select("id").gte("created_at", startDay),
        sb.from("invoices").select("total").eq("payment_status", "payée").gte("created_at", startMois),
        sb.from("invoices").select("total").eq("payment_status", "payée").gte("created_at", startPrev).lte("created_at", endPrev),
        sb.from("invoices").select("id").in("payment_status", ["échoué", "en retard"]),
        sb.from("contact_messages").select("id, name, email, subject, status, created_at").order("created_at", { ascending: false }).limit(5),
        sb.from("clients").select("id, name, email, created_at, statut").order("created_at", { ascending: false }).limit(5),
        sb.from("invoices").select("total, created_at, payment_status").gte("created_at", startOf6M).eq("payment_status", "payée"),
        sb.from("clients").select("created_at").gte("created_at", startOf6M),
      ]);

      const clientsData = clientsRes.data ?? [];
      const accessData  = accessRes.data ?? [];

      const premium = accessData.filter(a => a.espace_premium).length;
      const gratuit = Math.max(0, clientsData.length - premium);

      const mrrMois = (invoicesMoisRes.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);
      const mrrPrev = (invoicesPrevRes.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);

      // Graphiques : inscriptions et revenus par mois
      const inscByMonth: Record<string, number> = {};
      const revByMonth: Record<string, number>  = {};
      months.forEach(m => { inscByMonth[m] = 0; revByMonth[m] = 0; });

      for (const c of (clients6MRes.data ?? [])) {
        const k = monthKey(c.created_at);
        if (k in inscByMonth) inscByMonth[k]++;
      }
      for (const inv of (invoices6MRes.data ?? [])) {
        const k = monthKey(inv.created_at);
        if (k in revByMonth) revByMonth[k] += Number(inv.total) || 0;
      }

      setKpi({
        totalUsers:      clientsData.length,
        newUsersMonth:   invMoisRes.data?.length ?? 0,
        newUsersPrev:    invPrevRes.data?.length ?? 0,
        newUsersWeek:    invWeekRes.data?.length ?? 0,
        newUsersToday:   invDayRes.data?.length ?? 0,
        premium, gratuit,
        mrrMois, mrrPrev,
        paiementsEchoues: invoicesEchecsRes.data?.length ?? 0,
        messagesAttente:  messagesRes.data?.length ?? 0,
        accesActifs:      premium,
      });

      setCharts({
        months,
        inscriptions: months.map(m => inscByMonth[m] ?? 0),
        revenus:      months.map(m => revByMonth[m] ?? 0),
      });

      setRecentMessages((recentMsgRes.data ?? []) as typeof recentMessages);
      setRecentClients((recentClientsRes.data ?? []) as typeof recentClients);
    } catch (err) {
      console.error("[AdminDashboard]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshAt]);

  const labels = charts.months.map(monthLabel);
  const donut = {
    labels: ["Premium", "Gratuit"],
    datasets: [{ data: [kpi.premium, kpi.gratuit], backgroundColor: [`rgba(${GOLDR},0.85)`, "rgba(255,255,255,0.08)"], borderWidth: 0, hoverOffset: 4 }],
  };
  const lineInsc = {
    labels,
    datasets: [{ label: "Inscriptions", data: charts.inscriptions, borderColor: `rgba(${GOLDR},0.9)`, backgroundColor: `rgba(${GOLDR},0.06)`, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: GOLD }],
  };
  const barRev = {
    labels,
    datasets: [{ label: "Revenus (€)", data: charts.revenus, backgroundColor: `rgba(${GOLDR},0.65)`, borderRadius: 6, hoverBackgroundColor: `rgba(${GOLDR},0.9)` }],
  };

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-black tracking-tight text-white">Tableau de bord</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">Vue d&apos;ensemble DJAMA — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <button
          onClick={() => setRefreshAt(Date.now())}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium text-white/40 transition hover:border-white/20 hover:text-white/70"
          style={{ borderColor: BORDER }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* KPIs principaux — ligne 1 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Utilisateurs total" value={kpi.totalUsers} sub={`+${kpi.newUsersToday} aujourd'hui`}
          icon={Users} iconColor="#c9a55a" iconBg={`rgba(${GOLDR},0.10)`} href="/admin/clients" loading={loading} />
        <KpiCard label="Revenus du mois" value={formatEur(kpi.mrrMois)}
          trend={{ current: kpi.mrrMois, previous: kpi.mrrPrev }}
          icon={Wallet} iconColor="#4ade80" iconBg="rgba(74,222,128,0.09)" href="/admin/paiements" loading={loading} />
        <KpiCard label="Abonnements actifs" value={kpi.accesActifs} sub={`${kpi.gratuit} utilisateurs gratuits`}
          icon={Shield} iconColor="#a78bfa" iconBg="rgba(167,139,250,0.09)" href="/admin/acces" loading={loading} />
        <KpiCard label="Messages en attente" value={kpi.messagesAttente} sub="Non traités"
          icon={MessageSquare} iconColor="#60a5fa" iconBg="rgba(96,165,250,0.09)" href="/admin/messages" loading={loading} />
      </div>

      {/* KPIs secondaires — ligne 2 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Nouvelles inscriptions" value={kpi.newUsersMonth}
          trend={{ current: kpi.newUsersMonth, previous: kpi.newUsersPrev }}
          icon={UserPlus} iconColor="#fb923c" iconBg="rgba(251,146,60,0.09)" href="/admin/clients" loading={loading} />
        <KpiCard label="Cette semaine" value={kpi.newUsersWeek} sub="Nouvelles inscriptions"
          icon={TrendingUp} iconColor="#34d399" iconBg="rgba(52,211,153,0.09)" loading={loading} />
        <KpiCard label="Utilisateurs Premium" value={kpi.premium} sub={`sur ${kpi.totalUsers} total`}
          icon={CreditCard} iconColor="#fbbf24" iconBg="rgba(251,191,36,0.09)" href="/admin/acces" loading={loading} />
        <KpiCard label="Paiements échoués" value={kpi.paiementsEchoues} sub="À vérifier"
          icon={AlertCircle} iconColor="#f87171" iconBg="rgba(248,113,113,0.09)" href="/admin/paiements" loading={loading} />
      </div>

      {/* Graphiques */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Évolution inscriptions */}
        <div className="rounded-2xl border p-5 lg:col-span-1" style={{ background: CARD, borderColor: BORDER }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[0.88rem] font-bold text-white">Inscriptions</h2>
              <p className="text-[0.7rem] text-white/30">6 derniers mois</p>
            </div>
            <UserPlus size={14} className="text-white/20" />
          </div>
          <div style={{ height: 140 }}>
            {!loading && <Line data={lineInsc} options={LINE_OPTS} />}
            {loading && <div className="h-full w-full animate-pulse rounded-xl bg-white/[0.04]" />}
          </div>
        </div>

        {/* Revenus mensuels */}
        <div className="rounded-2xl border p-5 lg:col-span-1" style={{ background: CARD, borderColor: BORDER }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[0.88rem] font-bold text-white">Revenus</h2>
              <p className="text-[0.7rem] text-white/30">6 derniers mois</p>
            </div>
            <Wallet size={14} className="text-white/20" />
          </div>
          <div style={{ height: 140 }}>
            {!loading && <Bar data={barRev} options={BAR_OPTS} />}
            {loading && <div className="h-full w-full animate-pulse rounded-xl bg-white/[0.04]" />}
          </div>
        </div>

        {/* Répartition free/premium */}
        <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[0.88rem] font-bold text-white">Répartition</h2>
              <p className="text-[0.7rem] text-white/30">Gratuit vs Premium</p>
            </div>
            <Shield size={14} className="text-white/20" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 140 }}>
              <div className="h-28 w-28 animate-pulse rounded-full bg-white/[0.04]" />
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <div style={{ height: 120, width: 120, flexShrink: 0 }}>
                <Doughnut data={donut} options={{ responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { tooltip: { backgroundColor: "#1e2130", titleColor: "#fff", bodyColor: "rgba(255,255,255,0.55)", borderColor: BORDER, borderWidth: 1, padding: 10, cornerRadius: 8 } } }} />
              </div>
              <div className="flex flex-col gap-2.5 text-[0.75rem]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: GOLD }} />
                  <span className="text-white/60">Premium</span>
                  <span className="ml-auto font-bold text-white">{kpi.premium}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="text-white/60">Gratuit</span>
                  <span className="ml-auto font-bold text-white">{kpi.gratuit}</span>
                </div>
                <div className="mt-1 border-t pt-2" style={{ borderColor: BORDER }}>
                  <span className="text-white/30">Total</span>
                  <span className="ml-auto float-right font-bold text-white">{kpi.totalUsers}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activité récente */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Messages récents */}
        <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={13} className="text-white/30" />
              <h2 className="text-[0.87rem] font-bold text-white">Messages récents</h2>
              {kpi.messagesAttente > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[0.58rem] font-bold text-white">
                  {kpi.messagesAttente}
                </span>
              )}
            </div>
            <Link href="/admin/messages" className="flex items-center gap-1 text-[0.73rem] font-medium transition hover:opacity-80" style={{ color: GOLD }}>
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-28 rounded bg-white/[0.07]" />
                    <div className="h-2 w-40 rounded bg-white/[0.04]" />
                  </div>
                  <div className="h-5 w-14 rounded-full bg-white/[0.05]" />
                </div>
              ))}
            </div>
          ) : recentMessages.length === 0 ? (
            <p className="py-6 text-center text-[0.8rem] text-white/25">Aucun message</p>
          ) : (
            <div className="space-y-2.5">
              {recentMessages.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(96,165,250,0.10)] text-[0.58rem] font-black text-[#60a5fa]">
                    {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.81rem] font-semibold text-white/80">{m.name}</p>
                    <p className="truncate text-[0.7rem] text-white/28">{m.subject || "—"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mb-1 text-[0.67rem] text-white/20">{formatDate(m.created_at)}</p>
                    <Badge s={m.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nouvelles inscriptions */}
        <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-white/30" />
              <h2 className="text-[0.87rem] font-bold text-white">Dernières inscriptions</h2>
            </div>
            <Link href="/admin/clients" className="flex items-center gap-1 text-[0.73rem] font-medium transition hover:opacity-80" style={{ color: GOLD }}>
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-28 rounded bg-white/[0.07]" />
                    <div className="h-2 w-36 rounded bg-white/[0.04]" />
                  </div>
                  <div className="h-5 w-12 rounded-full bg-white/[0.05]" />
                </div>
              ))}
            </div>
          ) : recentClients.length === 0 ? (
            <p className="py-6 text-center text-[0.8rem] text-white/25">Aucun client</p>
          ) : (
            <div className="space-y-2.5">
              {recentClients.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[0.58rem] font-black" style={{ background: `rgba(${GOLDR},0.10)`, color: GOLD }}>
                    {(c.name || c.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.81rem] font-semibold text-white/80">{c.name || "—"}</p>
                    <p className="truncate text-[0.7rem] text-white/28">{c.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mb-1 text-[0.67rem] text-white/20">{formatDate(c.created_at)}</p>
                    <Badge s={c.statut ?? "—"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Liens rapides */}
      <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
        <h2 className="mb-4 text-[0.87rem] font-bold text-white">Accès rapides</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: "/admin/clients",     label: "Gérer les utilisateurs", icon: Users,        color: GOLD             },
            { href: "/admin/acces",       label: "Gérer les accès",        icon: Shield,       color: "#a78bfa"        },
            { href: "/admin/paiements",   label: "Voir les paiements",     icon: CreditCard,   color: "#4ade80"        },
            { href: "/admin/messages",    label: "Répondre aux messages",  icon: Mail,         color: "#60a5fa"        },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href} href={href}
              className="flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-[0.78rem] font-medium text-white/55 transition hover:border-white/15 hover:text-white/80"
              style={{ borderColor: BORDER }}
            >
              <Icon size={13} style={{ color, flexShrink: 0 }} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
