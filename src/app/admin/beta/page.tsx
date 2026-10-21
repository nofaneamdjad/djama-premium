"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, MessageSquare, Bug, Lightbulb, AlertCircle, Star,
  Settings, ToggleLeft, ToggleRight, RefreshCw, TrendingUp,
  Clock, Shield, Loader2, ChevronRight, CheckCircle, XCircle,
} from "lucide-react";

const GOLD = "#c9a55a";

interface BetaConfig {
  signups_open: boolean;
  max_testers: number;
  current_testers: number;
  beta_ends_at: string | null;
  ai_quota_per_user: number;
  storage_quota_mb: number;
  updated_at: string;
}

interface BetaStats {
  total_waitlist: number;
  total_beta_users: number;
  total_feedback: number;
  recent_signups_7d: number;
  total_ai_calls: number;
  feedback_by_type: Record<string, number>;
  feedback_by_status: Record<string, number>;
}

interface Feedback {
  id: string;
  type: string;
  app_name: string | null;
  message: string;
  rating: number | null;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open:        "#f59e0b",
  in_progress: "#3b82f6",
  closed:      "#22c55e",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  bug:        Bug,
  feature:    Lightbulb,
  difficulty: AlertCircle,
  rating:     Star,
  general:    MessageSquare,
};

const TYPE_LABELS: Record<string, string> = {
  bug:        "Bug",
  feature:    "Fonctionnalité",
  difficulty: "Difficulté",
  rating:     "Évaluation",
  general:    "Général",
};

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div style={{
      background: "#111827", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <Icon size={14} color={color} />
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>{sub}</div>}
    </div>
  );
}

