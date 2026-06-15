"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Plus, X, Loader2, Trash2,
  Calendar, Tag, Clock, CheckCircle2, PauseCircle,
  XCircle, AlertCircle, Edit2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

/* ── Types ── */
type Status = "en_cours" | "terminé" | "en_attente" | "annulé";

interface Project {
  id: string;
  user_id: string;
  title: string;
  client: string;
  status: Status;
  category: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  spent: number;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

type Draft = Partial<Omit<Project, "id" | "user_id" | "created_at" | "updated_at">>;

/* ── Constants ── */
const VIOLET = "#8b5cf6";
const GOLD   = "#c9a55a";

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; Icon: React.ComponentType<{ size?: number }> }> = {
  en_cours:   { label: "En cours",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  Icon: Clock        },
  terminé:    { label: "Terminé",    color: "#10b981", bg: "rgba(16,185,129,0.12)",  Icon: CheckCircle2 },
  en_attente: { label: "En attente", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  Icon: PauseCircle  },
  annulé:     { label: "Annulé",    color: "#ef4444", bg: "rgba(239,68,68,0.12)",   Icon: XCircle      },
};

const COLORS = ["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#c9a55a"];

const CATEGORIES = ["Design","Développement","Marketing","Conseil","Rédaction","Comptabilité","Juridique","Autre"];

function emptyDraft(): Draft {
  return {
    title: "", client: "", status: "en_cours", category: "Autre",
    start_date: "", end_date: "", budget: 0, spent: 0, description: "", color: VIOLET,
  };
}

function fmtEur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Sub-components ── */

function StatusBadge({ status }: { status: Status }) {
  const { label, color, bg, Icon } = STATUS_CONFIG[status];
  return (
    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color, background: bg }}>
      <Icon size={11} />{label}
    </span>
  );
}

