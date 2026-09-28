"use client";
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ListChecks, Activity, Target, ArrowRight, Loader2, Plus,
  Play, Square, CornerDownLeft, AlertTriangle, Sparkles, FileText,
  Link2, LayoutTemplate, Network, Download,
  Rocket, Phone, Bug, PenLine, Palette, BarChart3, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const VIOLET = "#8b5cf6";

const PRIO = {
  low:    { label: "Faible",  color: "#6b7280", bg: "bg-gray-500/15",  txt: "text-gray-400"  },
  normal: { label: "Normale", color: "#3b82f6", bg: "bg-blue-500/15",  txt: "text-blue-400"  },
  high:   { label: "Haute",   color: "#f59e0b", bg: "bg-amber-500/15", txt: "text-amber-400" },
  urgent: { label: "Urgente", color: "#ef4444", bg: "bg-red-500/15",   txt: "text-red-400"   },
} as const;

const STAT = {
  todo:        { label: "À faire",    col: "#6b7280" },
  in_progress: { label: "En cours",   col: "#3b82f6" },
  validation:  { label: "Validation", col: "#f59e0b" },
  done:        { label: "Terminé",    col: "#10b981" },
  waiting:     { label: "En attente", col: "#8b5cf6" },
  late:        { label: "En retard",  col: "#ef4444" },
} as const;

type Priority = keyof typeof PRIO;
type Status   = keyof typeof STAT;
type View     = "kanban" | "list";
type LTab     = "today" | "week" | "late" | "done";

const KANBAN_COLS: { key: Status; col: string }[] = [
  { key: "todo",        col: "#6b7280" },
  { key: "in_progress", col: "#3b82f6" },
  { key: "validation",  col: "#f59e0b" },
  { key: "done",        col: "#10b981" },
];

const CATS = [
  "Développement","Design","Marketing","RH","Finance","Commercial","Support","Autre",
];

const RECURS = [
  { v: "none",    l: "Pas de répétition" },
  { v: "daily",   l: "Chaque jour"       },
  { v: "weekly",  l: "Chaque semaine"    },
  { v: "monthly", l: "Chaque mois"       },
];

interface Sub { id: string; title: string; done: boolean }
interface Cmt { id: string; author_name: string; content: string; created_at: string }

interface Task {
  id: string; title: string; description: string;
  priority: Priority; status: Status; category: string;
  due_date: string; due_time: string; responsible: string;
  assignees: string[]; subtasks: Sub[]; tags: string[];
  estimated_minutes: number; time_spent: number;
  timer_started_at: string | null;
  is_recurring: boolean; recurrence: string;
  linked_module: string; dependencies: string[];
  sort_order: number; created_at: string;
  recurrence_parent_id: string | null;
  // ERP links (Phase 5)
  linked_document_id: string | null;
  linked_contact_id: string | null;
  linked_project_id: string | null;
  linked_contract_id: string | null;
  linked_supplier_id: string | null;
  linked_product_id: string | null;
}

interface DbTemplate {
  id: string; name: string; description: string; icon: string; color: string;
  priority: string; category: string; estimated_minutes: number;
  tags: string[]; subtasks: Sub[]; recurrence: string; is_recurring: boolean;
  is_shared: boolean; created_at: string;
}

type Form = Omit<Task, "id" | "created_at">;

const BLANK: Form = {
  title: "", description: "", priority: "normal", status: "todo",
  category: "", due_date: "", due_time: "", responsible: "", assignees: [],
  subtasks: [], tags: [], estimated_minutes: 30, time_spent: 0,
  timer_started_at: null, is_recurring: false, recurrence: "none",
  linked_module: "", dependencies: [], sort_order: 0,
  recurrence_parent_id: null,
  linked_document_id: null, linked_contact_id: null, linked_project_id: null,
  linked_contract_id: null, linked_supplier_id: null, linked_product_id: null,
};

const TASK_TEMPLATES: { Icon: LucideIcon; color: string; label: string; desc: string; form: Partial<Form> }[] = [
  {
    Icon: Rocket, color: "#8b5cf6", label: "Lancement produit",
    desc: "Tâche de déploiement avec checklist complète",
    form: {
      title: "Lancement produit v1.0", category: "Développement", priority: "high",
      estimated_minutes: 120,
      tags: ["lancement", "prod"],
      subtasks: [
        { id: crypto.randomUUID(), title: "Tests de régression", done: false },
        { id: crypto.randomUUID(), title: "Mise à jour documentation", done: false },
        { id: crypto.randomUUID(), title: "Notifier l'équipe", done: false },
        { id: crypto.randomUUID(), title: "Surveillance post-déploiement", done: false },
      ],
    },
  },
  {
    Icon: Phone, color: "#3b82f6", label: "Appel client",
    desc: "Préparation et suivi d'un appel client",
    form: {
      title: "Appel client — suivi projet", category: "Commercial", priority: "high",
      estimated_minutes: 60,
      tags: ["client", "réunion"],
      subtasks: [
        { id: crypto.randomUUID(), title: "Préparer l'ordre du jour", done: false },
        { id: crypto.randomUUID(), title: "Réviser les notes précédentes", done: false },
        { id: crypto.randomUUID(), title: "Envoyer le compte-rendu", done: false },
      ],
    },
  },
  {
    Icon: Bug, color: "#ef4444", label: "Correction bug",
    desc: "Résolution d'un bug en production",
    form: {
      title: "Corriger le bug : [description]", category: "Développement", priority: "urgent",
      estimated_minutes: 90,
      tags: ["bug", "hotfix"],
      subtasks: [
        { id: crypto.randomUUID(), title: "Reproduire le bug", done: false },
        { id: crypto.randomUUID(), title: "Identifier la cause racine", done: false },
        { id: crypto.randomUUID(), title: "Implémenter le fix", done: false },
        { id: crypto.randomUUID(), title: "Tester la correction", done: false },
      ],
    },
  },
  {
    Icon: PenLine, color: "#10b981", label: "Article de blog",
    desc: "Rédaction d'un article de contenu",
    form: {
      title: "Rédiger article : [sujet]", category: "Marketing", priority: "normal",
      estimated_minutes: 180,
      tags: ["contenu", "blog"],
      subtasks: [
        { id: crypto.randomUUID(), title: "Recherche et plan", done: false },
        { id: crypto.randomUUID(), title: "Premier brouillon", done: false },
        { id: crypto.randomUUID(), title: "Révision et SEO", done: false },
        { id: crypto.randomUUID(), title: "Publication", done: false },
      ],
    },
  },
  {
    Icon: Palette, color: "#ec4899", label: "Design UI",
    desc: "Création d'un composant ou écran",
    form: {
      title: "Design : [composant]", category: "Design", priority: "normal",
      estimated_minutes: 120,
      tags: ["design", "ui"],
      subtasks: [
        { id: crypto.randomUUID(), title: "Wireframe rapide", done: false },
        { id: crypto.randomUUID(), title: "Maquette haute fidélité", done: false },
        { id: crypto.randomUUID(), title: "Revue design", done: false },
        { id: crypto.randomUUID(), title: "Handoff développeur", done: false },
      ],
    },
  },
  {
    Icon: BarChart3, color: "#f59e0b", label: "Rapport mensuel",
    desc: "Préparation du rapport de performance",
    form: {
      title: "Rapport mensuel — [mois]", category: "Finance", priority: "high",
      estimated_minutes: 90,
      recurrence: "monthly", is_recurring: true,
      tags: ["rapport", "kpi"],
      subtasks: [
        { id: crypto.randomUUID(), title: "Collecter les données", done: false },
        { id: crypto.randomUUID(), title: "Mettre à jour les KPIs", done: false },
        { id: crypto.randomUUID(), title: "Rédiger le commentaire", done: false },
        { id: crypto.randomUUID(), title: "Envoyer à la direction", done: false },
      ],
    },
  },
];

function parseTask(r: Record<string, unknown>): Task {
  let subtasks: Sub[] = [];
  try {
    const raw = r.subtasks;
    if (typeof raw === "string") subtasks = JSON.parse(raw);
    else if (Array.isArray(raw)) subtasks = raw as Sub[];
  } catch { subtasks = []; }
  return {
    id: String(r.id ?? ""), title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    priority: (r.priority as Priority) ?? "normal",
    status: (r.status as Status) ?? "todo",
    category: String(r.category ?? ""),
    due_date: r.due_date ? String(r.due_date).slice(0, 10) : "",
    due_time: String(r.due_time ?? ""),
    responsible: String(r.responsible ?? ""),
    assignees: Array.isArray(r.assignees) ? r.assignees.map(String) : [],
    subtasks,
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    estimated_minutes: Number(r.estimated_minutes ?? 30),
    time_spent: Number(r.time_spent ?? 0),
    timer_started_at: r.timer_started_at ? String(r.timer_started_at) : null,
    is_recurring: Boolean(r.is_recurring),
    recurrence: String(r.recurrence ?? "none"),
    linked_module: String(r.linked_module ?? ""),
    dependencies: Array.isArray(r.dependencies) ? r.dependencies.map(String) : [],
    sort_order: Number(r.sort_order ?? 0),
    created_at: String(r.created_at ?? ""),
    recurrence_parent_id: r.recurrence_parent_id ? String(r.recurrence_parent_id) : null,
    linked_document_id: r.linked_document_id ? String(r.linked_document_id) : null,
    linked_contact_id:  r.linked_contact_id  ? String(r.linked_contact_id)  : null,
    linked_project_id:  r.linked_project_id  ? String(r.linked_project_id)  : null,
    linked_contract_id: r.linked_contract_id ? String(r.linked_contract_id) : null,
    linked_supplier_id: r.linked_supplier_id ? String(r.linked_supplier_id) : null,
    linked_product_id:  r.linked_product_id  ? String(r.linked_product_id)  : null,
  };
}

const isLate = (t: Task) =>
  !!t.due_date && t.status !== "done" &&
  new Date(t.due_date + "T00:00:00") < new Date(new Date().toDateString());

const totalSec = (t: Task, now: number) =>
  t.time_spent + (t.timer_started_at
    ? Math.floor((now - new Date(t.timer_started_at).getTime()) / 1000)
    : 0);

