"use client";
/**
 * Planning — Calendrier IA · Tâches · Objectifs · Réunions
 * Vues : mois / semaine / agenda
 */

import React, {
  useState, useEffect, useCallback, useMemo,
} from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X, Check, Loader2,
  MapPin, Bell, Trash2, Clock, Target, Sparkles,
  CheckCircle2, Circle, AlertCircle, Zap, Video,
  Tag, AlignLeft, Calendar, Users, BarChart2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ══════════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════════ */
type EventType    = "event" | "meeting" | "task" | "reminder";
type TaskStatus   = "todo" | "in_progress" | "done" | "late";
type TaskPriority = "low" | "normal" | "high" | "urgent";
type CalView      = "month" | "week" | "agenda";

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

/* ══════════════════════════════════════════════════════════
   Constants
══════════════════════════════════════════════════════════ */
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
const CELL_H = 60; // px per hour
const START_H = 7;

/* ══════════════════════════════════════════════════════════
   Date helpers
══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
   Empty form factories
══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
   Sub-components
══════════════════════════════════════════════════════════ */
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
      <span className={`flex-1 text-xs truncate ${done ? "line-through text-white/25" : "text-white/70"}`}>
        {task.title}
      </span>
      <button onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-white/20 hover:text-red-400 transition-all">
        <X size={11} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════ */
