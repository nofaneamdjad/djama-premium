"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Plus, X, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, fmtDate, daysUntil, fmt, GOLD, ECHEANCE_STATUT_CFG, ECHEANCE_COLORS } from "../decl-utils";
import type { Echeance, EcheanceStatut, FiscalProfile } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  add: (msg: string, type?: "success" | "error") => void;
}

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

function weeksFor(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7;
  const days: (number | null)[] = [...Array(startDay).fill(null)];
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

export default function CalendrierSection({ userId, isDark, profile, add }: Props) {
  const t = tok(isDark);
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    libelle: "",
    type_echeance: "tva",
    date_echeance: "",
    montant_estime: "",
    devise: profile?.devise_principale ?? "EUR",
    rappel_jours_avant: "7",
    notes: "",
  });

  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase.from("decl_echeances")
      .select("*")
      .eq("user_id", userId)
      .gte("date_echeance", start)
      .lte("date_echeance", end)
      .order("date_echeance")
      .then(({ data }) => {
        setEcheances((data as Echeance[]) ?? []);
        setLoading(false);
      });
  }, [userId, year, month]);

  async function toggleStatut(id: string, statut: EcheanceStatut) {
    await supabase.from("decl_echeances").update({ statut }).eq("id", id);
    setEcheances(prev => prev.map(e => e.id === id ? { ...e, statut } : e));
  }

  async function saveEcheance() {
    if (!userId || !form.libelle.trim() || !form.date_echeance) return;
    setSaving(true);
    const { error } = await supabase.from("decl_echeances").insert({
      user_id: userId,
      libelle: form.libelle,
      type_echeance: form.type_echeance,
      date_echeance: form.date_echeance,
      montant_estime: form.montant_estime ? parseFloat(form.montant_estime) : null,
      devise: form.devise,
      rappel_jours_avant: parseInt(form.rappel_jours_avant),
      notes: form.notes || null,
      statut: "a_faire" as EcheanceStatut,
      pays: profile?.pays_constitution ?? "FR",
    });
    setSaving(false);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add("Échéance ajoutée", "success");
    setShowForm(false);
    const eDate = new Date(form.date_echeance);
    if (eDate.getFullYear() === year && eDate.getMonth() === month) {
      const { data } = await supabase.from("decl_echeances").select("*").eq("user_id", userId)
        .gte("date_echeance", start).lte("date_echeance", end).order("date_echeance");
      setEcheances((data as Echeance[]) ?? []);
    }
  }

  const byDay = echeances.reduce((acc, e) => {
    const d = new Date(e.date_echeance + "T12:00:00").getDate();
    (acc[d] ??= []).push(e);
    return acc;
  }, {} as Record<number, Echeance[]>);

  const selectedEcheances = selected ? (byDay[selected] ?? []) : [];
  const weeks = weeksFor(year, month);

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputStyle = { background: t.glassMd, border: `1px solid ${t.border}`, color: t.text };

  return (
    <div className="space-y-5">
      {/* Nav mois */}
      <div className="flex items-center gap-3">
        <button onClick={() => { const d = new Date(year, month - 1); setYear(d.getFullYear()); setMonth(d.getMonth()); setSelected(null); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <ChevronLeft size={14} style={{ color: t.text2 }} />
        </button>
        <span className="flex-1 text-center text-sm font-semibold capitalize" style={{ color: t.text }}>
          {new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => { const d = new Date(year, month + 1); setYear(d.getFullYear()); setMonth(d.getMonth()); setSelected(null); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <ChevronRight size={14} style={{ color: t.text2 }} />
        </button>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
          style={{ background: GOLD, color: "#111" }}>
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${GOLD}30` }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold" style={{ color: t.text }}>Nouvelle échéance</span>
            <button onClick={() => setShowForm(false)}><X size={14} style={{ color: t.text3 }} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Libellé *</label>
              <input className={inputCls} style={inputStyle} value={form.libelle} onChange={e => setForm(p => ({ ...p, libelle: e.target.value }))} placeholder="ex. TVA décembre" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Date d'échéance *</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.date_echeance} onChange={e => setForm(p => ({ ...p, date_echeance: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Type</label>
              <select className={inputCls} style={inputStyle} value={form.type_echeance} onChange={e => setForm(p => ({ ...p, type_echeance: e.target.value }))}>
                {Object.keys(ECHEANCE_COLORS).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Montant estimé</label>
              <input type="number" className={inputCls} style={inputStyle} value={form.montant_estime} onChange={e => setForm(p => ({ ...p, montant_estime: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Rappel (jours avant)</label>
              <input type="number" className={inputCls} style={inputStyle} value={form.rappel_jours_avant} onChange={e => setForm(p => ({ ...p, rappel_jours_avant: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={saveEcheance} disabled={saving || !form.libelle.trim() || !form.date_echeance}
              className="text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-40 active:scale-95"
              style={{ background: GOLD, color: "#111" }}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs px-3 py-2 rounded-xl" style={{ color: t.text3 }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Calendrier grille */}
      <div className="rounded-2xl overflow-hidden" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: t.borderSoft }}>
          {JOURS.map((j, i) => (
            <div key={i} className="text-center py-2 text-[11px] font-semibold" style={{ color: t.text3 }}>{j}</div>
          ))}
        </div>
        {loading && <div className="py-12 flex justify-center"><RefreshCw size={16} className="animate-spin" style={{ color: t.text3 }} /></div>}
        {!loading && weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < weeks.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
            {week.map((day, di) => {
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const hasItems = day !== null && byDay[day]?.length > 0;
              const isSelected = day === selected;
              const dayEchs = day !== null ? (byDay[day] ?? []) : [];
              const hasLate = dayEchs.some(e => e.statut === "en_retard");
              return (
                <button
                  key={di}
                  disabled={day === null}
                  onClick={() => day !== null && setSelected(isSelected ? null : day)}
                  className="min-h-[52px] flex flex-col items-center pt-2 pb-1 gap-1 transition-all"
                  style={{
                    borderLeft: di > 0 ? `1px solid ${t.borderSoft}` : "none",
                    background: isSelected ? `${GOLD}12` : "transparent",
                  }}
                >
                  {day !== null && (
                    <>
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium"
                        style={{
                          background: isToday ? GOLD : "transparent",
                          color: isToday ? "#111" : t.text2,
                        }}
                      >{day}</span>
                      {hasItems && (
                        <div className="flex gap-0.5 flex-wrap justify-center max-w-[32px]">
                          {dayEchs.slice(0, 3).map((e, ei) => (
                            <span key={ei} className="w-1.5 h-1.5 rounded-full"
                              style={{ background: hasLate ? "#ef4444" : (ECHEANCE_COLORS[e.type_echeance] ?? GOLD) }} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Détail jour sélectionné */}
      {selected !== null && (
        <div className="rounded-2xl overflow-hidden" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: GOLD }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>
                {selected} {MOIS[month]} {year}
              </span>
            </div>
          </div>
          {selectedEcheances.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: t.text3 }}>Aucune échéance ce jour</p>
            </div>
          ) : (
            <div>
              {selectedEcheances.map((e, i) => {
                const cfg = ECHEANCE_STATUT_CFG[e.statut];
                const days = daysUntil(e.date_echeance);
                return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-4"
                    style={{ borderBottom: i < selectedEcheances.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ECHEANCE_COLORS[e.type_echeance] ?? GOLD }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: t.text }}>{e.libelle}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
                        {e.montant_estime != null && (
                          <span className="text-xs tabular-nums" style={{ color: t.text3 }}>{fmt(e.montant_estime, e.devise)}</span>
                        )}
                        <span className="text-xs" style={{ color: t.text4 }}>
                          {days <= 0 ? "Échue" : days === 1 ? "Demain" : `Dans ${days}j`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.statut === "a_faire" && (
                        <button
                          onClick={() => toggleStatut(e.id, "faite")}
                          className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg active:scale-95"
                          style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
                        >Marquer faite</button>
                      )}
                      {e.statut === "faite" && (
                        <button
                          onClick={() => toggleStatut(e.id, "a_faire")}
                          className="text-[10px] px-2.5 py-1.5 rounded-lg active:scale-95"
                          style={{ color: t.text3 }}
                        >Rouvrir</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Liste du mois */}
      {!loading && echeances.length > 0 && selected === null && (
        <div className="rounded-2xl overflow-hidden" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
            <span className="text-sm font-semibold" style={{ color: t.text }}>
              Toutes les échéances — {new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long" })}
            </span>
          </div>
          <div>
            {echeances.map((e, i) => {
              const cfg = ECHEANCE_STATUT_CFG[e.statut];
              return (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderBottom: i < echeances.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ECHEANCE_COLORS[e.type_echeance] ?? GOLD }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: t.text }}>{e.libelle}</div>
                    <div className="text-xs mt-0.5" style={{ color: t.text3 }}>{fmtDate(e.date_echeance)}</div>
                  </div>
                  {e.montant_estime != null && (
                    <span className="text-xs tabular-nums shrink-0" style={{ color: t.text2 }}>{fmt(e.montant_estime, e.devise)}</span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ color: cfg.color, background: `${cfg.color}18` }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
