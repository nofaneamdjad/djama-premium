"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const MODULES = [
  { id: "factures",    label: "Factures & Devis",    icon: "📄", desc: "Créez vos factures professionnelles" },
  { id: "rdv",         label: "Rendez-vous",          icon: "📅", desc: "Gérez votre agenda et réservations" },
  { id: "crm",         label: "CRM Clients",           icon: "👥", desc: "Suivez vos clients et prospects" },
  { id: "depenses",    label: "Dépenses",              icon: "💰", desc: "Contrôlez vos charges" },
  { id: "comptabilite",label: "Comptabilité",          icon: "📊", desc: "Synthèse financière" },
  { id: "projets",     label: "Projets",               icon: "🗂️", desc: "Suivez l'avancement" },
  { id: "planning",    label: "Planning",              icon: "🗓️", desc: "Organisez vos équipes" },
  { id: "signatures",  label: "Signatures",            icon: "✍️",  desc: "Signez électroniquement" },
  { id: "contrats",    label: "Contrats",              icon: "📜", desc: "Gérez vos contrats" },
  { id: "chatbot",     label: "Chatbot IA",            icon: "🤖", desc: "Assistant IA pour vos clients" },
  { id: "site-web",    label: "Site Web",              icon: "🌐", desc: "Créez votre site" },
  { id: "boutique",    label: "Boutique",              icon: "🛒", desc: "Vendez en ligne" },
];

