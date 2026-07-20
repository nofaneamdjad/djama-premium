"use client";

import React, {
  useState, useEffect, useCallback, useMemo, useRef, createContext, useContext,
} from "react";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X, Check, Loader2,
  MapPin, Bell, Trash2, Clock, Target, Sparkles,
  CheckCircle2, Circle, AlertCircle, Zap, Video,
  Tag, AlignLeft, Calendar, Users, BarChart2,
  Download, ExternalLink, AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import { validate, EventSchema } from "@/lib/schemas/client";

type EventType    = "event" | "meeting" | "task" | "reminder";
type TaskStatus   = "todo" | "in_progress" | "done" | "late";
type TaskPriority = "low" | "normal" | "high" | "urgent";
type CalView      = "month" | "week" | "agenda" | "booking";

interface PlanEvent {
  id: string; title: string; description: string;
  event_type: EventType; start_at: string; end_at: string;
  is_all_day: boolean; location: string; color: string;
  participants: string[]; reminder_minutes: number;
  meet_link: string; linked_module: string; linked_id: string;
  status: string; created_at: string; updated_at: string;
}

interface PlanTask {
  id: string; title: string; description: string;
  due_date: string | null; due_time: string;
  priority: TaskPriority; status: TaskStatus;
  estimated_minutes: number; created_at: string;
}

interface PlanGoal {
  id: string; title: string; period: "week" | "month";
  target_date: string | null; progress: number; status: string;
}

const INDIGO = "#6366f1";

const EV_COLORS = [
  "#6366f1","#f59e0b","#10b981","#f87171",
  "#60a5fa","#c084fc","#34d399","#fb923c","#f472b6",
];

const EV_TYPES: { v: EventType; l: string; icon: LucideIcon }[] = [
  { v:"event",    l:"Événement", icon: Calendar },
  { v:"meeting",  l:"Réunion",   icon: Users },
  { v:"task",     l:"Tâche",     icon: CheckCircle2 },
  { v:"reminder", l:"Rappel",    icon: Bell },
];

const PRIO_COL: Record<TaskPriority, string> = {
  low:"#94a3b8", normal:"#60a5fa", high:"#f59e0b", urgent:"#f87171",
};

const DAYS_FR  = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
const CELL_H = 60;
const START_H = 7;

const fmtDate = (d: Date) => d.toISOString().split("T")[0];

const addDays = (d: Date, n: number) => {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
};

const startOfWeek = (d: Date) => {
  const day = d.getDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
};

const isSameDay = (a: Date, b: Date) => fmtDate(a) === fmtDate(b);
const isToday   = (d: Date) => isSameDay(d, new Date());

const toLocalDT = (d: Date) => {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

const roundUp30 = () => {
  const d = new Date();
  return new Date(Math.ceil(d.getTime() / (30 * 60_000)) * 30 * 60_000);
};

function getMonthGrid(year: number, month: number): Date[][] {
  const first    = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const grid: Date[][] = [];
  let cur = addDays(first, -startDay);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) { week.push(new Date(cur)); cur = addDays(cur, 1); }
    grid.push(week);
    if (cur.getMonth() !== month && grid.length >= 4) break;
  }
  return grid;
}

function parseEvent(r: Record<string, unknown>): PlanEvent {
  return {
    id:               r.id as string,
    title:            (r.title as string) ?? "",
    description:      (r.description as string) ?? "",
    event_type:       (r.event_type as EventType) ?? "event",
    start_at:         (r.start_at as string) ?? "",
    end_at:           (r.end_at as string) ?? "",
    is_all_day:       Boolean(r.is_all_day),
    location:         (r.location as string) ?? "",
    color:            (r.color as string) ?? INDIGO,
    participants:     (r.participants as string[]) ?? [],
    reminder_minutes: (r.reminder_minutes as number) ?? 30,
    meet_link:        (r.meet_link as string) ?? "",
    linked_module:    (r.linked_module as string) ?? "",
    linked_id:        (r.linked_id as string) ?? "",
    status:           (r.status as string) ?? "confirmed",
    created_at:       (r.created_at as string) ?? "",
    updated_at:       (r.updated_at as string) ?? "",
  };
}

function parseTask(r: Record<string, unknown>): PlanTask {
  return {
    id:                r.id as string,
    title:             (r.title as string) ?? "",
    description:       (r.description as string) ?? "",
    due_date:          (r.due_date as string | null) ?? null,
    due_time:          (r.due_time as string) ?? "",
    priority:          (r.priority as TaskPriority) ?? "normal",
    status:            (r.status as TaskStatus) ?? "todo",
    estimated_minutes: (r.estimated_minutes as number) ?? 30,
    created_at:        (r.created_at as string) ?? "",
  };
}

function newEventForm(date?: Date, hour?: number): Partial<PlanEvent> {
  const s = date ? new Date(date) : roundUp30();
  if (hour !== undefined) { s.setHours(hour, 0, 0, 0); }
  const e = new Date(s.getTime() + 60 * 60_000);
  return {
    title:"", description:"", event_type:"event",
    start_at: toLocalDT(s), end_at: toLocalDT(e),
    is_all_day: false, location:"", color: INDIGO,
    participants:[], reminder_minutes:30, meet_link:"",
    linked_module:"", linked_id:"", status:"confirmed",
  };
}

function getFrenchHolidays(year: number): Record<string, string> {
  function easterDate(y: number): Date {
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4;
    const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
    const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
    const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return new Date(y,month-1,day);
  }
  const easter   = easterDate(year).getTime();
  const fmt      = (ms: number) => new Date(ms).toISOString().slice(0,10);
  const addD     = (ms: number, d: number) => fmt(ms + d*86_400_000);
  return {
    [`${year}-01-01`]:    "Jour de l'An",
    [addD(easter, 1)]:    "Lundi de Pâques",
    [`${year}-05-01`]:    "Fête du Travail",
    [`${year}-05-08`]:    "Victoire 1945",
    [addD(easter, 39)]:   "Ascension",
    [addD(easter, 50)]:   "Lundi de Pentecôte",
    [`${year}-07-14`]:    "Fête Nationale",
    [`${year}-08-15`]:    "Assomption",
    [`${year}-11-01`]:    "Toussaint",
    [`${year}-11-11`]:    "Armistice",
    [`${year}-12-25`]:    "Noël",
  };
}

function getConflicts(evs: PlanEvent[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < evs.length; i++) {
    for (let j = i + 1; j < evs.length; j++) {
      const a = evs[i], b = evs[j];
      if (a.is_all_day || b.is_all_day) continue;
      const aS = new Date(a.start_at).getTime(), aE = new Date(a.end_at).getTime();
      const bS = new Date(b.start_at).getTime(), bE = new Date(b.end_at).getTime();
      if (aS < bE && aE > bS) { ids.add(a.id); ids.add(b.id); }
    }
  }
  return ids;
}

const DarkCtx = createContext(true);
const useDark = () => useContext(DarkCtx);

