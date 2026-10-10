"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, CheckCircle2, XCircle, Clock, Loader2, CalendarDays, Plane, SunMedium, Stethoscope } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe, DemandeConge } from "../rh-types";
import { fmtDateShort, TYPE_CONGE_LABELS } from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  add: (msg: string, type?: "success" | "error") => void;
  isDark: boolean;
}

const EMPTY = {
  employe_id: "", type: "cp", date_debut: "", date_fin: "", nb_jours: "", notes: "",
};

const TYPES_CONGE = [
  { id: "cp",           label: "Congés payés",    icon: Plane,        color: "#60a5fa" },
  { id: "rtt",          label: "RTT",              icon: SunMedium,    color: "#c9a55a" },
  { id: "maladie",      label: "Maladie",          icon: Stethoscope,  color: "#f87171" },
  { id: "maternite",    label: "Maternité",        icon: CalendarDays, color: "#ec4899" },
  { id: "paternite",    label: "Paternité",        icon: CalendarDays, color: "#8b5cf6" },
  { id: "sans_solde",   label: "Sans solde",       icon: CalendarDays, color: "#6b7280" },
  { id: "exceptionnel", label: "Événement familial",icon: CalendarDays, color: "#f97316" },
];

const STATUT_STYLE = {
  en_attente: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  label: "En attente"  },
  approuvee:  { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  label: "Approuvée"   },
  refusee:    { color: "#f43f5e", bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.25)",   label: "Refusée"     },
};

