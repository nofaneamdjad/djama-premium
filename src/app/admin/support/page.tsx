"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, MessageSquare, Mail, Clock, CheckCircle, AlertCircle, Loader2, ChevronDown, Send, X } from "lucide-react";

const GOLD   = "#c9a55a";
const BORDER = "rgba(255,255,255,0.07)";
const CARD   = "#131620";

type TicketStatus   = "open" | "in_progress" | "closed";
type TicketPriority = "low" | "normal" | "high" | "urgent";

interface Ticket {
  id:           string;
  email:        string;
  subject:      string;
  message:      string;
  status:       TicketStatus;
  priority:     TicketPriority;
  admin_reply:  string | null;
  replied_at:   string | null;
  created_at:   string;
  updated_at:   string;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open:        "Ouvert",
  in_progress: "En cours",
  closed:      "Résolu",
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  open:        "rgba(239,68,68,0.15)",
  in_progress: "rgba(201,165,90,0.15)",
  closed:      "rgba(34,197,94,0.12)",
};

const STATUS_TEXT: Record<TicketStatus, string> = {
  open:        "#ef4444",
  in_progress: GOLD,
  closed:      "#22c55e",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low:    "Faible",
  normal: "Normal",
  high:   "Haute",
  urgent: "Urgent",
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  low:    "#6b7280",
  normal: "#3b82f6",
  high:   GOLD,
  urgent: "#ef4444",
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function Badge({ status }: { status: TicketStatus }) {
  return (
    <span style={{
      background: STATUS_COLORS[status],
      color: STATUS_TEXT[status],
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: "0.72rem",
      fontWeight: 600,
      letterSpacing: "0.03em",
    }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function PriorityDot({ priority }: { priority: TicketPriority }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: PRIORITY_DOT[priority], display: "inline-block" }} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export default function SupportAdminPage() {
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<string>("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply,    setReply]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      const res  = await fetch(`/api/admin/support?${params.toString()}`);
      const data = await res.json() as { tickets?: Ticket[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setTickets(data.tickets ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const filtered = tickets.filter(t =>
    !search || t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const openTickets     = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;

  async function handlePatch(id: string, patch: Partial<{ status: string; priority: string; admin_reply: string }>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      showToast("Ticket mis à jour ✓");
      await load();
      if (selected?.id === id) {
        setSelected(prev => prev ? { ...prev, ...patch, updated_at: new Date().toISOString() } as Ticket : prev);
        if (patch.admin_reply !== undefined) setReply("");
      }
    } catch (err) {
      showToast(`Erreur : ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f18", color: "#fff", fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 999,
          background: "#1a1f30", border: `1px solid ${BORDER}`,
          borderRadius: 10, padding: "0.75rem 1.25rem",
          color: "#c9a55a", fontSize: "0.875rem", fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", margin: 0 }}>Support</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
            Tickets d&apos;assistance clients
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(201,165,90,0.1)", border: `1px solid rgba(201,165,90,0.25)`,
            color: GOLD, borderRadius: 10, padding: "0.5rem 1rem",
            fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={14} />}
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total tickets", value: tickets.length, icon: <MessageSquare size={18} color={GOLD} /> },
          { label: "Ouverts", value: openTickets, icon: <AlertCircle size={18} color="#ef4444" /> },
          { label: "En cours", value: inProgressCount, icon: <Clock size={18} color={GOLD} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
            padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ background: "rgba(201,165,90,0.08)", borderRadius: 8, padding: 8 }}>{icon}</div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text"
            placeholder="Rechercher email, sujet…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 32, padding: "0.5rem 0.75rem 0.5rem 32px",
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
              color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              appearance: "none", background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 10, color: "rgba(255,255,255,0.7)", padding: "0.5rem 2rem 0.5rem 0.75rem",
              fontSize: "0.82rem", outline: "none", cursor: "pointer",
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="open">Ouverts</option>
            <option value="in_progress">En cours</option>
            <option value="closed">Résolus</option>
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "0.75rem 1rem", color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        {loading && !tickets.length ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 0.5rem" }} />
            <div style={{ fontSize: "0.85rem" }}>Chargement…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
            <MessageSquare size={28} style={{ margin: "0 auto 0.75rem", opacity: 0.3 }} />
            Aucun ticket trouvé
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Sujet", "Email", "Priorité", "Statut", "Date", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none",
                    background: selected?.id === t.id ? "rgba(201,165,90,0.04)" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <td style={{ padding: "0.875rem 1rem", maxWidth: 240 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.subject}
                    </div>
                    {t.admin_reply && (
                      <div style={{ fontSize: "0.72rem", color: "#22c55e", marginTop: 2 }}>✓ Répondu</div>
                    )}
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 5 }}>
                      <Mail size={12} />
                      {t.email}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <PriorityDot priority={t.priority} />
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <Badge status={t.status} />
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>{fmtDate(t.created_at)}</span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <button
                      onClick={() => { setSelected(t); setReply(t.admin_reply ?? ""); }}
                      style={{
                        background: "rgba(201,165,90,0.08)", border: `1px solid rgba(201,165,90,0.2)`,
                        color: GOLD, borderRadius: 8, padding: "0.35rem 0.75rem",
                        fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Répondre
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 480,
          background: "#0d0f18", borderLeft: `1px solid ${BORDER}`,
          zIndex: 50, overflowY: "auto", padding: "1.5rem",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "#fff" }}>Ticket</h2>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {/* Meta */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>{selected.subject}</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem", display: "flex", gap: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} />{selected.email}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{fmtDate(selected.created_at)}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {selected.message}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Statut</label>
              <div style={{ position: "relative" }}>
                <select
                  value={selected.status}
                  onChange={e => {
                    const s = e.target.value as TicketStatus;
                    setSelected(prev => prev ? { ...prev, status: s } : prev);
                    void handlePatch(selected.id, { status: s });
                  }}
                  style={{
                    width: "100%", appearance: "none", background: "#1a1f30", border: `1px solid ${BORDER}`,
                    borderRadius: 8, color: "#fff", padding: "0.45rem 2rem 0.45rem 0.75rem",
                    fontSize: "0.82rem", outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="closed">Résolu</option>
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Priorité</label>
              <div style={{ position: "relative" }}>
                <select
                  value={selected.priority}
                  onChange={e => {
                    const p = e.target.value as TicketPriority;
                    setSelected(prev => prev ? { ...prev, priority: p } : prev);
                    void handlePatch(selected.id, { priority: p });
                  }}
                  style={{
                    width: "100%", appearance: "none", background: "#1a1f30", border: `1px solid ${BORDER}`,
                    borderRadius: 8, color: "#fff", padding: "0.45rem 2rem 0.45rem 0.75rem",
                    fontSize: "0.82rem", outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="low">Faible</option>
                  <option value="normal">Normal</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgent</option>
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
              </div>
            </div>
          </div>

          {/* Reply */}
          <div>
            <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Réponse admin {selected.replied_at && <span style={{ color: "#22c55e", textTransform: "none" }}>(envoyée {fmtDate(selected.replied_at)})</span>}
            </label>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={6}
              placeholder="Votre réponse au client…"
              style={{
                width: "100%", background: "#1a1f30", border: `1px solid ${BORDER}`,
                borderRadius: 10, color: "#fff", padding: "0.75rem",
                fontSize: "0.85rem", outline: "none", resize: "vertical",
                lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => void handlePatch(selected.id, { admin_reply: reply })}
              disabled={saving || !reply.trim()}
              style={{
                marginTop: "0.75rem", width: "100%",
                background: saving || !reply.trim() ? "rgba(201,165,90,0.2)" : "rgba(201,165,90,0.15)",
                border: `1px solid ${saving || !reply.trim() ? "rgba(201,165,90,0.15)" : "rgba(201,165,90,0.35)"}`,
                color: saving || !reply.trim() ? "rgba(201,165,90,0.4)" : GOLD,
                borderRadius: 10, padding: "0.65rem",
                fontSize: "0.85rem", fontWeight: 600, cursor: saving || !reply.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
              {saving ? "Envoi…" : "Envoyer la réponse par email"}
            </button>
          </div>

          {/* Previous reply */}
          {selected.admin_reply && (
            <div style={{ marginTop: "1rem", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 10, padding: "0.875rem" }}>
              <div style={{ fontSize: "0.72rem", color: "#22c55e", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle size={12} /> Dernière réponse envoyée
              </div>
              <div style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {selected.admin_reply}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        select option { background: #1a1f30; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, textarea:focus, select:focus { border-color: rgba(201,165,90,0.3) !important; }
      `}</style>
    </div>
  );
}
