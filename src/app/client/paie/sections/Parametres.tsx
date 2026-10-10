"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, Info, Building2, Users, CheckCircle2, Loader2, Trash2, Plus, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe } from "../rh-types";
import { TOTAL_COT_SAL, TOTAL_COT_PAT, COT_SAL, COT_PAT } from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  add: (msg: string, type?: "success" | "error") => void;
  isDark: boolean;
}

interface RhPoste { id: string; user_id: string; titre: string; departement?: string; classification?: string; salaire_min?: number; salaire_max?: number }

export default function ParametresSection({ userId, employes, add, isDark }: Props) {
  const [postes,     setPostes]     = useState<RhPoste[]>([]);
  const [showPoste,  setShowPoste]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [posteForm,  setPosteForm]  = useState({ titre: "", departement: "", classification: "", salaire_min: "", salaire_max: "" });

  const card  = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri   = isDark ? "text-white"    : "text-gray-900";
  const sec   = isDark ? "text-white/70" : "text-gray-600";
  const mut   = isDark ? "text-white/40" : "text-gray-400";
  const faint = isDark ? "text-white/20" : "text-gray-300";
  const inp   = isDark
    ? "border-white/[0.08] bg-white/[0.06] text-white placeholder-white/20 focus:border-white/20 [color-scheme:dark]"
    : "border-black/[0.08] bg-black/[0.03] text-gray-900 placeholder-gray-400 focus:border-black/20";

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("rh_postes").select("*").eq("user_id", userId).order("titre");
    setPostes((data as RhPoste[]) ?? []);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const savePoste = async () => {
    if (!userId || !posteForm.titre.trim()) { add("Titre requis", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("rh_postes").insert({
      user_id:        userId,
      titre:          posteForm.titre.trim(),
      departement:    posteForm.departement.trim() || null,
      classification: posteForm.classification.trim() || null,
      salaire_min:    posteForm.salaire_min ? parseFloat(posteForm.salaire_min) : null,
      salaire_max:    posteForm.salaire_max ? parseFloat(posteForm.salaire_max) : null,
    });
    setSaving(false);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add("Poste ajouté", "success");
    setPosteForm({ titre: "", departement: "", classification: "", salaire_min: "", salaire_max: "" });
    setShowPoste(false);
    await load();
  };

  const deletePoste = async (id: string, titre: string) => {
    if (!confirm(`Supprimer le poste "${titre}" ?`)) return;
    await supabase.from("rh_postes").delete().eq("id", id);
    await load();
    add("Poste supprimé", "success");
  };

  const actifs   = employes.filter(e => e.actif);
  const depts    = [...new Set(actifs.map(e => e.departement).filter(Boolean))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
        <h2 className={`mt-1 text-2xl font-black ${pri}`}>Paramètres RH</h2>
        <p className={`mt-1 text-sm ${mut}`}>Référentiels, taux, et configuration</p>
      </div>

      {/* Info taux */}
      <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-blue-500/20 bg-blue-500/5" : "border-blue-200 bg-blue-50"}`}>
        <div className="flex items-start gap-3 p-5">
          <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className={`text-sm font-bold ${isDark ? "text-blue-300" : "text-blue-700"}`}>Taux de cotisation — Régime général 2024</p>
            <p className={`mt-1 text-xs ${isDark ? "text-blue-400" : "text-blue-600"}`}>
              Ces taux sont indicatifs. Ils s&apos;appliquent au régime général hors Alsace-Moselle. Consultez votre expert-comptable
              ou un logiciel de paie certifié (Silae, PayFit, etc.) pour des calculs opposables.
            </p>
          </div>
        </div>
      </div>

      {/* Taux */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cotisations salariales */}
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <p className={`text-sm font-bold ${pri}`}>Cotisations salariales</p>
            <p className={`text-xs ${mut}`}>Total : {TOTAL_COT_SAL.toFixed(2)}%</p>
          </div>
          <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
            {COT_SAL.map(c => (
              <div key={c.label} className="flex items-center justify-between px-5 py-2.5">
                <p className={`text-xs ${sec}`}>{c.label}</p>
                <span className="text-xs font-bold text-amber-400">{c.pct.toFixed(2)}%</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3">
              <p className={`text-xs font-bold ${pri}`}>Total</p>
              <span className="text-sm font-black text-amber-400">{TOTAL_COT_SAL.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Cotisations patronales */}
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <p className={`text-sm font-bold ${pri}`}>Cotisations patronales</p>
            <p className={`text-xs ${mut}`}>Total : {TOTAL_COT_PAT.toFixed(2)}%</p>
          </div>
          <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
            {COT_PAT.map(c => (
              <div key={c.label} className="flex items-center justify-between px-5 py-2.5">
                <p className={`text-xs ${sec}`}>{c.label}</p>
                <span className="text-xs font-bold text-red-400">{c.pct.toFixed(2)}%</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3">
              <p className={`text-xs font-bold ${pri}`}>Total</p>
              <span className="text-sm font-black text-red-400">{TOTAL_COT_PAT.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Référentiel postes */}
      <div className={`overflow-hidden rounded-2xl ${card}`}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-[#c9a55a]" />
            <p className={`text-sm font-bold ${pri}`}>Référentiel postes</p>
            <span className={`text-xs ${mut}`}>{postes.length}</span>
          </div>
          <button onClick={() => setShowPoste(v => !v)}
            className="flex items-center gap-1 rounded-xl border border-[#c9a55a]/30 bg-[#c9a55a]/10 px-3 py-1.5 text-xs font-bold text-[#c9a55a] hover:bg-[#c9a55a]/20 transition">
            <Plus size={11} /> Ajouter
          </button>
        </div>

        {showPoste && (
          <div className={`border-b px-5 py-4 space-y-3 ${isDark ? "border-white/[0.05] bg-white/[0.02]" : "border-black/[0.05] bg-black/[0.02]"}`}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <input type="text" placeholder="Titre du poste *" value={posteForm.titre}
                onChange={e => setPosteForm(f => ({ ...f, titre: e.target.value }))}
                className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
              <input type="text" placeholder="Département" value={posteForm.departement}
                onChange={e => setPosteForm(f => ({ ...f, departement: e.target.value }))}
                className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
              <input type="text" placeholder="Classification (ex: Cadre A)" value={posteForm.classification}
                onChange={e => setPosteForm(f => ({ ...f, classification: e.target.value }))}
                className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Salaire min (€)" value={posteForm.salaire_min}
                  onChange={e => setPosteForm(f => ({ ...f, salaire_min: e.target.value }))}
                  className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
                <input type="number" placeholder="Salaire max (€)" value={posteForm.salaire_max}
                  onChange={e => setPosteForm(f => ({ ...f, salaire_max: e.target.value }))}
                  className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPoste(false)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? "border-white/8 text-white/40" : "border-black/8 text-gray-400"}`}>
                <X size={12} />
              </button>
              <button onClick={savePoste} disabled={saving}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Enregistrer
              </button>
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
          {postes.length === 0 ? (
            <p className={`py-8 text-center text-sm ${faint}`}>Aucun poste défini</p>
          ) : postes.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div>
                <p className={`font-semibold ${sec}`}>{p.titre}</p>
                <p className={`text-xs ${mut}`}>
                  {[p.departement, p.classification].filter(Boolean).join(" · ")}
                  {(p.salaire_min || p.salaire_max) && ` · ${p.salaire_min?.toLocaleString("fr-FR") ?? "?"} – ${p.salaire_max?.toLocaleString("fr-FR") ?? "?"}€`}
                </p>
              </div>
              <button onClick={() => deletePoste(p.id, p.titre)} className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${isDark ? "text-white/20 hover:bg-red-500/10 hover:text-red-400" : "text-gray-300 hover:bg-red-50 hover:text-red-400"}`}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Départements détectés */}
      {depts.length > 0 && (
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#c9a55a]" />
              <p className={`text-sm font-bold ${pri}`}>Départements actifs</p>
              <span className={`text-xs ${mut}`}>{depts.length}</span>
            </div>
            <p className={`mt-0.5 text-xs ${faint}`}>Déduits des fiches salariés</p>
          </div>
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {depts.map(d => (
              <span key={d} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white/50" : "border-black/[0.08] bg-black/[0.03] text-gray-500"}`}>
                {d} · {actifs.filter(e => e.departement === d).length}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
