"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TestTube2, RefreshCw, Loader2, Zap, Clock,
  Plus, AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import { V } from "@/components/hq";

interface Client { id: string; name: string; email: string; company: string | null; }
interface Essai {
  user_id: string; beta_access: boolean; beta_expires_at: string | null;
  ai_calls_used: number | null; updated_at: string; clients: Client;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function daysLeft(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function EssaisPage() {
  const [essais,   setEssais]   = useState<Essai[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState<string | null>(null);
  const [stats,    setStats]    = useState({ total: 0, actifs: 0, expirant: 0 });
  const [extending, setExtending] = useState<string | null>(null);
  const [extForm,   setExtForm]   = useState<{ userId: string; name: string } | null>(null);
  const [extDays,   setExtDays]   = useState("7");
  const [extReason, setExtReason] = useState("");
  const [extSaving, setExtSaving] = useState(false);
  const [extErr,    setExtErr]    = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/essais");
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setEssais(d.essais ?? []);
      setStats({ total: d.total, actifs: d.actifs, expirant: d.expirant });
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function extend(e: React.FormEvent) {
    e.preventDefault();
    if (!extForm) return;
    setExtSaving(true); setExtErr(null);
    try {
      const r = await fetch("/api/admin/essais", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: extForm.userId,
          days:    parseInt(extDays) || 7,
          reason:  extReason || undefined,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      setExtForm(null); setExtDays("7"); setExtReason("");
      await load(true);
    } catch (e) { setExtErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setExtSaving(false); }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black tracking-tight" style={{ color: V.text }}>
            <TestTube2 size={18} style={{ color: V.gold }} />
            Essais gratuits
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            Supervision des périodes bêta actives
          </p>
        </div>
        <button onClick={() => load(true)} disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.78rem] font-medium transition"
          style={{ borderColor: V.border, color: V.textMuted }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total bêta",     value: stats.total,    color: V.gold,    icon: Zap         },
          { label: "Actifs",         value: stats.actifs,   color: "#4ade80", icon: CheckCircle2 },
          { label: "Expirant ≤7j",   value: stats.expirant, color: "#fbbf24", icon: Clock       },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: V.card, borderColor: V.border }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: `${s.color}15` }}>
              <s.icon size={14} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
                {s.label}
              </p>
              <p className="text-[1.2rem] font-black" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modale extension */}
      {extForm && (
        <div className="rounded-2xl border p-5 space-y-4"
          style={{ background: V.card, borderColor: V.goldBorder }}>
          <div className="flex items-center justify-between">
            <p className="text-[0.84rem] font-bold" style={{ color: V.text }}>
              Étendre l'essai — {extForm.name}
            </p>
            <button onClick={() => setExtForm(null)} style={{ color: V.textFaint }}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={extend} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block mb-1 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
                Jours à ajouter
              </label>
              <input type="number" value={extDays} onChange={e => setExtDays(e.target.value)}
                min="1" max="365" required
                className="w-24 rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block mb-1 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
                Raison (optionnel)
              </label>
              <input type="text" value={extReason} onChange={e => setExtReason(e.target.value)}
                placeholder="Bug critique, offre commerciale…"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />
            </div>
            <button type="submit" disabled={extSaving}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[0.82rem] font-bold transition disabled:opacity-50"
              style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}>
              {extSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Étendre
            </button>
          </form>
          {extErr && (
            <p className="text-[0.78rem] text-[#f87171]">
              <AlertTriangle size={12} className="inline mr-1" />{extErr}
            </p>
          )}
        </div>
      )}

      {/* Erreur */}
      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)", color: "#f87171" }}>
          {err}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
          </div>
        ) : essais.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <TestTube2 size={28} style={{ color: V.textFaint }} />
            <p className="mt-3 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>
              Aucun compte bêta enregistré
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                  {["Utilisateur", "Appels IA", "Expire le", "Jours restants", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: V.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {essais.map(e => {
                  const dl     = daysLeft(e.beta_expires_at);
                  const active = dl !== null && dl > 0;
                  return (
                    <tr key={e.user_id}
                      onMouseEnter={ev => (ev.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                      onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}
                      className="transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-[0.83rem] font-semibold" style={{ color: V.text }}>
                          {e.clients?.name ?? "—"}
                        </p>
                        <p className="text-[0.72rem]" style={{ color: V.textFaint }}>{e.clients?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-[0.84rem] font-bold" style={{ color: V.gold }}>
                        {e.ai_calls_used ?? 0}
                      </td>
                      <td className="px-5 py-4 text-[0.8rem]"
                        style={{ color: active ? V.textSub : "#f87171" }}>
                        {fmt(e.beta_expires_at)}
                      </td>
                      <td className="px-5 py-4">
                        {dl === null ? (
                          <span style={{ color: V.textFaint }} className="text-[0.78rem]">—</span>
                        ) : dl === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#f87171]">
                            <AlertTriangle size={11} /> Expiré
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[0.75rem] font-semibold"
                            style={{ color: dl <= 3 ? "#fbbf24" : "#4ade80" }}>
                            <Clock size={11} /> {dl}j
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setExtForm({ userId: e.user_id, name: e.clients?.name ?? e.user_id })}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[0.73rem] font-medium transition"
                          style={{ borderColor: V.border, color: V.textMuted }}
                          onMouseEnter={ev => {
                            ev.currentTarget.style.borderColor = V.goldBorder;
                            ev.currentTarget.style.color = V.gold;
                          }}
                          onMouseLeave={ev => {
                            ev.currentTarget.style.borderColor = V.border;
                            ev.currentTarget.style.color = V.textMuted;
                          }}
                        >
                          <Plus size={11} /> Étendre
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
    </div>
  );
}
