"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Flame, RefreshCw, Loader2, Plus, X, AlertTriangle,
  CheckCircle2, Clock, Search, ChevronDown,
} from "lucide-react";
import { V } from "@/components/hq";

interface Incident {
  id: string; title: string; description: string | null;
  severity: string; status: string;
  affected: string[] | null; created_by: string | null;
  started_at: string; resolved_at: string | null; created_at: string;
}
interface Stats { total: number; open: number; investigating: number; resolved: number; critical: number; }

const SEV_COLOR: Record<string, string> = {
  low: "#4ade80", medium: "#fbbf24", high: "#f97316", critical: "#f87171",
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open:          { bg: "rgba(248,113,113,0.12)", text: "#f87171" },
  investigating: { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24" },
  resolved:      { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
  postmortem:    { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa" },
};
const STATUS_LABEL: Record<string, string> = {
  open: "Actif", investigating: "Investigation", resolved: "Résolu", postmortem: "Post-mortem",
};

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState<string | null>(null);
  const [filterS,   setFilterS]   = useState("");
  const [search,    setSearch]    = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [fTitle,    setFTitle]    = useState("");
  const [fDesc,     setFDesc]     = useState("");
  const [fSev,      setFSev]      = useState("medium");
  const [fSaving,   setFSaving]   = useState(false);
  const [fErr,      setFErr]      = useState<string | null>(null);
  const [acting,    setActing]    = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const p = new URLSearchParams();
      if (filterS) p.set("status", filterS);
      const r = await fetch(`/api/admin/incidents?${p}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setIncidents(d.incidents ?? []);
      setStats(d.stats ?? null);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, [filterS]);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFSaving(true); setFErr(null);
    try {
      const r = await fetch("/api/admin/incidents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: fTitle, description: fDesc, severity: fSev }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      setShowForm(false); setFTitle(""); setFDesc(""); setFSev("medium");
      await load(true);
    } catch (e) { setFErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setFSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    setActing(id);
    try {
      const r = await fetch("/api/admin/incidents", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (r.ok) await load(true);
    } finally { setActing(null); }
  }

  const filtered = incidents.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase())
  );

  const TILES = [
    { label: "Total",          value: stats?.total ?? 0,         color: V.gold,    icon: Flame         },
    { label: "Actifs",         value: stats?.open ?? 0,          color: "#f87171", icon: AlertTriangle },
    { label: "Investigation",  value: stats?.investigating ?? 0,  color: "#fbbf24", icon: Clock         },
    { label: "Résolus",        value: stats?.resolved ?? 0,       color: "#4ade80", icon: CheckCircle2  },
    { label: "Critiques",      value: stats?.critical ?? 0,       color: "#f87171", icon: Flame         },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black" style={{ color: V.text }}>
            <Flame size={18} style={{ color: V.gold }} /> Incidents
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>Supervision des incidents de production</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(true)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] transition disabled:opacity-40"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[0.78rem] font-semibold transition"
            style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}>
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? "Annuler" : "Nouvel incident"}
          </button>
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {TILES.map(s => (
          <div key={s.label} className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: V.card, borderColor: V.border }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${s.color}18` }}>
              <s.icon size={13} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[0.69rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>{s.label}</p>
              {loading
                ? <div className="h-5 w-7 rounded animate-pulse" style={{ background: V.surface }} />
                : <p className="text-[1.1rem] font-black" style={{ color: s.color }}>{s.value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={create} className="rounded-2xl border p-5 space-y-3"
          style={{ background: V.card, borderColor: V.goldBorder }}>
          <p className="text-[0.84rem] font-bold" style={{ color: V.text }}>Déclarer un incident</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <input value={fTitle} onChange={e => setFTitle(e.target.value)} required
                placeholder="Titre de l'incident *"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />
            </div>
            <div className="relative">
              <select value={fSev} onChange={e => setFSev(e.target.value)}
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] appearance-none outline-none"
                style={{ borderColor: V.border, color: V.text }}>
                <option value="low">Faible</option>
                <option value="medium">Moyen</option>
                <option value="high">Élevé</option>
                <option value="critical">Critique</option>
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
            </div>
          </div>
          <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2}
            placeholder="Description (optionnel)"
            className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none resize-none"
            style={{ borderColor: V.border, color: V.text }} />
          {fErr && <p className="text-[0.78rem] text-[#f87171]">{fErr}</p>}
          <button type="submit" disabled={fSaving}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.82rem] font-bold transition disabled:opacity-50"
            style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}>
            {fSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Déclarer
          </button>
        </form>
      )}

      {/* Filter + Search */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-xl border bg-transparent pl-9 pr-3 py-2 text-[0.82rem] outline-none"
            style={{ borderColor: V.border, color: V.text }} />
        </div>
        {["", "open", "investigating", "resolved"].map(s => (
          <button key={s} onClick={() => setFilterS(s)}
            className="rounded-xl border px-3 py-2 text-[0.78rem] font-semibold transition"
            style={{
              borderColor: filterS === s ? V.goldBorder : V.border,
              background:  filterS === s ? V.goldDim    : "transparent",
              color:       filterS === s ? V.gold       : V.textMuted,
            }}>
            {s === "" ? "Tous" : STATUS_LABEL[s] ?? s}
          </button>
        ))}
      </div>

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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14">
            <Flame size={28} style={{ color: V.textFaint }} />
            <p className="mt-3 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>Aucun incident</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                  {["Titre", "Sévérité", "Statut", "Déclaré le", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: V.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {filtered.map(inc => {
                  const sc = STATUS_COLOR[inc.status] ?? STATUS_COLOR.open;
                  const sc2 = SEV_COLOR[inc.severity] ?? "#fbbf24";
                  return (
                    <tr key={inc.id}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      className="transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-[0.84rem] font-semibold" style={{ color: V.text }}>{inc.title}</p>
                        {inc.description && (
                          <p className="text-[0.73rem] mt-0.5 truncate max-w-[240px]" style={{ color: V.textFaint }}>{inc.description}</p>
                        )}
                        {inc.affected && inc.affected.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {inc.affected.map(a => (
                              <span key={a} className="text-[0.66rem] rounded px-1.5 py-0.5"
                                style={{ background: "rgba(255,255,255,0.05)", color: V.textFaint }}>{a}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[0.76rem] font-semibold" style={{ color: sc2 }}>
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: sc2 }} />
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold"
                          style={{ background: sc.bg, color: sc.text }}>
                          {STATUS_LABEL[inc.status] ?? inc.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[0.76rem]" style={{ color: V.textFaint }}>
                        {fmt(inc.started_at)}
                        {inc.resolved_at && (
                          <p className="text-[#4ade80] text-[0.7rem]">Résolu {fmt(inc.resolved_at)}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {inc.status !== "resolved" && (
                            <button
                              onClick={() => updateStatus(inc.id, "resolved")}
                              disabled={acting === inc.id}
                              className="rounded-lg border px-2.5 py-1 text-[0.72rem] font-semibold transition"
                              style={{ borderColor: "rgba(74,222,128,0.25)", color: "#4ade80", background: "rgba(74,222,128,0.08)" }}>
                              {acting === inc.id
                                ? <Loader2 size={11} className="animate-spin inline" />
                                : "✓ Résoudre"}
                            </button>
                          )}
                          {inc.status === "open" && (
                            <button
                              onClick={() => updateStatus(inc.id, "investigating")}
                              disabled={acting === inc.id}
                              className="rounded-lg border px-2.5 py-1 text-[0.72rem] font-semibold transition"
                              style={{ borderColor: "rgba(251,191,36,0.25)", color: "#fbbf24", background: "rgba(251,191,36,0.08)" }}>
                              Investiguer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