export default function CongesSection({ userId, employes, add, isDark }: Props) {
  const [demandes,       setDemandes]      = useState<(DemandeConge & { employe?: { nom: string } })[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [form,           setForm]           = useState({ ...EMPTY });
  const [saving,         setSaving]         = useState(false);
  const [filterStatut,   setFilterStatut]   = useState<string>("en_attente");
  const [showRefusForm,  setShowRefusForm]  = useState<string | null>(null);
  const [motifRefus,     setMotifRefus]     = useState("");

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
    setLoading(true);
    const { data } = await supabase
      .from("rh_demandes_conges")
      .select("*, employe:employes(nom)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setDemandes((data as (DemandeConge & { employe?: { nom: string } })[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const saveDemande = async () => {
    if (!userId || !form.employe_id || !form.date_debut || !form.date_fin || !form.nb_jours) return;
    const nb = parseFloat(form.nb_jours);
    if (isNaN(nb) || nb <= 0) { add("Nombre de jours invalide", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("rh_demandes_conges").insert({
      user_id: userId,
      employe_id: form.employe_id,
      type: form.type,
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      nb_jours: nb,
      notes: form.notes || null,
      statut: "en_attente",
    });
    setSaving(false);
    if (error) { add("Erreur lors de l'enregistrement", "error"); return; }
    add("Demande enregistrée", "success");
    setForm({ ...EMPTY });
    setShowForm(false);
    await load();
  };

  const approuver = async (id: string) => {
    await supabase.from("rh_demandes_conges").update({ statut: "approuvee" }).eq("id", id);
    add("Demande approuvée", "success");
    await load();
  };

  const refuser = async (id: string) => {
    if (!motifRefus.trim()) { add("Indiquez un motif de refus", "error"); return; }
    await supabase.from("rh_demandes_conges").update({ statut: "refusee", motif_refus: motifRefus.trim() }).eq("id", id);
    add("Demande refusée", "success");
    setShowRefusForm(null);
    setMotifRefus("");
    await load();
  };

  const filtered = demandes.filter(d => filterStatut === "all" || d.statut === filterStatut);

  // Auto-calculate nb_jours from date range
  const autoJours = () => {
    if (!form.date_debut || !form.date_fin) return;
    const d1 = new Date(form.date_debut);
    const d2 = new Date(form.date_fin);
    let days = 0;
    for (let d = new Date(d1); d <= d2; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) days++;
    }
    setForm(f => ({ ...f, nb_jours: days.toString() }));
  };

  const typeInfo = (type: string) => TYPES_CONGE.find(t => t.id === type) ?? TYPES_CONGE[0];

  const stats = {
    enAttente: demandes.filter(d => d.statut === "en_attente").length,
    approuvees: demandes.filter(d => d.statut === "approuvee").length,
    refusees: demandes.filter(d => d.statut === "refusee").length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
          <h2 className={`mt-1 text-2xl font-black ${pri}`}>Congés & Absences</h2>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={15} /> Nouvelle demande
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "En attente",  value: stats.enAttente,  color: "#f59e0b" },
          { label: "Approuvées",  value: stats.approuvees, color: "#10b981" },
          { label: "Refusées",    value: stats.refusees,   color: "#f43f5e" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border p-4 ${card}`}>
            <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-15 blur-xl" style={{ background: color }} />
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className={`text-xs font-semibold ${mut}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2">
        {[{ k: "en_attente", l: "En attente" }, { k: "approuvee", l: "Approuvées" }, { k: "refusee", l: "Refusées" }, { k: "all", l: "Toutes" }].map(({ k, l }) => {
          const st = STATUT_STYLE[k as keyof typeof STATUT_STYLE];
          const active = filterStatut === k;
          return (
            <button key={k} onClick={() => setFilterStatut(k)}
              className="rounded-xl border px-3.5 py-2 text-xs font-bold transition"
              style={active && st
                ? { background: st.bg, borderColor: st.border, color: st.color }
                : active
                  ? { background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)", color: isDark ? "#fff" : "#1f2937" }
                  : isDark
                    ? { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                    : { background: "#fff", borderColor: "rgba(0,0,0,0.08)", color: "#6b7280" }}>
              {l}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className={`animate-spin ${faint}`} /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <CalendarDays size={32} className={faint} />
          <div>
            <p className={`font-bold ${mut}`}>Aucune demande</p>
            <p className={`text-sm ${faint}`}>Les demandes de congés apparaîtront ici</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const ti = typeInfo(d.type);
            const st = STATUT_STYLE[d.statut] ?? STATUT_STYLE.en_attente;
            const Icon = ti.icon;
            return (
              <div key={d.id} className={`overflow-hidden rounded-2xl ${card}`}>
                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: ti.color + "18", border: `1px solid ${ti.color}30` }}>
                    <Icon size={16} style={{ color: ti.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className={`font-bold ${pri}`}>{d.employe?.nom ?? "Salarié inconnu"}</p>
                      <span className="rounded-lg border px-2 py-0.5 text-xs font-bold"
                        style={{ background: ti.color + "18", borderColor: ti.color + "30", color: ti.color }}>
                        {ti.label}
                      </span>
                      <span className="rounded-lg border px-2 py-0.5 text-xs font-bold"
                        style={{ background: st.bg, borderColor: st.border, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <p className={`text-xs ${mut}`}>
                      {fmtDateShort(d.date_debut)} → {fmtDateShort(d.date_fin)} · {d.nb_jours}j
                    </p>
                    {d.notes && <p className={`mt-0.5 text-xs ${faint}`}>{d.notes}</p>}
                    {d.motif_refus && (
                      <p className="mt-0.5 text-xs text-red-400">Motif : {d.motif_refus}</p>
                    )}
                  </div>
                  {d.statut === "en_attente" && (
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button onClick={() => approuver(d.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition">
                        <CheckCircle2 size={11} /> Approuver
                      </button>
                      <button onClick={() => { setShowRefusForm(d.id); setMotifRefus(""); }}
                        className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition">
                        <XCircle size={11} /> Refuser
                      </button>
                    </div>
                  )}
                </div>
                {/* Inline refus form */}
                {showRefusForm === d.id && (
                  <div className={`border-t px-5 py-4 space-y-3 ${isDark ? "border-white/[0.05] bg-red-500/5" : "border-black/[0.05] bg-red-50"}`}>
                    <label className={`text-xs font-semibold ${mut}`}>Motif de refus *</label>
                    <input type="text" value={motifRefus} onChange={e => setMotifRefus(e.target.value)}
                      placeholder="Expliquer le motif…"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
                    <div className="flex gap-2">
                      <button onClick={() => setShowRefusForm(null)}
                        className={`rounded-xl border px-4 py-2 text-xs font-semibold ${isDark ? "border-white/8 text-white/40" : "border-black/8 text-gray-400"}`}>
                        Annuler
                      </button>
                      <button onClick={() => refuser(d.id)}
                        className="rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/25 transition">
                        Confirmer le refus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nouvelle demande */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className={`w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl ${isDark ? "border-white/[0.08] bg-[#0e1420]" : "border-black/[0.08] bg-white"}`}>
            <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <h2 className={`text-sm font-bold ${pri}`}>Nouvelle demande de congé</h2>
              <button onClick={() => setShowForm(false)} className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "text-white/30 hover:bg-white/8" : "text-gray-400 hover:bg-black/5"}`}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              {/* Salarié */}
              <div>
                <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Salarié *</label>
                <select value={form.employe_id} onChange={e => setForm(f => ({ ...f, employe_id: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`}>
                  <option value="">Sélectionner</option>
                  {employes.filter(e => e.actif).map(e => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              </div>
              {/* Type */}
              <div>
                <label className={`mb-2 block text-xs font-semibold ${mut}`}>Type d&apos;absence</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES_CONGE.map(t => {
                    const Icon = t.icon;
                    const active = form.type === t.id;
                    return (
                      <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold text-left transition`}
                        style={active
                          ? { background: t.color + "18", borderColor: t.color + "40", color: t.color }
                          : isDark ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }
                                   : { background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.08)", color: "rgba(14,20,32,0.40)" }}>
                        <Icon size={12} /> {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Date de début *</label>
                  <input type="date" value={form.date_debut}
                    onChange={e => { setForm(f => ({ ...f, date_debut: e.target.value })); setTimeout(autoJours, 10); }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
                </div>
                <div>
                  <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Date de fin *</label>
                  <input type="date" value={form.date_fin}
                    onChange={e => { setForm(f => ({ ...f, date_fin: e.target.value })); setTimeout(autoJours, 10); }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
                </div>
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Nombre de jours ouvrés *</label>
                <div className="flex gap-2">
                  <input type="number" min="0.5" step="0.5" value={form.nb_jours}
                    onChange={e => setForm(f => ({ ...f, nb_jours: e.target.value }))}
                    className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
                  <button onClick={autoJours}
                    className={`rounded-xl border px-3 text-xs font-semibold ${isDark ? "border-white/8 text-white/40 hover:text-white/70" : "border-black/8 text-gray-400 hover:text-gray-700"}`}>
                    Auto
                  </button>
                </div>
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none ${inp}`}
                  placeholder="Informations complémentaires…" />
              </div>
            </div>
            <div className={`flex gap-2 border-t px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <button onClick={() => setShowForm(false)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold ${isDark ? "border-white/8 text-white/40" : "border-black/8 text-gray-400"}`}>
                Annuler
              </button>
              <button onClick={saveDemande} disabled={saving || !form.employe_id || !form.date_debut || !form.date_fin || !form.nb_jours}
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
