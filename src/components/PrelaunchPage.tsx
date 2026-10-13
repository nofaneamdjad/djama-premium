"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#c9a55a";

const FEATURES = [
  {
    title: "Facturation & Trésorerie",
    desc: "Devis, factures, avoirs, suivi des encaissements et tableau de bord financier en temps réel.",
  },
  {
    title: "CRM & Gestion commerciale",
    desc: "Gestion des clients, relances automatiques, pipeline de vente et historique complet.",
  },
  {
    title: "Déclarations & Comptabilité",
    desc: "Préparation des déclarations fiscales et sociales, journal comptable, bilan simplifié.",
  },
  {
    title: "Équipe & Projets",
    desc: "Gestion RH, planification, suivi de projets et collaboration avec vos collaborateurs.",
  },
  {
    title: "Sourcing & Appels d'offres",
    desc: "Recherche de fournisseurs, analyse d'appels d'offres et génération de réponses assistée par IA.",
  },
  {
    title: "Intelligence artificielle intégrée",
    desc: "Assistant IA, génération de documents, analyse de données et coaching personnalisé.",
  },
];

const COUNTRIES = [
  "France", "Belgique", "Suisse", "Canada", "Maroc", "Sénégal", "Côte d'Ivoire",
  "Cameroun", "Madagascar", "Comores", "Île Maurice", "Tunisie", "Algérie",
  "Gabon", "Burkina Faso", "Togo", "Bénin", "Mali", "Niger", "Guinée",
  "République Démocratique du Congo", "La Réunion", "Mayotte", "Autre",
];

type FormState = "idle" | "submitting" | "success" | "error";