const COUNTRIES = [
  { code: "FR", label: "France" },
  { code: "MA", label: "Maroc" },
  { code: "DZ", label: "Algérie" },
  { code: "TN", label: "Tunisie" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" },
  { code: "SN", label: "Sénégal" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "CM", label: "Cameroun" },
  { code: "OTHER", label: "Autre" },
];

const STEPS = ["welcome","company","modules","first-action","done"] as const;
type Step = typeof STEPS[number];

const GOLD = "#c9a55a";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    company_name: "",
    activity: "",
    country: "FR",
    currency: "EUR",
    phone: "",
    selected_modules: ["factures","rdv","crm"] as string[],
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Vérifie si onboarding déjà complété
  useEffect(() => {
    fetch("/api/onboarding")
      .then(r => r.json())
      .then((d: { profile?: { onboarding_done?: boolean; company_name?: string; selected_modules?: string[] } }) => {
        if (d.profile?.onboarding_done) {
          router.replace("/client/dashboard");
        }
        if (d.profile?.company_name) setProfile(p => ({ ...p, company_name: d.profile!.company_name! }));
        if (d.profile?.selected_modules) setProfile(p => ({ ...p, selected_modules: d.profile!.selected_modules! }));
      })
      .catch(() => {});
  }, [router]);

  async function saveStep(s: Step, data?: Record<string, unknown>) {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: s, completed: true, data }),
    });
  }

  async function goNext() {
    setLoading(true);
    const idx = STEPS.indexOf(step);
    if (step === "company") {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "company", completed: true, profile }),
      });
    }
    if (step === "modules") {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "modules", completed: true, profile: { selected_modules: profile.selected_modules } }),
      });
    }
    if (step === "done") {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "done", completed: true, profile: {}, done: true }),
      });
      router.push("/client/dashboard");
      return;
    }
    if (idx < STEPS.length - 1) {
      await saveStep(step);
      setStep(STEPS[idx + 1]);
    }
    setLoading(false);
  }

  async function skip() {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "done", completed: true, profile: {}, done: true }),
    });
    router.push("/client/dashboard");
  }

  function toggleModule(id: string) {
    setProfile(p => ({
      ...p,
      selected_modules: p.selected_modules.includes(id)
        ? p.selected_modules.filter(m => m !== id)
        : [...p.selected_modules, id],
    }));
  }

  const progress = ((STEPS.indexOf(step)) / (STEPS.length - 1)) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      {/* Barre de progression */}
      <div style={{ width: "100%", maxWidth: 560, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: GOLD, fontWeight: 700, letterSpacing: "0.1em" }}>DJAMA</span>
          <button onClick={skip} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer" }}>Ignorer →</button>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: GOLD, borderRadius: 4, transition: "width 0.4s" }} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 560, background: "#111113", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", padding: "40px 36px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        {step === "welcome" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>👋</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, color: "#fff" }}>Bienvenue sur DJAMA Pro</h1>
            <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 32 }}>
              Votre espace de travail tout-en-un pour gérer votre activité professionnelle. <br />
              Prenons 2 minutes pour configurer votre espace.
            </p>
            <button onClick={goNext} disabled={loading} style={{ background: GOLD, color: "#000", fontWeight: 700, border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 15, cursor: "pointer", width: "100%" }}>
              Commencer la configuration →
            </button>
          </div>
        )}

        {step === "company" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Votre entreprise</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 24, fontSize: 14 }}>Ces informations apparaîtront sur vos factures et devis.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Nom de l&apos;entreprise / Prénom Nom</label>
                <input style={inp} value={profile.company_name} onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))} placeholder="Ex : Dupont Consulting" />
              </div>
              <div>
                <label style={lbl}>Secteur d&apos;activité</label>
                <input style={inp} value={profile.activity} onChange={e => setProfile(p => ({ ...p, activity: e.target.value }))} placeholder="Ex : Consultant marketing, Développeur web…" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Pays</label>
                  <select style={inp} value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Devise</label>
                  <select style={inp} value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}>
                    <option value="EUR">EUR — Euro</option>
                    <option value="MAD">MAD — Dirham</option>
                    <option value="DZD">DZD — Dinar algérien</option>
                    <option value="USD">USD — Dollar</option>
                    <option value="XOF">XOF — Franc CFA</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Téléphone (optionnel)</label>
                <input style={inp} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+33 6 00 00 00 00" />
              </div>
            </div>
            <button onClick={goNext} disabled={loading || !profile.company_name.trim()} style={{ ...btn, marginTop: 28, opacity: profile.company_name.trim() ? 1 : 0.4 }}>
              Continuer →
            </button>
          </div>
        )}

        {step === "modules" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Vos applications</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 24, fontSize: 14 }}>Sélectionnez les outils qui vous seront utiles au quotidien. Vous pourrez en activer d&apos;autres plus tard.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }}>
              {MODULES.map(m => {
                const active = profile.selected_modules.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleModule(m.id)}
                    style={{ background: active ? "rgba(201,165,90,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left", color: "#fff", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? GOLD : "#fff" }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{m.desc}</div>
                  </button>
                );
              })}
            </div>
            <button onClick={goNext} disabled={loading} style={btn}>Configurer mon espace →</button>
          </div>
        )}

        {step === "first-action" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Première action recommandée</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 28 }}>
              Commencez par créer votre premier client — toutes vos factures, devis et relances seront liés à vos clients.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="/client/crm" style={{ background: GOLD, color: "#000", fontWeight: 700, borderRadius: 10, padding: "14px 24px", fontSize: 14, textDecoration: "none", textAlign: "center" }}>
                👥 Ajouter mon premier client
              </a>
              <a href="/client/factures/nouveau" style={{ background: "rgba(255,255,255,0.06)", color: "#fff", borderRadius: 10, padding: "14px 24px", fontSize: 14, textDecoration: "none", textAlign: "center" }}>
                📄 Créer ma première facture
              </a>
              <button onClick={goNext} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", padding: "8px" }}>
                Aller directement au tableau de bord
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: GOLD }}>Tout est prêt !</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 32 }}>
              Votre espace DJAMA Pro est configuré. <br />
              Retrouvez toutes vos applications depuis votre tableau de bord.
            </p>
            <button onClick={goNext} disabled={loading} style={btn}>Accéder à mon espace →</button>
          </div>
        )}
      </div>

      {step !== "welcome" && step !== "done" && (
        <button onClick={() => { const idx = STEPS.indexOf(step); if (idx > 0) setStep(STEPS[idx - 1]); }}
          style={{ marginTop: 16, background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}>
          ← Retour
        </button>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" };
const inp: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, boxSizing: "border-box", outline: "none" };
const btn: React.CSSProperties = { background: GOLD, color: "#000", fontWeight: 700, border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 15, cursor: "pointer", width: "100%" };
