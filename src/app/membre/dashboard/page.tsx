"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, CheckSquare, Clock, AlertTriangle, ArrowRight,
  CheckCircle2, Calendar, TrendingUp, Zap, Circle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

interface Task {
  id: string; title: string; status: string; priority: string;
  due_date: string | null; project: string;
}
interface Message {
  id: string; sender_name: string; content: string; channel: string; created_at: string;
}
interface Meeting {
  id: string; title: string; date_at: string; duration_minutes: number;
  location: string; meet_link: string;
}

const PRIO_COLOR: Record<string, string> = {
  urgent: "#f87171", high: "#f59e0b", normal: "#60a5fa", low: "#64748b",
};

function greet() {
  const h = new Date().getHours();
  if (h < 6)  return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000)     return "À l'instant";
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)} min`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function colorFor(name: string) {
  const colors = [GOLD, "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

export default function MembreDashboard() {
  const [name, setName]       = useState("");
  const [teamId, setTeamId]   = useState("");
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meta = user.user_metadata;
      setName(meta?.name ?? user.email ?? "");
      setTeamId(meta?.team_id ?? "");

      const [tR, mR, mrR] = await Promise.all([
        supabase.from("team_tasks").select("id,title,status,priority,due_date,project")
          .eq("user_id", meta.team_id).eq("assigned_to", meta.member_id)
          .order("due_date", { ascending: true }).limit(20),
        supabase.from("team_messages").select("id,sender_name,content,channel,created_at")
          .eq("user_id", meta.team_id).order("created_at", { ascending: false }).limit(8),
        supabase.from("team_meetings").select("id,title,date_at,duration_minutes,location,meet_link")
          .eq("user_id", meta.team_id).eq("status", "planned")
          .gt("date_at", new Date().toISOString())
          .order("date_at").limit(3),
      ]);
      setTasks((tR.data ?? []) as Task[]);
      setMessages((mR.data ?? []) as Message[]);
      setMeetings((mrR.data ?? []) as Meeting[]);
      setLoading(false);
    })();
  }, []);

  const now     = new Date();
  const todayStr = now.toDateString();
  const pending  = tasks.filter(t => t.status !== "done");
  const late     = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "done").length;
  const today    = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === todayStr && t.status !== "done").length;
  const done     = tasks.filter(t => t.status === "done").length;
  const total    = tasks.length;
  const pct      = total === 0 ? 0 : Math.round(done / total * 100);

  if (loading) return (
    <div className="flex items-center justify-center flex-1">
      <div className="w-6 h-6 rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a] animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-6"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-8 blur-3xl" style={{ background: GOLD }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />
        </div>
        <div className="relative flex items-center gap-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold shrink-0"
            style={{ background: `${GOLD}15`, color: GOLD, border: `2px solid ${GOLD}25` }}>
            {name.charAt(0).toUpperCase()}
          </motion.div>
          <motion.div initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.06 }}>
            <p className="text-sm text-white/40">{greet()},</p>
            <h1 className="text-xl font-extrabold text-white leading-tight">{name}</h1>
            <p className="text-[12px] text-white/30 mt-0.5">
              {pending.length === 0
                ? "Aucune tâche en attente — bonne journée !"
                : `${pending.length} tâche${pending.length > 1 ? "s" : ""} en attente`}
            </p>
          </motion.div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="relative mt-5">
            <div className="flex justify-between text-[11px] text-white/30 mb-1.5">
              <span className="flex items-center gap-1"><TrendingUp size={10} />Progression globale</span>
              <span className="font-bold" style={{ color: pct === 100 ? "#10b981" : GOLD }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
                className="h-full rounded-full"
                style={{ background: pct === 100 ? "#10b981" : `linear-gradient(90deg,${GOLD},#b08d45)` }} />
            </div>
            <p className="text-[10px] text-white/20 mt-1">{done}/{total} terminées</p>
          </motion.div>
        )}
      </div>

      <div className="p-5 space-y-5 max-w-2xl mx-auto w-full">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: "À faire",      value: pending.length, color: GOLD,      icon: CheckSquare,   href: "/membre/taches" },
            { label: "Pour auj.",    value: today,          color: "#60a5fa", icon: Clock,         href: "/membre/taches" },
            { label: "En retard",    value: late,           color: "#f87171", icon: AlertTriangle, href: "/membre/taches" },
            { label: "Messages",     value: messages.length,color: "#10b981", icon: MessageSquare, href: "/membre/chat"   },
          ].map((s, i) => (
            <Link key={s.label} href={s.href}>
              <motion.div whileHover={{ y: -2 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 cursor-pointer hover:border-white/15 hover:bg-white/[0.045] transition-all">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-2.5" style={{ background: `${s.color}12` }}>
                  <s.icon size={13} style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-white/30 mt-1">{s.label}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* ── Prochaine réunion ── */}
        {meetings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={13} style={{ color: GOLD }} />
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Prochaine réunion</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
              {meetings.slice(0, 1).map(m => {
                const d = new Date(m.date_at);
                const isToday = d.toDateString() === todayStr;
                return (
                  <div key={m.id} className="flex items-center gap-4 p-4">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-[9px] uppercase text-white/30 font-black tracking-widest">
                        {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                      </p>
                      <p className="text-2xl font-extrabold leading-none" style={{ color: isToday ? "#f59e0b" : GOLD }}>{d.getDate()}</p>
                      <p className="text-[9px] text-white/25">{d.toLocaleDateString("fr-FR", { month: "short" })}</p>
                    </div>
                    <div className="h-10 w-px bg-white/[0.06]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/85 truncate">{m.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-white/35 flex items-center gap-1">
                          <Clock size={10} />{d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-[11px] text-white/25">{m.duration_minutes} min</span>
                        {isToday && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400">Aujourd&apos;hui</span>}
                      </div>
                    </div>
                    {m.meet_link && (
                      <a href={m.meet_link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:brightness-110 shrink-0"
                        style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}
                        onClick={e => e.stopPropagation()}>
                        <Zap size={11} />Rejoindre
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Mes tâches ── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={13} style={{ color: GOLD }} />
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Mes tâches</p>
            </div>
            <Link href="/membre/taches" className="text-[11px] flex items-center gap-1 hover:opacity-80 transition-all" style={{ color: GOLD }}>
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <CheckCircle2 size={28} className="text-emerald-400/50" />
                <p className="text-white/30 text-sm">Toutes les tâches sont terminées 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {pending.slice(0, 6).map(t => {
                  const isLate = t.due_date && new Date(t.due_date) < now;
                  const pc = PRIO_COLOR[t.priority] ?? GOLD;
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all">
                      <Circle size={15} className="shrink-0 text-white/15" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/75 truncate">{t.title}</p>
                        {t.project && <p className="text-[10px] text-white/25 mt-0.5">{t.project}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${pc}12`, color: pc }}>{t.priority}</span>
                        {t.due_date && (
                          <span className={`text-[10px] ${isLate ? "text-red-400" : "text-white/25"}`}>
                            {new Date(t.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {pending.length > 6 && (
                  <Link href="/membre/taches"
                    className="flex items-center justify-center gap-1 py-3 text-[11px] text-white/25 hover:text-white/50 transition-all">
                    +{pending.length - 6} autres tâches <ArrowRight size={10} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Messages récents ── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={13} style={{ color: GOLD }} />
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Messages récents</p>
            </div>
            <Link href="/membre/chat" className="text-[11px] flex items-center gap-1 hover:opacity-80 transition-all" style={{ color: GOLD }}>
              Chat <ArrowRight size={11} />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <MessageSquare size={28} className="text-white/10" />
                <p className="text-white/30 text-sm">Aucun message</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {messages.slice(0, 5).map(m => {
                  const mc = colorFor(m.sender_name);
                  return (
                    <Link key={m.id} href="/membre/chat"
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                        style={{ background: `${mc}15`, color: mc }}>
                        {m.sender_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-bold" style={{ color: mc }}>{m.sender_name}</span>
                          <span className="text-[10px] text-white/20">#{m.channel}</span>
                          <span className="ml-auto text-[10px] text-white/20 shrink-0">{relTime(m.created_at)}</span>
                        </div>
                        <p className="text-[12px] text-white/40 truncate mt-0.5">{m.content}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