function ProjectCard({
  project, onEdit, onDelete,
}: {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}) {
  const budgetPct   = project.budget > 0 ? Math.min(100, Math.round((project.spent / project.budget) * 100)) : 0;
  const overBudget  = project.budget > 0 && project.spent > project.budget;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-white/4 p-5 transition-all hover:border-white/12"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: project.color }} />
          <div className="min-w-0">
            <h3 className="truncate font-bold text-white">{project.title}</h3>
            {project.client && <p className="truncate text-xs text-white/40">{project.client}</p>}
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 text-xs text-white/35">
        {project.category !== "Autre" && (
          <span className="flex items-center gap-1"><Tag size={10} />{project.category}</span>
        )}
        {(project.start_date || project.end_date) && (
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {fmtDate(project.start_date)} → {fmtDate(project.end_date)}
          </span>
        )}
      </div>

      {/* Budget bar */}
      {project.budget > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/35">Budget</span>
            <span className={overBudget ? "font-bold text-red-400" : "text-white/60"}>
              {fmtEur(project.spent)} / {fmtEur(project.budget)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${budgetPct}%`, background: overBudget ? "#ef4444" : VIOLET }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      {project.description && (
        <p className="line-clamp-2 text-xs text-white/30">{project.description}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onEdit(project)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/8 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/6 hover:text-white"
        >
          <Edit2 size={11} /> Modifier
        </button>
        <button
          onClick={() => onDelete(project.id)}
          className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/6 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/12"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  );
}

function ProjectModal({
  draft, setDraft, onSave, onClose, saving, isEdit,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function field(key: keyof Draft, value: string | number) {
    setDraft(d => ({ ...d, [key]: value }));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/8 bg-[#151821] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{isEdit ? "Modifier le projet" : "Nouveau projet"}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-white/40 transition hover:bg-white/8 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Titre *</label>
            <input
              value={draft.title ?? ""}
              onChange={e => field("title", e.target.value)}
              placeholder="Ex : Site e-commerce Boutique X"
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Client</label>
              <input
                value={draft.client ?? ""}
                onChange={e => field("client", e.target.value)}
                placeholder="Nom du client"
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Catégorie</label>
              <select
                value={draft.category ?? "Autre"}
                onChange={e => field("category", e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-[#1a1f2e] px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Statut</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as Status[]).map(s => {
                const { label, color, bg } = STATUS_CONFIG[s];
                const active = draft.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => field("status", s)}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                    style={active
                      ? { color, background: bg, borderColor: color + "40" }
                      : { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Date début</label>
              <input
                type="date"
                value={draft.start_date ?? ""}
                onChange={e => field("start_date", e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Date fin</label>
              <input
                type="date"
                value={draft.end_date ?? ""}
                onChange={e => field("end_date", e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Budget (€)</label>
              <input
                type="number" min="0"
                value={draft.budget ?? 0}
                onChange={e => field("budget", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Encaissé (€)</label>
              <input
                type="number" min="0"
                value={draft.spent ?? 0}
                onChange={e => field("spent", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Couleur</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => field("color", c)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: draft.color === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Description</label>
            <textarea
              value={draft.description ?? ""}
              onChange={e => field("description", e.target.value)}
              placeholder="Contexte, livrables, notes..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-violet-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm font-semibold text-white/50 transition hover:bg-white/4"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={saving || !draft.title?.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
            style={{ background: VIOLET }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le projet"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ── */
export default function ProjetsPage() {
  const router = useRouter();
  const { toasts, add: toast, remove: removeToast } = useToastStack();

  const [projects,    setProjects]    = useState<Project[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<Status | "tous">("tous");
  const [showModal,   setShowModal]   = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [draft,       setDraft]       = useState<Draft>(emptyDraft());
  const [saving,      setSaving]      = useState(false);
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) { toast("Erreur réseau — impossible de charger les projets", "error"); return; }
      setProjects((data ?? []) as Project[]);
    } catch {
      toast("Erreur réseau — impossible de charger les projets", "error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() =>
    filter === "tous" ? projects : projects.filter(p => p.status === filter),
    [projects, filter]
  );

  const kpis = useMemo(() => ({
    enCours:  projects.filter(p => p.status === "en_cours").length,
    terminé:  projects.filter(p => p.status === "terminé").length,
    budget:   projects.reduce((s, p) => s + p.budget, 0),
    encaissé: projects.reduce((s, p) => s + p.spent, 0),
  }), [projects]);

  function openNew() {
    setEditProject(null);
    setDraft(emptyDraft());
    setShowModal(true);
  }

  function openEdit(p: Project) {
    setEditProject(p);
    setDraft({
      title: p.title, client: p.client, status: p.status, category: p.category,
      start_date: p.start_date ?? "", end_date: p.end_date ?? "",
      budget: p.budget, spent: p.spent, description: p.description, color: p.color,
    });
    setShowModal(true);
  }

  async function saveProject() {
    if (!draft.title?.trim()) { toast("Le titre est requis.", "error"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); toast("Session expirée — rechargez la page.", "error"); return; }

    const payload = {
      title:       draft.title.trim(),
      client:      draft.client?.trim() ?? "",
      status:      draft.status ?? "en_cours",
      category:    draft.category ?? "Autre",
      start_date:  draft.start_date || null,
      end_date:    draft.end_date   || null,
      budget:      draft.budget  ?? 0,
      spent:       draft.spent   ?? 0,
      description: draft.description ?? "",
      color:       draft.color ?? VIOLET,
      updated_at:  new Date().toISOString(),
    };

    if (editProject) {
      const { data, error } = await supabase.from("projects").update(payload).eq("id", editProject.id).select().single();
      if (error) { toast("Erreur lors de la mise à jour.", "error"); setSaving(false); return; }
      if (data) setProjects(p => p.map(x => x.id === editProject.id ? data as Project : x));
      toast("Projet mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("projects").insert({ ...payload, user_id: user.id }).select().single();
      if (error) { toast("Erreur lors de la création.", "error"); setSaving(false); return; }
      if (data) setProjects(p => [data as Project, ...p]);
      toast("Projet créé", "success");
    }
    setSaving(false);
    setShowModal(false);
  }

  async function deleteProject(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast("Erreur lors de la suppression.", "error"); return; }
    setProjects(p => p.filter(x => x.id !== id));
    setConfirmDel(null);
    toast("Projet supprimé", "success");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 lg:px-8">
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Projets</h1>
          <p className="text-sm text-white/40">{projects.length} projet{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
          style={{ background: VIOLET }}
        >
          <Plus size={16} /> Nouveau projet
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "En cours",  value: String(kpis.enCours),          color: "#3b82f6", sub: "projets actifs"     },
          { label: "Terminés",  value: String(kpis.terminé),           color: "#10b981", sub: "projets terminés"   },
          { label: "Budget",    value: fmtEur(kpis.budget),            color: GOLD,      sub: "budget total"       },
          { label: "Encaissé",  value: fmtEur(kpis.encaissé),          color: VIOLET,    sub: "revenus encaissés"  },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/35">{k.label}</p>
            <p className="mt-1 text-2xl font-extrabold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-white/25">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {([
          ["tous",       "Tous"],
          ["en_cours",   "En cours"],
          ["en_attente", "En attente"],
          ["terminé",    "Terminés"],
          ["annulé",    "Annulés"],
        ] as [Status | "tous", string][]).map(([s, l]) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
            style={filter === s
              ? { background: VIOLET, borderColor: VIOLET, color: "#fff" }
              : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            {l}
            {s !== "tous" && (
              <span className="ml-1.5 opacity-60">
                {projects.filter(p => p.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste projets */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="rounded-3xl bg-white/4 p-6">
            <FolderOpen size={40} className="text-white/20" />
          </div>
          <p className="font-bold text-white/40">
            {filter === "tous"
              ? "Aucun projet pour le moment"
              : `Aucun projet « ${STATUS_CONFIG[filter as Status]?.label ?? filter} »`}
          </p>
          {filter === "tous" && (
            <button
              onClick={openNew}
              className="mt-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: VIOLET }}
            >
              Créer mon premier projet
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={openEdit}
                onDelete={id => setConfirmDel(id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal projet */}
      <AnimatePresence>
        {showModal && (
          <ProjectModal
            draft={draft}
            setDraft={setDraft}
            onSave={saveProject}
            onClose={() => setShowModal(false)}
            saving={saving}
            isEdit={!!editProject}
          />
        )}
      </AnimatePresence>

      {/* Confirm suppression */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#151821] p-6 text-center shadow-2xl"
            >
              <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
              <h3 className="mb-1 text-lg font-bold text-white">Supprimer ce projet ?</h3>
              <p className="mb-6 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDel(null)}
                  className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm font-semibold text-white/50 transition hover:bg-white/4"
                >
                  Annuler
                </button>
                <button
                  onClick={() => void deleteProject(confirmDel)}
                  className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/25"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
