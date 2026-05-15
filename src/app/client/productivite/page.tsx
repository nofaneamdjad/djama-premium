"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ListChecks, Activity, Target, ArrowRight, Loader2,
  Play, Square, CornerDownLeft, AlertTriangle, Sparkles, FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";

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
  linked_module: string; created_at: string;
}

type Form = Omit<Task, "id" | "created_at">;

const BLANK: Form = {
  title: "", description: "", priority: "normal", status: "todo",
  category: "", due_date: "", due_time: "", responsible: "", assignees: [],
  subtasks: [], tags: [], estimated_minutes: 30, time_spent: 0,
  timer_started_at: null, is_recurring: false, recurrence: "none", linked_module: "",
};

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
    created_at: String(r.created_at ?? ""),
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

const SEL = "rounded-lg border border-white/[0.08] bg-white/[0.025] py-1.5 pl-3 pr-8 text-sm text-white/75 outline-none appearance-none hover:border-white/20 transition";

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
  if (!subs.length) return null;
  const done = subs.filter(s => s.done).length;
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(done / subs.length) * 100}%`, background: VIOLET }} />
      </div>
      <span className="text-[0.6rem] text-white/35 shrink-0">{done}/{subs.length}</span>
    </div>
  );
}

function TaskCard({ task, now, onEdit, onMove, onTimer }: {
  task: Task; now: number;
  onEdit: () => void;
  onMove: (s: Status) => void;
  onTimer: () => void;
}) {
  const [hov, setHov] = useState(false);
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
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="relative rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 cursor-pointer transition-all hover:border-white/[0.16] hover:shadow-lg hover:shadow-black/30"
      style={{ borderLeft: `3px solid ${pc.color}` }}
      onClick={onEdit}>

            {running && (
        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
      )}

            <p className="text-[0.82rem] font-medium text-white/88 leading-snug line-clamp-2 pr-4 mb-2">
        {task.title}
      </p>

            {task.category && (
        <span className="inline-block rounded-full bg-violet-500/10 px-2 py-0.5 text-[0.58rem] text-violet-300/80 mb-2">
          {task.category}
        </span>
      )}

            <div className="mb-2">
        <PBadge p={task.priority} />
      </div>

            <SubBar subs={task.subtasks} />

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className={`text-[0.62rem] font-medium ${late ? "text-red-400" : "text-white/35"}`}>
              {late && <AlertTriangle size={10} className="inline mr-0.5" />}{fmtDate(task.due_date)}
            </span>
          )}
          {elapsed > 0 && (
            <span className={`text-[0.58rem] ${running ? "text-green-400" : "text-white/25"}`}>
              {fmtSec(elapsed)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {task.assignees.slice(0, 3).map(a => <Av key={a} name={a} size={18} />)}
          {task.assignees.length > 3 && (
            <span className="text-[0.58rem] text-white/35">+{task.assignees.length - 3}</span>
          )}
        </div>
      </div>

            <AnimatePresence>
        {hov && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute bottom-2 right-2 flex gap-1"
            onClick={e => e.stopPropagation()}>
            <button onClick={onTimer}
              className={`rounded-md px-1.5 py-0.5 text-[0.62rem] font-medium transition ${running
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-white/5 text-white/40 hover:bg-violet-500/20 hover:text-violet-400"}`}>
              {running ? <><Square size={9}/> Stop</> : <><Play size={9}/> Timer</>}
            </button>
            {nextSt && (
              <button onClick={() => onMove(nextSt)}
                className="flex items-center gap-0.5 rounded-md bg-white/5 px-1.5 py-0.5 text-[0.62rem] text-white/40 hover:bg-blue-500/20 hover:text-blue-400 transition">
                <ArrowRight size={9} /> {STAT[nextSt].label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AiPanel({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const [msg, setMsg]       = useState("");
  const [resp, setResp]     = useState("");
  const [loading, setLoading] = useState(false);

  const ctx = `Productivité SaaS: ${tasks.length} tâches au total. Urgentes: ${tasks.filter(t => t.priority === "urgent").length}. En retard: ${tasks.filter(isLate).length}. En cours: ${tasks.filter(t => t.status === "in_progress").length}. En validation: ${tasks.filter(t => t.status === "validation").length}. Terminées: ${tasks.filter(t => t.status === "done").length}.`;

  async function ask(prompt: string) {
    setLoading(true); setResp("");
    try {
      const r = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", content: ctx, prompt }),
      });
      const d = await r.json();
      setResp(d.result ?? d.error ?? "Erreur");
    } catch { setResp("Erreur réseau"); }
    setLoading(false);
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
      className="fixed right-0 top-0 h-full w-[340px] bg-white/[0.025] border-l border-white/[0.07] z-50 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full flex items-center justify-center"
            style={{ background: VIOLET + "30", border: `1px solid ${VIOLET}50` }}>
            <Sparkles size={11} style={{ color: VIOLET }} />
          </div>
          <span className="text-sm font-semibold text-white/85">IA Productivité</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 text-xl leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-[0.67rem] text-white/30 leading-relaxed">{ctx}</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK.map(q => (
            <button key={q.l} onClick={() => ask(q.p)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center transition hover:border-violet-500/40 hover:bg-violet-500/10">
              <q.Icon size={18} style={{ color: VIOLET }} />
              <span className="text-[0.63rem] text-white/55 leading-tight">{q.l}</span>
            </button>
          ))}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Loader2 size={12} className="animate-spin" /> Analyse en cours…
          </div>
        )}
        {resp && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs text-white/78 leading-relaxed whitespace-pre-wrap">
            {resp}
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.07] p-3 flex gap-2">
        <input value={msg} onChange={e => setMsg(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { ask(msg.trim()); setMsg(""); } }}
          placeholder="Question libre sur vos tâches…"
          className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs text-white/75 outline-none placeholder:text-white/25 hover:border-white/15" />
        <button onClick={() => { if (msg.trim()) { ask(msg.trim()); setMsg(""); } }}
          className="rounded-lg px-3 py-2 text-sm text-white transition hover:opacity-90"
          style={{ background: VIOLET }}><ArrowRight size={13} /></button>
      </div>
    </motion.div>
  );
}

