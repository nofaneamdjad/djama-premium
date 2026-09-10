"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw, Filter } from "lucide-react";

const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";
const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";

interface LogEntry {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function actionColor(action: string) {
  if (action.includes("delete") || action.includes("bloquer")) return "#f87171";
  if (action.includes("paye") || action.includes("create") || action.includes("activ")) return "#4ade80";
  if (action.includes("update") || action.includes("patch")) return "#fbbf24";
  return "#60a5fa";
}

export default function ActivitePage() {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? logs : logs.filter(l => l.target_type === filter);
  const types = [...new Set(logs.map(l => l.target_type).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.15rem] font-black tracking-tight text-white">Journal d&apos;activité</h1>
          <p className="mt-0.5 text-[0.75rem] text-white/35">Toutes les actions administratives</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium text-white/40 transition hover:border-white/20 hover:text-white/70"
          style={{ borderColor: BORDER }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {["all", ...types].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.74rem] font-medium transition ${
              filter === t ? "border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.08)] text-[#c9a55a]" : "text-white/40 hover:border-white/20 hover:text-white/60"
            }`}
            style={{ borderColor: filter === t ? `rgba(${GOLDR},0.4)` : BORDER }}
          >
            <Filter size={10} />
            {t === "all" ? "Tout" : t}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
        {loading ? (
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 border-b px-5 py-3.5" style={{ borderColor: BORDER }}>
                <div className="h-2 w-2 rounded-full bg-white/[0.08]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 rounded bg-white/[0.07]" />
                  <div className="h-2 w-24 rounded bg-white/[0.04]" />
                </div>
                <div className="h-2.5 w-20 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Activity size={28} className="text-white/15" />
            <p className="text-[0.85rem] font-semibold text-white/30">Aucune activité enregistrée</p>
            <p className="text-[0.74rem] text-white/20">Les actions admin apparaîtront ici</p>
          </div>
        ) : (
          <div>
            {filtered.map((log, i) => {
              const color = actionColor(log.action);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 border-b px-5 py-3.5 transition hover:bg-white/[0.015]"
                  style={{ borderColor: i === filtered.length - 1 ? "transparent" : BORDER }}
                >
                  <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-semibold text-white/75">{log.action}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      {log.target_type && (
                        <span className="text-[0.68rem] text-white/30">{log.target_type}</span>
                      )}
                      {log.target_id && (
                        <code className="text-[0.65rem] text-white/25">{String(log.target_id).slice(0, 20)}</code>
                      )}
                      {log.ip && <span className="text-[0.65rem] text-white/20">IP: {log.ip}</span>}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="mt-1 truncate text-[0.68rem] text-white/20">
                        {JSON.stringify(log.details).slice(0, 80)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[0.7rem] text-white/25">{fmtDateTime(log.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
