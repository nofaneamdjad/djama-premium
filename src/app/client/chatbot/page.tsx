"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Plus, MoreVertical, Copy, Trash2,
  Play, PauseCircle, Edit3, BarChart2, Sparkles, TrendingUp, Bot,
} from "lucide-react";
import type { Chatbot } from "@/lib/chatbot/types";

interface DailyStat { date: string; conversations: number; messages: number }
interface StatsSummary {
  total_conversations: number;
  total_messages:      number;
  active_bots:         number;
  total_bots:          number;
  monthly_messages:    number;
}
interface GlobalStats {
  period:           number;
  summary:          StatsSummary;
  status_breakdown: Record<string, number>;
  daily:            DailyStat[];
  bots:             Array<{ id: string; name: string; status: string; conversation_count: number; message_count: number }>;
}

type Tab = "chatbots" | "stats";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",  color: "#6b7280" },
  active:   { label: "Actif",      color: "#10b981" },
  disabled: { label: "Désactivé",  color: "#ef4444" },
};

export default function ChatbotDashboard() {
  const router = useRouter();
  const [tab,       setTab]       = useState<Tab>("chatbots");
  const [bots,         setBots]        = useState<Chatbot[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState<string | null>(null);
  const [menuId,       setMenuId]      = useState<string | null>(null);
  const [creating,     setCreating]    = useState(false);
  const [aiPrompt,     setAiPrompt]    = useState("");
  const [showWizard,   setShowWizard]  = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [globalStats,  setGlobalStats] = useState<GlobalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsDays,    setStatsDays]   = useState(30);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/chatbot");
    const d = await r.json() as { chatbots?: Chatbot[]; error?: string };
    if (d.error) setError(d.error);
    else setBots(d.chatbots ?? []);
    setLoading(false);
  };

  const loadStats = async (days = statsDays) => {
    setStatsLoading(true);
    const r = await fetch(`/api/chatbot/stats?days=${days}`);
    const d = await r.json() as GlobalStats;
    setGlobalStats(d);
    setStatsLoading(false);
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
        <div>
          {/* Période + chargement */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {[7, 30, 90].map(d => (
                <button key={d}
                  onClick={() => { setStatsDays(d); void loadStats(d); }}
                  className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    statsDays === d
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {d}j
                </button>
              ))}
            </div>
            {!globalStats && !statsLoading && (
              <button
                onClick={() => void loadStats()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
              >
                Charger les stats
              </button>
            )}
          </div>

          {statsLoading && <p className="text-gray-500 text-sm">Chargement des statistiques…</p>}

          {globalStats && !statsLoading && (
            <>
              {/* Cartes résumé */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Conversations", value: globalStats.summary.total_conversations, icon: MessageSquare, color: "violet" },
                  { label: "Messages IA", value: globalStats.summary.total_messages, icon: BarChart2, color: "blue" },
                  { label: "Bots actifs", value: `${globalStats.summary.active_bots} / ${globalStats.summary.total_bots}`, icon: Bot, color: "green" },
                  { label: "Ce mois-ci", value: `${globalStats.summary.monthly_messages} / 10 000`, icon: TrendingUp, color: "orange" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="border rounded-xl p-4 bg-white">
                    <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center bg-${color}-50`}>
                      <Icon className={`w-4 h-4 text-${color}-600`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Status breakdown */}
              {Object.keys(globalStats.status_breakdown).length > 0 && (
                <div className="border rounded-xl p-5 bg-white mb-6">
                  <h3 className="font-semibold text-sm text-gray-700 mb-4">Répartition des conversations</h3>
                  <div className="flex gap-6 flex-wrap">
                    {[
                      { key: "ai_active",       label: "IA active",    color: "#10b981" },
                      { key: "waiting_agent",   label: "En attente",   color: "#f59e0b" },
                      { key: "agent_connected", label: "Agent connecté", color: "#3b82f6" },
                      { key: "closed",          label: "Fermée",       color: "#6b7280" },
                    ].map(({ key, label, color }) => {
                      const count = globalStats.status_breakdown[key] ?? 0;
                      if (!count) return null;
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-gray-600">{label}</span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Graphe journalier */}
              {globalStats.daily.length > 0 && (
                <div className="border rounded-xl p-5 bg-white mb-6">
                  <h3 className="font-semibold text-sm text-gray-700 mb-4">Activité sur {statsDays} jours</h3>
                  <div className="flex items-end gap-1 h-32">
                    {(() => {
                      const maxVal = Math.max(...globalStats.daily.map(d => d.conversations + d.messages), 1);
                      return globalStats.daily.map(d => (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {d.date.slice(5)}<br/>{d.conversations} conv · {d.messages} msg
                          </div>
                          <div className="w-full flex flex-col justify-end h-full gap-px">
                            <div className="w-full rounded-t-sm bg-violet-200"
                              style={{ height: `${(d.messages / maxVal) * 100}%` }} />
                            <div className="w-full bg-violet-600"
                              style={{ height: `${(d.conversations / maxVal) * 100}%` }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-violet-600 inline-block" /> Conversations</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-violet-200 inline-block" /> Messages IA</span>
                  </div>
                </div>
              )}

              {/* Top bots */}
              {globalStats.bots.length > 0 && (
                <div className="border rounded-xl bg-white overflow-hidden">
                  <div className="px-5 py-3 border-b bg-gray-50">
                    <h3 className="font-semibold text-sm text-gray-700">Performance par chatbot</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b">
                        <th className="px-5 py-2 text-left">Chatbot</th>
                        <th className="px-5 py-2 text-right">Conversations</th>
                        <th className="px-5 py-2 text-right">Messages</th>
                        <th className="px-5 py-2 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalStats.bots.map(b => (
                        <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/client/chatbot/${b.id}/edit`)}>
                          <td className="px-5 py-3 font-medium text-gray-900">{b.name}</td>
                          <td className="px-5 py-3 text-right text-gray-600">{b.conversation_count}</td>
                          <td className="px-5 py-3 text-right text-gray-600">{b.message_count}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              b.status === "active" ? "bg-green-50 text-green-700" :
                              b.status === "disabled" ? "bg-red-50 text-red-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {b.status === "active" ? "Actif" : b.status === "disabled" ? "Désactivé" : "Brouillon"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
