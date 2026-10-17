"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ArrowLeft, ArrowRight, Sparkles, Layout,
  Check, Loader2, Send, Bot, User, Wand2
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";
import { SITE_TEMPLATES } from "@/lib/website-builder/templates";

type Step = "mode" | "template" | "config" | "ai-chat" | "creating";
type Mode = "template" | "blank" | "ai";

interface ChatMsg { role: "user" | "assistant"; text: string }

export default function CreateSitePage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const router = useRouter();

  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<Mode>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [subdomainMsg, setSubdomainMsg] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  // ── AI chat state ──
  const [aiDescription, setAiDescription] = useState("");
  const [aiMessages, setAiMessages] = useState<ChatMsg[]>([
    { role: "assistant", text: "Bonjour ! Décrivez-moi votre activité ou votre projet, et je vais créer votre site web en quelques secondes. 🚀\n\nPar exemple : *« Je suis plombier à Lyon, je cherche un site vitrine pour présenter mes services et permettre aux clients de me contacter. »*" },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // ── Vérification sous-domaine ──
  async function checkSubdomain(value: string) {
    if (!value || value.length < 3) { setSubdomainStatus("idle"); return; }
    setSubdomainStatus("checking");
    try {
      const res = await fetch(`/api/websites/check-subdomain?subdomain=${encodeURIComponent(value)}`);
      const data = await res.json() as { available: boolean; error?: string; subdomain?: string };
      if (data.error) { setSubdomainStatus("error"); setSubdomainMsg(data.error); }
      else if (data.available) { setSubdomainStatus("available"); setSubdomainMsg(data.subdomain ?? ""); }
      else { setSubdomainStatus("taken"); setSubdomainMsg("Ce sous-domaine est déjà pris."); }
    } catch { setSubdomainStatus("error"); setSubdomainMsg("Erreur de vérification."); }
  }

  // ── Génération IA ──
  async function handleAiGenerate() {
    if (!aiInput.trim() && aiMessages.length <= 1) return;
    const userMsg = aiInput.trim() || aiDescription;
    if (!userMsg) return;

    setAiMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/websites/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: userMsg, lang: "fr" }),
      });
      const data = await res.json() as { website?: { id: string; name: string }; error?: string };
      if (!res.ok || !data.website) throw new Error(data.error ?? "Erreur");

      setAiMessages(prev => [...prev, {
        role: "assistant",
        text: `✅ Site **"${data.website!.name}"** créé avec succès ! Je vous redirige vers l'éditeur…`,
      }]);
      setTimeout(() => router.push(`/client/site-web/${data.website!.id}/edit`), 1500);
    } catch (e) {
      setAiMessages(prev => [...prev, {
        role: "assistant",
        text: `❌ ${e instanceof Error ? e.message : "Erreur inconnue"}. Réessayez en décrivant mieux votre activité.`,
      }]);
    } finally {
      setAiLoading(false);
    }
  }

  // ── Création classique ──
  async function handleCreate() {
    if (!siteName.trim()) { setError("Le nom du site est requis."); return; }
    if (subdomain && subdomainStatus === "taken") { setError("Choisissez un autre sous-domaine."); return; }
    setCreating(true); setStep("creating"); setError("");
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
      setStep("config"); setCreating(false);
    }
  }

  const stepsBreadcrumb = mode === "ai" ? ["mode", "ai-chat"] : ["mode", "template", "config"];
  const stepIdx = stepsBreadcrumb.indexOf(step);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, padding: "2rem" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          <button
            onClick={() => step === "mode" ? router.push("/client/site-web") : setStep(stepsBreadcrumb[Math.max(0, stepIdx - 1)] as Step)}
            style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.6, padding: "0.25rem" }}
          >
            <ArrowLeft size={20} />
          </button>
          <Globe size={20} color="#2563EB" />
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Créer un nouveau site</h1>
        </div>

        {/* Progress */}
        {step !== "creating" && (
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "2.5rem" }}>
            {stepsBreadcrumb.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 9999, background: i <= stepIdx ? "#2563EB" : (isDark ? "#ffffff15" : "#e5e7eb"), transition: "background 0.3s" }} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Étape 1 : Mode ── */}
          {step === "mode" && (
            <motion.div key="mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Comment voulez-vous créer votre site ?</h2>
              <p style={{ opacity: 0.55, marginBottom: "2rem" }}>Décrivez votre activité à l'IA, partez d'un template ou commencez de zéro.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                {[
                  { id: "ai" as Mode, icon: <Wand2 size={28} color="#7C3AED" />, badge: "Recommandé", title: "Créer avec l'IA", desc: "Décrivez votre activité, Claude génère votre site complet en quelques secondes.", color: "#7C3AED" },
                  { id: "template" as Mode, icon: <Layout size={28} color="#2563EB" />, badge: "", title: "Depuis un template", desc: "Partez d'un modèle professionnel adapté à votre secteur.", color: "#2563EB" },
                  { id: "blank" as Mode, icon: <Globe size={28} color="#6B7280" />, badge: "", title: "Page blanche", desc: "Construisez votre site de zéro avec l'éditeur visuel.", color: "#6B7280" },
                ].map(opt => (
                  <motion.div
                    key={opt.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMode(opt.id);
                      if (opt.id === "ai") setStep("ai-chat");
                      else if (opt.id === "template") setStep("template");
                      else setStep("config");
                      if (opt.id !== "template") setSelectedTemplate(null);
                    }}
                    style={{
                      background: t.glass, border: `2px solid ${mode === opt.id ? opt.color : t.border}`,
                      borderRadius: "1.25rem", padding: "1.75rem", cursor: "pointer", position: "relative",
                    }}
                  >
                    {opt.badge && (
                      <span style={{ position: "absolute", top: "-0.6rem", right: "1rem", background: opt.color, color: "#fff", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.7rem", borderRadius: 9999 }}>
                        {opt.badge}
                      </span>
                    )}
                    <div style={{ marginBottom: "0.85rem" }}>{opt.icon}</div>
                    <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>{opt.title}</h3>
                    <p style={{ opacity: 0.6, fontSize: "0.85rem", margin: 0, lineHeight: 1.55 }}>{opt.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Étape IA : Chat ── */}
          {step === "ai-chat" && (
            <motion.div key="ai-chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", maxHeight: 600 }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.25rem" }}>Décrivez votre projet à l'IA</h2>
              <p style={{ opacity: 0.55, fontSize: "0.875rem", marginBottom: "1.25rem" }}>Claude va analyser votre description et créer votre site complet automatiquement.</p>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem", background: isDark ? "#ffffff06" : "#f8fafc", borderRadius: "1rem", marginBottom: "1rem" }}>
                {aiMessages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
                    {msg.role === "assistant" && (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Bot size={16} color="#fff" />
                      </div>
                    )}
                    <div style={{
                      maxWidth: "75%", padding: "0.75rem 1rem", borderRadius: "1rem",
                      background: msg.role === "user" ? "#2563EB" : (isDark ? "#ffffff10" : "#fff"),
                      color: msg.role === "user" ? "#fff" : t.text,
                      fontSize: "0.875rem", lineHeight: 1.6,
                      borderBottomRightRadius: msg.role === "user" ? "0.25rem" : "1rem",
                      borderBottomLeftRadius: msg.role === "assistant" ? "0.25rem" : "1rem",
                      boxShadow: msg.role === "user" ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                      whiteSpace: "pre-wrap",
                    }}>
                      {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </div>
                    {msg.role === "user" && (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={16} color="#fff" />
                      </div>
                    )}
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bot size={16} color="#fff" />
                    </div>
                    <div style={{ display: "flex", gap: "0.3rem", padding: "0.75rem 1rem", background: isDark ? "#ffffff10" : "#fff", borderRadius: "1rem" }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
                          style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED" }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && !aiLoading && handleAiGenerate()}
                  placeholder="Ex : Je suis photographe à Paris, je veux un site portfolio élégant…"
                  disabled={aiLoading}
                  style={{
                    flex: 1, padding: "0.85rem 1.1rem",
                    background: t.glass, border: `1px solid ${t.border}`,
                    borderRadius: "0.85rem", color: t.text, fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiInput.trim()}
                  style={{
                    background: "#7C3AED", color: "#fff", border: "none",
                    borderRadius: "0.85rem", padding: "0 1.25rem",
                    cursor: aiLoading || !aiInput.trim() ? "not-allowed" : "pointer",
                    opacity: aiLoading || !aiInput.trim() ? 0.5 : 1,
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    fontWeight: 600, fontSize: "0.875rem",
                  }}
                >
                  {aiLoading ? <Loader2 size={16} /> : <Send size={16} />}
                  Générer
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Étape 2 : Template ── */}
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
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                {error && <p style={{ color: "#EF4444", margin: "auto 0" }}>{error}</p>}
                <button
                  onClick={() => { if (!selectedTemplate) { setError("Sélectionnez un template."); return; } setError(""); setStep("config"); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Étape 3 : Config ── */}
          {step === "config" && (
            <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Configurez votre site</h2>
              <p style={{ opacity: 0.55, marginBottom: "2rem" }}>Ces informations pourront être modifiées plus tard.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 520 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>Nom du site *</label>
                  <input
                    value={siteName}
                    onChange={e => setSiteName(e.target.value)}
                    placeholder="Ex : Cabinet Dupont, Mon Atelier Créatif…"
                    style={{ width: "100%", padding: "0.75rem 1rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.75rem", color: t.text, fontSize: "0.95rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    Sous-domaine <span style={{ opacity: 0.5, fontWeight: 400 }}>(optionnel)</span>
                  </label>
                  <div style={{ display: "flex", border: `1px solid ${subdomainStatus === "available" ? "#10B981" : subdomainStatus === "taken" ? "#EF4444" : t.border}`, borderRadius: "0.75rem", overflow: "hidden" }}>
                    <input
                      value={subdomain}
                      onChange={e => {
                        const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        setSubdomain(v);
                        setSubdomainStatus("idle");
                        if (v.length >= 3) {
                          clearTimeout((window as typeof window & { _sdTimer?: ReturnType<typeof setTimeout> })._sdTimer);
                          (window as typeof window & { _sdTimer?: ReturnType<typeof setTimeout> })._sdTimer = setTimeout(() => checkSubdomain(v), 500);
                        }
                      }}
                      placeholder="mon-entreprise"
                      style={{ flex: 1, padding: "0.75rem 1rem", background: t.glass, border: "none", color: t.text, fontSize: "0.95rem" }}
                    />
                    <span style={{ padding: "0 1rem", background: isDark ? "#ffffff10" : "#f3f4f6", color: t.text, opacity: 0.6, fontSize: "0.85rem", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>.djama.site</span>
                  </div>
                  {subdomainStatus === "checking" && <p style={{ fontSize: "0.78rem", opacity: 0.5, marginTop: "0.3rem" }}>Vérification…</p>}
                  {subdomainStatus === "available" && <p style={{ fontSize: "0.78rem", color: "#10B981", marginTop: "0.3rem" }}>✓ {subdomainMsg}</p>}
                  {(subdomainStatus === "taken" || subdomainStatus === "error") && <p style={{ fontSize: "0.78rem", color: "#EF4444", marginTop: "0.3rem" }}>✗ {subdomainMsg}</p>}
                </div>
                {error && <p style={{ color: "#EF4444", margin: 0 }}>{error}</p>}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button onClick={() => setStep(mode === "template" ? "template" : "mode")} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "0.75rem", padding: "0.65rem 1.25rem", cursor: "pointer", color: t.text, fontWeight: 600 }}>Retour</button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || subdomainStatus === "taken"}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    {creating ? <Loader2 size={16} /> : <Globe size={16} />} Créer le site
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Creating ── */}
          {step === "creating" && (
            <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "5rem 2rem" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-block", marginBottom: "2rem" }}>
                <Sparkles size={48} color="#2563EB" />
              </motion.div>
              <h2 style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.5rem" }}>Création en cours…</h2>
              <p style={{ opacity: 0.55 }}>Construction du site avec le template sélectionné.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
