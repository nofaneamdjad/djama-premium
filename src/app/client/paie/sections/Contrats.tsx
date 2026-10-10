"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, FileText, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe, RhContrat } from "../rh-types";
import { fmt, fmtDateShort, CONTRAT_COLORS } from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  add: (msg: string, type?: "success" | "error") => void;
  isDark: boolean;
}

const EMPTY = {
  employe_id: "", type_contrat: "CDI", date_debut: "", date_fin: "",
  salaire_brut: "", quotite_horaire: "35", classification: "",
  periode_essai_fin: "", notes: "",
};

const TYPES_CONTRAT = ["CDI", "CDD", "Alternance", "Stage", "Freelance", "Autre"];
const CLASSIFICATIONS = ["Non-cadre", "Cadre", "Employé", "Ouvrier", "Agent de maîtrise", "Cadre dirigeant"];

export default function ContratsSection({ userId, employes, add, isDark }: Props) {
  const [contrats, setContrats] = useState<(RhContrat & { employe?: { nom: string; poste?: string } })[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ ...EMPTY });
  const [saving,   setSaving]   = useState(false);
  const [filterStatut, setFilterStatut] = useState<string>("actif");

  const card  = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri   = isDark ? "text-white"    : "text-gray-900";
  const sec   = isDark ? "text-white/70" : "text-gray-600";
  const mut   = isDark ? "text-white/40" : "text-gray-400";
  const faint = isDark ? "text-white/20" : "text-gray-300";
  const inp   = isDark
    ? "border-white/[0.08] bg-white/[0.06] text-white placeholder-white/20 focus:border-white/20 [color-scheme:dark]"
    : "border-black/[0.08] bg-black/[0.03] text-gray-900 placeholder-gray-400 focus:border-black/20";
  const divs  = isDark ? "divide-white/[0.05]" : "divide-black/[0.05]";

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("rh_contrats")
      .select("*, employe:employes(nom, poste)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setContrats((data as (RhContrat & { employe?: { nom: string; poste?: string } })[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const saveContrat = async () => {
    if (!userId || !form.employe_id || !form.date_debut || !form.salaire_brut) return;
    const brut = parseFloat(form.salaire_brut);
    if (isNaN(brut) || brut <= 0) { add("Salaire invalide", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("rh_contrats").insert({
      user_id: userId,
      employe_id: form.employe_id,
      type_contrat: form.type_contrat,
      date_debut: form.date_debut,
      date_fin: form.date_fin || null,
      salaire_brut: brut,
      quotite_horaire: parseFloat(form.quotite_horaire) || 35,
      classification: form.classification || null,
      periode_essai_fin: form.periode_essai_fin || null,
      notes: form.notes || null,
      statut: "actif",
    });
    setSaving(false);
    if (error) { add("Erreur lors de l'enregistrement", "error"); return; }
    add("Contrat ajouté", "success");
    setForm({ ...EMPTY });
    setShowForm(false);
    await load();
  };

  const updateStatut = async (id: string, statut: string) => {
    await supabase.from("rh_contrats").update({ statut }).eq("id", id);
    add("Statut mis à jour", "success");
    await load();
  };

  const filtered = contrats.filter(c => filterStatut === "all" || c.statut === filterStatut);

  const STATUT_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
    actif:    { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)", label: "Actif"    },
    termine:  { color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.25)", label: "Terminé" },
    rompu:    { color: "#f43f5e", bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.25)",   label: "Rompu"   },
    suspendu: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)", label: "Suspendu" },
  };

  const daysUntil = (d?: string | null) => {
    if (!d) return null;
    return Math.round((new Date(d).getTime() - Date.now()) / (24 * 3600 * 1000));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
          <h2 className={`mt-1 text-2xl font-black ${pri}`}>Contrats</h2>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={15} /> Nouveau contrat
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {[{ id: "all", label: "Tous", color: "#c9a55a", bg: "rgba(201,165,90,0.1)", border: "rgba(201,165,90,0.25)" },
          ...Object.entries(STATUT_COLORS).map(([id, v]) => ({ id, ...v }))
        ].map(v => (
          <button key={v.id} onClick={() => setFilterStatut(v.id)}
            className="shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition"
            style={filterStatut === v.id
              ? { background: v.bg, borderColor: v.border, color: v.color }
              : isDark
                ? { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                : { background: "#fff", borderColor: "rgba(0,0,0,0.08)", color: "#6b7280" }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className={`animate-spin ${faint}`} /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <FileText size={32} className={faint} />
          <div>
            <p className={`font-bold ${mut}`}>Aucun contrat</p>
            <p className={`text-sm ${faint}`}>Ajoutez un premier contrat pour un salarié</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const st     = STATUT_COLORS[c.statut] ?? STATUT_COLORS.actif;
            const ct     = CONTRAT_COLORS[c.type_contrat] ?? CONTRAT_COLORS.Autre;
            const days   = daysUntil(c.date_fin);
            const expiring = c.date_fin && c.statut === "actif" && days !== null && days <= 60;
            return (
              <div key={c.id} className={`overflow-hidden rounded-2xl ${card}`}>
                <div className="flex items-start gap-4 p-5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? "bg-white/8" : "bg-black/5"}`}>
                    <FileText size={16} style={{ color: ct.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className={`font-bold ${pri}`}>{(c as { employe?: { nom: string } }).employe?.nom ?? "Salarié inconnu"}</p>
                      <span className="rounded-lg border px-2 py-0.5 text-xs font-bold"
                        style={{ background: ct.bg, borderColor: ct.border, color: ct.color }}>
                        {c.type_contrat}
                      </span>
                      <span className="rounded-lg border px-2 py-0.5 text-xs font-bold"
                        style={{ background: st.bg, borderColor: st.border, color: st.color }}>
                        {st.label}
                      </span>
                      {expiring && (
                        <span className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${days! <= 14 ? "border-red-500/25 bg-red-500/10 text-red-400" : "border-orange-500/25 bg-orange-500/10 text-orange-400"}`}>
                          <AlertCircle size={10} /> J−{days}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${mut}`}>
                      Début : {fmtDateShort(c.date_debut)}
                      {c.date_fin ? ` · Fin : ${fmtDateShort(c.date_fin)}` : " · Durée indéterminée"}
                      {c.classification ? ` · ${c.classification}` : ""}
                      {c.quotite_horaire ? ` · ${c.quotite_horaire}h/sem` : ""}
                    </p>
                    {c.periode_essai_fin && (
                      <p className={`mt-0.5 text-xs ${faint}`}>
                        Période d&apos;essai jusqu&apos;au {fmtDateShort(c.periode_essai_fin)}
                        {daysUntil(c.periode_essai_fin) !== null && daysUntil(c.periode_essai_fin)! > 0
                          ? ` (J−${daysUntil(c.periode_essai_fin)})` : " (terminée)"}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-black text-[#c9a55a]">{fmt(c.salaire_brut)}</p>
                    <p className={`text-xs ${faint}`}>brut/mois</p>
                    {c.statut === "actif" && (
                      <div className="mt-2 flex gap-1.5 justify-end">
                        <button onClick={() => updateStatut(c.id, "termine")}
                          className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition ${isDark ? "border-white/8 text-white/30 hover:border-gray-500/30 hover:text-gray-400" : "border-black/8 text-gray-400 hover:text-gray-600"}`}>
                          Terminer
                        </button>
                        <button onClick={() => updateStatut(c.id, "rompu")}
                          className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition border-red-500/20 text-red-400/60 hover:border-red-500/40 hover:text-red-400`}>
                          Rompre
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {c.notes && (
                  <div className={`border-t px-5 py-3 ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"}`}>
                    <p className={`text-xs ${faint}`}>{c.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className={`w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl ${isDark ? "border-white/[0.08] bg-[#0e1420]" : "border-black/[0.08] bg-white"}`}>
            <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <h2 className={`text-sm font-bold ${pri}`}>Nouveau contrat</h2>
              <button onClick={() => setShowForm(false)} className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "text-white/30 hover:bg-white/8" : "text-gray-400 hover:bg-black/5"}`}><X size={15} /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-3">
              {/* Salarié */}
              <div>
                <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Salarié *</label>
                <select value={form.employe_id} onChange={e => setForm(f => ({ ...f, employe_id: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${inp}`}>
                  <option value="">Sélectionner un salarié</option>
                  {employes.filter(e => e.actif).map(e => (
                    <option key={e.id} value={e.id}>{e.nom}{e.poste ? ` — ${e.poste}` : ""}</option>
                  ))}
                </select>
              </div>
              {/* Type contrat */}
              <div>
                <label className={`mb-2 block text-xs font-semibold ${mut}`}>Type de contrat</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES_CONTRAT.map(t => {
                    const c = CONTRAT_COLORS[t] ?? CONTRAT_COLORS.Autre;
                    const active = form.type_contrat === t;
                    return (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type_contrat: t }))}
                        className="rounded-xl border px-3 py-2 text-xs font-bold"
                        style={active
                          ? { background: c.bg, borderColor: c.border, color: c.color }
                          : isDark ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }
                                   : { background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.08)", color: "rgba(14,20,32,0.40)" }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Dates + salaire */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "date_debut",         label: "Date de début *", type: "date"   },
                  { key: "date_fin",            label: "Date de fin (CDD)", type: "date" },
                  { key: "salaire_brut",        label: "Salaire brut (€) *", type: "number" },
                  { key: "quotite_horaire",     label: "Quotité (h/sem)",  type: "number" },
                  { key: "periode_essai_fin",   label: "Fin période d'essai", type: "date" },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>{label}</label>
                    <input type={type}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${inp}`} />
                  </div>
                ))}
                {/* Classification */}
                <div>
                  <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Classification</label>
                  <select value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${inp}`}>
                    <option value="">Sélectionner</option>
                    {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition resize-none ${inp}`}
                  placeholder="Convention collective, clauses particulières…" />
              </div>
            </div>
            <div className={`flex gap-2 border-t px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <button onClick={() => setShowForm(false)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold ${isDark ? "border-white/8 text-white/40" : "border-black/8 text-gray-400"}`}>
                Annuler
              </button>
              <button onClick={saveContrat} disabled={saving || !form.employe_id || !form.date_debut || !form.salaire_brut}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black hover:brightness-110 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