export default function PlanningPage() {
  /* ── State ── */
  const [view,       setView]       = useState<CalView>("week");
  const [current,    setCurrent]    = useState(new Date());
  const [events,     setEvents]     = useState<PlanEvent[]>([]);
  const [tasks,      setTasks]      = useState<PlanTask[]>([]);
  const [goals,      setGoals]      = useState<PlanGoal[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [toastData,  setToastData]  = useState<ToastData | null>(null);

  /* modal */
  const [showModal,  setShowModal]  = useState(false);
  const [editEvent,  setEditEvent]  = useState<PlanEvent | null>(null);
  const [form,       setForm]       = useState<Partial<PlanEvent>>(newEventForm());
  const [saving,     setSaving]     = useState(false);
  const [showColPal, setShowColPal] = useState(false);

  /* task quick-add */
  const [newTask,    setNewTask]    = useState("");
  const [addingTask, setAddingTask] = useState(false);

  /* goal quick-add */
  const [newGoal,    setNewGoal]    = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  /* AI */
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiResult,   setAiResult]   = useState("");
  const [showAI,     setShowAI]     = useState(false);

  /* ── Load ── */
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const [evR, tkR, goR] = await Promise.all([
      supabase.from("planning_events").select("*").eq("user_id", user.id).order("start_at"),
      supabase.from("planning_tasks").select("*").eq("user_id", user.id).order("due_date").order("created_at"),
      supabase.from("planning_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setEvents((evR.data ?? []).map(r => parseEvent(r as Record<string,unknown>)));
    setTasks((tkR.data ?? []).map(r => parseTask(r as Record<string,unknown>)));
    setGoals((goR.data ?? []) as PlanGoal[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Navigation ── */
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

  /* ── Events helpers ── */
  const eventsOnDate = useCallback((date: Date) => {
    const ds = fmtDate(date);
    return events.filter(ev => {
      const s = fmtDate(new Date(ev.start_at));
      const e = fmtDate(new Date(ev.end_at));
      return ds >= s && ds <= e;
    });
  }, [events]);

  /* ── CRUD events ── */
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
    if (!form.title?.trim()) return;
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
      if (!error && data) {
        setEvents(p => p.map(e => e.id === editEvent.id ? parseEvent(data as Record<string,unknown>) : e));
        setToastData({ type:"success", msg:"Événement mis à jour" });
      }
    } else {
      const { data, error } = await supabase
        .from("planning_events").insert(payload).select().single();
      if (!error && data) {
        setEvents(p => [parseEvent(data as Record<string,unknown>), ...p]);
        setToastData({ type:"success", msg:"Événement créé" });
      }
      if (error) setToastData({ type:"error", msg:"Erreur de sauvegarde" });
    }
    setSaving(false);
    setShowModal(false);
  }

  async function deleteEvent(id: string) {
    await supabase.from("planning_events").delete().eq("id", id);
    setEvents(p => p.filter(e => e.id !== id));
    setShowModal(false);
    setToastData({ type:"success", msg:"Supprimé" });
  }

  /* ── CRUD tasks ── */
  async function createTask() {
    if (!newTask.trim()) return;
    setAddingTask(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddingTask(false); return; }
    const today = fmtDate(new Date());
    const { data } = await supabase.from("planning_tasks").insert({
      user_id: user.id, title: newTask.trim(),
      due_date: today, priority: "normal", status: "todo",
    }).select().single();
    if (data) setTasks(p => [parseTask(data as Record<string,unknown>), ...p]);
    setNewTask(""); setAddingTask(false);
  }

  async function toggleTask(t: PlanTask) {
    const next: TaskStatus = t.status === "done" ? "todo" : "done";
    await supabase.from("planning_tasks").update({ status: next }).eq("id", t.id);
    setTasks(p => p.map(x => x.id === t.id ? { ...x, status: next } : x));
  }

  async function deleteTask(id: string) {
    await supabase.from("planning_tasks").delete().eq("id", id);
    setTasks(p => p.filter(t => t.id !== id));
  }

  /* ── CRUD goals ── */
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
    await supabase.from("planning_goals").update({ progress, status: progress >= 100 ? "done" : "active" }).eq("id", id);
    setGoals(p => p.map(g => g.id === id ? { ...g, progress, status: progress >= 100 ? "done" : "active" } : g));
  }

  async function deleteGoal(id: string) {
    await supabase.from("planning_goals").delete().eq("id", id);
    setGoals(p => p.filter(g => g.id !== id));
  }

  /* ── AI ── */
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
      setAiResult(j.result ?? j.error ?? "Erreur");
    } catch { setAiResult("Erreur réseau"); }
    finally { setAiLoading(false); }
  }

  /* ── Today's stats ── */
  const today = fmtDate(new Date());
  const todayTasks = tasks.filter(t => t.due_date === today);
  const doneTasks  = todayTasks.filter(t => t.status === "done");

  /* ══════════════════════════════════════════════════════
     VIEWS
  ══════════════════════════════════════════════════════ */

  /* Month view */
  function renderMonth() {
    const grid = getMonthGrid(current.getFullYear(), current.getMonth());
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DAYS_FR.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-white/30 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        {/* Weeks */}
        <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${grid.length}, 1fr)` }}>
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-white/[0.04]">
              {week.map((day, di) => {
                const isCurrentMonth = day.getMonth() === current.getMonth();
                const dayEvs = eventsOnDate(day).slice(0, 3);
                const overflow = eventsOnDate(day).length - 3;
                return (
                  <div key={di}
                    onClick={() => openCreate(day)}
                    className={`border-r border-white/[0.04] p-1.5 min-h-[90px] cursor-pointer transition-colors hover:bg-white/[0.02] ${!isCurrentMonth ? "opacity-35" : ""}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px] font-bold mx-auto transition-colors
                      ${isToday(day)
                        ? "text-white"
                        : "text-white/55 hover:text-white"}`}
                      style={isToday(day) ? { background: INDIGO } : {}}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvs.map(ev => (
                        <EventChip key={ev.id} ev={ev} small onClick={() => openEdit(ev)} />
                      ))}
                      {overflow > 0 && (
                        <p className="text-[9px] text-white/30 pl-1">+{overflow} autres</p>
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

  /* Week view */
  function renderWeek() {
    const ws   = startOfWeek(current);
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Day headers */}
        <div className="grid border-b border-white/[0.06]" style={{ gridTemplateColumns:"50px repeat(7,1fr)" }}>
          <div />
          {days.map(d => (
            <div key={d.toString()} className="py-2 text-center border-l border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase tracking-wide">{DAYS_FR[(d.getDay()+6)%7]}</p>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mt-0.5 ${isToday(d) ? "text-white" : "text-white/60"}`}
                style={isToday(d) ? { background: INDIGO } : {}}>
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex flex-1 overflow-y-auto">
          {/* Hour labels */}
          <div className="w-[50px] shrink-0 relative" style={{ height: HOURS.length * CELL_H }}>
            {HOURS.map(h => (
              <div key={h} className="absolute w-full flex items-start justify-end pr-2 text-[9px] text-white/20"
                style={{ top: (h - START_H) * CELL_H - 7, height: CELL_H }}>
                {h}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 grid" style={{ gridTemplateColumns:"repeat(7,1fr)", height: HOURS.length * CELL_H }}>
            {days.map(d => {
              const dayEvs = eventsOnDate(d).filter(e => !e.is_all_day);
              return (
                <div key={d.toString()} className="relative border-l border-white/[0.04]">
                  {/* Hour lines */}
                  {HOURS.map(h => (
                    <div key={h}
                      style={{ top: (h - START_H) * CELL_H, height: CELL_H }}
                      className="absolute inset-x-0 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.015] transition-colors"
                      onClick={() => openCreate(d, h)}
                    />
                  ))}
                  {/* Today highlight */}
                  {isToday(d) && (
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background:`${INDIGO}06` }} />
                  )}
                  {/* Events */}
                  {dayEvs.map(ev => {
                    const s  = new Date(ev.start_at);
                    const e  = new Date(ev.end_at);
                    const sh = s.getHours() + s.getMinutes() / 60;
                    const eh = e.getHours() + e.getMinutes() / 60;
                    const top    = Math.max((sh - START_H) * CELL_H, 0);
                    const height = Math.max((eh - sh) * CELL_H, 20);
                    const hhmm   = `${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`;
                    return (
                      <button key={ev.id}
                        onClick={e2 => { e2.stopPropagation(); openEdit(ev); }}
                        className="absolute left-0.5 right-0.5 rounded-lg px-1.5 overflow-hidden text-left cursor-pointer hover:opacity-90 transition-opacity z-10"
                        style={{ top, height, background:`${ev.color}22`, borderLeft:`3px solid ${ev.color}` }}>
                        <p className="text-[10px] font-semibold truncate leading-tight" style={{ color: ev.color }}>
                          {ev.title}
                        </p>
                        {height > 28 && (
                          <p className="text-[9px] text-white/40 leading-none">{hhmm}</p>
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

  /* Agenda view */
  function renderAgenda() {
    const days: Date[] = Array.from({ length: 30 }, (_, i) => addDays(current, i));
    const withEvents  = days.filter(d => eventsOnDate(d).length > 0);
    if (withEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20">
          <Calendar size={32} className="text-white/15" />
          <p className="text-white/30 text-sm">Aucun événement dans les 30 prochains jours</p>
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isToday(day) ? "text-white" : "text-white/60"}`}
                style={isToday(day) ? { background: INDIGO } : { background:"rgba(255,255,255,.06)" }}>
                {day.getDate()}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isToday(day) ? "text-white" : "text-white/50"}`}>
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
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all hover:border-white/15"
                    style={{ background:`${ev.color}0d`, borderColor:`${ev.color}25` }}>
                    <EvIcon size={14} className="text-white/40 mt-0.5 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-white/40">
                          <Clock size={10}/>{ev.is_all_day ? "Toute la journée" : `${hhmm} · ${durS}`}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1 text-[11px] text-white/35">
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

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#080a0f] overflow-hidden text-white">
      <AnimatePresence>
        {toastData && <Toast toast={toastData} onClose={() => setToastData(null)} />}
      </AnimatePresence>

      {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
      <div className="hidden lg:flex w-64 xl:w-72 flex-col shrink-0 border-r border-white/[0.06] bg-[#0b0d14] overflow-y-auto">

        {/* Mini calendar */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white/60">
              {MONTHS_FR[current.getMonth()].slice(0,3)} {current.getFullYear()}
            </p>
            <div className="flex gap-1">
              <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white transition-all">
                <ChevronLeft size={12}/>
              </button>
              <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white transition-all">
                <ChevronRight size={12}/>
              </button>
            </div>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-[9px] text-white/25 font-semibold">{d[0]}</div>
            ))}
          </div>
          {/* Days */}
          {getMonthGrid(current.getFullYear(), current.getMonth()).map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                const hasEv = eventsOnDate(day).length > 0;
                const isCur = isSameDay(day, current);
                return (
                  <button key={di}
                    onClick={() => { setCurrent(day); if (view !== "month") setView("week"); }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all mx-auto my-0.5
                      ${isCur ? "text-white" : isToday(day) ? "font-bold" : day.getMonth()===current.getMonth() ? "text-white/50 hover:text-white hover:bg-white/10" : "text-white/15"}`}
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

        {/* Today's tasks */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-white/50 flex items-center gap-1.5">
              <CheckCircle2 size={12}/>Tâches du jour
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/35">
                {doneTasks.length}/{todayTasks.length}
              </span>
            </p>
          </div>
          {/* Progress bar */}
          {todayTasks.length > 0 && (
            <div className="h-1 bg-white/8 rounded-full mb-3 overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width:`${todayTasks.length ? Math.round(doneTasks.length/todayTasks.length*100) : 0}%`, background:INDIGO }} />
            </div>
          )}
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {todayTasks.slice(0, 8).map(t => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t)} onDelete={() => deleteTask(t.id)} />
            ))}
            {todayTasks.length === 0 && (
              <p className="text-[10px] text-white/20 py-1">Aucune tâche pour aujourd&apos;hui</p>
            )}
          </div>
          {/* Quick add task */}
          <div className="flex items-center gap-1.5 mt-2">
            <input value={newTask} onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createTask(); }}
              placeholder="+ Ajouter une tâche…"
              className="flex-1 bg-transparent text-[11px] text-white/55 placeholder:text-white/20 focus:outline-none" />
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
            <p className="text-xs font-bold text-white/50 flex items-center gap-1.5">
              <Target size={12}/>Objectifs semaine
            </p>
          </div>
          <div className="space-y-3 max-h-52 overflow-y-auto">
            {goals.filter(g => g.period === "week" && g.status !== "abandoned").map(g => (
              <div key={g.id} className="group">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-xs truncate ${g.status==="done" ? "line-through text-white/25" : "text-white/65"}`}>
                    {g.title}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-white/25">{g.progress}%</span>
                    <button onClick={() => deleteGoal(g.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all">
                      <X size={10}/>
                    </button>
                  </div>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden cursor-pointer"
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
              <p className="text-[10px] text-white/20">Aucun objectif cette semaine</p>
            )}
          </div>
          {/* Quick add goal */}
          <div className="flex items-center gap-1.5 mt-3">
            <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createGoal(); }}
              placeholder="+ Ajouter un objectif…"
              className="flex-1 bg-transparent text-[11px] text-white/55 placeholder:text-white/20 focus:outline-none" />
            {newGoal && (
              <button onClick={createGoal} disabled={addingGoal}
                className="p-1 rounded-lg" style={{ background:`${INDIGO}20`, color:INDIGO }}>
                {addingGoal ? <Loader2 size={10} className="animate-spin"/> : <Check size={10}/>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN AREA ═══════════════ */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0 flex-wrap gap-y-2">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
              <ChevronLeft size={16}/>
            </button>
            <button onClick={() => setCurrent(new Date())}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/8 transition-all">
              Aujourd&apos;hui
            </button>
            <button onClick={() => navigate(1)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
              <ChevronRight size={16}/>
            </button>
          </div>

          <h2 className="text-sm font-bold text-white/80 mr-auto">{headerLabel}</h2>

          {/* View switcher */}
          <div className="flex rounded-xl border border-white/8 overflow-hidden">
            {(["month","week","agenda"] as CalView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: view===v ? `${INDIGO}25` : "transparent",
                  color:      view===v ? INDIGO : "rgba(255,255,255,.4)",
                  borderRight: v !== "agenda" ? "1px solid rgba(255,255,255,.06)" : "none",
                }}>
                {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Agenda"}
              </button>
            ))}
          </div>

          {/* AI button */}
          <button onClick={() => setShowAI(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: showAI ? `${INDIGO}25` : "rgba(255,255,255,.05)",
              color:      showAI ? INDIGO : "rgba(255,255,255,.5)",
              border:     `1px solid ${showAI ? `${INDIGO}40` : "rgba(255,255,255,.08)"}`,
            }}>
            <Sparkles size={13}/> IA Planning
          </button>

          {/* New event */}
          <button onClick={() => openCreate()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{ background:INDIGO, color:"#fff" }}>
            <Plus size={14}/>Événement
          </button>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
              className="border-b border-white/[0.06] bg-[#0b0d14] overflow-hidden shrink-0">
              <div className="px-5 py-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {([
                    { Icon:Calendar,  l:"Organise ma journée", p:"Organise ma journée de manière optimale en tenant compte des événements et tâches du jour. Propose un emploi du temps heure par heure." },
                    { Icon:Zap,       l:"Tâches urgentes",     p:"Identifie les tâches urgentes et les deadlines critiques. Donne-moi les 3 priorités absolues aujourd'hui." },
                    { Icon:Clock,     l:"Temps libre",         p:"Identifie les créneaux libres dans ma journée et suggère comment les utiliser intelligemment." },
                    { Icon:BarChart2, l:"Analyse semaine",     p:"Analyse mon planning de la semaine. Suis-je sur la bonne voie pour mes objectifs ? Quels ajustements suggères-tu ?" },
                  ] as {Icon:LucideIcon;l:string;p:string}[]).map(a => (
                    <button key={a.l} onClick={() => runAI(a.p)} disabled={aiLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all disabled:opacity-50 border border-white/8 hover:border-white/20 text-white/55 hover:text-white">
                      {aiLoading ? <Loader2 size={11} className="animate-spin"/> : <a.Icon size={11}/>}
                      {a.l}
                    </button>
                  ))}
                </div>
                {aiLoading && (
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <Loader2 size={12} className="animate-spin"/> Analyse en cours…
                  </div>
                )}
                {aiResult && (
                  <div className="rounded-xl border border-white/10 p-3 text-xs text-white/65 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto"
                    style={{ background:`${INDIGO}08` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs flex items-center gap-1" style={{ color:INDIGO }}>
                        <Zap size={11}/>Suggestion IA
                      </span>
                      <button onClick={() => setAiResult("")} className="text-white/25 hover:text-white">
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

        {/* Calendar view */}
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 size={24} className="animate-spin text-white/20"/>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {view === "month"  && renderMonth()}
            {view === "week"   && renderWeek()}
            {view === "agenda" && renderAgenda()}
          </div>
        )}
      </div>

      {/* ═══════════════ EVENT MODAL ═══════════════ */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setShowModal(false)} />

            <motion.div
              initial={{opacity:0, scale:0.95, y:12}}
              animate={{opacity:1, scale:1, y:0}}
              exit={{opacity:0, scale:0.95, y:12}}
              className="fixed inset-x-4 top-[5%] bottom-[5%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-3xl border border-white/[0.08] bg-[#0e1018] shadow-2xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
                {/* Color swatch + picker */}
                <div className="relative">
                  <button onClick={() => setShowColPal(p => !p)}
                    className="w-8 h-8 rounded-xl border-2 border-white/10 transition-all hover:scale-110"
                    style={{ background: form.color ?? INDIGO }} />
                  <AnimatePresence>
                    {showColPal && (
                      <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0}}
                        className="absolute top-10 left-0 flex flex-wrap gap-1.5 p-2 rounded-xl border border-white/10 bg-[#0e1018] shadow-2xl z-10 w-32">
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

                {/* Type selector */}
                <div className="flex gap-1 flex-wrap flex-1">
                  {EV_TYPES.map(t => {
                    const TIcon = t.icon;
                    return (
                      <button key={t.v} onClick={() => setForm(p => ({...p, event_type:t.v}))}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: form.event_type===t.v ? `${form.color ?? INDIGO}22` : "rgba(255,255,255,.05)",
                          color:      form.event_type===t.v ? (form.color ?? INDIGO) : "rgba(255,255,255,.4)",
                          border:     `1px solid ${form.event_type===t.v ? `${form.color ?? INDIGO}35` : "transparent"}`,
                        }}>
                        <TIcon size={10}/>{t.l}
                      </button>
                    );
                  })}
                </div>

                <button onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all ml-auto">
                  <X size={16}/>
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
                {/* Title */}
                <input value={form.title ?? ""} onChange={e => setForm(p => ({...p, title:e.target.value}))}
                  placeholder="Titre de l'événement *"
                  className="w-full bg-transparent text-lg font-bold text-white placeholder:text-white/20 focus:outline-none border-b border-white/[0.06] pb-2" />

                {/* All day */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(p => ({...p, is_all_day:!p.is_all_day}))}
                    className={`w-9 h-5 rounded-full transition-all ${form.is_all_day ? "" : "bg-white/10"}`}
                    style={form.is_all_day ? { background:form.color ?? INDIGO } : {}}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all mx-0.5 ${form.is_all_day ? "translate-x-4" : "translate-x-0"}`}/>
                  </button>
                  <span className="text-xs text-white/45">Toute la journée</span>
                </div>

                {/* Date/time */}
                {form.is_all_day ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label:"Début", key:"start_at" as const },
                      { label:"Fin",   key:"end_at"   as const },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] text-white/35 uppercase tracking-wide">{label}</label>
                        <input type="date" value={(form[key] ?? "").slice(0,10)}
                          onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                          className="w-full bg-white/[0.05] border border-white/8 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/20 appearance-none [color-scheme:dark]"/>
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
                        <label className="text-[10px] text-white/35 uppercase tracking-wide">{label}</label>
                        <input type="datetime-local" value={form[key] ?? ""}
                          onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                          className="w-full bg-white/[0.05] border border-white/8 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/20 [color-scheme:dark]"/>
                      </div>
                    ))}
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
                  <MapPin size={13} className="text-white/25 shrink-0"/>
                  <input value={form.location ?? ""} onChange={e => setForm(p => ({...p, location:e.target.value}))}
                    placeholder="Lieu (optionnel)"
                    className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
                </div>

                {/* Meet link */}
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
                  <Video size={13} className="text-white/25 shrink-0"/>
                  <input value={form.meet_link ?? ""} onChange={e => setForm(p => ({...p, meet_link:e.target.value}))}
                    placeholder="Lien visioconférence (optionnel)"
                    className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
                </div>

                {/* Description */}
                <div className="flex items-start gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
                  <AlignLeft size={13} className="text-white/25 shrink-0 mt-0.5"/>
                  <textarea value={form.description ?? ""} onChange={e => setForm(p => ({...p, description:e.target.value}))}
                    placeholder="Description (optionnel)" rows={3}
                    className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none leading-relaxed"/>
                </div>

                {/* Participants */}
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
                  <Tag size={13} className="text-white/25 shrink-0"/>
                  <input
                    value={(form.participants ?? []).join(", ")}
                    onChange={e => setForm(p => ({...p, participants:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}))}
                    placeholder="Participants (séparés par virgule)"
                    className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none"/>
                </div>

                {/* Reminder */}
                <div className="flex items-center gap-2">
                  <Bell size={13} className="text-white/25"/>
                  <span className="text-xs text-white/35">Rappel</span>
                  <select value={form.reminder_minutes ?? 30}
                    onChange={e => setForm(p => ({...p, reminder_minutes: Number(e.target.value)}))}
                    className="ml-auto cursor-pointer rounded-xl border border-white/[0.08] bg-[#0e1018] px-3 py-1.5 text-xs text-white/55 outline-none appearance-none">
                    <option value={0} className="bg-[#0e1018]">Aucun</option>
                    <option value={5} className="bg-[#0e1018]">5 min avant</option>
                    <option value={15} className="bg-[#0e1018]">15 min avant</option>
                    <option value={30} className="bg-[#0e1018]">30 min avant</option>
                    <option value={60} className="bg-[#0e1018]">1 h avant</option>
                    <option value={1440} className="bg-[#0e1018]">1 jour avant</option>
                  </select>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06] shrink-0">
                {editEvent && (
                  <button onClick={() => deleteEvent(editEvent.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={13}/>Supprimer
                  </button>
                )}
                <button onClick={() => setShowModal(false)}
                  className="ml-auto px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">
                  Annuler
                </button>
                <button onClick={saveEvent} disabled={saving || !form.title?.trim()}
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
  );
}
