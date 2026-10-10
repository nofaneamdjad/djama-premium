"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Briefcase, Plus, X, User, CheckCircle2, Loader2,
  MapPin, Calendar, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe } from "../rh-types";

interface Props {
  userId: string | null;
  employes: Employe[];
  add: (msg: string, type?: "success" | "error") => void;
  isDark: boolean;
}

interface Candidature {
  id: string;
  user_id: string;
  nom: string;
  prenom?: string;
  poste: string;
  departement?: string;
  statut: "nouveau" | "a_contacter" | "entretien" | "teste" | "offre" | "recrute" | "refuse";
  source?: string;
  email?: string;
  telephone?: string;
  notes?: string;
  created_at: string;
}

const STATUTS: { id: Candidature["statut"]; label: string; color: string }[] = [
  { id: "nouveau",      label: "Nouveau",      color: "#6b7280" },
  { id: "a_contacter",  label: "À contacter",  color: "#f59e0b" },
  { id: "entretien",    label: "Entretien",    color: "#60a5fa" },
  { id: "teste",        label: "Test",         color: "#a855f7" },
  { id: "offre",        label: "Offre",        color: "#c9a55a" },
  { id: "recrute",      label: "Recruté",      color: "#10b981" },
  { id: "refuse",       label: "Refusé",       color: "#f43f5e" },
];

