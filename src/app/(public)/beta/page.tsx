"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CreditCard, TrendingUp, Users, Layers, UserCog,
  Calendar, Clock, PenTool, Newspaper, Lock, Edit, Contact,
  Activity, MessageCircle, Bot, Search, Monitor, ShoppingBag,
  Share2, CheckCircle, ChevronRight, Sparkles, Shield,
} from "lucide-react";

/* ── Palette ──────────────────────────────────────────────────────── */
const GOLD   = "#B99D5E";
const C = {
  bg: "#FAFAF8", surface: "#FFFFFF", text: "#202020",
  sub: "#707070", gold: GOLD, border: "#E8E6E1",
};

const COUNTRIES = [
  "France","Belgique","Suisse","Canada","Maroc","Sénégal","Côte d'Ivoire",
  "Cameroun","Madagascar","Comores","Île Maurice","Tunisie","Algérie",
  "Gabon","Burkina Faso","Togo","Bénin","Mali","Niger","Guinée",
  "République Démocratique du Congo","La Réunion","Mayotte","Autre",
];

/* ── Apps disponibles (13) + expérimentales (7) ────────────────────── */
const APPS_AVAILABLE = [
  { label: "Factures & Devis",  icon: FileText   },
  { label: "Dépenses",          icon: CreditCard },
  { label: "Trésorerie",        icon: TrendingUp },
  { label: "CRM Clients",       icon: Users      },
  { label: "Projets",           icon: Layers     },
  { label: "Équipe",            icon: UserCog    },
  { label: "Planning",          icon: Calendar   },
  { label: "Rendez-vous",       icon: Clock      },
  { label: "Contrats",          icon: PenTool    },
  { label: "Blog",              icon: Newspaper  },
  { label: "Espaces privés",    icon: Lock       },
  { label: "Bloc-notes",        icon: Edit       },
  { label: "Carte de visite",   icon: Contact    },
];

const APPS_EXPERIMENTAL = [
  { label: "Analytics",         icon: Activity      },
  { label: "Chatbot IA",        icon: MessageCircle },
  { label: "Assistant IA",      icon: Bot           },
  { label: "Sourcing IA",       icon: Search        },
  { label: "Site Web",          icon: Monitor       },
  { label: "Boutique",          icon: ShoppingBag   },
  { label: "Réseaux sociaux",   icon: Share2        },
];

/* ── Stats bêta ──────────────────────────────────────────────────── */
interface BetaStatus { open: boolean; max: number; current: number; beta_ends_at: string | null }

function useBetaStatus() {
  const [status, setStatus] = useState<BetaStatus | null>(null);
  useEffect(() => {
    fetch("/api/beta/apply")
      .then(r => r.ok ? r.json() as Promise<BetaStatus> : null)
      .then(d => { if (d) setStatus(d); })
      .catch(() => null);
  }, []);
  return status;
}

