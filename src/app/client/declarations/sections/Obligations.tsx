"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw, CheckCircle2, AlertCircle, Info, Globe, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, GOLD, COUVERTURE_CFG, PAYS_LABELS, getDefaultObligations } from "../decl-utils";
import type { Obligation, FiscalProfile, StatutCouverture } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  add: (msg: string, type?: "success" | "error") => void;
}

const CATEGORIES = ["toutes", "fiscale", "sociale", "juridique", "autre"];
const PERIODICITES = ["mensuelle", "trimestrielle", "semestrielle", "annuelle", "ponctuelle"];

export default function ObligationsSection({ userId, isDark, profile, add }: Props) {
  const t = tok(isDark);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("toutes");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    libelle: "",
    type_obligation: "",
    categorie: "fiscale",
    autorite: "",
    formulaire: "",
    periodicite: "annuelle",
    pays: profile?.pays_constitution ?? "FR",
    description: "",
    source_reglementaire: "",
  });

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase.from("decl_obligations")
      .select("*")
      .eq("user_id", userId)
      .order("categorie", { ascending: true })
      .then(({ data }) => {
        setObligations((data as Obligation[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  async function importDefaults() {
    if (!userId || !profile) return;
    const defaults = getDefaultObligations(profile);
    if (defaults.length === 0) { add("Aucune obligation par défaut pour ce profil", "error"); return; }
    const rows = defaults.map(o => ({ ...o, user_id: userId, statut_couverture: "preparation_assistee" as StatutCouverture, active: true }));
    const { error } = await supabase.from("decl_obligations").insert(rows);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add(`${rows.length} obligations importées`, "success");
    const { data } = await supabase.from("decl_obligations").select("*").eq("user_id", userId).order("categorie");
    setObligations((data as Obligation[]) ?? []);
  }

  async function toggle(id: string, active: boolean) {
    await supabase.from("decl_obligations").update({ active }).eq("id", id);
    setObligations(prev => prev.map(o => o.id === id ? { ...o, active } : o));
  }

  async function saveObligation() {
    if (!userId || !form.libelle.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("decl_obligations").insert({
      ...form, user_id: userId, statut_couverture: "information" as StatutCouverture, active: true,
    });
    setSaving(false);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add("Obligation ajoutée", "success");
    setShowForm(false);
    setForm({ libelle: "", type_obligation: "", categorie: "fiscale", autorite: "", formulaire: "", periodicite: "annuelle", pays: profile?.pays_constitution ?? "FR", description: "", source_reglementaire: "" });
    const { data } = await supabase.from("decl_obligations").select("*").eq("user_id", userId).order("categorie");
    setObligations((data as Obligation[]) ?? []);
  }

  const filtered = cat === "toutes" ? obligations : obligations.filter(o => o.categorie === cat);
  const byPays = filtered.reduce((acc, o) => {
    (acc[o.pays] ??= []).push(o);
    return acc;
  }, {} as Record<string, Obligation[]>);

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all";
  const inputStyle = { background: t.glassMd, border: `1px solid ${t.border}`, color: t.text };

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-all"
              style={cat === c
                ? { background: GOLD, color: "#111" }
                : { background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }
              }
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {profile && obligations.length === 0 && (
            <button
              onClick={importDefaults}
              className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all active:scale-95"
              style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}
            >
              <RefreshCw size={12} /> Importer défauts
            </button>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all active:scale-95"
            style={{ background: GOLD, color: "#111" }}
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${GOLD}30` }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold" style={{ color: t.text }}>Nouvelle obligation</span>
            <button onClick={() => setShowForm(false)}><X size={14} style={{ color: t.text3 }} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Field label="Libellé *">
              <input className={inputCls} style={inputStyle} value={form.libelle} onChange={e => setForm(p => ({ ...p, libelle: e.target.value }))} placeholder="ex. TVA mensuelle CA3" />
            </Field>
            <Field label="Type (code)">
              <input className={inputCls} style={inputStyle} value={form.type_obligation} onChange={e => setForm(p => ({ ...p, type_obligation: e.target.value }))} placeholder="ex. tva_ca3" />
            </Field>
            <Field label="Catégorie">
              <select className={inputCls} style={inputStyle} value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}>
                {["fiscale","sociale","juridique","autre"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Périodicité">
              <select className={inputCls} style={inputStyle} value={form.periodicite} onChange={e => setForm(p => ({ ...p, periodicite: e.target.value }))}>
                {PERIODICITES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Autorité">
              <input className={inputCls} style={inputStyle} value={form.autorite} onChange={e => setForm(p => ({ ...p, autorite: e.target.value }))} placeholder="ex. DGFiP, URSSAF" />
            </Field>
            <Field label="Formulaire">
              <input className={inputCls} style={inputStyle} value={form.formulaire} onChange={e => setForm(p => ({ ...p, formulaire: e.target.value }))} placeholder="ex. CA3, 2065" />
            </Field>
          </div>
          <Field label="Source réglementaire (URL)">
            <input className={`${inputCls} mb-3`} style={inputStyle} value={form.source_reglementaire} onChange={e => setForm(p => ({ ...p, source_reglementaire: e.target.value }))} placeholder="https://…" />
          </Field>
          <div className="flex items-center gap-2">
            <button onClick={saveObligation} disabled={saving || !form.libelle.trim()}
              className="text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-40"
              style={{ background: GOLD, color: "#111" }}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs px-3 py-2 rounded-xl" style={{ color: t.text3 }}>Annuler</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center">
          <RefreshCw size={18} className="animate-spin mx-auto" style={{ color: t.text3 }} />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl py-12 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <Info size={20} className="mx-auto mb-3" style={{ color: t.text3 }} />
          <p className="text-sm" style={{ color: t.text3 }}>
            {obligations.length === 0 ? "Aucune obligation configurée" : `Aucune obligation dans la catégorie "${cat}"`}
          </p>
          {profile && obligations.length === 0 && (
            <button onClick={importDefaults} className="mt-4 text-xs px-3 py-2 rounded-xl font-semibold"
              style={{ background: `${GOLD}15`, color: GOLD }}>
              Importer les obligations par défaut
            </button>
          )}
        </div>
      )}

      {/* Par pays */}
      {!loading && Object.entries(byPays).map(([pays, obs]) => (
        <div key={pays}>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={12} style={{ color: t.text3 }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.text3 }}>
              {PAYS_LABELS[pays] ?? pays}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: t.glassMd, color: t.text4 }}>{obs.length}</span>
          </div>
          <div className="space-y-2">
            {obs.map(o => {
              const cvr = COUVERTURE_CFG[o.statut_couverture];
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                  style={{
                    background: t.glass,
                    border: `1px solid ${o.active ? t.border : t.borderSoft}`,
                    opacity: o.active ? 1 : 0.5,
                  }}
                >
                  <button onClick={() => toggle(o.id, !o.active)} className="shrink-0">
                    {o.active
                      ? <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
                      : <AlertCircle size={16} style={{ color: t.text4 }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: t.text }}>{o.libelle}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {o.autorite && <span className="text-[10px]" style={{ color: t.text3 }}>{o.autorite}</span>}
                      {o.formulaire && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: t.glassMd, color: t.text3 }}>{o.formulaire}</span>}
                      <span className="text-[10px] capitalize" style={{ color: t.text4 }}>{o.periodicite}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ color: cvr.color, background: `${cvr.color}18` }}>
                    {cvr.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Note légale */}
      {!loading && obligations.length > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
          <Info size={12} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
          <p className="text-[11px]" style={{ color: t.text3 }}>
            Cette liste est indicative. DJAMA n'applique aucun régime automatiquement.
            Consultez un expert-comptable pour vérifier vos obligations réelles.
          </p>
        </div>
      )}
    </div>
  );
}
