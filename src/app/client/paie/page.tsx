"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote, Plus, Search, Users, Trash2, X, Loader2,
  TrendingUp, Euro, Calendar, ArrowUpRight, Sparkles,
  CheckCircle2, FileText, Download, AlertCircle,
  SunMedium, Plane, Stethoscope,
  BarChart2, History, ClipboardCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";
import { useTheme } from "@/lib/theme-context";

const ease = [0.16, 1, 0.3, 1] as const;

interface Employe {
  id: string; user_id: string; nom: string; poste?: string;
  salaire_brut: number; date_embauche?: string;
  type_contrat: "CDI" | "CDD" | "Freelance" | "Stage" | "Alternance";
  actif: boolean; created_at: string;
}

const CONTRATS = ["CDI", "CDD", "Freelance", "Stage", "Alternance"] as const;

const CONTRAT: Record<string, { color: string; glow: string; bg: string; border: string }> = {
  CDI:        { color: "#10b981", glow: "rgba(16,185,129,0.35)",  bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  },
  CDD:        { color: "#f59e0b", glow: "rgba(245,158,11,0.35)",  bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  Freelance:  { color: "#8b5cf6", glow: "rgba(139,92,246,0.35)",  bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)"  },
  Stage:      { color: "#06b6d4", glow: "rgba(6,182,212,0.35)",   bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)"   },
  Alternance: { color: "#f97316", glow: "rgba(249,115,22,0.35)",  bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)"  },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#3b82f6,#2563eb)",
  "linear-gradient(135deg,#ec4899,#db2777)",
  "linear-gradient(135deg,#14b8a6,#0d9488)",
];
function avatarGradient(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
}

const calcNet     = (b: number) => Math.round(b * 0.78);
const calcCharges = (b: number) => Math.round(b * 0.42);
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmt2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

/* ── Cotisations réelles (taux 2024) ── */
const COT_SAL = [
  { label: "CSG déductible",          pct: 6.80 },
  { label: "CSG/CRDS non déductible", pct: 2.90 },
  { label: "Retraite de base",        pct: 6.90 },
  { label: "Retraite complémentaire", pct: 3.93 },
  { label: "Prévoyance",              pct: 0.50 },
  { label: "Assurance chômage",       pct: 0.00 },
];
const COT_PAT = [
  { label: "Assurance maladie",        pct: 7.00 },
  { label: "Vieillesse plafonnée",     pct: 8.55 },
  { label: "Vieillesse déplafonnée",   pct: 1.90 },
  { label: "Allocations familiales",   pct: 3.45 },
  { label: "Accidents du travail",     pct: 1.50 },
  { label: "Assurance chômage",        pct: 4.05 },
  { label: "Retraite complémentaire",  pct: 5.90 },
  { label: "Formation professionnelle",pct: 0.55 },
  { label: "Taxe d\'apprentissage",    pct: 0.68 },
];

interface Absence { cp: number; rtt: number; maladie: number }


function generateBulletin(e: Employe) {
  const mois  = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const brut  = e.salaire_brut;
  const cotSalTotal = COT_SAL.reduce((s, c) => s + brut * c.pct / 100, 0);
  const cotPatTotal = COT_PAT.reduce((s, c) => s + brut * c.pct / 100, 0);
  const net   = brut - cotSalTotal;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Bulletin de paie — ${e.nom} — ${mois}</title>
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;max-width:720px;margin:32px auto;color:#222;font-size:13px;line-height:1.5}
  h1{font-size:18px;font-weight:800;border-bottom:2px solid #222;padding-bottom:8px;margin-bottom:16px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:20px;font-size:12px;color:#555}
  .meta b{color:#222}
  table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12px}
  th{background:#f3f4f6;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.05em;padding:6px 10px;text-align:left;border:1px solid #e5e7eb}
  td{padding:5px 10px;border:1px solid #e5e7eb}
  .r{text-align:right}
  .brut{background:#f9fafb;font-weight:700}
  .net{background:#dcfce7;font-weight:800;font-size:14px;color:#16a34a}
  .subtot{background:#fef3c7;font-weight:700}
  .no-print{margin-top:24px;display:flex;gap:10px}
  button{cursor:pointer;border:none;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:700}
  .btn-print{background:#222;color:#fff}
  .btn-close{background:#e5e7eb;color:#374151}
  @media print{.no-print{display:none}}
</style></head><body>
<h1>Bulletin de Paie</h1>
<div class="meta">
  <div><b>Employé :</b> ${e.nom}</div>
  <div><b>Période :</b> ${mois}</div>
  <div><b>Poste :</b> ${e.poste ?? "—"}</div>
  <div><b>Contrat :</b> ${e.type_contrat}</div>
  <div><b>Embauche :</b> ${e.date_embauche ? new Date(e.date_embauche).toLocaleDateString("fr-FR") : "—"}</div>
  <div><b>Généré le :</b> ${new Date().toLocaleDateString("fr-FR")}</div>
</div>
<table>
  <tr><th>Libellé</th><th class="r">Base (€)</th><th class="r">Taux salarial</th><th class="r">Cotisation salariale</th></tr>
  <tr class="brut"><td>Salaire brut</td><td class="r">${brut.toFixed(2)}</td><td></td><td class="r">${brut.toFixed(2)}</td></tr>
  ${COT_SAL.filter(c => c.pct > 0).map(c => `<tr><td>${c.label}</td><td class="r">${brut.toFixed(2)}</td><td class="r">${c.pct}%</td><td class="r">− ${(brut * c.pct / 100).toFixed(2)}</td></tr>`).join("")}
  <tr class="net"><td colspan="3">NET À PAYER AU SALARIÉ</td><td class="r">${net.toFixed(2)} €</td></tr>
</table>
<table>
  <tr><th>Charges patronales</th><th class="r">Base (€)</th><th class="r">Taux</th><th class="r">Montant</th></tr>
  ${COT_PAT.map(c => `<tr><td>${c.label}</td><td class="r">${brut.toFixed(2)}</td><td class="r">${c.pct}%</td><td class="r">${(brut * c.pct / 100).toFixed(2)}</td></tr>`).join("")}
  <tr class="subtot"><td colspan="3">Total charges patronales</td><td class="r">${cotPatTotal.toFixed(2)} €</td></tr>
  <tr class="brut"><td colspan="3">Coût total employeur</td><td class="r">${(brut + cotPatTotal).toFixed(2)} €</td></tr>
</table>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">📄 Imprimer / Exporter PDF</button>
  <button class="btn-close" onclick="window.close()">Fermer</button>
</div>
</body></html>`;

  const w = window.open("", "_blank", "width=780,height=900");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function PaieRHPage() {
  const { isDark } = useTheme();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<string>("all");
  const [drawer,   setDrawer]   = useState<Employe | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [view,     setView]     = useState<"employes" | "dashboard">("employes");
  const { toasts, add, remove } = useToastStack();

  const [form, setForm] = useState({
    nom: "", poste: "", salaire_brut: "",
    date_embauche: "", type_contrat: "CDI" as typeof CONTRATS[number],
  });
  const [drawerTab,    setDrawerTab]    = useState<"salaire" | "absences" | "urssaf" | "historique">("salaire");
  const [absences,     setAbsencesMap]  = useState<Record<string, Absence>>({});
  const [bulletinHist, setBulletinHist] = useState<Record<string, string[]>>({});
  const [urssafDone,   setUrssafDone]   = useState<string[]>([]);

  const load = useCallback(async (uid?: string | null) => {
    const id = uid ?? userId;
    if (!id) return;
    setLoading(true);
    const [empRes, absRes, histRes, urssafRes] = await Promise.all([
      supabase.from("employes").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("employe_absences").select("*").eq("user_id", id),
      supabase.from("payslips").select("employee_id,month_key").eq("user_id", id),
      supabase.from("urssaf_declarations").select("month_key").eq("user_id", id).eq("done", true),
    ]);
    setEmployes((empRes.data as Employe[]) ?? []);
    const absMap: Record<string, Absence> = {};
    for (const r of (absRes.data ?? [])) {
      absMap[r.employee_id as string] = { cp: r.cp as number, rtt: r.rtt as number, maladie: r.maladie as number };
    }
    setAbsencesMap(absMap);
    const histMap: Record<string, string[]> = {};
    for (const r of (histRes.data ?? [])) {
      if (!histMap[r.employee_id as string]) histMap[r.employee_id as string] = [];
      histMap[r.employee_id as string].push(r.month_key as string);
    }
    setBulletinHist(histMap);
    setUrssafDone((urssafRes.data ?? []).map(r => r.month_key as string));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await load(user.id);
    })();
  }, []);

  async function handleGenerateBulletin(e: Employe) {
    const monthKey = new Date().toISOString().slice(0, 7);
    setBulletinHist(prev => ({ ...prev, [e.id]: [...new Set([...(prev[e.id] ?? []), monthKey])] }));
    if (userId) {
      try { await supabase.from("payslips").upsert({ user_id: userId, employee_id: e.id, month_key: monthKey, html_content: monthKey }, { onConflict: "user_id,employee_id,month_key" }); } catch {}
    }
    generateBulletin(e);
    add(`Bulletin ${e.nom} généré`, "success");
  }

  async function toggleUrssafDone(monthKey: string) {
    const isDone = urssafDone.includes(monthKey);
    setUrssafDone(prev => isDone ? prev.filter(k => k !== monthKey) : [...prev, monthKey]);
    if (!userId) return;
    if (isDone) {
      await supabase.from("urssaf_declarations").delete().eq("user_id", userId).eq("month_key", monthKey);
    } else {
      await supabase.from("urssaf_declarations").upsert({ user_id: userId, month_key: monthKey, done: true }, { onConflict: "user_id,month_key" });
    }
  }

  async function addEmploye() {
    if (!userId || !form.nom.trim() || !form.salaire_brut) return;
    const brut = parseFloat(form.salaire_brut);
    if (isNaN(brut) || brut <= 0) { add("Salaire invalide", "error"); return; }
    const { error } = await supabase.from("employes").insert({
      user_id: userId, nom: form.nom.trim(), poste: form.poste.trim() || null,
      salaire_brut: brut, date_embauche: form.date_embauche || null,
      type_contrat: form.type_contrat, actif: true,
    });
    if (error) { add("Erreur lors de l\'ajout", "error"); return; }
    add(`${form.nom} ajouté`, "success");
    setForm({ nom: "", poste: "", salaire_brut: "", date_embauche: "", type_contrat: "CDI" });
    setShowForm(false);
    await load();
  }

  async function del(id: string, nom: string) {
    if (!confirm(`Supprimer ${nom} ?`)) return;
    await supabase.from("employes").delete().eq("id", id);
    if (drawer?.id === id) setDrawer(null);
    add("Employé supprimé", "success");
    await load();
  }

  async function updateAbsence(empId: string, field: keyof Absence, delta: number) {
    const cur  = absences[empId] ?? { cp: 0, rtt: 0, maladie: 0 };
    const next = { ...cur, [field]: Math.max(0, cur[field] + delta) };
    setAbsencesMap(prev => ({ ...prev, [empId]: next }));
    if (userId) {
      try { await supabase.from("employe_absences").upsert({ user_id: userId, employee_id: empId, ...next }, { onConflict: "user_id,employee_id" }); } catch {}
    }
  }

  const actifs       = employes.filter(e => e.actif);
  const masseTotal   = actifs.reduce((s, e) => s + e.salaire_brut, 0);
  const chargesTotal = actifs.reduce((s, e) => s + calcCharges(e.salaire_brut), 0);

  function exportDSN() {
    const mois = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const monthKey = new Date().toISOString().slice(0, 7);
    const cotSalAllTotal = actifs.reduce(
      (s, e) => s + COT_SAL.reduce((a, c) => a + e.salaire_brut * c.pct / 100, 0), 0
    );
    const echeance = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(5);
      return d.toLocaleDateString("fr-FR");
    })();

    const lines = [
      `╔══════════════════════════════════════════════════╗`,
      `║  DÉCLARATION SOCIALE NOMINATIVE (DSN)            ║`,
      `║  Période : ${mois.padEnd(38)}║`,
      `║  Généré le : ${new Date().toLocaleDateString("fr-FR").padEnd(36)}║`,
      `╚══════════════════════════════════════════════════╝`,
      ``,
      `RÉCAPITULATIF ENTREPRISE`,
      `──────────────────────────`,
      `Effectif total     : ${actifs.length} salarié(s)`,
      `Masse salariale    : ${masseTotal.toFixed(2)} €`,
      `Cot. salariales    : ${cotSalAllTotal.toFixed(2)} €`,
      `Charges patronales : ${chargesTotal.toFixed(2)} €`,
      `TOTAL URSSAF       : ${(cotSalAllTotal + chargesTotal).toFixed(2)} €`,
      `Échéance DSN       : ${echeance}`,
      ``,
      `DÉTAIL PAR SALARIÉ`,
      `════════════════════════════════════════════════════`,
      ...actifs.flatMap((e, i) => {
        const cotSalEmp = COT_SAL.reduce((s, c) => s + e.salaire_brut * c.pct / 100, 0);
        const cotPatEmp = COT_PAT.reduce((s, c) => s + e.salaire_brut * c.pct / 100, 0);
        return [
          ``,
          `[${String(i + 1).padStart(2, "0")}] ${e.nom}`,
          `    Poste          : ${e.poste ?? "—"}`,
          `    Contrat        : ${e.type_contrat}`,
          `    Embauche       : ${e.date_embauche ? new Date(e.date_embauche).toLocaleDateString("fr-FR") : "—"}`,
          `    Brut mensuel   : ${e.salaire_brut.toFixed(2)} €`,
          `    Cot. salariales: ${cotSalEmp.toFixed(2)} €`,
          `    Net à payer    : ${(e.salaire_brut - cotSalEmp).toFixed(2)} €`,
          `    Ch. patronales : ${cotPatEmp.toFixed(2)} €`,
          `    Coût employeur : ${(e.salaire_brut + cotPatEmp).toFixed(2)} €`,
        ];
      }),
      ``,
      `════════════════════════════════════════════════════`,
      `Document généré par DJAMA Premium — taux 2024`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `DSN_${monthKey}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    add("DSN exportée avec succès", "success");
  }

  const filtered = employes.filter(e => {
    const q = search.toLowerCase();
    return (!q || e.nom.toLowerCase().includes(q) || (e.poste ?? "").toLowerCase().includes(q))
        && (filter === "all" || e.type_contrat === filter);
  });

  const byContrat = CONTRATS.reduce((acc, c) => {
    const emps = actifs.filter(e => e.type_contrat === c);
    if (emps.length > 0) acc[c] = { count: emps.length, masse: emps.reduce((s, e) => s + e.salaire_brut, 0) };
    return acc;
  }, {} as Record<string, { count: number; masse: number }>);

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const last3Months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    };
  });

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className={`relative min-h-screen ${isDark ? "bg-[#07080e] text-white" : "bg-[#f4f5f9] text-gray-900"}`}>
      <ToastStack toasts={toasts} remove={remove} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`mb-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] ${isDark ? "text-white/30" : "text-gray-400"}`}>Ressources Humaines</p>
            <h1 className={`text-2xl font-black sm:text-3xl ${isDark ? "text-white" : "text-gray-900"}`}>Paie & RH</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Vue toggle */}
            <div className={`flex gap-0.5 rounded-xl p-1 ${isDark ? "border border-white/6 bg-white/4" : "border border-black/8 bg-white/80"}`}>
              {([
                { id: "employes",  label: "Employés",   icon: Users      },
                { id: "dashboard", label: "Tableau RH",  icon: BarChart2  },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[0.68rem] font-bold transition ${
                    view === id
                      ? isDark ? "bg-white/12 text-white" : "bg-white text-gray-900 shadow-sm"
                      : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-700"
                  }`}>
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
            {actifs.length > 0 && (
              <button onClick={exportDSN}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[0.72rem] font-bold transition ${isDark ? "border border-white/8 bg-white/4 text-white/50 hover:text-white/80" : "border border-black/8 bg-white text-gray-500 hover:text-gray-800"}`}>
                <Download size={13} /> Export DSN
              </button>
            )}
            <button onClick={() => setShowForm(true)}
              className={`group flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition hover:scale-[1.02] active:scale-[0.98] ${isDark ? "bg-white text-[#07080e] shadow-lg shadow-white/10 hover:shadow-white/20" : "bg-gray-900 text-white shadow-lg"}`}>
              <Plus size={16} /> Ajouter
              <ArrowUpRight size={13} className="ml-0.5 opacity-40 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* ── KPI STATS ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Effectif",        value: actifs.length.toString(), color: "#10b981", icon: Users      },
            { label: "Masse salariale", value: fmt(masseTotal),          color: "#c9a55a", icon: Banknote   },
            { label: "Charges patron",  value: fmt(chargesTotal),        color: "#f43f5e", icon: TrendingUp },
            { label: "Coût total",      value: fmt(masseTotal + chargesTotal), color: "#8b5cf6", icon: Euro },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm">
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl" style={{ background: color }} />
              <p className="mb-2 text-2xl font-black" style={{ color }}>{value}</p>
              <div className="flex items-center gap-1.5">
                <Icon size={11} style={{ color }} className="opacity-70" />
                <p className="text-[0.65rem] font-semibold text-white/40">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── DÉCLARATION URSSAF ── */}
        {actifs.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(249,115,22,0.2)] bg-[rgba(249,115,22,0.04)]">
            <div className="flex items-center justify-between border-b border-white/6 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(249,115,22,0.15)] border border-[rgba(249,115,22,0.25)]">
                  <AlertCircle size={14} className="text-orange-400" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Déclaration URSSAF du mois</p>
                  <p className={`text-[0.6rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>{new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-[rgba(249,115,22,0.3)] bg-[rgba(249,115,22,0.12)] px-3 py-1.5 text-xs font-black text-orange-400">
                  {fmt(actifs.reduce((s, e) => s + Math.round(e.salaire_brut * 0.42 + e.salaire_brut * (COT_SAL.reduce((a, c) => a + c.pct, 0) / 100)), 0))} à déclarer
                </span>
                <button
                  onClick={() => toggleUrssafDone(currentMonthKey)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.72rem] font-bold transition ${
                    urssafDone.includes(currentMonthKey)
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/4 text-white/40 hover:text-white/70"
                  }`}>
                  <ClipboardCheck size={12} />
                  {urssafDone.includes(currentMonthKey) ? "Déclarée ✓" : "Marquer déclarée"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 sm:grid-cols-4 divide-x divide-white/5">
              {[
                { label: "Masse salariale brute",          value: fmt(masseTotal),                                               color: "#c9a55a" },
                { label: "Cotisations salariales",          value: fmt(Math.round(masseTotal * 0.2203)),                         color: "#f59e0b" },
                { label: "Charges patronales",              value: fmt(chargesTotal),                                            color: "#f43f5e" },
                { label: "Dont URSSAF famille + maladie",  value: fmt(Math.round(masseTotal * (7.00 + 3.45) / 100)),            color: "#f97316" },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-4 py-3">
                  <p className="text-sm font-black" style={{ color }}>{value}</p>
                  <p className="mt-0.5 text-[0.58rem] text-white/30 leading-snug">{label}</p>
                </div>
              ))}
            </div>
            {/* Historique déclarations */}
            <div className="border-t border-white/5 px-5 py-3">
              <p className="mb-2 text-[0.58rem] font-bold uppercase tracking-widest text-white/20">Suivi déclarations</p>
              <div className="flex flex-wrap gap-2">
                {last3Months.map(({ key, label }) => (
                  <button key={key} onClick={() => toggleUrssafDone(key)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[0.62rem] font-semibold transition ${
                      urssafDone.includes(key)
                        ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400"
                        : "border-white/8 bg-white/4 text-white/30 hover:text-white/50"
                    }`}>
                    {urssafDone.includes(key) ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <p className="text-[0.6rem] text-white/25">
                  Échéance : {(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(15); return d.toLocaleDateString("fr-FR"); })()}
                </p>
                <button onClick={exportDSN}
                  className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/4 px-3 py-1.5 text-[0.62rem] font-semibold text-white/50 transition hover:text-white/80">
                  <Download size={10} /> Exporter DSN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">

          {/* ── TABLEAU DE BORD RH ── */}
          {view === "dashboard" && (
            <motion.div key="dashboard"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-5">

              {/* Répartition par contrat */}
              <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/4">
                <div className="border-b border-white/6 px-5 py-4">
                  <p className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Répartition de l&apos;effectif par contrat</p>
                </div>
                <div className="p-5 space-y-3">
                  {actifs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-white/25">Aucun employé actif</p>
                  ) : Object.keys(byContrat).length === 0 ? (
                    <p className="py-8 text-center text-sm text-white/25">Aucune donnée</p>
                  ) : (
                    Object.entries(byContrat).map(([contrat, { count, masse }]) => {
                      const c   = CONTRAT[contrat];
                      const pct = Math.round((count / actifs.length) * 100);
                      return (
                        <div key={contrat}>
                          <div className="mb-1.5 flex items-center justify-between text-[0.7rem]">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                              <span className="font-semibold text-white/70">{contrat}</span>
                              <span className="font-bold" style={{ color: c.color }}>{count} pers.</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-white/50">{fmt(masse)}/mois</span>
                              <span className="ml-2 text-white/25">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: c.color }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Masse salariale breakdown */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Net versé aux salariés",
                    value: fmt(actifs.reduce((s, e) => s + calcNet(e.salaire_brut), 0)),
                    color: "#10b981",
                    sub: masseTotal > 0 ? `${Math.round((actifs.reduce((s, e) => s + calcNet(e.salaire_brut), 0) / masseTotal) * 100)}% de la masse` : "0%",
                  },
                  {
                    label: "Cotisations salariales",
                    value: fmt(Math.round(masseTotal * 0.2203)),
                    color: "#f59e0b",
                    sub: masseTotal > 0 ? `${Math.round(0.2203 * 100)}% de la masse` : "0%",
                  },
                  {
                    label: "Charges patronales",
                    value: fmt(chargesTotal),
                    color: "#f43f5e",
                    sub: masseTotal > 0 ? `${Math.round((chargesTotal / masseTotal) * 100)}% de la masse` : "0%",
                  },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/4 p-5">
                    <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-xl" style={{ background: color }} />
                    <p className="text-lg font-black" style={{ color }}>{value}</p>
                    <p className="mt-1 text-[0.68rem] font-semibold text-white/50">{label}</p>
                    <p className="mt-0.5 text-[0.6rem] text-white/25">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Top salaires */}
              {actifs.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/4">
                  <div className="border-b border-white/6 px-5 py-4">
                    <p className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Top salaires</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[...actifs].sort((a, b) => b.salaire_brut - a.salaire_brut).slice(0, 5).map((e, i) => (
                      <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                        <span className="w-5 text-[0.65rem] font-black text-white/20">#{i + 1}</span>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                          style={{ background: avatarGradient(e.id) }}>
                          {e.nom[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.78rem] font-bold text-white/80">{e.nom}</p>
                          <p className="text-[0.62rem] text-white/35">{e.poste ?? e.type_contrat}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[0.78rem] font-black text-[#c9a55a]">{fmt(e.salaire_brut)}</p>
                          <p className="text-[0.6rem] text-white/25">brut</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulletins du mois */}
              <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/4">
                <div className="border-b border-white/6 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Bulletins du mois</p>
                    <p className="text-[0.6rem] text-white/30">
                      {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} —{" "}
                      {actifs.filter(e => (bulletinHist[e.id] ?? []).includes(currentMonthKey)).length}/{actifs.length} générés
                    </p>
                  </div>
                  {actifs.length > 0 && (
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${actifs.length > 0 ? Math.round((actifs.filter(e => (bulletinHist[e.id] ?? []).includes(currentMonthKey)).length / actifs.length) * 100) : 0}%` }} />
                    </div>
                  )}
                </div>
                <div className="divide-y divide-white/5">
                  {actifs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-white/25">Aucun employé actif</p>
                  ) : actifs.map(e => {
                    const done = (bulletinHist[e.id] ?? []).includes(currentMonthKey);
                    return (
                      <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                          style={{ background: avatarGradient(e.id) }}>
                          {e.nom[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.78rem] font-bold text-white/80">{e.nom}</p>
                          <p className="text-[0.62rem] text-white/35">{fmt(e.salaire_brut)} brut</p>
                        </div>
                        {done ? (
                          <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-emerald-400">
                            <CheckCircle2 size={12} /> Généré
                          </div>
                        ) : (
                          <button onClick={() => handleGenerateBulletin(e)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-[0.65rem] font-bold text-white/45 transition hover:text-white/80">
                            <FileText size={11} /> Générer
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── VUE EMPLOYÉS ── */}
          {view === "employes" && (
            <motion.div key="employes"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* Toolbar */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className={`flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-3 backdrop-blur-sm ${isDark ? "border border-white/8 bg-white/4" : "border border-black/8 bg-white"}`}>
                  <Search size={14} className={isDark ? "text-white/30" : "text-gray-400"} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un employé, un poste…"
                    className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white placeholder-white/25" : "text-gray-800 placeholder:text-gray-400"}`} />
                  {search && <button onClick={() => setSearch("")} className={isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}><X size={13} /></button>}
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {(["all", ...CONTRATS] as const).map(k => {
                    const s = k !== "all" ? CONTRAT[k] : null;
                    const active = filter === k;
                    return (
                      <button key={k} onClick={() => setFilter(k)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[0.68rem] font-bold transition-all ${
                          active ? "text-white" : "border border-white/8 bg-white/4 text-white/40 hover:text-white/70"
                        }`}
                        style={active && s
                          ? { background: s.bg, border: `1px solid ${s.border}`, color: s.color }
                          : active ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" } : {}}>
                        {k === "all" ? "Tous" : k}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grille employés */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 size={24} className="animate-spin text-white/20" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/8 bg-white/4">
                    <Users size={24} className="text-white/20" />
                  </div>
                  <div>
                    <p className="font-bold text-white/50">{search ? "Aucun résultat" : "Aucun employé enregistré"}</p>
                    <p className="mt-1 text-sm text-white/25">{search ? "Essaie un autre mot-clé" : "Ajoute ton premier employé"}</p>
                  </div>
                  {!search && (
                    <button onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/12">
                      <Plus size={14} /> Ajouter un employé
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((e, i) => {
                    const net     = calcNet(e.salaire_brut);
                    const charges = calcCharges(e.salaire_brut);
                    const c       = CONTRAT[e.type_contrat] ?? CONTRAT.CDI;
                    const netPct  = Math.round((net / (e.salaire_brut + charges)) * 100);
                    const bulletinCeMois = (bulletinHist[e.id] ?? []).includes(currentMonthKey);
                    return (
                      <motion.div key={e.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease }}
                        onClick={() => setDrawer(e)}
                        className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/6 bg-white/4 p-6 backdrop-blur-sm transition-all duration-200 hover:border-white/12 hover:bg-white/7 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5">

                        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
                          style={{ background: c.glow }} />

                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg"
                            style={{ background: avatarGradient(e.id) }}>
                            {e.nom[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5"
                              style={{ background: c.bg, borderColor: c.border }}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                              <span className="text-[0.62rem] font-bold" style={{ color: c.color }}>{e.type_contrat}</span>
                            </div>
                            {bulletinCeMois && (
                              <span className="flex items-center gap-1 text-[0.55rem] font-bold text-emerald-400">
                                <CheckCircle2 size={9} /> Bulletin émis
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mb-0.5 text-base font-bold text-white">{e.nom}</p>
                        {e.poste && <p className="mb-3 text-xs text-white/40">{e.poste}</p>}

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[
                            { label: "Brut",    value: fmt(e.salaire_brut), color: "text-white/80"    },
                            { label: "Net",     value: fmt(net),            color: "text-emerald-400" },
                            { label: "Charges", value: fmt(charges),        color: "text-red-400"     },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="rounded-xl bg-white/5 px-2.5 py-2 text-center">
                              <p className={`text-[0.7rem] font-bold ${color}`}>{value}</p>
                              <p className="mt-0.5 text-[0.55rem] font-semibold text-white/25">{label}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-[0.55rem] text-white/25">
                            <span>Net {netPct}%</span><span>Charges {100 - netPct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                              style={{ width: `${netPct}%` }} />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                          {e.date_embauche ? (
                            <p className="flex items-center gap-1 text-[0.6rem] text-white/25">
                              <Calendar size={9} /> {new Date(e.date_embauche).toLocaleDateString("fr-FR")}
                            </p>
                          ) : <span />}
                          <div className="flex items-center gap-1 text-[0.6rem] font-semibold text-white/25 transition group-hover:text-white/50">
                            Voir <ArrowUpRight size={10} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════ DRAWER EMPLOYÉ ══════════ */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawer(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }} transition={{ duration: 0.3, ease }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-hidden bg-[#0e1420] shadow-2xl border-l border-white/6">

              {/* Header */}
              <div className="relative overflow-hidden border-b border-white/6 px-6 py-5">
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-15 blur-3xl"
                  style={{ background: CONTRAT[drawer.type_contrat]?.glow }} />
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white shadow-xl"
                    style={{ background: avatarGradient(drawer.id) }}>
                    {drawer.nom[0].toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleGenerateBulletin(drawer)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/6 px-3 py-1.5 text-[0.68rem] font-semibold text-white/60 transition hover:border-white/20 hover:text-white/90">
                      <FileText size={11} /> Bulletin PDF
                    </button>
                    <button onClick={() => del(drawer.id, drawer.nom)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 text-white/25 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => setDrawer(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/8 hover:text-white/70">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <h2 className="text-base font-black text-white">{drawer.nom}</h2>
                {drawer.poste && <p className="mt-0.5 text-xs text-white/40">{drawer.poste}</p>}
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1"
                  style={{ background: CONTRAT[drawer.type_contrat]?.bg, borderColor: CONTRAT[drawer.type_contrat]?.border }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CONTRAT[drawer.type_contrat]?.color }} />
                  <span className="text-[0.62rem] font-bold" style={{ color: CONTRAT[drawer.type_contrat]?.color }}>{drawer.type_contrat}</span>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex gap-0.5 rounded-xl border border-white/6 bg-white/4 p-1">
                  {(["salaire", "absences", "urssaf", "historique"] as const).map(tab => (
                    <button key={tab} onClick={() => setDrawerTab(tab)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-[0.6rem] font-bold capitalize transition ${
                        drawerTab === tab ? "bg-white/12 text-white" : "text-white/35 hover:text-white/60"
                      }`}>
                      {tab === "salaire" ? "Salaire" : tab === "absences" ? "Absences" : tab === "urssaf" ? "URSSAF" : "Historique"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* ── Onglet Salaire ── */}
                {drawerTab === "salaire" && (
                  <>
                    <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/4">
                      <div className="border-b border-white/6 px-4 py-3">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Cotisations salariales 2024</p>
                      </div>
                      <div className="divide-y divide-white/5">
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <p className="text-xs font-semibold text-white/70">Salaire brut</p>
                          <p className="text-sm font-black text-white/80">{fmt2(drawer.salaire_brut)}</p>
                        </div>
                        {COT_SAL.filter(c => c.pct > 0).map(c => (
                          <div key={c.label} className="flex items-center justify-between px-4 py-2">
                            <div>
                              <p className="text-[0.68rem] text-white/45">{c.label}</p>
                              <p className="text-[0.58rem] text-white/20">{c.pct}% du brut</p>
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

                    <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/4">
                      <div className="border-b border-white/6 px-4 py-3">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Charges patronales</p>
                      </div>
                      <div className="divide-y divide-white/5">
                        {COT_PAT.map(c => (
                          <div key={c.label} className="flex items-center justify-between px-4 py-2">
                            <div>
                              <p className="text-[0.68rem] text-white/45">{c.label}</p>
                              <p className="text-[0.58rem] text-white/20">{c.pct}%</p>
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

                    {(() => {
                      const cotSal = COT_SAL.reduce((s, c) => s + drawer.salaire_brut * c.pct / 100, 0);
                      const cotPat = COT_PAT.reduce((s, c) => s + drawer.salaire_brut * c.pct / 100, 0);
                      const total  = drawer.salaire_brut + cotPat;
                      const netPct = Math.round(((drawer.salaire_brut - cotSal) / total) * 100);
                      const salPct = Math.round((cotSal / total) * 100);
                      const patPct = 100 - netPct - salPct;
                      return (
                        <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
                          <p className="mb-3 text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Répartition du coût total</p>
                          <div className="flex h-3 overflow-hidden rounded-full">
                            <div className="bg-emerald-500" style={{ width: `${netPct}%` }} />
                            <div className="bg-amber-500/80" style={{ width: `${salPct}%` }} />
                            <div className="bg-red-500/80" style={{ width: `${patPct}%` }} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {[
                              { l: "Net salarié",    p: netPct, c: "bg-emerald-500"   },
                              { l: "Cot. salariales", p: salPct, c: "bg-amber-500/80"  },
                              { l: "Charges patron", p: patPct, c: "bg-red-500/80"    },
                            ].map(({ l, p, c }) => (
                              <div key={l} className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${c}`} />
                                <span className="text-[0.58rem] text-white/30">{l} {p}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {drawer.date_embauche && (
                      <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 px-4 py-3">
                        <Calendar size={13} className="shrink-0 text-white/30" />
                        <div>
                          <p className="text-[0.58rem] font-bold uppercase tracking-widest text-white/25">Embauché le</p>
                          <p className="text-sm font-semibold text-white/80">
                            {new Date(drawer.date_embauche).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Onglet Absences ── */}
                {drawerTab === "absences" && (
                  <div className="space-y-3">
                    <p className="text-[0.62rem] text-white/30">Soldes de l&apos;année en cours — cliquez +/− pour ajuster</p>
                    {([
                      { field: "cp"      as const, label: "Congés payés",   sub: "25 jours/an légal",      icon: Plane,        color: "#60a5fa" },
                      { field: "rtt"     as const, label: "RTT",            sub: "Selon accord collectif", icon: SunMedium,    color: "#a78bfa" },
                      { field: "maladie" as const, label: "Arrêts maladie", sub: "Jours déclarés",         icon: Stethoscope,  color: "#f87171" },
                    ]).map(({ field, label, sub, icon: Icon, color }) => {
                      const val = (absences[drawer.id] ?? { cp: 0, rtt: 0, maladie: 0 })[field];
                      return (
                        <div key={field} className="flex items-center gap-4 rounded-2xl border border-white/6 bg-white/4 px-4 py-3.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: color + "18", border: `1px solid ${color}30` }}>
                            <Icon size={14} style={{ color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white/80">{label}</p>
                            <p className="text-[0.58rem] text-white/30">{sub}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button onClick={() => updateAbsence(drawer.id, field, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-sm font-bold text-white/50 transition hover:text-white/90">−</button>
                            <span className="w-8 text-center text-sm font-black" style={{ color }}>{val}</span>
                            <button onClick={() => updateAbsence(drawer.id, field, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-sm font-bold text-white/50 transition hover:text-white/90">+</button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-4 text-center">
                      <p className="mb-2 text-[0.6rem] text-white/25">Impact estimé sur le bulletin</p>
                      {(() => {
                        const abs = absences[drawer.id] ?? { cp: 0, rtt: 0, maladie: 0 };
                        const totalJours = abs.cp + abs.rtt + abs.maladie;
                        const impact = Math.round((totalJours / 21.67) * drawer.salaire_brut);
                        return (
                          <p className="text-lg font-black text-amber-400">
                            {totalJours === 0 ? "Aucune absence" : `−${fmt(impact)} brut (${totalJours}j)`}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── Onglet URSSAF ── */}
                {drawerTab === "urssaf" && (
                  <div className="space-y-3">
                    <p className="text-[0.62rem] text-white/30">
                      Récapitulatif déclaratif — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-[rgba(249,115,22,0.2)] bg-[rgba(249,115,22,0.04)]">
                      <div className="border-b border-white/6 px-4 py-3">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-orange-400">Cotisations à déclarer</p>
                      </div>
                      <div className="divide-y divide-white/5">
                        {[
                          { label: "Maladie + maternité",       amount: drawer.salaire_brut * 7.00 / 100 },
                          { label: "Allocations familiales",    amount: drawer.salaire_brut * 3.45 / 100 },
                          { label: "Vieillesse totale",         amount: drawer.salaire_brut * (8.55 + 1.90) / 100 },
                          { label: "Chômage",                   amount: drawer.salaire_brut * 4.05 / 100 },
                          { label: "Retraite complémentaire",   amount: drawer.salaire_brut * (5.90 + 3.93) / 100 },
                          { label: "CSG/CRDS (salarié)",        amount: drawer.salaire_brut * (6.80 + 2.90) / 100 },
                          { label: "Formation + taxe apprent.", amount: drawer.salaire_brut * (0.55 + 0.68) / 100 },
                        ].map(({ label, amount }) => (
                          <div key={label} className="flex items-center justify-between px-4 py-2.5">
                            <p className="text-[0.68rem] text-white/50">{label}</p>
                            <p className="text-xs font-bold text-orange-400">{fmt2(amount)}</p>
                          </div>
                        ))}
                        <div className="flex items-center justify-between bg-orange-500/10 px-4 py-3">
                          <p className="text-xs font-bold text-orange-400">TOTAL À DÉCLARER</p>
                          <p className="text-sm font-black text-orange-400">
                            {fmt2(
                              COT_PAT.reduce((s, c) => s + drawer.salaire_brut * c.pct / 100, 0) +
                              COT_SAL.reduce((s, c) => s + drawer.salaire_brut * c.pct / 100, 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 px-4 py-3">
                      <AlertCircle size={13} className="shrink-0 text-orange-400" />
                      <p className="text-[0.62rem] leading-relaxed text-white/40">
                        Échéance DSN : 5 ou 15 du mois suivant selon l&apos;effectif. Taux indicatifs base 2024.
                      </p>
                    </div>
                    <button onClick={() => handleGenerateBulletin(drawer)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/60 transition hover:bg-white/8 hover:text-white/90">
                      <FileText size={14} /> Générer le bulletin complet
                    </button>
                  </div>
                )}

                {/* ── Onglet Historique ── */}
                {drawerTab === "historique" && (
                  <div className="space-y-3">
                    <p className="text-[0.62rem] text-white/30">Bulletins générés depuis cette interface</p>
                    {(bulletinHist[drawer.id] ?? []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
                          <History size={18} className="text-white/20" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white/40">Aucun bulletin généré</p>
                          <p className="mt-0.5 text-xs text-white/20">Les bulletins apparaîtront ici après génération</p>
                        </div>
                        <button onClick={() => handleGenerateBulletin(drawer)}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-[0.72rem] font-bold text-white/50 transition hover:text-white/80">
                          <FileText size={12} /> Générer le premier bulletin
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/4">
                        <div className="border-b border-white/6 px-4 py-3">
                          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">
                            {(bulletinHist[drawer.id] ?? []).length} bulletin(s) au total
                          </p>
                        </div>
                        <div className="divide-y divide-white/5">
                          {[...(bulletinHist[drawer.id] ?? [])].sort().reverse().map(monthKey => {
                            const [year, month] = monthKey.split("-");
                            const d = new Date(parseInt(year), parseInt(month) - 1, 1);
                            const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
                            return (
                              <div key={monthKey} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                                    <CheckCircle2 size={13} className="text-emerald-400" />
                                  </div>
                                  <div>
                                    <p className="text-[0.72rem] font-bold capitalize text-white/80">{label}</p>
                                    <p className="text-[0.6rem] text-white/30">{fmt(drawer.salaire_brut)} brut</p>
                                  </div>
                                </div>
                                <button onClick={() => handleGenerateBulletin(drawer)}
                                  className="flex items-center gap-1 text-[0.62rem] font-semibold text-white/30 transition hover:text-white/60">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ MODAL AJOUT ══════════ */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22, ease }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/8 bg-[#0e1420] shadow-2xl">

              <div className="border-b border-white/6 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8">
                      <Sparkles size={16} className="text-white/60" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Ajouter un employé</h2>
                      <p className="text-[0.62rem] text-white/30">Remplis les informations du collaborateur</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white/60">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 p-5">
                {[
                  { key: "nom",           label: "Nom complet *",              placeholder: "Jean Martin",  type: "text"   },
                  { key: "poste",         label: "Poste",                      placeholder: "Développeur",  type: "text"   },
                  { key: "salaire_brut",  label: "Salaire brut mensuel (€) *", placeholder: "2 500",        type: "number" },
                  { key: "date_embauche", label: "Date d\'embauche",           placeholder: "",             type: "date"   },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-[0.68rem] font-semibold text-white/40">{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      min={type === "number" ? "0" : undefined}
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/20 focus:bg-white/8 [color-scheme:dark]" />
                  </div>
                ))}

                <div>
                  <label className="mb-2 block text-[0.68rem] font-semibold text-white/40">Type de contrat</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTRATS.map(c => {
                      const s = CONTRAT[c];
                      const active = form.type_contrat === c;
                      return (
                        <button key={c} onClick={() => setForm(f => ({ ...f, type_contrat: c }))}
                          className="rounded-xl border px-3 py-2 text-xs font-bold transition-all"
                          style={active
                            ? { background: s.bg, borderColor: s.border, color: s.color }
                            : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.salaire_brut && !isNaN(parseFloat(form.salaire_brut)) && parseFloat(form.salaire_brut) > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                    <div className="flex items-center justify-between text-[0.72rem]">
                      <span className="font-semibold text-emerald-400">Net estimé</span>
                      <span className="font-black text-emerald-400">{fmt(calcNet(parseFloat(form.salaire_brut)))}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[0.68rem]">
                      <span className="text-white/30">Charges patronales</span>
                      <span className="font-semibold text-red-400">{fmt(calcCharges(parseFloat(form.salaire_brut)))}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-white/6 px-5 py-4">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm font-semibold text-white/40 transition hover:bg-white/5 hover:text-white/60">
                  Annuler
                </button>
                <button onClick={addEmploye} disabled={!form.nom.trim() || !form.salaire_brut}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-black text-[#07080e] transition hover:bg-white/90 disabled:opacity-30">
                  <CheckCircle2 size={14} /> Ajouter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