export default function PrelaunchPage() {
  const [nom, setNom]               = useState("");
  const [email, setEmail]           = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [pays, setPays]             = useState("");
  const [consent, setConsent]       = useState(false);
  const [honeypot, setHoneypot]     = useState("");
  const [state, setState]           = useState<FormState>("idle");
  const [errorMsg, setErrorMsg]     = useState("");

  const formRef    = useRef<HTMLDivElement>(null);
  const featRef    = useRef<HTMLDivElement>(null);

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, entreprise: entreprise || undefined, pays: pays || undefined, consent, website: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setErrorMsg(data.error ?? "Une erreur est survenue. Réessayez.");
      } else {
        setState("success");
      }
    } catch {
      setState("error");
      setErrorMsg("Impossible de contacter le serveur. Vérifiez votre connexion.");
    }
  }

  return (
    <div className="prelaunch-root">
      {/* ── Orbs eau (fond) ─────────────────────────────────────────────── */}
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="orb orb-3" aria-hidden />

      {/* ── Header minimal ──────────────────────────────────────────────── */}
      <header className="pl-header">
        <span className="pl-logo">DJAMA</span>
      </header>

      {/* ══ Section hero ════════════════════════════════════════════════════ */}
      <section className="pl-hero">
        <motion.div
          className="pl-hero-inner"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="pl-eyebrow">Plateforme de gestion d'entreprise</p>

          <h1 className="pl-headline">
            DJAMA évolue<br />pour vous.
          </h1>

          <p className="pl-subhead">
            Nous construisons une nouvelle génération de logiciels de gestion
            d'entreprise — une plateforme tout-en-un intégrant la facturation,
            la comptabilité, la gestion commerciale, les projets et
            l'intelligence artificielle.
          </p>
          <p className="pl-subhead pl-subhead--muted">
            Notre plateforme est en cours d'évolution pour vous offrir une
            expérience fiable, complète et professionnelle. Nous serons bientôt
            prêts à vous accueillir dans les meilleures conditions.
          </p>

          <div className="pl-ctas">
            <motion.button
              className="btn-primary"
              onClick={() => scrollTo(formRef)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Être informé du lancement
            </motion.button>
            <motion.button
              className="btn-secondary"
              onClick={() => scrollTo(featRef)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Découvrir DJAMA →
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ══ Section formulaire ══════════════════════════════════════════════ */}
      <section className="pl-form-section" ref={formRef}>
        <motion.div
          className="pl-form-card"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait">
            {state === "success" ? (
              <motion.div
                key="success"
                className="pl-success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="pl-success-icon" aria-hidden>✓</div>
                <h2 className="pl-success-title">Inscription enregistrée</h2>
                <p className="pl-success-text">
                  Merci, <strong>{nom}</strong>. Vous serez informé dès que
                  DJAMA sera prêt à vous accueillir.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="pl-form-header">
                  <div className="pl-form-accent" aria-hidden />
                  <h2 className="pl-form-title">Être informé du lancement</h2>
                  <p className="pl-form-subtitle">
                    Inscrivez-vous sur la liste d'attente et recevez une
                    notification dès l'ouverture de la plateforme.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate autoComplete="on">
                  {/* Honeypot anti-spam */}
                  <input
                    name="website"
                    tabIndex={-1}
                    aria-hidden
                    value={honeypot}
                    onChange={e => setHoneypot(e.target.value)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, overflow: "hidden" }}
                  />

                  <div className="pl-fields-row">
                    <div className="pl-field">
                      <label className="pl-label" htmlFor="pl-nom">Nom complet *</label>
                      <input
                        id="pl-nom"
                        className="pl-input"
                        type="text"
                        autoComplete="name"
                        placeholder="Jean Dupont"
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        required
                        maxLength={120}
                      />
                    </div>
                    <div className="pl-field">
                      <label className="pl-label" htmlFor="pl-email">Adresse email *</label>
                      <input
                        id="pl-email"
                        className="pl-input"
                        type="email"
                        autoComplete="email"
                        placeholder="jean@entreprise.fr"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="pl-fields-row">
                    <div className="pl-field">
                      <label className="pl-label" htmlFor="pl-entreprise">Entreprise <span className="pl-optional">(optionnel)</span></label>
                      <input
                        id="pl-entreprise"
                        className="pl-input"
                        type="text"
                        autoComplete="organization"
                        placeholder="Nom de votre entreprise"
                        value={entreprise}
                        onChange={e => setEntreprise(e.target.value)}
                        maxLength={200}
                      />
                    </div>
                    <div className="pl-field">
                      <label className="pl-label" htmlFor="pl-pays">Pays <span className="pl-optional">(optionnel)</span></label>
                      <select
                        id="pl-pays"
                        className="pl-input pl-select"
                        value={pays}
                        onChange={e => setPays(e.target.value)}
                      >
                        <option value="">Sélectionner un pays</option>
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pl-consent-row">
                    <label className="pl-consent-label">
                      <input
                        type="checkbox"
                        className="pl-checkbox"
                        checked={consent}
                        onChange={e => setConsent(e.target.checked)}
                        required
                      />
                      <span className="pl-consent-text">
                        J'accepte d'être contacté par DJAMA au sujet du lancement
                        de la plateforme. Aucune utilisation commerciale de mes
                        données sans consentement préalable.
                      </span>
                    </label>
                  </div>

                  {state === "error" && (
                    <motion.p
                      className="pl-error-msg"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errorMsg}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit"
                    className="btn-primary btn-full"
                    disabled={state === "submitting"}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {state === "submitting" ? (
                      <span className="pl-spinner" aria-label="Envoi en cours…" />
                    ) : (
                      "S'inscrire sur la liste d'attente"
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ══ Section fonctionnalités ══════════════════════════════════════════ */}
      <section className="pl-features" ref={featRef}>
        <motion.div
          className="pl-features-inner"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="pl-eyebrow">Tout ce que DJAMA construit pour vous</p>
          <h2 className="pl-section-title">
            Une plateforme,<br />tous vos outils de gestion.
          </h2>

          <div className="pl-features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="pl-feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
              >
                <div className="pl-feature-accent" aria-hidden />
                <h3 className="pl-feature-title">{f.title}</h3>
                <p className="pl-feature-desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ Footer ══════════════════════════════════════════════════════════ */}
      <footer className="pl-footer">
        <p className="pl-footer-copy">© 2026 DJAMA — Tous droits réservés</p>
        <p className="pl-footer-legal">
          DJAMA SAS · SIREN 932 659 397 · contact@djama.space
        </p>
      </footer>

      {/* ── Styles ────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Tokens ── */
        :root {
          --pl-bg:          #0a0a0a;
          --pl-bg-2:        #111111;
          --pl-text:        #f0ece4;
          --pl-text-muted:  #8a8380;
          --pl-text-faint:  #5a5550;
          --pl-gold:        ${GOLD};
          --pl-gold-dim:    rgba(201,165,90,0.18);
          --pl-card-bg:     rgba(255,255,255,0.035);
          --pl-card-border: rgba(255,255,255,0.07);
          --pl-input-bg:    rgba(255,255,255,0.045);
          --pl-input-border:rgba(255,255,255,0.10);
          --pl-error:       #e05c5c;
          color-scheme:     dark;
        }
        @media (prefers-color-scheme: light) {
          :root:not([data-theme="dark"]) {
            --pl-bg:          #f5f3ef;
            --pl-bg-2:        #eeebe5;
            --pl-text:        #1a1816;
            --pl-text-muted:  #6b6560;
            --pl-text-faint:  #a09890;
            --pl-card-bg:     rgba(255,255,255,0.72);
            --pl-card-border: rgba(0,0,0,0.08);
            --pl-input-bg:    #ffffff;
            --pl-input-border:rgba(0,0,0,0.14);
            color-scheme: light;
          }
        }
        :root[data-theme="light"] {
          --pl-bg:          #f5f3ef;
          --pl-bg-2:        #eeebe5;
          --pl-text:        #1a1816;
          --pl-text-muted:  #6b6560;
          --pl-text-faint:  #a09890;
          --pl-card-bg:     rgba(255,255,255,0.72);
          --pl-card-border: rgba(0,0,0,0.08);
          --pl-input-bg:    #ffffff;
          --pl-input-border:rgba(0,0,0,0.14);
          color-scheme: light;
        }

        /* ── Reset ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .prelaunch-root {
          position: relative;
          min-height: 100vh;
          background: var(--pl-bg);
          color: var(--pl-text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          overflow-x: hidden;
        }

        /* ── Orbs eau ── */
        .orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform;
          animation: orb-float 25s ease-in-out infinite;
        }
        .orb-1 {
          width: min(70vw, 900px); height: min(70vw, 900px);
          top: -20%; right: -15%;
          background: radial-gradient(circle, rgba(18,80,180,0.07) 0%, transparent 65%);
          animation-delay: 0s;
        }
        .orb-2 {
          width: min(55vw, 700px); height: min(55vw, 700px);
          bottom: 10%; left: -10%;
          background: radial-gradient(circle, rgba(201,165,90,0.05) 0%, transparent 65%);
          animation-delay: -8s; animation-duration: 30s;
        }
        .orb-3 {
          width: min(45vw, 600px); height: min(45vw, 600px);
          top: 40%; left: 30%;
          background: radial-gradient(circle, rgba(10,60,140,0.04) 0%, transparent 65%);
          animation-delay: -15s; animation-duration: 35s;
        }
        @keyframes orb-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-30px) scale(1.04); }
        }

        /* ── Header ── */
        .pl-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 20px 40px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--pl-card-border);
          background: color-mix(in srgb, var(--pl-bg) 85%, transparent);
          backdrop-filter: blur(12px);
        }
        .pl-logo {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: var(--pl-gold);
          text-transform: uppercase;
          user-select: none;
        }

        /* ── Hero ── */
        .pl-hero {
          min-height: calc(100svh - 61px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
        }
        .pl-hero-inner {
          max-width: 760px;
          width: 100%;
        }
        .pl-eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--pl-gold);
          margin-bottom: 24px;
        }
        .pl-headline {
          font-size: clamp(44px, 8vw, 82px);
          font-weight: 900;
          line-height: 1.04;
          letter-spacing: -0.02em;
          color: var(--pl-text);
          margin-bottom: 32px;
        }
        .pl-subhead {
          font-size: 17px;
          line-height: 1.72;
          color: var(--pl-text-muted);
          max-width: 600px;
          margin-bottom: 16px;
        }
        .pl-subhead--muted { color: var(--pl-text-faint); }
        .pl-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 44px;
        }

        /* ── Buttons ── */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          background: var(--pl-gold);
          color: #0a0a0a;
          border: none;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          white-space: nowrap;
        }
        .btn-primary:hover   { background: #d9b56a; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-full { width: 100%; margin-top: 24px; padding: 15px; font-size: 16px; }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 13px 26px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          color: var(--pl-text-muted);
          background: transparent;
          border: 1px solid var(--pl-card-border);
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .btn-secondary:hover { color: var(--pl-text); border-color: var(--pl-gold); }

        /* ── Form section ── */
        .pl-form-section {
          padding: 80px 24px 100px;
          display: flex;
          justify-content: center;
        }
        .pl-form-card {
          width: 100%;
          max-width: 680px;
          background: var(--pl-card-bg);
          border: 1px solid var(--pl-card-border);
          border-radius: 16px;
          padding: 40px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          overflow: hidden;
          position: relative;
        }
        .pl-form-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--pl-gold), transparent);
          border-radius: 16px 16px 0 0;
        }
        .pl-form-header { margin-bottom: 32px; }
        .pl-form-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--pl-text);
          margin-bottom: 8px;
        }
        .pl-form-subtitle {
          font-size: 14px;
          color: var(--pl-text-muted);
          line-height: 1.6;
        }

        /* ── Fields ── */
        .pl-fields-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 520px) { .pl-fields-row { grid-template-columns: 1fr; } }
        .pl-field { display: flex; flex-direction: column; gap: 6px; }
        .pl-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--pl-text-muted);
        }
        .pl-optional { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 11px; }
        .pl-input {
          padding: 10px 14px;
          background: var(--pl-input-bg);
          border: 1px solid var(--pl-input-border);
          border-radius: 7px;
          font-size: 15px;
          color: var(--pl-text);
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .pl-input::placeholder { color: var(--pl-text-faint); }
        .pl-input:focus { border-color: var(--pl-gold); }
        .pl-select { appearance: none; cursor: pointer; }

        /* ── Consent ── */
        .pl-consent-row { margin-top: 4px; margin-bottom: 4px; }
        .pl-consent-label { display: flex; gap: 10px; cursor: pointer; align-items: flex-start; }
        .pl-checkbox {
          margin-top: 2px;
          accent-color: var(--pl-gold);
          width: 16px; height: 16px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .pl-consent-text { font-size: 13px; color: var(--pl-text-muted); line-height: 1.55; }

        /* ── Error / spinner ── */
        .pl-error-msg {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(224,92,92,0.1);
          border: 1px solid rgba(224,92,92,0.3);
          border-radius: 7px;
          font-size: 13px;
          color: var(--pl-error);
        }
        .pl-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(10,10,10,0.3);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Success ── */
        .pl-success { text-align: center; padding: 20px 0; }
        .pl-success-icon {
          width: 56px; height: 56px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: var(--pl-gold-dim);
          border: 1px solid var(--pl-gold);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          color: var(--pl-gold);
          font-weight: 700;
        }
        .pl-success-title { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
        .pl-success-text { font-size: 15px; color: var(--pl-text-muted); line-height: 1.6; }
        .pl-success-text strong { color: var(--pl-text); }

        /* ── Features ── */
        .pl-features {
          padding: 80px 24px 100px;
          background: var(--pl-bg-2);
          border-top: 1px solid var(--pl-card-border);
        }
        .pl-features-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .pl-section-title {
          font-size: clamp(30px, 5vw, 48px);
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--pl-text);
          margin-bottom: 56px;
          max-width: 540px;
        }
        .pl-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) { .pl-features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .pl-features-grid { grid-template-columns: 1fr; } }
        .pl-feature-card {
          background: var(--pl-card-bg);
          border: 1px solid var(--pl-card-border);
          border-radius: 12px;
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .pl-feature-card:hover { border-color: rgba(201,165,90,0.3); }
        .pl-feature-accent {
          position: absolute;
          top: 0; left: 24px;
          width: 40px; height: 2px;
          background: var(--pl-gold);
          border-radius: 0 0 2px 2px;
        }
        .pl-feature-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--pl-text);
          margin-bottom: 10px;
          margin-top: 12px;
        }
        .pl-feature-desc { font-size: 13.5px; color: var(--pl-text-muted); line-height: 1.6; }

        /* ── Footer ── */
        .pl-footer {
          padding: 32px 40px;
          border-top: 1px solid var(--pl-card-border);
          text-align: center;
        }
        .pl-footer-copy { font-size: 13px; color: var(--pl-text-faint); margin-bottom: 4px; }
        .pl-footer-legal { font-size: 11px; color: var(--pl-text-faint); opacity: 0.6; }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .pl-header { padding: 18px 20px; }
          .pl-hero { padding: 60px 20px; }
          .pl-form-card { padding: 28px 20px; }
          .pl-features { padding: 60px 20px 80px; }
          .pl-footer { padding: 28px 20px; }
        }
      `}</style>
    </div>
  );
}