export default function RecrutementSection({ userId, employes, add, isDark }: Props) {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", poste: "", departement: "",
    statut: "nouveau" as Candidature["statut"],
    source: "", email: "", telephone: "", notes: "",
  });

  const card  = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri   = isDark ? "text-white"    : "text-gray-900";
  const sec   = isDark ? "text-white/70" : "text-gray-600";
  const mut   = isDark ? "text-white/40" : "text-gray-400";
  const faint = isDark ? "text-white/20" : "text-gray-300";
  const inp   = isDark
    ? "border-white/[0.08] bg-white/[0.06] text-white placeholder-white/20 focus:border-white/20 [color-scheme:dark]"
    : "border-black/[0.08] bg-black/[0.03] text-gray-900 placeholder-gray-400 focus:border-black/20";

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from("rh_candidatures")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCandidatures((data as Candidature[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!userId || !form.nom.trim() || !form.poste.trim()) { add("Nom et poste requis", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("rh_candidatures").insert({
      user_id:     userId,
      nom:         form.nom.trim(),
      prenom:      form.prenom.trim() || null,
      poste:       form.poste.trim(),
      departement: form.departement.trim() || null,
      statut:      form.statut,
      source:      form.source.trim() || null,
      email:       form.email.trim() || null,
      telephone:   form.telephone.trim() || null,
      notes:       form.notes.trim() || null,
    });
    setSaving(false);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add("Candidature ajoutée", "success");
    setForm({ nom: "", prenom: "", poste: "", departement: "", statut: "nouveau", source: "", email: "", telephone: "", notes: "" });
    setShowForm(false);
    await load();
  };

  const updateStatut = async (id: string, statut: Candidature["statut"]) => {
    await supabase.from("rh_candidatures").update({ statut }).eq("id", id);
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, statut } : c));
  };

  const deleteCand = async (id: string, nom: string) => {
    if (!confirm(`Supprimer la candidature de ${nom} ?`)) return;
    await supabase.from("rh_candidatures").delete().eq("id", id);
    add("Candidature supprimée", "success");
    await load();
  };

  const countByStatut = (s: string) => candidatures.filter(c => c.statut === s).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
          <h2 className={`mt-1 text-2xl font-black ${pri}`}>Recrutement</h2>
          <p className={`mt-1 text-sm ${mut}`}>{employes.filter(e => e.actif).length} salarié{employes.filter(e => e.actif).length !== 1 ? "s" : ""} actif{employes.filter(e => e.actif).length !== 1 ? "s" : ""} · {candidatures.length} candidature{candidatures.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-xl py-2.5 px-4 text-sm font-bold transition hover:brightness-110 self-start"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={14} /> Nouvelle candidature
        </button>
      </div>

      {/* Pipeline kanban — résumé */}
      <div className="flex flex-wrap gap-2">
        {STATUTS.map(s => (
          <div key={s.id} className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5"
            style={{ background: s.color + "10", borderColor: s.color + "25" }}>
            <span className="text-xs font-bold" style={{ color: s.color }}>{s.label}</span>
            <span className="text-xs font-black" style={{ color: s.color }}>{countByStatut(s.id)}</span>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-white/[0.08] bg-white/[0.04]" : "border-black/[0.08] bg-black/[0.02]"}`}>
          <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <p className={`font-bold ${pri}`}>Nouvelle candidature</p>
            <button onClick={() => setShowForm(false)} className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "text-white/30 hover:bg-white/8" : "text-gray-400 hover:bg-black/5"}`}>
              <X size={13} />
            </button>
          </div>
          <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
            <input type="text" placeholder="Nom *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
            <input type="text" placeholder="Prénom" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
              className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
            <input type="text" placeholder="Poste visé *" value={form.poste} onChange={e => setForm(f => ({ ...f, poste: e.target.value }))}
              className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
            <input type="text" placeholder="Département" value={form.departement} onChange={e => setForm(f => ({ ...f, departement: e.target.value }))}
              className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
            <input type="tel" placeholder="Téléphone" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
              className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
            <input type="text" placeholder="Source (LinkedIn, Pôle Emploi…)" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
            <div>
              <p className={`mb-1.5 text-xs font-semibold ${mut}`}>Statut initial</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUTS.slice(0, 4).map(s => (
                  <button key={s.id} onClick={() => setForm(f => ({ ...f, statut: s.id }))}
                    className="rounded-lg border px-2 py-1 text-xs font-bold transition"
                    style={form.statut === s.id
                      ? { background: s.color + "20", borderColor: s.color + "40", color: s.color }
                      : isDark ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }
                               : { background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.08)", color: "#9ca3af" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              className={`col-span-2 rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none ${inp}`} />
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? "border-white/8 text-white/40" : "border-black/8 text-gray-400"}`}>
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste candidatures */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className={`animate-spin ${mut}`} /></div>
      ) : candidatures.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Briefcase size={32} className={faint} />
          <p className={`font-bold ${mut}`}>Aucune candidature</p>
          <p className={`text-sm ${faint}`}>Ajoutez votre première candidature</p>
        </div>
      ) : (
        <div className="space-y-2">
          {candidatures.map(c => {
            const stat = STATUTS.find(s => s.id === c.statut) ?? STATUTS[0];
            const isExpanded = expanded === c.id;
            return (
              <div key={c.id} className={`overflow-hidden rounded-2xl ${card}`}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? "bg-white/[0.06]" : "bg-black/[0.05]"}`}>
                    <User size={16} className="text-[#c9a55a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-bold ${pri}`}>{c.nom}{c.prenom ? ` ${c.prenom}` : ""}</p>
                      <span className="rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background: stat.color + "15", color: stat.color }}>
                        {stat.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-0.5">
                      <span className={`flex items-center gap-1 text-xs ${mut}`}><Briefcase size={10} />{c.poste}</span>
                      {c.departement && <span className={`flex items-center gap-1 text-xs ${mut}`}><MapPin size={10} />{c.departement}</span>}
                      <span className={`flex items-center gap-1 text-xs ${faint}`}><Calendar size={10} />{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setExpanded(v => v === c.id ? null : c.id)} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isDark ? "text-white/30 hover:bg-white/8" : "text-gray-400 hover:bg-black/5"}`}>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <button onClick={() => deleteCand(c.id, c.nom)} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isDark ? "text-white/20 hover:bg-red-500/10 hover:text-red-400" : "text-gray-300 hover:bg-red-50 hover:text-red-400"}`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className={`border-t px-5 py-4 space-y-3 ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"}`}>
                    {(c.email || c.telephone) && (
                      <div className="flex flex-wrap gap-4">
                        {c.email && <p className={`text-sm ${sec}`}>✉ {c.email}</p>}
                        {c.telephone && <p className={`text-sm ${sec}`}>☎ {c.telephone}</p>}
                      </div>
                    )}
                    {c.source && <p className={`text-sm ${mut}`}>Source : {c.source}</p>}
                    {c.notes && <p className={`text-sm ${sec}`}>{c.notes}</p>}
                    <div>
                      <p className={`mb-2 text-xs font-semibold ${mut}`}>Avancer le statut</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUTS.map(s => (
                          <button key={s.id} onClick={() => updateStatut(c.id, s.id)}
                            className="rounded-lg border px-2.5 py-1 text-xs font-bold transition"
                            style={c.statut === s.id
                              ? { background: s.color + "20", borderColor: s.color + "40", color: s.color }
                              : isDark ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }
                                       : { background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.08)", color: "#9ca3af" }}>
                            {s.label}
                          </button>
                        ))}
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