export default function ProductivitePage() {
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState<View>("kanban");
  const [listTab,    setListTab]    = useState<LTab>("today");
  const [search,     setSearch]     = useState("");
  const [fprio,      setFprio]      = useState("");
  const [fcat,       setFcat]       = useState("");
  const [fstat,      setFstat]      = useState("");
  const [showAI,     setShowAI]     = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState<Form>(BLANK);
  const [saving,     setSaving]     = useState(false);
  const [toastData,  setToastData]  = useState<ToastData | null>(null);
  const [comments,   setComments]   = useState<Cmt[]>([]);
  const [cmt,        setCmt]        = useState("");
  const [cmtAuthor,  setCmtAuthor]  = useState("Moi");
  const [quickAdd,   setQuickAdd]   = useState<Record<string, string>>({});
  const [now,        setNow]        = useState(Date.now());
  const [newSub,     setNewSub]     = useState("");
  const [newTag,     setNewTag]     = useState("");
  const [newAssignee,setNewAssignee]= useState("");


  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const toast = useCallback((msg: string, type: ToastData["type"] = "success") => {
    setToastData({ msg, type });
    setTimeout(() => setToastData(null), 3500);
  }, []);


  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productivity_tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast(error.message, "error");
    else setTasks((data ?? []).map((r: Record<string, unknown>) => parseTask(r)));
    setLoading(false);

  }, []);

  useEffect(() => { load(); }, [load]);


  const openNew = (defaultStatus?: Status) => {
    setForm({ ...BLANK, status: defaultStatus ?? "todo" });
    setEditId(null); setComments([]); setShowModal(true);
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
    });
    setEditId(t.id); setShowModal(true);
    loadComments(t.id);
  };

  const loadComments = async (taskId: string) => {
    const { data } = await supabase
      .from("task_comments").select("*").eq("task_id", taskId).order("created_at");
    setComments((data ?? []) as Cmt[]);
  };


  const save = async () => {
    if (!form.title.trim()) { toast("Le titre est requis", "error"); return; }
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
      linked_module: form.linked_module,
    };
    if (editId) {
      const { error } = await supabase.from("productivity_tasks").update(payload).eq("id", editId);
      if (error) toast(error.message, "error");
      else { toast("Tâche mise à jour"); await load(); }
    } else {
      const { error } = await supabase.from("productivity_tasks").insert(payload);
      if (error) toast(error.message, "error");
      else { toast("Tâche créée"); setShowModal(false); await load(); }
    }
    setSaving(false);
  };

  const del = async () => {
    if (!editId || !confirm("Supprimer cette tâche ?")) return;
    const { error } = await supabase.from("productivity_tasks").delete().eq("id", editId);
    if (error) toast(error.message, "error");
    else { toast("Tâche supprimée", "info"); setShowModal(false); await load(); }
  };


  const changeStatus = async (id: string, status: Status) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    await supabase.from("productivity_tasks").update({ status }).eq("id", id);
  };

  const toggleTimer = async (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const update = t.timer_started_at
      ? { timer_started_at: null, time_spent: t.time_spent + Math.floor((Date.now() - new Date(t.timer_started_at).getTime()) / 1000) }
      : { timer_started_at: new Date().toISOString(), time_spent: t.time_spent };
    setTasks(ts => ts.map(x => x.id === id ? { ...x, ...update } : x));
    await supabase.from("productivity_tasks").update(update).eq("id", id);
  };


  const quickAddTask = async (status: Status) => {
    const title = (quickAdd[status] ?? "").trim();
    if (!title) return;
    const { data, error } = await supabase
      .from("productivity_tasks")
      .insert({ title, status, priority: "normal", subtasks: "[]" })
      .select().single();
    if (error) toast(error.message, "error");
    else if (data) setTasks(ts => [parseTask(data as Record<string, unknown>), ...ts]);
    setQuickAdd(q => ({ ...q, [status]: "" }));
  };


  const addComment = async () => {
    if (!cmt.trim() || !editId) return;
    const { data, error } = await supabase
      .from("task_comments")
      .insert({ task_id: editId, author_name: cmtAuthor, content: cmt.trim() })
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


  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (fprio  && t.priority !== fprio) return false;
    if (fcat   && t.category !== fcat)  return false;
    if (fstat  && t.status   !== fstat) return false;
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
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">

                <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/90 flex items-center gap-2">
              <Zap size={20} style={{ color: VIOLET }} /> Productivité
            </h1>
            <p className="text-sm text-white/35 mt-0.5">
              {completionRate}% de complétion · {tasks.filter(isLate).length} en retard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAI(s => !s)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${showAI
                ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                : "border-white/[0.08] text-white/50 hover:border-violet-500/30 hover:text-violet-300"}`}>
              <Sparkles size={14}/> IA
            </button>
            <button onClick={() => openNew()}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${VIOLET}, #6d28d9)` }}>
              + Nouvelle tâche
            </button>
          </div>
        </div>

                <div className="grid grid-cols-5 gap-3">
          {kpis.map(k => (
            <div key={k.l} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              <p className="text-[0.7rem] text-white/40 mb-1">{k.l}</p>
              <p className="text-2xl font-bold" style={{ color: k.col }}>{k.v}</p>
            </div>
          ))}
        </div>

                <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: VIOLET }}
              initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 0.8 }} />
          </div>
          <span className="text-xs text-white/35 shrink-0">{completionRate}% terminé</span>
        </div>

                <div className="flex flex-wrap items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher une tâche…"
            className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-sm text-white/70 outline-none placeholder:text-white/25 w-52 hover:border-white/15 focus:border-violet-500/40" />

          <select value={fprio} onChange={e => setFprio(e.target.value)} className={SEL}>
            <option value="" className="bg-white/[0.025] text-white/70">Toutes priorités</option>
            {(Object.keys(PRIO) as Priority[]).map(p => (
              <option key={p} value={p} className="bg-white/[0.025] text-white/70">{PRIO[p].label}</option>
            ))}
          </select>

          <select value={fcat} onChange={e => setFcat(e.target.value)} className={SEL}>
            <option value="" className="bg-white/[0.025] text-white/70">Toutes catégories</option>
            {CATS.map(c => <option key={c} value={c} className="bg-white/[0.025] text-white/70">{c}</option>)}
          </select>

          <select value={fstat} onChange={e => setFstat(e.target.value)} className={SEL}>
            <option value="" className="bg-white/[0.025] text-white/70">Tous statuts</option>
            {(Object.keys(STAT) as Status[]).map(s => (
              <option key={s} value={s} className="bg-white/[0.025] text-white/70">{STAT[s].label}</option>
            ))}
          </select>

          {(search || fprio || fcat || fstat) && (
            <button onClick={() => { setSearch(""); setFprio(""); setFcat(""); setFstat(""); }}
              className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/40 hover:text-white/70 transition">
              ✕ Réinitialiser
            </button>
          )}

          <div className="ml-auto flex rounded-xl border border-white/[0.08] overflow-hidden">
            {(["kanban", "list"] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 text-xs font-medium transition ${view === v ? "text-white" : "text-white/40 hover:text-white/70"}`}
                style={view === v ? { background: VIOLET + "33" } : {}}>
                {v === "kanban" ? "⊞ Kanban" : "☰ Liste"}
              </button>
            ))}
          </div>
        </div>

                {view === "kanban" && (
          <div className="grid grid-cols-4 gap-4" style={{ minHeight: "60vh" }}>
            {KANBAN_COLS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.key);
              return (
                <div key={col.key}
                  className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">

                                    <div className="px-4 py-3 border-b border-white/[0.06]"
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
                        className="text-white/30 hover:text-white/70 text-lg leading-none transition">
                        +
                      </button>
                    </div>
                  </div>

                                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5"
                    style={{ maxHeight: "calc(100vh - 360px)" }}>
                    {loading && colTasks.length === 0 ? (
                      <div className="flex flex-col items-center py-8 gap-2">
                        <span className="text-white/20 animate-pulse text-xs">Chargement…</span>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {colTasks.map(t => (
                          <TaskCard key={t.id} task={t} now={now}
                            onEdit={() => openEdit(t)}
                            onMove={s => changeStatus(t.id, s)}
                            onTimer={() => toggleTimer(t.id)} />
                        ))}
                      </AnimatePresence>
                    )}
                    {!loading && colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="text-3xl mb-2 opacity-20" style={{ color: col.col }}>○</span>
                        <p className="text-[0.68rem] text-white/20">Aucune tâche</p>
                      </div>
                    )}
                  </div>

                                    <div className="border-t border-white/[0.05] p-2.5">
                    <div className="flex gap-1">
                      <input
                        value={quickAdd[col.key] ?? ""}
                        onChange={e => setQuickAdd(q => ({ ...q, [col.key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") quickAddTask(col.key); }}
                        placeholder="+ Ajouter rapidement…"
                        className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5 text-xs text-white/60 outline-none placeholder:text-white/20 focus:border-white/10 hover:border-white/[0.08]" />
                      <button onClick={() => quickAddTask(col.key)}
                        className="rounded-lg px-2 py-1.5 text-xs text-white/40 hover:text-white/80 hover:bg-white/5 transition">
                        <CornerDownLeft size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

                {view === "list" && (
          <div className="space-y-4">
                        <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 w-fit">
              {([
                { k: "today", l: "Aujourd'hui", n: listTasks.today.length },
                { k: "week",  l: "Cette semaine", n: listTasks.week.length },
                { k: "late",  l: "En retard",   n: listTasks.late.length },
                { k: "done",  l: "Terminées",   n: listTasks.done.length },
              ] as { k: LTab; l: string; n: number }[]).map(tab => (
                <button key={tab.k} onClick={() => setListTab(tab.k)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition ${listTab === tab.k ? "text-white" : "text-white/40 hover:text-white/70"}`}
                  style={listTab === tab.k ? { background: VIOLET + "25" } : {}}>
                  {tab.l}
                  {tab.n > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold ${tab.k === "late" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/50"}`}>
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
                    className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 cursor-pointer transition hover:border-white/15 hover:bg-white/[0.025]"
                    style={{ borderLeft: `3px solid ${PRIO[t.priority].color}` }}>

                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: STAT[t.status].col }} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/85 truncate">{t.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {t.category && <span className="text-[0.6rem] text-violet-400/70">{t.category}</span>}
                        {t.due_date && (
                          <span className={`text-[0.6rem] ${isLate(t) ? "text-red-400" : "text-white/30"}`}>
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
                        <span className={`text-[0.62rem] ${t.timer_started_at ? "text-green-400" : "text-white/30"}`}>
                          {fmtSec(totalSec(t, now))}
                        </span>
                      )}
                      <button onClick={e => { e.stopPropagation(); toggleTimer(t.id); }}
                        className={`rounded-lg px-2 py-1 text-[0.62rem] transition ${t.timer_started_at
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "bg-white/5 text-white/35 hover:bg-violet-500/15 hover:text-violet-400"}`}>
                        {t.timer_started_at ? <Square size={10}/> : <Play size={10}/>}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {listTasks[listTab].length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <FileText size={40} className="text-white/15 mb-3"/>
                  <p className="text-sm text-white/25">Aucune tâche dans cette vue</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

            <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-6 pb-6 px-4 overflow-y-auto"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              className="relative w-full max-w-3xl rounded-2xl border border-white/[0.09] bg-white/[0.025] shadow-2xl"
              onClick={e => e.stopPropagation()}>

                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                <h2 className="text-base font-semibold text-white/88">
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
                    className="text-white/30 hover:text-white/70 text-xl leading-none">×</button>
                </div>
              </div>

              <div className="p-6 space-y-5">

                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Titre de la tâche *"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-base font-medium text-white/90 outline-none placeholder:text-white/25 focus:border-violet-500/50 transition" />

                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optionnel)…" rows={3}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-white/75 outline-none placeholder:text-white/25 focus:border-white/15 transition" />

                                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[0.68rem] text-white/40 mb-1.5 block">Priorité</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                      className={SEL + " w-full"}>
                      {(Object.keys(PRIO) as Priority[]).map(p => (
                        <option key={p} value={p} className="bg-white/[0.025] text-white/70">{PRIO[p].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[0.68rem] text-white/40 mb-1.5 block">Statut</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
                      className={SEL + " w-full"}>
                      {(Object.keys(STAT) as Status[]).map(s => (
                        <option key={s} value={s} className="bg-white/[0.025] text-white/70">{STAT[s].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[0.68rem] text-white/40 mb-1.5 block">Catégorie</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className={SEL + " w-full"}>
                      <option value="" className="bg-white/[0.025] text-white/70">Sans catégorie</option>
                      {CATS.map(c => <option key={c} value={c} className="bg-white/[0.025] text-white/70">{c}</option>)}
                    </select>
                  </div>
                </div>

                                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[0.68rem] text-white/40 mb-1.5 block">Date limite</label>
                    <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className={SEL + " w-full [color-scheme:dark]"} />
                  </div>
                  <div>
                    <label className="text-[0.68rem] text-white/40 mb-1.5 block">Heure</label>
                    <input type="time" value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))}
                      className={SEL + " w-full [color-scheme:dark]"} />
                  </div>
                  <div>
                    <label className="text-[0.68rem] text-white/40 mb-1.5 block">Durée estimée (min)</label>
                    <input type="number" value={form.estimated_minutes} min={5} step={5}
                      onChange={e => setForm(f => ({ ...f, estimated_minutes: Number(e.target.value) }))}
                      className={SEL + " w-full"} />
                  </div>
                </div>

                                <div>
                  <label className="text-[0.68rem] text-white/40 mb-1.5 block">Responsable</label>
                  <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                    placeholder="Nom du responsable"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-sm text-white/75 outline-none focus:border-white/15 transition" />
                </div>

                                <div>
                  <label className="text-[0.68rem] text-white/40 mb-1.5 block">Collaborateurs</label>
                  {form.assignees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.assignees.map(a => (
                        <span key={a} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 pl-1 pr-2 py-0.5">
                          <Av name={a} size={16} />
                          <span className="text-[0.65rem] text-white/70">{a}</span>
                          <button onClick={() => setForm(f => ({ ...f, assignees: f.assignees.filter(x => x !== a) }))}
                            className="text-white/30 hover:text-red-400 transition text-[0.7rem]">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addAssignee(); }}
                      placeholder="Ajouter un collaborateur…"
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 transition" />
                    <button onClick={addAssignee}
                      className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:bg-violet-500/20 hover:text-violet-400 transition">+</button>
                  </div>
                </div>

                                <div>
                  <label className="text-[0.68rem] text-white/40 mb-1.5 block">
                    Sous-tâches ({form.subtasks.filter(s => s.done).length}/{form.subtasks.length})
                  </label>
                  {form.subtasks.length > 0 && (
                    <div className="mb-2 space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      {form.subtasks.map(s => (
                        <div key={s.id} className="flex items-center gap-2 group/sub py-0.5">
                          <input type="checkbox" checked={s.done} onChange={() => toggleSub(s.id)}
                            className="accent-violet-500 shrink-0" />
                          <span className={`flex-1 text-xs leading-relaxed ${s.done ? "line-through text-white/30" : "text-white/75"}`}>
                            {s.title}
                          </span>
                          <button onClick={() => removeSub(s.id)}
                            className="opacity-0 group-hover/sub:opacity-100 text-[0.65rem] text-white/30 hover:text-red-400 transition">×</button>
                        </div>
                      ))}
                                            {form.subtasks.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 mt-1 border-t border-white/[0.05]">
                          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${(form.subtasks.filter(s => s.done).length / form.subtasks.length) * 100}%`, background: VIOLET }} />
                          </div>
                          <span className="text-[0.6rem] text-white/35">
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
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 transition" />
                    <button onClick={addSub}
                      className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:bg-violet-500/20 hover:text-violet-400 transition">+</button>
                  </div>
                </div>

                                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[0.68rem] text-white/40 mb-1.5 block">Tags</label>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {form.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-0.5 rounded-full bg-violet-500/15 px-2 py-0.5 text-[0.62rem] text-violet-300">
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
                        className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 transition" />
                      <button onClick={addTag}
                        className="rounded-lg bg-white/5 px-2.5 text-xs text-white/50 hover:bg-violet-500/20 hover:text-violet-400 transition">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[0.68rem] text-white/40 mb-1.5 block">Répétition</label>
                    <select value={form.recurrence}
                      onChange={e => setForm(f => ({ ...f, recurrence: e.target.value, is_recurring: e.target.value !== "none" }))}
                      className={SEL + " w-full"}>
                      {RECURS.map(r => <option key={r.v} value={r.v} className="bg-white/[0.025] text-white/70">{r.l}</option>)}
                    </select>
                    {form.linked_module && (
                      <p className="mt-2 text-[0.62rem] text-white/30">🔗 Lié à : {form.linked_module}</p>
                    )}
                  </div>
                </div>

                                {editId && (
                  <div className="border-t border-white/[0.07] pt-5">
                    <label className="text-[0.68rem] text-white/40 mb-3 block">
                      💬 Commentaires ({comments.length})
                    </label>
                    {comments.length > 0 && (
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                        {comments.map(c => (
                          <div key={c.id} className="flex gap-2.5">
                            <Av name={c.author_name} size={26} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[0.65rem] font-semibold text-white/70">{c.author_name}</span>
                                <span className="text-[0.58rem] text-white/25">
                                  {new Date(c.created_at).toLocaleDateString("fr-FR", {
                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-white/60 leading-relaxed">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={cmtAuthor} onChange={e => setCmtAuthor(e.target.value)}
                        className="w-24 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/15 transition" />
                      <input value={cmt} onChange={e => setCmt(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addComment(); }}
                        placeholder="Ajouter un commentaire…"
                        className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 transition" />
                      <button onClick={addComment}
                        className="rounded-lg bg-white/5 px-3 text-xs text-white/50 hover:bg-violet-500/20 hover:text-violet-400 transition">↵</button>
                    </div>
                  </div>
                )}
              </div>

                            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.07]">
                <div className="text-xs text-white/30">
                  {form.time_spent > 0 && `Temps passé : ${fmtSec(form.time_spent)}`}
                  {form.estimated_minutes > 0 && (
                    <span className="ml-3">Estimé : {form.estimated_minutes}min</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)}
                    className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-white/50 hover:text-white/80 transition">
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
        {showAI && <AiPanel tasks={tasks} onClose={() => setShowAI(false)} />}
      </AnimatePresence>

            <AnimatePresence>
        {toastData && <Toast toast={toastData} onClose={() => setToastData(null)} />}
      </AnimatePresence>
    </div>
  );
}
