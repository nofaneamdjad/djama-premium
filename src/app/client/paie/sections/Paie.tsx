"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, FileText,
  CheckCircle2, AlertCircle, Download, Loader2, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe, VariablePaie } from "../rh-types";
import {
  calcNet, calcCharges, fmt, fmt2, avatarGradient,
  COT_SAL, COT_PAT, generateBulletinHtml, TYPE_VARIABLE_LABELS,
} from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  add: (msg: string, type?: "success" | "error") => void;
  isDark: boolean;
}

const TYPES_VAR = ["prime", "heures_sup", "indemnite", "retenue", "avance"] as const;
const VAR_COLORS: Record<string, string> = {
  prime: "#10b981", heures_sup: "#60a5fa", indemnite: "#c9a55a",
  retenue: "#f43f5e", avance: "#f59e0b",
};

export default function PaieSection({ userId, employes, add, isDark }: Props) {
  const [monthKey,    setMonthKey]   = useState(new Date().toISOString().slice(0, 7));
  const [variables,   setVariables]  = useState<VariablePaie[]>([]);
  const [bulletins,   setBulletins]  = useState<Set<string>>(new Set());
  const [urssaf,      setUrssaf]     = useState<string[]>([]);
  const [showVarForm, setShowVarForm] = useState<string | null>(null); // employe_id
  const [varForm,     setVarForm]    = useState({ type: "prime", libelle: "", montant: "" });
  const [saving,      setSaving]     = useState(false);

  const card  = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri   = isDark ? "text-white"    : "text-gray-900";
  const sec   = isDark ? "text-white/70" : "text-gray-600";
  const mut   = isDark ? "text-white/40" : "text-gray-400";
  const faint = isDark ? "text-white/20" : "text-gray-300";
  const inp   = isDark
    ? "border-white/[0.08] bg-white/[0.06] text-white placeholder-white/20 focus:border-white/20 [color-scheme:dark]"
    : "border-black/[0.08] bg-black/[0.03] text-gray-900 placeholder-gray-400 focus:border-black/20";
  const divs  = isDark ? "divide-white/[0.05]" : "divide-black/[0.05]";

  const actifs = employes.filter(e => e.actif);
  const masseTotal = actifs.reduce((s, e) => s + e.salaire_brut, 0);

  const load = useCallback(async () => {
    if (!userId) return;
    const [varsRes, bullRes, urssafRes] = await Promise.all([
      supabase.from("rh_variables_paie").select("*").eq("user_id", userId).eq("month_key", monthKey),
      supabase.from("payslips").select("employee_id").eq("user_id", userId).eq("month_key", monthKey),
      supabase.from("urssaf_declarations").select("month_key").eq("user_id", userId).eq("done", true),
    ]);
    setVariables((varsRes.data as VariablePaie[]) ?? []);
    setBulletins(new Set((bullRes.data ?? []).map((r: { employee_id: string }) => r.employee_id)));
    setUrssaf((urssafRes.data ?? []).map(r => r.month_key as string));
  }, [userId, monthKey]);

  useEffect(() => { load(); }, [load]);

  const moveMonth = (delta: number) => {
    const [y, m] = monthKey.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonthKey(d.toISOString().slice(0, 7));
  };

  const monthLabel = new Date(monthKey + "-02").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const getEmpVariables = (empId: string) => variables.filter(v => v.employe_id === empId);

  const calcBrutAjuste = (emp: Employe) => {
    const vars = getEmpVariables(emp.id);
    const pos = vars.filter(v => ["prime","heures_sup","indemnite"].includes(v.type)).reduce((s, v) => s + v.montant, 0);
    const neg = vars.filter(v => ["retenue","avance"].includes(v.type)).reduce((s, v) => s + v.montant, 0);
    return emp.salaire_brut + pos - neg;
  };

  const addVariable = async (empId: string) => {
    if (!userId || !varForm.libelle.trim() || !varForm.montant) return;
    const montant = parseFloat(varForm.montant);
    if (isNaN(montant) || montant <= 0) { add("Montant invalide", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("rh_variables_paie").insert({
      user_id: userId, employe_id: empId, month_key: monthKey,
      type: varForm.type, libelle: varForm.libelle.trim(), montant,
    });
    setSaving(false);
    if (error) { add("Erreur", "error"); return; }
    add("Variable ajoutée", "success");
    setVarForm({ type: "prime", libelle: "", montant: "" });
    setShowVarForm(null);
    await load();
  };

  const deleteVariable = async (id: string) => {
    await supabase.from("rh_variables_paie").delete().eq("id", id);
    await load();
  };

  const generateBulletin = async (emp: Employe) => {
    const vars = getEmpVariables(emp.id);
    if (userId) {
      await supabase.from("payslips")
        .upsert({ user_id: userId, employee_id: emp.id, month_key: monthKey, html_content: monthKey }, { onConflict: "user_id,employee_id,month_key" });
    }
    setBulletins(prev => new Set([...prev, emp.id]));
    const html = generateBulletinHtml(emp, monthLabel, vars);
    const w = window.open("", "_blank", "width=780,height=900");
    if (w) { w.document.write(html); w.document.close(); }
    add(`Bulletin ${emp.nom} généré`, "success");
  };

  const generateAll = async () => {
    for (const emp of actifs) await generateBulletin(emp);
  };

  const toggleUrssaf = async () => {
    const done = urssaf.includes(monthKey);
    if (done) {
      await supabase.from("urssaf_declarations").delete().eq("user_id", userId!).eq("month_key", monthKey);
      setUrssaf(prev => prev.filter(k => k !== monthKey));
    } else {
      await supabase.from("urssaf_declarations").upsert({ user_id: userId!, month_key: monthKey, done: true }, { onConflict: "user_id,month_key" });
      setUrssaf(prev => [...prev, monthKey]);
    }
  };

  const exportDSN = () => {
    const cotSalAllTotal = actifs.reduce((s, e) => {
      const b = calcBrutAjuste(e);
      return s + COT_SAL.reduce((a, c) => a + b * c.pct / 100, 0);
    }, 0);
    const chargesTotal = actifs.reduce((s, e) => s + calcCharges(calcBrutAjuste(e)), 0);
    const masseBrut = actifs.reduce((s, e) => s + calcBrutAjuste(e), 0);
    const echeance = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(5); return d.toLocaleDateString("fr-FR"); })();

    const lines = [
      `DÉCLARATION SOCIALE NOMINATIVE (DSN) — Indicative`,
      `Période : ${monthLabel}  |  Généré le : ${new Date().toLocaleDateString("fr-FR")}`,
      ``,
      `RÉCAPITULATIF ENTREPRISE`,
      `─────────────────────────────────────────`,
      `Effectif      : ${actifs.length} salarié(s)`,
      `Masse brute   : ${masseBrut.toFixed(2)} €`,
      `Cot. salariales : ${cotSalAllTotal.toFixed(2)} €`,
      `Charges patronales : ${chargesTotal.toFixed(2)} €`,
      `TOTAL URSSAF  : ${(cotSalAllTotal + chargesTotal).toFixed(2)} €`,
      `Échéance DSN  : ${echeance}`,
      ``,
      `DÉTAIL PAR SALARIÉ`,
      `═════════════════════════════════════════`,
      ...actifs.flatMap((e, i) => {
        const b = calcBrutAjuste(e);
        const csal = COT_SAL.reduce((s, c) => s + b * c.pct / 100, 0);
        const cpat = COT_PAT.reduce((s, c) => s + b * c.pct / 100, 0);
        const vars = getEmpVariables(e.id);
        return [
          ``, `[${String(i+1).padStart(2,"0")}] ${e.nom}`,
          `    Poste     : ${e.poste ?? "—"}`,
          `    Contrat   : ${e.type_contrat}`,
          `    Brut base : ${e.salaire_brut.toFixed(2)} €`,
          ...vars.map(v => `    + ${v.libelle} : ${(["retenue","avance"].includes(v.type) ? "−" : "+")} ${v.montant.toFixed(2)} €`),
          `    Brut ajusté : ${b.toFixed(2)} €`,
          `    Net à payer : ${(b - csal).toFixed(2)} €`,
          `    Ch. patronales : ${cpat.toFixed(2)} €`,
          `    Coût total : ${(b + cpat).toFixed(2)} €`,
        ];
      }),
      ``, `─────────────────────────────────────────`,
      `Document indicatif généré par DJAMA Premium — taux 2024 régime général`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `DSN_${monthKey}.txt`; a.click();
    URL.revokeObjectURL(url);
    add("DSN exportée", "success");
  };

  const isUrssafDone = urssaf.includes(monthKey);
  const bulletinsGenerated = actifs.filter(e => bulletins.has(e.id)).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header + navigation mois */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
          <h2 className={`mt-1 text-2xl font-black ${pri}`}>Paie</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Sélecteur de mois */}
          <div className={`flex items-center gap-1 rounded-xl border ${isDark ? "border-white/8 bg-white/4" : "border-black/8 bg-white"}`}>
            <button onClick={() => moveMonth(-1)} className={`flex h-9 w-9 items-center justify-center rounded-l-xl transition ${isDark ? "text-white/40 hover:text-white/80" : "text-gray-400 hover:text-gray-700"}`}>
              <ChevronLeft size={14} />
            </button>
            <span className={`px-3 text-sm font-bold capitalize ${pri}`}>{monthLabel}</span>
            <button onClick={() => moveMonth(1)} className={`flex h-9 w-9 items-center justify-center rounded-r-xl transition ${isDark ? "text-white/40 hover:text-white/80" : "text-gray-400 hover:text-gray-700"}`}>
              <ChevronRight size={14} />
            </button>
          </div>
          <button onClick={exportDSN}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${isDark ? "border-white/8 bg-white/4 text-white/50 hover:text-white/80" : "border-black/8 bg-white text-gray-500 hover:text-gray-800"}`}>
            <Download size={12} /> DSN
          </button>
        </div>
      </div>

      {/* URSSAF banner */}
      {actifs.length > 0 && (
        <div className={`overflow-hidden rounded-2xl border ${isUrssafDone ? "border-emerald-500/25" : "border-orange-500/25"} ${isDark ? isUrssafDone ? "bg-emerald-500/5" : "bg-orange-500/5" : isUrssafDone ? "bg-emerald-50" : "bg-orange-50"}`}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className={isUrssafDone ? "text-emerald-400" : "text-orange-400"} />
              <div>
                <p className={`text-sm font-bold ${isUrssafDone ? "text-emerald-400" : "text-orange-400"}`}>
                  Déclaration URSSAF — {monthLabel}
                </p>
                <p className={`text-xs ${faint}`}>
                  Total estimé : {fmt(actifs.reduce((s, e) => {
                    const b = calcBrutAjuste(e);
                    const csal = COT_SAL.reduce((a, c) => a + b * c.pct / 100, 0);
                    const cpat = COT_PAT.reduce((a, c) => a + b * c.pct / 100, 0);
                    return s + csal + cpat;
                  }, 0))} · Taux 2024 indicatifs
                </p>
              </div>
            </div>
            <button onClick={toggleUrssaf}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                isUrssafDone
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : isDark ? "border-white/10 bg-white/5 text-white/50 hover:text-white/80" : "border-black/10 bg-black/4 text-gray-500 hover:text-gray-800"
              }`}>
              {isUrssafDone ? <><CheckCircle2 size={12} /> Déclarée</> : "Marquer déclarée"}
            </button>
          </div>
        </div>
      )}

      {/* Progression bulletins */}
      {actifs.length > 0 && (
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className={`text-sm font-bold ${pri}`}>Bulletins — {monthLabel}</p>
              <p className={`text-xs ${mut}`}>{bulletinsGenerated}/{actifs.length} générés</p>
            </div>
            {bulletinsGenerated < actifs.length && (
              <button onClick={generateAll}
                className="flex items-center gap-1.5 rounded-xl border border-[#c9a55a]/30 bg-[#c9a55a]/10 px-3.5 py-2 text-xs font-bold text-[#c9a55a] hover:bg-[#c9a55a]/20 transition">
                <FileText size={12} /> Générer tous
              </button>
            )}
          </div>
          <div className={`px-5 pb-4`}>
            <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/8" : "bg-black/7"}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#c9a55a] to-[#f0c97a] transition-all"
                style={{ width: actifs.length > 0 ? `${Math.round((bulletinsGenerated / actifs.length) * 100)}%` : "0%" }} />
            </div>
          </div>
        </div>
      )}

      {/* KPIs mois */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Effectif", value: actifs.length.toString(), color: "#10b981" },
          { label: "Masse brute", value: fmt(actifs.reduce((s, e) => s + calcBrutAjuste(e), 0)), color: "#c9a55a" },
          { label: "Net versé", value: fmt(actifs.reduce((s, e) => s + calcNet(calcBrutAjuste(e)), 0)), color: "#60a5fa" },
          { label: "Charges patronales", value: fmt(actifs.reduce((s, e) => s + calcCharges(calcBrutAjuste(e)), 0)), color: "#f43f5e" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border p-4 ${card}`}>
            <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-15 blur-xl" style={{ background: color }} />
            <p className="text-xl font-black" style={{ color }}>{value}</p>
            <p className={`text-xs font-semibold ${mut}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Liste salariés + variables */}
      {actifs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className={`font-bold ${mut}`}>Aucun salarié actif</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actifs.map(emp => {
            const vars     = getEmpVariables(emp.id);
            const brutAj   = calcBrutAjuste(emp);
            const net      = calcNet(brutAj);
            const charges  = calcCharges(brutAj);
            const hasBull  = bulletins.has(emp.id);
            return (
              <div key={emp.id} className={`overflow-hidden rounded-2xl ${card}`}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                    style={{ background: avatarGradient(emp.id) }}>
                    {emp.nom[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${pri}`}>{emp.nom}</p>
                      {hasBull && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                    </div>
                    {emp.poste && <p className={`text-xs ${mut}`}>{emp.poste}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-black text-[#c9a55a]">{fmt(brutAj)}</p>
                    <p className={`text-xs ${faint}`}>brut ajusté</p>
                  </div>
                </div>

                {/* Variables */}
                {vars.length > 0 && (
                  <div className={`border-t px-5 py-3 space-y-1.5 ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"}`}>
                    {vars.map(v => (
                      <div key={v.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: VAR_COLORS[v.type] }} />
                          <span className={`text-xs ${sec}`}>{v.libelle}</span>
                          <span className="text-[11px] rounded px-1.5 py-0.5" style={{ background: VAR_COLORS[v.type] + "20", color: VAR_COLORS[v.type] }}>
                            {TYPE_VARIABLE_LABELS[v.type] ?? v.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${["retenue","avance"].includes(v.type) ? "text-red-400" : "text-emerald-400"}`}>
                            {["retenue","avance"].includes(v.type) ? "−" : "+"}{fmt2(v.montant)}
                          </span>
                          <button onClick={() => deleteVariable(v.id)} className={`h-5 w-5 flex items-center justify-center rounded transition ${isDark ? "text-white/20 hover:text-red-400" : "text-gray-300 hover:text-red-400"}`}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {brutAj !== emp.salaire_brut && (
                      <div className="flex items-center justify-between pt-1 border-t border-dashed" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                        <span className={`text-xs ${faint}`}>Brut ajusté</span>
                        <span className="text-xs font-bold text-[#c9a55a]">{fmt2(brutAj)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Résumé net + boutons */}
                <div className={`border-t grid grid-cols-3 divide-x px-0 py-0 ${isDark ? "border-white/[0.05] divide-white/[0.05]" : "border-black/[0.05] divide-black/[0.05]"}`}>
                  {[
                    { label: "Net à payer", value: fmt(net), color: "text-emerald-400" },
                    { label: "Charges pat.", value: fmt(charges), color: "text-red-400" },
                    { label: "Coût total",  value: fmt(brutAj + charges), color: "text-[#c9a55a]" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="px-4 py-2.5 text-center">
                      <p className={`text-xs font-black ${color}`}>{value}</p>
                      <p className={`text-[11px] ${faint}`}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className={`flex items-center gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"}`}>
                  <button onClick={() => { setShowVarForm(emp.id); setVarForm({ type: "prime", libelle: "", montant: "" }); }}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${isDark ? "border-white/8 text-white/40 hover:text-white/80" : "border-black/8 text-gray-400 hover:text-gray-700"}`}>
                    <Plus size={11} /> Variable
                  </button>
                  <button onClick={() => generateBulletin(emp)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      hasBull
                        ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400"
                        : isDark ? "border-white/8 text-white/40 hover:text-white/80" : "border-black/8 text-gray-400 hover:text-gray-700"
                    }`}>
                    <FileText size={11} /> {hasBull ? "Regénérer bulletin" : "Générer bulletin"}
                  </button>
                </div>

                {/* Inline variable form */}
                {showVarForm === emp.id && (
                  <div className={`border-t px-5 py-4 space-y-3 ${isDark ? "border-white/[0.05] bg-white/[0.02]" : "border-black/[0.05] bg-black/[0.02]"}`}>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {TYPES_VAR.map(t => (
                        <button key={t} onClick={() => setVarForm(f => ({ ...f, type: t }))}
                          className="rounded-lg border px-2.5 py-1 text-xs font-bold transition"
                          style={varForm.type === t
                            ? { background: VAR_COLORS[t] + "20", borderColor: VAR_COLORS[t] + "40", color: VAR_COLORS[t] }
                            : isDark ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }
                                     : { background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.08)", color: "#6b7280" }}>
                          {TYPE_VARIABLE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Libellé (ex: Prime vacances)" value={varForm.libelle}
                        onChange={e => setVarForm(f => ({ ...f, libelle: e.target.value }))}
                        className={`col-span-2 rounded-xl border px-3.5 py-2.5 text-sm outline-none ${isDark ? "border-white/[0.08] bg-white/[0.06] text-white placeholder-white/20" : "border-black/[0.08] bg-black/[0.03] text-gray-900 placeholder-gray-400"}`} />
                      <input type="number" placeholder="Montant (€)" value={varForm.montant}
                        onChange={e => setVarForm(f => ({ ...f, montant: e.target.value }))}
                        className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${isDark ? "border-white/[0.08] bg-white/[0.06] text-white placeholder-white/20 [color-scheme:dark]" : "border-black/[0.08] bg-black/[0.03] text-gray-900 placeholder-gray-400"}`} />
                      <div className="flex gap-1.5">
                        <button onClick={() => addVariable(emp.id)} disabled={saving}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition hover:brightness-110"
                          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Ajouter
                        </button>
                        <button onClick={() => setShowVarForm(null)} className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isDark ? "border-white/8 text-white/30 hover:bg-white/8" : "border-black/8 text-gray-400 hover:bg-black/4"}`}>
                          <X size={13} />
                        </button>
                      </div>
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
