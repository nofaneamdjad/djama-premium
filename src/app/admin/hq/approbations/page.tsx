"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle, XCircle, Clock, AlertTriangle, Plus, X,
  Loader2, RefreshCw, ChevronDown,
} from "lucide-react";

const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";
const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  offboarding:  { label: "Offboarding",    color: "#ef4444" },
  role_change:  { label: "Changement rôle",color: "#8b5cf6" },
  access_grant: { label: "Accès",          color: "#3b82f6" },
  suspension:   { label: "Suspension",     color: "#f97316" },
  budget:       { label: "Budget",         color: "#22c55e" },
  autre:        { label: "Autre",          color: "#6b7280" },
};
const PRIO_MAP: Record<string, { label: string; color: string; bg: string }> = {
  urgente: { label: "Urgente", color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  haute:   { label: "Haute",   color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  normale: { label: "Normale", color: "#6b7280", bg: "rgba(107,114,128,0.1)"},
  basse:   { label: "Basse",   color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
};
const STATUT_TABS = [
  { value: "en_attente", label: "En attente" },
  { value: "approuve",   label: "Approuvées" },
  { value: "rejete",     label: "Rejetées"   },
  { value: "expire",     label: "Expirées"   },
  { value: "all",        label: "Tout"       },
];

type Approval = {
  id: string; type: string; titre: string; description?: string;
  statut: string; priority: string; created_at: string;
  review_comment?: string; reviewed_at?: string;
  requester?: { id: string; first_name: string; last_name: string; job_title?: string; hq_departments?: { name: string; color: string } | null } | null;
  target?: { id: string; first_name: string; last_name: string; job_title?: string } | null;
  reviewer?: { id: string; first_name: string; last_name: string } | null;
};

export default function ApprobationsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [counts, setCounts]       = useState({ enAttente: 0, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [statut, setStatut]       = useState("en_attente");
  const [tick, setTick]           = useState(0);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [reviewing, setReviewing] = useState<{ id: string; action: "approuve"|"rejete" } | null>(null);
  const [comment, setComment]     = useState("");
  const [msg, setMsg]             = useState<{ type: "ok"|"err"; text: string } | null>(null);

  const [form, setForm] = useState({
    type: "autre", titre: "", description: "", priority: "normale",
    target_id: "", details: "{}",
    requested_by: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/hq/approbations?statut=${statut}`)
      .then(r => r.json())
      .then(d => { setApprovals(d.approvals ?? []); setCounts(d.counts ?? { enAttente: 0, total: 0 }); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statut, tick]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre || !form.requested_by) {
      setMsg({ type: "err", text: "Titre et demandeur obligatoires." }); return;
    }
    setSaving(true); setMsg(null);
    try {
      let details = {};
      try { details = JSON.parse(form.details); } catch { details = {}; }
      const res = await fetch("/api/admin/hq/approbations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, details, target_id: form.target_id || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setMsg({ type: "ok", text: "Demande créée." });
      setForm({ type: "autre", titre: "", description: "", priority: "normale", target_id: "", details: "{}", requested_by: "" });
      setShowForm(false);
      setTick(t => t + 1);
    } catch { setMsg({ type: "err", text: "Erreur réseau." }); }
    finally { setSaving(false); }
  }

  async function handleReview(id: string, action: "approuve"|"rejete") {
    const reviewed_by = "00000000-0000-0000-0000-000000000000"; // placeholder direction
    const res = await fetch(`/api/admin/hq/approbations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewed_by, review_comment: comment }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
    setMsg({ type: "ok", text: action === "approuve" ? "Demande approuvée." : "Demande rejetée." });
    setReviewing(null);
    setComment("");
    setTick(t => t + 1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette demande ?")) return;
    const res = await fetch(`/api/admin/hq/approbations/${id}`, { method: "DELETE" });
    if (res.ok) setApprovals(prev => prev.filter(a => a.id !== id));
  }

  const inputCls = "w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[0.82rem] text-white/85 outline-none placeholder:text-white/25 focus:border-white/20";
  const inputStyle = { background: "rgba(255,255,255,0.03)", borderColor: BORDER };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Approbations</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Workflows d'approbation</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">
            {counts.enAttente > 0
              ? <span className="text-amber-400 font-semibold">{counts.enAttente} demande{counts.enAttente > 1 ? "s" : ""} en attente</span>
              : "Aucune demande en attente"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTick(t => t + 1)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[0.78rem] text-white/35 hover:text-white/60 transition-colors"
            style={{ border: `1px solid ${BORDER}` }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(o => !o)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.8rem] font-semibold transition-opacity hover:opacity-80"
            style={{ background: `rgba(${GOLDR},0.12)`, border: `1px solid rgba(${GOLDR},0.25)`, color: GOLD }}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Annuler" : "Nouvelle demande"}
          </button>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[0.82rem]"
          style={{
            background: msg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            color: msg.type === "ok" ? "#22c55e" : "#ef4444",
          }}>
          {msg.text}
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={e => void handleCreate(e)} className="rounded-2xl border p-6 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-white/50">Nouvelle demande d'approbation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Titre <span className="text-red-400">*</span></label>
              <input className={inputCls} style={inputStyle} value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ex : Offboarding Jean Dupont" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Type</label>
              <select className={inputCls} style={{ ...inputStyle, color: "rgba(255,255,255,0.85)" }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPE_MAP).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Priorité</label>
              <select className={inputCls} style={{ ...inputStyle, color: "rgba(255,255,255,0.85)" }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">ID Demandeur (UUID) <span className="text-red-400">*</span></label>
              <input className={inputCls} style={inputStyle} value={form.requested_by} onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))} placeholder="UUID employé demandeur" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">ID Cible (UUID, optionnel)</label>
              <input className={inputCls} style={inputStyle} value={form.target_id} onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))} placeholder="UUID employé cible" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Description</label>
            <textarea className={inputCls} style={inputStyle} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Contexte et raison de la demande…" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.82rem] font-semibold disabled:opacity-50"
              style={{ background: `rgba(${GOLDR},0.15)`, border: `1px solid rgba(${GOLDR},0.3)`, color: GOLD }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Création…" : "Soumettre"}
            </button>
          </div>
        </form>
      )}

      {/* Onglets statut */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUT_TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatut(tab.value)}
            className="relative rounded-xl px-3.5 py-2 text-[0.75rem] font-medium transition-all"
            style={{
              background: statut === tab.value ? `rgba(${GOLDR},0.12)` : "rgba(255,255,255,0.04)",
              border: `1px solid ${statut === tab.value ? `rgba(${GOLDR},0.3)` : BORDER}`,
              color: statut === tab.value ? GOLD : "rgba(255,255,255,0.4)",
            }}>
            {tab.label}
            {tab.value === "en_attente" && counts.enAttente > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[0.58rem] font-black text-black">
                {counts.enAttente}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste des approbations */}
      {loading ? (
        <div className="py-12 text-center text-[0.8rem] text-white/25">Chargement…</div>
      ) : approvals.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: BORDER }}>
          <CheckCircle size={22} className="mx-auto mb-2 text-white/15" />
          <p className="text-[0.82rem] text-white/30">
            {statut === "en_attente" ? "Aucune demande en attente" : "Aucune entrée"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map(a => {
            const prio = PRIO_MAP[a.priority] ?? PRIO_MAP.normale;
            const type = TYPE_MAP[a.type]     ?? TYPE_MAP.autre;
            const isReviewing = reviewing?.id === a.id;
            return (
              <div key={a.id} className="rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: a.statut === "en_attente" ? "rgba(245,158,11,0.2)" : BORDER }}>
                <div className="flex items-start gap-4 p-5">
                  {/* Indicateur priorité */}
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: prio.color }} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[0.9rem] font-bold text-white">{a.titre}</span>
                      <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full" style={{ color: type.color, background: `${type.color}18` }}>{type.label}</span>
                      <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full" style={{ color: prio.color, background: prio.bg }}>{prio.label}</span>
                    </div>
                    {a.description && <p className="text-[0.75rem] text-white/40 mb-2">{a.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-[0.68rem] text-white/30">
                      {a.requester && (
                        <span>Par <span className="text-white/50 font-medium">{a.requester.first_name} {a.requester.last_name}</span></span>
                      )}
                      {a.target && (
                        <span>→ <span className="text-white/50 font-medium">{a.target.first_name} {a.target.last_name}</span></span>
                      )}
                      <span>{new Date(a.created_at).toLocaleDateString("fr-FR")}</span>
                      {a.reviewer && a.reviewed_at && (
                        <span>
                          {a.statut === "approuve" ? "✓ Approuvé" : "✗ Rejeté"} par {a.reviewer.first_name} {a.reviewer.last_name}
                          {a.review_comment && ` — "${a.review_comment}"`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {a.statut === "en_attente" && (
                    <div className="shrink-0 flex flex-col gap-1.5">
                      <button onClick={() => { setReviewing({ id: a.id, action: "approuve" }); setComment(""); }}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.72rem] font-semibold text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                        style={{ border: "1px solid rgba(34,197,94,0.2)" }}>
                        <CheckCircle size={12} /> Approuver
                      </button>
                      <button onClick={() => { setReviewing({ id: a.id, action: "rejete" }); setComment(""); }}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.72rem] font-semibold text-red-400 hover:bg-red-400/10 transition-colors"
                        style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                        <XCircle size={12} /> Rejeter
                      </button>
                      <button onClick={() => void handleDelete(a.id)}
                        className="text-[0.65rem] text-white/20 hover:text-white/40 transition-colors text-center">
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {/* Panneau de révision */}
                {isReviewing && (
                  <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[0.78rem] font-semibold text-white/60">
                      {reviewing.action === "approuve" ? "✓ Confirmer l'approbation" : "✗ Confirmer le rejet"}
                    </p>
                    <input
                      className={inputCls} style={inputStyle}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Commentaire (optionnel)…"
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={() => void handleReview(a.id, reviewing.action)}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[0.78rem] font-semibold"
                        style={{
                          background: reviewing.action === "approuve" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                          border: reviewing.action === "approuve" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
                          color: reviewing.action === "approuve" ? "#22c55e" : "#ef4444",
                        }}>
                        Confirmer
                      </button>
                      <button onClick={() => setReviewing(null)} className="text-[0.75rem] text-white/30 hover:text-white/60 transition-colors">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
