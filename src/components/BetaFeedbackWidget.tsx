"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Bug, Lightbulb, AlertCircle, Star, X, Send, Loader2, CheckCircle, ChevronDown } from "lucide-react";

const GOLD = "#c9a55a";
const TYPES = [
  { id: "bug",        label: "Signaler un bug",        icon: Bug,          color: "#ef4444" },
  { id: "feature",    label: "Proposer une fonctionnalité", icon: Lightbulb, color: "#3b82f6" },
  { id: "difficulty", label: "Décrire une difficulté", icon: AlertCircle,  color: GOLD },
  { id: "rating",     label: "Évaluer une app",        icon: Star,         color: "#f59e0b" },
  { id: "general",    label: "Autre commentaire",      icon: MessageSquare,color: "#6b7280" },
] as const;

type FeedbackType = typeof TYPES[number]["id"];

const APPS_BETA = [
  "Factures & Devis","Dépenses","Trésorerie","CRM Clients","Projets","Équipe",
  "Planning","Rendez-vous","Contrats","Blog","Espaces privés","Bloc-notes",
  "Carte de visite","Analytics","Chatbot IA","Assistant IA","Sourcing IA",
  "Site Web","Boutique","Réseaux sociaux","Autre",
];

export function BetaFeedbackWidget() {
  const [open,    setOpen]    = useState(false);
  const [type,    setType]    = useState<FeedbackType>("bug");
  const [app,     setApp]     = useState("");
  const [message, setMessage] = useState("");
  const [rating,  setRating]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  // Ferme sur Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { setError("Le message est requis."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/beta/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          app_name: app || undefined,
          message:  message.trim(),
          rating:   type === "rating" && rating > 0 ? rating : undefined,
          metadata: { url: typeof window !== "undefined" ? window.location.pathname : "" },
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); setMessage(""); setRating(0); setApp(""); }, 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const selectedType = TYPES.find(t => t.id === type)!;
  const Icon = selectedType.icon;

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Donner mon avis"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 40,
          background: "#111827", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 50, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8,
          color: "#fff", fontSize: "0.82rem", fontWeight: 600,
          cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        <MessageSquare size={15} color={GOLD} />
        Avis bêta
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
          padding: "0 24px 84px 24px",
          pointerEvents: "none",
        }}>
          <div
            style={{
              background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, width: 360, maxHeight: "85vh",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              overflowY: "auto", pointerEvents: "all",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "rgba(201,165,90,0.12)", borderRadius: 8, padding: "5px 8px", fontSize: "0.65rem", fontWeight: 700, color: GOLD, letterSpacing: "0.08em" }}>BÊTA</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>Donner mon avis</span>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <CheckCircle size={32} color="#22c55e" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ color: "#fff", fontWeight: 600, marginBottom: "0.25rem" }}>Merci pour votre retour !</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>Nous l'avons bien reçu.</p>
              </div>
            ) : (
              <form onSubmit={e => void handleSubmit(e)} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Type */}
                <div>
                  <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {TYPES.map(t => {
                      const TIcon = t.icon;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "0.5rem 0.75rem", borderRadius: 8, cursor: "pointer",
                            background: type === t.id ? "rgba(201,165,90,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${type === t.id ? "rgba(201,165,90,0.3)" : "rgba(255,255,255,0.07)"}`,
                            color: type === t.id ? GOLD : "rgba(255,255,255,0.5)",
                            fontSize: "0.75rem", fontWeight: type === t.id ? 600 : 400,
                            transition: "all 0.1s",
                          }}
                        >
                          <TIcon size={12} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* App concernée */}
                <div>
                  <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Application concernée</label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={app}
                      onChange={e => setApp(e.target.value)}
                      style={{
                        width: "100%", appearance: "none", background: "#1a1f30",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                        color: app ? "#fff" : "rgba(255,255,255,0.3)", padding: "0.5rem 2rem 0.5rem 0.75rem",
                        fontSize: "0.82rem", outline: "none", cursor: "pointer", boxSizing: "border-box",
                      }}
                    >
                      <option value="">Sélectionner (optionnel)</option>
                      {APPS_BETA.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
                  </div>
                </div>

                {/* Rating (si type = rating) */}
                {type === "rating" && (
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Note</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          style={{
                            width: 36, height: 36, borderRadius: 8, cursor: "pointer",
                            background: n <= rating ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${n <= rating ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.07)"}`,
                            color: n <= rating ? "#f59e0b" : "rgba(255,255,255,0.3)",
                            fontSize: "1rem",
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {type === "bug" ? "Décrivez le bug" : type === "difficulty" ? "Quelle difficulté ?" : "Message"}
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder={
                      type === "bug"        ? "Ce qui s'est passé, étapes pour reproduire…" :
                      type === "feature"    ? "Votre idée, pourquoi ce serait utile…" :
                      type === "difficulty" ? "Ce que vous vouliez faire, ce qui a bloqué…" :
                      type === "rating"     ? "Qu'est-ce que vous appréciez ou non ?" :
                      "Votre commentaire…"
                    }
                    style={{
                      width: "100%", background: "#1a1f30",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                      color: "#fff", padding: "0.625rem 0.75rem", fontSize: "0.85rem",
                      outline: "none", resize: "vertical", lineHeight: 1.5,
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ textAlign: "right", fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", marginTop: 3 }}>
                    {message.length}/5000
                  </div>
                </div>

                {error && (
                  <p style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? "rgba(201,165,90,0.15)" : "rgba(201,165,90,0.12)",
                    border: "1px solid rgba(201,165,90,0.3)", borderRadius: 10,
                    color: loading ? "rgba(201,165,90,0.5)" : GOLD,
                    padding: "0.65rem", fontSize: "0.875rem", fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
                  {loading ? "Envoi…" : "Envoyer"}
                </button>

                <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                  Vos données personnelles ne sont pas jointes automatiquement.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
