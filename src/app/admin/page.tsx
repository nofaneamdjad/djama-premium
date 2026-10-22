"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, Wallet, Shield, MessageSquare, UserPlus, TrendingUp,
  CreditCard, AlertCircle, Mail, Clock, RefreshCw, ArrowRight,
  ArrowUp, ArrowDown, Minus, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { V } from "@/components/hq";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Filler);

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
function getMonths(n: number) {
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
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

/* ─── Détection thème ──────────────────────────────────────── */
function useAdminTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => {
      const el = document.querySelector("[data-hq-theme]");
      setIsDark(el?.getAttribute("data-hq-theme") !== "light");
    };
    check();
    const root = document.querySelector("[data-hq-theme]");
    if (!root) return;
    const obs = new MutationObserver(check);
    obs.observe(root, { attributes: true, attributeFilter: ["data-hq-theme"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/* ─── Tendance ────────────────────────────────────────────── */
function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0)
    return <span className="text-[0.7rem]" style={{ color: V.textFaint }}>—</span>;
  if (previous === 0)
    return <span className="flex items-center gap-0.5 text-[0.7rem] text-emerald-400"><ArrowUp size={10} />Nouveau</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0)
    return <span className="flex items-center gap-0.5 text-[0.7rem]" style={{ color: V.textFaint }}><Minus size={10} />stable</span>;
  return (
    <span className={`flex items-center gap-0.5 text-[0.7rem] font-semibold ${pct > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {pct > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(pct)}%
    </span>
  );
}

/* ─── KPI Card ────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon: Icon, iconColor, iconBg, href, loading, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
  href?: string; loading: boolean; trend?: { current: number; previous: number };
}) {
  const inner = (
    <div
      className={`group flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-150${href ? " cursor-pointer" : ""}`}
      style={{ background: V.card, borderColor: V.border }}
      onMouseEnter={e => href && ((e.currentTarget as HTMLDivElement).style.borderColor = V.borderHov)}
      onMouseLeave={e => href && ((e.currentTarget as HTMLDivElement).style.borderColor = V.border)}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: iconBg }}>
          <Icon size={15} style={{ color: iconColor }} strokeWidth={2} />
        </div>
        {href && (
          <ArrowUpRight
            size={13}
            style={{ color: V.textFaint }}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-lg" style={{ background: V.surface }} />
        ) : (
          <p className="text-[1.6rem] font-black leading-none tracking-tight tabular-nums" style={{ color: V.text }}>
            {value}
          </p>
        )}
        <p className="mt-1.5 text-[0.74rem] font-semibold" style={{ color: V.textMuted }}>{label}</p>
        {!loading && (
          <div className="mt-1 flex items-center gap-2">
            {sub && <span className="text-[0.7rem]" style={{ color: V.textFaint }}>{sub}</span>}
            {trend && <Trend {...trend} />}
          </div>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Badge statut ─────────────────────────────────────────── */
function Badge({ s }: { s: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    "payée":      { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
    "confirmé":   { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
    "actif":      { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
    "traité":     { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
    "en attente": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
    "nouveau":    { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
    "lu":         { color: V.textSub, bg: V.surface                },
    "en cours":   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
    "annulé":     { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
    "échoué":     { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
    "inactif":    { color: V.textSub, bg: V.surface                },
  };
  const st = map[s] ?? { color: V.textSub, bg: V.surface };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[0.62rem] font-bold"
      style={{ color: st.color, background: st.bg }}
    >
      {s}
    </span>
  );
}

/* ─── Séparateur de section ────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-[0.68rem] font-bold uppercase tracking-[0.12em]" style={{ color: V.textFaint }}>
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: V.border }} />
    </div>
  );
}

/* ─── Dashboard ────────────────────────────────────────────── */
export default function AdminDashboard() {
  const isDark = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [refreshAt, setRefreshAt] = useState(Date.now());
  const [period, setPeriod] = useState<3 | 6 | 12>(6);

  const [kpi, setKpi] = useState({
    totalUsers: 0, newUsersMonth: 0, newUsersPrev: 0, newUsersWeek: 0, newUsersToday: 0,
    premium: 0, gratuit: 0, mrrMois: 0, mrrPrev: 0,
    paiementsEchoues: 0, messagesAttente: 0, accesActifs: 0,
  });

  const [charts, setCharts] = useState({
    months: getMonths(6),
    inscriptions: [] as number[],
    revenus: [] as number[],
  });

  const [recentMessages, setRecentMessages] = useState<{
    id: string; name: string; email: string; subject: string | null; status: string; created_at: string;
  }[]>([]);
  const [recentClients, setRecentClients] = useState<{
    id: string; name: string; email: string; created_at: string; statut: string;
  }[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const now = new Date();
      const months = getMonths(period);
      const startOf = `${months[0]}-01`;
      const startMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endPrev   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      const startWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
      const startDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        clientsRes, accessRes, messagesRes,
        invMoisRes, invPrevRes, invWeekRes, invDayRes,
        invoicesMoisRes, invoicesPrevRes, invoicesEchecsRes,
        recentMsgRes, recentClientsRes, invoicesRes, clients6MRes,
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
        sb.from("invoices").select("total, created_at, payment_status").gte("created_at", startOf).eq("payment_status", "payée"),
        sb.from("clients").select("created_at").gte("created_at", startOf),
      ]);

      const clientsData = clientsRes.data ?? [];
      const accessData  = accessRes.data ?? [];
      const premium = accessData.filter(a => a.espace_premium).length;
      const gratuit = Math.max(0, clientsData.length - premium);
      const mrrMois = (invoicesMoisRes.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);
      const mrrPrev = (invoicesPrevRes.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);

      const inscByMonth: Record<string, number> = {};
      const revByMonth: Record<string, number>  = {};
      months.forEach(m => { inscByMonth[m] = 0; revByMonth[m] = 0; });

      for (const c of (clients6MRes.data ?? [])) {
        const k = monthKey(c.created_at);
        if (k in inscByMonth) inscByMonth[k]++;
      }
      for (const inv of (invoicesRes.data ?? [])) {
        const k = monthKey(inv.created_at);
        if (k in revByMonth) revByMonth[k] += Number(inv.total) || 0;
      }

      setKpi({
        totalUsers: clientsData.length, newUsersMonth: invMoisRes.data?.length ?? 0,
        newUsersPrev: invPrevRes.data?.length ?? 0, newUsersWeek: invWeekRes.data?.length ?? 0,
        newUsersToday: invDayRes.data?.length ?? 0, premium, gratuit,
        mrrMois, mrrPrev,
        paiementsEchoues: invoicesEchecsRes.data?.length ?? 0,
        messagesAttente:  messagesRes.data?.length ?? 0,
        accesActifs: premium,
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
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshAt]);

  /* ─── Options charts adaptatives au thème ──────────────── */
  const lineOpts = useMemo(() => {
    const t = isDark ? "rgba(135,144,158,0.8)" : "rgba(102,112,133,0.75)";
    const g = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.055)";
    const tt = {
      backgroundColor: isDark ? "#1a1e2e" : "#ffffff",
      titleColor:      isDark ? "#F5F5F3"  : "#171A21",
      bodyColor:       isDark ? "rgba(245,245,243,0.55)" : "rgba(23,26,33,0.6)",
      borderColor:     isDark ? "rgba(255,255,255,0.08)" : "#E6E8EC",
      borderWidth: 1, padding: 12, cornerRadius: 10,
    };
    return {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: { tooltip: tt, legend: { display: false } },
      scales: {
        x: { grid: { color: g }, ticks: { color: t, font: { size: 11 } } },
        y: { grid: { color: g }, ticks: { color: t, font: { size: 11 } }, beginAtZero: true },
      },
    };
  }, [isDark]);

  const barOpts = useMemo(() => {
    const t = isDark ? "rgba(135,144,158,0.8)" : "rgba(102,112,133,0.75)";
    const g = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.055)";
    const tt = {
      backgroundColor: isDark ? "#1a1e2e" : "#ffffff",
      titleColor:      isDark ? "#F5F5F3"  : "#171A21",
      bodyColor:       isDark ? "rgba(245,245,243,0.55)" : "rgba(23,26,33,0.6)",
      borderColor:     isDark ? "rgba(255,255,255,0.08)" : "#E6E8EC",
      borderWidth: 1, padding: 12, cornerRadius: 10,
      callbacks: { label: (ctx: { raw: unknown }) => ` ${formatEur(Number(ctx.raw))}` },
    };
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { tooltip: tt, legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: t, font: { size: 11 } } },
        y: {
          grid: { color: g },
          ticks: { color: t, font: { size: 11 }, callback: (v: number | string) => formatEur(Number(v)) },
          beginAtZero: true,
        },
      },
    };
  }, [isDark]);

  const donutOpts = useMemo(() => {
    const tt = {
      backgroundColor: isDark ? "#1a1e2e" : "#ffffff",
      titleColor:      isDark ? "#F5F5F3"  : "#171A21",
      bodyColor:       isDark ? "rgba(245,245,243,0.55)" : "rgba(23,26,33,0.6)",
      borderColor:     isDark ? "rgba(255,255,255,0.08)" : "#E6E8EC",
      borderWidth: 1, padding: 12, cornerRadius: 10,
    };
    return { responsive: true, maintainAspectRatio: false, cutout: "70%", plugins: { tooltip: tt, legend: { display: false } } };
  }, [isDark]);

  const labels = charts.months.map(monthLabel);

  const lineInsc = {
    labels,
    datasets: [{
      label: "Inscriptions", data: charts.inscriptions,
      borderColor: `rgba(${V.goldR},0.9)`, backgroundColor: `rgba(${V.goldR},0.07)`,
      fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 5,
      pointBackgroundColor: V.gold, pointBorderWidth: 0,
    }],
  };

  const barRev = {
    labels,
    datasets: [{
      label: "Revenus (€)", data: charts.revenus,
      backgroundColor: `rgba(${V.goldR},0.6)`, hoverBackgroundColor: `rgba(${V.goldR},0.85)`,
      borderRadius: 6,
    }],
  };

  const donut = {
    labels: ["Premium", "Gratuit"],
    datasets: [{
      data: [kpi.premium, kpi.gratuit],
      backgroundColor: [`rgba(${V.goldR},0.85)`, isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"],
      borderWidth: 0, hoverOffset: 4,
    }],
  };

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-8">

      {/* ── Zone 1 : En-tête direction ───────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-black tracking-tight" style={{ color: V.text }}>
            Tableau de bord
          </h1>
          <p className="mt-0.5 text-[0.78rem] capitalize" style={{ color: V.textMuted }}>{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sélecteur de période */}
          <div
            className="flex overflow-hidden rounded-xl border"
            style={{ borderColor: V.border }}
          >
            {([3, 6, 12] as const).map((p, i) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3.5 py-1.5 text-[0.73rem] font-medium transition-all duration-100"
                style={{
                  background: period === p ? `rgba(${V.goldR},0.10)` : "transparent",
                  color: period === p ? V.gold : V.textMuted,
                  borderRight: i < 2 ? `1px solid ${V.border}` : undefined,
                }}
              >
                {p}M
              </button>
            ))}
          </div>
          <button
            onClick={() => setRefreshAt(Date.now())}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.73rem] font-medium transition"
            style={{ borderColor: V.border, color: V.textMuted }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = V.borderHov}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = V.border}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ── Zone 2 : KPIs principaux ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Utilisateurs"
          value={kpi.totalUsers}
          sub={kpi.newUsersToday > 0 ? `+${kpi.newUsersToday} aujourd'hui` : undefined}
          icon={Users} iconColor={V.gold} iconBg={V.goldDim}
          href="/admin/clients" loading={loading}
        />
        <KpiCard
          label="Revenus du mois"
          value={formatEur(kpi.mrrMois)}
          trend={{ current: kpi.mrrMois, previous: kpi.mrrPrev }}
          icon={Wallet} iconColor="#4ade80" iconBg="rgba(74,222,128,0.09)"
          href="/admin/paiements" loading={loading}
        />
        <KpiCard
          label="Abonnements actifs"
          value={kpi.accesActifs}
          sub={`${kpi.gratuit} gratuits`}
          icon={Shield} iconColor="#a78bfa" iconBg="rgba(167,139,250,0.09)"
          href="/admin/acces" loading={loading}
        />
        <KpiCard
          label="Messages en attente"
          value={kpi.messagesAttente}
          sub={kpi.paiementsEchoues > 0 ? `${kpi.paiementsEchoues} paiements échoués` : "Aucun incident"}
          icon={MessageSquare} iconColor="#60a5fa" iconBg="rgba(96,165,250,0.09)"
          href="/admin/messages" loading={loading}
        />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Nouvelles inscriptions"
          value={kpi.newUsersMonth}
          trend={{ current: kpi.newUsersMonth, previous: kpi.newUsersPrev }}
          icon={UserPlus} iconColor="#fb923c" iconBg="rgba(251,146,60,0.09)"
          href="/admin/clients" loading={loading}
        />
        <KpiCard
          label="Cette semaine"
          value={kpi.newUsersWeek}
          sub="Nouvelles inscriptions"
          icon={TrendingUp} iconColor="#34d399" iconBg="rgba(52,211,153,0.09)"
          loading={loading}
        />
        <KpiCard
          label="Utilisateurs Premium"
          value={kpi.premium}
          sub={`sur ${kpi.totalUsers} total`}
          icon={CreditCard} iconColor={V.gold} iconBg={V.goldDim}
          href="/admin/acces" loading={loading}
        />
        <KpiCard
          label="Paiements échoués"
          value={kpi.paiementsEchoues}
          sub={kpi.paiementsEchoues > 0 ? "À vérifier" : "RAS"}
          icon={AlertCircle}
          iconColor={kpi.paiementsEchoues > 0 ? "#f87171" : "#34d399"}
          iconBg={kpi.paiementsEchoues > 0 ? "rgba(248,113,113,0.09)" : "rgba(52,211,153,0.09)"}
          href="/admin/paiements" loading={loading}
        />
      </div>

      {/* ── Zone 3 : Graphiques commerciaux ──────────────────── */}
      <SectionLabel>Tendances — {period} derniers mois</SectionLabel>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Inscriptions */}
        <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[0.87rem] font-bold" style={{ color: V.text }}>Inscriptions</h2>
              <p className="text-[0.71rem]" style={{ color: V.textFaint }}>{period} derniers mois</p>
            </div>
            <UserPlus size={14} style={{ color: V.textFaint }} />
          </div>
          <div style={{ height: 200 }}>
            {loading
              ? <div className="h-full w-full animate-pulse rounded-xl" style={{ background: V.surface }} />
              : <Line data={lineInsc} options={lineOpts} />
            }
          </div>
        </div>

        {/* Revenus */}
        <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[0.87rem] font-bold" style={{ color: V.text }}>Revenus</h2>
              <p className="text-[0.71rem]" style={{ color: V.textFaint }}>{period} derniers mois</p>
            </div>
            <Wallet size={14} style={{ color: V.textFaint }} />
          </div>
          <div style={{ height: 200 }}>
            {loading
              ? <div className="h-full w-full animate-pulse rounded-xl" style={{ background: V.surface }} />
              : <Bar data={barRev} options={barOpts} />
            }
          </div>
        </div>
      </div>

      {/* ── Zone 4 : Répartition + Accès rapides ─────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Répartition */}
        <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[0.87rem] font-bold" style={{ color: V.text }}>Répartition</h2>
              <p className="text-[0.71rem]" style={{ color: V.textFaint }}>Gratuit vs Premium</p>
            </div>
            <Shield size={14} style={{ color: V.textFaint }} />
          </div>
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 140 }}>
              <div className="h-28 w-28 animate-pulse rounded-full" style={{ background: V.surface }} />
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <div style={{ height: 120, width: 120, flexShrink: 0 }}>
                <Doughnut data={donut} options={donutOpts} />
              </div>
              <div className="flex flex-col gap-3 text-[0.75rem]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: V.gold }} />
                  <span style={{ color: V.textSub }}>Premium</span>
                  <span className="ml-auto font-black tabular-nums" style={{ color: V.text }}>{kpi.premium}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}
                  />
                  <span style={{ color: V.textSub }}>Gratuit</span>
                  <span className="ml-auto font-black tabular-nums" style={{ color: V.text }}>{kpi.gratuit}</span>
                </div>
                <div className="border-t pt-2" style={{ borderColor: V.border }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: V.textFaint }}>Total</span>
                    <span className="ml-auto font-black tabular-nums" style={{ color: V.text }}>{kpi.totalUsers}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accès rapides — 2 colonnes */}
        <div className="rounded-2xl border p-5 lg:col-span-2" style={{ background: V.card, borderColor: V.border }}>
          <h2 className="mb-4 text-[0.87rem] font-bold" style={{ color: V.text }}>Accès rapides</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: "/admin/clients",   label: "Utilisateurs",  icon: Users,      color: V.gold    },
              { href: "/admin/acces",     label: "Abonnements",   icon: Shield,     color: "#a78bfa" },
              { href: "/admin/paiements", label: "Paiements",     icon: CreditCard, color: "#4ade80" },
              { href: "/admin/messages",  label: "Messages",      icon: Mail,       color: "#60a5fa" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2.5 rounded-xl border p-3.5 text-center text-[0.75rem] font-medium transition-all"
                style={{ borderColor: V.border, color: V.textSub }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = V.borderHov;
                  (e.currentTarget as HTMLAnchorElement).style.background = V.surfaceHov;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = V.border;
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={16} style={{ color, flexShrink: 0 }} strokeWidth={2} />
                </div>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Zone 5 : Activité récente ─────────────────────────── */}
      <SectionLabel>Activité récente</SectionLabel>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Messages récents */}
        <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={13} style={{ color: V.textFaint }} />
              <h2 className="text-[0.87rem] font-bold" style={{ color: V.text }}>Messages récents</h2>
              {kpi.messagesAttente > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[0.58rem] font-bold text-white">
                  {kpi.messagesAttente}
                </span>
              )}
            </div>
            <Link
              href="/admin/messages"
              className="flex items-center gap-1 text-[0.73rem] font-medium transition hover:opacity-80"
              style={{ color: V.gold }}
            >
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3">
                  <div className="h-8 w-8 rounded-xl" style={{ background: V.surface }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-28 rounded" style={{ background: V.surface }} />
                    <div className="h-2 w-40 rounded" style={{ background: V.border }} />
                  </div>
                  <div className="h-5 w-14 rounded-full" style={{ background: V.surface }} />
                </div>
              ))}
            </div>
          ) : recentMessages.length === 0 ? (
            <p className="py-6 text-center text-[0.8rem]" style={{ color: V.textFaint }}>Aucun message</p>
          ) : (
            <div className="space-y-2.5">
              {recentMessages.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[0.58rem] font-black"
                    style={{ background: "rgba(96,165,250,0.10)", color: "#60a5fa" }}
                  >
                    {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.81rem] font-semibold" style={{ color: V.text }}>{m.name}</p>
                    <p className="truncate text-[0.7rem]" style={{ color: V.textFaint }}>{m.subject || "—"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mb-1 text-[0.67rem]" style={{ color: V.textFaint }}>{formatDate(m.created_at)}</p>
                    <Badge s={m.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernières inscriptions */}
        <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={13} style={{ color: V.textFaint }} />
              <h2 className="text-[0.87rem] font-bold" style={{ color: V.text }}>Dernières inscriptions</h2>
            </div>
            <Link
              href="/admin/clients"
              className="flex items-center gap-1 text-[0.73rem] font-medium transition hover:opacity-80"
              style={{ color: V.gold }}
            >
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3">
                  <div className="h-8 w-8 rounded-xl" style={{ background: V.surface }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-28 rounded" style={{ background: V.surface }} />
                    <div className="h-2 w-36 rounded" style={{ background: V.border }} />
                  </div>
                  <div className="h-5 w-12 rounded-full" style={{ background: V.surface }} />
                </div>
              ))}
            </div>
          ) : recentClients.length === 0 ? (
            <p className="py-6 text-center text-[0.8rem]" style={{ color: V.textFaint }}>Aucun client</p>
          ) : (
            <div className="space-y-2.5">
              {recentClients.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[0.58rem] font-black"
                    style={{ background: V.goldDim, color: V.gold }}
                  >
                    {(c.name || c.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.81rem] font-semibold" style={{ color: V.text }}>{c.name || "—"}</p>
                    <p className="truncate text-[0.7rem]" style={{ color: V.textFaint }}>{c.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mb-1 text-[0.67rem]" style={{ color: V.textFaint }}>{formatDate(c.created_at)}</p>
                    <Badge s={c.statut ?? "—"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
