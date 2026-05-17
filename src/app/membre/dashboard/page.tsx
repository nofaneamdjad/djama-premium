"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, CheckSquare, Clock, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

interface Task {
  id: string; title: string; status: string; priority: string;
  due_date: string | null; project: string;
}

interface Message {
  id: string; sender_name: string; content: string; channel: string; created_at: string;
}

export default function MembreDashboard() {
  const [name, setName]         = useState("");
  const [teamId, setTeamId]     = useState("");
  const [memberId, setMemberId] = useState("");
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meta = user.user_metadata;
      setName(meta?.name ?? user.email ?? "");
      setTeamId(meta?.team_id ?? "");
      setMemberId(meta?.member_id ?? "");

      const [tR, mR] = await Promise.all([
        supabase.from("team_tasks").select("id,title,status,priority,due_date,project")
          .eq("user_id", meta.team_id).eq("assigned_to", meta.member_id)
          .neq("status", "done").order("due_date", { ascending: true }).limit(10),
        supabase.from("team_messages").select("id,sender_name,content,channel,created_at")
          .eq("user_id", meta.team_id).order("created_at", { ascending: false }).limit(5),
      ]);
      setTasks((tR.data ?? []) as Task[]);
      setMessages((mR.data ?? []) as Message[]);
      setLoading(false);
    })();
  }, []);

  const late = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length;
  const today = tasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date); const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const STATS = [
    { label: "Tâches à faire", value: tasks.length, color: GOLD, icon: CheckSquare, href: "/membre/taches" },
    { label: "Pour aujourd'hui", value: today, color: "#60a5fa", icon: Clock, href: "/membre/taches" },
    { label: "En retard", value: late, color: "#f87171", icon: AlertTriangle, href: "/membre/taches" },
    { label: "Messages", value: messages.length, color: "#10b981", icon: MessageSquare, href: "/membre/chat" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="w-6 h-6 rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="relative overflow-hidden px-6 py-8"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: GOLD }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />
        </div>
        <div className="relative">
          <p className="text-sm text-white/40">{greet()},</p>
          <h1 className="text-2xl font-extrabold text-white mt-1">{name}</h1>
          <p className="text-sm text-white/35 mt-1">
            {tasks.length === 0 ? "Aucune tâche en attente — bonne journée !" : `${tasks.length} tâche${tasks.length > 1 ? "s" : ""} vous attendent.`}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-3xl mx-auto w-full">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(s => (
            <Link key={s.label} href={s.href}>
              <motion.div whileHover={{ y: -2 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-all">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{s.label}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Tâches récentes */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-bold text-white/80">Mes tâches</p>
            <Link href="/membre/taches" className="text-[11px] text-[#c9a55a] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <CheckCircle2 size={28} className="text-white/10" />
              <p className="text-white/30 text-sm">Aucune tâche assignée</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {tasks.slice(0, 5).map(t => {
                const isLate = t.due_date && new Date(t.due_date) < new Date();
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: t.priority === "urgent" ? "#f87171" : t.priority === "high" ? "#f59e0b" : GOLD }} />
                    <p className="flex-1 text-sm text-white/70 truncate">{t.title}</p>
                    {t.due_date && (
                      <span className={`text-[11px] shrink-0 ${isLate ? "text-red-400" : "text-white/30"}`}>
                        {new Date(t.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages récents */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-bold text-white/80">Messages récents</p>
            <Link href="/membre/chat" className="text-[11px] text-[#c9a55a] hover:underline flex items-center gap-1">
              Ouvrir le chat <ArrowRight size={11} />
            </Link>
          </div>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <MessageSquare size={28} className="text-white/10" />
              <p className="text-white/30 text-sm">Aucun message</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {messages.map(m => (
                <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: "rgba(201,165,90,0.15)", color: GOLD }}>
                    {m.sender_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-white/80">{m.sender_name}</span>
                      <span className="text-[10px] text-white/25">#{m.channel}</span>
                    </div>
                    <p className="text-xs text-white/45 truncate mt-0.5">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