const fmtSec = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
};

const fmtDate = (d: string) => {
  if (!d) return "";
  const diff = Math.round(
    (new Date(d + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime()) / 86400000
  );
  if (diff === 0)  return "Aujourd'hui";
  if (diff === 1)  return "Demain";
  if (diff === -1) return "Hier";
  if (diff < 0)   return `${-diff}j retard`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const ini = (n: string) =>
  n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");

const AV_COLS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
const avCol = (n: string) => AV_COLS[(n.charCodeAt(0) || 0) % AV_COLS.length];

const DarkCtx = createContext(true);
const useDark = () => useContext(DarkCtx);
function selStyle(isDark: boolean): React.CSSProperties {
  return {
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
    colorScheme: isDark ? "dark" : "light",
  };
}

const SEL = "rounded-lg border border-white/8 bg-white/6 py-1.5 pl-3 pr-8 text-sm text-white/75 outline-none appearance-none hover:border-white/20 transition [color-scheme:dark]";

function PBadge({ p }: { p: Priority }) {
  const c = PRIO[p];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold ${c.bg} ${c.txt}`}>
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

function Av({ name, size = 22 }: { name: string; size?: number }) {
  const col = avCol(name);
  return (
    <span title={name}
      style={{ width: size, height: size, background: col + "28", border: `1.5px solid ${col}50`, fontSize: size * 0.4 }}
      className="inline-flex items-center justify-center rounded-full font-bold text-white/85 shrink-0 select-none">
      {ini(name) || "?"}
    </span>
  );
}

function SubBar({ subs }: { subs: Sub[] }) {
  const isDark = useDark();
  if (!subs.length) return null;
  const done = subs.filter(s => s.done).length;
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <div className={`h-1 flex-1 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(done / subs.length) * 100}%`, background: VIOLET }} />
      </div>
      <span className={`text-[0.6rem] shrink-0 ${isDark ? "text-white/35" : "text-gray-400"}`}>{done}/{subs.length}</span>
    </div>
  );
}

function TaskCard({ task, now, onEdit, onMove, onTimer, onDragStart, onDropBefore, isDragging, compact = false }: {
  task: Task; now: number;
  onEdit: () => void;
  onMove: (s: Status) => void;
  onTimer: () => void;
  onDragStart: () => void;
  onDropBefore: () => void;
  isDragging: boolean;
  compact?: boolean;
}) {
  const isDark = useDark();
  const [hov, setHov] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);
  const late    = isLate(task);
  const running = !!task.timer_started_at;
  const elapsed = totalSec(task, now);
  const pc      = PRIO[task.priority];

  const NEXT_STATUS: Partial<Record<Status, Status>> = {
    todo: "in_progress", in_progress: "validation", validation: "done",
  };
  const nextSt = NEXT_STATUS[task.status];

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart(); }}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropTarget(true); }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); setDropTarget(false); onDropBefore(); }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={`relative rounded-xl border cursor-grab active:cursor-grabbing transition-all ${compact ? "p-2" : "p-3"} ${isDragging ? "opacity-40 scale-95" : ""} ${dropTarget ? isDark ? "border-violet-500/60 bg-violet-500/10" : "border-violet-400 bg-violet-50" : isDark
        ? "border-white/6 bg-white/4 hover:border-white/[0.16] hover:shadow-lg hover:shadow-black/30"
        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"}`}
      style={{ borderLeft: `3px solid ${pc.color}` }}
      onClick={e => { if (!isDragging) onEdit(); e.stopPropagation(); }}>

      {running && (
        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
      )}

      {compact ? (
        /* Mode compact : titre + badge priorité sur une seule ligne */
        <div className="flex items-center gap-2 pr-4">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: pc.color }} />
          <p className={`text-[0.78rem] font-medium truncate flex-1 ${isDark ? "text-white/88" : "text-gray-800"}`}>{task.title}</p>
          {task.due_date && <span className={`text-[0.58rem] shrink-0 ${late ? "text-red-400" : isDark ? "text-white/30" : "text-gray-400"}`}>{fmtDate(task.due_date)}</span>}
        </div>
      ) : (
        <>
          <p className={`text-[0.82rem] font-medium leading-snug line-clamp-2 pr-4 mb-2 ${isDark ? "text-white/88" : "text-gray-800"}`}>
            {task.title}
          </p>

          <div className="flex flex-wrap gap-1 mb-2">
            {task.category && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.58rem] ${isDark ? "bg-violet-500/10 text-violet-300/80" : "bg-violet-50 text-violet-600"}`}>
                {task.category}
              </span>
            )}
            {task.tags.slice(0, 3).map(tag => (
              <span key={tag} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[0.55rem] border ${isDark ? "bg-white/6 text-white/40 border-white/8" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                #{tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className={`text-[0.55rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>+{task.tags.length - 3}</span>
            )}
          </div>

          <div className="mb-2">
            <PBadge p={task.priority} />
          </div>

          {task.dependencies.length > 0 && (
            <div className="mb-1.5 flex items-center gap-1 text-[0.58rem] text-amber-400/70">
              <Link2 size={9} /> Bloqué par {task.dependencies.length} tâche{task.dependencies.length > 1 ? "s" : ""}
            </div>
          )}

          <SubBar subs={task.subtasks} />
        </>
      )}

      {!compact && (
        <div className={`flex items-center justify-between mt-2 pt-2 border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
          <div className="flex items-center gap-2">
            {task.due_date && (
              <span className={`text-[0.62rem] font-medium ${late ? "text-red-400" : isDark ? "text-white/35" : "text-gray-400"}`}>
                {late && <AlertTriangle size={10} className="inline mr-0.5" />}{fmtDate(task.due_date)}
              </span>
            )}
            {elapsed > 0 && (
              <span className={`text-[0.58rem] ${running ? "text-green-400" : isDark ? "text-white/25" : "text-gray-400"}`}>
                {fmtSec(elapsed)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {task.assignees.slice(0, 3).map(a => <Av key={a} name={a} size={18} />)}
            {task.assignees.length > 3 && (
              <span className={`text-[0.58rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>+{task.assignees.length - 3}</span>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {hov && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute bottom-2 right-2 flex gap-1"
            onClick={e => e.stopPropagation()}>
            <button onClick={onTimer}
              className={`rounded-md px-1.5 py-0.5 text-[0.62rem] font-medium transition ${running
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : isDark ? "bg-white/5 text-white/40 hover:bg-violet-500/20 hover:text-violet-400"
                : "bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600"}`}>
              {running ? <><Square size={9}/> Stop</> : <><Play size={9}/> Timer</>}
            </button>
            {nextSt && (
              <button onClick={() => onMove(nextSt)}
                className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[0.62rem] transition ${isDark
                  ? "bg-white/5 text-white/40 hover:bg-blue-500/20 hover:text-blue-400"
                  : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"}`}>
                <ArrowRight size={9} /> {STAT[nextSt].label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AiPanel({ tasks, onClose, onAddTasks }: {
  tasks: Task[];
  onClose: () => void;
  onAddTasks: (generated: Array<{ title: string; priority: string; category: string; estimated_minutes: number; tags: string[]; subtasks: { title: string }[] }>) => void;
}) {
  const isDark = useDark();
  const [msg, setMsg]         = useState("");
  const [resp, setResp]       = useState("");
  const [loading, setLoading] = useState(false);
  const [genGoal, setGenGoal] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult]   = useState<Array<{ title: string; priority: string; category: string; estimated_minutes: number; tags: string[]; subtasks: { title: string }[] }>>([]);

  const ctx = `Productivité SaaS: ${tasks.length} tâches au total. Urgentes: ${tasks.filter(t => t.priority === "urgent").length}. En retard: ${tasks.filter(isLate).length}. En cours: ${tasks.filter(t => t.status === "in_progress").length}. En validation: ${tasks.filter(t => t.status === "validation").length}. Terminées: ${tasks.filter(t => t.status === "done").length}.`;

  async function ask(question: string) {
    setLoading(true); setResp("");
    try {
      const r = await fetch("/api/productivite/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map(t => ({
            title: t.title, status: t.status, priority: t.priority,
            category: t.category, due_date: t.due_date,
            is_recurring: t.is_recurring, time_spent: t.time_spent,
            estimated_minutes: t.estimated_minutes,
          })),
          question,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setResp(d.error ?? `Erreur ${r.status}`); return; }
      setResp(d.result ?? "");
    } catch { setResp("Erreur réseau"); }
    setLoading(false);
  }

  async function generateTasks() {
    if (!genGoal.trim()) return;
    setGenLoading(true); setGenResult([]);
    try {
      const r = await fetch("/api/productivite/generer-taches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: genGoal.trim(), count: 4 }),
      });
      const d = await r.json();
      if (!r.ok) { setResp(d.error ?? `Erreur ${r.status}`); return; }
      setGenResult(d.tasks ?? []);
    } catch { setResp("Erreur réseau"); }
    setGenLoading(false);
  }

  const QUICK = [
    { Icon: Zap,        l: "Tâches urgentes",  p: "Identifie et priorise les tâches critiques. Sois concis." },
    { Icon: ListChecks, l: "Planning optimal", p: "Propose un planning de travail optimisé pour aujourd'hui." },
    { Icon: Activity,   l: "Surcharge ?",      p: "Détecte les signaux de surcharge et propose des ajustements." },
    { Icon: Target,     l: "Réorganiser",      p: "Réorganise les priorités pour maximiser la productivité." },
  ];

  return (
    <motion.div initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
      transition={{ type: "spring", damping: 24, stiffness: 200 }}
      className={`fixed right-0 top-0 h-full w-[340px] border-l z-50 flex flex-col shadow-2xl ${isDark ? "bg-white/[0.04] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
      <div className={`flex items-center justify-between px-4 py-3.5 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full flex items-center justify-center"
            style={{ background: VIOLET + "30", border: `1px solid ${VIOLET}50` }}>
            <Sparkles size={11} style={{ color: VIOLET }} />
          </div>
          <span className={`text-sm font-semibold ${isDark ? "text-white/85" : "text-gray-900"}`}>IA Productivité</span>
        </div>
        <button onClick={onClose} className={`text-xl leading-none ${isDark ? "text-white/30 hover:text-white/70" : "text-gray-400 hover:text-gray-600"}`}>×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className={`text-[0.67rem] leading-relaxed ${isDark ? "text-white/30" : "text-gray-400"}`}>{ctx}</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK.map(q => (
            <button key={q.l} onClick={() => ask(q.p)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition hover:border-violet-500/40 hover:bg-violet-500/10 ${isDark ? "border-white/[0.06] bg-white/[0.04]" : "border-gray-200 bg-white hover:border-violet-400 hover:bg-violet-50"}`}>
              <q.Icon size={18} style={{ color: VIOLET }} />
              <span className={`text-[0.63rem] leading-tight ${isDark ? "text-white/55" : "text-gray-500"}`}>{q.l}</span>
            </button>
          ))}
        </div>
        {loading && (
          <div className={`flex items-center gap-2 text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>
            <Loader2 size={12} className="animate-spin" /> Analyse en cours…
          </div>
        )}
        {resp && (
          <div className={`rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs leading-relaxed whitespace-pre-wrap ${isDark ? "text-white/78" : "text-gray-700"}`}>
            {resp}
          </div>
        )}
      </div>

      {/* Générateur de tâches IA */}
      <div className={`border-t p-3 space-y-2 ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <p className={`text-[0.62rem] font-semibold uppercase tracking-wide ${isDark ? "text-white/25" : "text-gray-400"}`}>Générer des tâches</p>
        <div className="flex gap-1.5">
          <input value={genGoal} onChange={e => setGenGoal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") generateTasks(); }}
            placeholder="Objectif à décomposer…"
            className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none ${isDark ? "border-white/[0.08] bg-white/[0.06] text-white/75 placeholder:text-white/25" : "border-gray-200 bg-white text-gray-700 placeholder:text-gray-300"}`} />
          <button onClick={generateTasks} disabled={genLoading || !genGoal.trim()}
            className="rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-40 transition hover:opacity-90"
            style={{ background: VIOLET }}>
            {genLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          </button>
        </div>
        {genResult.length > 0 && (
          <div className="space-y-1">
            {genResult.map((t, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${isDark ? "border-white/6 bg-white/4" : "border-gray-200 bg-gray-50"}`}>
                <span className={`text-xs truncate flex-1 ${isDark ? "text-white/70" : "text-gray-700"}`}>{t.title}</span>
                <span className={`text-[0.55rem] mr-2 ${isDark ? "text-white/25" : "text-gray-400"}`}>{t.estimated_minutes}min</span>
              </div>
            ))}
            <button onClick={() => { onAddTasks(genResult); setGenResult([]); setGenGoal(""); }}
              className="w-full rounded-lg py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
              + Ajouter {genResult.length} tâche{genResult.length > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>

      <div className={`border-t p-3 flex gap-2 ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <input value={msg} onChange={e => setMsg(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { ask(msg.trim()); setMsg(""); } }}
          placeholder="Question libre sur vos tâches…"
          className={`flex-1 rounded-lg border px-3 py-2 text-xs outline-none ${isDark ? "border-white/[0.08] bg-white/[0.06] text-white/75 placeholder:text-white/25 hover:border-white/15" : "border-gray-200 bg-white text-gray-700 placeholder:text-gray-300 hover:border-gray-300"}`} />
        <button onClick={() => { if (msg.trim()) { ask(msg.trim()); setMsg(""); } }}
          className="rounded-lg px-3 py-2 text-sm text-white transition hover:opacity-90"
          style={{ background: VIOLET }}><ArrowRight size={13} /></button>
      </div>
    </motion.div>
  );
}

export default function ProductivitePage() {
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const { isDark } = useTheme();
  const router = useRouter();

  const [tasks,           setTasks]           = useState<Task[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [view,            setView]            = useState<View>("kanban");
  const [listTab,         setListTab]         = useState<LTab>("today");
  const [search,          setSearch]          = useState("");
  const [fprio,           setFprio]           = useState("");
  const [fcat,            setFcat]            = useState("");
  const [fstat,           setFstat]           = useState("");
  const [showAI,          setShowAI]          = useState(false);
  const [showModal,       setShowModal]       = useState(false);
  const [editId,          setEditId]          = useState<string | null>(null);
  const [form,            setForm]            = useState<Form>(BLANK);
  const [saving,          setSaving]          = useState(false);
  const [comments,        setComments]        = useState<Cmt[]>([]);
  const [cmt,             setCmt]             = useState("");
  const [cmtAuthor,       setCmtAuthor]       = useState("Moi");
  const [quickAdd,        setQuickAdd]        = useState<Record<string, string>>({});
  const [now,             setNow]             = useState(Date.now());
  const [newSub,          setNewSub]          = useState("");
  const [newTag,          setNewTag]          = useState("");
  const [newAssignee,     setNewAssignee]     = useState("");
  const [userId,          setUserId]          = useState<string | null>(null);
  const [orgId,           setOrgId]           = useState<string | null>(null);
  const [orgMembers,      setOrgMembers]      = useState<{ id: string; user_id: string; display: string }[]>([]);
  const [orgMode,         setOrgMode]         = useState(false);
  const [dragId,          setDragId]          = useState<string | null>(null);
  const [dragOverCol,     setDragOverCol]     = useState<Status | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);
  const [showTemplates,   setShowTemplates]   = useState(false);
  const [depSearch,       setDepSearch]       = useState("");
  const [kanbanCompact,   setKanbanCompact]   = useState(false);
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set());
  const [ftag,            setFtag]            = useState("");
  const [fassignee,       setFassignee]       = useState("");
  // ERP link entities (Phase 5)
  const [erpDocs,      setErpDocs]      = useState<{ id: string; label: string }[]>([]);
  const [erpContacts,  setErpContacts]  = useState<{ id: string; label: string }[]>([]);
  const [erpProjects,  setErpProjects]  = useState<{ id: string; label: string }[]>([]);
  const [erpContracts, setErpContracts] = useState<{ id: string; label: string }[]>([]);
  const [erpSuppliers, setErpSuppliers] = useState<{ id: string; label: string }[]>([]);
  const [erpProducts,  setErpProducts]  = useState<{ id: string; label: string }[]>([]);
  // Templates persistants DB (Phase 6)
  const [dbTemplates,    setDbTemplates]    = useState<DbTemplate[]>([]);
  const [tplTab,         setTplTab]         = useState<"builtin" | "saved">("builtin");
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);


  const load = useCallback(async (uid?: string | null, oid?: string | null) => {
    const resolvedUid = uid ?? userId;
    const resolvedOid = oid ?? orgId;
    if (!resolvedUid) return;
    setLoading(true);
    let q = supabase.from("productivity_tasks").select("*");
    if (resolvedOid && orgMode) {
      q = q.eq("organization_id", resolvedOid);
    } else {
      q = q.eq("user_id", resolvedUid);
    }
    const { data, error } = await q
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast(error.message, "error");
    else setTasks((data ?? []).map((r: Record<string, unknown>) => parseTask(r)));
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, orgId, orgMode]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }
        setUserId(user.id);
        // Charger l'organisation primaire de l'utilisateur (si elle existe)
        const { data: memData } = await supabase
          .from("organization_members")
          .select("organization_id, role, organizations(name)")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: true })
          .limit(5);
        if (memData && memData.length > 0) {
          const primaryOrg = memData[0];
          setOrgId(primaryOrg.organization_id as string);
          // Charger les membres de l'organisation pour les sélecteurs d'assignation
          const { data: membersData } = await supabase
            .from("organization_members")
            .select("id, user_id, role")
            .eq("organization_id", primaryOrg.organization_id);
          if (membersData) {
            setOrgMembers(membersData.map(m => ({
              id: m.id as string,
              user_id: m.user_id as string,
              display: (m.user_id as string) === user.id ? "Moi" : `Membre (${(m.role as string)})`,
            })));
          }
        }
        await load(user.id);
      } catch {
        toast("Erreur réseau — impossible de charger les tâches", "error");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = (defaultStatus?: Status) => {
    setForm({ ...BLANK, status: defaultStatus ?? "todo" });
    setEditId(null); setComments([]); setShowModal(true);
    loadErpEntities();
  };

  const openEdit = (t: Task) => {
    setForm({
      title: t.title, description: t.description, priority: t.priority,
      status: t.status, category: t.category, due_date: t.due_date,
      due_time: t.due_time, responsible: t.responsible,
      assignees: [...t.assignees], subtasks: [...t.subtasks], tags: [...t.tags],
      estimated_minutes: t.estimated_minutes, time_spent: t.time_spent,
      timer_started_at: t.timer_started_at, is_recurring: t.is_recurring,
      recurrence: t.recurrence, linked_module: t.linked_module,
      dependencies: [...t.dependencies], sort_order: t.sort_order,
      linked_document_id: t.linked_document_id, linked_contact_id: t.linked_contact_id,
      linked_project_id: t.linked_project_id, linked_contract_id: t.linked_contract_id,
      linked_supplier_id: t.linked_supplier_id, linked_product_id: t.linked_product_id,
      recurrence_parent_id: t.recurrence_parent_id,
    });
    setEditId(t.id); setShowModal(true);
    loadComments(t.id);
    loadErpEntities();
  };

  const loadComments = async (taskId: string) => {
    const { data } = await supabase
      .from("task_comments").select("*").eq("task_id", taskId).order("created_at");
    setComments((data ?? []) as Cmt[]);
  };

  const loadErpEntities = useCallback(async () => {
    if (!userId) return;
    const [docs, contacts, projects, contracts, suppliers, products] = await Promise.all([
      supabase.from("documents").select("id, number, type").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("crm_contacts").select("id, name, company").eq("user_id", userId).order("name").limit(50),
      supabase.from("projects").select("id, title").eq("user_id", userId).order("title").limit(50),
      supabase.from("contracts").select("id, title").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("stock_suppliers").select("id, name").eq("user_id", userId).order("name").limit(50),
      supabase.from("stock_products").select("id, name").eq("user_id", userId).order("name").limit(50),
    ]);
    setErpDocs((docs.data ?? []).map((d: Record<string, unknown>) => ({ id: String(d.id), label: `${d.type ?? ""} ${d.number ?? ""}`.trim() || String(d.id) })));
    setErpContacts((contacts.data ?? []).map((c: Record<string, unknown>) => ({ id: String(c.id), label: c.company ? `${c.name} (${c.company})` : String(c.name ?? c.id) })));
    setErpProjects((projects.data ?? []).map((p: Record<string, unknown>) => ({ id: String(p.id), label: String(p.title ?? p.id) })));
    setErpContracts((contracts.data ?? []).map((c: Record<string, unknown>) => ({ id: String(c.id), label: String(c.title ?? c.id) })));
    setErpSuppliers((suppliers.data ?? []).map((s: Record<string, unknown>) => ({ id: String(s.id), label: String(s.name ?? s.id) })));
    setErpProducts((products.data ?? []).map((p: Record<string, unknown>) => ({ id: String(p.id), label: String(p.name ?? p.id) })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadDbTemplates = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("productivity_templates").select("*").order("name");
    if (data) setDbTemplates(data.map((r: Record<string, unknown>) => ({
      id: String(r.id), name: String(r.name ?? ""), description: String(r.description ?? ""),
      icon: String(r.icon ?? ""), color: String(r.color ?? "#8b5cf6"),
      priority: String(r.priority ?? "normal"), category: String(r.category ?? ""),
      estimated_minutes: Number(r.estimated_minutes ?? 30),
      tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
      subtasks: Array.isArray(r.subtasks) ? r.subtasks as Sub[] : [],
      recurrence: String(r.recurrence ?? "none"),
      is_recurring: Boolean(r.is_recurring), is_shared: Boolean(r.is_shared),
      created_at: String(r.created_at ?? ""),
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveCurrentAsTemplate = async () => {
    if (!form.title.trim() || !userId) return;
    setSavingTemplate(true);
    const { error } = await supabase.from("productivity_templates").insert({
      user_id: userId,
      name: form.title.trim(),
      description: form.description || "",
      priority: form.priority, category: form.category,
      estimated_minutes: form.estimated_minutes,
      tags: form.tags, subtasks: form.subtasks,
      recurrence: form.recurrence, is_recurring: form.is_recurring,
    });
    setSavingTemplate(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Template sauvegardé");
    await loadDbTemplates();
  };

  const deleteDbTemplate = async (id: string) => {
    const { error } = await supabase.from("productivity_templates").delete().eq("id", id).eq("user_id", userId!);
    if (error) { toast(error.message, "error"); return; }
    setDbTemplates(ts => ts.filter(t => t.id !== id));
    toast("Template supprimé", "info");
  };

  const addGeneratedTasks = async (generated: Array<{ title: string; priority: string; category: string; estimated_minutes: number; tags: string[]; subtasks: { title: string }[] }>) => {
    if (!userId) return;
    const insertions = generated.map(t => ({
      user_id: userId,
      title: t.title, priority: t.priority, category: t.category,
      estimated_minutes: t.estimated_minutes, tags: t.tags,
      subtasks: JSON.stringify(t.subtasks.map(s => ({ id: crypto.randomUUID(), title: s.title, done: false }))),
      status: "todo", dependencies: [], sort_order: 0,
    }));
    const { error } = await supabase.from("productivity_tasks").insert(insertions);
    if (error) { toast(error.message, "error"); return; }
    toast(`${insertions.length} tâche${insertions.length > 1 ? "s" : ""} ajoutée${insertions.length > 1 ? "s" : ""}`);
    await load();
  };

  const applyDbTemplate = (tpl: DbTemplate) => {
    setForm(f => ({
      ...f,
      title: tpl.name, description: tpl.description,
      priority: tpl.priority as Priority, category: tpl.category,
      estimated_minutes: tpl.estimated_minutes, tags: [...tpl.tags],
      subtasks: tpl.subtasks.map(s => ({ ...s, id: crypto.randomUUID(), done: false })),
      recurrence: tpl.recurrence, is_recurring: tpl.is_recurring,
    }));
    setShowTemplates(false); setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast("Le titre est requis", "error"); return; }
    if (!userId) { toast("Session expirée — rechargez la page", "error"); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(), description: form.description,
      priority: form.priority, status: form.status, category: form.category,
      due_date: form.due_date || null, due_time: form.due_time,
      responsible: form.responsible, assignees: form.assignees,
      subtasks: JSON.stringify(form.subtasks), tags: form.tags,
      estimated_minutes: form.estimated_minutes, time_spent: form.time_spent,
      timer_started_at: form.timer_started_at,
      is_recurring: form.is_recurring, recurrence: form.recurrence,
      linked_module: form.linked_module, dependencies: form.dependencies,
      linked_document_id: form.linked_document_id || null,
      linked_contact_id:  form.linked_contact_id  || null,
      linked_project_id:  form.linked_project_id  || null,
      linked_contract_id: form.linked_contract_id || null,
      linked_supplier_id: form.linked_supplier_id || null,
      linked_product_id:  form.linked_product_id  || null,
      recurrence_parent_id: form.recurrence_parent_id || null,
    };
    if (editId) {
      const { error } = await supabase.from("productivity_tasks").update(payload).eq("id", editId).eq("user_id", userId!);
      if (error) toast(error.message, "error");
      else { toast("Tâche mise à jour"); await load(); }
    } else {
      const { error } = await supabase.from("productivity_tasks").insert({ ...payload, user_id: userId });
      if (error) toast(error.message, "error");
      else { toast("Tâche créée"); setShowModal(false); await load(); }
    }
    setSaving(false);
  };

  const del = () => {
    if (!editId) return;
    setConfirmDeleteId(editId);
  };

  const exportCSV = useCallback(() => {
    const rows = [
      ["Titre", "Statut", "Priorité", "Catégorie", "Date limite", "Responsable", "Sous-tâches"].join(";"),
      ...tasks.map(t => [
        t.title, STAT[t.status].label, PRIO[t.priority].label, t.category ?? "", t.due_date ?? "", t.responsible ?? "",
        `${t.subtasks.filter((s: { done: boolean }) => s.done).length}/${t.subtasks.length}`,
      ].join(";")),
    ];
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "taches.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [tasks]);

  const confirmDel = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("productivity_tasks").delete().eq("id", confirmDeleteId).eq("user_id", userId!);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (error) { toast(error.message, "error"); return; }
    toast("Tâche supprimée", "info");
    setShowModal(false);
    await load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmDeleteId, toast, load]);

  const changeStatus = async (id: string, status: Status) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    const { error } = await supabase.from("productivity_tasks").update({ status }).eq("id", id).eq("user_id", userId!);
    if (error) {
      setTasks(ts => ts.map(t => t.id === id ? { ...t } : t));
      toast("Erreur mise à jour statut", "error");
    }
  };

  const dropOnCol = async (colStatus: Status) => {
    if (!dragId) return;
    setDragOverCol(null);
    const task = tasks.find(t => t.id === dragId);
    if (!task || task.status === colStatus) { setDragId(null); return; }
    const colTasks = tasks.filter(t => t.status === colStatus);
    const newOrder = colTasks.length > 0 ? Math.max(...colTasks.map(t => t.sort_order)) + 1 : 0;
    setTasks(ts => ts.map(t => t.id === dragId ? { ...t, status: colStatus, sort_order: newOrder } : t));
    await supabase.from("productivity_tasks")
      .update({ status: colStatus, sort_order: newOrder })
      .eq("id", dragId).eq("user_id", userId!);
    setDragId(null);
  };

  const dropBeforeTask = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setDragOverCol(null);
    const target = tasks.find(t => t.id === targetId);
    if (!target) { setDragId(null); return; }
    const colStatus = target.status;
    const colTasks = tasks.filter(t => t.status === colStatus && t.id !== dragId)
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = colTasks.findIndex(t => t.id === targetId);
    const newOrder = idx === 0
      ? (colTasks[0]?.sort_order ?? 0) - 1
      : ((colTasks[idx - 1]?.sort_order ?? 0) + (colTasks[idx]?.sort_order ?? 0)) / 2;
    setTasks(ts => ts.map(t => t.id === dragId ? { ...t, status: colStatus, sort_order: newOrder } : t));
    await supabase.from("productivity_tasks")
      .update({ status: colStatus, sort_order: newOrder })
      .eq("id", dragId).eq("user_id", userId!);
    setDragId(null);
  };

  const toggleTimer = async (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const update = t.timer_started_at
      ? { timer_started_at: null, time_spent: t.time_spent + Math.floor((Date.now() - new Date(t.timer_started_at).getTime()) / 1000) }
      : { timer_started_at: new Date().toISOString(), time_spent: t.time_spent };
    setTasks(ts => ts.map(x => x.id === id ? { ...x, ...update } : x));
    const { error } = await supabase.from("productivity_tasks").update(update).eq("id", id).eq("user_id", userId!);
    if (error) toast("Erreur timer", "error");
  };

  const quickAddTask = async (status: Status) => {
    const title = (quickAdd[status] ?? "").trim();
    if (!title || !userId) return;
    const { data, error } = await supabase
      .from("productivity_tasks")
      .insert({ title, status, priority: "normal", subtasks: "[]", user_id: userId })
      .select().single();
    if (error) toast(error.message, "error");
    else if (data) setTasks(ts => [parseTask(data as Record<string, unknown>), ...ts]);
    setQuickAdd(q => ({ ...q, [status]: "" }));
  };

  const addComment = async () => {
    if (!cmt.trim() || !editId) return;
    const { data, error } = await supabase
      .from("task_comments")
      .insert({ task_id: editId, user_id: userId, author_name: cmtAuthor, content: cmt.trim() })
      .select().single();
    if (error) toast(error.message, "error");
    else if (data) { setComments(cs => [...cs, data as Cmt]); setCmt(""); }
  };

  const addSub = () => {
    if (!newSub.trim()) return;
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { id: crypto.randomUUID(), title: newSub.trim(), done: false }] }));
    setNewSub("");
  };
  const toggleSub = (sid: string) =>
    setForm(f => ({ ...f, subtasks: f.subtasks.map(s => s.id === sid ? { ...s, done: !s.done } : s) }));
  const removeSub = (sid: string) =>
    setForm(f => ({ ...f, subtasks: f.subtasks.filter(s => s.id !== sid) }));

  const addTag = () => {
    if (!newTag.trim() || form.tags.includes(newTag.trim())) return;
    setForm(f => ({ ...f, tags: [...f.tags, newTag.trim()] }));
    setNewTag("");
  };
  const addAssignee = () => {
    if (!newAssignee.trim() || form.assignees.includes(newAssignee.trim())) return;
    setForm(f => ({ ...f, assignees: [...f.assignees, newAssignee.trim()] }));
    setNewAssignee("");
  };

  const applyTemplate = (tpl: typeof TASK_TEMPLATES[0]) => {
    setForm(f => ({ ...f, ...tpl.form }));
    setShowTemplates(false);
    setShowModal(true);
  };

  const toggleDependency = (taskId: string) => {
    setForm(f => ({
      ...f,
      dependencies: f.dependencies.includes(taskId)
        ? f.dependencies.filter(d => d !== taskId)
        : [...f.dependencies, taskId],
    }));
  };

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (fprio  && t.priority !== fprio) return false;
    if (fcat   && t.category !== fcat)  return false;
    if (fstat  && t.status   !== fstat) return false;
    if (ftag   && !t.tags.includes(ftag)) return false;
    if (fassignee && !t.assignees.includes(fassignee)) return false;
    return true;
  });

  const today   = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const listTasks: Record<LTab, Task[]> = {
    today: filtered.filter(t => t.due_date === today && t.status !== "done"),
    week:  filtered.filter(t => t.due_date >= today && t.due_date <= weekEnd && t.status !== "done"),
    late:  filtered.filter(isLate),
    done:  filtered.filter(t => t.status === "done"),
  };

  const kpis = [
    { l: "Total",      v: tasks.length,                                          col: "#6b7280" },
    { l: "En cours",   v: tasks.filter(t => t.status === "in_progress").length,  col: "#3b82f6" },
    { l: "Validation", v: tasks.filter(t => t.status === "validation").length,   col: "#f59e0b" },
    { l: "En retard",  v: tasks.filter(isLate).length,                           col: "#ef4444" },
    { l: "Terminées",  v: tasks.filter(t => t.status === "done").length,         col: "#10b981" },
  ];

  const completionRate = tasks.length
    ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100)
    : 0;

  return (
    <DarkCtx.Provider value={isDark}>
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#07080e] text-white" : "bg-gray-50 text-gray-900"}`}>

      {/* ── Animated header ── */}
      <div className="relative overflow-hidden shrink-0 sticky top-0 z-10"
        style={{
          background: isDark ? "#07080e" : "#ffffff",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e5e7eb",
        }}>
        {/* Orbs */}
        {isDark && (
          <div className="pointer-events-none">
            <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#c9a55a,transparent)" }}/>
            <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#8b5cf6,transparent)" }}/>
          </div>
        )}

        {/* Main row */}
        <div className="relative px-5 pt-4 pb-3 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
                <ModuleHeaderIcon icon={Zap} color="#be185d" />
              </motion.div>
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}>
                <h1 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Productivité</h1>
                <p className={`text-[0.62rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>{completionRate}% de complétion · {tasks.filter(isLate).length} en retard</p>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              {view === "kanban" && (
                <button onClick={() => setKanbanCompact(c => !c)} title="Mode compact"
                  className={`h-8 flex items-center gap-1.5 px-3 rounded-xl border transition-all ${kanbanCompact
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                    : isDark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04]" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                  <BarChart3 size={13}/>
                  <span className="hidden sm:inline text-xs font-semibold">Compact</span>
                </button>
              )}
              <button onClick={exportCSV} title="Exporter CSV"
                className={`h-8 flex items-center gap-1.5 px-3 rounded-xl border transition-all ${isDark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04]" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                <Download size={13}/>
                <span className="hidden sm:inline text-xs font-semibold">Exporter</span>
              </button>
              <button onClick={() => setShowAI(s => !s)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${showAI
                  ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                  : isDark ? "border-white/8 text-white/50 hover:border-violet-500/30 hover:text-violet-300"
                  : "border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600"}`}>
                <Sparkles size={13}/><span className="hidden sm:inline"> IA</span>
              </button>
              <button onClick={() => setShowTemplates(s => !s)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${showTemplates
                  ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                  : isDark ? "border-white/8 text-white/50 hover:border-amber-500/30 hover:text-amber-300"
                  : "border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"}`}>
                <LayoutTemplate size={13}/><span className="hidden sm:inline"> Templates</span>
              </button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => openNew()}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a", boxShadow: "0 4px 16px rgba(201,165,90,0.35)" }}>
                <Plus size={13}/> Nouvelle tâche
              </motion.button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="relative px-5 pb-2 sm:px-8">
          <div className="mx-auto max-w-7xl space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Total",     value: tasks.length,                                         icon: ListChecks, onClick: () => { setView("list"); setFprio(""); setFcat(""); setFstat(""); } },
                { label: "En cours",  value: tasks.filter(t => t.status === "in_progress").length,  icon: Activity,   onClick: () => { setView("list"); setFstat("in_progress"); } },
                { label: "En retard", value: tasks.filter(isLate).length,                           icon: AlertTriangle, onClick: () => { setView("list"); setListTab("late"); } },
                { label: "Terminées", value: tasks.filter(t => t.status === "done").length,         icon: Target,     onClick: () => { setView("list"); setFstat("done"); } },
              ].map((kpi, i) => {
                const KpiIcon = kpi.icon;
                return (
                  <motion.button key={kpi.label} onClick={kpi.onClick}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-all ${isDark ? "border-white/6 bg-white/4 hover:border-white/15" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <KpiIcon size={13} style={{ color: "#c9a55a" }} className="shrink-0"/>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-none ${isDark ? "text-white" : "text-gray-900"}`}>{kpi.value}</p>
                      <p className={`text-[0.58rem] uppercase tracking-wide mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{kpi.label}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            {/* Completion bar */}
            <div className="flex items-center gap-3">
              <div className={`flex-1 h-1 rounded-full overflow-hidden ${isDark ? "bg-white/6" : "bg-gray-200"}`}>
                <motion.div className="h-full rounded-full" style={{ background: "#c9a55a" }}
                  initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 0.8 }} />
              </div>
              <span className={`text-[0.58rem] shrink-0 ${isDark ? "text-white/35" : "text-gray-400"}`}>{completionRate}% terminé</span>
            </div>
          </div>
        </div>

        {/* View tabs */}
        <div className="relative px-5 sm:px-8 flex gap-0.5">
          {(["kanban", "list"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${view === v
                ? isDark ? "text-white" : "text-gray-900"
                : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}>
              {v === "kanban" ? "⊞ Kanban" : "☰ Liste"}
              {view === v && (
                <motion.div layoutId="prod-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "#c9a55a" }}/>
              )}
            </button>
          ))}
        </div>

        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" }}/>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] px-5 py-4 space-y-4">

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Rechercher une tâche…"
              className={`rounded-xl border px-3 py-2 text-sm outline-none w-52 transition ${isDark
                ? "border-white/8 bg-white/6 text-white/70 placeholder:text-white/25 hover:border-white/15 focus:border-violet-500/40 [color-scheme:dark]"
                : "border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-300"}`} />

            <select value={fprio} onChange={e => setFprio(e.target.value)}
              className="rounded-lg py-1.5 pl-3 pr-8 text-sm outline-none appearance-none transition"
              style={selStyle(isDark)}>
              <option value="">Toutes priorités</option>
              {(Object.keys(PRIO) as Priority[]).map(p => (
                <option key={p} value={p}>{PRIO[p].label}</option>
              ))}
            </select>

            <select value={fcat} onChange={e => setFcat(e.target.value)}
              className="rounded-lg py-1.5 pl-3 pr-8 text-sm outline-none appearance-none transition"
              style={selStyle(isDark)}>
              <option value="">Toutes catégories</option>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={fstat} onChange={e => setFstat(e.target.value)}
              className="rounded-lg py-1.5 pl-3 pr-8 text-sm outline-none appearance-none transition"
              style={selStyle(isDark)}>
              <option value="">Tous statuts</option>
              {(Object.keys(STAT) as Status[]).map(s => (
                <option key={s} value={s}>{STAT[s].label}</option>
              ))}
            </select>

            {/* Filtre tag */}
            {(() => {
              const allTags = [...new Set(tasks.flatMap(t => t.tags))].sort();
              return allTags.length > 0 ? (
                <select value={ftag} onChange={e => setFtag(e.target.value)}
                  className="rounded-lg py-1.5 pl-3 pr-8 text-sm outline-none appearance-none transition"
                  style={selStyle(isDark)}>
                  <option value="">Tous tags</option>
                  {allTags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
                </select>
              ) : null;
            })()}

            {/* Filtre assignee (texte libre) */}
            {(() => {
              const allAssignees = [...new Set(tasks.flatMap(t => t.assignees))].sort();
              return allAssignees.length > 0 ? (
                <select value={fassignee} onChange={e => setFassignee(e.target.value)}
                  className="rounded-lg py-1.5 pl-3 pr-8 text-sm outline-none appearance-none transition"
                  style={selStyle(isDark)}>
                  <option value="">Tous assignés</option>
                  {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              ) : null;
            })()}

            {(search || fprio || fcat || fstat || ftag || fassignee) && (
              <button onClick={() => { setSearch(""); setFprio(""); setFcat(""); setFstat(""); setFtag(""); setFassignee(""); }}
                className={`rounded-xl border px-3 py-2 text-xs transition ${isDark
                  ? "border-white/8 text-white/40 hover:text-white/70"
                  : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
                ✕ Réinitialiser
              </button>
            )}
            {orgId && (
              <button onClick={() => { setOrgMode(m => !m); load(userId, orgId); }}
                className={`ml-auto rounded-xl border px-3 py-2 text-xs font-medium transition ${orgMode
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-300"
                  : isDark ? "border-white/8 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                {orgMode ? "👥 Organisation" : "👤 Personnel"}
              </button>
            )}
          </div>

          {/* Barre d'actions groupées (uniquement en vue liste) */}
          {view === "list" && selectedIds.size > 0 && (
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${isDark ? "border-violet-500/30 bg-violet-500/10" : "border-violet-300 bg-violet-50"}`}>
              <span className={`text-xs font-semibold ${isDark ? "text-violet-300" : "text-violet-700"}`}>{selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}</span>
              <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(STAT) as Status[]).map(s => (
                  <button key={s} onClick={async () => {
                    const ids = [...selectedIds];
                    setTasks(ts => ts.map(t => selectedIds.has(t.id) ? { ...t, status: s } : t));
                    await Promise.all(ids.map(id => supabase.from("productivity_tasks").update({ status: s }).eq("id", id).eq("user_id", userId!)));
                    setSelectedIds(new Set());
                  }}
                  className="rounded-lg px-2 py-1 text-[0.68rem] border transition"
                  style={{ color: STAT[s].col, borderColor: STAT[s].col + "40", background: STAT[s].col + "15" }}>
                    → {STAT[s].label}
                  </button>
                ))}
                <button onClick={async () => {
                  const ids = [...selectedIds];
                  if (!confirm(`Supprimer ${ids.length} tâche(s) ?`)) return;
                  setTasks(ts => ts.filter(t => !selectedIds.has(t.id)));
                  await Promise.all(ids.map(id => supabase.from("productivity_tasks").delete().eq("id", id).eq("user_id", userId!)));
                  setSelectedIds(new Set());
                }}
                className={`rounded-lg px-2 py-1 text-[0.68rem] border transition ${isDark ? "border-red-500/30 text-red-400 hover:bg-red-500/15" : "border-red-300 text-red-600 hover:bg-red-50"}`}>
                  🗑 Supprimer
                </button>
                <button onClick={() => setSelectedIds(new Set())} className={`text-[0.68rem] ${isDark ? "text-white/40" : "text-gray-400"}`}>✕ Désélectionner</button>
              </div>
            </div>
          )}

                {view === "kanban" && (
          <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-4 gap-4" style={{ minHeight: "60vh", minWidth: "640px" }}>
            {KANBAN_COLS.map(col => {
              const colTasks = filtered
                .filter(t => t.status === col.key)
                .sort((a, b) => a.sort_order - b.sort_order || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              const isDropTarget = dragId && dragOverCol === col.key;
              return (
                <div key={col.key}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(col.key); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={e => { e.preventDefault(); dropOnCol(col.key); }}
                  className={`flex flex-col rounded-2xl border overflow-hidden transition-colors ${isDropTarget ? isDark ? "border-violet-500/50 bg-violet-500/5" : "border-violet-300 bg-violet-50/40" : isDark ? "border-white/6 bg-white/4" : "border-gray-200 bg-white"}`}>

                  <div className={`px-4 py-3 border-b ${isDark ? "border-white/6" : "border-gray-200"}`}
                    style={{ borderTop: `3px solid ${col.col}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: col.col }}>
                          {STAT[col.key].label}
                        </span>
                        <span className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold"
                          style={{ background: col.col + "22", color: col.col }}>
                          {colTasks.length}
                        </span>
                      </div>
                      <button onClick={() => openNew(col.key)}
                        className={`text-lg leading-none transition ${isDark ? "text-white/30 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}>
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5"
                    style={{ maxHeight: "calc(100vh - 360px)" }}>
                    {loading && colTasks.length === 0 ? (
                      <div className="flex flex-col items-center py-8 gap-2">
                        <span className={`animate-pulse text-xs ${isDark ? "text-white/20" : "text-gray-400"}`}>Chargement…</span>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {colTasks.map(t => (
                          <TaskCard key={t.id} task={t} now={now}
                            onEdit={() => openEdit(t)}
                            onMove={s => changeStatus(t.id, s)}
                            onTimer={() => toggleTimer(t.id)}
                            onDragStart={() => setDragId(t.id)}
                            onDropBefore={() => dropBeforeTask(t.id)}
                            isDragging={dragId === t.id}
                            compact={kanbanCompact} />
                        ))}
                      </AnimatePresence>
                    )}
                    {!loading && colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="text-3xl mb-2" style={{ color: col.col, opacity: isDark ? 0.2 : 0.35 }}>○</span>
                        <p className={`text-[0.68rem] ${isDark ? "text-white/20" : "text-gray-400"}`}>Aucune tâche</p>
                      </div>
                    )}
                  </div>

                  <div className={`border-t p-2.5 ${isDark ? "border-white/5" : "border-gray-100"}`}>
                    <div className="flex gap-1">
                      <input
                        value={quickAdd[col.key] ?? ""}
                        onChange={e => setQuickAdd(q => ({ ...q, [col.key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") quickAddTask(col.key); }}
                        placeholder="+ Ajouter rapidement…"
                        className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none transition ${isDark
                          ? "bg-white/4 border-white/5 text-white/60 placeholder:text-white/20 focus:border-white/10 hover:border-white/8"
                          : "bg-gray-50 border-gray-200 text-gray-600 placeholder:text-gray-400 focus:border-gray-300"}`} />
                      <button onClick={() => quickAddTask(col.key)}
                        className={`rounded-lg px-2 py-1.5 text-xs transition ${isDark ? "text-white/40 hover:text-white/80 hover:bg-white/5" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
                        <CornerDownLeft size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

                {view === "list" && (
          <div className="space-y-4">
            <div className={`flex gap-1 rounded-xl border p-1 w-fit ${isDark ? "border-white/6 bg-white/4" : "border-gray-200 bg-gray-100"}`}>
              {([
                { k: "today", l: "Aujourd'hui", n: listTasks.today.length },
                { k: "week",  l: "Cette semaine", n: listTasks.week.length },
                { k: "late",  l: "En retard",   n: listTasks.late.length },
                { k: "done",  l: "Terminées",   n: listTasks.done.length },
              ] as { k: LTab; l: string; n: number }[]).map(tab => (
                <button key={tab.k} onClick={() => setListTab(tab.k)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition ${listTab === tab.k
                    ? isDark ? "text-white" : "bg-white text-gray-900 shadow-sm"
                    : isDark ? "text-white/40 hover:text-white/70" : "text-gray-500 hover:text-gray-700"}`}
                  style={listTab === tab.k && isDark ? { background: VIOLET + "25" } : {}}>
                  {tab.l}
                  {tab.n > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold ${tab.k === "late" ? "bg-red-500/20 text-red-400" : isDark ? "bg-white/10 text-white/50" : "bg-gray-200 text-gray-500"}`}>
                      {tab.n}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {listTasks[listTab].map(t => (
                  <motion.div key={t.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    onClick={() => openEdit(t)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition ${selectedIds.has(t.id) ? isDark ? "border-violet-500/50 bg-violet-500/8" : "border-violet-300 bg-violet-50" : isDark
                      ? "border-white/6 bg-white/4 hover:border-white/15 hover:bg-white/6"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"}`}
                    style={{ borderLeft: `3px solid ${PRIO[t.priority].color}` }}>
                    {/* Checkbox sélection groupée */}
                    <input type="checkbox" checked={selectedIds.has(t.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(t.id) : next.delete(t.id);
                          return next;
                        });
                      }}
                      className="h-3.5 w-3.5 rounded accent-violet-500 shrink-0 cursor-pointer" />

                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: STAT[t.status].col }} />

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{t.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {t.category && <span className={`text-[0.6rem] ${isDark ? "text-violet-400/70" : "text-violet-500"}`}>{t.category}</span>}
                        {t.due_date && (
                          <span className={`text-[0.6rem] ${isLate(t) ? "text-red-400" : isDark ? "text-white/30" : "text-gray-400"}`}>
                            {isLate(t) && "⚠ "}{fmtDate(t.due_date)}
                          </span>
                        )}
                        {t.subtasks.length > 0 && <SubBar subs={t.subtasks} />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <PBadge p={t.priority} />
                      <span className="text-[0.65rem] px-2 py-0.5 rounded-full border"
                        style={{ color: STAT[t.status].col, borderColor: STAT[t.status].col + "40", background: STAT[t.status].col + "15" }}>
                        {STAT[t.status].label}
                      </span>
                      {t.assignees.slice(0, 3).map(a => <Av key={a} name={a} size={20} />)}
                      {totalSec(t, now) > 0 && (
                        <span className={`text-[0.62rem] ${t.timer_started_at ? "text-green-400" : isDark ? "text-white/30" : "text-gray-400"}`}>
                          {fmtSec(totalSec(t, now))}
                        </span>
                      )}
                      <button onClick={e => { e.stopPropagation(); toggleTimer(t.id); }}
                        className={`rounded-lg px-2 py-1 text-[0.62rem] transition ${t.timer_started_at
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : isDark ? "bg-white/5 text-white/35 hover:bg-violet-500/15 hover:text-violet-400"
                          : "bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600"}`}>
                        {t.timer_started_at ? <Square size={10}/> : <Play size={10}/>}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {listTasks[listTab].length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <FileText size={40} className={`mb-3 ${isDark ? "text-white/15" : "text-gray-300"}`}/>
                  <p className={`text-sm ${isDark ? "text-white/25" : "text-gray-400"}`}>Aucune tâche dans cette vue</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-center pt-6 pb-6 px-4 overflow-y-auto"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl ${isDark ? "border-white/8 bg-[#0e1420]" : "border-gray-200 bg-white"}`}
              onClick={e => e.stopPropagation()}>

              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/8" : "border-gray-200"}`}>
                <h2 className={`text-base font-semibold ${isDark ? "text-white/88" : "text-gray-900"}`}>
                  {editId ? "Modifier la tâche" : "Nouvelle tâche"}
                </h2>
                <div className="flex items-center gap-2">
                  {editId && (
                    <button onClick={del}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition">
                      Supprimer
                    </button>
                  )}
                  <button onClick={() => setShowModal(false)}
                    className={`text-xl leading-none transition ${isDark ? "text-white/30 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}>×</button>
                </div>
              </div>

              <div className="p-6 space-y-5">

                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Titre de la tâche *"
                  className={`w-full rounded-xl border px-4 py-3 text-base font-medium outline-none focus:border-violet-500/50 transition ${isDark ? "border-white/8 bg-white/6 text-white/90 placeholder:text-white/25" : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"}`} />

                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optionnel)…" rows={3}
                  className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition ${isDark ? "border-white/8 bg-white/6 text-white/75 placeholder:text-white/25 focus:border-white/15" : "border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:border-gray-300"}`} />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Priorité</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                      className="rounded-lg border py-1.5 pl-3 pr-8 text-sm outline-none appearance-none w-full transition"
                      style={selStyle(isDark)}>
                      {(Object.keys(PRIO) as Priority[]).map(p => (
                        <option key={p} value={p}>{PRIO[p].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Statut</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
                      className="rounded-lg border py-1.5 pl-3 pr-8 text-sm outline-none appearance-none w-full transition"
                      style={selStyle(isDark)}>
                      {(Object.keys(STAT) as Status[]).map(s => (
                        <option key={s} value={s}>{STAT[s].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Catégorie</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="rounded-lg border py-1.5 pl-3 pr-8 text-sm outline-none appearance-none w-full transition"
                      style={selStyle(isDark)}>
                      <option value="">Sans catégorie</option>
                      {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Date limite</label>
                    <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className="rounded-lg border py-1.5 pl-3 pr-2 text-sm outline-none w-full transition"
                      style={selStyle(isDark)} />
                  </div>
                  <div>
                    <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Heure</label>
                    <input type="time" value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))}
                      className="rounded-lg border py-1.5 pl-3 pr-2 text-sm outline-none w-full transition"
                      style={selStyle(isDark)} />
                  </div>
                  <div>
                    <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Durée estimée (min)</label>
                    <input type="number" value={form.estimated_minutes} min={5} step={5}
                      onChange={e => setForm(f => ({ ...f, estimated_minutes: Number(e.target.value) }))}
                      className="rounded-lg border py-1.5 pl-3 pr-2 text-sm outline-none w-full transition"
                      style={selStyle(isDark)} />
                  </div>
                </div>

                <div>
                  <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Responsable</label>
                  <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                    placeholder="Nom du responsable"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${isDark ? "border-white/8 bg-white/6 text-white/75 placeholder:text-white/25 focus:border-white/15" : "border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:border-gray-300"}`} />
                </div>

                <div>
                  <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Collaborateurs</label>
                  {form.assignees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.assignees.map(a => (
                        <span key={a} className={`flex items-center gap-1.5 rounded-full border pl-1 pr-2 py-0.5 ${isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
                          <Av name={a} size={16} />
                          <span className={`text-[0.65rem] ${isDark ? "text-white/70" : "text-gray-600"}`}>{a}</span>
                          <button onClick={() => setForm(f => ({ ...f, assignees: f.assignees.filter(x => x !== a) }))}
                            className={`text-[0.7rem] hover:text-red-400 transition ${isDark ? "text-white/30" : "text-gray-400"}`}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addAssignee(); }}
                      placeholder="Ajouter un collaborateur…"
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none transition ${isDark ? "border-white/8 bg-white/6 text-white/70 placeholder:text-white/25 focus:border-white/15" : "border-gray-200 bg-white text-gray-600 placeholder:text-gray-400 focus:border-gray-300"}`} />
                    <button onClick={addAssignee}
                      className={`rounded-lg px-3 py-1.5 text-xs hover:bg-violet-500/20 hover:text-violet-400 transition ${isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500"}`}>+</button>
                  </div>
                </div>

                <div>
                  <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>
                    Sous-tâches ({form.subtasks.filter(s => s.done).length}/{form.subtasks.length})
                  </label>
                  {form.subtasks.length > 0 && (
                    <div className={`mb-2 space-y-1 rounded-xl border p-2 ${isDark ? "border-white/6 bg-white/4" : "border-gray-200 bg-gray-50"}`}>
                      {form.subtasks.map(s => (
                        <div key={s.id} className="flex items-center gap-2 group/sub py-0.5">
                          <input type="checkbox" checked={s.done} onChange={() => toggleSub(s.id)}
                            className="accent-violet-500 shrink-0" />
                          <span className={`flex-1 text-xs leading-relaxed ${s.done ? `line-through ${isDark ? "text-white/30" : "text-gray-400"}` : isDark ? "text-white/75" : "text-gray-700"}`}>
                            {s.title}
                          </span>
                          <button onClick={() => removeSub(s.id)}
                            className={`opacity-0 group-hover/sub:opacity-100 text-[0.65rem] hover:text-red-400 transition ${isDark ? "text-white/30" : "text-gray-400"}`}>×</button>
                        </div>
                      ))}
                      {form.subtasks.length > 0 && (
                        <div className={`flex items-center gap-2 pt-1 mt-1 border-t ${isDark ? "border-white/5" : "border-gray-200"}`}>
                          <div className={`flex-1 h-1 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                            <div className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${(form.subtasks.filter(s => s.done).length / form.subtasks.length) * 100}%`, background: VIOLET }} />
                          </div>
                          <span className={`text-[0.6rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>
                            {Math.round((form.subtasks.filter(s => s.done).length / form.subtasks.length) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <input value={newSub} onChange={e => setNewSub(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addSub(); }}
                      placeholder="Nouvelle sous-tâche…"
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none transition ${isDark ? "border-white/8 bg-white/6 text-white/70 placeholder:text-white/25 focus:border-white/15" : "border-gray-200 bg-white text-gray-600 placeholder:text-gray-400 focus:border-gray-300"}`} />
                    <button onClick={addSub}
                      className={`rounded-lg px-3 py-1.5 text-xs hover:bg-violet-500/20 hover:text-violet-400 transition ${isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500"}`}>+</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Tags</label>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {form.tags.map(tag => (
                        <span key={tag} className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[0.62rem] ${isDark ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-600"}`}>
                          #{tag}
                          <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}
                            className="hover:text-red-400 ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <input value={newTag} onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addTag(); }}
                        placeholder="Ajouter un tag…"
                        className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none transition ${isDark ? "border-white/8 bg-white/6 text-white/70 placeholder:text-white/25 focus:border-white/15" : "border-gray-200 bg-white text-gray-600 placeholder:text-gray-400 focus:border-gray-300"}`} />
                      <button onClick={addTag}
                        className={`rounded-lg px-2.5 text-xs hover:bg-violet-500/20 hover:text-violet-400 transition ${isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500"}`}>+</button>
                    </div>
                  </div>
                  <div>
                    <label className={`text-[0.68rem] mb-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>Répétition</label>
                    <select value={form.recurrence}
                      onChange={e => setForm(f => ({ ...f, recurrence: e.target.value, is_recurring: e.target.value !== "none" }))}
                      className="rounded-lg border py-1.5 pl-3 pr-8 text-sm outline-none appearance-none w-full transition"
                      style={selStyle(isDark)}>
                      {RECURS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                    </select>
                    {form.linked_module && (
                      <p className={`mt-2 text-[0.62rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>🔗 Lié à : {form.linked_module}</p>
                    )}
                  </div>
                </div>

                {/* ── Dépendances ── */}
                <div>
                  <label className={`text-[0.68rem] mb-1.5 flex items-center gap-1.5 block ${isDark ? "text-white/40" : "text-gray-500"}`}>
                    <Link2 size={11} className="text-amber-400" /> Dépendances — tâches bloquantes ({form.dependencies.length})
                  </label>
                  {form.dependencies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.dependencies.map(depId => {
                        const dep = tasks.find(t => t.id === depId);
                        return dep ? (
                          <span key={depId} className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/8 pl-2 pr-1.5 py-0.5 text-[0.62rem] text-amber-300">
                            <Network size={9}/> {dep.title.slice(0, 30)}{dep.title.length > 30 ? "…" : ""}
                            <button onClick={() => toggleDependency(depId)} className="text-amber-400/60 hover:text-red-400 transition ml-0.5">×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className={`rounded-xl border overflow-hidden ${isDark ? "border-white/8 bg-white/4" : "border-gray-200 bg-gray-50"}`}>
                    <input value={depSearch} onChange={e => setDepSearch(e.target.value)}
                      placeholder="🔍 Rechercher une tâche à lier…"
                      className={`w-full bg-transparent px-3 py-2 text-xs outline-none border-b ${isDark ? "text-white/60 placeholder:text-white/25 border-white/6" : "text-gray-600 placeholder:text-gray-400 border-gray-200"}`} />
                    <div className="max-h-28 overflow-y-auto p-1">
                      {tasks.filter(t => t.id !== editId && (depSearch === "" || t.title.toLowerCase().includes(depSearch.toLowerCase()))).slice(0, 6).map(t => (
                        <button key={t.id} onClick={() => toggleDependency(t.id)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition ${form.dependencies.includes(t.id) ? "bg-amber-500/15 text-amber-300" : isDark ? "text-white/55 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"}`}>
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: STAT[t.status].col }} />
                          <span className="flex-1 truncate">{t.title}</span>
                          {form.dependencies.includes(t.id) && <span className="text-amber-400 text-[0.6rem]">✓ Liée</span>}
                        </button>
                      ))}
                      {tasks.filter(t => t.id !== editId).length === 0 && (
                        <p className={`text-center text-[0.62rem] py-3 ${isDark ? "text-white/20" : "text-gray-400"}`}>Aucune autre tâche</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Liens ERP (Phase 5) ── */}
                <div className={`border-t pt-5 ${isDark ? "border-white/6" : "border-gray-200"}`}>
                  <label className={`text-[0.68rem] mb-3 flex items-center gap-1.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                    <Link2 size={11} className="text-blue-400" /> Liens ERP
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Document */}
                    <div>
                      <label className={`text-[0.62rem] mb-1 block ${isDark ? "text-white/30" : "text-gray-400"}`}>Facture / Devis</label>
                      <select value={form.linked_document_id ?? ""}
                        onChange={e => setForm(f => ({ ...f, linked_document_id: e.target.value || null }))}
                        className="rounded-lg border py-1.5 pl-3 pr-8 text-xs outline-none appearance-none w-full transition"
                        style={selStyle(isDark)}>
                        <option value="">— Aucun —</option>
                        {erpDocs.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                      </select>
                    </div>
                    {/* Contact CRM */}
                    <div>
                      <label className={`text-[0.62rem] mb-1 block ${isDark ? "text-white/30" : "text-gray-400"}`}>Contact CRM</label>
                      <select value={form.linked_contact_id ?? ""}
                        onChange={e => setForm(f => ({ ...f, linked_contact_id: e.target.value || null }))}
                        className="rounded-lg border py-1.5 pl-3 pr-8 text-xs outline-none appearance-none w-full transition"
                        style={selStyle(isDark)}>
                        <option value="">— Aucun —</option>
                        {erpContacts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    {/* Projet */}
                    <div>
                      <label className={`text-[0.62rem] mb-1 block ${isDark ? "text-white/30" : "text-gray-400"}`}>Projet</label>
                      <select value={form.linked_project_id ?? ""}
                        onChange={e => setForm(f => ({ ...f, linked_project_id: e.target.value || null }))}
                        className="rounded-lg border py-1.5 pl-3 pr-8 text-xs outline-none appearance-none w-full transition"
                        style={selStyle(isDark)}>
                        <option value="">— Aucun —</option>
                        {erpProjects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </div>
                    {/* Contrat */}
                    <div>
                      <label className={`text-[0.62rem] mb-1 block ${isDark ? "text-white/30" : "text-gray-400"}`}>Contrat</label>
                      <select value={form.linked_contract_id ?? ""}
                        onChange={e => setForm(f => ({ ...f, linked_contract_id: e.target.value || null }))}
                        className="rounded-lg border py-1.5 pl-3 pr-8 text-xs outline-none appearance-none w-full transition"
                        style={selStyle(isDark)}>
                        <option value="">— Aucun —</option>
                        {erpContracts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    {/* Fournisseur */}
                    <div>
                      <label className={`text-[0.62rem] mb-1 block ${isDark ? "text-white/30" : "text-gray-400"}`}>Fournisseur</label>
                      <select value={form.linked_supplier_id ?? ""}
                        onChange={e => setForm(f => ({ ...f, linked_supplier_id: e.target.value || null }))}
                        className="rounded-lg border py-1.5 pl-3 pr-8 text-xs outline-none appearance-none w-full transition"
                        style={selStyle(isDark)}>
                        <option value="">— Aucun —</option>
                        {erpSuppliers.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    {/* Produit */}
                    <div>
                      <label className={`text-[0.62rem] mb-1 block ${isDark ? "text-white/30" : "text-gray-400"}`}>Produit stock</label>
                      <select value={form.linked_product_id ?? ""}
                        onChange={e => setForm(f => ({ ...f, linked_product_id: e.target.value || null }))}
                        className="rounded-lg border py-1.5 pl-3 pr-8 text-xs outline-none appearance-none w-full transition"
                        style={selStyle(isDark)}>
                        <option value="">— Aucun —</option>
                        {erpProducts.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {editId && (
                  <div className={`border-t pt-5 ${isDark ? "border-white/6" : "border-gray-200"}`}>
                    <label className={`text-[0.68rem] mb-3 block ${isDark ? "text-white/40" : "text-gray-500"}`}>
                      💬 Commentaires ({comments.length})
                    </label>
                    {comments.length > 0 && (
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                        {comments.map(c => (
                          <div key={c.id} className="flex gap-2.5">
                            <Av name={c.author_name} size={26} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[0.65rem] font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{c.author_name}</span>
                                <span className={`text-[0.58rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>
                                  {new Date(c.created_at).toLocaleDateString("fr-FR", {
                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                  })}
                                </span>
                              </div>
                              <p className={`text-xs leading-relaxed ${isDark ? "text-white/60" : "text-gray-600"}`}>{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={cmtAuthor} onChange={e => setCmtAuthor(e.target.value)}
                        className={`w-24 rounded-lg border px-2 py-1.5 text-xs outline-none transition ${isDark ? "border-white/8 bg-white/6 text-white/60 focus:border-white/15" : "border-gray-200 bg-white text-gray-600 focus:border-gray-300"}`} />
                      <input value={cmt} onChange={e => setCmt(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addComment(); }}
                        placeholder="Ajouter un commentaire…"
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none transition ${isDark ? "border-white/8 bg-white/6 text-white/70 placeholder:text-white/25 focus:border-white/15" : "border-gray-200 bg-white text-gray-600 placeholder:text-gray-400 focus:border-gray-300"}`} />
                      <button onClick={addComment}
                        className={`rounded-lg px-3 text-xs hover:bg-violet-500/20 hover:text-violet-400 transition ${isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500"}`}>↵</button>
                    </div>
                  </div>
                )}
              </div>

              <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? "border-white/6" : "border-gray-200"}`}>
                <div className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>
                  {form.time_spent > 0 && `Temps passé : ${fmtSec(form.time_spent)}`}
                  {form.estimated_minutes > 0 && (
                    <span className="ml-3">Estimé : {form.estimated_minutes}min</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveCurrentAsTemplate} disabled={savingTemplate || !form.title.trim()}
                    title="Sauvegarder comme template réutilisable"
                    className={`rounded-xl border px-3 py-2 text-xs transition disabled:opacity-40 ${isDark ? "border-amber-500/30 text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10" : "border-amber-300 text-amber-600 hover:bg-amber-50"}`}>
                    <LayoutTemplate size={12} className="inline mr-1" />{savingTemplate ? "…" : "Template"}
                  </button>
                  <button onClick={() => setShowModal(false)}
                    className={`rounded-xl border px-4 py-2 text-sm transition ${isDark ? "border-white/8 text-white/50 hover:text-white/80" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                    Annuler
                  </button>
                  <button onClick={save} disabled={saving}
                    className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50 hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${VIOLET}, #6d28d9)` }}>
                    {saving ? "Sauvegarde…" : editId ? "Mettre à jour" : "Créer la tâche"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            <AnimatePresence>
        {showAI && <AiPanel tasks={tasks} onClose={() => setShowAI(false)} onAddTasks={addGeneratedTasks} />}
      </AnimatePresence>

      {/* ── Templates panel ── */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTemplates(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${isDark ? "bg-[#0e1420] border-white/8" : "bg-white border-gray-200"}`}
              onClick={e => e.stopPropagation()}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/8" : "border-gray-200"}`}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25">
                    <LayoutTemplate size={15} className="text-amber-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Templates de tâches</p>
                    <p className={`text-[0.62rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>Cliquez pour pré-remplir le formulaire</p>
                  </div>
                </div>
                <button onClick={() => setShowTemplates(false)}
                  className={`text-xl leading-none transition ${isDark ? "text-white/30 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}>×</button>
              </div>

              {/* Onglets */}
              <div className={`flex gap-1 px-5 pt-4 pb-0 border-b ${isDark ? "border-white/6" : "border-gray-200"}`}
                ref={() => { if (showTemplates) loadDbTemplates(); }}>
                {(["builtin", "saved"] as const).map(tab => (
                  <button key={tab} onClick={() => setTplTab(tab)}
                    className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition ${tplTab === tab
                      ? isDark ? "bg-amber-500/15 text-amber-300 border-b-2 border-amber-400" : "bg-amber-50 text-amber-700 border-b-2 border-amber-500"
                      : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}>
                    {tab === "builtin" ? "Templates intégrés" : `Mes templates (${dbTemplates.length})`}
                  </button>
                ))}
              </div>

              {tplTab === "builtin" && (
              <div className="grid grid-cols-2 gap-3 p-5">
                {TASK_TEMPLATES.map(tpl => (
                  <motion.button key={tpl.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setForm({ ...BLANK, ...tpl.form }); setEditId(null); setComments([]); setShowModal(true); setShowTemplates(false); }}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:border-amber-500/30 hover:bg-amber-500/5 ${isDark ? "border-white/8 bg-white/4" : "border-gray-200 bg-gray-50 hover:bg-amber-50"}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                      style={{ background: tpl.color + "18", borderColor: tpl.color + "35" }}>
                      <tpl.Icon size={18} style={{ color: tpl.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{tpl.label}</p>
                      <p className={`text-[0.65rem] mt-0.5 leading-snug ${isDark ? "text-white/40" : "text-gray-500"}`}>{tpl.desc}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tpl.form.tags?.map(tag => (
                          <span key={tag} className={`rounded-full px-2 py-0.5 text-[0.55rem] ${isDark ? "bg-white/6 text-white/40" : "bg-gray-100 text-gray-500"}`}>#{tag}</span>
                        ))}
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.55rem] text-amber-500">
                          {tpl.form.subtasks?.length ?? 0} sous-tâches
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              )}

              {tplTab === "saved" && (
              <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
                {dbTemplates.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <LayoutTemplate size={32} className={`mb-3 ${isDark ? "text-white/15" : "text-gray-300"}`} />
                    <p className={`text-sm ${isDark ? "text-white/25" : "text-gray-400"}`}>Aucun template sauvegardé</p>
                    <p className={`text-[0.65rem] mt-1 ${isDark ? "text-white/15" : "text-gray-300"}`}>Ouvrez une tâche et cliquez « Template »</p>
                  </div>
                ) : dbTemplates.map(tpl => (
                  <div key={tpl.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isDark ? "border-white/8 bg-white/4" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{tpl.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {tpl.category && <span className={`text-[0.6rem] ${isDark ? "text-violet-400/70" : "text-violet-500"}`}>{tpl.category}</span>}
                        {tpl.tags.slice(0, 3).map(tag => <span key={tag} className={`text-[0.58rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>#{tag}</span>)}
                        <span className={`text-[0.58rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>{tpl.subtasks.length} sous-tâches</span>
                      </div>
                    </div>
                    <button onClick={() => applyDbTemplate(tpl)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                      style={{ background: "#c9a55a20", color: "#c9a55a" }}>Utiliser</button>
                    <button onClick={() => deleteDbTemplate(tpl.id)}
                      className={`rounded-lg px-2 py-1.5 text-xs transition ${isDark ? "text-red-400/60 hover:text-red-400 hover:bg-red-500/10" : "text-red-400 hover:bg-red-50"}`}>🗑</button>
                  </div>
                ))}
              </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} remove={removeToast} />

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Supprimer cette tâche ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDel}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
    </DarkCtx.Provider>
  );
}
