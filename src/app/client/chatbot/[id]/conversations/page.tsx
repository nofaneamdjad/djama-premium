"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MessageSquare, ArrowLeft, User, Clock,
  CheckCircle, AlertCircle, Headphones,
} from "lucide-react";
import type { ChatbotConversation } from "@/lib/chatbot/types";

const STATUS_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ai_active:       { label: "IA active",       icon: <MessageSquare className="w-3.5 h-3.5" />, color: "#10b981" },
  waiting_agent:   { label: "Attend agent",    icon: <AlertCircle className="w-3.5 h-3.5" />,   color: "#f59e0b" },
  agent_connected: { label: "Agent connecté",  icon: <Headphones className="w-3.5 h-3.5" />,    color: "#3b82f6" },
  closed:          { label: "Fermée",           icon: <CheckCircle className="w-3.5 h-3.5" />,   color: "#6b7280" },
};

export default function ConversationsPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [convs,   setConvs]   = useState<ChatbotConversation[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<string>("all");

  const load = async (status?: string) => {
    setLoading(true);
    const qs  = status && status !== "all" ? `?status=${status}` : "";
    const res = await fetch(`/api/chatbot/${id}/conversations${qs}`);
    const d   = await res.json() as { conversations?: ChatbotConversation[]; total?: number };
    setConvs(d.conversations ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { void load(filter); }, [id, filter]);

  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000)    return "à l'instant";
    if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
    if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)} h`;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Conversations</h1>
          <p className="text-gray-500 text-sm">{total} conversation{total !== 1 ? "s" : ""} au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "ai_active", "waiting_agent", "agent_connected", "closed"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === s
                ? "bg-violet-600 text-white border-violet-600"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "Toutes" : (STATUS_INFO[s]?.label ?? s)}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-sm">Chargement…</p>}

      {!loading && convs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aucune conversation</p>
        </div>
      )}

      <div className="space-y-2">
        {convs.map(conv => {
          const st = STATUS_INFO[conv.status] ?? STATUS_INFO.ai_active;
          return (
            <div key={conv.id} className="border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900">
                      {conv.visitor_name ?? conv.visitor_email ?? `Visiteur #${conv.id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {fmt(conv.last_message_at ?? conv.created_at)}
                      {conv.message_count !== undefined && (
                        <span className="ml-2">{conv.message_count} message{(conv.message_count as number) > 1 ? "s" : ""}</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${st.color}18`, color: st.color }}>
                  {st.icon} {st.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
