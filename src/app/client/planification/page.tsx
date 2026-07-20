"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Plus, X, Loader2, Check, Flag, TrendingUp,
  CheckCircle2, Circle, BarChart3, Zap, Calendar, Trophy,
  ChevronDown, Trash2, Edit3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

type Horizon   = "quarter" | "year" | "3years";
type PlanStatus = "active" | "completed" | "paused";

interface Objective { id: string; text: string; progress: number; done: boolean; }
interface KPI       { id: string; label: string; target: string; current: string; unit: string; }

interface Plan {
  id: string; user_id: string; title: string; horizon: Horizon;
  status: PlanStatus; description: string;
  objectives: Objective[]; kpis: KPI[];
  color: string; created_at: string; updated_at: string;
}

type FormData = Omit<Plan, "id" | "user_id" | "created_at" | "updated_at">;

const GOLD   = "#c9a55a";
const COLORS = ["#c9a55a", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

const HORIZON_CFG: Record<Horizon, { label: string; icon: typeof Target; desc: string }> = {
  quarter:  { label: "Trimestre", icon: Zap,      desc: "3 mois" },
  year:     { label: "Année",     icon: Calendar,  desc: "12 mois" },
  "3years": { label: "3 ans",     icon: Trophy,    desc: "Long terme" },
};

const STATUS_CFG: Record<PlanStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Actif",    color: "#10b981", bg: "#10b98115" },
  completed: { label: "Terminé", color: "#c9a55a", bg: "#c9a55a15" },
  paused:    { label: "En pause", color: "#6b7280", bg: "#6b728015" },
};

const emptyForm = (): FormData => ({
  title: "", horizon: "year", status: "active",
  description: "", objectives: [], kpis: [], color: GOLD,
});
const newObj = (): Objective => ({ id: crypto.randomUUID(), text: "", progress: 0, done: false });
const newKPI = (): KPI       => ({ id: crypto.randomUUID(), label: "", target: "", current: "", unit: "" });

/* ─── Progress bar ──────────────────────────────── */
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden bg-black/[0.07]" style={{ backgroundColor: undefined }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }} className="h-full rounded-full" style={{ background: color }} />
    </div>
  );
}

