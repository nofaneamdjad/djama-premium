"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Plus, MoreVertical, Copy, Trash2,
  Play, PauseCircle, Edit3, BarChart2, Sparkles, TrendingUp, Bot,
} from "lucide-react";
import type { Chatbot } from "@/lib/chatbot/types";
import { useTheme } from "@/lib/theme-context";

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

const VIOLET = "#8b5cf6";
const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

export default function ChatbotDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [tab,          setTab]          = useState<Tab>("chatbots");
  const [bots,         setBots]         = useState<Chatbot[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [menuId,       setMenuId]       = useState<string | null>(null);
  const [creating,     setCreating]     = useState(false);
  const [aiPrompt,     setAiPrompt]     = useState("");
  const [showWizard,   setShowWizard]   = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [globalStats,  setGlobalStats]  = useState<GlobalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsDays,    setStatsDays]    = useState(30);

  const bg     = isDark ? CARD   : "#ffffff";
  const border = isDark ? BORDER : "rgba(0,0,0,0.08)";
  const text   = isDark ? "rgba(255,255,255,0.85)" : "#111827";
  const muted  = isDark ? "rgba(255,255,255,0.40)" : "#6b7280";
  const subtle = isDark ? "rgba(255,255,255,0.06)" : "#f9fafb";

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
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: text }}>
            <MessageSquare className="w-6 h-6" /> Chatbot IA
          </h1>
          <p className="text-sm mt-1" style={{ color: muted }}>
            Créez des assistants virtuels pour vos visiteurs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ border: `1px solid ${VIOLET}40`, color: VIOLET, background: `${VIOLET}10` }}
          >
            <Sparkles className="w-4 h-4" /> Créer avec l&apos;IA
          </button>
          <button
            onClick={() => void create()}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ background: VIOLET, color: "#fff" }}
          >
            <Plus className="w-4 h-4" />
            {creating ? "Création…" : "Nouveau chatbot"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6" style={{ borderBottom: `1px solid ${border}` }}>
        {(["chatbots", "stats"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="pb-3 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: tab === t ? VIOLET : "transparent",
              color:       tab === t ? VIOLET : muted,
            }}
          >
            {t === "chatbots" ? `Mes chatbots (${bots.length})` : "Statistiques"}
          </button>
        ))}
      </div>

      {/* AI Wizard modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="rounded-xl p-6 w-full max-w-lg shadow-2xl" style={{ background: isDark ? "#1a1f2e" : "#fff", border: `1px solid ${border}` }}>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: text }}>
              <Sparkles className="w-5 h-5" style={{ color: VIOLET }} /> Créer avec l&apos;IA
            </h2>
            <p className="text-sm mb-4" style={{ color: muted }}>
              Décrivez votre entreprise et vos besoins. L&apos;IA configurera le chatbot pour vous.
            </p>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={4}
              placeholder="Ex : Je gère un cabinet dentaire à Paris. J'ai besoin d'un chatbot pour répondre aux questions sur les horaires, les soins proposés et prendre des RDV."
              className="w-full rounded-lg p-3 text-sm resize-none focus:outline-none transition-colors"
              style={{
                background:  isDark ? "rgba(255,255,255,0.05)" : "#f9fafb",
                border:      `1px solid ${border}`,
                color:       text,
              }}
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setShowWizard(false)} className="px-4 py-2 text-sm transition-colors" style={{ color: muted }}>
                Annuler
              </button>
              <button
                onClick={() => void createWithAI()}
                disabled={wizardLoading || !aiPrompt.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                style={{ background: VIOLET, color: "#fff" }}
              >
                {wizardLoading ? "Génération…" : "Générer le chatbot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "chatbots" && (
        <>
          {loading && <p className="text-sm" style={{ color: muted }}>Chargement…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && bots.length === 0 && (
            <div className="text-center py-20" style={{ color: muted }}>
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun chatbot</p>
              <p className="text-sm mt-1">Créez votre premier chatbot pour commencer.</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map(bot => {
              const st = STATUS_LABELS[bot.status] ?? STATUS_LABELS.draft;
              return (
                <div key={bot.id} className="rounded-xl p-4 relative transition-shadow hover:shadow-lg"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${st.color}18`, color: st.color }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: st.color }} />
                      {st.label}
                    </span>
                    <button
                      onClick={() => setMenuId(menuId === bot.id ? null : bot.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: muted }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action menu */}
                  {menuId === bot.id && (
                    <div className="absolute top-10 right-4 rounded-lg shadow-xl z-10 py-1 min-w-[160px]"
                      style={{ background: isDark ? "#1e2333" : "#fff", border: `1px solid ${border}` }}>
                      <button onClick={() => router.push(`/client/chatbot/${bot.id}/edit`)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors"
                        style={{ color: text }}>
                        <Edit3 className="w-4 h-4" /> Modifier
                      </button>
                      <button onClick={() => router.push(`/client/chatbot/${bot.id}/conversations`)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors"
                        style={{ color: text }}>
                        <MessageSquare className="w-4 h-4" /> Conversations
                      </button>
                      <button onClick={() => void toggleStatus(bot)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors"
                        style={{ color: text }}>
                        {bot.status === "active"
                          ? <><PauseCircle className="w-4 h-4" /> Désactiver</>
                          : <><Play className="w-4 h-4" /> Activer</>
                        }
                      </button>
                      <button onClick={() => void duplicate(bot.id)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors"
                        style={{ color: text }}>
                        <Copy className="w-4 h-4" /> Dupliquer
                      </button>
                      <hr style={{ borderColor: border }} className="my-1" />
                      <button onClick={() => void remove(bot.id)}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 text-red-400">
                        <Trash2 className="w-4 h-4" /> Supprimer
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  <h3 className="font-semibold truncate" style={{ color: text }}>{bot.name}</h3>
                  {bot.description && (
                    <p className="text-sm mt-0.5 line-clamp-2" style={{ color: muted }}>{bot.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 mt-3 text-xs" style={{ color: muted }}>
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
                      className="flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors"
                      style={{ border: `1px solid ${border}`, color: text, background: subtle }}
                    >
                      Configurer
                    </button>
                    <button
                      onClick={() => router.push(`/client/chatbot/${bot.id}/conversations`)}
                      className="flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors"
                      style={{ border: `1px solid ${VIOLET}40`, color: VIOLET, background: `${VIOLET}10` }}
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {[7, 30, 90].map(d => (
                <button key={d}
                  onClick={() => { setStatsDays(d); void loadStats(d); }}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                  style={
                    statsDays === d
                      ? { background: VIOLET, color: "#fff", border: `1px solid ${VIOLET}` }
                      : { border: `1px solid ${border}`, color: muted, background: "transparent" }
                  }
                >
                  {d}j
                </button>
              ))}
            </div>
            {!globalStats && !statsLoading && (
              <button
                onClick={() => void loadStats()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: VIOLET, color: "#fff" }}
              >
                Charger les stats
              </button>
            )}
          </div>

          {statsLoading && <p className="text-sm" style={{ color: muted }}>Chargement des statistiques…</p>}

          {globalStats && !statsLoading && (
            <>
              {/* Cartes résumé */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Conversations",  value: globalStats.summary.total_conversations,  icon: MessageSquare, color: "#8b5cf6" },
                  { label: "Messages IA",    value: globalStats.summary.total_messages,        icon: BarChart2,     color: "#3b82f6" },
                  { label: "Bots actifs",    value: `${globalStats.summary.active_bots} / ${globalStats.summary.total_bots}`, icon: Bot, color: "#10b981" },
                  { label: "Ce mois-ci",     value: `${globalStats.summary.monthly_messages} / 10 000`, icon: TrendingUp, color: "#f59e0b" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                    <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center"
                      style={{ background: `${color}18` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <p className="text-2xl font-bold" style={{ color: text }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: muted }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Status breakdown */}
              {Object.keys(globalStats.status_breakdown).length > 0 && (
                <div className="rounded-xl p-5 mb-6" style={{ background: bg, border: `1px solid ${border}` }}>
                  <h3 className="font-semibold text-sm mb-4" style={{ color: text }}>Répartition des conversations</h3>
                  <div className="flex gap-6 flex-wrap">
                    {[
                      { key: "ai_active",       label: "IA active",      color: "#10b981" },
                      { key: "waiting_agent",   label: "En attente",     color: "#f59e0b" },
                      { key: "agent_connected", label: "Agent connecté", color: "#3b82f6" },
                      { key: "closed",          label: "Fermée",         color: "#6b7280" },
                    ].map(({ key, label, color }) => {
                      const count = globalStats.status_breakdown[key] ?? 0;
                      if (!count) return null;
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span style={{ color: muted }}>{label}</span>
                          <span className="font-semibold" style={{ color: text }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Graphe journalier */}
              {globalStats.daily.length > 0 && (
                <div className="rounded-xl p-5 mb-6" style={{ background: bg, border: `1px solid ${border}` }}>
                  <h3 className="font-semibold text-sm mb-4" style={{ color: text }}>Activité sur {statsDays} jours</h3>
                  <div className="flex items-end gap-1 h-32">
                    {(() => {
                      const maxVal = Math.max(...globalStats.daily.map(d => d.conversations + d.messages), 1);
                      return globalStats.daily.map(d => (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded text-xs px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                            style={{ background: "#1e2333", color: "#fff" }}>
                            {d.date.slice(5)}<br/>{d.conversations} conv · {d.messages} msg
                          </div>
                          <div className="w-full flex flex-col justify-end h-full gap-px">
                            <div className="w-full rounded-t-sm" style={{ height: `${(d.messages / maxVal) * 100}%`, background: `${VIOLET}40` }} />
                            <div className="w-full" style={{ height: `${(d.conversations / maxVal) * 100}%`, background: VIOLET }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs" style={{ color: muted }}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: VIOLET }} /> Conversations
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: `${VIOLET}40` }} /> Messages IA
                    </span>
                  </div>
                </div>
              )}

              {/* Top bots */}
              {globalStats.bots.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="px-5 py-3" style={{ borderBottom: `1px solid ${border}`, background: subtle }}>
                    <h3 className="font-semibold text-sm" style={{ color: text }}>Performance par chatbot</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${border}` }}>
                        <th className="px-5 py-2 text-left text-xs" style={{ color: muted }}>Chatbot</th>
                        <th className="px-5 py-2 text-right text-xs" style={{ color: muted }}>Conversations</th>
                        <th className="px-5 py-2 text-right text-xs" style={{ color: muted }}>Messages</th>
                        <th className="px-5 py-2 text-right text-xs" style={{ color: muted }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalStats.bots.map(b => (
                        <tr key={b.id} className="cursor-pointer transition-colors"
                          style={{ borderBottom: `1px solid ${border}` }}
                          onClick={() => router.push(`/client/chatbot/${b.id}/edit`)}>
                          <td className="px-5 py-3 font-medium" style={{ color: text }}>{b.name}</td>
                          <td className="px-5 py-3 text-right" style={{ color: muted }}>{b.conversation_count}</td>
                          <td className="px-5 py-3 text-right" style={{ color: muted }}>{b.message_count}</td>
                          <td className="px-5 py-3 text-right">
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                              style={
                                b.status === "active"   ? { background: "#10b98118", color: "#10b981" } :
                                b.status === "disabled" ? { background: "#ef444418", color: "#ef4444" } :
                                                          { background: `rgba(255,255,255,0.07)`, color: muted }
                              }>
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
