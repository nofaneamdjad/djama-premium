"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ArrowLeft, ArrowRight, Sparkles, Layout,
  Check, Loader2
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";
import { SITE_TEMPLATES } from "@/lib/website-builder/templates";

type Step = "mode" | "template" | "config" | "creating";

export default function CreateSitePage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const router = useRouter();

  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<"template" | "blank">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!siteName.trim()) { setError("Le nom du site est requis."); return; }
    setCreating(true);
    setStep("creating");
    setError("");

    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: siteName.trim(),
          template_id: selectedTemplate ?? undefined,
          subdomain: subdomain.trim() || undefined,
        }),
      });
      const data = await res.json() as { website?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.push(`/client/site-web/${data.website!.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setStep("config");
      setCreating(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, padding: "2rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          <button
            onClick={() => step === "mode" ? router.push("/client/site-web") : setStep(step === "template" ? "mode" : "template")}
            style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.6, padding: "0.25rem" }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Globe size={20} color="#2563EB" />
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Créer un nouveau site</h1>
          </div>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem" }}>
          {(["mode", "template", "config"] as Step[]).map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 9999, background: ["mode", "template", "config"].indexOf(step) >= i ? "#2563EB" : (isDark ? "#ffffff20" : "#e5e7eb") }} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Étape 1 — Mode */}
          {step === "mode" && (
            <motion.div key="mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Comment voulez-vous démarrer ?</h2>
              <p style={{ opacity: 0.55, marginBottom: "2rem" }}>Choisissez un template professionnel ou partez de zéro.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {[
                  { id: "template" as const, icon: <Layout size={28} color="#2563EB" />, title: "Depuis un template", desc: "Commencez avec un site pré-construit adapté à votre activité." },
                  { id: "blank" as const, icon: <Sparkles size={28} color="#7C3AED" />, title: "Page blanche", desc: "Construisez votre site de zéro avec l'éditeur visuel." },
                ].map(opt => (
                  <motion.div
                    key={opt.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setMode(opt.id); setStep(opt.id === "template" ? "template" : "config"); if (opt.id === "blank") setSelectedTemplate(null); }}
                    style={{
                      background: t.glass, border: `2px solid ${mode === opt.id ? "#2563EB" : t.border}`,
                      borderRadius: "1rem", padding: "2rem", cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div style={{ marginBottom: "1rem" }}>{opt.icon}</div>
                    <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.4rem" }}>{opt.title}</h3>
                    <p style={{ opacity: 0.6, fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>{opt.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Étape 2 — Template */}
          {step === "template" && (
            <motion.div key="template" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Choisissez votre template</h2>
              <p style={{ opacity: 0.55, marginBottom: "2rem" }}>Sélectionnez le modèle le plus adapté à votre activité.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {SITE_TEMPLATES.map(tpl => (
                  <motion.div
                    key={tpl.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    style={{
                      background: t.glass,
                      border: `2px solid ${selectedTemplate === tpl.id ? tpl.color : t.border}`,
                      borderRadius: "1rem", padding: "1.5rem", cursor: "pointer", position: "relative",
                    }}
                  >
                    {selectedTemplate === tpl.id && (
                      <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: tpl.color, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                    <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{tpl.icon}</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: tpl.color, marginBottom: "0.3rem" }}>{tpl.category}</div>
                    <h3 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem" }}>{tpl.label}</h3>
                    <p style={{ opacity: 0.6, fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>{tpl.desc}</p>
                  </motion.div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => { if (!selectedTemplate) { setError("Sélectionnez un template."); return; } setError(""); setStep("config"); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
              {error && <p style={{ color: "#EF4444", marginTop: "0.75rem" }}>{error}</p>}
            </motion.div>
          )}

          {/* Étape 3 — Config */}
          {step === "config" && (
            <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Configurez votre site</h2>
              <p style={{ opacity: 0.55, marginBottom: "2rem" }}>Ces informations pourront être modifiées plus tard.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 500 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>Nom du site *</label>
                  <input
                    value={siteName}
                    onChange={e => setSiteName(e.target.value)}
                    placeholder="Ex : Cabinet Dupont, Mon Atelier Créatif…"
                    style={{
                      width: "100%", padding: "0.75rem 1rem",
                      background: t.glass, border: `1px solid ${t.border}`,
                      borderRadius: "0.75rem", color: t.text, fontSize: "0.95rem",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    Sous-domaine <span style={{ opacity: 0.5, fontWeight: 400 }}>(optionnel)</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 0, border: `1px solid ${t.border}`, borderRadius: "0.75rem", overflow: "hidden" }}>
                    <input
                      value={subdomain}
                      onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="mon-entreprise"
                      style={{ flex: 1, padding: "0.75rem 1rem", background: t.glass, border: "none", color: t.text, fontSize: "0.95rem" }}
                    />
                    <span style={{ padding: "0 1rem", background: isDark ? "#ffffff10" : "#f3f4f6", color: t.text, opacity: 0.6, fontSize: "0.85rem", whiteSpace: "nowrap" }}>.djama.site</span>
                  </div>
                </div>
                {error && <p style={{ color: "#EF4444", margin: 0 }}>{error}</p>}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setStep(mode === "template" ? "template" : "mode")}
                    style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "0.75rem", padding: "0.65rem 1.25rem", cursor: "pointer", color: t.text, fontWeight: 600 }}
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                    Créer le site
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Creating */}
          {step === "creating" && (
            <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "5rem 2rem" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-block", marginBottom: "2rem" }}>
                <Loader2 size={48} color="#2563EB" />
              </motion.div>
              <h2 style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.5rem" }}>Création en cours…</h2>
              <p style={{ opacity: 0.55 }}>Nous configurons votre site avec le template sélectionné.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