function EventChip({ ev, onClick, small = false }: {
  ev: PlanEvent; onClick: () => void; small?: boolean
}) {
  const t = new Date(ev.start_at);
  const hhmm = `${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`;
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }}
      className={`w-full text-left truncate font-medium leading-none transition-opacity hover:opacity-90 ${small ? "text-[9px] px-1 py-0.5 rounded" : "text-[10px] px-1.5 py-0.5 rounded-md"}`}
      style={{ background:`${ev.color}28`, color: ev.color, border:`1px solid ${ev.color}35` }}>
      {!ev.is_all_day && <span className="opacity-70 mr-1">{hhmm}</span>}
      {ev.title}
    </button>
  );
}

function TaskRow({ task, onToggle, onDelete }: {
  task: PlanTask; onToggle: () => void; onDelete: () => void;
}) {
  const isDark = useDark();
  const done = task.status === "done";
  const late = task.status === "late";
  return (
    <div className="flex items-center gap-2 group py-1">
      <button onClick={onToggle} className="shrink-0 transition-colors">
        {done
          ? <CheckCircle2 size={14} className="text-emerald-400" />
          : late
          ? <AlertCircle size={14} className="text-red-400" />
          : <Circle size={14} style={{ color: PRIO_COL[task.priority] }} />
        }
      </button>
      <span className={`flex-1 text-xs truncate ${done ? `line-through ${isDark ? "text-white/25" : "text-gray-400"}` : isDark ? "text-white/70" : "text-gray-700"}`}>
        {task.title}
      </span>
      <button onClick={onDelete}
        className={`opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all ${isDark ? "text-white/20" : "text-gray-400"}`}>
        <X size={11} />
      </button>
    </div>
  );
}

