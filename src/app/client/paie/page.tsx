"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote, Plus, Search, Users, Trash2, X, Loader2,
  TrendingUp, Euro, Calendar, ArrowUpRight, Sparkles,
  User, CheckCircle2, Send, Wallet, PieChart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";

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

export default function PaieRHPage() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<string>("all");
  const [drawer,   setDrawer]   = useState<Employe | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);
  const { toasts, add, remove } = useToastStack();

  const [form, setForm] = useState({
    nom: "", poste: "", salaire_brut: "",
    date_embauche: "", type_contrat: "CDI" as typeof CONTRATS[number],
  });

  const load = useCallback(async (uid?: string | null) => {
    const id = uid ?? userId;
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from("employes").select("*").eq("user_id", id).order("created_at", { ascending: false });
    setEmployes((data as Employe[]) ?? []);
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

  async function addEmploye() {
    if (!userId || !form.nom.trim() || !form.salaire_brut) return;
    const brut = parseFloat(form.salaire_brut);
    if (isNaN(brut) || brut <= 0) { add("Salaire invalide", "error"); return; }
    const { error } = await supabase.from("employes").insert({
      user_id: userId, nom: form.nom.trim(), poste: form.poste.trim() || null,
      salaire_brut: brut, date_embauche: form.date_embauche || null,
      type_contrat: form.type_contrat, actif: true,
    });
    if (error) { add("Erreur lors de l'ajout", "error"); return; }
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

  const actifs       = employes.filter(e => e.actif);
  const masseTotal   = actifs.reduce((s, e) => s + e.salaire_brut, 0);
  const chargesTotal = actifs.reduce((s, e) => s + calcCharges(e.salaire_brut), 0);

  const filtered = employes.filter(e => {
    const q = search.toLowerCase();
    return (!q || e.nom.toLowerCase().includes(q) || (e.poste ?? "").toLowerCase().includes(q))
        && (filter === "all" || e.type_contrat === filter);
  });

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen bg-[#07080e] text-white">
      <ToastStack toasts={toasts} remove={remove} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">Ressources Humaines</p>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Paie & RH</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#07080e] shadow-lg shadow-white/10 transition hover:scale-[1.02] hover:shadow-white/20 active:scale-[0.98]">
            <Plus size={16} /> Ajouter un employé
            <ArrowUpRight size={13} className="ml-0.5 opacity-40 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
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

        {/* ── TOOLBAR ── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 backdrop-blur-sm">
            <Search size={14} className="text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un employé, un poste…"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none" />
            {search && <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/60"><X size={13} /></button>}
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
                  style={active && s ? { background: s.bg, border: `1px solid ${s.border}`, color: s.color }
                    : active ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" } : {}}>
                  {k === "all" ? "Tous" : k}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── GRILLE EMPLOYÉS ── */}
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
              return (
                <motion.div key={e.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease }}
                  onClick={() => setDrawer(e)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/6 bg-white/4 p-6 backdrop-blur-sm transition-all duration-200 hover:border-white/12 hover:bg-white/7 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5">

                  {/* Glow blob */}
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
                    style={{ background: c.glow }} />

                  {/* Top */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg"
                      style={{ background: avatarGradient(e.id) }}>
                      {e.nom[0].toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5"
                      style={{ background: c.bg, borderColor: c.border }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                      <span className="text-[0.62rem] font-bold" style={{ color: c.color }}>{e.type_contrat}</span>
                    </div>
                  </div>

                  {/* Name + poste */}
                  <p className="mb-0.5 text-base font-bold text-white">{e.nom}</p>
                  {e.poste && <p className="mb-3 text-xs text-white/40">{e.poste}</p>}

                  {/* Salary info */}
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

                  {/* Net bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[0.55rem] text-white/25">
                      <span>Net {netPct}%</span><span>Charges {100 - netPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                        style={{ width: `${netPct}%` }} />
                    </div>
                  </div>

                  {/* Footer */}
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
              <div className="relative overflow-hidden border-b border-white/6 px-6 py-6">
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-15 blur-3xl"
                  style={{ background: CONTRAT[drawer.type_contrat]?.glow }} />
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white shadow-xl"
                    style={{ background: avatarGradient(drawer.id) }}>
                    {drawer.nom[0].toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
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
                <h2 className="text-lg font-black text-white">{drawer.nom}</h2>
                {drawer.poste && <p className="mt-1 text-sm text-white/40">{drawer.poste}</p>}
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5"
                  style={{ background: CONTRAT[drawer.type_contrat]?.bg, borderColor: CONTRAT[drawer.type_contrat]?.border }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CONTRAT[drawer.type_contrat]?.color, boxShadow: `0 0 6px ${CONTRAT[drawer.type_contrat]?.color}` }} />
                  <span className="text-[0.65rem] font-bold" style={{ color: CONTRAT[drawer.type_contrat]?.color }}>{drawer.type_contrat}</span>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {/* Salaires */}
                <div className="rounded-2xl border border-white/6 bg-white/4 overflow-hidden">
                  <div className="border-b border-white/6 px-4 py-3">
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Décomposition salariale</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { label: "Salaire brut",      value: fmt(drawer.salaire_brut),            color: "text-white/80"    },
                      { label: "Net estimé (−22%)",  value: fmt(calcNet(drawer.salaire_brut)),   color: "text-emerald-400" },
                      { label: "Charges patronales (+42%)", value: fmt(calcCharges(drawer.salaire_brut)), color: "text-red-400" },
                      { label: "Coût total employeur", value: fmt(drawer.salaire_brut + calcCharges(drawer.salaire_brut)), color: "text-[#c9a55a]" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-3">
                        <p className="text-xs text-white/40">{label}</p>
                        <p className={`text-sm font-black ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barre visuelle */}
                <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
                  <p className="mb-3 text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Répartition du coût total</p>
                  {(() => {
                    const total = drawer.salaire_brut + calcCharges(drawer.salaire_brut);
                    const netPct = Math.round((calcNet(drawer.salaire_brut) / total) * 100);
                    const cotPct = Math.round(((drawer.salaire_brut - calcNet(drawer.salaire_brut)) / total) * 100);
                    const chaPct = 100 - netPct - cotPct;
                    return (
                      <>
                        <div className="flex h-3 overflow-hidden rounded-full">
                          <div className="bg-emerald-500 transition-all" style={{ width: `${netPct}%` }} title={`Net ${netPct}%`} />
                          <div className="bg-amber-500/70" style={{ width: `${cotPct}%` }} title={`Cotisations salariales ${cotPct}%`} />
                          <div className="bg-red-500/70" style={{ width: `${chaPct}%` }} title={`Charges patronales ${chaPct}%`} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          {[
                            { label: "Net salarié", pct: netPct, color: "bg-emerald-500" },
                            { label: "Cot. salariales", pct: cotPct, color: "bg-amber-500/70" },
                            { label: "Charges patron", pct: chaPct, color: "bg-red-500/70" },
                          ].map(({ label, pct, color }) => (
                            <div key={label} className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${color}`} />
                              <span className="text-[0.6rem] text-white/30">{label} {pct}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Infos */}
                {drawer.date_embauche && (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 px-4 py-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8">
                      <Calendar size={13} className="text-white/40" />
                    </div>
                    <div>
                      <p className="text-[0.58rem] font-bold uppercase tracking-widest text-white/25">Date d'embauche</p>
                      <p className="text-sm font-semibold text-white/80">
                        {new Date(drawer.date_embauche).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
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
                  { key: "nom",           label: "Nom complet *",       placeholder: "Jean Martin",  type: "text"   },
                  { key: "poste",         label: "Poste",               placeholder: "Développeur",  type: "text"   },
                  { key: "salaire_brut",  label: "Salaire brut mensuel (€) *", placeholder: "2 500", type: "number" },
                  { key: "date_embauche", label: "Date d'embauche",     placeholder: "",             type: "date"   },
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

                {/* Type contrat */}
                <div>
                  <label className="mb-2 block text-[0.68rem] font-semibold text-white/40">Type de contrat</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTRATS.map(c => {
                      const s = CONTRAT[c];
                      const active = form.type_contrat === c;
                      return (
                        <button key={c} onClick={() => setForm(f => ({ ...f, type_contrat: c }))}
                          className="rounded-xl border px-3 py-2 text-xs font-bold transition-all"
                          style={active ? { background: s.bg, borderColor: s.border, color: s.color } : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview net */}
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
