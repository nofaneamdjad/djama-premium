"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Undo2, RefreshCw, Loader2, CheckCircle2, XCircle,
  AlertTriangle, TrendingDown, Clock, Plus, Eye, EyeOff,
  Ban, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { V } from "@/components/hq";

/* ── Types ────────────────────────────────────────────────────────────────── */

type RefundStatus = "pending" | "approved" | "processing" | "succeeded" | "failed" | "rejected" | "cancelled";

interface RefundRequest {
  id:                    string;
  created_at:            string;
  updated_at:            string;
  transaction_id:        string | null;
  invoice_id:            string | null;
  provider:              "stripe" | "paypal" | "manual";
  amount_requested:      number;
  amount_refunded:       number;
  currency:              string;
  status:                RefundStatus;
  reason:                string | null;
  rejection_reason:      string | null;
  provider_refund_id:    string | null;
  provider_error:        string | null;
  requested_by_admin_id: string;
  approved_by_admin_id:  string | null;
  processed_at:          string | null;
  approved_at:           string | null;
}

interface Stats {
  total_succeeded:   number;
  total_pending:     number;
  total_failed:      number;
  montant_rembourse: number;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CFG: Record<RefundStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending:    { label: "En attente",  color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  icon: Clock       },
  approved:   { label: "Approuvée",   color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  icon: CheckCircle2},
  processing: { label: "Traitement",  color: "#a78bfa", bg: "rgba(167,139,250,0.10)", icon: Loader2     },
  succeeded:  { label: "Réussi",      color: "#4ade80", bg: "rgba(74,222,128,0.10)",  icon: CheckCircle2},
  failed:     { label: "Échoué",      color: "#f87171", bg: "rgba(248,113,113,0.10)", icon: XCircle     },
  rejected:   { label: "Rejeté",      color: "#94a3b8", bg: "rgba(148,163,184,0.10)", icon: Ban         },
  cancelled:  { label: "Annulé",      color: "#6b7280", bg: "rgba(107,114,128,0.10)", icon: XCircle     },
};

/* ── Composant principal ──────────────────────────────────────────────────── */

