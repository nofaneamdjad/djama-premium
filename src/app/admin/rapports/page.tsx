"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3, RefreshCw, Loader2, ShieldCheck,
  Bug, Flame, MessageSquare, Heart,
} from "lucide-react";
import { V } from "@/components/hq";

interface Rapports {
  generated_at:  string;
  health_score:  number;
  support: {
    total: number; open: number; in_progress: number;
    resolved: number; critical: number; this_month: number; this_week: number;
  };
  incidents: { total: number; open: number; critical: number; this_month: number; };
  bugs:      { total: number; open: number; critical: number; fixed: number; this_month: number; };
  audit:     { total: number; critical: number; warning: number; this_month: number; this_week: number; };
}

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

function HealthRing({ score }: { score: number }) {
  const color = score >= 80 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";
  const r = 40, c = Math.PI * 2 * r;
  const dash = (score / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={104} height={104} viewBox="0 0 104 104">
        <circle cx={52} cy={52} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={52} cy={52} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          transform="rotate(-90 52 52)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
        <text x={52} y={52} textAnchor="middle" dominantBaseline="central"
          fontSize={20} fontWeight={900} fill={color}>{score}</text>
      </svg>
      <p className="text-[0.72rem] font-bold uppercase tracking-wide" style={{ color }}>
        {score >= 80 ? "Bonne santé" : score >= 50 ? "Attention requise" : "Critique"}
      </p>
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <span className="text-[0.8rem]" style={{ color: V.textMuted }}>{label}</span>
      <div className="text-right">
        <span className="text-[0.88rem] font-bold" style={{ color: V.text }}>{value}</span>
        {sub && <span className="ml-1.5 text-[0.72rem]" style={{ color: V.textFaint }}>{sub}</span>}
      </div>
    </div>
  );
}

function ModuleCard({
  title, icon: Icon, color, children,
}: { title: string; icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 flex items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <p className="text-[0.84rem] font-bold" style={{ color: V.text }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function RapportsPage() {
  const [data,    setData]    = useState<Rapports | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/rapports");
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      setData(await r.json());
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black" style={{ color: V.text }}>
            <BarChart3 size={18} style={{ color: V.gold }} /> Rapport d&apos;exploitation
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            Vue consolidée — support, incidents, bugs, sécurité
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.generated_at && (
            <p className="text-[0.72rem]" style={{ color: V.textFaint }}>
              Généré le {fmt(data.generated_at)}
            </p>
          )}
          <button onClick={() => load(true)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] transition disabled:opacity-40"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)", color: "#f87171" }}>
          {err}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: V.gold }} />
        </div>
      ) : data ? (
        <>
          {/* Health score + summary */}
          <div className="rounded-2xl border p-6 flex flex-wrap items-center gap-8"
            style={{ background: V.card, borderColor: V.border }}>
            <HealthRing score={data.health_score} />
            <div className="flex-1 min-w-[200px] grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Tickets ouverts",    value: data.support.open,          color: data.support.open > 0 ? "#fbbf24" : "#4ade80" },
                { label: "Incidents actifs",   value: data.incidents.open,        color: data.incidents.open > 0 ? "#f87171" : "#4ade80" },
                { label: "Bugs ouverts",       value: data.bugs.open,             color: data.bugs.open > 5 ? "#fbbf24" : "#4ade80"      },
                { label: "Alertes critiques",  value: data.audit.critical,        color: data.audit.critical > 0 ? "#f87171" : "#4ade80" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[1.5rem] font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-wide mt-0.5" style={{ color: V.textFaint }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4 module cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <ModuleCard title="Support tickets" icon={MessageSquare} color="#60a5fa">
              <StatRow label="Total"              value={data.support.total} />
              <StatRow label="Ouverts"            value={data.support.open} />
              <StatRow label="En cours"           value={data.support.in_progress} />
              <StatRow label="Résolus"            value={data.support.resolved} />
              <StatRow label="Priorité critique"  value={data.support.critical} />
              <StatRow label="Ce mois"            value={data.support.this_month} />
              <StatRow label="Cette semaine"      value={data.support.this_week} />
            </ModuleCard>

            <ModuleCard title="Incidents" icon={Flame} color="#f87171">
              <StatRow label="Total"              value={data.incidents.total} />
              <StatRow label="Actifs"             value={data.incidents.open} />
              <StatRow label="Critiques"          value={data.incidents.critical} />
              <StatRow label="Ce mois"            value={data.incidents.this_month} />
            </ModuleCard>

            <ModuleCard title="Bugs" icon={Bug} color="#fb923c">
              <StatRow label="Total"              value={data.bugs.total} />
              <StatRow label="Ouverts"            value={data.bugs.open} />
              <StatRow label="Critiques"          value={data.bugs.critical} />
              <StatRow label="Corrigés"           value={data.bugs.fixed} />
              <StatRow label="Ce mois"            value={data.bugs.this_month} />
            </ModuleCard>

            <ModuleCard title="Journal d'audit" icon={ShieldCheck} color={V.gold}>
              <StatRow label="Total (500 derniers)"  value={data.audit.total} />
              <StatRow label="Événements critiques"  value={data.audit.critical} />
              <StatRow label="Avertissements"        value={data.audit.warning} />
              <StatRow label="Ce mois"               value={data.audit.this_month} />
              <StatRow label="Cette semaine"         value={data.audit.this_week} />
            </ModuleCard>

          </div>

          {/* Score legend */}
          <div className="rounded-xl border px-4 py-3 flex flex-wrap gap-4"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: V.border }}>
            <div className="flex items-center gap-2">
              <Heart size={12} style={{ color: V.textFaint }} />
              <p className="text-[0.74rem]" style={{ color: V.textFaint }}>
                Score santé = 100 − pénalités (incidents actifs, bugs critiques, tickets critiques, alertes d&apos;audit)
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
