"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare, Send, Plus, Hash, Users, X, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

type Group = {
  id: string;
  name: string;
  is_direct: boolean;
  updated_at: string;
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  sender: { name: string; email: string };
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function MembreMessages() {
  const [orgId, setOrgId]         = useState<string | null>(null);
  const [myId, setMyId]           = useState<string | null>(null);
  const [groups, setGroups]       = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialiser orgId depuis user metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setMyId(user.id);
      const orgId = user.user_metadata?.active_org_id as string | undefined;
      if (orgId) setOrgId(orgId);
    });
  }, []);

  const loadGroups = useCallback(async () => {
    if (!orgId) return;
    setLoadingGroups(true);
    const res = await fetch(`/api/org/messages/groups?orgId=${orgId}`);
    const data = await res.json();
    setGroups(data.groups ?? []);
    setLoadingGroups(false);
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadGroups();
  }, [orgId, loadGroups]);

  const loadMessages = useCallback(async (group: Group) => {
    if (!orgId) return;
    setLoadingMsgs(true);
    const res = await fetch(`/api/org/messages?orgId=${orgId}&groupId=${group.id}&limit=50`);
    const data = await res.json();
    setMessages((data.messages ?? []).reverse());
    setLoadingMsgs(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [orgId]);

  async function sendMessage() {
    if (!input.trim() || !activeGroup || !orgId || sending) return;
    setSending(true);
    const res = await fetch("/api/org/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, groupId: activeGroup.id, content: input.trim() }),
    });
    if (res.ok) {
      const { message } = await res.json();
      setMessages(prev => [...prev, {
        ...message,
        sender: { name: "Vous", email: "" },
      }]);
      setInput("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setSending(false);
  }

  async function createGroup() {
    if (!newGroupName.trim() || !orgId) return;
    const res = await fetch("/api/org/messages/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, name: newGroupName.trim() }),
    });
    if (res.ok) {
      await loadGroups();
      setShowNew(false);
      setNewGroupName("");
    }
  }

  // Polling léger toutes les 10s si un groupe est ouvert
  useEffect(() => {
    if (!activeGroup) return;
    const iv = setInterval(() => loadMessages(activeGroup), 10000);
    return () => clearInterval(iv);
  }, [activeGroup, loadMessages]);

  return (
    <div className="flex flex-1 h-[calc(100vh-52px)] md:h-screen overflow-hidden">
      {/* Sidebar groupes */}
      <div className={`${activeGroup ? "hidden md:flex" : "flex"} w-full md:w-64 flex-col border-r border-white/[0.06]`}
        style={{ background: "#0a0e18" }}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <span className="text-sm font-bold text-white">Messages</span>
          <button onClick={() => setShowNew(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/40 hover:text-white">
            <Plus size={15} />
          </button>
        </div>

        {loadingGroups ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a]" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 px-4 text-center gap-3">
            <MessageSquare size={28} style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Aucun groupe. Créez-en un avec le bouton +
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => { setActiveGroup(g); loadMessages(g); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: activeGroup?.id === g.id ? "rgba(201,165,90,0.12)" : "transparent",
                  color: activeGroup?.id === g.id ? GOLD : "rgba(255,255,255,0.55)",
                }}
              >
                {g.is_direct
                  ? <Users size={14} className="shrink-0" />
                  : <Hash size={14} className="shrink-0" />
                }
                <span className="text-sm font-medium truncate">{g.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone de chat */}
      <div className={`${activeGroup ? "flex" : "hidden md:flex"} flex-col flex-1 min-w-0`}>
        {activeGroup ? (
          <>
            {/* Header groupe */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]"
              style={{ background: "#0b101c" }}>
              <button onClick={() => setActiveGroup(null)}
                className="md:hidden p-1 text-white/40 hover:text-white">
                <ArrowLeft size={16} />
              </button>
              <Hash size={15} style={{ color: GOLD }} />
              <span className="text-sm font-bold text-white">{activeGroup.name}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ background: "#080c16" }}>
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <MessageSquare size={32} style={{ color: "rgba(255,255,255,0.1)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Aucun message. Soyez le premier à écrire !
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === myId;
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase"
                        style={{ background: isMe ? GOLD : "rgba(255,255,255,0.1)" }}>
                        {msg.sender.name[0]}
                      </div>
                      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {isMe ? "Vous" : msg.sender.name} · {timeAgo(msg.created_at)}
                        </span>
                        <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${isMe ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                          style={{
                            background: isMe ? "rgba(201,165,90,0.2)" : "rgba(255,255,255,0.06)",
                            color: msg.is_deleted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.88)",
                            fontStyle: msg.is_deleted ? "italic" : "normal",
                          }}>
                          {msg.is_deleted ? "Message supprimé" : msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]"
              style={{ background: "#0b101c" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message dans #${activeGroup.name}`}
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none bg-white/5 text-white placeholder:text-white/25"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-40"
                style={{ background: GOLD }}
              >
                <Send size={15} className="text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <MessageSquare size={40} style={{ color: "rgba(255,255,255,0.08)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Sélectionnez un groupe pour commencer
            </p>
          </div>
        )}
      </div>

      {/* Modal nouveau groupe */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6"
            style={{ background: "#0f1520" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Nouveau groupe</h2>
              <button onClick={() => setShowNew(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createGroup(); }}
              placeholder="Nom du groupe"
              className="w-full rounded-xl border px-4 py-3 text-sm bg-white/5 text-white placeholder:text-white/30 outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
              autoFocus
            />
            <button onClick={createGroup}
              disabled={!newGroupName.trim()}
              className="mt-4 w-full h-[44px] rounded-xl text-sm font-bold text-white transition disabled:opacity-40"
              style={{ background: GOLD }}>
              Créer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