/* ── Compteur de places ──────────────────────────────────────────── */
function SpotsCounter({ status }: { status: BetaStatus | null }) {
  if (!status) return null;
  const remaining = Math.max(0, status.max - status.current);
  const pct = Math.min(100, (status.current / status.max) * 100);

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "14px 18px",
      display: "flex", flexDirection: "column", gap: 8, marginBottom: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          {status.open ? `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}` : "Inscriptions en cours d'ouverture"}
        </span>
        <span style={{ fontSize: 12, color: C.sub }}>{status.current}/{status.max}</span>
      </div>
      <div style={{ background: "#F0EDE8", borderRadius: 4, height: 5, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: GOLD, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
      </div>
      {status.beta_ends_at && (
        <span style={{ fontSize: 11, color: C.sub }}>
          Accès bêta jusqu'au {new Date(status.beta_ends_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function BetaPage() {
  const betaStatus = useBetaStatus();

  const [nom,        setNom]        = useState("");
  const [email,      setEmail]      = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [pays,       setPays]       = useState("");
  const [usage,      setUsage]      = useState("");
  const [consent,    setConsent]    = useState(false);
  const [honeypot,   setHoneypot]   = useState("");
  const [fState,     setFState]     = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [fError,     setFError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fState === "submitting") return;
    setFState("submitting"); setFError("");
    try {
      const res = await fetch("/api/beta/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom, email,
          entreprise: entreprise || undefined,
          pays: pays || undefined,
          usage: usage || undefined,
          consent: true,
          website: honeypot,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setFState("error"); setFError(data.error ?? "Une erreur est survenue."); }
      else          setFState("success");
    } catch {
      setFState("error"); setFError("Impossible de contacter le serveur. Réessayez.");
    }
  }

  return (
    <div className="bt">

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="bt-header">
        <Image src="/logo-transparent.png" alt="DJAMA"
          width={108} height={36}
          style={{ height: 26, width: "auto", objectFit: "contain" }} priority />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="bt-badge">BÊTA PRIVÉE</span>
          <a href="#candidature" className="bt-header-cta"
            onClick={e => { e.preventDefault(); document.getElementById("candidature")?.scrollIntoView({ behavior: "smooth" }); }}>
            Candidater
          </a>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bt-hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ maxWidth: 700 }}
        >
          <div className="bt-hero-badge">
            <Sparkles size={13} style={{ flexShrink: 0 }} />
            Bêta publique ouverte à 50 testeurs sélectionnés
          </div>
          <h1 className="bt-title">
            Gérez votre agence avec l'IA.<br />
            <span style={{ color: GOLD }}>Rejoignez la bêta DJAMA.</span>
          </h1>
          <p className="bt-subtitle">
            DJAMA est la plateforme tout-en-un pour les agences et entrepreneurs — facturation,
            CRM, projets, planification, IA et bien plus. Accès gratuit 30 jours, sans carte bancaire.
          </p>
          <div className="bt-hero-pills">
            <span className="bt-pill"><CheckCircle size={13} /> 30 jours gratuits</span>
            <span className="bt-pill"><Shield size={13} /> Sans CB requise</span>
            <span className="bt-pill"><Sparkles size={13} /> 20 applications incluses</span>
          </div>
        </motion.div>
      </section>

      {/* ── APPLICATIONS ─────────────────────────────────────────── */}
      <section className="bt-apps-section">
        <div className="bt-section-header">
          <h2 className="bt-section-title">Applications incluses en bêta</h2>
          <p className="bt-section-sub">13 applications stables + 7 expérimentales</p>
        </div>

        <div className="bt-apps-group">
          <div className="bt-apps-label">
            <span className="bt-status-dot bt-dot-available" />
            Disponibles — stables
          </div>
          <div className="bt-apps-grid">
            {APPS_AVAILABLE.map((app, i) => {
              const Icon = app.icon;
              return (
                <motion.div key={app.label} className="bt-app-item"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.22, delay: i * 0.03 }}>
                  <div className="bt-app-icon bt-app-icon-available"><Icon size={18} strokeWidth={1.6} /></div>
                  <span className="bt-app-name">{app.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="bt-apps-group" style={{ marginTop: 24 }}>
          <div className="bt-apps-label">
            <span className="bt-status-dot bt-dot-experimental" />
            Expérimentales — retours attendus
          </div>
          <div className="bt-apps-grid">
            {APPS_EXPERIMENTAL.map((app, i) => {
              const Icon = app.icon;
              return (
                <motion.div key={app.label} className="bt-app-item"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.22, delay: i * 0.03 }}>
                  <div className="bt-app-icon bt-app-icon-experimental"><Icon size={18} strokeWidth={1.6} /></div>
                  <span className="bt-app-name">{app.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AVANTAGES ─────────────────────────────────────────────── */}
      <section className="bt-benefits">
        <h2 className="bt-section-title" style={{ marginBottom: 24 }}>Pourquoi rejoindre la bêta ?</h2>
        <div className="bt-benefits-grid">
          {[
            { icon: "🎁", title: "Accès gratuit complet", desc: "30 jours d'accès à toutes les applications incluses, sans carte bancaire." },
            { icon: "🤝", title: "Influencez le produit", desc: "Vos retours façonnent directement les prochaines fonctionnalités de DJAMA." },
            { icon: "⚡", title: "Tarif préférentiel", desc: "Les premiers testeurs bénéficient d'un tarif de lancement exclusif à l'issue de la bêta." },
            { icon: "🛠️", title: "Support prioritaire", desc: "Accès direct à l'équipe fondatrice pour toute question ou problème rencontré." },
          ].map(b => (
            <div key={b.title} className="bt-benefit-card">
              <span style={{ fontSize: 28 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{b.title}</div>
                <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORMULAIRE ────────────────────────────────────────────── */}
      <section id="candidature" className="bt-form-section">
        <div className="bt-form-box">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span className="bt-badge" style={{ marginBottom: 10, display: "inline-block" }}>BÊTA PRIVÉE</span>
            <h2 className="bt-wl-title">Candidater à la bêta DJAMA</h2>
            <p className="bt-wl-sub">Remplissez ce formulaire pour rejoindre la liste des candidats. Nous sélectionnons les profils manuellement.</p>
          </div>

          <SpotsCounter status={betaStatus} />

          <AnimatePresence mode="wait">
            {fState === "success" ? (
              <motion.div key="ok"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: "center", padding: "2rem 1rem",
                  background: "rgba(58,124,82,0.05)",
                  border: "1px solid rgba(58,124,82,0.18)",
                  borderRadius: 12,
                }}>
                <CheckCircle size={36} color="#3a7c52" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>Candidature reçue !</p>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
                  Merci pour votre intérêt. Nous examinerons votre candidature et vous contacterons
                  par email si vous êtes sélectionné.
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={e => void handleSubmit(e)} noValidate exit={{ opacity: 0 }}>
                {/* Honeypot */}
                <input name="website" tabIndex={-1} aria-hidden value={honeypot}
                  onChange={e => setHoneypot(e.target.value)}
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0 }} />

                <div className="bt-row">
                  <div className="bt-field">
                    <label className="bt-lbl" htmlFor="bt-nom">Nom complet *</label>
                    <input id="bt-nom" className="bt-inp" type="text" autoComplete="name"
                      placeholder="Jean Dupont" value={nom}
                      onChange={e => setNom(e.target.value)} required maxLength={120} />
                  </div>
                  <div className="bt-field">
                    <label className="bt-lbl" htmlFor="bt-email">Adresse email *</label>
                    <input id="bt-email" className="bt-inp" type="email" autoComplete="email"
                      placeholder="jean@entreprise.fr" value={email}
                      onChange={e => setEmail(e.target.value)} required maxLength={255} />
                  </div>
                </div>

                <div className="bt-row">
                  <div className="bt-field">
                    <label className="bt-lbl" htmlFor="bt-ent">
                      Entreprise <span className="bt-opt">(optionnel)</span>
                    </label>
                    <input id="bt-ent" className="bt-inp" type="text" autoComplete="organization"
                      placeholder="Nom de votre entreprise" value={entreprise}
                      onChange={e => setEntreprise(e.target.value)} maxLength={200} />
                  </div>
                  <div className="bt-field">
                    <label className="bt-lbl" htmlFor="bt-pays">
                      Pays <span className="bt-opt">(optionnel)</span>
                    </label>
                    <select id="bt-pays" className="bt-inp bt-sel" value={pays}
                      onChange={e => setPays(e.target.value)}>
                      <option value="">Sélectionner</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bt-field" style={{ marginBottom: 12 }}>
                  <label className="bt-lbl" htmlFor="bt-usage">
                    Comment comptez-vous utiliser DJAMA ? <span className="bt-opt">(optionnel)</span>
                  </label>
                  <textarea id="bt-usage" className="bt-inp" rows={3}
                    placeholder="Ex : gérer la facturation de mon agence immobilière, piloter mes projets clients…"
                    value={usage} onChange={e => setUsage(e.target.value)}
                    maxLength={500} style={{ resize: "vertical", fontFamily: "inherit" }} />
                </div>

                <label className="bt-consent">
                  <input type="checkbox" className="bt-chk" checked={consent}
                    onChange={e => setConsent(e.target.checked)} required />
                  <span className="bt-consent-txt">
                    J'accepte d'être contacté par DJAMA dans le cadre de la bêta et de recevoir des communications
                    liées au lancement de la plateforme. Consulter notre{" "}
                    <a href="/confidentialite" style={{ color: GOLD, textDecoration: "underline" }}>politique de confidentialité</a>.
                  </span>
                </label>

                {fState === "error" && <p className="bt-err">{fError}</p>}

                <button type="submit" className="bt-submit" disabled={fState === "submitting" || !consent}>
                  {fState === "submitting" ? (
                    <span className="bt-spin" aria-label="Envoi en cours" />
                  ) : (
                    <>
                      Envoyer ma candidature
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>

                <p style={{ fontSize: 11, color: "#b8b4ae", textAlign: "center", marginTop: 12 }}>
                  Sélection manuelle · Réponse sous 48h · Accès 30 jours gratuits
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bt-footer">
        <div className="bt-footer-inner">
          <Image src="/logo-transparent.png" alt="DJAMA" width={80} height={27}
            style={{ height: 22, width: "auto", objectFit: "contain", opacity: 0.6 }} />
          <p className="bt-copyright">© 2026 DJAMA — Tous droits réservés.</p>
          <nav className="bt-footer-links" aria-label="Liens légaux">
            <a href="/mentions-legales" className="bt-flink">Mentions légales</a>
            <span className="bt-sep" aria-hidden>·</span>
            <a href="/confidentialite" className="bt-flink">Confidentialité</a>
            <span className="bt-sep" aria-hidden>·</span>
            <a href="/cgu" className="bt-flink">CGU</a>
            <span className="bt-sep" aria-hidden>·</span>
            <a href="mailto:contact@djama.space" className="bt-flink">contact@djama.space</a>
          </nav>
        </div>
      </footer>

      {/* ── STYLES ───────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bt {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          background: ${C.bg}; color: ${C.text};
          min-height: 100svh; overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .bt a { color: inherit; text-decoration: none; }
        .bt button { font-family: inherit; }

        /* ── Badge ──────────────────────────────────────── */
        .bt-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(185,157,94,0.1); border: 1px solid rgba(185,157,94,0.3);
          color: ${GOLD}; border-radius: 20px;
          padding: 4px 10px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.07em;
        }

        /* ── Header ─────────────────────────────────────── */
        .bt-header {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; height: 60px;
          background: rgba(250,250,248,0.93);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid ${C.border};
        }
        .bt-header-cta {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 8px 18px; border-radius: 8px;
          background: ${GOLD}; color: #fff;
          font-size: 13px; font-weight: 600; letter-spacing: 0.01em;
          transition: opacity 0.15s, transform 0.15s; cursor: pointer;
        }
        .bt-header-cta:hover { opacity: 0.87; transform: translateY(-1px); }
        @media (max-width: 520px) {
          .bt-header { padding: 0 16px; }
          .bt-badge { display: none; }
        }

        /* ── Hero ──────────────────────────────────────── */
        .bt-hero {
          max-width: 900px; margin: 0 auto;
          padding: 72px 32px 56px;
          display: flex; flex-direction: column; align-items: flex-start;
        }
        .bt-hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(185,157,94,0.08); border: 1px solid rgba(185,157,94,0.2);
          color: ${GOLD}; border-radius: 20px; padding: 6px 14px;
          font-size: 12px; font-weight: 600; margin-bottom: 20px;
        }
        .bt-title {
          font-size: clamp(28px, 4.5vw, 46px);
          font-weight: 800; letter-spacing: -0.028em;
          line-height: 1.1; color: ${C.text}; margin-bottom: 18px;
        }
        .bt-subtitle {
          font-size: 17px; line-height: 1.75;
          color: ${C.sub}; max-width: 620px; margin-bottom: 24px;
        }
        .bt-hero-pills {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .bt-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: ${C.surface}; border: 1px solid ${C.border};
          border-radius: 20px; padding: 6px 12px;
          font-size: 12px; font-weight: 500; color: ${C.sub};
        }
        @media (max-width: 600px) {
          .bt-hero { padding: 48px 20px 40px; }
          .bt-subtitle { font-size: 15px; }
        }

        /* ── Apps ───────────────────────────────────────── */
        .bt-apps-section {
          max-width: 1100px; margin: 0 auto;
          padding: 0 28px 64px;
        }
        .bt-section-header { margin-bottom: 24px; }
        .bt-section-title {
          font-size: 22px; font-weight: 700;
          color: ${C.text}; letter-spacing: -0.015em;
        }
        .bt-section-sub { font-size: 14px; color: ${C.sub}; margin-top: 4px; }
        .bt-apps-group {}
        .bt-apps-label {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 600; color: ${C.sub};
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .bt-status-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        }
        .bt-dot-available    { background: #3a7c52; }
        .bt-dot-experimental { background: #B99D5E; }
        .bt-apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 6px;
        }
        .bt-app-item {
          display: flex; flex-direction: column;
          align-items: center; gap: 7px;
          padding: 14px 6px 12px; border-radius: 10px;
          border: 1px solid transparent;
          cursor: default; transition: background 0.12s, border-color 0.12s;
        }
        .bt-app-item:hover {
          background: ${C.surface};
          border-color: ${C.border};
        }
        .bt-app-icon {
          width: 44px; height: 44px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bt-app-icon-available    { background: rgba(58,124,82,0.07);  color: #3a7c52; }
        .bt-app-icon-experimental { background: rgba(185,157,94,0.08); color: ${GOLD}; }
        .bt-app-name {
          font-size: 11px; color: ${C.sub};
          text-align: center; line-height: 1.35;
          font-weight: 500; max-width: 90px;
        }

        /* ── Benefits ────────────────────────────────────── */
        .bt-benefits {
          background: ${C.surface};
          border-top: 1px solid ${C.border}; border-bottom: 1px solid ${C.border};
          padding: 52px 32px;
        }
        .bt-benefits-grid {
          max-width: 900px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        .bt-benefit-card {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 18px; border-radius: 12px;
          border: 1px solid ${C.border}; background: ${C.bg};
        }
        @media (max-width: 600px) {
          .bt-benefits { padding: 40px 20px; }
          .bt-benefits-grid { grid-template-columns: 1fr; }
        }

        /* ── Form ───────────────────────────────────────── */
        .bt-form-section { padding: 64px 24px; }
        .bt-form-box { max-width: 560px; margin: 0 auto; }
        .bt-wl-title {
          font-size: 22px; font-weight: 700;
          color: ${C.text}; margin-bottom: 8px; letter-spacing: -0.015em;
        }
        .bt-wl-sub {
          font-size: 14px; color: ${C.sub}; margin-bottom: 20px; line-height: 1.65;
        }
        .bt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .bt-field { display: flex; flex-direction: column; gap: 5px; }
        .bt-lbl {
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          text-transform: uppercase; color: #9a9490;
        }
        .bt-opt { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 10px; }
        .bt-inp {
          padding: 9px 11px; background: #FAFAF8;
          border: 1px solid ${C.border}; border-radius: 7px;
          font-size: 14px; color: ${C.text}; outline: none; width: 100%;
          transition: border-color 0.15s;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .bt-inp::placeholder { color: #b8b4ae; }
        .bt-inp:focus { border-color: ${GOLD}; }
        .bt-sel { appearance: none; cursor: pointer; }
        .bt-consent {
          display: flex; align-items: flex-start; gap: 10px;
          cursor: pointer; margin: 16px 0 20px;
        }
        .bt-chk { accent-color: ${GOLD}; width: 15px; height: 15px; flex-shrink: 0; margin-top: 2px; cursor: pointer; }
        .bt-consent-txt { font-size: 12.5px; color: ${C.sub}; line-height: 1.65; }
        .bt-err {
          margin-bottom: 12px; padding: 9px 12px;
          background: rgba(200,60,60,0.06); border: 1px solid rgba(200,60,60,0.2);
          border-radius: 7px; font-size: 13px; color: #c04040;
        }
        .bt-submit {
          width: 100%; padding: 13px;
          background: ${GOLD}; color: #fff; border: none; border-radius: 8px;
          font-size: 15px; font-weight: 600; cursor: pointer; letter-spacing: 0.01em;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: opacity 0.15s, transform 0.15s;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .bt-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .bt-submit:disabled { opacity: 0.45; cursor: not-allowed; }
        .bt-spin {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: btspin .6s linear infinite;
        }
        @keyframes btspin { to { transform: rotate(360deg); } }
        @media (max-width: 520px) { .bt-row { grid-template-columns: 1fr; } }

        /* ── Footer ─────────────────────────────────────── */
        .bt-footer { padding: 28px 24px; background: ${C.bg}; border-top: 1px solid ${C.border}; }
        .bt-footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .bt-copyright { font-size: 12px; color: #a8a49e; }
        .bt-footer-links {
          display: flex; align-items: center; gap: 10px; margin-left: auto; flex-wrap: wrap;
        }
        .bt-flink { font-size: 12px; color: #a8a49e; transition: color 0.15s; }
        .bt-flink:hover { color: ${C.text}; }
        .bt-sep { font-size: 12px; color: ${C.border}; }
        @media (max-width: 560px) {
          .bt-footer-inner { flex-direction: column; align-items: flex-start; gap: 8px; }
          .bt-footer-links { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
