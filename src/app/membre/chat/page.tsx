"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, MessageSquare, Loader2, AtSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD     = "#c9a55a";
const CHANNELS = ["général", "annonces", "projets", "ressources"];

interface Message {
  id: string; sender_name: string; content: string;
  channel: string; created_at: string;
}

const relTime = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000)     return "À l'instant";
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)} min`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} h`;
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

function Avatar({ name, size = 32, color = GOLD }: { name: string; size?: number; color?: string }) {
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0 select-none"
      style={{ width: size, height: size, background: `${color}18`, color, border: `1.5px solid ${color}28`, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const MEMBER_COLORS = [GOLD, "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#f87171"];
function colorFor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return MEMBER_COLORS[h % MEMBER_COLORS.length];
}

export default function MembreChat() {
  const [teamId, setTeamId]     = useState("");
  const [myName, setMyName]     = useState("");
  const [channel, setChannel]   = useState("général");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [unread, setUnread]     = useState<Record<string, number>>({});
  const endRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meta = user.user_metadata;
      const tid  = meta?.team_id ?? "";
      setTeamId(tid);
      setMyName(meta?.name ?? user.email ?? "Membre");

      const { data } = await supabase.from("team_messages").select("*")
        .eq("user_id", tid).order("created_at").limit(400);
      setMessages((data ?? []) as Message[]);
      setLoading(false);
    })();
  }, []);

  /* ── Realtime subscription ── */
  useEffect(() => {
    if (!teamId) return;
    const sub = supabase
      .channel(`membre-chat-${teamId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "team_messages",
        filter: `user_id=eq.${teamId}`,
      }, payload => {
        const msg = payload.new as Message;
        setMessages(p => {
          if (p.some(m => m.id === msg.id)) return p;
          return [...p, msg];
        });
        if (msg.channel !== channel && msg.sender_name !== myName) {
          setUnread(u => ({ ...u, [msg.channel]: (u[msg.channel] ?? 0) + 1 }));
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(sub); };
  }, [teamId, channel, myName]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, channel, scrollToBottom]);

  const switchChannel = (ch: string) => {
    setChannel(ch);
    setUnread(u => ({ ...u, [ch]: 0 }));
    inputRef.current?.focus();
  };

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
    const payload = { user_id: teamId, sender_name: myName, content: input.trim(), channel, mentions: [] };
    const { data } = await supabase.from("team_messages").insert(payload).select().single();
    if (data) setMessages(p => p.some(m => m.id === (data as Message).id) ? p : [...p, data as Message]);
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
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,165,90,0.1)" }}>
            <MessageSquare size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Chat d&apos;équipe</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] text-white/35">En direct · #{channel}</p>
            </div>
          </div>
        </div>

        {/* Canaux */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
          {CHANNELS.map(ch => {
            const active = channel === ch;
            const count  = unread[ch] ?? 0;
            return (
              <button key={ch} onClick={() => switchChannel(ch)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 whitespace-nowrap"
                style={{
                  background: active ? "rgba(201,165,90,0.12)" : "transparent",
                  color:      active ? GOLD : "rgba(255,255,255,0.4)",
                  border:     active ? "1px solid rgba(201,165,90,0.22)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <Hash size={11} />{ch}
                {count > 0 && !active && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.15)" }}>
              <Hash size={28} style={{ color: GOLD, opacity: 0.6 }} />
            </div>
            <div className="text-center">
              <p className="text-white/50 text-sm font-semibold">#{channel}</p>
              <p className="text-white/25 text-xs mt-1">Premier message dans ce canal</p>
            </div>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-white/25 font-medium">
                  {new Date(group.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <div className="space-y-1">
                {group.msgs.map((msg, i) => {
                  const isMe    = msg.sender_name === myName;
                  const prevMsg = group.msgs[i - 1];
                  const showAvatar = !prevMsg || prevMsg.sender_name !== msg.sender_name;
                  const mc = colorFor(msg.sender_name);

                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <div className="w-8 shrink-0">
                        {showAvatar && !isMe && <Avatar name={msg.sender_name} size={30} color={mc} />}
                      </div>
                      <div className={`flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
                        {showAvatar && (
                          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-[11px] font-bold" style={{ color: isMe ? GOLD : mc }}>
                              {isMe ? "Moi" : msg.sender_name}
                            </span>
                            <span className="text-[10px] text-white/20">{relTime(msg.created_at)}</span>
                          </div>
                        )}
                        <div className="rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                          style={isMe
                            ? { background: "rgba(201,165,90,0.13)", color: "rgba(255,255,255,0.92)", border: "1px solid rgba(201,165,90,0.22)", borderBottomRightRadius: 6 }
                            : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.78)", border: "1px solid rgba(255,255,255,0.07)", borderBottomLeftRadius: 6 }}>
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
        style={{ background: "rgba(11,16,28,0.95)" }}>
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5">
          <AtSign size={14} className="text-white/20 shrink-0" />
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder={`Message #${channel}…`}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
          <AnimatePresence>
            {input.trim() && (
              <motion.button initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                onClick={() => void send()} disabled={sending}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
                {sending ? <Loader2 size={13} className="animate-spin text-black" /> : <Send size={13} className="text-black" />}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <p className="text-center text-[10px] text-white/15 mt-1.5">Entrée pour envoyer</p>
      </div>
    </div>
  );
}
