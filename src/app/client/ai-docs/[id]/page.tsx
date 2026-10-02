"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Send, Loader2, Sparkles, ArrowLeft, Download, Star, RotateCcw,
  History, ChevronDown, ChevronRight, Clock, Check, X, FileDown,
  Maximize2, Minimize2,
  Search, BookOpen, Settings2, PenLine, Wrench, Layers, Save, CheckCircle2, Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Artifact, OrchestratorEvent, DocumentContent, ArtifactOperation } from "@/lib/artifacts/types";
import { isDocumentContent } from "@/lib/artifacts/types";
import DocumentRenderer from "@/components/ai-docs/DocumentRenderer";

interface ChatMsg  { id: string; role: "user"|"assistant"|"status"; content: string; }
interface Version  { id: string; version_num: number; description: string; created_at: string; }

const STATUS_ICONS: Record<string, LucideIcon> = {
  "Compréhension": Search,
  "Analyse":       BookOpen,
  "Préparation":   Settings2,
  "Rédaction":     PenLine,
  "Application":   Wrench,
  "Création":      Layers,
  "Sauvegarde":    Save,
  "Finalisation":  CheckCircle2,
};

function StatusIcon({ text }: { text: string }) {
  for (const [k, Icon] of Object.entries(STATUS_ICONS)) {
    if (text.includes(k)) return <Icon size={13} className="flex-shrink-0" />;
  }
  return <Timer size={13} className="flex-shrink-0" />;
}

