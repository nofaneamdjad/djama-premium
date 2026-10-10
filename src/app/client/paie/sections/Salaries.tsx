"use client";

import { useState, useCallback } from "react";
import {
  Plus, Search, X, Loader2, Users, Trash2, Pencil,
  Calendar, Mail, Phone, Building2, CheckCircle2,
  FileText, ChevronDown, Archive, RefreshCw,
  Banknote, SunMedium, Plane, Stethoscope, History,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe, AbsenceBalance } from "../rh-types";
import {
  calcNet, calcCharges, fmt, fmt2, fmtDate, avatarGradient,
  CONTRAT_COLORS, COT_SAL, COT_PAT, generateBulletinHtml,
} from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  refresh: () => Promise<void>;
  add: (msg: string, type?: "success" | "error" | "info") => void;
  isDark: boolean;
}

const CONTRATS = ["CDI", "CDD", "Freelance", "Stage", "Alternance"] as const;

const EMPTY_FORM = {
  nom: "", poste: "", email: "", telephone: "",
  departement: "", etablissement: "", matricule: "",
  salaire_brut: "", date_embauche: "",
  type_contrat: "CDI" as typeof CONTRATS[number],
  statut: "actif",
};

type DrawerTab = "infos" | "salaire" | "absences" | "historique";

