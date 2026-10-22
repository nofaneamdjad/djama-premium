"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Shield, RefreshCw, ChevronLeft, ChevronRight, Search, Filter, X } from "lucide-react";

const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";
const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type AuditEntry = {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  performer?: { id: string; first_name: string; last_name: string; job_title?: string } | null;
};

function ActionBadge({ action }: { action: string }) {
  let color = "#6b7280";
  let bg    = "rgba(107,114,128,0.1)";
  if (action.startsWith("approval.")) { color = "#8b5cf6"; bg = "rgba(139,92,246,0.1)"; }
  else if (action.includes("create") || action.includes("add") || action.includes("invite")) { color = "#22c55e"; bg = "rgba(34,197,94,0.1)"; }
  else if (action.includes("delete") || action.includes("remove") || action.includes("offboard")) { color = "#ef4444"; bg = "rgba(239,68,68,0.1)"; }
  else if (action.includes("update") || action.includes("change") || action.includes("toggle")) { color = "#f97316"; bg = "rgba(249,115,22,0.1)"; }
  else if (action.includes("login") || action.includes("auth")) { color = "#3b82f6"; bg = "rgba(59,130,246,0.1)"; }
  return (
    <span className="inline-block rounded-lg px-2 py-0.5 font-mono text-[0.66rem] font-semibold" style={{ color, background: bg }}>
      {action}
    </span>
  );
}

export default function AuditPage() {
  const [entries, setEntries]       = useState<AuditEntry[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [tick, setTick]             = useState(0);

  const [filters, setFilters] = useState({
    q: "", action: "", entity_type: "", date_from: "", date_to: "",
  });
  const [applied, setApplied] = useState({ ...filters });

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (applied.q)           p.set("q", applied.q);
    if (applied.action)      p.set("action", applied.action);
    if (applied.entity_type) p.set("entity_type", applied.entity_type);
    if (applied.date_from)   p.set("date_from", applied.date_from);
    if (applied.date_to)     p.set("date_to", applied.date_to);

    fetch(`/api/admin/hq/audit?${p}`)
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries ?? []);
        setTotal(d.total ?? 0);
        setPage(d.page ?? 1);
        setPages(d.pages ?? 1);
        setEntityTypes(d.filters?.entityTypes ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, applied, tick]);

  useEffect(() => { load(); }, [load]);

  function applyFilters() {
    setApplied({ ...filters });
    setPage(1);
  }

  function resetFilters() {
    const empty = { q: "", action: "", entity_type: "", date_from: "", date_to: "" };
    setFilters(empty);
    setApplied(empty);
    setPage(1);
  }

  const hasActiveFilters = Object.values(applied).some(v => v !== "");
  const inputCls = "w-full rounded-xl border bg-transparent px-3 py-2 text-[0.78rem] text-white/80 outline-none placeholder:text-white/25 focus:border-white/20";
  const inputStyle = { background: "rgba(255,255,255,0.03)", borderColor: BORDER };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Journal d'audit</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Journal d'audit</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">
            {total > 0 ? <><span className="text-white/60 font-medium">{total.toLocaleString("fr-FR")}</span> entrée{total > 1 ? "s" : ""}</> : "Aucune entrée"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTick(t => t + 1)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[0.78rem] text-white/35 hover:text-white/60 transition-colors"
            style={{ border: `1px solid ${BORDER}` }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowFilters(o => !o)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.8rem] font-semibold transition-opacity hover:opacity-80"
            style={{
              background: hasActiveFilters ? `rgba(${GOLDR},0.12)` : "rgba(255,255,255,0.04)",
              border: `1px solid ${hasActiveFilters ? `rgba(${GOLDR},0.3)` : BORDER}`,
              color: hasActiveFilters ? GOLD : "rgba(255,255,255,0.5)",
            }}>
            <Filter size={13} />
            Filtres{hasActiveFilters && " •"}
          </button>
        </div>
      </div>

      {/* Panneau filtres */}
      {showFilters && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-white/40">Filtres</span>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-[0.7rem] text-white/30 hover:text-white/60 transition-colors">
                <X size={11} /> Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/35">Recherche libre</label>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }}
                  value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
                  placeholder="action, type, ID…"
                  onKeyDown={e => { if (e.key === "Enter") applyFilters(); }} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/35">Action</label>
              <input className={inputCls} style={inputStyle}
                value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                placeholder="approval.created, login…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/35">Type d'entité</label>
              <select className={inputCls} style={{ ...inputStyle, color: "rgba(255,255,255,0.8)" }}
                value={filters.entity_type} onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))}>
                <option value="">Tous</option>
                {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/35">Date début</label>
              <input type="date" className={inputCls} style={{ ...inputStyle, color: "rgba(255,255,255,0.8)", colorScheme: "dark" }}
                value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/35">Date fin</label>
              <input type="date" className={inputCls} style={{ ...inputStyle, color: "rgba(255,255,255,0.8)", colorScheme: "dark" }}
                value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={applyFilters}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.78rem] font-semibold"
              style={{ background: `rgba(${GOLDR},0.12)`, border: `1px solid rgba(${GOLDR},0.25)`, color: GOLD }}>
              Appliquer
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
        {/* Header */}
        <div className="grid grid-cols-[1fr_140px_200px_140px] gap-0 border-b px-4 py-2.5"
          style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/25">Action / Entité</span>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/25">Type</span>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/25">Effectuée par</span>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/25 text-right">Date</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[0.8rem] text-white/25">Chargement…</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <Shield size={22} className="mx-auto mb-2 text-white/15" />
            <p className="text-[0.82rem] text-white/30">Aucune entrée</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {entries.map(e => (
              <div key={e.id} className="grid grid-cols-[1fr_140px_200px_140px] gap-0 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0 flex flex-col gap-1">
                  <ActionBadge action={e.action} />
                  {e.entity_id && (
                    <span className="font-mono text-[0.62rem] text-white/20 truncate">{e.entity_id}</span>
                  )}
                </div>
                <div className="flex items-start pt-0.5">
                  {e.entity_type ? (
                    <span className="text-[0.68rem] text-white/35 font-medium">{e.entity_type}</span>
                  ) : (
                    <span className="text-[0.68rem] text-white/15">—</span>
                  )}
                </div>
                <div className="flex items-start pt-0.5">
                  {e.performer ? (
                    <div>
                      <p className="text-[0.75rem] text-white/70 font-medium">{e.performer.first_name} {e.performer.last_name}</p>
                      {e.performer.job_title && <p className="text-[0.65rem] text-white/30">{e.performer.job_title}</p>}
                    </div>
                  ) : (
                    <span className="text-[0.68rem] text-white/20">Système</span>
                  )}
                </div>
                <div className="text-right pt-0.5">
                  <p className="text-[0.72rem] text-white/40">
                    {new Date(e.created_at).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="text-[0.65rem] text-white/20">
                    {new Date(e.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: BORDER }}>
            <span className="text-[0.72rem] text-white/30">
              Page {page} / {pages} — {total.toLocaleString("fr-FR")} entrée{total > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[0.75rem] disabled:opacity-30 hover:bg-white/5 transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.5)" }}>
                <ChevronLeft size={13} /> Préc.
              </button>
              <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}
                className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[0.75rem] disabled:opacity-30 hover:bg-white/5 transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.5)" }}>
                Suiv. <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
