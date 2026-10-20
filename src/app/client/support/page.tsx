"use client";
import { useState, useEffect } from "react";

const CATEGORIES = [
  { value: "bug",      label: "🐛 Bug / Problème technique" },
  { value: "question", label: "❓ Question d'utilisation" },
  { value: "feature",  label: "💡 Suggestion / Amélioration" },
  { value: "billing",  label: "💳 Abonnement / Facturation" },
  { value: "other",    label: "📩 Autre" },
];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  open:        { label: "En attente", color: "#f59e0b" },
  in_progress: { label: "En cours",   color: "#3b82f6" },
  resolved:    { label: "Résolu",     color: "#22c55e" },
  closed:      { label: "Fermé",      color: "#6b7280" },
};

interface Ticket {
  id: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  admin_reply?: string;
  replied_at?: string;
  created_at: string;
}

const GOLD = "#c9a55a";

export default function SupportPage() {
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [form, setForm]         = useState({ category: "bug", subject: "", message: "" });
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch("/api/support")
      .then(r => r.json())
      .then((d: { tickets?: Ticket[] }) => setTickets(d.tickets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [success]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.subject.trim()) { setError("Veuillez renseigner l'objet."); return; }
    if (!form.message.trim()) { setError("Veuillez décrire votre problème."); return; }
    setSending(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) { setError(data.error ?? "Erreur envoi"); setSending(false); return; }
    setSuccess(true);
    setForm({ category: "bug", subject: "", message: "" });
    setSending(false);
    setTimeout(() => setSuccess(false), 5000);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Support DJAMA</h1>
      <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 32, fontSize: 14 }}>
        Une question, un bug, une suggestion ? Nous répondons sous 24h.
      </p>

      {/* Formulaire */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: GOLD }}>Nouvelle demande</h2>
        {success && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#4ade80", fontSize: 14 }}>
            ✓ Votre demande a bien été envoyée. Nous vous répondrons sous 24h.
          </div>
        )}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#f87171", fontSize: 14 }}>
            {error}
          </div>
        )}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Catégorie</label>
            <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Objet</label>
            <input style={inp} value={form.subject} maxLength={200}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Résumez votre problème en une phrase" />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, height: 120, resize: "vertical" as const }} value={form.message} maxLength={2000}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Décrivez le problème en détail, les étapes pour le reproduire, les messages d'erreur…" />
          </div>
          <button type="submit" disabled={sending} style={{ background: GOLD, color: "#000", fontWeight: 700, border: "none", borderRadius: 10, padding: "13px 24px", fontSize: 14, cursor: "pointer", opacity: sending ? 0.6 : 1 }}>
            {sending ? "Envoi en cours…" : "Envoyer ma demande"}
          </button>
        </form>
      </div>

      {/* Historique tickets */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 36, marginBottom: 16 }}>Mes demandes</h2>
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Chargement…</p>
      ) : tickets.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Aucune demande pour l&apos;instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tickets.map(t => {
            const st = STATUS_LABEL[t.status] ?? { label: t.status, color: "#6b7280" };
            return (
              <div key={t.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t.subject}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                      {CATEGORIES.find(c => c.value === t.category)?.label ?? t.category} — {new Date(t.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <span style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}44`, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {st.label}
                  </span>
                </div>
                {t.admin_reply && (
                  <div style={{ marginTop: 12, background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.15)", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, marginBottom: 4 }}>Réponse DJAMA</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, whiteSpace: "pre-line" }}>{t.admin_reply}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { background: "#111113", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "24px" };
const lbl: React.CSSProperties = { display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6, textTransform: "uppercase" as const };
const inp: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, boxSizing: "border-box" as const };
