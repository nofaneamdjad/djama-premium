"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Plus, Trash2, Save, X, Loader2, Check,
  Flag, TrendingUp, CheckCircle2, Circle, BarChart3,
  ChevronDown, ChevronRight, Edit3, Zap, Calendar,
  Trophy, Layers, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";

type Horizon = "quarter" | "year" | "3years";
type PlanStatus = "active" | "completed" | "paused";

interface Objective {
  id: string;
  text: string;
  progress: number;
  done: boolean;
}

interface KPI {
  id: string;
  label: string;
  target: string;
  current: string;
  unit: string;
}

interface Plan {
  id: string;
  user_id: string;
  title: string;
  horizon: Horizon;
  status: PlanStatus;
  description: string;
  objectives: Objective[];
  kpis: KPI[];
  color: string;
  created_at: string;
  updated_at: string;
}

type FormData = Omit<Plan, "id" | "user_id" | "created_at" | "updated_at">;

const GOLD = "#c9a55a";
const COLORS = ["#c9a55a", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

const HORIZON_CFG: Record<Horizon, { label: string; icon: typeof Target; desc: string }> = {
  quarter: { label: "Trimestre", icon: Zap, desc: "Objectifs sur 3 mois" },
  year: { label: "Année", icon: Calendar, desc: "Vision sur 12 mois" },
  "3years": { label: "3 ans", icon: Trophy, desc: "Plan stratégique long terme" },
};

const STATUS_CFG: Record<PlanStatus, { label: string; color: string }> = {
  active: { label: "Actif", color: "#10b981" },
  completed: { label: "Terminé", color: "#c9a55a" },
  paused: { label: "En pause", color: "#6b7280" },
};

function emptyForm(): FormData {
  return {
    title: "",
    horizon: "year",
    status: "active",
    description: "",
    objectives: [],
    kpis: [],
    color: GOLD,
  };
}

function newObj(): Objective {
  return { id: crypto.randomUUID(), text: "", progress: 0, done: false };
}

function newKPI(): KPI {
  return { id: crypto.randomUUID(), label: "", target: "", current: "", unit: "" };
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function PlanCard({
  plan,
  onOpen,
  onStatusChange,
  onDelete,
}: {
  plan: Plan;
  onOpen: () => void;
  onStatusChange: (s: PlanStatus) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const doneObjs = plan.objectives.filter(o => o.done).length;
  const totalObjs = plan.objectives.length;
  const avgProgress = totalObjs === 0 ? 0 :
    Math.round(plan.objectives.reduce((s, o) => s + (o.done ? 100 : o.progress), 0) / totalObjs);
  const HorizonIcon = HORIZON_CFG[plan.horizon].icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative p-5 rounded-2xl border border-white/8 bg-white/2 hover:bg-white/4 transition-all cursor-pointer"
      style={{ borderLeftWidth: 3, borderLeftColor: plan.color }}
      onClick={onOpen}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: `${plan.color}15` }}>
            <HorizonIcon size={13} style={{ color: plan.color }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/80">{plan.title}</p>
            <p className="text-[10px] text-white/30">{HORIZON_CFG[plan.horizon].label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ color: STATUS_CFG[plan.status].color, background: `${STATUS_CFG[plan.status].color}15` }}>
            {STATUS_CFG[plan.status].label}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/6 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronDown size={11} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 bg-[#1a1d26] border border-white/10 rounded-xl shadow-xl z-10 py-1 min-w-[120px]" onClick={e => e.stopPropagation()}>
                {(Object.keys(STATUS_CFG) as PlanStatus[]).map(s => (
                  <button key={s} onClick={() => { onStatusChange(s); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/6 transition-all">
                    {STATUS_CFG[s].label}
                  </button>
                ))}
                <div className="border-t border-white/8 mt-1 pt-1">
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/8 transition-all">
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {plan.description && (
        <p className="text-xs text-white/35 mb-3 line-clamp-2">{plan.description}</p>
      )}

      {/* Progress */}
      {totalObjs > 0 && (
        <div className="mb-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-white/25">
            <span>{doneObjs}/{totalObjs} objectifs</span>
            <span>{avgProgress}%</span>
          </div>
          <ProgressBar value={avgProgress} color={plan.color} />
        </div>
      )}

      {/* KPIs preview */}
      {plan.kpis.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {plan.kpis.slice(0, 3).map(k => (
            <div key={k.id} className="text-[10px] bg-white/4 rounded-lg px-2 py-1">
              <span className="text-white/40">{k.label}: </span>
              <span className="text-white/60 font-medium">{k.current || "—"}</span>
              <span className="text-white/25">/{k.target}{k.unit}</span>
            </div>
          ))}
          {plan.kpis.length > 3 && <span className="text-[10px] text-white/20">+{plan.kpis.length - 3}</span>}
        </div>
      )}
    </motion.div>
  );
}

export default function PlanificationPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHorizon, setActiveHorizon] = useState<Horizon | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    setUserId(user.id);
    const { data } = await supabase
      .from("strategic_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPlans(data ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      title: p.title,
      horizon: p.horizon,
      status: p.status,
      description: p.description,
      objectives: p.objectives,
      kpis: p.kpis,
      color: p.color,
    });
    setShowForm(true);
  };

  const doSave = async () => {
    if (!userId || !form.title.trim()) { showToast("Titre requis", false); return; }
    setSaving(true);
    const payload = { ...form, user_id: userId, updated_at: new Date().toISOString() };
    if (editing) {
      const { error } = await supabase.from("strategic_plans").update(payload).eq("id", editing.id);
      if (!error) {
        setPlans(prev => prev.map(p => p.id === editing.id ? { ...p, ...payload } : p));
        setShowForm(false);
        showToast("Plan mis à jour");
      } else showToast(error.message, false);
    } else {
      const { data, error } = await supabase.from("strategic_plans").insert(payload).select().single();
      if (!error && data) {
        setPlans(prev => [data, ...prev]);
        setShowForm(false);
        showToast("Plan créé");
      } else showToast(error?.message ?? "Erreur", false);
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

  const updateObj = (idx: number, patch: Partial<Objective>) => {
    setForm(f => ({ ...f, objectives: f.objectives.map((o, i) => i === idx ? { ...o, ...patch } : o) }));
  };

  const updateKPI = (idx: number, patch: Partial<KPI>) => {
    setForm(f => ({ ...f, kpis: f.kpis.map((k, i) => i === idx ? { ...k, ...patch } : k) }));
  };

  const filtered = activeHorizon === "all" ? plans : plans.filter(p => p.horizon === activeHorizon);

  const activeCount = plans.filter(p => p.status === "active").length;
  const completedCount = plans.filter(p => p.status === "completed").length;
  const allObjs = plans.flatMap(p => p.objectives);
  const doneObjsPct = allObjs.length === 0 ? 0 : Math.round(allObjs.filter(o => o.done).length / allObjs.length * 100);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? "bg-[#0a0b0f]" : "bg-[#f4f5f9]"}`}>
        <Loader2 className="animate-spin text-[#c9a55a]" size={32} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#0a0b0f]" : "bg-[#f4f5f9]"}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-amber-500/10 shrink-0">
                <Target size={16} style={{ color: GOLD }} />
              </div>
              <h1 className="text-xl font-bold text-white">Planification Stratégique</h1>
            </div>
            <p className="text-sm text-white/30 ml-10">Définissez vos objectifs et pilotez votre croissance</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#0a0b0f] hover:brightness-110 transition-all shrink-0"
            style={{ background: GOLD }}
          >
            <Plus size={14} /> Nouveau plan
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Plans actifs", value: activeCount, icon: Target },
            { label: "Terminés", value: completedCount, icon: Trophy },
            { label: "Objectifs total", value: allObjs.length, icon: Flag },
            { label: "Taux complétion", value: `${doneObjsPct}%`, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} className="text-amber-400/60" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-2xl font-bold text-white/85">{value}</p>
            </div>
          ))}
        </div>

        {/* Horizon tabs */}
        <div className="flex flex-wrap gap-2">
          {(["all", "quarter", "year", "3years"] as const).map(h => {
            const cfg = h === "all" ? null : HORIZON_CFG[h];
            const Icon = cfg?.icon;
            const count = h === "all" ? plans.length : plans.filter(p => p.horizon === h).length;
            return (
              <button
                key={h}
                onClick={() => setActiveHorizon(h)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs transition-all ${activeHorizon === h ? "text-[#0a0b0f] font-medium" : "text-white/40 bg-white/4 hover:bg-white/7"}`}
                style={activeHorizon === h ? { background: GOLD } : {}}
              >
                {Icon && <Icon size={11} />}
                {h === "all" ? "Tous" : cfg?.label}
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${activeHorizon === h ? "bg-black/20" : "bg-white/8"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Plans grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="p-5 rounded-2xl bg-amber-500/8 inline-block mb-4">
              <Target size={32} style={{ color: GOLD }} />
            </div>
            <p className="text-white/30 text-sm mb-6">
              {activeHorizon === "all" ? "Aucun plan stratégique — définissez vos objectifs" : `Aucun plan ${HORIZON_CFG[activeHorizon as Horizon]?.label}`}
            </p>
            <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#0a0b0f] mx-auto hover:brightness-110 transition-all" style={{ background: GOLD }}>
              <Plus size={14} /> Créer un plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map(p => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onOpen={() => openEdit(p)}
                  onStatusChange={s => void updateStatus(p.id, s)}
                  onDelete={() => void deletePlan(p.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#0f1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="text-sm font-semibold text-white">
                  {editing ? "Modifier le plan" : "Nouveau plan stratégique"}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/6 transition-all">
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Title + Color */}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Titre du plan *</label>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Ex: Croissance Q3 2025"
                      className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-amber-500/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Couleur</label>
                    <div className="flex gap-1.5">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, color: c }))}
                          className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? "ring-2 ring-white/40 scale-110" : "hover:scale-105"}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Horizon */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider">Horizon</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(HORIZON_CFG) as [Horizon, typeof HORIZON_CFG[Horizon]][]).map(([h, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, horizon: h }))}
                          className={`p-3 rounded-xl border text-left transition-all ${form.horizon === h ? "border-amber-500/40 bg-amber-500/8" : "border-white/8 bg-white/2 hover:bg-white/5"}`}
                        >
                          <Icon size={14} className={form.horizon === h ? "text-amber-400 mb-1" : "text-white/30 mb-1"} />
                          <p className={`text-xs font-medium ${form.horizon === h ? "text-amber-400" : "text-white/50"}`}>{cfg.label}</p>
                          <p className="text-[10px] text-white/20">{cfg.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Contexte et ambition de ce plan..."
                    rows={2}
                    className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/60 placeholder-white/20 outline-none focus:border-amber-500/30 resize-none"
                  />
                </div>

                {/* Objectives */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                      <Flag size={10} /> Objectifs
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, objectives: [...f.objectives, newObj()] }))}
                      className="text-[10px] text-amber-400/60 hover:text-amber-400 flex items-center gap-1 transition-all"
                    >
                      <Plus size={10} /> Ajouter
                    </button>
                  </div>
                  {form.objectives.map((o, i) => (
                    <div key={o.id} className="flex items-center gap-2 bg-white/3 rounded-xl px-3 py-2">
                      <button
                        type="button"
                        onClick={() => updateObj(i, { done: !o.done })}
                        className={o.done ? "text-emerald-400" : "text-white/20 hover:text-white/40"}
                      >
                        {o.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </button>
                      <input
                        value={o.text}
                        onChange={e => updateObj(i, { text: e.target.value })}
                        placeholder="Objectif à atteindre..."
                        className="flex-1 bg-transparent text-sm text-white/65 placeholder-white/20 outline-none"
                      />
                      <input
                        type="number"
                        value={o.progress}
                        onChange={e => updateObj(i, { progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                        className="w-12 bg-white/6 rounded-lg px-1.5 py-0.5 text-xs text-white/40 outline-none text-center"
                        min={0} max={100}
                      />
                      <span className="text-[10px] text-white/20">%</span>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, objectives: f.objectives.filter((_, j) => j !== i) }))}
                        className="text-white/15 hover:text-red-400 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* KPIs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 size={10} /> KPIs
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, kpis: [...f.kpis, newKPI()] }))}
                      className="text-[10px] text-amber-400/60 hover:text-amber-400 flex items-center gap-1 transition-all"
                    >
                      <Plus size={10} /> Ajouter
                    </button>
                  </div>
                  {form.kpis.map((k, i) => (
                    <div key={k.id} className="grid grid-cols-4 gap-2 items-center bg-white/3 rounded-xl px-3 py-2">
                      <input
                        value={k.label}
                        onChange={e => updateKPI(i, { label: e.target.value })}
                        placeholder="Indicateur"
                        className="col-span-2 bg-transparent text-xs text-white/60 placeholder-white/20 outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          value={k.current}
                          onChange={e => updateKPI(i, { current: e.target.value })}
                          placeholder="Actuel"
                          className="w-full bg-white/6 rounded-lg px-1.5 py-0.5 text-xs text-white/50 placeholder-white/15 outline-none text-center"
                        />
                        <span className="text-[10px] text-white/20">/</span>
                        <input
                          value={k.target}
                          onChange={e => updateKPI(i, { target: e.target.value })}
                          placeholder="Cible"
                          className="w-full bg-white/6 rounded-lg px-1.5 py-0.5 text-xs text-white/50 placeholder-white/15 outline-none text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          value={k.unit}
                          onChange={e => updateKPI(i, { unit: e.target.value })}
                          placeholder="€/%"
                          className="w-full bg-white/6 rounded-lg px-1.5 py-0.5 text-xs text-white/40 placeholder-white/15 outline-none text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, kpis: f.kpis.filter((_, j) => j !== i) }))}
                          className="text-white/15 hover:text-red-400 transition-all flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs text-white/40 bg-white/4 hover:bg-white/8 transition-all">
                  Annuler
                </button>
                <button
                  onClick={() => void doSave()}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-medium text-[#0a0b0f] disabled:opacity-40 hover:brightness-110 transition-all"
                  style={{ background: GOLD }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl ${toast.ok ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}
          >
            {toast.ok ? <Check size={14} /> : <X size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
