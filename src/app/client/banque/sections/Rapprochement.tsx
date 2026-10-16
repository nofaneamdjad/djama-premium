"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Link2, FileText,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { tok, GOLD, fmtAmount, fmtDate } from "../banque-utils";

interface Props {
  userId: string | null;
  isDark: boolean;
  add: (msg: string, type?: "success" | "error") => void;
}

interface Reconciliation {
  id: string;
  transaction_id: string;
  match_type: string;
  document_id: string | null;
  match_score: number;
  match_reason: string | null;
  status: string;
  validated_at: string | null;
  notes: string | null;
  transaction?: {
    id: string; label: string; amount: number; date: string;
    type: string; currency: string;
  };
}

const SCORE_COLORS = (score: number) => {
  if (score >= 0.8) return "#10b981";
  if (score >= 0.6) return "#f59e0b";
  return "#ef4444";
};

export default function Rapprochement({ userId, isDark, add }: Props) {
  const t = tok(isDark);

  const [recs, setRecs]         = useState<Reconciliation[]>([]);
  const [loading, setLoading]   = useState(false);
  const [computing, setComputing] = useState(false);
  const [filterStatus, setFilter] = useState("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing]     = useState<string | null>(null);
  const [noteFor, setNoteFor]   = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => { if (userId) load(); }, [userId, filterStatus]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ status: filterStatus });
    const res = await fetch(`/api/banque/reconcile?${params}`);
    const json = await res.json();
    setRecs(json.reconciliations ?? []);
    setLoading(false);
  }

  async function compute() {
    setComputing(true);
    const res = await fetch("/api/banque/reconcile", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      add(`${json.suggestions} suggestion${json.suggestions !== 1 ? "s" : ""} générée${json.suggestions !== 1 ? "s" : ""}`);
      setFilter("pending");
      load();
    } else {
      add(json.error ?? "Erreur", "error");
    }
    setComputing(false);
  }

  async function act(id: string, action: "validate" | "reject") {
    setActing(id);
    const res = await fetch(`/api/banque/reconcile/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes: noteText || undefined }),
    });
    if (res.ok) {
      add(action === "validate" ? "Rapprochement validé" : "Rapprochement rejeté");
      setNoteFor(null);
      setNoteText("");
      load();
    } else {
      const e = await res.json();
      add(e.error ?? "Erreur", "error");
    }
    setActing(null);
  }

  const inp = {
    background: t.glass, border: `1px solid ${t.border}`,
    color: t.text, borderRadius: "0.75rem",
    padding: "0.55rem 0.875rem", fontSize: "0.875rem",
    outline: "none", width: "100%",
  } as React.CSSProperties;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold" style={{ color: t.text }}>Rapprochement bancaire</h3>
          <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
            Associez vos transactions bancaires à vos factures et dépenses
          </p>
        </div>
        <button onClick={compute} disabled={computing}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
          <RefreshCw size={14} className={computing ? "animate-spin" : ""} />
          {computing ? "Calcul…" : "Recalculer"}
        </button>
      </div>

      {/* Info rapprochement */}
      <div className="rounded-2xl p-4 mb-5"
        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <div className="flex items-start gap-3">
          <AlertCircle size={15} style={{ color: "#818cf8", marginTop: 2, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#818cf8" }}>Rapprochement automatique</p>
            <p className="text-xs mt-1" style={{ color: t.text3 }}>
              L'algorithme compare vos transactions bancaires importées aux factures non réglées.
              Les correspondances ambiguës sont présentées ici pour validation manuelle.
              Un score de confiance indique la qualité de la correspondance.
            </p>
          </div>
        </div>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { v: "pending", label: "À valider" },
          { v: "validated", label: "Validés" },
          { v: "rejected", label: "Rejetés" },
        ].map(opt => (
          <button key={opt.v} onClick={() => setFilter(opt.v)}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              background: filterStatus === opt.v ? `${GOLD}18` : t.glass,
              border: `1px solid ${filterStatus === opt.v ? GOLD + "50" : t.border}`,
              color: filterStatus === opt.v ? GOLD : t.text2,
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-center py-10" style={{ color: t.text3 }}>Chargement…</p>}

      {!loading && recs.length === 0 && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: t.glass, border: `1px dashed ${t.border}` }}>
          <Link2 size={32} className="mx-auto mb-3" style={{ color: `${GOLD}40` }} />
          <p className="text-sm" style={{ color: t.text2 }}>
            {filterStatus === "pending"
              ? "Aucune correspondance en attente. Cliquez sur « Recalculer » pour analyser vos transactions."
              : "Aucun rapprochement dans cette catégorie."}
          </p>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {recs.map(rec => {
          const score = rec.match_score ?? 0;
          const isExpanded = expanded === rec.id;
          const tx = rec.transaction;

          return (
            <div key={rec.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: t.glass, border: `1px solid ${t.border}` }}>

              {/* Ligne principale */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Score */}
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
                  style={{ background: SCORE_COLORS(score) + "18" }}>
                  <span className="text-xs font-black tabular-nums" style={{ color: SCORE_COLORS(score) }}>
                    {Math.round(score * 100)}
                  </span>
                  <span className="text-[8px]" style={{ color: SCORE_COLORS(score) }}>%</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: t.text }}>
                    {tx?.label ?? "Transaction"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs tabular-nums font-semibold"
                      style={{ color: tx?.type === "income" ? "#10b981" : "#ef4444" }}>
                      {tx?.type === "income" ? "+" : "-"}{fmtAmount(tx?.amount ?? 0, tx?.currency)}
                    </span>
                    <span className="text-xs" style={{ color: t.text3 }}>{tx ? fmtDate(tx.date) : ""}</span>
                    {rec.match_reason && (
                      <span className="text-[10px]" style={{ color: t.text4 }}>— {rec.match_reason}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {rec.status === "pending" && (
                    <>
                      <button onClick={() => { setNoteFor(rec.id); setNoteText(""); }}
                        disabled={!!acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <CheckCircle2 size={11} /> Valider
                      </button>
                      <button onClick={() => act(rec.id, "reject")}
                        disabled={!!acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <XCircle size={11} /> Rejeter
                      </button>
                    </>
                  )}
                  {rec.status === "validated" && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#10b981" }}>
                      <CheckCircle2 size={12} /> Validé
                    </span>
                  )}
                  {rec.status === "rejected" && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#ef4444" }}>
                      <XCircle size={12} /> Rejeté
                    </span>
                  )}
                  <button onClick={() => setExpanded(isExpanded ? null : rec.id)}
                    className="p-1" style={{ color: t.text3 }}>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>

              {/* Détails */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 space-y-2"
                  style={{ borderTop: `1px solid ${t.border}` }}>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-semibold uppercase tracking-wide mb-1" style={{ color: `${GOLD}80` }}>Type de correspondance</p>
                      <p style={{ color: t.text2 }}>{rec.match_type}</p>
                    </div>
                    {rec.document_id && (
                      <div>
                        <p className="font-semibold uppercase tracking-wide mb-1" style={{ color: `${GOLD}80` }}>Document associé</p>
                        <p className="truncate" style={{ color: t.text2 }}>{rec.document_id}</p>
                      </div>
                    )}
                    {rec.notes && (
                      <div className="col-span-2">
                        <p className="font-semibold uppercase tracking-wide mb-1" style={{ color: `${GOLD}80` }}>Notes</p>
                        <p style={{ color: t.text2 }}>{rec.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal note validation */}
              {noteFor === rec.id && (
                <div className="px-4 pb-4 pt-2 space-y-3"
                  style={{ borderTop: `1px solid ${t.border}`, background: "rgba(16,185,129,0.04)" }}>
                  <p className="text-xs font-medium" style={{ color: "#10b981" }}>Commentaire (optionnel)</p>
                  <input style={inp} placeholder="Note sur ce rapprochement…"
                    value={noteText} onChange={e => setNoteText(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setNoteFor(null)}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: t.glass, color: t.text3, border: `1px solid ${t.border}` }}>
                      Annuler
                    </button>
                    <button onClick={() => act(rec.id, "validate")} disabled={!!acting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.4)" }}>
                      <CheckCircle2 size={11} /> Confirmer la validation
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