export default function SalariesSection({ userId, employes, refresh, add, isDark }: Props) {
  const [search,    setSearch]   = useState("");
  const [filter,    setFilter]   = useState<string>("all");
  const [showForm,  setShowForm]  = useState(false);
  const [editMode,  setEditMode]  = useState(false);
  const [form,      setForm]      = useState({ ...EMPTY_FORM });
  const [drawer,    setDrawer]    = useState<Employe | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("infos");
  const [absences,  setAbsences]  = useState<Record<string, AbsenceBalance>>({});
  const [bulletins, setBulletins] = useState<Record<string, string[]>>({});
  const [saving,    setSaving]    = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const card   = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri    = isDark ? "text-white"    : "text-gray-900";
  const sec    = isDark ? "text-white/70" : "text-gray-600";
  const mut    = isDark ? "text-white/40" : "text-gray-400";
  const faint  = isDark ? "text-white/20" : "text-gray-300";
  const inp    = isDark
    ? "border-white/[0.08] bg-white/[0.06] text-white placeholder-white/20 focus:border-white/20 [color-scheme:dark]"
    : "border-black/[0.08] bg-black/[0.03] text-gray-900 placeholder-gray-400 focus:border-black/20";
  const divs   = isDark ? "divide-white/[0.05]" : "divide-black/[0.05]";

  const loadDrawerData = useCallback(async (emp: Employe) => {
    if (!userId) return;
    const [absRes, histRes] = await Promise.all([
      supabase.from("employe_absences").select("*").eq("user_id", userId).eq("employee_id", emp.id).single(),
      supabase.from("payslips").select("month_key").eq("user_id", userId).eq("employee_id", emp.id),
    ]);
    if (absRes.data) setAbsences(prev => ({ ...prev, [emp.id]: { cp: absRes.data.cp, rtt: absRes.data.rtt, maladie: absRes.data.maladie } }));
    if (histRes.data) setBulletins(prev => ({ ...prev, [emp.id]: histRes.data.map((r: { month_key: string }) => r.month_key) }));
  }, [userId]);

  const openDrawer = (emp: Employe) => {
    setDrawer(emp);
    setDrawerTab("infos");
    loadDrawerData(emp);
  };

  const openAddForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditMode(false);
    setShowForm(true);
  };

  const openEditForm = (emp: Employe) => {
    setForm({
      nom: emp.nom, poste: emp.poste ?? "", email: emp.email ?? "",
      telephone: emp.telephone ?? "", departement: emp.departement ?? "",
      etablissement: emp.etablissement ?? "", matricule: emp.matricule ?? "",
      salaire_brut: emp.salaire_brut.toString(),
      date_embauche: emp.date_embauche ?? "",
      type_contrat: (emp.type_contrat as typeof CONTRATS[number]) ?? "CDI",
      statut: emp.statut ?? "actif",
    });
    setEditMode(true);
    setShowForm(true);
  };

  const saveEmployee = async () => {
    if (!userId || !form.nom.trim() || !form.salaire_brut) return;
    const brut = parseFloat(form.salaire_brut);
    if (isNaN(brut) || brut <= 0) { add("Salaire invalide", "error"); return; }
    setSaving(true);
    const payload = {
      nom: form.nom.trim(), poste: form.poste.trim() || null,
      email: form.email.trim() || null, telephone: form.telephone.trim() || null,
      departement: form.departement.trim() || null,
      etablissement: form.etablissement.trim() || null,
      matricule: form.matricule.trim() || null,
      salaire_brut: brut, date_embauche: form.date_embauche || null,
      type_contrat: form.type_contrat, statut: form.statut,
      actif: form.statut !== "sorti",
    };
    if (editMode && drawer) {
      const { error } = await supabase.from("employes").update(payload).eq("id", drawer.id);
      if (error) { add("Erreur lors de la mise à jour", "error"); setSaving(false); return; }
      add("Salarié mis à jour", "success");
      setDrawer(prev => prev ? ({ ...prev, ...payload } as Employe) : null);
    } else {
      const { error } = await supabase.from("employes").insert({ user_id: userId, ...payload });
      if (error) { add("Erreur lors de l'ajout", "error"); setSaving(false); return; }
      add(`${form.nom} ajouté`, "success");
    }
    setSaving(false);
    setShowForm(false);
    await refresh();
  };

  const deleteEmployee = async (id: string, nom: string) => {
    if (!confirm(`Archiver ${nom} ? Les données seront conservées.`)) return;
    await supabase.from("employes").update({ actif: false, statut: "sorti" }).eq("id", id);
    if (drawer?.id === id) setDrawer(null);
    add(`${nom} archivé`, "success");
    await refresh();
  };

  const restoreEmployee = async (id: string, nom: string) => {
    await supabase.from("employes").update({ actif: true, statut: "actif" }).eq("id", id);
    add(`${nom} réactivé`, "success");
    await refresh();
  };

  const updateAbsence = async (empId: string, field: keyof AbsenceBalance, delta: number) => {
    const cur  = absences[empId] ?? { cp: 0, rtt: 0, maladie: 0 };
    const next = { ...cur, [field]: Math.max(0, cur[field] + delta) };
    setAbsences(prev => ({ ...prev, [empId]: next }));
    if (userId) {
      await supabase.from("employe_absences")
        .upsert({ user_id: userId, employee_id: empId, ...next }, { onConflict: "user_id,employee_id" });
    }
  };

  const generateBulletin = async (emp: Employe) => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthLabel = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    if (userId) {
      await supabase.from("payslips")
        .upsert({ user_id: userId, employee_id: emp.id, month_key: monthKey, html_content: monthKey }, { onConflict: "user_id,employee_id,month_key" });
    }
    setBulletins(prev => ({ ...prev, [emp.id]: [...new Set([...(prev[emp.id] ?? []), monthKey])] }));
    const html = generateBulletinHtml(emp, monthLabel);
    const w = window.open("", "_blank", "width=780,height=900");
    if (w) { w.document.write(html); w.document.close(); }
    add(`Bulletin ${emp.nom} généré`, "success");
  };

  const visible = employes.filter(e => {
    if (!showArchived && !e.actif) return false;
    if (showArchived && e.actif) return false;
    const q = search.toLowerCase();
    return (
      (!q || e.nom.toLowerCase().includes(q) || (e.poste ?? "").toLowerCase().includes(q) || (e.departement ?? "").toLowerCase().includes(q))
      && (filter === "all" || e.type_contrat === filter)
    );
  });

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div className={`flex items-start justify-between py-2 border-b last:border-0 ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"}`}>
      <span className={`text-xs ${mut}`}>{label}</span>
      <span className={`text-xs font-semibold ${sec} text-right max-w-[60%]`}>{value || "—"}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
          <h2 className={`mt-1 text-2xl font-black ${pri}`}>Salariés</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(a => !a)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              showArchived
                ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                : isDark ? "border-white/8 bg-white/4 text-white/40 hover:text-white/70" : "border-black/8 bg-white text-gray-400 hover:text-gray-700"
            }`}>
            <Archive size={12} /> {showArchived ? "Actifs" : "Archivés"}
          </button>
          {!showArchived && (
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              <Plus size={15} /> Nouveau salarié
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className={`flex flex-1 items-center gap-2.5 rounded-2xl border px-4 py-3 ${isDark ? "border-white/8 bg-white/4" : "border-black/8 bg-white"}`}>
          <Search size={14} className={mut} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher nom, poste, département…"
            className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white placeholder-white/25" : "text-gray-800 placeholder:text-gray-400"}`} />
          {search && <button onClick={() => setSearch("")} className={mut}><X size={13} /></button>}
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(["all", ...CONTRATS] as const).map(k => {
            const s = k !== "all" ? CONTRAT_COLORS[k] : null;
            const active = filter === k;
            return (
              <button key={k} onClick={() => setFilter(k)}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all`}
                style={active && s
                  ? { background: s.bg, borderColor: s.border, color: s.color }
                  : active
                    ? { background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)", color: isDark ? "#fff" : "#1f2937" }
                    : { background: isDark ? "rgba(255,255,255,0.03)" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)", color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" }}>
                {k === "all" ? "Tous" : k}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-3xl border ${card}`}>
            <Users size={24} className={faint} />
          </div>
          <div>
            <p className={`font-bold ${mut}`}>{search ? "Aucun résultat" : showArchived ? "Aucun salarié archivé" : "Aucun salarié enregistré"}</p>
            <p className={`mt-1 text-sm ${faint}`}>{search ? "Essaie un autre mot-clé" : showArchived ? "" : "Ajoutez votre premier salarié"}</p>
          </div>
          {!search && !showArchived && (
            <button onClick={openAddForm}
              className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              <Plus size={14} /> Ajouter un salarié
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(emp => {
            const net     = calcNet(emp.salaire_brut);
            const charges = calcCharges(emp.salaire_brut);
            const c       = CONTRAT_COLORS[emp.type_contrat] ?? CONTRAT_COLORS.CDI;
            const hasBulletin = (bulletins[emp.id] ?? []).includes(currentMonthKey);
            return (
              <div key={emp.id}
                onClick={() => openDrawer(emp)}
                className={`group relative cursor-pointer overflow-hidden rounded-3xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${card}`}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
                  style={{ background: c.color }} />
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg"
                    style={{ background: avatarGradient(emp.id) }}>
                    {emp.nom[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1"
                      style={{ background: c.bg, borderColor: c.border }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                      <span className="text-xs font-bold" style={{ color: c.color }}>{emp.type_contrat}</span>
                    </div>
                    {hasBulletin && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 size={9} /> Bulletin émis
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-bold ${pri}`}>{emp.nom}</p>
                {emp.poste && <p className={`text-xs ${mut}`}>{emp.poste}</p>}
                {emp.departement && <p className={`text-xs ${faint}`}>{emp.departement}</p>}
                {!emp.actif && (
                  <span className="mt-1 inline-block rounded-md bg-gray-500/10 px-2 py-0.5 text-[11px] font-bold text-gray-400">Archivé</span>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Brut",    value: fmt(emp.salaire_brut), color: sec              },
                    { label: "Net",     value: fmt(net),              color: "text-emerald-500" },
                    { label: "Charges", value: fmt(charges),          color: "text-red-400"    },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl px-2 py-2 text-center ${isDark ? "bg-white/[0.05]" : "bg-black/[0.04]"}`}>
                      <p className={`text-xs font-bold ${color}`}>{value}</p>
                      <p className={`mt-0.5 text-[11px] ${faint}`}>{label}</p>
                    </div>
                  ))}
                </div>
                {emp.date_embauche && (
                  <p className={`mt-3 flex items-center gap-1 text-xs ${faint}`}>
                    <Calendar size={9} /> {new Date(emp.date_embauche).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Drawer ── */}
      {drawer && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-hidden border-l shadow-2xl ${isDark ? "bg-[#0e1420] border-white/[0.06]" : "bg-white border-black/[0.08]"}`}>
            {/* Drawer header */}
            <div className={`border-b px-5 py-5 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white"
                    style={{ background: avatarGradient(drawer.id) }}>
                    {drawer.nom[0].toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-bold ${pri}`}>{drawer.nom}</p>
                    {drawer.poste && <p className={`text-xs ${mut}`}>{drawer.poste}</p>}
                    {drawer.matricule && <p className={`text-[11px] font-mono ${faint}`}>#{drawer.matricule}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { setDrawer(null); openEditForm(drawer); }}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition hover:border-[#c9a55a]/30 hover:bg-[#c9a55a]/10 hover:text-[#c9a55a] ${isDark ? "border-white/8 text-white/30" : "border-black/8 text-gray-400"}`}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => generateBulletin(drawer)}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 ${isDark ? "border-white/8 text-white/30" : "border-black/8 text-gray-400"}`}>
                    <FileText size={12} />
                  </button>
                  {drawer.actif ? (
                    <button onClick={() => deleteEmployee(drawer.id, drawer.nom)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 ${isDark ? "border-white/8 text-white/30" : "border-black/8 text-gray-400"}`}>
                      <Archive size={12} />
                    </button>
                  ) : (
                    <button onClick={() => { restoreEmployee(drawer.id, drawer.nom); setDrawer(null); }}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 ${isDark ? "border-white/8 text-white/30" : "border-black/8 text-gray-400"}`}>
                      <RefreshCw size={12} />
                    </button>
                  )}
                  <button onClick={() => setDrawer(null)}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${isDark ? "text-white/30 hover:bg-white/8" : "text-gray-400 hover:bg-black/5"}`}>
                    <X size={15} />
                  </button>
                </div>
              </div>
              {/* Contrat badge */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1"
                  style={{ background: CONTRAT_COLORS[drawer.type_contrat]?.bg, borderColor: CONTRAT_COLORS[drawer.type_contrat]?.border }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CONTRAT_COLORS[drawer.type_contrat]?.color }} />
                  <span className="text-xs font-bold" style={{ color: CONTRAT_COLORS[drawer.type_contrat]?.color }}>{drawer.type_contrat}</span>
                </div>
                {!drawer.actif && <span className="rounded-xl border border-gray-500/20 bg-gray-500/10 px-2.5 py-1 text-xs font-bold text-gray-400">Archivé</span>}
              </div>
              {/* Tabs */}
              <div className={`flex gap-0.5 rounded-xl border p-1 ${isDark ? "border-white/[0.06] bg-white/[0.04]" : "border-black/[0.08] bg-black/[0.03]"}`}>
                {(["infos", "salaire", "absences", "historique"] as DrawerTab[]).map(tab => (
                  <button key={tab} onClick={() => setDrawerTab(tab)}
                    className={`flex-1 rounded-lg px-1 py-1.5 text-xs font-bold capitalize transition ${
                      drawerTab === tab
                        ? isDark ? "bg-white/12 text-white" : "bg-white text-gray-900 shadow-sm"
                        : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-700"
                    }`}>
                    {tab === "infos" ? "Infos" : tab === "salaire" ? "Salaire" : tab === "absences" ? "Absences" : "Historique"}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Infos tab */}
              {drawerTab === "infos" && (
                <div className={`rounded-2xl border overflow-hidden ${card}`}>
                  <div className={`px-4 py-3 border-b ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest ${faint}`}>Fiche salarié</p>
                  </div>
                  <div className="px-4 py-2">
                    <Field label="Nom complet"   value={drawer.nom} />
                    <Field label="Poste"          value={drawer.poste} />
                    <Field label="Email"          value={drawer.email} />
                    <Field label="Téléphone"      value={drawer.telephone} />
                    <Field label="Département"    value={drawer.departement} />
                    <Field label="Établissement"  value={drawer.etablissement} />
                    <Field label="Matricule"      value={drawer.matricule} />
                    <Field label="Type de contrat" value={drawer.type_contrat} />
                    <Field label="Quotité horaire" value={drawer.quotite_horaire ? `${drawer.quotite_horaire}h/sem` : "35h/sem"} />
                    <Field label="Date d'embauche" value={fmtDate(drawer.date_embauche)} />
                    <Field label="Statut"          value={drawer.statut ?? "actif"} />
                    <Field label="Régime"          value={drawer.regime ?? "Régime général"} />
                  </div>
                </div>
              )}

              {/* Salaire tab */}
              {drawerTab === "salaire" && (
                <>
                  <div className={`overflow-hidden rounded-2xl border ${card}`}>
                    <div className={`border-b px-4 py-3 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest ${faint}`}>Cotisations salariales 2024</p>
                    </div>
                    <div className={`divide-y ${isDark ? "divide-white/[0.05]" : "divide-black/[0.05]"}`}>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <p className={`text-xs font-semibold ${sec}`}>Salaire brut</p>
                        <p className={`text-sm font-black ${sec}`}>{fmt2(drawer.salaire_brut)}</p>
                      </div>
                      {COT_SAL.filter(c => c.pct > 0).map(c => (
                        <div key={c.label} className="flex items-center justify-between px-4 py-2">
                          <div>
                            <p className={`text-xs ${mut}`}>{c.label}</p>
                            <p className={`text-[11px] ${faint}`}>{c.pct}%</p>
                          </div>
                          <p className="text-xs font-semibold text-amber-400">− {fmt2(drawer.salaire_brut * c.pct / 100)}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between bg-emerald-500/8 px-4 py-3">
                        <p className="text-xs font-bold text-emerald-400">NET À PAYER</p>
                        <p className="text-sm font-black text-emerald-400">
                          {fmt2(drawer.salaire_brut - COT_SAL.reduce((s, c) => s + drawer.salaire_brut * c.pct / 100, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={`overflow-hidden rounded-2xl border ${card}`}>
                    <div className={`border-b px-4 py-3 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest ${faint}`}>Charges patronales</p>
                    </div>
                    <div className={`divide-y ${isDark ? "divide-white/[0.05]" : "divide-black/[0.05]"}`}>
                      {COT_PAT.map(c => (
                        <div key={c.label} className="flex items-center justify-between px-4 py-2">
                          <div>
                            <p className={`text-xs ${mut}`}>{c.label}</p>
                            <p className={`text-[11px] ${faint}`}>{c.pct}%</p>
                          </div>
                          <p className="text-xs font-semibold text-red-400">{fmt2(drawer.salaire_brut * c.pct / 100)}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between bg-red-500/8 px-4 py-3">
                        <p className="text-xs font-bold text-red-400">Total charges</p>
                        <p className="text-sm font-black text-red-400">
                          {fmt2(COT_PAT.reduce((s, c) => s + drawer.salaire_brut * c.pct / 100, 0))}
                        </p>
                      </div>
                      <div className="flex items-center justify-between bg-[rgba(201,165,90,0.08)] px-4 py-3">
                        <p className="text-xs font-bold text-[#c9a55a]">Coût total employeur</p>
                        <p className="text-sm font-black text-[#c9a55a]">
                          {fmt2(drawer.salaire_brut + COT_PAT.reduce((s, c) => s + drawer.salaire_brut * c.pct / 100, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => generateBulletin(drawer)}
                    className={`w-full flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold transition ${isDark ? "border-white/10 bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/90" : "border-black/10 bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] hover:text-gray-900"}`}>
                    <FileText size={14} /> Générer le bulletin
                  </button>
                </>
              )}

              {/* Absences tab */}
              {drawerTab === "absences" && (
                <div className="space-y-3">
                  <p className={`text-xs ${faint}`}>Soldes de l&apos;année — cliquez +/− pour ajuster</p>
                  {([
                    { field: "cp" as const,      label: "Congés payés",   sub: "25 jours légaux/an",     icon: Plane,       color: "#60a5fa" },
                    { field: "rtt" as const,     label: "RTT",            sub: "Selon accord collectif", icon: SunMedium,   color: "#c9a55a" },
                    { field: "maladie" as const, label: "Arrêts maladie", sub: "Jours déclarés",          icon: Stethoscope, color: "#f87171" },
                  ]).map(({ field, label, sub, icon: Icon, color }) => {
                    const val = (absences[drawer.id] ?? { cp: 0, rtt: 0, maladie: 0 })[field];
                    return (
                      <div key={field} className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 ${card}`}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: color + "18", border: `1px solid ${color}30` }}>
                          <Icon size={14} style={{ color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold ${sec}`}>{label}</p>
                          <p className={`text-[11px] ${faint}`}>{sub}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button onClick={() => updateAbsence(drawer.id, field, -1)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-sm font-bold ${isDark ? "border-white/8 bg-white/5 text-white/50 hover:text-white" : "border-black/8 bg-black/4 text-gray-500 hover:text-gray-900"}`}>−</button>
                          <span className="w-8 text-center text-sm font-black" style={{ color }}>{val}</span>
                          <button onClick={() => updateAbsence(drawer.id, field, 1)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-sm font-bold ${isDark ? "border-white/8 bg-white/5 text-white/50 hover:text-white" : "border-black/8 bg-black/4 text-gray-500 hover:text-gray-900"}`}>+</button>
                        </div>
                      </div>
                    );
                  })}
                  <div className={`rounded-2xl border p-4 text-center ${card}`}>
                    <p className={`mb-2 text-xs ${faint}`}>Impact estimé sur le bulletin</p>
                    {(() => {
                      const abs = absences[drawer.id] ?? { cp: 0, rtt: 0, maladie: 0 };
                      const total = abs.cp + abs.rtt + abs.maladie;
                      const impact = Math.round((total / 21.67) * drawer.salaire_brut);
                      return (
                        <p className="text-lg font-black text-amber-400">
                          {total === 0 ? "Aucune absence" : `−${fmt(impact)} brut (${total}j)`}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Historique tab */}
              {drawerTab === "historique" && (
                <div className="space-y-3">
                  <p className={`text-xs ${faint}`}>Bulletins générés depuis cette interface</p>
                  {(bulletins[drawer.id] ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <History size={24} className={faint} />
                      <p className={`text-sm font-bold ${mut}`}>Aucun bulletin généré</p>
                      <button onClick={() => generateBulletin(drawer)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${isDark ? "border-white/10 bg-white/6 text-white/50 hover:text-white/80" : "border-black/10 bg-black/4 text-gray-500 hover:text-gray-900"}`}>
                        <FileText size={12} /> Générer le premier bulletin
                      </button>
                    </div>
                  ) : (
                    <div className={`overflow-hidden rounded-2xl border ${card}`}>
                      <div className={`border-b px-4 py-3 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                        <p className={`text-xs font-bold uppercase tracking-widest ${faint}`}>{(bulletins[drawer.id] ?? []).length} bulletin(s)</p>
                      </div>
                      <div className={`divide-y ${divs}`}>
                        {[...(bulletins[drawer.id] ?? [])].sort().reverse().map(monthKey => {
                          const [year, month] = monthKey.split("-");
                          const d = new Date(parseInt(year), parseInt(month) - 1, 1);
                          return (
                            <div key={monthKey} className="flex items-center justify-between px-4 py-3">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                <div>
                                  <p className={`text-sm font-bold capitalize ${sec}`}>{d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                                  <p className={`text-xs ${faint}`}>{fmt(drawer.salaire_brut)} brut</p>
                                </div>
                              </div>
                              <button onClick={() => generateBulletin(drawer)}
                                className={`text-xs font-semibold ${faint} hover:${mut} flex items-center gap-1`}>
                                <FileText size={10} /> Regénérer
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modal ajout/édition ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className={`w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl ${isDark ? "border-white/[0.08] bg-[#0e1420]" : "border-black/[0.08] bg-white"}`}>
            <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <h2 className={`text-sm font-bold ${pri}`}>{editMode ? "Modifier le salarié" : "Nouveau salarié"}</h2>
              <button onClick={() => setShowForm(false)} className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "text-white/30 hover:bg-white/8" : "text-gray-400 hover:bg-black/5"}`}><X size={15} /></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-3">
              {/* Champs principaux */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "nom",     label: "Nom complet *",    ph: "Jean Martin",   col: 2, type: "text" },
                  { key: "poste",   label: "Poste",            ph: "Développeur",   col: 1, type: "text" },
                  { key: "salaire_brut", label: "Brut mensuel (€) *", ph: "2500", col: 1, type: "number" },
                ].map(({ key, label, ph, col, type }) => (
                  <div key={key} style={{ gridColumn: `span ${col}` }}>
                    <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>{label}</label>
                    <input type={type} placeholder={ph}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${inp}`} />
                  </div>
                ))}
              </div>
              {/* Champs additionnels */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "email",         label: "Email",        ph: "jean@exemple.fr" },
                  { key: "telephone",     label: "Téléphone",    ph: "06 xx xx xx xx"  },
                  { key: "departement",   label: "Département",  ph: "RH, Finance…"   },
                  { key: "etablissement", label: "Établissement",ph: "Siège"           },
                  { key: "matricule",     label: "Matricule",    ph: "EMP-001"         },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>{label}</label>
                    <input type="text" placeholder={ph}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${inp}`} />
                  </div>
                ))}
                <div>
                  <label className={`mb-1.5 block text-xs font-semibold ${mut}`}>Date d&apos;embauche</label>
                  <input type="date"
                    value={form.date_embauche}
                    onChange={e => setForm(f => ({ ...f, date_embauche: e.target.value }))}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${inp}`} />
                </div>
              </div>

              {/* Type de contrat */}
              <div>
                <label className={`mb-2 block text-xs font-semibold ${mut}`}>Type de contrat</label>
                <div className="flex flex-wrap gap-2">
                  {CONTRATS.map(c => {
                    const s = CONTRAT_COLORS[c];
                    const active = form.type_contrat === c;
                    return (
                      <button key={c} onClick={() => setForm(f => ({ ...f, type_contrat: c }))}
                        className="rounded-xl border px-3 py-2 text-xs font-bold transition-all"
                        style={active
                          ? { background: s.bg, borderColor: s.border, color: s.color }
                          : isDark
                            ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }
                            : { background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.08)", color: "rgba(14,20,32,0.40)" }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview net */}
              {form.salaire_brut && !isNaN(parseFloat(form.salaire_brut)) && parseFloat(form.salaire_brut) > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-emerald-400">Net estimé</span>
                    <span className="font-black text-emerald-400">{fmt(calcNet(parseFloat(form.salaire_brut)))}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className={faint}>Charges patronales</span>
                    <span className="font-semibold text-red-400">{fmt(calcCharges(parseFloat(form.salaire_brut)))}</span>
                  </div>
                </div>
              )}
            </div>

            <div className={`flex gap-2 border-t px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <button onClick={() => setShowForm(false)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold ${isDark ? "border-white/8 text-white/40 hover:bg-white/5" : "border-black/8 text-gray-400 hover:bg-black/4"}`}>
                Annuler
              </button>
              <button onClick={saveEmployee} disabled={saving || !form.nom.trim() || !form.salaire_brut}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black hover:brightness-110 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {editMode ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