export default function RemboursementsPage() {
  const [rows,    setRows]    = useState<RefundRequest[]>([]);
  const [stats,   setStats]   = useState<Stats>({ total_succeeded: 0, total_pending: 0, total_failed: 0, montant_rembourse: 0 });
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filtre,  setFiltre]  = useState<RefundStatus | "tous">("tous");
  const [acting,  setActing]  = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Formulaire création ───────────────────────────────────────────────────
  const [showCreate,  setShowCreate]  = useState(false);
  const [newTxId,     setNewTxId]     = useState("");
  const [newAmount,   setNewAmount]   = useState("");
  const [newProvider, setNewProvider] = useState<"stripe" | "paypal" | "manual">("stripe");
  const [newReason,   setNewReason]   = useState("");
  const [creating,    setCreating]    = useState(false);

  // ── Re-auth dialog ────────────────────────────────────────────────────────
  const [reauthFor,     setReauthFor]     = useState<{ purpose: string; onSuccess: (tok: string) => void } | null>(null);
  const [reauthPwd,     setReauthPwd]     = useState("");
  const [reauthShow,    setReauthShow]    = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthErr,     setReauthErr]     = useState("");

  // ── Refus dialog ──────────────────────────────────────────────────────────
  const [rejectFor,    setRejectFor]    = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  /* load -------------------------------------------------------------------- */
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const params = filtre !== "tous" ? `?statut=${filtre}` : "";
      const r = await fetch(`/api/admin/remboursements${params}`);
      if (!r.ok) throw new Error((await r.json() as { error: string }).error ?? "Erreur");
      const d = await r.json() as { remboursements: RefundRequest[]; total: number; stats: Stats };
      setRows(d.remboursements ?? []);
      setTotal(d.total ?? 0);
      if (d.stats) setStats(d.stats);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, [filtre]);

  useEffect(() => { void load(); }, [load]);

  /* re-auth helper ---------------------------------------------------------- */
  async function requestReauth(purpose: string): Promise<string | null> {
    return new Promise(resolve => {
      setReauthFor({ purpose, onSuccess: (tok) => { resolve(tok); setReauthFor(null); setReauthPwd(""); setReauthErr(""); } });
    });
  }

  async function submitReauth() {
    if (!reauthFor || !reauthPwd) return;
    setReauthLoading(true); setReauthErr("");
    try {
      const r = await fetch("/api/admin/auth/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: reauthPwd, purpose: reauthFor.purpose }),
      });
      const d = await r.json() as { reauth_token?: string; error?: string };
      if (!r.ok) throw new Error(d.error ?? "Erreur re-auth");
      reauthFor.onSuccess(d.reauth_token!);
    } catch (e) { setReauthErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setReauthLoading(false); }
  }

  /* créer demande ------------------------------------------------------------ */
  async function handleCreate() {
    setCreating(true); setErr(null);
    try {
      const body: Record<string, unknown> = { provider: newProvider };
      if (newTxId.trim())  body.transaction_id = newTxId.trim();
      if (newAmount.trim()) body.amount = parseFloat(newAmount);
      if (newReason.trim()) body.reason = newReason.trim();

      const r = await fetch("/api/admin/remboursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json() as { error?: string; refund_id?: string; idempotent?: boolean };
      if (!r.ok) throw new Error(d.error ?? "Erreur");
      setSuccess(d.idempotent ? "Demande identique déjà enregistrée." : `Demande créée (ID: ${d.refund_id?.slice(0, 8)}…)`);
      setShowCreate(false); setNewTxId(""); setNewAmount(""); setNewReason("");
      await load(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setCreating(false); }
  }

  /* approuver --------------------------------------------------------------- */
  async function handleApprove(refundId: string) {
    setActing(refundId); setErr(null); setSuccess(null);
    try {
      const tok = await requestReauth("refund");
      if (!tok) { setActing(null); return; }

      const r = await fetch("/api/admin/remboursements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-reauth-token": tok },
        body: JSON.stringify({ refund_id: refundId, action: "approuver" }),
      });
      const d = await r.json() as { error?: string; status?: string; sandbox?: boolean };
      if (!r.ok) throw new Error(d.error ?? "Erreur");
      const sandboxNote = d.sandbox ? " [SANDBOX — simulation]" : "";
      setSuccess(`Remboursement ${d.status}${sandboxNote}`);
      await load(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setActing(null); }
  }

  /* refuser ----------------------------------------------------------------- */
  async function handleReject(refundId: string) {
    setActing(refundId); setErr(null); setSuccess(null);
    try {
      const tok = await requestReauth("refund");
      if (!tok) { setActing(null); return; }

      const r = await fetch("/api/admin/remboursements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-reauth-token": tok },
        body: JSON.stringify({ refund_id: refundId, action: "refuser", rejection_reason: rejectReason }),
      });
      const d = await r.json() as { error?: string; status?: string };
      if (!r.ok) throw new Error(d.error ?? "Erreur");
      setSuccess("Demande rejetée.");
      setRejectFor(null); setRejectReason("");
      await load(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setActing(null); }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */

  const FILTRES: { id: RefundStatus | "tous"; label: string }[] = [
    { id: "tous",       label: "Tous"        },
    { id: "pending",    label: "En attente"  },
    { id: "succeeded",  label: "Réussis"     },
    { id: "failed",     label: "Échoués"     },
    { id: "rejected",   label: "Rejetés"     },
  ];

  return (
    <div className="space-y-6">

      {/* ── Re-auth dialog ───────────────────────────────────────────────── */}
      {reauthFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{ background: V.card, borderColor: "rgba(251,191,36,0.3)" }}>
            <div className="mb-4 flex items-center gap-2">
              <Zap size={16} style={{ color: V.gold }} />
              <span className="font-bold text-[0.95rem]" style={{ color: V.text }}>Ré-authentification requise</span>
            </div>
            <p className="mb-4 text-[0.78rem]" style={{ color: V.textMuted }}>
              Action irréversible. Confirmez votre mot de passe admin.
            </p>
            <div className="relative mb-3">
              <input
                type={reauthShow ? "text" : "password"}
                value={reauthPwd}
                onChange={e => setReauthPwd(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") void submitReauth(); }}
                placeholder="Mot de passe"
                className="w-full rounded-xl border px-4 py-2.5 pr-10 text-[0.85rem] outline-none"
                style={{ background: V.bg, borderColor: V.border, color: V.text }}
              />
              <button onClick={() => setReauthShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: V.textFaint }}>
                {reauthShow ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {reauthErr && <p className="mb-3 text-[0.78rem]" style={{ color: "#f87171" }}>{reauthErr}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setReauthFor(null); setReauthPwd(""); setReauthErr(""); }}
                className="flex-1 rounded-xl border py-2 text-[0.82rem] font-semibold"
                style={{ borderColor: V.border, color: V.textMuted }}>
                Annuler
              </button>
              <button onClick={() => void submitReauth()} disabled={reauthLoading || !reauthPwd}
                className="flex-1 rounded-xl py-2 text-[0.82rem] font-bold flex items-center justify-center gap-1.5"
                style={{ background: V.gold, color: "#000", opacity: !reauthPwd ? 0.5 : 1 }}>
                {reauthLoading ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject reason dialog ─────────────────────────────────────────── */}
      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{ background: V.card, borderColor: "rgba(248,113,113,0.3)" }}>
            <p className="mb-3 font-bold text-[0.95rem]" style={{ color: V.text }}>Motif de rejet</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison du rejet (facultatif)…"
              rows={3}
              className="mb-3 w-full rounded-xl border px-3 py-2 text-[0.82rem] outline-none resize-none"
              style={{ background: V.bg, borderColor: V.border, color: V.text }}
            />
            <div className="flex gap-2">
              <button onClick={() => { setRejectFor(null); setRejectReason(""); }}
                className="flex-1 rounded-xl border py-2 text-[0.82rem] font-semibold"
                style={{ borderColor: V.border, color: V.textMuted }}>Annuler</button>
              <button onClick={() => void handleReject(rejectFor)} disabled={acting === rejectFor}
                className="flex-1 rounded-xl py-2 text-[0.82rem] font-bold flex items-center justify-center gap-1.5"
                style={{ background: "#f87171", color: "#fff" }}>
                {acting === rejectFor ? <Loader2 size={13} className="animate-spin" /> : "Rejeter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black tracking-tight" style={{ color: V.text }}>
            <Undo2 size={18} style={{ color: V.gold }} />
            Remboursements
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            {total} demande{total !== 1 ? "s" : ""} — {stats.montant_rembourse.toLocaleString("fr-FR")}€ remboursés
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(true)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.78rem] font-medium"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button onClick={() => setShowCreate(s => !s)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[0.78rem] font-bold"
            style={{ background: V.gold, color: "#000" }}>
            <Plus size={13} />
            Nouvelle demande
          </button>
        </div>
      </div>

      {/* ── Formulaire création ──────────────────────────────────────────── */}
      {showCreate && (
        <div className="rounded-2xl border p-5 space-y-4"
          style={{ background: V.card, borderColor: "rgba(251,191,36,0.2)" }}>
          <p className="font-bold text-[0.88rem]" style={{ color: V.text }}>Nouvelle demande de remboursement</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
                ID Transaction *
              </label>
              <input value={newTxId} onChange={e => setNewTxId(e.target.value)}
                placeholder="uuid de payment_transactions"
                className="w-full rounded-xl border px-3 py-2 text-[0.82rem] outline-none"
                style={{ background: V.bg, borderColor: V.border, color: V.text }} />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
                Montant (laisser vide = total)
              </label>
              <input value={newAmount} onChange={e => setNewAmount(e.target.value)}
                type="number" min="0" step="0.01" placeholder="ex: 29.99"
                className="w-full rounded-xl border px-3 py-2 text-[0.82rem] outline-none"
                style={{ background: V.bg, borderColor: V.border, color: V.text }} />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
                Provider
              </label>
              <select value={newProvider} onChange={e => setNewProvider(e.target.value as "stripe" | "paypal" | "manual")}
                className="w-full rounded-xl border px-3 py-2 text-[0.82rem] outline-none"
                style={{ background: V.bg, borderColor: V.border, color: V.text }}>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="manual">Manuel</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
                Motif (facultatif)
              </label>
              <input value={newReason} onChange={e => setNewReason(e.target.value)}
                placeholder="ex: demande client"
                className="w-full rounded-xl border px-3 py-2 text-[0.82rem] outline-none"
                style={{ background: V.bg, borderColor: V.border, color: V.text }} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowCreate(false)}
              className="rounded-xl border px-4 py-2 text-[0.82rem] font-semibold"
              style={{ borderColor: V.border, color: V.textMuted }}>Annuler</button>
            <button onClick={() => void handleCreate()} disabled={creating || !newTxId.trim()}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[0.82rem] font-bold"
              style={{ background: V.gold, color: "#000", opacity: !newTxId.trim() ? 0.5 : 1 }}>
              {creating ? <Loader2 size={13} className="animate-spin" /> : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "En attente",  value: stats.total_pending,    color: "#fbbf24", icon: Clock        },
          { label: "Réussis",     value: stats.total_succeeded,  color: "#4ade80", icon: CheckCircle2 },
          { label: "Échoués",     value: stats.total_failed,     color: "#f87171", icon: XCircle      },
          { label: "Total €",     value: `${stats.montant_rembourse.toLocaleString("fr-FR")}€`, color: "#f87171", icon: TrendingDown },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: V.card, borderColor: V.border }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `${k.color}18` }}>
              <k.icon size={15} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>{k.label}</p>
              <p className="text-[1.1rem] font-black" style={{ color: k.color }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTRES.map(f => (
          <button key={f.id} onClick={() => setFiltre(f.id)}
            className="rounded-xl border px-3 py-1.5 text-[0.78rem] font-semibold transition"
            style={{
              borderColor: filtre === f.id ? V.goldBorder : V.border,
              background:  filtre === f.id ? V.goldDim    : "transparent",
              color:       filtre === f.id ? V.gold       : V.textMuted,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      {err && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)", color: "#f87171" }}>
          <AlertTriangle size={14} /> {err}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.07)", color: "#4ade80" }}>
          <CheckCircle2 size={14} /> {success}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <Undo2 size={28} style={{ color: V.textFaint }} />
            <p className="mt-3 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>
              Aucune demande de remboursement
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                  {["", "ID", "Provider", "Montant", "Statut", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: V.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {rows.map(r => {
                  const cfg = STATUS_CFG[r.status];
                  const isExpanded = expanded === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        className="transition-colors">
                        {/* expand toggle */}
                        <td className="pl-4 py-4">
                          <button onClick={() => setExpanded(isExpanded ? null : r.id)}
                            style={{ color: V.textFaint }}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                        <td className="px-4 py-4 font-mono text-[0.73rem]" style={{ color: V.textSub }}>
                          {r.id.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-lg px-2 py-0.5 text-[0.73rem] font-bold uppercase"
                            style={{
                              background: r.provider === "stripe" ? "rgba(96,165,250,0.12)" : r.provider === "paypal" ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.06)",
                              color:      r.provider === "stripe" ? "#60a5fa"               : r.provider === "paypal" ? "#fbbf24"               : V.textSub,
                            }}>
                            {r.provider}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-[0.88rem] font-bold" style={{ color: "#f87171" }}>
                            -{r.amount_requested.toLocaleString("fr-FR")} {r.currency}
                          </p>
                          {r.amount_refunded > 0 && r.amount_refunded !== r.amount_requested && (
                            <p className="text-[0.72rem]" style={{ color: V.textFaint }}>
                              remboursé : {r.amount_refunded.toLocaleString("fr-FR")} {r.currency}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            <cfg.icon size={10} className={r.status === "processing" ? "animate-spin" : ""} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[0.78rem]" style={{ color: V.textSub }}>
                          {fmt(r.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          {r.status === "pending" && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => void handleApprove(r.id)}
                                disabled={acting === r.id}
                                className="rounded-lg border px-2.5 py-1 text-[0.73rem] font-semibold transition"
                                style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ade80", background: "rgba(74,222,128,0.08)" }}>
                                {acting === r.id ? <Loader2 size={11} className="animate-spin inline" /> : "✓ Approuver"}
                              </button>
                              <button
                                onClick={() => setRejectFor(r.id)}
                                disabled={acting === r.id}
                                className="rounded-lg border px-2.5 py-1 text-[0.73rem] font-semibold transition"
                                style={{ borderColor: "rgba(248,113,113,0.3)", color: "#f87171", background: "rgba(248,113,113,0.08)" }}>
                                ✕ Rejeter
                              </button>
                            </div>
                          )}
                          {r.status === "succeeded" && (
                            <span className="text-[0.72rem]" style={{ color: "#4ade80" }}>
                              ✓ {r.provider_refund_id?.slice(0, 12)}
                            </span>
                          )}
                          {r.status === "failed" && r.provider_error && (
                            <span className="text-[0.72rem]" style={{ color: "#f87171" }}>
                              {r.provider_error.slice(0, 32)}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Détail expandable */}
                      {isExpanded && (
                        <tr style={{ background: "rgba(255,255,255,0.01)" }}>
                          <td colSpan={7} className="px-6 pb-5 pt-2">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[0.78rem] sm:grid-cols-3">
                              <Detail label="Transaction" value={r.transaction_id ?? "—"} mono />
                              <Detail label="Facture"     value={r.invoice_id ?? "—"}    mono />
                              <Detail label="Provider ID" value={r.provider_refund_id ?? "—"} mono />
                              <Detail label="Approuvé par" value={r.approved_by_admin_id?.slice(0, 8) ?? "—"} mono />
                              <Detail label="Approuvé le" value={fmt(r.approved_at)} />
                              <Detail label="Traité le"   value={fmt(r.processed_at)} />
                              {r.reason && <Detail label="Motif" value={r.reason} />}
                              {r.rejection_reason && <Detail label="Raison rejet" value={r.rejection_reason} />}
                              {r.provider_error && (
                                <div className="col-span-full">
                                  <span className="font-semibold uppercase tracking-wide text-[0.69rem]"
                                    style={{ color: "#f87171" }}>Erreur provider :</span>
                                  <span className="ml-2 font-mono text-[0.72rem]" style={{ color: "#f87171" }}>{r.provider_error}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="font-semibold uppercase tracking-wide text-[0.69rem]" style={{ color: V.textFaint }}>{label} : </span>
      <span className={mono ? "font-mono text-[0.72rem]" : "text-[0.78rem]"} style={{ color: V.textSub }}>{value}</span>
    </div>
  );
}
