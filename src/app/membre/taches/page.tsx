"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Clock, AlertTriangle, CheckCircle2, Loader2,
  Circle, TrendingUp, Folder, Flag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

interface Task {
  id: string; title: string; description: string; status: string;
  priority: string; due_date: string | null; project: string;
  estimated_hours: number;
}

type Filter = "all" | "todo" | "in_progress" | "done";

const PRIO: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent",  color: "#f87171" },
  high:   { label: "Élevée", color: "#f59e0b" },
  normal: { label: "Normal",  color: "#60a5fa" },
  low:    { label: "Faible",  color: "#64748b" },
};
const STATUS: Record<string, { label: string; color: string; next: string }> = {
  todo:        { label: "À faire",   color: "#64748b", next: "in_progress" },
  in_progress: { label: "En cours",  color: GOLD,      next: "done"        },
  done:        { label: "Terminé",   color: "#10b981", next: "todo"        },
  late:        { label: "En retard", color: "#f87171", next: "in_progress" },
};

export default function MembreTaches() {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Filter>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const meta = user.user_metadata;
      const teamId   = meta?.team_id ?? user.id;
      const memberId = meta?.member_id ?? null;
      const spaceId  = meta?.space_id ?? null;
      let q = supabase.from("team_tasks").select("*").eq("user_id", teamId);
      if (memberId) q = q.eq("assigned_to", memberId);
      if (spaceId)  q = q.eq("space_id", spaceId);
      const { data } = await q.order("due_date", { ascending: true });
      setTasks((data ?? []) as Task[]);
      setLoading(false);
    })();
  }, []);

  async function toggleStatus(t: Task) {
    const next = STATUS[t.status]?.next ?? "todo";
    setUpdating(t.id);
    await supabase.from("team_tasks").update({ status: next }).eq("id", t.id);
    setTasks(p => p.map(x => x.id === t.id ? { ...x, status: next } : x));
    setUpdating(null);
  }

  const now    = new Date();
  const counts = {
    all:         tasks.length,
    todo:        tasks.filter(t => t.status === "todo" || t.status === "late").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done:        tasks.filter(t => t.status === "done").length,
  };
  const donePct = tasks.length === 0 ? 0 : Math.round(counts.done / tasks.length * 100);

  const filtered = tasks.filter(t =>
    filter === "all"         ? true :
    filter === "todo"        ? (t.status === "todo" || t.status === "late") :
    filter === "in_progress" ? t.status === "in_progress" :
                               t.status === "done"
  );

  /* group by project */
  const projects = [...new Set(filtered.map(t => t.project || ""))].sort();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* ── Header ── */}
      <div className="relative shrink-0 overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />

        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,165,90,0.1)" }}>
            <CheckSquare size={16} style={{ color: GOLD }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-white">Mes tâches</p>
            <p className="text-[11px] text-white/35">{tasks.length} assignée{tasks.length !== 1 ? "s" : ""}</p>
          </div>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${donePct}%` }} transition={{ duration: 0.8 }}
                  className="h-full rounded-full" style={{ background: donePct === 100 ? "#10b981" : `linear-gradient(90deg,${GOLD},#b08d45)` }} />
              </div>
              <span className="text-[11px] font-bold" style={{ color: donePct === 100 ? "#10b981" : GOLD }}>{donePct}%</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-px border-t border-white/[0.06]">
          {([
            { k: "all",         l: "Total",    c: GOLD      },
            { k: "todo",        l: "À faire",  c: "#f87171" },
            { k: "in_progress", l: "En cours", c: "#f59e0b" },
            { k: "done",        l: "Terminés", c: "#10b981" },
          ] as const).map(s => (
            <button key={s.k} onClick={() => setFilter(s.k)}
              className="py-3 text-center transition-all relative"
              style={{ background: filter === s.k ? `${s.c}10` : "transparent" }}>
              <p className="text-xl font-extrabold" style={{ color: s.c }}>{counts[s.k]}</p>
              <p className="text-[10px] text-white/30">{s.l}</p>
              {filter === s.k && (
                <motion.div layoutId="tache-indicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: s.c }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Liste ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={22} className="animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(201,165,90,0.07)", border: "1px solid rgba(201,165,90,0.14)" }}>
              <CheckCircle2 size={28} style={{ color: GOLD, opacity: 0.6 }} />
            </div>
            <div className="text-center">
              <p className="text-white/50 text-sm font-semibold">
                {filter === "done" ? "Aucune tâche terminée" : filter === "all" ? "Aucune tâche assignée" : "Aucune tâche ici"}
              </p>
              <p className="text-white/20 text-xs mt-1">Les tâches assignées apparaîtront ici</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {projects.map(proj => {
                const projTasks = filtered.filter(t => (t.project || "") === proj);
                if (projTasks.length === 0) return null;
                return (
                  <div key={proj || "__none__"}>
                    {proj && (
                      <div className="flex items-center gap-2 mb-2.5">
                        <Folder size={12} className="text-white/30" />
                        <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">{proj}</span>
                        <div className="flex-1 h-px bg-white/[0.05]" />
                        <span className="text-[10px] text-white/20">{projTasks.length}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {projTasks.map(t => {
                        const isLate = t.due_date && new Date(t.due_date) < now && t.status !== "done";
                        const isDone = t.status === "done";
                        const st = STATUS[t.status] ?? STATUS.todo;
                        const pr = PRIO[t.priority] ?? PRIO.normal;

                        return (
                          <motion.div key={t.id} layout
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: isDone ? 0.55 : 1, y: 0 }} exit={{ opacity: 0 }}
                            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-all hover:border-white/12">
                            <div className="flex items-start gap-3">
                              <button onClick={() => void toggleStatus(t)} disabled={!!updating}
                                className="mt-0.5 shrink-0 transition-all hover:scale-110 active:scale-95">
                                {updating === t.id ? (
                                  <Loader2 size={20} className="animate-spin text-white/25" />
                                ) : isDone ? (
                                  <CheckCircle2 size={20} className="text-emerald-400" />
                                ) : t.status === "in_progress" ? (
                                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: GOLD }}>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />
                                  </div>
                                ) : (
                                  <Circle size={20} className="text-white/20" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-medium leading-snug ${isDone ? "line-through text-white/30" : "text-white/85"}`}>
                                  {t.title}
                                </p>
                                {t.description && !isDone && (
                                  <p className="text-[11px] text-white/30 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>
                                )}

                                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                  {/* Priority */}
                                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: `${pr.color}12`, color: pr.color }}>
                                    <Flag size={8} />{pr.label}
                                  </span>
                                  {/* Status */}
                                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{ background: `${st.color}10`, color: st.color }}>
                                    {st.label}
                                  </span>
                                  {/* Hours */}
                                  {t.estimated_hours > 0 && (
                                    <span className="text-[10px] text-white/25 flex items-center gap-1">
                                      <TrendingUp size={9} />{t.estimated_hours}h est.
                                    </span>
                                  )}
                                  {/* Due date */}
                                  {t.due_date && (
                                    <span className={`ml-auto text-[11px] flex items-center gap-1 font-medium ${isLate ? "text-red-400" : isDone ? "text-white/20" : "text-white/30"}`}>
                                      {isLate ? <AlertTriangle size={10} /> : <Clock size={10} />}
                                      {new Date(t.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