/* ─── Plan card ─────────────────────────────────── */
function PlanCard({ plan, isDark, onOpen, onStatusChange, onDelete }: {
  plan: Plan; isDark: boolean;
  onOpen: () => void; onStatusChange: (s: PlanStatus) => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const HorizonIcon = HORIZON_CFG[plan.horizon].icon;
  const doneObjs   = plan.objectives.filter(o => o.done).length;
  const totalObjs  = plan.objectives.length;
  const avgProg    = totalObjs === 0 ? 0 :
    Math.round(plan.objectives.reduce((s, o) => s + (o.done ? 100 : o.progress), 0) / totalObjs);

  const cardBg  = isDark ? "bg-white/[0.025] border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.05]"
                         : "bg-white border-black/[0.08] hover:border-black/[0.16] shadow-sm hover:shadow-md";
  const nameCls = isDark ? "text-white/85"  : "text-[#0e1420]/85";
  const subCls  = isDark ? "text-white/30"  : "text-[#0e1420]/40";
  const descCls = isDark ? "text-white/35"  : "text-[#0e1420]/50";
  const kpiCls  = isDark ? "bg-white/[0.04] text-white/40" : "bg-black/[0.04] text-[#0e1420]/50";
  const menuBg  = isDark ? "bg-[#0f1117] border-white/10"  : "bg-white border-black/[0.08] shadow-xl";
  const menuTxt = isDark ? "text-white/50 hover:text-white hover:bg-white/[0.06]"
                         : "text-[#0e1420]/50 hover:text-[#0e1420] hover:bg-black/[0.04]";

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      onClick={onOpen}
      className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${cardBg}`}
      style={{ borderLeftWidth: 3, borderLeftColor: plan.color }}>

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: `${plan.color}18` }}>
            <HorizonIcon size={13} style={{ color: plan.color }} />
          </div>
          <div>
            <p className={`text-xs font-bold ${nameCls}`}>{plan.title}</p>
            <p className={`text-[10px] ${subCls}`}>{HORIZON_CFG[plan.horizon].label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
            style={{ color: STATUS_CFG[plan.status].color, background: STATUS_CFG[plan.status].bg }}>
            {STATUS_CFG[plan.status].label}
          </span>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDark ? "text-white/20 hover:text-white/50 hover:bg-white/[0.06]" : "text-[#0e1420]/20 hover:text-[#0e1420]/60 hover:bg-black/[0.05]"}`}>
              <ChevronDown size={11} />
            </button>
            {menuOpen && (
              <div className={`absolute right-0 top-7 rounded-xl border z-20 py-1 min-w-[130px] ${menuBg}`}
                onClick={e => e.stopPropagation()}>
                {(Object.keys(STATUS_CFG) as PlanStatus[]).map(s => (
                  <button key={s} onClick={() => { onStatusChange(s); setMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-all ${menuTxt}`}>
                    {STATUS_CFG[s].label}
                  </button>
                ))}
                <div className={`border-t mt-1 pt-1 ${isDark ? "border-white/[0.06]" : "border-black/[0.05]"}`}>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all">
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {plan.description && (
        <p className={`text-[11px] mb-3 line-clamp-2 leading-relaxed ${descCls}`}>{plan.description}</p>
      )}

      {totalObjs > 0 && (
        <div className="mb-3 space-y-1.5">
          <div className={`flex justify-between text-[10px] ${subCls}`}>
            <span>{doneObjs}/{totalObjs} objectifs</span>
            <span>{avgProg}%</span>
          </div>
          <ProgressBar value={avgProg} color={plan.color} />
        </div>
      )}

      {plan.kpis.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {plan.kpis.slice(0, 3).map(k => (
            <div key={k.id} className={`text-[10px] rounded-lg px-2 py-1 ${kpiCls}`}>
              <span className="opacity-70">{k.label}: </span>
              <span className="font-semibold">{k.current || "—"}</span>
              <span className="opacity-50">/{k.target}{k.unit}</span>
            </div>
          ))}
          {plan.kpis.length > 3 && <span className={`text-[10px] ${subCls}`}>+{plan.kpis.length - 3}</span>}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════ */
export default function PlanificationPage() {
  const { isDark } = useTheme();
  const router     = useRouter();

  const bg      = isDark ? "bg-[#07080e]"                                  : "bg-[#f4f5f9]";
  const pri     = isDark ? "text-white"                                     : "text-[#0e1420]";
  const mut     = isDark ? "text-white/40"                                  : "text-[#0e1420]/45";
  const faint   = isDark ? "text-white/25"                                  : "text-[#0e1420]/30";
  const card    = isDark ? "border-white/[0.07] bg-white/[0.025]"          : "border-black/[0.08] bg-white shadow-sm";
  const inp     = isDark
    ? "bg-white/[0.04] border-white/[0.08] text-white/70 placeholder-white/20 focus:border-amber-500/30"
    : "bg-black/[0.03] border-black/[0.08] text-[#0e1420]/80 placeholder-[#0e1420]/25 focus:border-amber-500/40";
  const divider = isDark ? "border-white/[0.06]" : "border-black/[0.07]";
  const toolbar = isDark ? "bg-[#0f1117] border-white/10" : "bg-white border-black/[0.08] shadow-2xl";

  const [userId,       setUserId]       = useState<string | null>(null);
  const [plans,        setPlans]        = useState<Plan[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeHoriz,  setActiveHoriz]  = useState<Horizon | "all">("all");
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<Plan | null>(null);
  const [form,         setForm]         = useState<FormData>(emptyForm());
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }
    setUserId(user.id);
    const { data } = await supabase.from("strategic_plans").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setPlans(data ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({ title: p.title, horizon: p.horizon, status: p.status, description: p.description, objectives: p.objectives, kpis: p.kpis, color: p.color });
    setShowForm(true);
  };

  const doSave = async () => {
    if (!userId || !form.title.trim()) { showToast("Titre requis", false); return; }
    setSaving(true);
    const payload = { ...form, user_id: userId, updated_at: new Date().toISOString() };
    if (editing) {
      const { error } = await supabase.from("strategic_plans").update(payload).eq("id", editing.id);
      if (!error) { setPlans(prev => prev.map(p => p.id === editing.id ? { ...p, ...payload } : p)); setShowForm(false); showToast("Plan mis à jour"); }
      else showToast(error.message, false);
    } else {
      const { data, error } = await supabase.from("strategic_plans").insert(payload).select().single();
      if (!error && data) { setPlans(prev => [data, ...prev]); setShowForm(false); showToast("Plan créé"); }
      else showToast(error?.message ?? "Erreur", false);
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: PlanStatus) => {
    await supabase.from("strategic_plans").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Supprimer ce plan ?")) return;
    await supabase.from("strategic_plans").delete().eq("id", id);
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const updateObj = (i: number, patch: Partial<Objective>) =>
    setForm(f => ({ ...f, objectives: f.objectives.map((o, j) => j === i ? { ...o, ...patch } : o) }));
  const updateKPI = (i: number, patch: Partial<KPI>) =>
    setForm(f => ({ ...f, kpis: f.kpis.map((k, j) => j === i ? { ...k, ...patch } : k) }));

  /* Stats */
  const activeCount = plans.filter(p => p.status === "active").length;
  const doneCount   = plans.filter(p => p.status === "completed").length;
  const allObjs     = plans.flatMap(p => p.objectives);
  const donePct     = allObjs.length === 0 ? 0 : Math.round(allObjs.filter(o => o.done).length / allObjs.length * 100);
  const filtered    = activeHoriz === "all" ? plans : plans.filter(p => p.horizon === activeHoriz);

  if (loading) return (
    <div className={`flex items-center justify-center min-h-screen ${bg}`}>
      <Loader2 className="animate-spin" size={32} style={{ color: GOLD }} />
    </div>
  );

  return (
    <div className={`min-h-screen ${bg}`}>

      {/* ── Header ── */}
      <div className={`border-b px-5 py-4 backdrop-blur-xl sm:px-8 sticky top-0 z-20 ${isDark ? "border-white/[0.06] bg-[#07080e]/95" : "border-black/[0.08] bg-[#f4f5f9]/95 shadow-sm"}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={Target} color="#075985" />
            <div>
              <h1 className={`text-base font-extrabold ${pri}`}>Planification Stratégique</h1>
              <p className={`text-[0.65rem] ${faint}`}>{activeCount} plan{activeCount !== 1 ? "s" : ""} actif{activeCount !== 1 ? "s" : ""} · {allObjs.length} objectifs</p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition hover:brightness-110 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: `0 4px 16px ${GOLD}35` }}>
            <Plus size={13} /> Nouveau plan
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">

        {/* ── KPI Cards ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Plans actifs",    value: activeCount,     icon: Target,    color: GOLD },
            { label: "Terminés",        value: doneCount,       icon: Trophy,    color: "#10b981" },
            { label: "Objectifs total", value: allObjs.length,  icon: Flag,      color: "#8b5cf6" },
            { label: "Taux complétion", value: `${donePct}%`,   icon: TrendingUp, color: "#3b82f6" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`relative overflow-hidden rounded-2xl border p-4 ${card}`}>
              <div className="absolute right-3 top-3 opacity-8">
                <Icon size={28} style={{ color }} />
              </div>
              <p className={`mb-1 text-[0.65rem] font-medium ${mut}`}>{label}</p>
              <p className="text-[2rem] font-bold leading-none" style={{ color }}>{value}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Horizon tabs ── */}
        <div className="flex flex-wrap gap-2">
          {(["all", "quarter", "year", "3years"] as const).map(h => {
            const cfg   = h === "all" ? null : HORIZON_CFG[h];
            const Icon  = cfg?.icon;
            const count = h === "all" ? plans.length : plans.filter(p => p.horizon === h).length;
            const active = activeHoriz === h;
            return (
              <button key={h} onClick={() => setActiveHoriz(h)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${active
                  ? "text-[#080a0f]"
                  : isDark ? "text-white/40 bg-white/[0.04] hover:bg-white/[0.07] hover:text-white/65"
                           : "text-[#0e1420]/40 bg-white hover:bg-black/[0.04] hover:text-[#0e1420]/65 shadow-sm border border-black/[0.06]"}`}
                style={active ? { background: `linear-gradient(135deg, ${GOLD}, #b08d45)` } : {}}>
                {Icon && <Icon size={11} />}
                {h === "all" ? "Tous" : cfg?.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${active ? "bg-black/15" : isDark ? "bg-white/[0.08]" : "bg-black/[0.06]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Plans grid ── */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border"
              style={{ background: `${GOLD}12`, borderColor: `${GOLD}25` }}>
              <Target size={36} style={{ color: GOLD, opacity: 0.7 }} />
            </div>
            <div>
              <p className={`text-base font-extrabold mb-1 ${pri}`}>
                {activeHoriz === "all" ? "Aucun plan stratégique" : `Aucun plan ${HORIZON_CFG[activeHoriz as Horizon]?.label}`}
              </p>
              <p className={`text-sm ${faint}`}>Définissez vos objectifs et pilotez votre croissance</p>
            </div>
            <button onClick={openNew}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold text-[#080a0f] hover:brightness-110 transition-all"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
              <Plus size={15} /> Créer un plan
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map(p => (
                <PlanCard key={p.id} plan={p} isDark={isDark}
                  onOpen={() => openEdit(p)}
                  onStatusChange={s => void updateStatus(p.id, s)}
                  onDelete={() => void deletePlan(p.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Modal formulaire ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl my-4 ${toolbar}`}
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: `${form.color}18` }}>
                    <Target size={14} style={{ color: form.color }} />
                  </div>
                  <h2 className={`text-sm font-extrabold ${pri}`}>
                    {editing ? "Modifier le plan" : "Nouveau plan stratégique"}
                  </h2>
                </div>
                <button onClick={() => setShowForm(false)}
                  className={`p-1.5 rounded-lg transition-all ${isDark ? "text-white/30 hover:text-white/60 hover:bg-white/[0.06]" : "text-[#0e1420]/30 hover:text-[#0e1420]/60 hover:bg-black/[0.05]"}`}>
                  <X size={14} />
                </button>
              </div>

              <div className={`p-6 space-y-5 max-h-[75vh] overflow-y-auto ${isDark ? "" : ""}`}>

                {/* Titre + couleur */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={`mb-1.5 block text-[10px] font-semibold uppercase tracking-wider ${mut}`}>Titre *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Ex : Croissance Q3 2025"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${inp}`} />
                  </div>
                  <div>
                    <label className={`mb-1.5 block text-[10px] font-semibold uppercase tracking-wider ${mut}`}>Couleur</label>
                    <div className="flex gap-1.5 pt-0.5">
                      {COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                          className={`h-7 w-7 rounded-lg transition-all ${form.color === c ? "ring-2 ring-white/50 scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Horizon */}
                <div>
                  <label className={`mb-2 block text-[10px] font-semibold uppercase tracking-wider ${mut}`}>Horizon temporel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(HORIZON_CFG) as [Horizon, typeof HORIZON_CFG[Horizon]][]).map(([h, cfg]) => {
                      const Icon = cfg.icon; const active = form.horizon === h;
                      return (
                        <button key={h} type="button" onClick={() => setForm(f => ({ ...f, horizon: h }))}
                          className={`p-3 rounded-xl border text-left transition-all ${active
                            ? "border-amber-500/40 bg-amber-500/[0.08]"
                            : isDark ? "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]"
                                     : "border-black/[0.07] bg-black/[0.02] hover:bg-black/[0.05]"}`}>
                          <Icon size={14} className={active ? "text-amber-400 mb-1" : `mb-1 ${mut}`} />
                          <p className={`text-xs font-semibold ${active ? "text-amber-400" : mut}`}>{cfg.label}</p>
                          <p className={`text-[10px] ${faint}`}>{cfg.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`mb-1.5 block text-[10px] font-semibold uppercase tracking-wider ${mut}`}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Contexte et ambition de ce plan…" rows={2}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all resize-none ${inp}`} />
                </div>

                {/* Objectifs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${mut}`}>
                      <Flag size={10} /> Objectifs
                    </label>
                    <button type="button" onClick={() => setForm(f => ({ ...f, objectives: [...f.objectives, newObj()] }))}
                      className="text-[10px] text-amber-400/70 hover:text-amber-400 flex items-center gap-1 transition-all font-semibold">
                      <Plus size={10} /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.objectives.map((o, i) => (
                      <div key={o.id} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-black/[0.02]"}`}>
                        <button type="button" onClick={() => updateObj(i, { done: !o.done })}
                          className={o.done ? "text-emerald-400" : isDark ? "text-white/20 hover:text-white/40" : "text-[#0e1420]/20 hover:text-[#0e1420]/40"}>
                          {o.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                        </button>
                        <input value={o.text} onChange={e => updateObj(i, { text: e.target.value })}
                          placeholder="Objectif à atteindre…"
                          className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white/65 placeholder-white/20" : "text-[#0e1420]/65 placeholder-[#0e1420]/20"}`} />
                        <input type="number" value={o.progress} min={0} max={100}
                          onChange={e => updateObj(i, { progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                          className={`w-12 rounded-lg px-1.5 py-0.5 text-xs text-center outline-none ${isDark ? "bg-white/[0.06] text-white/40" : "bg-black/[0.05] text-[#0e1420]/45"}`} />
                        <span className={`text-[10px] ${faint}`}>%</span>
                        <button type="button" onClick={() => setForm(f => ({ ...f, objectives: f.objectives.filter((_, j) => j !== i) }))}
                          className={isDark ? "text-white/15 hover:text-red-400 transition-all" : "text-[#0e1420]/15 hover:text-red-400 transition-all"}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {form.objectives.length === 0 && (
                      <p className={`text-xs text-center py-3 ${faint}`}>Aucun objectif — cliquez "Ajouter"</p>
                    )}
                  </div>
                </div>

                {/* KPIs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${mut}`}>
                      <BarChart3 size={10} /> KPIs
                    </label>
                    <button type="button" onClick={() => setForm(f => ({ ...f, kpis: [...f.kpis, newKPI()] }))}
                      className="text-[10px] text-amber-400/70 hover:text-amber-400 flex items-center gap-1 transition-all font-semibold">
                      <Plus size={10} /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.kpis.map((k, i) => (
                      <div key={k.id} className={`grid grid-cols-4 gap-2 items-center rounded-xl border px-3 py-2 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-black/[0.02]"}`}>
                        <input value={k.label} onChange={e => updateKPI(i, { label: e.target.value })}
                          placeholder="Indicateur" className={`col-span-2 bg-transparent text-xs outline-none ${isDark ? "text-white/60 placeholder-white/20" : "text-[#0e1420]/60 placeholder-[#0e1420]/20"}`} />
                        <div className="flex items-center gap-1">
                          <input value={k.current} onChange={e => updateKPI(i, { current: e.target.value })}
                            placeholder="Actuel" className={`w-full rounded-lg px-1.5 py-0.5 text-xs text-center outline-none ${isDark ? "bg-white/[0.06] text-white/50 placeholder-white/15" : "bg-black/[0.05] text-[#0e1420]/50 placeholder-[#0e1420]/15"}`} />
                          <span className={`text-[10px] ${faint}`}>/</span>
                          <input value={k.target} onChange={e => updateKPI(i, { target: e.target.value })}
                            placeholder="Cible" className={`w-full rounded-lg px-1.5 py-0.5 text-xs text-center outline-none ${isDark ? "bg-white/[0.06] text-white/50 placeholder-white/15" : "bg-black/[0.05] text-[#0e1420]/50 placeholder-[#0e1420]/15"}`} />
                        </div>
                        <div className="flex items-center gap-1">
                          <input value={k.unit} onChange={e => updateKPI(i, { unit: e.target.value })}
                            placeholder="€/%" className={`w-full rounded-lg px-1.5 py-0.5 text-xs text-center outline-none ${isDark ? "bg-white/[0.06] text-white/40 placeholder-white/15" : "bg-black/[0.05] text-[#0e1420]/40 placeholder-[#0e1420]/15"}`} />
                          <button type="button" onClick={() => setForm(f => ({ ...f, kpis: f.kpis.filter((_, j) => j !== i) }))}
                            className={`flex-shrink-0 ${isDark ? "text-white/15 hover:text-red-400" : "text-[#0e1420]/15 hover:text-red-400"} transition-all`}>
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {form.kpis.length === 0 && (
                      <p className={`text-xs text-center py-3 ${faint}`}>Aucun KPI — cliquez "Ajouter"</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className={`px-6 py-4 border-t flex justify-end gap-2 ${divider}`}>
                <button onClick={() => setShowForm(false)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${isDark ? "text-white/40 bg-white/[0.04] hover:bg-white/[0.08]" : "text-[#0e1420]/50 bg-black/[0.04] hover:bg-black/[0.07]"}`}>
                  Annuler
                </button>
                <button onClick={() => void doSave()} disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-extrabold text-[#080a0f] disabled:opacity-40 hover:brightness-110 transition-all"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {saving ? "Sauvegarde…" : "Sauvegarder"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl border ${toast.ok ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"}`}>
            {toast.ok ? <Check size={14} /> : <X size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