export default function PlanningPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [view,          setView]          = useState<CalView>("week");
  const [current,       setCurrent]       = useState(new Date());
  const [events,        setEvents]        = useState<PlanEvent[]>([]);
  const [tasks,         setTasks]         = useState<PlanTask[]>([]);
  const [goals,         setGoals]         = useState<PlanGoal[]>([]);
  const [loading,       setLoading]       = useState(true);

  const { toasts, add: addToast, remove: removeToast } = useToastStack();

    const [showModal,   setShowModal]   = useState(false);
  const [editEvent,   setEditEvent]   = useState<PlanEvent | null>(null);
  const [form,        setForm]        = useState<Partial<PlanEvent>>(newEventForm());
  const [formErrors,  setFormErrors]  = useState<Record<string, string>>({});
  const [saving,      setSaving]      = useState(false);
  const [showColPal,  setShowColPal]  = useState(false);

    const [newTask,    setNewTask]    = useState("");
  const [addingTask, setAddingTask] = useState(false);

    const [newGoal,    setNewGoal]    = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

    const [aiLoading,  setAiLoading]  = useState(false);
  const [aiResult,   setAiResult]   = useState("");
  const [showAI,     setShowAI]     = useState(false);

  // Booking page config
  const [bkToken,    setBkToken]    = useState<string | null>(null);
  const [bkTitle,    setBkTitle]    = useState("Prendre un rendez-vous");
  const [bkDesc,     setBkDesc]     = useState("");
  const [bkDur,      setBkDur]      = useState(30);
  const [bkDays,     setBkDays]     = useState<number[]>([1,2,3,4,5]);
  const [bkStart,    setBkStart]    = useState(9);
  const [bkEnd,      setBkEnd]      = useState(18);
  const [bkLoading,  setBkLoading]  = useState(false);
  const [bkSaving,   setBkSaving]   = useState(false);
  const [bkCopied,   setBkCopied]   = useState(false);

  // Drag-drop
  const [dragEvId,    setDragEvId]    = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const dragDurRef = useRef<number>(0);

  // Conflict detection
  const conflictIds = useMemo(() => getConflicts(events), [events]);

  // French public holidays for the current and adjacent years
  const holidays = useMemo(() => {
    const y = current.getFullYear();
    return { ...getFrenchHolidays(y - 1), ...getFrenchHolidays(y), ...getFrenchHolidays(y + 1) };
  }, [current]);

    const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }
      const [evR, tkR, goR] = await Promise.all([
        supabase.from("planning_events").select("*").eq("user_id", user.id).order("start_at").limit(500),
        supabase.from("planning_tasks").select("*").eq("user_id", user.id).order("due_date").order("created_at").limit(500),
        supabase.from("planning_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
      ]);
      setEvents((evR.data ?? []).map(r => parseEvent(r as Record<string,unknown>)));
      setTasks((tkR.data ?? []).map(r => parseTask(r as Record<string,unknown>)));
      setGoals((goR.data ?? []) as PlanGoal[]);
    } catch {
      addToast("Erreur réseau — impossible de charger le planning", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

    function navigate(dir: -1 | 1) {
    setCurrent(prev => {
      const d = new Date(prev);
      if (view === "month") { d.setMonth(d.getMonth() + dir); d.setDate(1); }
      else if (view === "week") { d.setDate(d.getDate() + dir * 7); }
      else { d.setDate(d.getDate() + dir * 14); }
      return d;
    });
  }

  const headerLabel = useMemo(() => {
    if (view === "month") return `${MONTHS_FR[current.getMonth()]} ${current.getFullYear()}`;
    if (view === "week") {
      const ws = startOfWeek(current);
      const we = addDays(ws, 6);
      if (ws.getMonth() === we.getMonth())
        return `${ws.getDate()}–${we.getDate()} ${MONTHS_FR[ws.getMonth()]} ${ws.getFullYear()}`;
      return `${ws.getDate()} ${MONTHS_FR[ws.getMonth()].slice(0,3)} – ${we.getDate()} ${MONTHS_FR[we.getMonth()].slice(0,3)} ${we.getFullYear()}`;
    }
    return `Agenda — ${MONTHS_FR[current.getMonth()]} ${current.getFullYear()}`;
  }, [view, current]);

    const eventsOnDate = useCallback((date: Date) => {
    const ds = fmtDate(date);
    return events.filter(ev => {
      const s = fmtDate(new Date(ev.start_at));
      const e = fmtDate(new Date(ev.end_at));
      return ds >= s && ds <= e;
    });
  }, [events]);

    function openCreate(date?: Date, hour?: number) {
    setEditEvent(null);
    setForm(newEventForm(date, hour));
    setShowColPal(false);
    setShowModal(true);
  }

  function openEdit(ev: PlanEvent) {
    setEditEvent(ev);
    setForm({
      ...ev,
      start_at: toLocalDT(new Date(ev.start_at)),
      end_at:   toLocalDT(new Date(ev.end_at)),
    });
    setShowColPal(false);
    setShowModal(true);
  }

  async function saveEvent() {
    const errors = validate(EventSchema, {
      title:      form.title ?? "",
      start_at:   form.start_at ?? "",
      end_at:     form.end_at ?? "",
      event_type: form.event_type,
    });
    if (errors) { setFormErrors(errors); return; }
    setFormErrors({});
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      ...form,
      start_at: new Date(form.start_at!).toISOString(),
      end_at:   new Date(form.end_at!).toISOString(),
      user_id:  user.id,
    };

    if (editEvent) {
      const { data, error } = await supabase
        .from("planning_events").update(payload).eq("id", editEvent.id).select().single();
      if (error) { addToast("Erreur lors de la mise à jour", "error"); }
      else if (data) {
        setEvents(p => p.map(e => e.id === editEvent.id ? parseEvent(data as Record<string,unknown>) : e));
        addToast("Événement mis à jour", "success");
      }
    } else {
      const { data, error } = await supabase
        .from("planning_events").insert(payload).select().single();
      if (error) { addToast("Erreur de sauvegarde", "error"); }
      else if (data) {
        setEvents(p => [parseEvent(data as Record<string,unknown>), ...p]);
        addToast("Événement créé", "success");
      }
    }
    setSaving(false);
    setShowModal(false);
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from("planning_events").delete().eq("id", id);
    if (error) { addToast("Erreur lors de la suppression", "error"); return; }
    setEvents(p => p.filter(e => e.id !== id));
    setShowModal(false);
    addToast("Événement supprimé", "success");
  }

    async function createTask() {
    if (!newTask.trim()) return;
    setAddingTask(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddingTask(false); return; }
    const today = fmtDate(new Date());
    const { data, error } = await supabase.from("planning_tasks").insert({
      user_id: user.id, title: newTask.trim(),
      due_date: today, priority: "normal", status: "todo",
    }).select().single();
    if (error) { addToast("Erreur lors de la création de la tâche", "error"); setAddingTask(false); return; }
    if (data) setTasks(p => [parseTask(data as Record<string,unknown>), ...p]);
    setNewTask(""); setAddingTask(false);
  }

  async function toggleTask(t: PlanTask) {
    const next: TaskStatus = t.status === "done" ? "todo" : "done";
    const { error } = await supabase.from("planning_tasks").update({ status: next }).eq("id", t.id);
    if (error) { addToast("Erreur lors de la mise à jour de la tâche", "error"); return; }
    setTasks(p => p.map(x => x.id === t.id ? { ...x, status: next } : x));
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from("planning_tasks").delete().eq("id", id);
    if (error) { addToast("Erreur lors de la suppression de la tâche", "error"); return; }
    setTasks(p => p.filter(t => t.id !== id));
  }

    async function createGoal() {
    if (!newGoal.trim()) return;
    setAddingGoal(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddingGoal(false); return; }
    const { data } = await supabase.from("planning_goals").insert({
      user_id: user.id, title: newGoal.trim(), period: "week", progress: 0, status: "active",
    }).select().single();
    if (data) setGoals(p => [data as PlanGoal, ...p]);
    setNewGoal(""); setAddingGoal(false);
  }

  async function updateGoalProgress(id: string, progress: number) {
    const { error } = await supabase.from("planning_goals").update({ progress, status: progress >= 100 ? "done" : "active" }).eq("id", id);
    if (error) { addToast("Erreur lors de la mise à jour de l'objectif", "error"); return; }
    setGoals(p => p.map(g => g.id === id ? { ...g, progress, status: progress >= 100 ? "done" : "active" } : g));
  }

  async function deleteGoal(id: string) {
    const { error } = await supabase.from("planning_goals").delete().eq("id", id);
    if (error) { addToast("Erreur lors de la suppression de l'objectif", "error"); return; }
    setGoals(p => p.filter(g => g.id !== id));
  }

    async function runAI(prompt: string) {
    setAiLoading(true); setAiResult("");
    const today     = fmtDate(new Date());
    const todayEvs  = events.filter(e => fmtDate(new Date(e.start_at)) === today);
    const todayTasks = tasks.filter(t => t.due_date === today && t.status !== "done");
    const context = [
      `Date : ${today}`,
      `Événements du jour : ${todayEvs.map(e => `${e.title} (${new Date(e.start_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})})`).join(", ") || "Aucun"}`,
      `Tâches du jour : ${todayTasks.map(t => `${t.title} [${t.priority}]`).join(", ") || "Aucune"}`,
      `Objectifs semaine : ${goals.filter(g=>g.period==="week").map(g=>g.title).join(", ") || "Aucun"}`,
    ].join("\n");
    try {
      const r = await fetch("/api/notes/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"chat", content:context, prompt }),
      });
      const j = await r.json() as { result?: string; error?: string };
      if (!r.ok) { setAiResult(j.error ?? `Erreur ${r.status}`); return; }
      setAiResult(j.result ?? j.error ?? "Erreur");
    } catch { setAiResult("Erreur réseau"); }
    finally { setAiLoading(false); }
  }

  async function updateEventTime(id: string, start: Date, end: Date) {
    const { data, error } = await supabase.from("planning_events")
      .update({ start_at: start.toISOString(), end_at: end.toISOString() })
      .eq("id", id).select().single();
    if (error) { addToast("Erreur lors du déplacement", "error"); return; }
    if (data) {
      setEvents(p => p.map(e => e.id === id ? parseEvent(data as Record<string,unknown>) : e));
      addToast("Événement déplacé", "success");
    }
  }

  function exportICS() {
    const esc  = (s: string) => s.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");
    const fmtDT = (d: Date)  => d.toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
    const lines = [
      "BEGIN:VCALENDAR","VERSION:2.0",
      "PRODID:-//DJAMA Premium//Planning//FR","CALSCALE:GREGORIAN","METHOD:PUBLISH",
    ];
    for (const ev of events) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${ev.id}@djama.app`);
      lines.push(`DTSTART:${ev.is_all_day ? new Date(ev.start_at).toISOString().slice(0,10).replace(/-/g,"") : fmtDT(new Date(ev.start_at))}`);
      lines.push(`DTEND:${ev.is_all_day   ? new Date(ev.end_at).toISOString().slice(0,10).replace(/-/g,"") : fmtDT(new Date(ev.end_at))}`);
      lines.push(`SUMMARY:${esc(ev.title)}`);
      if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
      if (ev.location)    lines.push(`LOCATION:${esc(ev.location)}`);
      if (ev.meet_link)   lines.push(`URL:${ev.meet_link}`);
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type:"text/calendar;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "djama-planning.ics"; a.click();
    URL.revokeObjectURL(url);
  }

    const today = fmtDate(new Date());
  const todayTasks = tasks.filter(t => t.due_date === today);
  const doneTasks  = todayTasks.filter(t => t.status === "done");

  async function loadBookingConfig() {
    setBkLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBkLoading(false); return; }
    const { data } = await supabase.from("booking_pages").select("*").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
    if (data) {
      setBkToken(data.token as string);
      setBkTitle(data.title as string);
      setBkDesc(data.description as string);
      setBkDur(data.duration_minutes as number);
      setBkDays(data.available_days as number[]);
      setBkStart(data.start_hour as number);
      setBkEnd(data.end_hour as number);
    }
    setBkLoading(false);
  }

  async function saveBookingConfig() {
    setBkSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBkSaving(false); return; }
    const payload = {
      user_id: user.id,
      title: bkTitle.trim() || "Prendre un rendez-vous",
      description: bkDesc.trim(),
      duration_minutes: bkDur,
      available_days: bkDays,
      start_hour: bkStart,
      end_hour: bkEnd,
      is_active: true,
    };
    if (bkToken) {
      await supabase.from("booking_pages").update(payload).eq("token", bkToken);
    } else {
      const { data } = await supabase.from("booking_pages").insert(payload).select("token").single();
      if (data) setBkToken(data.token as string);
    }
    setBkSaving(false);
    addToast("Page de réservation sauvegardée", "success");
  }

  function renderBooking() {
    const GOLD = "#c9a55a";
    const bookingUrl = bkToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/booking/${bkToken}` : null;
    const DAY_NAMES = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
    const inputCls = isDark
      ? "w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
      : "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300";
    const selectCls = isDark
      ? "w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white focus:outline-none"
      : "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none";
    const labelCls = `block text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-white/30" : "text-gray-400"}`;

    if (bkLoading) return (
      <div className="flex items-center justify-center flex-1 py-20">
        <Loader2 size={24} className={`animate-spin ${isDark ? "text-white/20" : "text-gray-300"}`}/>
      </div>
    );

    return (
      <div className="flex-1 overflow-y-auto p-5 max-w-lg mx-auto w-full space-y-5">
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>Page de réservation</p>
          <p className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>Partagez un lien permettant à vos clients de prendre rendez-vous directement dans votre agenda.</p>
        </div>

        {/* Config form */}
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Titre</label>
            <input value={bkTitle} onChange={e => setBkTitle(e.target.value)}
              className={inputCls} placeholder="Prendre un rendez-vous"/>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={bkDesc} onChange={e => setBkDesc(e.target.value)} rows={2}
              className={inputCls + " resize-none"}
              placeholder="Décrivez le type de rendez-vous…"/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Durée (min)</label>
              <select value={bkDur} onChange={e => setBkDur(Number(e.target.value))} className={selectCls}>
                {[15,20,30,45,60,90,120].map(v => <option key={v} value={v}>{v} min</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Début</label>
              <select value={bkStart} onChange={e => setBkStart(Number(e.target.value))} className={selectCls}>
                {Array.from({length:13},(_,i)=>i+7).map(h => <option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fin</label>
              <select value={bkEnd} onChange={e => setBkEnd(Number(e.target.value))} className={selectCls}>
                {Array.from({length:13},(_,i)=>i+12).map(h => <option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls + " mb-2"}>Jours disponibles</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_NAMES.map((d, i) => (
                <button key={i} onClick={() => setBkDays(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev, i].sort())}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                  style={bkDays.includes(i)
                    ? { background:`${GOLD}20`, color:GOLD, borderColor:`${GOLD}40` }
                    : isDark
                      ? { background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.35)", borderColor:"rgba(255,255,255,0.08)" }
                      : { background:"rgba(0,0,0,0.03)", color:"rgba(0,0,0,0.45)", borderColor:"rgba(0,0,0,0.10)" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => void saveBookingConfig()} disabled={bkSaving}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: GOLD, color: "#09090b" }}>
          {bkSaving ? <Loader2 size={14} className="inline animate-spin mr-1.5"/> : null}
          {bkToken ? "Sauvegarder" : "Créer ma page de réservation"}
        </button>

        {/* Share link */}
        {bookingUrl && (
          <div className={`rounded-2xl border p-4 space-y-2 ${isDark ? "border-white/8 bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>Lien de réservation</p>
            <div className="flex items-center gap-2">
              <input readOnly value={bookingUrl}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs focus:outline-none truncate ${isDark ? "border-white/10 bg-white/[0.04] text-white/60" : "border-gray-200 bg-white text-gray-600"}`}/>
              <button onClick={() => { void navigator.clipboard.writeText(bookingUrl); setBkCopied(true); setTimeout(()=>setBkCopied(false), 2000); }}
                className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all"
                style={{ background:`${GOLD}18`, color:GOLD, border:`1px solid ${GOLD}30` }}>
                {bkCopied ? <Check size={12}/> : <ExternalLink size={12}/>}
                {bkCopied ? "Copié !" : "Copier"}
              </button>
            </div>
            <a href={bookingUrl} target="_blank" rel="noreferrer"
              className={`flex items-center gap-1.5 text-xs transition ${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}>
              <ExternalLink size={11}/> Aperçu de la page publique
            </a>
          </div>
        )}
      </div>
    );
  }

    function renderMonth() {
    const grid = getMonthGrid(current.getFullYear(), current.getMonth());
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className={`grid grid-cols-7 border-b ${isDark ? "border-white/6" : "border-gray-200"}`}>
          {DAYS_FR.map(d => (
            <div key={d} className={`py-2 text-center text-[11px] font-semibold uppercase tracking-wide ${isDark ? "text-white/30" : "text-gray-400"}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${grid.length}, 1fr)` }}>
          {grid.map((week, wi) => (
            <div key={wi} className={`grid grid-cols-7 border-b ${isDark ? "border-white/4" : "border-gray-100"}`}>
              {week.map((day, di) => {
                const isCurrentMonth = day.getMonth() === current.getMonth();
                const dayEvs = eventsOnDate(day).slice(0, 3);
                const overflow = eventsOnDate(day).length - 3;
                return (
                  <div key={di}
                    onClick={() => openCreate(day)}
                    className={`border-r p-1.5 min-h-[90px] cursor-pointer transition-colors ${isDark ? "border-white/4 hover:bg-white/4" : "border-gray-100 hover:bg-gray-50"} ${!isCurrentMonth ? "opacity-35" : ""}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-0.5 text-[11px] font-bold mx-auto transition-colors
                      ${isToday(day) ? "text-white" : isDark ? "text-white/55 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                      style={isToday(day) ? { background: INDIGO } : {}}>
                      {day.getDate()}
                    </div>
                    {holidays[fmtDate(day)] && (
                      <div className="text-[7px] text-amber-400/70 truncate leading-tight px-0.5 mb-0.5" title={holidays[fmtDate(day)]}>
                        ✦ {holidays[fmtDate(day)]}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {dayEvs.map(ev => (
                        <EventChip key={ev.id} ev={ev} small onClick={() => openEdit(ev)} />
                      ))}
                      {overflow > 0 && (
                        <p className={`text-[9px] pl-1 ${isDark ? "text-white/30" : "text-gray-400"}`}>+{overflow} autres</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

    function renderWeek() {
    const ws   = startOfWeek(current);
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className={`grid border-b ${isDark ? "border-white/6" : "border-gray-200"}`} style={{ gridTemplateColumns:"50px repeat(7,1fr)" }}>
          <div />
          {days.map(d => (
            <div key={d.toString()} className={`py-1.5 text-center border-l ${isDark ? "border-white/4" : "border-gray-100"}`}>
              <p className={`text-[10px] uppercase tracking-wide ${isDark ? "text-white/30" : "text-gray-400"}`}>{DAYS_FR[(d.getDay()+6)%7]}</p>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mt-0.5 ${isToday(d) ? "text-white" : isDark ? "text-white/60" : "text-gray-700"}`}
                style={isToday(d) ? { background: INDIGO } : {}}>
                {d.getDate()}
              </div>
              {holidays[fmtDate(d)] && (
                <div className="text-[7px] text-amber-400/60 truncate px-1 mt-0.5" title={holidays[fmtDate(d)]}>
                  ✦ {holidays[fmtDate(d)].length > 9 ? holidays[fmtDate(d)].slice(0,8)+"…" : holidays[fmtDate(d)]}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-1 overflow-y-auto">
          <div className="w-[50px] shrink-0 relative" style={{ height: HOURS.length * CELL_H }}>
            {HOURS.map(h => (
              <div key={h} className={`absolute w-full flex items-start justify-end pr-2 text-[9px] ${isDark ? "text-white/20" : "text-gray-400"}`}
                style={{ top: (h - START_H) * CELL_H - 7, height: CELL_H }}>
                {h}:00
              </div>
            ))}
          </div>

          <div className="flex-1 grid" style={{ gridTemplateColumns:"repeat(7,1fr)", height: HOURS.length * CELL_H }}>
            {days.map(d => {
              const dayEvs = eventsOnDate(d).filter(e => !e.is_all_day);
              return (
                <div key={d.toString()} className={`relative border-l ${isDark ? "border-white/4" : "border-gray-100"}`}>
                  {HOURS.map(h => {
                    const slotKey = `${fmtDate(d)}-${h}`;
                    return (
                      <div key={h}
                        style={{ top: (h - START_H) * CELL_H, height: CELL_H }}
                        className={`absolute inset-x-0 border-b transition-colors ${
                          dragOverKey === slotKey
                            ? "bg-indigo-500/20 border-indigo-500/40"
                            : dragEvId
                              ? `cursor-copy ${isDark ? "border-white/4 hover:bg-white/6" : "border-gray-100 hover:bg-gray-50"}`
                              : `cursor-pointer ${isDark ? "border-white/4 hover:bg-white/4" : "border-gray-100 hover:bg-gray-50"}`
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverKey(slotKey); }}
                        onDragLeave={() => setDragOverKey(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!dragEvId) return;
                          const newStart = new Date(d); newStart.setHours(h, 0, 0, 0);
                          const newEnd   = new Date(newStart.getTime() + dragDurRef.current);
                          void updateEventTime(dragEvId, newStart, newEnd);
                          setDragEvId(null); setDragOverKey(null);
                        }}
                        onClick={() => { if (!dragEvId) openCreate(d, h); }}
                      />
                    );
                  })}
                  {isToday(d) && (
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: isDark ? `${INDIGO}06` : `${INDIGO}08` }} />
                  )}
                  {dayEvs.map(ev => {
                    const s  = new Date(ev.start_at);
                    const e  = new Date(ev.end_at);
                    const sh = s.getHours() + s.getMinutes() / 60;
                    const eh = e.getHours() + e.getMinutes() / 60;
                    const top    = Math.max((sh - START_H) * CELL_H, 0);
                    const height = Math.max((eh - sh) * CELL_H, 20);
                    const hhmm   = `${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`;
                    const hasConflict = conflictIds.has(ev.id);
                    return (
                      <button key={ev.id}
                        draggable
                        onDragStart={(e2) => {
                          e2.stopPropagation();
                          setDragEvId(ev.id);
                          dragDurRef.current = new Date(ev.end_at).getTime() - new Date(ev.start_at).getTime();
                          e2.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => { setDragEvId(null); setDragOverKey(null); }}
                        onClick={e2 => { e2.stopPropagation(); if (!dragEvId) openEdit(ev); }}
                        className="absolute left-0.5 right-0.5 rounded-lg px-1.5 overflow-hidden text-left hover:opacity-90 transition-all z-10 select-none"
                        style={{
                          top, height,
                          background: `${ev.color}22`,
                          borderLeft: `3px solid ${hasConflict ? "#f87171" : ev.color}`,
                          cursor: dragEvId ? "grabbing" : "grab",
                          opacity: dragEvId === ev.id ? 0.4 : 1,
                          boxShadow: hasConflict ? "0 0 0 1px rgba(248,113,113,0.3)" : undefined,
                        }}>
                        {hasConflict && (
                          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-400" title="Conflit horaire" />
                        )}
                        <p className="text-[10px] font-semibold truncate leading-tight" style={{ color: ev.color }}>
                          {ev.title}
                        </p>
                        {height > 28 && (
                          <p className={`text-[9px] leading-none ${isDark ? "text-white/40" : "text-gray-600"}`}>{hhmm}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

    function renderAgenda() {
    const days: Date[] = Array.from({ length: 30 }, (_, i) => addDays(current, i));
    const withEvents  = days.filter(d => eventsOnDate(d).length > 0);
    if (withEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20">
          <Calendar size={32} className={isDark ? "text-white/15" : "text-gray-300"} />
          <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-500"}`}>Aucun événement dans les 30 prochains jours</p>
          <button onClick={() => openCreate()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background:`${INDIGO}18`, border:`1px solid ${INDIGO}35`, color:INDIGO }}>
            <Plus size={15}/>Créer un événement
          </button>
        </div>
      );
    }
    return (
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {withEvents.map(day => (
          <div key={fmtDate(day)}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isToday(day) ? "text-white" : isDark ? "text-white/60" : "text-gray-600"}`}
                style={isToday(day) ? { background: INDIGO } : { background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)" }}>
                {day.getDate()}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isToday(day) ? isDark ? "text-white" : "text-gray-900" : isDark ? "text-white/50" : "text-gray-600"}`}>
                  {DAYS_FR[(day.getDay()+6)%7]} {day.getDate()} {MONTHS_FR[day.getMonth()]}
                  {isToday(day) && <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background:`${INDIGO}20`, color:INDIGO }}>Aujourd&apos;hui</span>}
                </p>
              </div>
            </div>
            <div className="ml-11 space-y-2">
              {eventsOnDate(day).map(ev => {
                const s    = new Date(ev.start_at);
                const e    = new Date(ev.end_at);
                const hhmm = `${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`;
                const dur  = Math.round((e.getTime() - s.getTime()) / 60_000);
                const durS = dur >= 60 ? `${Math.floor(dur/60)}h${dur%60>0?String(dur%60).padStart(2,"0"):""}` : `${dur} min`;
                const EvType = EV_TYPES.find(t=>t.v===ev.event_type);
                const EvIcon = EvType?.icon ?? Calendar;
                return (
                  <button key={ev.id} onClick={() => openEdit(ev)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${isDark ? "hover:border-white/15" : "hover:border-gray-300"}`}
                    style={{ background:`${ev.color}0d`, borderColor:`${ev.color}25` }}>
                    <EvIcon size={14} className={`mt-0.5 shrink-0 ${isDark ? "text-white/40" : "text-gray-500"}`}/>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{ev.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`flex items-center gap-1 text-[11px] ${isDark ? "text-white/40" : "text-gray-500"}`}>
                          <Clock size={10}/>{ev.is_all_day ? "Toute la journée" : `${hhmm} · ${durS}`}
                        </span>
                        {ev.location && (
                          <span className={`flex items-center gap-1 text-[11px] ${isDark ? "text-white/35" : "text-gray-400"}`}>
                            <MapPin size={10}/>{ev.location}
                          </span>
                        )}
                        {ev.meet_link && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color:`${ev.color}cc` }}>
                            <Video size={10}/>Visio
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: ev.color }} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

    return (
    <DarkCtx.Provider value={isDark}>
    <div className={`flex h-[calc(100vh-56px)] overflow-hidden ${isDark ? "bg-[#07080e] text-white" : "bg-gray-50 text-gray-900"}`}>
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* ── Sidebar ── */}
      <div className={`hidden lg:flex w-64 xl:w-72 flex-col shrink-0 border-r overflow-y-auto ${isDark ? "border-white/6 bg-white/4" : "border-gray-200 bg-white"}`}>

        {/* Mini calendar */}
        <div className={`p-4 border-b ${isDark ? "border-white/6" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-bold ${isDark ? "text-white/60" : "text-gray-600"}`}>
              {MONTHS_FR[current.getMonth()].slice(0,3)} {current.getFullYear()}
            </p>
            <div className="flex gap-1">
              <button onClick={() => navigate(-1)} className={`p-1 rounded transition-all ${isDark ? "hover:bg-white/10 text-white/30 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}`}>
                <ChevronLeft size={12}/>
              </button>
              <button onClick={() => navigate(1)} className={`p-1 rounded transition-all ${isDark ? "hover:bg-white/10 text-white/30 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}`}>
                <ChevronRight size={12}/>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map(d => (
              <div key={d} className={`text-center text-[9px] font-semibold ${isDark ? "text-white/25" : "text-gray-400"}`}>{d[0]}</div>
            ))}
          </div>
          {getMonthGrid(current.getFullYear(), current.getMonth()).map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                const hasEv = eventsOnDate(day).length > 0;
                const isCur = isSameDay(day, current);
                return (
                  <button key={di}
                    onClick={() => { setCurrent(day); if (view !== "month") setView("week"); }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all mx-auto my-0.5
                      ${isCur ? "text-white" : isToday(day) ? "font-bold" : day.getMonth()===current.getMonth() ? isDark ? "text-white/50 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : isDark ? "text-white/15" : "text-gray-300"}`}
                    style={{
                      background: isCur ? INDIGO : isToday(day) && !isCur ? `${INDIGO}30` : undefined,
                      color: isToday(day) && !isCur ? INDIGO : undefined,
                    }}>
                    {day.getDate()}
                    {hasEv && !isCur && (
                      <span className="absolute w-1 h-1 rounded-full bottom-0.5" style={{ background: INDIGO }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className={`p-4 border-b ${isDark ? "border-white/6" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? "text-white/50" : "text-gray-600"}`}>
              <CheckCircle2 size={12}/>Tâches du jour
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/8 text-white/35" : "bg-gray-100 text-gray-500"}`}>
                {doneTasks.length}/{todayTasks.length}
              </span>
            </p>
          </div>
          {todayTasks.length > 0 && (
            <div className={`h-1 rounded-full mb-3 overflow-hidden ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
              <div className="h-full rounded-full transition-all"
                style={{ width:`${todayTasks.length ? Math.round(doneTasks.length/todayTasks.length*100) : 0}%`, background:INDIGO }} />
            </div>
          )}
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {todayTasks.slice(0, 8).map(t => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t)} onDelete={() => deleteTask(t.id)} />
            ))}
            {todayTasks.length === 0 && (
              <p className={`text-[10px] py-1 ${isDark ? "text-white/20" : "text-gray-400"}`}>Aucune tâche pour aujourd&apos;hui</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <input value={newTask} onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createTask(); }}
              placeholder="+ Ajouter une tâche…"
              className={`flex-1 bg-transparent text-[11px] focus:outline-none ${isDark ? "text-white/55 placeholder:text-white/20" : "text-gray-600 placeholder:text-gray-400"}`} />
            {newTask && (
              <button onClick={createTask} disabled={addingTask}
                className="p-1 rounded-lg transition-all"
                style={{ background:`${INDIGO}20`, color:INDIGO }}>
                {addingTask ? <Loader2 size={10} className="animate-spin"/> : <Check size={10}/>}
              </button>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? "text-white/50" : "text-gray-600"}`}>
              <Target size={12}/>Objectifs semaine
            </p>
          </div>
          <div className="space-y-3 max-h-52 overflow-y-auto">
            {goals.filter(g => g.period === "week" && g.status !== "abandoned").map(g => (
              <div key={g.id} className="group">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-xs truncate ${g.status==="done" ? `line-through ${isDark ? "text-white/25" : "text-gray-400"}` : isDark ? "text-white/65" : "text-gray-700"}`}>
                    {g.title}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{g.progress}%</span>
                    <button onClick={() => deleteGoal(g.id)}
                      className={`opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ${isDark ? "text-white/15" : "text-gray-300"}`}>
                      <X size={10}/>
                    </button>
                  </div>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden cursor-pointer ${isDark ? "bg-white/8" : "bg-gray-100"}`}
                  onClick={e => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const pct  = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    updateGoalProgress(g.id, Math.max(0, Math.min(100, pct)));
                  }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width:`${g.progress}%`, background: g.status==="done" ? "#34d399" : INDIGO }} />
                </div>
              </div>
            ))}
            {goals.filter(g=>g.period==="week"&&g.status!=="abandoned").length === 0 && (
              <p className={`text-[10px] ${isDark ? "text-white/20" : "text-gray-400"}`}>Aucun objectif cette semaine</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createGoal(); }}
              placeholder="+ Ajouter un objectif…"
              className={`flex-1 bg-transparent text-[11px] focus:outline-none ${isDark ? "text-white/55 placeholder:text-white/20" : "text-gray-600 placeholder:text-gray-400"}`} />
            {newGoal && (
              <button onClick={createGoal} disabled={addingGoal}
                className="p-1 rounded-lg" style={{ background:`${INDIGO}20`, color:INDIGO }}>
                {addingGoal ? <Loader2 size={10} className="animate-spin"/> : <Check size={10}/>}
              </button>
            )}
          </div>
        </div>
      </div>

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Animated header */}
        <div className={`relative overflow-hidden shrink-0 border-b ${isDark ? "bg-[#07080e] border-white/6" : "bg-white border-gray-200"}`}>
          {isDark && (
            <div className="pointer-events-none">
              <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#c9a55a,transparent)" }}/>
              <div className="absolute -bottom-8 right-16 h-24 w-24 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#6366f1,transparent)" }}/>
            </div>
          )}

          {/* Main row */}
          <div className="relative flex items-center gap-2 px-4 pt-3 pb-2">
            <div className="flex items-center gap-0.5">
              <button onClick={() => navigate(-1)} className={`p-1.5 rounded-lg transition-all ${isDark ? "text-white/40 hover:text-white hover:bg-white/8" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
                <ChevronLeft size={15}/>
              </button>
              <button onClick={() => setCurrent(new Date())} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${isDark ? "text-white/40 hover:text-white hover:bg-white/8" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}>
                Aujourd&apos;hui
              </button>
              <button onClick={() => navigate(1)} className={`p-1.5 rounded-lg transition-all ${isDark ? "text-white/40 hover:text-white hover:bg-white/8" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
                <ChevronRight size={15}/>
              </button>
            </div>
            <h2 className={`text-[10px] sm:text-sm font-bold mr-auto whitespace-nowrap overflow-hidden text-ellipsis min-w-0 ${isDark ? "text-white" : "text-gray-900"}`}>{headerLabel}</h2>
            <button onClick={exportICS} title="Exporter ICS (Google Calendar / Outlook)"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${isDark ? "border-white/8 text-white/40 hover:text-white/70 hover:border-white/20" : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
              <Download size={12}/> ICS
            </button>
            <button onClick={() => setShowAI(p => !p)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${showAI
                ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                : isDark ? "border-white/8 text-white/50 hover:border-violet-500/30 hover:text-violet-300" : "border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600"}`}>
              <Sparkles size={12}/><span className="hidden sm:inline"> IA</span><span className="sm:hidden">IA</span><span className="hidden sm:inline"> Planning</span>
            </button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => openCreate()}
              className="flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a", boxShadow: "0 2px 12px rgba(201,165,90,0.28)" }}>
              <Plus size={13}/><span className="hidden sm:inline"> Événement</span>
            </motion.button>
          </div>

          {/* KPI strip */}
          <div className="relative px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {[
                { label: "Total",       value: events.length,                                                                                                                                     icon: Calendar,      accent: "#c9a55a" },
                { label: "Aujourd'hui", value: events.filter(e => fmtDate(new Date(e.start_at)) === today).length,                                                                                icon: Clock,         accent: "#c9a55a" },
                { label: "Semaine",     value: events.filter(e => { const d = fmtDate(new Date(e.start_at)); const ws = fmtDate(startOfWeek(new Date())); const we = fmtDate(addDays(startOfWeek(new Date()), 6)); return d >= ws && d <= we; }).length, icon: Target,        accent: "#c9a55a" },
                { label: "Tâches",      value: todayTasks.length,                                                                                                                                 icon: CheckCircle2,  accent: "#c9a55a" },
                { label: "Conflits",    value: conflictIds.size,                                                                                                                                  icon: AlertTriangle, accent: conflictIds.size > 0 ? "#f87171" : "#c9a55a" },
              ].map((kpi, i) => {
                const KpiIcon = kpi.icon;
                return (
                  <motion.div key={kpi.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border ${isDark ? "border-white/6 bg-white/4" : "border-gray-200 bg-white"}`}>
                    <KpiIcon size={11} style={{ color: kpi.accent }} className="shrink-0"/>
                    <div>
                      <p className={`text-xs font-bold leading-none ${isDark ? "text-white" : "text-gray-900"}`}>{kpi.value}</p>
                      <p className={`text-[0.55rem] uppercase tracking-wide mt-0.5 whitespace-nowrap ${isDark ? "text-white/35" : "text-gray-400"}`}>{kpi.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* View tabs */}
          <div className="relative px-4 flex gap-0.5">
            {(["month", "week", "agenda", "booking"] as CalView[]).map((v) => (
              <button key={v} onClick={() => { setView(v); if (v === "booking" && !bkLoading) void loadBookingConfig(); }}
                className={`relative px-3 py-2 text-xs font-semibold transition-all ${view === v ? isDark ? "text-white" : "text-gray-900" : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}>
                {v === "month" ? "Mois" : v === "week" ? "Semaine" : v === "agenda" ? "Agenda" : "Réservation"}
                {view === v && (
                  <motion.div layoutId="plan-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "#c9a55a" }}/>
                )}
              </button>
            ))}
          </div>

          {/* Gold bottom line */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" }}/>
        </div>

        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
              className={`border-b overflow-hidden shrink-0 ${isDark ? "border-white/6 bg-[#07080e]" : "border-gray-200 bg-white"}`}>
              <div className="px-5 py-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {([
                    { Icon:Calendar,  l:"Organise ma journée", p:"Organise ma journée de manière optimale en tenant compte des événements et tâches du jour. Propose un emploi du temps heure par heure." },
                    { Icon:Zap,       l:"Tâches urgentes",     p:"Identifie les tâches urgentes et les deadlines critiques. Donne-moi les 3 priorités absolues aujourd'hui." },
                    { Icon:Clock,     l:"Temps libre",         p:"Identifie les créneaux libres dans ma journée et suggère comment les utiliser intelligemment." },
                    { Icon:BarChart2, l:"Analyse semaine",     p:"Analyse mon planning de la semaine. Suis-je sur la bonne voie pour mes objectifs ? Quels ajustements suggères-tu ?" },
                  ] as {Icon:LucideIcon;l:string;p:string}[]).map(a => (
                    <button key={a.l} onClick={() => runAI(a.p)} disabled={aiLoading}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all disabled:opacity-50 border ${isDark ? "border-white/8 hover:border-white/20 text-white/55 hover:text-white" : "border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800"}`}>
                      {aiLoading ? <Loader2 size={11} className="animate-spin"/> : <a.Icon size={11}/>}
                      {a.l}
                    </button>
                  ))}
                </div>
                {aiLoading && (
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>
                    <Loader2 size={12} className="animate-spin"/> Analyse en cours…
                  </div>
                )}
                {aiResult && (
                  <div className={`rounded-xl border p-3 text-xs whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto ${isDark ? "border-white/10 text-white/65" : "border-indigo-200 text-gray-700"}`}
                    style={{ background:`${INDIGO}08` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs flex items-center gap-1" style={{ color:INDIGO }}>
                        <Zap size={11}/>Suggestion IA
                      </span>
                      <button onClick={() => setAiResult("")} className={isDark ? "text-white/25 hover:text-white" : "text-gray-400 hover:text-gray-700"}>
                        <X size={11}/>
                      </button>
                    </div>
                    {aiResult}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 size={24} className={`animate-spin ${isDark ? "text-white/20" : "text-gray-300"}`}/>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {view === "month"   && renderMonth()}
            {view === "week"    && renderWeek()}
            {view === "agenda"  && renderAgenda()}
            {view === "booking" && renderBooking()}
          </div>
        )}
      </div>

            <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
              onClick={() => setShowModal(false)} />

            <motion.div
              initial={{opacity:0, scale:0.95, y:12}}
              animate={{opacity:1, scale:1, y:0}}
              exit={{opacity:0, scale:0.95, y:12}}
              className={`fixed inset-x-4 top-[5%] bottom-[5%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${isDark ? "border-white/8 bg-[#0e1420]" : "border-gray-200 bg-white"}`}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
                <div className="relative">
                  <button onClick={() => setShowColPal(p => !p)}
                    className={`w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 ${isDark ? "border-white/10" : "border-gray-200"}`}
                    style={{ background: form.color ?? INDIGO }} />
                  <AnimatePresence>
                    {showColPal && (
                      <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0}}
                        className={`absolute top-10 left-0 flex flex-wrap gap-1.5 p-2 rounded-xl border shadow-2xl z-10 w-32 ${isDark ? "border-white/10 bg-[#0e1420]" : "border-gray-200 bg-white"}`}>
                        {EV_COLORS.map(c => (
                          <button key={c}
                            onClick={() => { setForm(p => ({...p, color:c})); setShowColPal(false); }}
                            className="w-6 h-6 rounded-lg border-2 hover:scale-110 transition-transform"
                            style={{ background:c, borderColor:(form.color===c ? "#fff" : "transparent") }} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-1 flex-wrap flex-1">
                  {EV_TYPES.map(t => {
                    const TIcon = t.icon;
                    return (
                      <button key={t.v} onClick={() => setForm(p => ({...p, event_type:t.v}))}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: form.event_type===t.v ? `${form.color ?? INDIGO}22` : isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)",
                          color:      form.event_type===t.v ? (form.color ?? INDIGO) : isDark ? "rgba(255,255,255,.4)" : "rgba(0,0,0,.45)",
                          border:     `1px solid ${form.event_type===t.v ? `${form.color ?? INDIGO}35` : "transparent"}`,
                        }}>
                        <TIcon size={10}/>{t.l}
                      </button>
                    );
                  })}
                </div>

                <button onClick={() => setShowModal(false)}
                  className={`p-1.5 rounded-lg transition-all ml-auto ${isDark ? "text-white/30 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
                  <X size={16}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
                <input value={form.title ?? ""} onChange={e => setForm(p => ({...p, title:e.target.value}))}
                  placeholder="Titre de l'événement *"
                  className={`w-full bg-transparent text-lg font-bold focus:outline-none border-b pb-2 ${formErrors.title ? "border-red-400" : isDark ? "border-white/6" : "border-gray-200"} ${isDark ? "text-white placeholder:text-white/20" : "text-gray-900 placeholder:text-gray-300"}`} />
                {formErrors.title && <p className="text-[10px] text-red-400 mt-0.5">{formErrors.title}</p>}

                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(p => ({...p, is_all_day:!p.is_all_day}))}
                    className={`w-9 h-5 rounded-full transition-all ${form.is_all_day ? "" : isDark ? "bg-white/10" : "bg-gray-200"}`}
                    style={form.is_all_day ? { background:form.color ?? INDIGO } : {}}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all mx-0.5 ${form.is_all_day ? "translate-x-4" : "translate-x-0"}`}/>
                  </button>
                  <span className={`text-xs ${isDark ? "text-white/45" : "text-gray-500"}`}>Toute la journée</span>
                </div>

                {form.is_all_day ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label:"Début", key:"start_at" as const },
                      { label:"Fin",   key:"end_at"   as const },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-1">
                        <label className={`text-[10px] uppercase tracking-wide ${isDark ? "text-white/35" : "text-gray-400"}`}>{label}</label>
                        <input type="date" value={(form[key] ?? "").slice(0,10)}
                          onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none appearance-none ${isDark ? "bg-white/6 border-white/8 text-white focus:border-white/20 [color-scheme:dark]" : "bg-white border-gray-200 text-gray-900 focus:border-gray-300 [color-scheme:light]"}`}/>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label:"Début", key:"start_at" as const },
                      { label:"Fin",   key:"end_at"   as const },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-1">
                        <label className={`text-[10px] uppercase tracking-wide ${isDark ? "text-white/35" : "text-gray-400"}`}>{label}</label>
                        <input type="datetime-local" value={form[key] ?? ""}
                          onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${key === "end_at" && formErrors.end_at ? "border-red-400" : isDark ? "border-white/8" : "border-gray-200"} ${isDark ? "bg-white/6 text-white focus:border-white/20 [color-scheme:dark]" : "bg-white text-gray-900 focus:border-gray-300 [color-scheme:light]"}`}/>
                        {key === "end_at" && formErrors.end_at && (
                          <p className="text-[10px] text-red-400">{formErrors.end_at}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {[
                  { icon: MapPin,    key: "location"   as const, placeholder: "Lieu (optionnel)" },
                  { icon: Video,     key: "meet_link"  as const, placeholder: "Lien visioconférence (optionnel)" },
                ].map(({ icon: Icon, key, placeholder }) => (
                  <div key={key} className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${isDark ? "bg-white/4 border-white/6" : "bg-gray-50 border-gray-200"}`}>
                    <Icon size={13} className={`shrink-0 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
                    <input value={(form[key] ?? "") as string} onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                      placeholder={placeholder}
                      className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? "text-white/70 placeholder:text-white/20" : "text-gray-700 placeholder:text-gray-400"}`}/>
                  </div>
                ))}

                <div className={`flex items-start gap-2 border rounded-xl px-3 py-2 ${isDark ? "bg-white/4 border-white/6" : "bg-gray-50 border-gray-200"}`}>
                  <AlignLeft size={13} className={`shrink-0 mt-0.5 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
                  <textarea value={form.description ?? ""} onChange={e => setForm(p => ({...p, description:e.target.value}))}
                    placeholder="Description (optionnel)" rows={3}
                    className={`flex-1 bg-transparent text-sm focus:outline-none resize-none leading-relaxed ${isDark ? "text-white/70 placeholder:text-white/20" : "text-gray-700 placeholder:text-gray-400"}`}/>
                </div>

                <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${isDark ? "bg-white/4 border-white/6" : "bg-gray-50 border-gray-200"}`}>
                  <Tag size={13} className={`shrink-0 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
                  <input
                    value={(form.participants ?? []).join(", ")}
                    onChange={e => setForm(p => ({...p, participants:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}))}
                    placeholder="Participants (séparés par virgule)"
                    className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? "text-white/70 placeholder:text-white/20" : "text-gray-700 placeholder:text-gray-400"}`}/>
                </div>

                <div className="flex items-center gap-2">
                  <Bell size={13} className={isDark ? "text-white/25" : "text-gray-400"}/>
                  <span className={`text-xs ${isDark ? "text-white/35" : "text-gray-500"}`}>Rappel</span>
                  <select value={form.reminder_minutes ?? 30}
                    onChange={e => setForm(p => ({...p, reminder_minutes: Number(e.target.value)}))}
                    className={`ml-auto cursor-pointer rounded-xl border px-3 py-1.5 text-xs outline-none appearance-none ${isDark ? "border-white/8 bg-[#0e1420] text-white/55" : "border-gray-200 bg-white text-gray-600"}`}>
                    <option value={0}>Aucun</option>
                    <option value={5}>5 min avant</option>
                    <option value={15}>15 min avant</option>
                    <option value={30}>30 min avant</option>
                    <option value={60}>1 h avant</option>
                    <option value={1440}>1 jour avant</option>
                  </select>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-5 py-4 border-t shrink-0 ${isDark ? "border-white/6" : "border-gray-200"}`}>
                {editEvent && (
                  <button onClick={() => deleteEvent(editEvent.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={13}/>Supprimer
                  </button>
                )}
                {editEvent && (() => {
                  const fmtGcal = (d: string) => new Date(d).toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
                  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE`
                    + `&text=${encodeURIComponent(editEvent.title)}`
                    + `&dates=${fmtGcal(editEvent.start_at)}/${fmtGcal(editEvent.end_at)}`
                    + (editEvent.description ? `&details=${encodeURIComponent(editEvent.description)}` : "");
                  return (
                    <a href={gcalUrl} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs hover:text-indigo-400 hover:bg-indigo-500/10 transition-all ${isDark ? "text-white/40" : "text-gray-400"}`}>
                      <ExternalLink size={12}/>Google Cal
                    </a>
                  );
                })()}
                <button onClick={() => setShowModal(false)}
                  className={`ml-auto px-4 py-2 rounded-xl text-xs transition-all ${isDark ? "text-white/40 hover:text-white hover:bg-white/8" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}>
                  Annuler
                </button>
                <button onClick={saveEvent} disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: form.color ?? INDIGO, color:"#fff" }}>
                  {saving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                  {saving ? "Sauvegarde…" : editEvent ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </DarkCtx.Provider>
  );
}
