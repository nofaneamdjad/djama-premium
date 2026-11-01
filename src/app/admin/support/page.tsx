"use client";

import { useEffect, useState, useCallback } from "react";
import {
  HeadphonesIcon, RefreshCw, Search, X, Send, Loader2,
  MessageSquare, Clock, CheckCircle2, AlertTriangle, Flame,
  ChevronDown,
} from "lucide-react";
import { V } from "@/components/hq";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status   = "open" | "in_progress" | "resolved" | "closed";
type Priority = "low" | "normal" | "high" | "critical" | "urgent";

interface Ticket {
  id: string; email: string; subject: string; message: string;
  status: Status; priority: Priority;
  admin_reply: string | null; replied_at: string | null;
  created_at: string; updated_at: string; category: string | null;
}
interface Stats { total: number; open: number; in_progress: number; resolved: number; critical: number; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé",
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open:        { bg: "rgba(248,113,113,0.12)", text: "#f87171" },
  in_progress: { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24" },
  resolved:    { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
  closed:      { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.3)" },
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "#6b7280", normal: "#60a5fa", high: "#fbbf24", critical: "#f87171", urgent: "#f87171",
};

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState<string | null>(null);
  const [search,   setSearch]   = useState("");
  const [filterS,  setFilterS]  = useState("");
  const [filterP,  setFilterP]  = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply,    setReply]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const p = new URLSearchParams({ limit: "300" });
      if (filterS) p.set("status", filterS);
      if (filterP) p.set("priority", filterP);
      if (search)  p.set("q", search);
      const r = await fetch(`/api/admin/support?${p}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setTickets(d.tickets ?? []);
      setStats(d.stats ?? null);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, [filterS, filterP, search]);

  useEffect(() => { load(); }, [load]);

  async function patch(id: string, updates: Record<string, string | undefined>) {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      showToast("Ticket mis à jour ✓");
      if (updates.admin_reply !== undefined) setReply("");
      setSelected(prev => prev?.id === id ? { ...prev, ...updates, updated_at: new Date().toISOString() } as Ticket : prev);
      await load(true);
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "?"}`); }
    finally { setSaving(false); }
  }

  const STAT_TILES = [
    { label: "Total",    value: stats?.total ?? 0,       color: V.gold,    icon: MessageSquare  },
    { label: "Ouverts",  value: stats?.open ?? 0,        color: "#f87171", icon: AlertTriangle  },
    { label: "En cours", value: stats?.in_progress ?? 0, color: "#fbbf24", icon: Clock          },
    { label: "Résolus",  value: stats?.resolved ?? 0,    color: "#4ade80", icon: CheckCircle2   },
    { label: "Critiques",value: stats?.critical ?? 0,    color: "#f87171", icon: Flame          },
  ];

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-xl border px-4 py-2.5 text-[0.82rem] font-semibold shadow-xl"
          style={{ background: V.card, borderColor: V.goldBorder, color: V.gold }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black" style={{ color: V.text }}>
            <HeadphonesIcon size={18} style={{ color: V.gold }} /> Support
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            Tickets d'assistance clients
          </p>
        </div>
        <button onClick={() => load(true)} disabled={loading}
          className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[0.8rem] transition disabled:opacity-40"
          style={{ borderColor: V.border, color: V.textMuted }}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {STAT_TILES.map(s => (
          <div key={s.label} className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: V.card, borderColor: V.border }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${s.color}18` }}>
              <s.icon size={14} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>{s.label}</p>
              {loading
                ? <div className="h-5 w-8 rounded animate-pulse" style={{ background: V.surface }} />
                : <p className="text-[1.15rem] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)", color: "#f87171" }}>
          {err}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher email, sujet…"
            className="w-full rounded-xl border bg-transparent pl-9 pr-3 py-2 text-[0.82rem] outline-none"
            style={{ borderColor: V.border, color: V.text }} />
        </div>
        <div className="relative">
          <select value={filterS} onChange={e => setFilterS(e.target.value)}
            className="rounded-xl border bg-transparent pl-3 pr-7 py-2 text-[0.8rem] appearance-none outline-none cursor-pointer"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <option value="">Tous les statuts</option>
            <option value="open">Ouverts</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolus</option>
            <option value="closed">Fermés</option>
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
        </div>
        <div className="relative">
          <select value={filterP} onChange={e => setFilterP(e.target.value)}
            className="rounded-xl border bg-transparent pl-3 pr-7 py-2 text-[0.8rem] appearance-none outline-none cursor-pointer"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <option value="">Toutes priorités</option>
            <option value="critical">Critique</option>
            <option value="high">Haute</option>
            <option value="normal">Normale</option>
            <option value="low">Faible</option>
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
        </div>
      </div>

      {/* Layout : liste + panel */}
      <div className="flex gap-4">

        {/* Table */}
        <div className="flex-1 overflow-hidden rounded-2xl border min-w-0" style={{ background: V.card, borderColor: V.border }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <MessageSquare size={28} style={{ color: V.textFaint }} />
              <p className="mt-3 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>Aucun ticket</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                    {["Sujet", "Email", "Priorité", "Statut", "Date", ""].map(h => (
                      <th key={h} className="px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                        style={{ color: V.textFaint }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {tickets.map(t => {
                    const sc = STATUS_COLOR[t.status] ?? STATUS_COLOR.open;
                    const pc = PRIORITY_COLOR[t.priority] ?? "#6b7280";
                    const active = selected?.id === t.id;
                    return (
                      <tr key={t.id} style={{ background: active ? "rgba(201,165,90,0.04)" : "transparent" }}
                        className="transition-colors">
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <p className="text-[0.83rem] font-semibold truncate" style={{ color: V.text }}>{t.subject}</p>
                          {t.admin_reply && <p className="text-[0.7rem] text-[#4ade80] mt-0.5">✓ Répondu</p>}
                        </td>
                        <td className="px-4 py-3.5 text-[0.79rem] max-w-[160px] truncate" style={{ color: V.textMuted }}>
                          {t.email}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[0.76rem]" style={{ color: pc }}>
                            <span className="inline-block w-2 h-2 rounded-full" style={{ background: pc }} />
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold"
                            style={{ background: sc.bg, color: sc.text }}>
                            {STATUS_LABEL[t.status] ?? t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[0.76rem]" style={{ color: V.textFaint }}>
                          {fmt(t.created_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => { setSelected(t); setReply(t.admin_reply ?? ""); }}
                            className="rounded-lg border px-2.5 py-1 text-[0.73rem] font-semibold transition"
                            style={{ borderColor: active ? V.goldBorder : V.border, color: active ? V.gold : V.textMuted,
                              background: active ? V.goldDim : "transparent" }}>
                            {t.admin_reply ? "Voir" : "Répondre"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-[380px] shrink-0 overflow-y-auto rounded-2xl border space-y-4 p-5"
            style={{ background: V.card, borderColor: V.goldBorder }}>

            {/* Panel header */}
            <div className="flex items-center justify-between">
              <p className="text-[0.88rem] font-bold" style={{ color: V.text }}>Ticket</p>
              <button onClick={() => setSelected(null)} style={{ color: V.textFaint }}>
                <X size={16} />
              </button>
            </div>

            {/* Message */}
            <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: V.border }}>
              <p className="text-[0.88rem] font-semibold" style={{ color: V.text }}>{selected.subject}</p>
              <p className="text-[0.74rem]" style={{ color: V.textFaint }}>{selected.email} · {fmt(selected.created_at)}</p>
              <p className="text-[0.82rem] leading-relaxed whitespace-pre-wrap" style={{ color: V.textMuted }}>
                {selected.message}
              </p>
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Statut",   key: "status",   opts: ["open","in_progress","resolved","closed"],   labels: STATUS_LABEL },
                { label: "Priorité", key: "priority", opts: ["low","normal","high","critical"],            labels: { low: "Faible", normal: "Normal", high: "Haute", critical: "Critique" } },
              ].map(f => (
                <div key={f.key}>
                  <label className="block mb-1 text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
                    {f.label}
                  </label>
                  <div className="relative">
                    <select
                      value={(selected as unknown as Record<string,string>)[f.key]}
                      onChange={e => {
                        setSelected(prev => prev ? { ...prev, [f.key]: e.target.value } as Ticket : prev);
                        patch(selected.id, { [f.key]: e.target.value });
                      }}
                      className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.8rem] appearance-none outline-none"
                      style={{ borderColor: V.border, color: V.text }}>
                      {f.opts.map(o => <option key={o} value={o}>{f.labels[o] ?? o}</option>)}
                    </select>
                    <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: V.textFaint }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Reply textarea */}
            <div>
              <label className="block mb-1 text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
                Réponse {selected.replied_at && <span className="text-[#4ade80] normal-case">· envoyée {fmt(selected.replied_at)}</span>}
              </label>
              <textarea rows={5} value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Votre réponse au client…"
                className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-[0.82rem] outline-none resize-none"
                style={{ borderColor: V.border, color: V.text }} />
              <button
                onClick={() => patch(selected.id, { admin_reply: reply })}
                disabled={saving || !reply.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-2 text-[0.82rem] font-bold transition disabled:opacity-40"
                style={{ background: V.goldDim, border: `1px solid ${V.goldBorder}`, color: V.gold }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {saving ? "Envoi…" : "Envoyer par email"}
              </button>
            </div>

            {/* Previous reply */}
            {selected.admin_reply && (
              <div className="rounded-xl border p-3.5"
                style={{ borderColor: "rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.05)" }}>
                <p className="text-[0.7rem] font-semibold text-[#4ade80] mb-1.5 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Dernière réponse
                </p>
                <p className="text-[0.8rem] whitespace-pre-wrap leading-relaxed" style={{ color: V.textMuted }}>
                  {selected.admin_reply}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