export default function ArtifactWorkspace() {
  const params       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [artifact,     setArtifact]     = useState<Artifact | null>(null);
  const [threadId,     setThreadId]     = useState<string | null>(null);
  const [messages,     setMessages]     = useState<ChatMsg[]>([]);
  const [input,        setInput]        = useState("");
  const [streaming,    setStreaming]     = useState(false);
  const [statusText,   setStatusText]   = useState<string | null>(null);
  const [loadErr,      setLoadErr]      = useState<string | null>(null);

  // Panneaux
  const [showHistory,  setShowHistory]  = useState(false);
  const [versions,     setVersions]     = useState<Version[]>([]);
  const [loadingVers,  setLoadingVers]  = useState(false);
  const [docScale,     setDocScale]     = useState(0.75);
  const [fullPreview,  setFullPreview]  = useState(false);

  // Undo
  const [lastVersion,  setLastVersion]  = useState<number | null>(null);
  const [undoing,      setUndoing]      = useState(false);
  const [exportLoading,setExportLoading]= useState(false);

  const chatEndRef   = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const firstSent    = useRef(false);

  // ── Charger l'artifact ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const url = params.id === "demo"
        ? "/api/ai-docs/mock-artifact"
        : `/api/ai-docs/artifact/${params.id}`;
      const res = await fetch(url);
      if (!res.ok) { setLoadErr("Document introuvable"); return; }
      const data = await res.json() as { artifact: Artifact; threadId: string | null };
      setArtifact(data.artifact);
      setThreadId(data.threadId);
    }
    void load();
  }, [params.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, statusText]);

  // ── Charger l'historique ────────────────────────────────────────────────────
  async function loadVersions() {
    setLoadingVers(true);
    const res = await fetch(`/api/ai-docs/artifact/${params.id}/versions`);
    if (res.ok) {
      const data = await res.json() as { versions: Version[] };
      setVersions(data.versions);
    }
    setLoadingVers(false);
  }

  function openHistory() {
    setShowHistory(true);
    void loadVersions();
  }

  // ── Annuler la dernière modification ──────────────────────────────────────
  async function undoLast() {
    if (!lastVersion || undoing || !artifact) return;
    const targetVersion = lastVersion - 1;
    if (targetVersion < 1) return;
    setUndoing(true);
    try {
      const res = await fetch(`/api/ai-docs/artifact/${artifact.id}/versions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNum: targetVersion }),
      });
      if (res.ok) {
        const data = await res.json() as { artifact: Artifact; newVersion: number };
        setArtifact(data.artifact);
        setLastVersion(data.newVersion);
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "status", content: `↩ Restauré à la version ${targetVersion}` }]);
      }
    } finally { setUndoing(false); }
  }

  // ── Restaurer une version depuis l'historique ──────────────────────────────
  async function restoreVersion(vNum: number) {
    setUndoing(true);
    try {
      const res = await fetch(`/api/ai-docs/artifact/${params.id}/versions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNum: vNum }),
      });
      if (res.ok) {
        const data = await res.json() as { artifact: Artifact; newVersion: number };
        setArtifact(data.artifact);
        setLastVersion(data.newVersion);
        setShowHistory(false);
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "status", content: `↩ Version ${vNum} restaurée` }]);
      }
    } finally { setUndoing(false); }
  }

  // ── Exporter DOCX ──────────────────────────────────────────────────────────
  async function exportDocx() {
    if (!artifact || exportLoading) return;
    setExportLoading(true);
    try {
      const res = await fetch("/api/ai-docs/export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId: artifact.id, format: "docx" }),
      });
      if (!res.ok) { alert("Erreur export DOCX"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${artifact.title}.docx`; a.click();
      URL.revokeObjectURL(url);
    } finally { setExportLoading(false); }
  }

  // ── Envoyer message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    setStreaming(true); setStatusText(null);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInput("");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/ai-docs/orchestrate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          message: text,
          artifactId: artifact?.id ?? params.id,
          threadId: threadId ?? undefined,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Erreur serveur");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          const event = JSON.parse(raw) as OrchestratorEvent;

          switch (event.type) {
            case "status":
              setStatusText(event.text);
              break;
            case "operations":
              setStatusText(event.summary);
              break;
            case "artifact":
              setArtifact(event.artifact);
              break;
            case "complete":
              if (!threadId) setThreadId(event.threadId);
              if (event.version > 0) setLastVersion(event.version);
              setStatusText(null);
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(), role: "assistant",
                content: event.version > 0 ? `Document mis à jour (v${event.version})` : "Voici votre document.",
              }]);
              break;
            case "text_delta":
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return [...prev.slice(0, -1), { ...last, content: last.content + event.text }];
                return [...prev, { id: crypto.randomUUID(), role: "assistant", content: event.text }];
              });
              break;
            case "error":
              setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `[err] ${event.message}` }]);
              break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "[err] Erreur de connexion. Réessayez." }]);
      }
    } finally {
      setStreaming(false); setStatusText(null);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [artifact?.id, params.id, threadId, streaming]);

  // ── Envoyer le premier message depuis la page d'accueil ───────────────────
  useEffect(() => {
    const fm = searchParams.get("firstMessage");
    if (fm && artifact && !firstSent.current) {
      firstSent.current = true;
      void sendMessage(fm);
    }
  }, [artifact, searchParams, sendMessage]);

  const content = artifact && isDocumentContent(artifact.content as DocumentContent)
    ? artifact.content as DocumentContent : null;

  if (loadErr) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-gray-500">
      <p>{loadErr}</p>
      <Link href="/client/ai-docs" className="text-violet-600 underline text-sm">← Retour</Link>
    </div>
  );

  if (!artifact) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* ── Chat (30%) ───────────────────────────────────────────────────── */}
      {!fullPreview && (
      <aside className="w-[340px] flex-shrink-0 flex flex-col bg-white border-r border-gray-200 shadow-sm">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Link href="/client/ai-docs" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{artifact.title}</p>
            <p className="text-xs text-gray-400">DOC IA</p>
          </div>
          {/* Undo button — immédiatement accessible */}
          {lastVersion && lastVersion > 1 && (
            <button onClick={() => void undoLast()} disabled={undoing}
              title="Annuler la dernière modification IA"
              className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors disabled:opacity-40">
              {undoing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            </button>
          )}
          <button onClick={openHistory} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => void (async () => {
            const res = await fetch(`/api/ai-docs/artifact/${artifact.id}`, {
              method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_favorite: !artifact.is_favorite }),
            });
            if (res.ok) { const d = await res.json() as { artifact: Artifact }; setArtifact(d.artifact); }
          })()} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <Star className={`w-4 h-4 ${artifact.is_favorite ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && !streaming && (
            <div className="text-center py-8 text-gray-400">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-violet-200" />
              <p className="text-sm text-gray-500 font-medium mb-1">Document créé</p>
              <p className="text-xs text-gray-400">Demandez une modification pour continuer.</p>
              <div className="mt-4 space-y-1.5">
                {["Change uniquement le titre", "Ajoute un tableau après la 2e section", "Rends le design plus moderne", "Supprime la conclusion"].map(s => (
                  <button key={s} onClick={() => void sendMessage(s)}
                    className="w-full text-xs px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-left transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            msg.role === "status" ? (
              <div key={msg.id} className="flex items-center gap-2 text-xs text-gray-400 py-1">
                <div className="w-3 h-3 rounded-full bg-violet-200 flex-shrink-0" />
                {msg.content}
              </div>
            ) : (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : msg.content.startsWith("[err]")
                      ? "bg-red-50 text-red-700 rounded-bl-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {msg.role === "assistant" && msg.content.startsWith("[err]") && (
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium mb-1">
                      <X className="w-3 h-3" /> Erreur
                    </span>
                  )}
                  {msg.role === "assistant" && !msg.content.startsWith("[err]") && (
                    <span className="flex items-center gap-1 text-xs text-violet-500 font-medium mb-1">
                      <Check className="w-3 h-3" /> IA
                    </span>
                  )}
                  {msg.content.startsWith("[err]") ? msg.content.slice(6) : msg.content}
                </div>
              </div>
            )
          ))}

          {/* Streaming avec étapes animées */}
          {streaming && statusText && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 px-4 py-3 rounded-2xl rounded-bl-sm text-sm max-w-[88%]">
                <div className="flex items-center gap-2.5 text-violet-700">
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  <StatusIcon text={statusText} /><span>{statusText}</span>
                </div>
              </div>
            </div>
          )}
          {streaming && !statusText && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-violet-300 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(input); } }}
              placeholder="Demandez une modification…"
              rows={2}
              className="w-full bg-transparent resize-none text-sm text-gray-700 placeholder-gray-400 px-4 pt-3 pb-1 outline-none"
              disabled={streaming}
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <span className="text-xs text-gray-300">Entrée pour envoyer</span>
              <button onClick={() => void sendMessage(input)} disabled={!input.trim() || streaming}
                className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl transition-colors">
                {streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* ── Document (70%) ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white border-b border-gray-200">
          {fullPreview && (
            <button onClick={() => setFullPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1 text-sm font-medium text-gray-600 truncate">{artifact.title}</div>

          {/* Zoom */}
          <div className="flex items-center rounded-lg overflow-hidden border border-gray-200">
            {([0.6, 0.75, 1] as const).map(s => (
              <button key={s} onClick={() => setDocScale(s)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${docScale === s ? "bg-violet-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                {Math.round(s * 100)}%
              </button>
            ))}
          </div>

          {/* Plein écran aperçu */}
          <button onClick={() => setFullPreview(!fullPreview)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors" title="Aperçu plein écran">
            {fullPreview ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Export DOCX */}
          <button onClick={() => void exportDocx()} disabled={exportLoading || !content}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-900 text-white rounded-lg disabled:opacity-40 transition-colors">
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            DOCX
          </button>
        </div>

        {/* Aperçu document */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          {content ? (
            <DocumentRenderer content={content} scale={docScale} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center max-w-sm">
                <Sparkles className="w-10 h-10 mx-auto mb-4 text-violet-200" />
                <p className="text-gray-500 font-medium mb-2">Document vierge</p>
                <p className="text-sm text-gray-400">Envoyez un message dans le chat pour créer votre document.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Panneau historique (drawer) ──────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 cursor-pointer" onClick={() => setShowHistory(false)} />
          <div className="w-80 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-4 h-4 text-violet-500" /> Historique
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingVers ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">Aucune version sauvegardée</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {versions.map((v, i) => (
                    <div key={v.id} className={`p-4 ${i === 0 ? "bg-violet-50" : "hover:bg-gray-50"} transition-colors`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? "bg-violet-200 text-violet-700" : "bg-gray-100 text-gray-500"}`}>
                              v{v.version_num}
                            </span>
                            {i === 0 && <span className="text-xs text-violet-500 font-medium">Actuelle</span>}
                          </div>
                          <p className="text-sm text-gray-700 leading-snug">{v.description || "Modification"}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(v.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {i > 0 && (
                          <button
                            onClick={() => void restoreVersion(v.version_num)}
                            disabled={undoing}
                            className="text-xs px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-40 flex-shrink-0 transition-colors">
                            {undoing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Restaurer"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
