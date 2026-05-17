"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Hash, Send, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD  = "#c9a55a";
const CHANNELS = ["général", "annonces", "projets", "ressources"];

interface Message {
  id: string; sender_name: string; content: string;
  channel: string; created_at: string;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0 select-none text-[#c9a55a]"
      style={{ width: size, height: size, background: "rgba(201,165,90,0.15)", border: "2px solid rgba(201,165,90,0.25)", fontSize: size * 0.35 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function MembreChat() {
  const [teamId, setTeamId]     = useState("");
  const [myName, setMyName]     = useState("");
  const [channel, setChannel]   = useState("général");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meta = user.user_metadata;
      setTeamId(meta?.team_id ?? "");
      setMyName(meta?.name ?? user.email ?? "Membre");

      const { data } = await supabase.from("team_messages").select("*")
        .eq("user_id", meta.team_id).order("created_at").limit(300);
      setMessages((data ?? []) as Message[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [messages, channel]);

  const channelMsgs = useMemo(() =>
    messages.filter(m => m.channel === channel), [messages, channel]);

  const grouped = useMemo(() => {
    const g: { date: string; msgs: Message[] }[] = [];
    channelMsgs.forEach(m => {
      const d = m.created_at.slice(0, 10);
      const last = g[g.length - 1];
      if (last?.date === d) last.msgs.push(m);
      else g.push({ date: d, msgs: [m] });
    });
    return g;
  }, [channelMsgs]);

  async function send() {
    if (!input.trim() || !teamId) return;
    setSending(true);
    const newMsg = {
      user_id: teamId,
      sender_name: myName,
      content: input.trim(),
      channel,
      mentions: [],
    };
    const { data } = await supabase.from("team_messages").insert(newMsg).select().single();
    if (data) setMessages(p => [...p, data as Message]);
    setInput("");
    setSending(false);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,165,90,0.1)" }}>
            <MessageSquare size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Chat d&apos;équipe</p>
            <p className="text-[11px] text-white/35">#{channel}</p>
          </div>
        </div>
        {/* Canaux */}
        <div className="flex gap-1 px-5 pb-3 overflow-x-auto">
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setChannel(ch)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0"
              style={{
                background: channel === ch ? "rgba(201,165,90,0.12)" : "transparent",
                color: channel === ch ? GOLD : "rgba(255,255,255,0.4)",
                border: channel === ch ? "1px solid rgba(201,165,90,0.2)" : "1px solid transparent",
              }}>
              <Hash size={11} />#{ch}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <MessageSquare size={28} className="text-white/10" />
            <p className="text-white/30 text-sm">Aucun message dans #{channel}</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-white/25">
                  {new Date(group.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <div className="space-y-3">
                {group.msgs.map(msg => {
                  const isMe = msg.sender_name === myName;
                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                      <Avatar name={msg.sender_name} size={32} />
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: isMe ? GOLD : "rgba(255,255,255,0.8)" }}>
                            {isMe ? "Moi" : msg.sender_name}
                          </span>
                          <span className="text-[10px] text-white/25">
                            {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                          style={isMe
                            ? { background: "rgba(201,165,90,0.12)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(201,165,90,0.2)" }
                            : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-white/[0.06]"
        style={{ background: "#0b101c" }}>
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Message #${channel}…`}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
          <button onClick={send} disabled={sending || !input.trim()}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
            {sending ? <Loader2 size={13} className="animate-spin text-black" /> : <Send size={13} className="text-black" />}
          </button>
        </div>
      </div>
    </div>
  );
}
