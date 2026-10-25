"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Loader2, ArrowRight, Star, Zap, Shield, Users } from "lucide-react";
import Link from "next/link";

const GOLD = "#c9a55a";
const BG   = "#07090e";

interface BetaStatus { open: boolean; max: number; current: number; beta_ends_at: string | null }

const FEATURES = [
  { icon: Zap,     title: "Tous les modules inclus", desc: "CRM, Factures, Planning, Banque, Signature, IA — 24 applications" },
  { icon: Shield,  title: "30 jours offerts",        desc: "Accès complet sans carte bancaire. Pas d'engagement." },
  { icon: Star,    title: "Influence le produit",     desc: "Vos retours orientent directement les prochaines fonctionnalités." },
  { icon: Users,   title: "50 testeurs max",          desc: "Une bêta fermée pour une expérience accompagnée et de qualité." },
];

export default function BetaPage() {
  const [status,  setStatus]  = useState<BetaStatus | null>(null);
  const [nom,     setNom]     = useState("");
  const [email,   setEmail]   = useState("");
  const [usage,   setUsage]   = useState("");
  const [consent, setConsent] = useState(false);
  const [honey,   setHoney]   = useState(""); // honeypot
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState("");

  useEffect(() => {
    fetch("/api/beta/apply")
      .then(r => r.json())
      .then((d: BetaStatus) => setStatus(d))
      .catch(() => {});
  }, []);

  const spotsLeft = status ? Math.max(0, status.max - status.current) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honey) return; // bot
    if (!consent) { setErr("Vous devez accepter les conditions."); return; }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/beta/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom.trim(), email: email.trim(), usage: usage.trim() || undefined, consent: true, website: honey }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setDone(true);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Nav ── */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff", textDecoration: "none", letterSpacing: "-0.01em" }}>
          <span style={{ color: GOLD }}>D</span>JAMA
        </Link>
        <Link href="/login" style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
          Connexion →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", padding: "5rem 1.5rem 3rem" }}>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,165,90,0.1)", border: "1px solid rgba(201,165,90,0.25)", borderRadius: 50, padding: "5px 14px", marginBottom: "1.5rem" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {status?.open ? `${spotsLeft} place${spotsLeft !== 1 ? "s" : ""} restante${spotsLeft !== 1 ? "s" : ""}` : "Liste d'attente"}
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>
          Testez DJAMA<br />
          <span style={{ color: GOLD }}>avant tout le monde</span>
        </h1>

        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 2.5rem" }}>
          DJAMA est la suite de gestion tout-en-un pour les TPE et PME françaises.
          Rejoignez la bêta privée — 30 jours gratuits, accès complet, votre avis compte.
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap", marginBottom: "3rem" }}>
          {[["24", "applications"], ["30j", "offerts"], ["50", "testeurs max"]].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: GOLD }}>{val}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,165,90,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                <Icon size={16} color={GOLD} />
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.35rem" }}>{title}</p>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Formulaire ── */}
      <section style={{ maxWidth: 480, margin: "0 auto", padding: "0 1.5rem 6rem" }}>
        <div style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2rem" }}>

          {done ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <CheckCircle size={40} color="#22c55e" style={{ margin: "0 auto 1rem" }} />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Candidature reçue !</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                Nous vous contacterons sous 48h à l'adresse indiquée pour confirmer votre accès bêta.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.25rem" }}>Rejoindre la bêta</h2>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: "1.5rem" }}>
                {status?.open ? "Places limitées — candidature libre" : "Inscriptions sur liste d'attente"}
              </p>

              <form onSubmit={e => void handleSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Honeypot */}
                <input type="text" value={honey} onChange={e => setHoney(e.target.value)} style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

                {/* Nom */}
                <div>
                  <label style={labelStyle}>Nom complet *</label>
                  <input
                    type="text" value={nom} onChange={e => setNom(e.target.value)}
                    required placeholder="Jean Dupont"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,165,90,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email professionnel *</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="jean@monentreprise.fr"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,165,90,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                {/* Usage */}
                <div>
                  <label style={labelStyle}>Comment comptez-vous utiliser DJAMA ? <span style={{ color: "rgba(255,255,255,0.25)" }}>(optionnel)</span></label>
                  <textarea
                    value={usage} onChange={e => setUsage(e.target.value)}
                    rows={3} placeholder="Mon activité, mes besoins principaux…"
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,165,90,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                {/* Consent */}
                <label style={{ display: "flex", gap: 10, cursor: "pointer", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                    required style={{ marginTop: 2, accentColor: GOLD, flexShrink: 0 }} />
                  J'accepte que mes données soient utilisées pour la gestion de la bêta. Pas de spam.
                </label>

                {err && (
                  <p style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}>
                    {err}
                  </p>
                )}

                <button
                  type="submit" disabled={loading}
                  style={{
                    background: loading ? "rgba(201,165,90,0.15)" : `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                    border: "none", borderRadius: 12, color: loading ? GOLD : "#07090e",
                    padding: "0.85rem", fontSize: "0.9rem", fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                >
                  {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <ArrowRight size={16} />}
                  {loading ? "Envoi en cours…" : "Candidater à la bêta"}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>
          Déjà testeur ?{" "}
          <Link href="/login" style={{ color: "rgba(201,165,90,0.6)", textDecoration: "none" }}>
            Se connecter →
          </Link>
        </p>
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${BG}}
        ::placeholder{color:rgba(255,255,255,0.2)}
      `}</style>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#1a1f30",
  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
  color: "#fff", padding: "0.6rem 0.875rem", fontSize: "0.875rem",
  outline: "none", transition: "border-color 0.15s", fontFamily: "inherit",
};
