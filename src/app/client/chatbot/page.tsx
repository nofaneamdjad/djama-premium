"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Plus, MoreVertical, Copy, Trash2,
  Play, PauseCircle, Edit3, BarChart2, Sparkles,
} from "lucide-react";
import type { Chatbot } from "@/lib/chatbot/types";

type Tab = "chatbots" | "stats";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",  color: "#6b7280" },
  active:   { label: "Actif",      color: "#10b981" },
  disabled: { label: "Désactivé",  color: "#ef4444" },
};

export default function ChatbotDashboard() {
  const router = useRouter();
  const [tab,       setTab]       = useState<Tab>("chatbots");
  const [bots,      setBots]      = useState<Chatbot[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [menuId,    setMenuId]    = useState<string | null>(null);
  const [creating,  setCreating]  = useState(false);
  const [aiPrompt,  setAiPrompt]  = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/chatbot");
    const d = await r.json() as { chatbots?: Chatbot[]; error?: string };
    if (d.error) setError(d.error);
    else setBots(d.chatbots ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    setCreating(true);
    const r = await fetch("/api/chatbot", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: "Nouveau Chatbot" }),
    });
    const d = await r.json() as { chatbot?: Chatbot };
    setCreating(false);
    if (d.chatbot) router.push(`/client/chatbot/${d.chatbot.id}/edit`);
  };

  const createWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setWizardLoading(true);
    const r = await fetch("/api/chatbot/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt: aiPrompt }),
    });
    const d = await r.json() as { chatbot?: Chatbot };
    setWizardLoading(false);
    setShowWizard(false);
    setAiPrompt("");
    if (d.chatbot) router.push(`/client/chatbot/${d.chatbot.id}/edit`);
  };

  const duplicate = async (id: string) => {
    setMenuId(null);
    const r = await fetch(`/api/chatbot/${id}/duplicate`, { method: "POST" });
    const d = await r.json() as { chatbot?: Chatbot };
    if (d.chatbot) void load();
  };

  const toggleStatus = async (bot: Chatbot) => {
    setMenuId(null);
    const next = bot.status === "active" ? "disabled" : "active";
    await fetch(`/api/chatbot/${bot.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: next }),
    });
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce chatbot et toutes ses conversations ?")) return;
    setMenuId(null);
    await fetch(`/api/chatbot/${id}`, { method: "DELETE" });
    void load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> Chatbot IA
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Créez des assistants virtuels pour vos visiteurs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-50 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" /> Créer avec l&apos;IA
          </button>
          <button
            onClick={() => void create()}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Création…" : "Nouveau chatbot"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {(["chatbots", "stats"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "chatbots" ? `Mes chatbots (${bots.length})` : "Statistiques"}
          </button>
        ))}
      </div>

      {/* AI Wizard modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" /> Créer avec l&apos;IA
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Décrivez votre entreprise et vos besoins. L&apos;IA configurera le chatbot pour vous.
            </p>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={4}
              placeholder="Ex : Je gère un cabinet dentaire à Paris. J'ai besoin d'un chatbot pour répondre aux questions sur les horaires, les soins proposés et prendre des RDV."
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setShowWizard(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button
                onClick={() => void createWithAI()}
                disabled={wizardLoading || !aiPrompt.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {wizardLoading ? "Génération…" : "Générer le chatbot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "chatbots" && (
        <>
          {loading && <p className="text-gray-500 text-sm">Chargement…</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!loading && bots.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun chatbot</p>
              <p className="text-sm mt-1">Créez votre premier chatbot pour commencer.</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map(bot => {
              const st = STATUS_LABELS[bot.status] ?? STATUS_LABELS.draft;
              return (
                <div key={bot.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow relative">
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${st.color}18`, color: st.color }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: st.color }} />
                      {st.label}
                    </span>
                    <button
                      onClick={() => setMenuId(menuId === bot.id ? null : bot.id)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Action menu */}
                  {menuId === bot.id && (
                    <div className="absolute top-10 right-4 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
                      <button onClick={() => router.push(`/client/chatbot/${bot.id}/edit`)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50">
                        <Edit3 className="w-4 h-4" /> Modifier
                      </button>
                      <button onClick={() => router.push(`/client/chatbot/${bot.id}/conversations`)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50">
                        <MessageSquare className="w-4 h-4" /> Conversations
                      </button>
                      <button onClick={() => void toggleStatus(bot)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50">
                        {bot.status === "active"
                          ? <><PauseCircle className="w-4 h-4" /> Désactiver</>
                          : <><Play className="w-4 h-4" /> Activer</>
                        }
                      </button>
                      <button onClick={() => void duplicate(bot.id)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50">
                        <Copy className="w-4 h-4" /> Dupliquer
                      </button>
                      <hr className="my-1" />
                      <button onClick={() => void remove(bot.id)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" /> Supprimer
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  <h3 className="font-semibold text-gray-900 truncate">{bot.name}</h3>
                  {bot.description && (
                    <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{bot.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {bot.conversation_count ?? 0} conv.
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" />
                      {bot.message_count ?? 0} msg.
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => router.push(`/client/chatbot/${bot.id}/edit`)}
                      className="flex-1 py-1.5 text-xs border rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Configurer
                    </button>
                    <button
                      onClick={() => router.push(`/client/chatbot/${bot.id}/conversations`)}
                      className="flex-1 py-1.5 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 font-medium"
                    >
                      Conversations
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "stats" && (
        <div className="text-center py-20 text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Statistiques globales</p>
          <p className="text-sm mt-1">Disponible prochainement dans le Jalon B.</p>
        </div>
      )}
    </div>
  );
}
