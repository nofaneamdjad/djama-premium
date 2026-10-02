"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, Plus, Clock, Star, Trash2, Loader2, ArrowRight, Zap, BarChart3, Briefcase, ClipboardList, PenLine } from "lucide-react";
import Link from "next/link";

interface ArtifactSummary {
  id: string; title: string; type: string;
  is_favorite: boolean; updated_at: string;
  metadata: { wordCount?: number };
}

const PLACEHOLDERS = [
  "Un rapport professionnel de 5 pages",
  "Une proposition commerciale convaincante",
  "Un business plan structuré",
  "Un compte rendu de réunion",
  "Un cahier des charges complet",
  "Une présentation pour investisseurs",
];

const QUICK_ACTIONS = [
  { label: "Rapport d'activité",     prompt: "Crée un rapport d'activité mensuel professionnel avec indicateurs clés, résumé exécutif et points d'action", icon: BarChart3 },
  { label: "Proposition commerciale", prompt: "Rédige une proposition commerciale de 6 pages pour une prestation de conseil digital à 8 500 €, avec planning, livrables et conditions", icon: Briefcase },
  { label: "Cahier des charges",     prompt: "Génère un cahier des charges complet pour le développement d'une application mobile, avec contexte, fonctionnalités, contraintes techniques et planning", icon: ClipboardList },
  { label: "Compte rendu",           prompt: "Crée un template de compte rendu de réunion professionnelle avec ordre du jour, décisions prises, actions à mener et prochaines étapes", icon: PenLine },
];

export default function AIDocsPage() {
  const router = useRouter();
  const [prompt, setPrompt]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [recents, setRecents]     = useState<ArtifactSummary[]>([]);
  const [fetching, setFetching]   = useState(true);
  const [placeholder, setPlaceholder] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotation placeholder animée
  useEffect(() => {
    const t = setInterval(() => setPlaceholder(p => (p + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const loadRecents = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-docs/artifact?type=document&limit=8");
      if (res.ok) {
        const data = await res.json() as { artifacts: ArtifactSummary[] };
        setRecents(data.artifacts ?? []);
      }
    } finally { setFetching(false); }
  }, []);

  useEffect(() => { void loadRecents(); }, [loadRecents]);

  async function startWithPrompt(p: string) {
    if (!p.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-docs/artifact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "document", title: "Nouveau document" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { artifact: ArtifactSummary };
      router.push(`/client/ai-docs/${data.artifact.id}?firstMessage=${encodeURIComponent(p)}`);
    } catch { setLoading(false); }
  }

  async function toggleFavorite(id: string, current: boolean) {
    await fetch(`/api/ai-docs/artifact/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !current }),
    });
    setRecents(prev => prev.map(a => a.id === id ? { ...a, is_favorite: !current } : a));
  }

  async function archiveDoc(id: string) {
    await fetch(`/api/ai-docs/artifact/${id}`, { method: "DELETE" });
    setRecents(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)" }}>
      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        backgroundSize: "150px 150px",
      }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-20 pb-24">

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: "rgba(124,99,250,0.2)", border: "1px solid rgba(124,99,250,0.4)", color: "#c4b5fd" }}>
            <Sparkles className="w-3.5 h-3.5" />
            DJAMA AI Docs
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl font-bold text-white mb-4 leading-tight" style={{ letterSpacing: "-0.03em" }}>
          Que voulez-vous<br />
          <span style={{ background: "linear-gradient(90deg, #a78bfa, #818cf8, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            créer aujourd&apos;hui ?
          </span>
        </h1>
        <p className="text-center mb-12 text-base" style={{ color: "rgba(255,255,255,0.5)" }}>
          Décrivez votre document — l&apos;IA le construit en quelques secondes.
        </p>

        {/* Zone de saisie */}
        <div className="rounded-2xl p-[1px] mb-4" style={{ background: "linear-gradient(135deg, rgba(124,99,250,0.6), rgba(103,232,249,0.3))" }}>
          <div className="rounded-2xl p-5" style={{ background: "rgba(15,12,41,0.95)", backdropFilter: "blur(20px)" }}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void startWithPrompt(prompt); }}
              placeholder={PLACEHOLDERS[placeholder]}
              rows={4}
              className="w-full resize-none outline-none text-base leading-relaxed"
              style={{ background: "transparent", color: "rgba(255,255,255,0.9)", caretColor: "#a78bfa" }}
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-4 pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Cmd+Enter pour créer</span>
              <button
                onClick={() => void startWithPrompt(prompt)}
                disabled={!prompt.trim() || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, #7c63fa, #818cf8)", color: "white" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-3 mb-12">
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => void startWithPrompt(a.prompt)} disabled={loading}
              className="flex items-center gap-3 p-4 rounded-xl text-left transition-all group disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,99,250,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(124,99,250,0.18)" }}>
                <a.icon size={16} style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{a.label}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {a.prompt.slice(0, 60)}…
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Documents récents */}
        {(fetching || recents.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Clock className="w-3.5 h-3.5" /> Récents
              </h2>
              <button onClick={() => void startWithPrompt("Nouveau document vierge")} disabled={loading}
                className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#a78bfa" }}>
                <Plus className="w-3.5 h-3.5" /> Nouveau
              </button>
            </div>

            {fetching ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} /></div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {recents.map(art => (
                  <div key={art.id} className="group flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,99,250,0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}>
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ background: "rgba(124,99,250,0.2)" }}>
                      <FileText className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/client/ai-docs/${art.id}`}
                        className="text-sm font-medium truncate block hover:opacity-80" style={{ color: "rgba(255,255,255,0.85)" }}>
                        {art.title}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {new Date(art.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => void toggleFavorite(art.id, art.is_favorite)} className="p-1.5 rounded-lg hover:bg-white/10">
                        <Star className={`w-3 h-3 ${art.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} style={{ color: art.is_favorite ? undefined : "rgba(255,255,255,0.3)" }} />
                      </button>
                      <button onClick={() => void archiveDoc(art.id)} className="p-1.5 rounded-lg hover:bg-red-500/20">
                        <Trash2 className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
                      </button>
                      <Link href={`/client/ai-docs/${art.id}`} className="p-1.5 rounded-lg hover:bg-white/10">
                        <ArrowRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
