"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, RefreshCw, Search, X, AlertTriangle, Info, CheckCircle } from "lucide-react";

const GOLD   = "#c9a55a";
const BORDER = "rgba(255,255,255,0.07)";
const CARD   = "#131620";

interface LogEntry {
  id:          string;
  action:      string;
  target_type: string | null;
  target_id:   string | null;
  details:     Record<string, unknown> | null;
  ip:          string | null;
  user_agent:  string | null;
  created_at:  string;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function actionBadge(action: string) {
  if (action.includes("login") || action.includes("auth"))
    return { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)", color: "#4ade80", icon: CheckCircle };
  if (action.includes("delete") || action.includes("ban") || action.includes("revoke"))
    return { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", color: "#ef4444", icon: AlertTriangle };
  return { bg: "rgba(201,165,90,0.1)", border: "rgba(201,165,90,0.25)", color: GOLD, icon: Info };
}

export default function SecuritePage() {
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [limit, setLimit]     = useState(100);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/admin/logs?limit=${limit}`);
      const data = await res.json() as { logs?: LogEntry[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setLogs(data.logs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { void load(); }, [load]);

  const filtered = logs.filter(l =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.ip ?? "").includes(search) ||
    (l.target_type ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: GOLD }} />
            Logs d&apos;audit
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Historique des actions administratives sur la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <option value={50}>50 derniers</option>
            <option value={100}>100 derniers</option>
            <option value={250}>250 derniers</option>
            <option value={500}>500 derniers</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition hover:text-white disabled:opacity-40"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
      >
        <Search size={13} className="shrink-0 text-white/25" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filtrer par action, IP, type..."
          className="flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-white/25 hover:text-white/50">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${BORDER}` }}>
                <th className="px-4 py-3 text-left font-semibold text-white/30 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-white/30 uppercase tracking-wider">Cible</th>
                <th className="px-4 py-3 text-left font-semibold text-white/30 uppercase tracking-wider">IP</th>
                <th className="px-4 py-3 text-left font-semibold text-white/30 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-white/25">Chargement...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-white/25">
                    {logs.length === 0 ? "Aucun log disponible" : "Aucun résultat pour ce filtre"}
                  </td>
                </tr>
              )}
              {filtered.map((log, i) => {
                const badge = actionBadge(log.action);
                const Icon  = badge.icon;
                return (
                  <tr
                    key={log.id}
                    style={{
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium"
                        style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}
                      >
                        <Icon size={10} />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {log.target_type && (
                        <span>
                          <span className="text-white/30">{log.target_type}</span>
                          {log.target_id && <span className="ml-1 font-mono text-[0.65rem] text-white/25">{log.target_id.slice(0, 8)}…</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-white/30">{log.ip ?? "—"}</td>
                    <td className="px-4 py-3 text-white/40">{fmtDate(log.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && (
        <p className="text-right text-xs text-white/25">
          {filtered.length} / {logs.length} entrée{logs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
