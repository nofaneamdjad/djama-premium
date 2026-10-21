"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, AlertTriangle, CheckCircle, Clock, Plus, X, Loader2, RefreshCw } from "lucide-react";

const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";
const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Incident = {
  id: string; titre: string; description?: string;
  severite: string; statut: string; created_at: string;
  reporter?: { first_name: string; last_name: string } | null;
  assignee?: { first_name: string; last_name: string } | null;
};
type AuditEntry = {
  id: string; action: string; entity_type?: string; entity_id?: string;
  created_at: string;
  performer?: { first_name: string; last_name: string } | null;
};
type Kpi = { ouverts: number; enCours: number; resolus: number };

const SEV_MAP: Record<string, { label: string; color: string; bg: string }> = {
  critique: { label: "Critique", color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  eleve:    { label: "Élevé",    color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  moyen:    { label: "Moyen",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  faible:   { label: "Faible",   color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
};
const STAT_MAP: Record<string, { label: string; color: string }> = {
  ouvert:   { label: "Ouvert",    color: "#ef4444" },
  en_cours: { label: "En cours",  color: "#f59e0b" },
  resolu:   { label: "Résolu",    color: "#22c55e" },
  ferme:    { label: "Fermé",     color: "#6b7280" },
};

export default function InformatiquePage() {
  const [kpi, setKpi]           = useState<Kpi | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditLog, setAuditLog]   = useState<AuditEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tick, setTick]           = useState(0);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState<{ type: "ok"|"err"; text: string } | null>(null);
  const [form, setForm]           = useState({ titre: "", description: "", severite: "moyen" });

  function load() {
    setLoading(true);
    fetch("/api/admin/hq/informatique")
      .then(r => r.json())
      .then(d => { setKpi(d.kpi); setIncidents(d.incidents ?? []); setAuditLog(d.auditLog ?? []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [tick]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre) { setMsg({ type: "err", text: "Titre obligatoire." }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/hq/informatique/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setMsg({ type: "ok", text: "Incident créé." });
      setForm({ titre: "", description: "", severite: "moyen" });
      setShowForm(false);
      setTick(t => t + 1);
    } catch { setMsg({ type: "err", text: "Erreur réseau." }); }
    finally { setSaving(false); }
  }

  async function changeStatut(inc: Incident, statut: string) {
    const res = await fetch("/api/admin/hq/informatique/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inc.id, statut }),
    });
    if (res.ok) {
      setIncidents(prev => prev.map(i => i.id === inc.id ? { ...i, statut } : i)
        .filter(i => !["resolu","ferme"].includes(i.statut)));
    }
  }

  const inputCls = "w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[0.82rem] text-white/85 outline-none placeholder:text-white/25 focus:border-white/20";
  const inputStyle = { background: "rgba(255,255,255,0.03)", borderColor: BORDER };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Informatique</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Espace IT</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">Incidents et audit système</p>
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
            {showForm ? "Annuler" : "Signaler"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Incidents ouverts", value: kpi?.ouverts ?? 0,  icon: AlertTriangle, color: "#ef4444" },
          { label: "En cours",          value: kpi?.enCours ?? 0,  icon: Clock,         color: "#f59e0b" },
          { label: "Résolus ce mois",   value: kpi?.resolus ?? 0,  icon: CheckCircle,   color: "#22c55e" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-white/30">{label}</span>
              <Icon size={13} style={{ color }} />
            </div>
            <p className="text-[1.5rem] font-black text-white tabular-nums">
              {loading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

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

      {/* Formulaire incident */}
      {showForm && (
        <form onSubmit={e => void handleCreate(e)} className="rounded-2xl border p-6 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-white/50">Signaler un incident</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Titre <span className="text-red-400">*</span></label>
              <input className={inputCls} style={inputStyle} value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Titre de l'incident…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Sévérité</label>
              <select className={inputCls} style={{ ...inputStyle, color: "rgba(255,255,255,0.85)" }} value={form.severite} onChange={e => setForm(f => ({ ...f, severite: e.target.value }))}>
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
                <option value="critique">Critique</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Description</label>
            <textarea className={inputCls} style={inputStyle} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails de l'incident…" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.82rem] font-semibold disabled:opacity-50"
              style={{ background: `rgba(${GOLDR},0.15)`, border: `1px solid rgba(${GOLDR},0.3)`, color: GOLD }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Création…" : "Créer l'incident"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Incidents actifs */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
            <AlertTriangle size={12} className="text-white/30" />
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/30">Incidents actifs</p>
          </div>
          {loading ? (
            <div className="py-8 text-center text-[0.78rem] text-white/25">Chargement…</div>
          ) : incidents.length === 0 ? (
            <div className="py-8 text-center text-[0.78rem] text-white/25">Aucun incident actif</div>
          ) : (
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {incidents.map(inc => {
                const sev = SEV_MAP[inc.severite] ?? SEV_MAP.moyen;
                const sta = STAT_MAP[inc.statut]  ?? STAT_MAP.ouvert;
                return (
                  <div key={inc.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[0.82rem] font-semibold text-white/85">{inc.titre}</span>
                          <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-semibold" style={{ color: sev.color, background: sev.bg }}>{sev.label}</span>
                        </div>
                        {inc.description && <p className="text-[0.72rem] text-white/35 mb-2 line-clamp-2">{inc.description}</p>}
                        <div className="flex items-center gap-3">
                          <span className="text-[0.65rem]" style={{ color: sta.color }}>{sta.label}</span>
                          <span className="text-[0.65rem] text-white/25">{new Date(inc.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {inc.statut === "ouvert" && (
                          <button onClick={() => void changeStatut(inc, "en_cours")}
                            className="text-[0.65rem] px-2 py-1 rounded-lg text-white/40 hover:text-white/70 transition-colors"
                            style={{ border: `1px solid ${BORDER}` }}>En cours</button>
                        )}
                        {(inc.statut === "ouvert" || inc.statut === "en_cours") && (
                          <button onClick={() => void changeStatut(inc, "resolu")}
                            className="text-[0.65rem] px-2 py-1 rounded-lg text-emerald-400/60 hover:text-emerald-400 transition-colors"
                            style={{ border: "1px solid rgba(34,197,94,0.15)" }}>Résoudre</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit log */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
            <Terminal size={12} className="text-white/30" />
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/30">Journal d'audit</p>
          </div>
          {loading ? (
            <div className="py-8 text-center text-[0.78rem] text-white/25">Chargement…</div>
          ) : auditLog.length === 0 ? (
            <div className="py-8 text-center text-[0.78rem] text-white/25">Aucune entrée</div>
          ) : (
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {auditLog.map(entry => (
                <div key={entry.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.78rem] text-white/70">
                      <span className="font-semibold">{entry.action}</span>
                      {entry.entity_type && <span className="text-white/35"> · {entry.entity_type}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.performer && (
                        <span className="text-[0.65rem] text-white/30">
                          {entry.performer.first_name} {entry.performer.last_name}
                        </span>
                      )}
                      <span className="text-[0.65rem] text-white/20">
                        {new Date(entry.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