export default function BetaAdminPage() {
  const [config,    setConfig]    = useState<BetaConfig | null>(null);
  const [stats,     setStats]     = useState<BetaStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState<"overview" | "feedbacks" | "settings">("overview");
  const [fbFilter,  setFbFilter]  = useState<string>("");
  const [selected,  setSelected]  = useState<Feedback | null>(null);
  const [reply,     setReply]     = useState("");
  const [replyStatus, setReplyStatus] = useState<"open"|"in_progress"|"closed">("in_progress");
  const [sendingReply, setSendingReply] = useState(false);
  const [configDraft, setConfigDraft] = useState<Partial<BetaConfig>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [statsRes, fbRes] = await Promise.all([
      fetch("/api/admin/beta"),
      fetch("/api/admin/beta/feedback"),
    ]);
    if (statsRes.ok) {
      const d = await statsRes.json() as { config: BetaConfig; stats: BetaStats };
      setConfig(d.config);
      setStats(d.stats);
      setConfigDraft(d.config);
    }
    if (fbRes.ok) {
      const d = await fbRes.json() as { feedbacks: Feedback[] };
      setFeedbacks(d.feedbacks);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleSignups() {
    if (!config) return;
    setSaving(true);
    await fetch("/api/admin/beta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signups_open: !config.signups_open }),
    });
    await load();
    setSaving(false);
  }

  async function saveConfig() {
    setSaving(true);
    await fetch("/api/admin/beta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configDraft),
    });
    await load();
    setSaving(false);
  }

  async function sendReply() {
    if (!selected) return;
    setSendingReply(true);
    await fetch("/api/admin/beta/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status: replyStatus, admin_reply: reply || undefined }),
    });
    setReply("");
    setSelected(null);
    await load();
    setSendingReply(false);
  }

  const filteredFeedbacks = feedbacks.filter(f => !fbFilter || f.status === fbFilter);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Loader2 size={20} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ background: "rgba(201,165,90,0.12)", borderRadius: 8, padding: "4px 10px", fontSize: "0.65rem", fontWeight: 700, color: GOLD, letterSpacing: "0.08em" }}>BÊTA PUBLIQUE</span>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", margin: 0 }}>Tableau de bord bêta</h1>
          </div>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", margin: 0 }}>
            Inscriptions : {config?.signups_open ? <span style={{ color: "#22c55e" }}>Ouvertes</span> : <span style={{ color: "#f59e0b" }}>Fermées</span>}
            {config?.current_testers !== undefined && ` · ${config.current_testers}/${config.max_testers} testeurs`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => void load()} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, color: "rgba(255,255,255,0.5)", padding: "0.5rem 0.75rem",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem",
          }}>
            <RefreshCw size={13} /> Actualiser
          </button>
          <button onClick={() => void toggleSignups()} disabled={saving} style={{
            background: config?.signups_open ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${config?.signups_open ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
            borderRadius: 8,
            color: config?.signups_open ? "#ef4444" : "#22c55e",
            padding: "0.5rem 0.75rem", cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 600,
          }}>
            {config?.signups_open ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {config?.signups_open ? "Fermer inscriptions" : "Ouvrir inscriptions"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: "2rem" }}>
        <StatCard label="Liste d'attente" value={stats?.total_waitlist ?? 0} sub="+7j : +" + (stats?.recent_signups_7d ?? 0)} icon={Users} color={GOLD} />
        <StatCard label="Testeurs actifs" value={stats?.total_beta_users ?? 0} sub={`max ${config?.max_testers ?? 50}`} icon={Shield} color="#3b82f6" />
        <StatCard label="Feedbacks" value={stats?.total_feedback ?? 0} sub={`${stats?.feedback_by_status?.open ?? 0} ouverts`} icon={MessageSquare} color="#f59e0b" />
        <StatCard label="Appels IA" value={stats?.total_ai_calls ?? 0} sub={`quota ${config?.ai_quota_per_user ?? 200}/user`} icon={TrendingUp} color="#22c55e" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        {(["overview", "feedbacks", "settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "0.6rem 1rem",
            fontSize: "0.82rem", fontWeight: tab === t ? 600 : 400,
            color: tab === t ? "#fff" : "rgba(255,255,255,0.4)",
            borderBottom: tab === t ? `2px solid ${GOLD}` : "2px solid transparent",
            marginBottom: -1,
          }}>
            {t === "overview" ? "Vue d'ensemble" : t === "feedbacks" ? `Feedbacks (${feedbacks.length})` : "Paramètres"}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Feedbacks par type */}
          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: 600 }}>
              Feedbacks par type
            </h3>
            {Object.entries(stats?.feedback_by_type ?? {}).map(([type, count]) => {
              const TypeIcon = TYPE_ICONS[type] ?? MessageSquare;
              return (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <TypeIcon size={13} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", flex: 1 }}>{TYPE_LABELS[type] ?? type}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>{count as number}</span>
                  <div style={{ width: 60, background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 4 }}>
                    <div style={{ width: `${Math.min(100, ((count as number) / (stats?.total_feedback || 1)) * 100)}%`, background: GOLD, borderRadius: 4, height: 4 }} />
                  </div>
                </div>
              );
            })}
            {!Object.keys(stats?.feedback_by_type ?? {}).length && (
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>Aucun feedback pour l'instant.</p>
            )}
          </div>

          {/* Statuts feedbacks */}
          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: 600 }}>
              Statuts des feedbacks
            </h3>
            {["open", "in_progress", "closed"].map(s => {
              const count = stats?.feedback_by_status?.[s] ?? 0;
              const labels: Record<string, string> = { open: "Ouverts", in_progress: "En cours", closed: "Fermés" };
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[s] }} />
                  <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", flex: 1 }}>{labels[s]}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>{count}</span>
                </div>
              );
            })}

            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", fontWeight: 600 }}>
                Accès rapides
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => { setTab("feedbacks"); setFbFilter("open"); }} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, padding: "0.5rem 0.75rem", color: "rgba(255,255,255,0.6)",
                  fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textAlign: "left",
                }}>
                  <ChevronRight size={12} /> Voir feedbacks ouverts ({stats?.feedback_by_status?.open ?? 0})
                </button>
                <button onClick={() => setTab("settings")} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, padding: "0.5rem 0.75rem", color: "rgba(255,255,255,0.6)",
                  fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textAlign: "left",
                }}>
                  <Settings size={12} /> Configurer quotas et délais
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedbacks */}
      {tab === "feedbacks" && (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 16 }}>
          <div>
            {/* Filtres */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {[["", "Tous"], ["open", "Ouverts"], ["in_progress", "En cours"], ["closed", "Fermés"]].map(([val, label]) => (
                <button key={val} onClick={() => setFbFilter(val)} style={{
                  padding: "0.35rem 0.75rem", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem",
                  background: fbFilter === val ? "rgba(201,165,90,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${fbFilter === val ? "rgba(201,165,90,0.3)" : "rgba(255,255,255,0.07)"}`,
                  color: fbFilter === val ? GOLD : "rgba(255,255,255,0.5)",
                }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredFeedbacks.map(fb => {
                const FbIcon = TYPE_ICONS[fb.type] ?? MessageSquare;
                return (
                  <button
                    key={fb.id}
                    onClick={() => { setSelected(fb); setReply(fb.admin_reply ?? ""); setReplyStatus(fb.status as "open"|"in_progress"|"closed"); }}
                    style={{
                      background: selected?.id === fb.id ? "rgba(201,165,90,0.06)" : "#111827",
                      border: `1px solid ${selected?.id === fb.id ? "rgba(201,165,90,0.2)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 10, padding: "0.875rem 1rem", cursor: "pointer", textAlign: "left",
                      display: "flex", flexDirection: "column", gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FbIcon size={13} color="rgba(255,255,255,0.4)" />
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{TYPE_LABELS[fb.type] ?? fb.type}</span>
                      {fb.app_name && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>· {fb.app_name}</span>}
                      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[fb.status] ?? "#6b7280" }} />
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>
                          {new Date(fb.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      </span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fb.message}
                    </p>
                    {fb.rating && (
                      <span style={{ fontSize: "0.7rem", color: "#f59e0b" }}>{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</span>
                    )}
                  </button>
                );
              })}
              {!filteredFeedbacks.length && (
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>
                  Aucun feedback {fbFilter ? `avec ce filtre` : ""}.
                </p>
              )}
            </div>
          </div>

          {/* Panneau réponse */}
          {selected && (
            <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 12, height: "fit-content", position: "sticky", top: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>Répondre</span>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "1rem" }}>×</button>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "0.75rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                {selected.message}
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Statut</label>
                <select
                  value={replyStatus}
                  onChange={e => setReplyStatus(e.target.value as "open"|"in_progress"|"closed")}
                  style={{ width: "100%", background: "#1a1f30", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", padding: "0.4rem 0.6rem", fontSize: "0.82rem" }}
                >
                  <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="closed">Fermé</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Réponse admin (optionnel)</label>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={4}
                  placeholder="Votre réponse interne ou externe…"
                  style={{ width: "100%", background: "#1a1f30", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", padding: "0.5rem 0.6rem", fontSize: "0.82rem", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              <button onClick={() => void sendReply()} disabled={sendingReply} style={{
                background: "rgba(201,165,90,0.1)", border: "1px solid rgba(201,165,90,0.25)",
                borderRadius: 8, color: GOLD, padding: "0.55rem", fontSize: "0.82rem", fontWeight: 600,
                cursor: sendingReply ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {sendingReply ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
                Enregistrer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {tab === "settings" && config && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 700 }}>
          {[
            { label: "Testeurs max", key: "max_testers", type: "number", min: 1, max: 5000 },
            { label: "Quota IA (appels/user)", key: "ai_quota_per_user", type: "number", min: 0, max: 10000 },
            { label: "Stockage (Mo/user)", key: "storage_quota_mb", type: "number", min: 0, max: 50000 },
            { label: "Fin de bêta", key: "beta_ends_at", type: "date" },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={
                  field.type === "date"
                    ? (configDraft[field.key as keyof BetaConfig] as string ?? "")?.slice(0, 10) ?? ""
                    : String(configDraft[field.key as keyof BetaConfig] ?? "")
                }
                onChange={e => setConfigDraft(d => ({ ...d, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value || null }))}
                style={{
                  width: "100%", background: "#1a1f30", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, color: "#fff", padding: "0.5rem 0.75rem", fontSize: "0.85rem",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          ))}

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => void saveConfig()} disabled={saving} style={{
              background: "rgba(201,165,90,0.1)", border: "1px solid rgba(201,165,90,0.25)",
              borderRadius: 10, color: GOLD, padding: "0.65rem 1.25rem", fontSize: "0.875rem", fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
              Sauvegarder
            </button>
            <button onClick={() => void toggleSignups()} disabled={saving} style={{
              background: config.signups_open ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
              border: `1px solid ${config.signups_open ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
              borderRadius: 10, color: config.signups_open ? "#ef4444" : "#22c55e",
              padding: "0.65rem 1.25rem", fontSize: "0.875rem", fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              {config.signups_open ? <XCircle size={14} /> : <CheckCircle size={14} />}
              {config.signups_open ? "Fermer les inscriptions" : "Ouvrir les inscriptions"}
            </button>
          </div>

          <div style={{ gridColumn: "1 / -1", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: "0.875rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Clock size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              <strong style={{ color: "#f59e0b" }}>Rappel sécurité :</strong> Les inscriptions sont fermées par défaut.
              N'activez pas les inscriptions sans avoir effectué les tests de la Phase 10 et obtenu l'autorisation finale.
              Dernière mise à jour : {new Date(config.updated_at).toLocaleString("fr-FR")}.
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
