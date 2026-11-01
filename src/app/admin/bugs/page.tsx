"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bug, RefreshCw, Loader2, Search, X, ChevronDown,
  AlertTriangle, CheckCircle2, Clock, Flame,
} from "lucide-react";
import { V } from "@/components/hq";

interface BugReport {
  id: string; title: string; description: string;
  steps: string | null; severity: string; status: string;
  reported_by: string | null; user_id: string | null;
  url: string | null; browser: string | null;
  assigned_to: string | null; fixed_in: string | null;
  created_at: string; updated_at: string;
}
interface Stats { total: number; new_bugs: number; in_progress: number; fixed: number; critical: number; }

const SEV_COLOR: Record<string, string> = {
  low: "#4ade80", medium: "#fbbf24", high: "#f97316", critical: "#f87171",
};
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  new:         { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa" },
  confirmed:   { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24" },
  in_progress: { bg: "rgba(251,146,60,0.12)",  text: "#fb923c" },
  fixed:       { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
  wontfix:     { bg: "rgba(255,255,255,0.05)", text: "#6b7280" },
};
const STATUS_LABEL: Record<string, string> = {
  new: "Nouveau", confirmed: "Confirmé", in_progress: "En cours", fixed: "Corrigé", wontfix: "Won't fix",
};

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

export default function BugsPage() {
  const [bugs,      setBugs]     = useState<BugReport[]>([]);
  const [stats,     setStats]    = useState<Stats | null>(null);
  const [loading,   setLoading]  = useState(true);
  const [err,       setErr]      = useState<string | null>(null);
  const [filterS,   setFilterS]  = useState("");
  const [filterSev, setFilterSev]= useState("");
  const [search,    setSearch]   = useState("");
  const [selected,  setSelected] = useState<BugReport | null>(null);
  const [editing,   setEditing]  = useState<{ status?: string; assigned_to?: string; fixed_in?: string }>({});
  const [saving,    setSaving]   = useState(false);
  const [saveErr,   setSaveErr]  = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const p = new URLSearchParams();
      if (filterS)   p.set("status",   filterS);
      if (filterSev) p.set("severity", filterSev);
      if (search)    p.set("q",        search);
      const r = await fetch(`/api/admin/bugs?${p}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setBugs(d.bugs ?? []);
      setStats(d.stats ?? null);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, [filterS, filterSev, search]);

  useEffect(() => { load(); }, [load]);

  function openBug(bug: BugReport) {
    setSelected(bug);
    setEditing({ status: bug.status, assigned_to: bug.assigned_to ?? "", fixed_in: bug.fixed_in ?? "" });
    setSaveErr(null);
  }

  async function save() {
    if (!selected) return;
    setSaving(true); setSaveErr(null);
    try {
      const payload: Record<string, string> = { id: selected.id };
      if (editing.status)      payload.status      = editing.status;
      if (editing.assigned_to) payload.assigned_to = editing.assigned_to;
      if (editing.fixed_in)    payload.fixed_in    = editing.fixed_in;
      const r = await fetch("/api/admin/bugs", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      setSelected(null);
      await load(true);
    } catch (e) { setSaveErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setSaving(false); }
  }

  const TILES = [
    { label: "Total",       value: stats?.total ?? 0,       color: V.gold,    icon: Bug          },
    { label: "Nouveaux",    value: stats?.new_bugs ?? 0,    color: "#60a5fa", icon: AlertTriangle },
    { label: "En cours",    value: stats?.in_progress ?? 0, color: "#fb923c", icon: Clock        },
    { label: "Corrigés",    value: stats?.fixed ?? 0,       color: "#4ade80", icon: CheckCircle2 },
    { label: "Critiques",   value: stats?.critical ?? 0,    color: "#f87171", icon: Flame        },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black" style={{ color: V.text }}>
            <Bug size={18} style={{ color: V.gold }} /> Rapports de bugs
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>Bugs remontés par les utilisateurs</p>
        </div>
        <button onClick={() => load(true)} disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] transition disabled:opacity-40"
          style={{ borderColor: V.border, color: V.textMuted }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Actualiser
        </button>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-xl border bg-transparent pl-9 pr-3 py-2 text-[0.82rem] outline-none"
            style={{ borderColor: V.border, color: V.text }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={11} style={{ color: V.textFaint }} />
            </button>
          )}
        </div>
        {/* Status filter */}
        <div className="relative">
          <select value={filterS} onChange={e => setFilterS(e.target.value)}
            className="rounded-xl border bg-transparent pl-3 pr-7 py-2 text-[0.78rem] appearance-none outline-none"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <option value="">Tous statuts</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
        </div>
        {/* Severity filter */}
        <div className="relative">
          <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
            className="rounded-xl border bg-transparent pl-3 pr-7 py-2 text-[0.78rem] appearance-none outline-none"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <option value="">Toutes sévérités</option>
            {["low","medium","high","critical"].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
        </div>
      </div>

      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)", color: "#f87171" }}>
          {err}
        </div>
      )}

      {/* Main area: table + side panel */}
      <div className="flex gap-4 items-start">

        {/* Table */}
        <div className="flex-1 min-w-0 overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
            </div>
          ) : bugs.length === 0 ? (
            <div className="flex flex-col items-center py-14">
              <Bug size={28} style={{ color: V.textFaint }} />
              <p className="mt-3 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>Aucun bug</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                    {["Titre", "Sév.", "Statut", "Signalé par", "Date"].map(h => (
                      <th key={h} className="px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                        style={{ color: V.textFaint }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {bugs.map(bug => {
                    const sc  = STATUS_STYLE[bug.status] ?? STATUS_STYLE.new;
                    const sev = SEV_COLOR[bug.severity] ?? "#fbbf24";
                    const isSel = selected?.id === bug.id;
                    return (
                      <tr key={bug.id}
                        onClick={() => openBug(bug)}
                        style={{ background: isSel ? "rgba(255,255,255,0.025)" : "transparent", cursor: "pointer" }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.015)"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                        className="transition-colors">
                        <td className="px-4 py-4 max-w-[220px]">
                          <p className="text-[0.83rem] font-semibold truncate" style={{ color: V.text }}>{bug.title}</p>
                          {bug.url && (
                            <p className="text-[0.7rem] truncate mt-0.5" style={{ color: V.textFaint }}>{bug.url}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 text-[0.74rem] font-semibold" style={{ color: sev }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: sev }} />
                            {bug.severity}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold"
                            style={{ background: sc.bg, color: sc.text }}>
                            {STATUS_LABEL[bug.status] ?? bug.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[0.76rem]" style={{ color: V.textMuted }}>
                          {bug.reported_by ?? bug.user_id?.slice(0, 8) ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-[0.73rem]" style={{ color: V.textFaint }}>
                          {fmt(bug.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side panel */}
        {selected && (
          <div className="w-[340px] flex-shrink-0 rounded-2xl border p-5 space-y-4"
            style={{ background: V.card, borderColor: V.goldBorder }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[0.86rem] font-bold leading-snug" style={{ color: V.text }}>{selected.title}</p>
              <button onClick={() => setSelected(null)} style={{ color: V.textFaint }}>
                <X size={14} />
              </button>
            </div>

            <p className="text-[0.78rem]" style={{ color: V.textMuted }}>{selected.description}</p>

            {selected.steps && (
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-wide mb-1" style={{ color: V.textFaint }}>Étapes</p>
                <p className="text-[0.76rem]" style={{ color: V.textSub }}>{selected.steps}</p>
              </div>
            )}

            {(selected.url || selected.browser) && (
              <div className="flex gap-3 text-[0.73rem]" style={{ color: V.textFaint }}>
                {selected.url && <span className="truncate">{selected.url}</span>}
                {selected.browser && <span>{selected.browser}</span>}
              </div>
            )}

            <div className="border-t pt-4 space-y-3" style={{ borderColor: V.border }}>
              <p className="text-[0.72rem] font-bold uppercase tracking-wide" style={{ color: V.textFaint }}>Mettre à jour</p>

              <div className="relative">
                <select value={editing.status ?? selected.status}
                  onChange={e => setEditing(ed => ({ ...ed, status: e.target.value }))}
                  className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] appearance-none outline-none"
                  style={{ borderColor: V.border, color: V.text }}>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
              </div>

              <input value={editing.assigned_to ?? ""}
                onChange={e => setEditing(ed => ({ ...ed, assigned_to: e.target.value }))}
                placeholder="Assigné à (email)"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />

              <input value={editing.fixed_in ?? ""}
                onChange={e => setEditing(ed => ({ ...ed, fixed_in: e.target.value }))}
                placeholder="Corrigé dans (ex: v1.2.3)"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />
            </div>

            {saveErr && <p className="text-[0.76rem] text-[#f87171]">{saveErr}</p>}

            <button onClick={save} disabled={saving}
              className="w-full rounded-xl px-4 py-2.5 text-[0.82rem] font-bold transition disabled:opacity-50"
              style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}>
              {saving ? <Loader2 size={13} className="animate-spin inline mr-1.5" /> : null}
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
