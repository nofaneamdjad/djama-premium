"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck, RefreshCw, Search, X, Loader2,
  AlertTriangle, Info, CheckCircle2, Flame, ChevronDown,
} from "lucide-react";
import { V } from "@/components/hq";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string; admin_email: string | null; action: string;
  resource: string | null; resource_id: string | null;
  details: Record<string, unknown> | null;
  severity: "info" | "warning" | "critical" | null;
  created_at: string;
}
interface Stats { total: number; info: number; warning: number; critical: number; }
type Sev = "" | "info" | "warning" | "critical";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEV_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  info:     { bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.2)",  text: "#60a5fa" },
  warning:  { bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.2)",  text: "#fbbf24" },
  critical: { bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.2)", text: "#f87171" },
};
const SEV_ICON = {
  info: Info, warning: AlertTriangle, critical: Flame,
};

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SecuritePage() {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);
  const [search,  setSearch]  = useState("");
  const [sev,     setSev]     = useState<Sev>("");
  const [limit,   setLimit]   = useState(100);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const p = new URLSearchParams({ limit: String(limit) });
      if (sev)    p.set("severity", sev);
      if (search) p.set("q", search);
      const r = await fetch(`/api/admin/audit?${p}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setLogs(d.logs ?? []);
      setStats(d.stats ?? null);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, [limit, sev, search]);

  useEffect(() => { load(); }, [load]);

  const TILES = [
    { label: "Total",    value: stats?.total ?? 0,    color: V.gold,    icon: ShieldCheck  },
    { label: "Info",     value: stats?.info ?? 0,     color: "#60a5fa", icon: Info         },
    { label: "Warning",  value: stats?.warning ?? 0,  color: "#fbbf24", icon: AlertTriangle},
    { label: "Critique", value: stats?.critical ?? 0, color: "#f87171", icon: Flame        },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black" style={{ color: V.text }}>
            <ShieldCheck size={18} style={{ color: V.gold }} /> Journal d'audit
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            Historique des actions administratives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={limit} onChange={e => setLimit(Number(e.target.value))}
              className="rounded-xl border bg-transparent pl-3 pr-7 py-2 text-[0.78rem] appearance-none outline-none"
              style={{ borderColor: V.border, color: V.textMuted }}>
              {[50, 100, 250, 500].map(n => <option key={n} value={n}>{n} entrées</option>)}
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
          </div>
          <button onClick={() => load(true)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] transition disabled:opacity-40"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILES.map(s => (
          <div key={s.label} className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: V.card, borderColor: V.border }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: `${s.color}18` }}>
              <s.icon size={13} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>{s.label}</p>
              {loading
                ? <div className="h-5 w-8 rounded animate-pulse" style={{ background: V.surface }} />
                : <p className="text-[1.1rem] font-black" style={{ color: s.color }}>{s.value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filtrer action, admin, ressource…"
            className="w-full rounded-xl border bg-transparent pl-9 pr-3 py-2 text-[0.82rem] outline-none"
            style={{ borderColor: V.border, color: V.text }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: V.textFaint }}>
              <X size={12} />
            </button>
          )}
        </div>
        {(["", "info", "warning", "critical"] as Sev[]).map(s => (
          <button key={s} onClick={() => setSev(s)}
            className="rounded-xl border px-3 py-2 text-[0.78rem] font-semibold transition"
            style={{
              borderColor: sev === s ? V.goldBorder : V.border,
              background:  sev === s ? V.goldDim    : "transparent",
              color:       sev === s ? V.gold       : V.textMuted,
            }}>
            {s === "" ? "Tous" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)", color: "#f87171" }}>
          {err}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <ShieldCheck size={28} style={{ color: V.textFaint }} />
            <p className="mt-3 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>Aucun log</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                  {["Sévérité", "Action", "Admin", "Ressource", "Date", ""].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: V.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {logs.map(log => {
                  const s = log.severity ?? "info";
                  const style = SEV_STYLE[s] ?? SEV_STYLE.info;
                  const Icon  = SEV_ICON[s as keyof typeof SEV_ICON] ?? Info;
                  const hasDetails = log.details && Object.keys(log.details).length > 0;
                  const isExp = expanded === log.id;
                  return (
                    <>
                      <tr key={log.id}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        className="transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold border"
                            style={{ background: style.bg, borderColor: style.border, color: style.text }}>
                            <Icon size={10} />{s}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[0.8rem] font-mono font-semibold" style={{ color: V.text }}>{log.action}</span>
                        </td>
                        <td className="px-4 py-3.5 text-[0.78rem]" style={{ color: V.textMuted }}>
                          {log.admin_email ?? "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {log.resource ? (
                            <span className="text-[0.76rem]" style={{ color: V.textSub }}>
                              {log.resource}
                              {log.resource_id && <span className="ml-1 font-mono text-[0.65rem]" style={{ color: V.textFaint }}>{log.resource_id.slice(0, 8)}…</span>}
                            </span>
                          ) : <span style={{ color: V.textFaint }}>—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-[0.76rem]" style={{ color: V.textFaint }}>
                          {fmt(log.created_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          {hasDetails && (
                            <button onClick={() => setExpanded(isExp ? null : log.id)}
                              className="text-[0.72rem] font-medium transition"
                              style={{ color: isExp ? V.gold : V.textFaint }}>
                              {isExp ? "Masquer" : "Détails"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExp && hasDetails && (
                        <tr key={`${log.id}-exp`} style={{ background: "rgba(255,255,255,0.015)" }}>
                          <td colSpan={6} className="px-4 py-3">
                            <pre className="text-[0.72rem] overflow-x-auto rounded-lg p-3"
                              style={{ background: "rgba(0,0,0,0.2)", color: V.textMuted }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-right text-[0.72rem]" style={{ color: V.textFaint }}>
          {logs.length} entrée{logs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
