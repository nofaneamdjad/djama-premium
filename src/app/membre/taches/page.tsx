"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Clock, AlertTriangle, CheckCircle2, Loader2, Circle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

interface Task {
  id: string; title: string; description: string; status: string;
  priority: string; due_date: string | null; project: string;
  estimated_hours: number; assigned_name: string;
}

const PRIO_COLOR: Record<string, string> = {
  urgent: "#f87171", high: "#f59e0b", normal: "#60a5fa", low: "#64748b",
};
const STATUS_NEXT: Record<string, string> = {
  todo: "in_progress", in_progress: "done", done: "todo", late: "in_progress",
};
const STATUS_LABEL: Record<string, string> = {
  todo: "À faire", in_progress: "En cours", done: "Terminé", late: "En retard",
};
const STATUS_COLOR: Record<string, string> = {
  todo: "#64748b", in_progress: GOLD, done: "#10b981", late: "#f87171",
};

export default function MembreTaches() {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"all" | "todo" | "in_progress" | "done">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meta = user.user_metadata;
      const { data } = await supabase.from("team_tasks").select("*")
        .eq("user_id", meta.team_id).eq("assigned_to", meta.member_id)
        .order("due_date", { ascending: true });
      setTasks((data ?? []) as Task[]);
      setLoading(false);
    })();
  }, []);

  async function toggleStatus(task: Task) {
    const next = STATUS_NEXT[task.status] ?? "todo";
    setUpdating(task.id);
    await supabase.from("team_tasks").update({ status: next }).eq("id", task.id);
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: next } : t));
    setUpdating(null);
  }

  const filtered = tasks.filter(t => filter === "all" ? true : t.status === filter);
  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === "todo" || t.status === "late").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,165,90,0.1)" }}>
            <CheckSquare size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Mes tâches</p>
            <p className="text-[11px] text-white/35">{tasks.length} tâche{tasks.length !== 1 ? "s" : ""} assignées</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-px border-t border-white/[0.06] mx-0">
          {[
            { k: "all", l: "Total", c: GOLD },
            { k: "todo", l: "À faire", c: "#f87171" },
            { k: "in_progress", l: "En cours", c: "#f59e0b" },
            { k: "done", l: "Terminés", c: "#10b981" },
          ].map(s => (
            <button key={s.k} onClick={() => setFilter(s.k as typeof filter)}
              className="py-3 text-center transition-all"
              style={{ background: filter === s.k ? `${s.c}10` : "transparent" }}>
              <p className="text-lg font-extrabold" style={{ color: s.c }}>
                {counts[s.k as keyof typeof counts]}
              </p>
              <p className="text-[10px] text-white/30">{s.l}</p>
              {filter === s.k && (
                <motion.div layoutId="tache-filter-indicator"
                  className="mx-auto mt-1 h-0.5 w-6 rounded-full" style={{ background: s.c }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <CheckCircle2 size={32} className="text-white/10" />
            <p className="text-white/30 text-sm">Aucune tâche ici</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map(t => {
              const isLate = t.due_date && new Date(t.due_date) < new Date() && t.status !== "done";
              const isDone = t.status === "done";
              return (
                <motion.div key={t.id} layout
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-all hover:border-white/15">
                  <div className="flex items-start gap-3">
                    {/* Toggle status */}
                    <button onClick={() => toggleStatus(t)} disabled={!!updating}
                      className="mt-0.5 shrink-0 transition-all hover:scale-110">
                      {updating === t.id ? (
                        <Loader2 size={18} className="animate-spin text-white/30" />
                      ) : isDone ? (
                        <CheckCircle2 size={18} style={{ color: "#10b981" }} />
                      ) : t.status === "in_progress" ? (
                        <div className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center" style={{ borderColor: GOLD }}>
                          <div className="w-2 h-2 rounded-full" style={{ background: GOLD }} />
                        </div>
                      ) : (
                        <Circle size={18} className="text-white/25" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? "line-through text-white/30" : "text-white/85"}`}>
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-xs text-white/35 mt-0.5 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Priority */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${PRIO_COLOR[t.priority] ?? GOLD}15`, color: PRIO_COLOR[t.priority] ?? GOLD }}>
                          {t.priority}
                        </span>
                        {/* Status */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${STATUS_COLOR[t.status] ?? GOLD}12`, color: STATUS_COLOR[t.status] ?? GOLD }}>
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                        {/* Project */}
                        {t.project && (
                          <span className="text-[10px] text-white/30">{t.project}</span>
                        )}
                        {/* Due date */}
                        {t.due_date && (
                          <span className={`ml-auto text-[11px] flex items-center gap-1 ${isLate ? "text-red-400" : "text-white/30"}`}>
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
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
