"use client";

/**
 * /client/sourcing — DJAMA PRO · Sourcing IA & Marchés
 *
 * Outil IA pour :
 *   1. Trouver des fournisseurs fiables
 *   2. Comprendre et répondre aux marchés publics/privés
 *   3. Obtenir des guides PDF professionnels
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence }                   from "framer-motion";
import {
  Search, Send, RefreshCw, X, Download, ChevronRight,
  Building2, ListChecks, Lightbulb, FileText,
  CheckCircle2, Factory, Sparkles, Package, AlertCircle,
} from "lucide-react";
import type { GuideMessage, GuideSection, GuideItem } from "@/lib/sourcing/generateGuide";

/* ════════════════════════════════════════════
   TYPES
════════════════════════════════════════════ */
interface SourcingItem extends GuideItem {
  name?:        string;
  country?:     string;
  type?:        string;
  description?: string;
  tip?:         string;
}

interface SourcingSection extends GuideSection {
  type:  "supplier_list" | "steps" | "checklist" | "tips" | "text";
  title: string;
  items: SourcingItem[];
}

interface SourcingAction {
  label:   string;
  icon?:   string;
  type:    "generate_pdf" | "link";
  href?:   string;
  variant: "primary" | "secondary" | "warning" | "ghost";
}

interface SourcingApiResponse {
  text?:        string;
  sections?:    SourcingSection[];
  actions?:     SourcingAction[];
  suggestions?: string[];
  error?:       string;
}

interface ChatMsg {
  id:           string;
  role:         "user" | "assistant";
  content:      string;
  sections?:    SourcingSection[];
  actions?:     SourcingAction[];
  suggestions?: string[];
  loading?:     boolean;
  isError?:     boolean;   // message d'erreur — exclu de l'historique
  retryText?:   string;    // texte user à renvoyer pour retry
}

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

/* ════════════════════════════════════════════
   QUICK-START CARDS
════════════════════════════════════════════ */
const QUICKSTART = [
  {
    icon: Factory,
    color: "#60a5fa",
    bg:    "rgba(59,130,246,0.08)",
    border:"rgba(59,130,246,0.18)",
    label: "Trouver des fournisseurs",
    desc:  "Plateformes, critères, pays sources",
    question: "Je veux trouver des fournisseurs fiables pour mon activité. Quelles plateformes utiliser, quels critères vérifier et comment démarcher efficacement ?",
  },
  {
    icon: FileText,
    color: "#4ade80",
    bg:    "rgba(74,222,128,0.08)",
    border:"rgba(74,222,128,0.18)",
    label: "Répondre à un appel d'offre",
    desc:  "Étapes, stratégie, erreurs à éviter",
    question: "Comment répondre efficacement à un appel d'offre ? Donne-moi les étapes, la stratégie et les erreurs classiques à éviter.",
  },
  {
    icon: Package,
    color: "#c9a55a",
    bg:    "rgba(201,165,90,0.08)",
    border:"rgba(201,165,90,0.18)",
    label: "Négocier avec un fournisseur",
    desc:  "Arguments, tactiques, conditions",
    question: "Comment négocier les meilleures conditions avec un fournisseur ? Donne-moi une stratégie complète avec arguments concrets.",
  },
  {
    icon: Building2,
    color: "#a78bfa",
    bg:    "rgba(167,139,250,0.08)",
    border:"rgba(167,139,250,0.18)",
    label: "Marchés publics France",
    desc:  "BOAMP, seuils, procédures 2024",
    question: "Explique-moi les marchés publics en France en 2024 : comment participer, quels seuils, quelles procédures et comment augmenter mes chances de gagner.",
  },
];

/* ════════════════════════════════════════════
   STYLES ACTIONS
════════════════════════════════════════════ */
const ACTION_STYLE: Record<string, string> = {
  primary:   "bg-blue-500/12 border-blue-500/25 text-blue-400 hover:bg-blue-500/22",
  warning:   "bg-amber-500/12 border-amber-500/25 text-amber-400 hover:bg-amber-500/22",
  secondary: "bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white/70",
  ghost:     "border-transparent text-white/30 hover:text-white/55",
};

/* ════════════════════════════════════════════
   SECTION RENDERERS
════════════════════════════════════════════ */
function SupplierCard({ item }: { item: SourcingItem }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold text-white/90">{item.name}</p>
        <div className="flex gap-1.5 flex-wrap">
          {item.country && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/18 text-blue-400 font-semibold">
              {item.country}
            </span>
          )}
          {item.type && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-white/40 font-semibold">
              {item.type}
            </span>
          )}
        </div>
      </div>
      {item.description && (
        <p className="text-xs text-white/55 leading-relaxed">{item.description}</p>
      )}
      {item.tip && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.07] border border-amber-500/15">
          <Lightbulb size={11} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-300/75 leading-relaxed">{item.tip}</p>
        </div>
      )}
    </div>
  );
}

function StepItem({ item, index }: { item: SourcingItem; index: number }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black text-white">
        {index + 1}
      </div>
      <div className="flex-1 pb-3 border-b border-white/[0.04] last:border-0">
        <p className="text-sm font-semibold text-white/85 leading-snug">
          {(item.name ?? "").replace(/^\d+\.\s*/, "")}
        </p>
        {item.description && (
          <p className="text-xs text-white/45 leading-relaxed mt-1">{item.description}</p>
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ item }: { item: SourcingItem }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="w-4 h-4 rounded border border-blue-500/35 bg-blue-500/[0.07] flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 size={10} className="text-blue-400" />
      </div>
      <p className="text-sm text-white/65 leading-relaxed">{item.name}</p>
    </div>
  );
}

function TipItem({ item }: { item: SourcingItem }) {
  return (
    <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3 space-y-1">
      <p className="text-xs font-bold text-amber-400">{item.name}</p>
      {item.description && (
        <p className="text-xs text-amber-300/60 leading-relaxed">{item.description}</p>
      )}
    </div>
  );
}

function SectionBlock({ section }: { section: SourcingSection }) {
  const iconMap: Record<string, React.ElementType> = {
    supplier_list: Factory,
    steps:         ListChecks,
    checklist:     CheckCircle2,
    tips:          Lightbulb,
    text:          FileText,
  };
  const Icon = iconMap[section.type] ?? FileText;

  const colorMap: Record<string, string> = {
    supplier_list: "text-blue-400",
    steps:         "text-sky-400",
    checklist:     "text-emerald-400",
    tips:          "text-amber-400",
    text:          "text-white/40",
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={12} className={colorMap[section.type]} />
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/28">
          {section.title}
        </p>
      </div>

      <div className={section.type === "supplier_list" ? "space-y-2" : section.type === "steps" ? "space-y-0 pl-1" : section.type === "checklist" ? "space-y-0 pl-1" : "space-y-2"}>
        {section.items.map((item, i) => {
          if (section.type === "supplier_list") return <SupplierCard key={i} item={item} />;
          if (section.type === "steps")         return <StepItem     key={i} item={item} index={i} />;
          if (section.type === "checklist")     return <ChecklistItem key={i} item={item} />;
          if (section.type === "tips")          return <TipItem       key={i} item={item} />;
          return (
            <p key={i} className="text-sm text-white/55 leading-relaxed">
              {item.name}{item.description ? " " + item.description : ""}
            </p>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ACTION BUTTON
════════════════════════════════════════════ */
function ActionBtn({
  action,
  onPdf,
}: {
  action: SourcingAction;
  onPdf:  () => void;
}) {
  const style = ACTION_STYLE[action.variant] ?? ACTION_STYLE.secondary;
  const cls   = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${style}`;

  if (action.type === "generate_pdf") {
    return (
      <button onClick={onPdf} className={cls}>
        <Download size={12} />
        {action.label}
      </button>
    );
  }
  if (action.href) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={cls}>
        <ChevronRight size={12} />
        {action.label}
      </a>
    );
  }
  return <button className={cls}><ChevronRight size={12} />{action.label}</button>;
}

/* ════════════════════════════════════════════
   BULLE DE MESSAGE
════════════════════════════════════════════ */
function MessageBubble({
  msg,
  onSuggestion,
  onPdf,
  onRetry,
}: {
  msg:          ChatMsg;
  onSuggestion: (text: string) => void;
  onPdf:        () => void;
  onRetry:      (text: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease }}
        className="flex justify-end"
      >
        <div className="max-w-[82%] rounded-3xl rounded-br-lg bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.22)] px-4 py-3">
          <p className="text-sm text-white/88 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease }}
      className="flex gap-3"
    >
      {/* Avatar IA */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
        msg.isError
          ? "bg-red-500/10 border-red-500/20"
          : "bg-blue-500/14 border-blue-500/22"
      }`}>
        {msg.isError
          ? <AlertCircle size={13} className="text-red-400" />
          : <Search size={13} className="text-blue-400" />
        }
      </div>

      <div className="flex-1 min-w-0">
        {/* ── Bulle chargement ── */}
        {msg.loading && (
          <div className="rounded-3xl rounded-tl-lg bg-white/[0.03] border border-white/[0.07] px-4 py-4 mb-2.5">
            <div className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400/50"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ delay: i * 0.18, repeat: Infinity, duration: 1.1 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Bulle erreur ── */}
        {!msg.loading && msg.isError && (
          <div className="rounded-3xl rounded-tl-lg bg-red-500/[0.06] border border-red-500/20 px-4 py-3.5 mb-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-300 mb-1">
                  Service temporairement indisponible
                </p>
                <p className="text-xs text-red-300/60 leading-relaxed mb-3">
                  {msg.content}
                </p>
                {msg.retryText && (
                  <button
                    onClick={() => onRetry(msg.retryText!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/12 border border-red-500/22 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all"
                  >
                    <RefreshCw size={11} />
                    Réessayer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Bulle réponse normale ── */}
        {!msg.loading && !msg.isError && (
          <>
            <div className="rounded-3xl rounded-tl-lg bg-white/[0.03] border border-white/[0.07] px-4 py-4 mb-2.5">
              {msg.content && (
                <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              )}
              {(msg.sections ?? []).map((section, i) => (
                <SectionBlock key={i} section={section} />
              ))}
            </div>

            {/* Actions */}
            {(msg.actions ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {(msg.actions ?? []).map((a, i) => (
                  <ActionBtn key={i} action={a} onPdf={onPdf} />
                ))}
              </div>
            )}

            {/* Suggestions */}
            {(msg.suggestions ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(msg.suggestions ?? []).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestion(s)}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-white/[0.08] text-white/35 hover:text-white/65 hover:border-white/18 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════ */
export default function SourcingPage() {
  const [messages,    setMessages]    = useState<ChatMsg[]>([]);
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [pdfLoading,  setPdfLoading]  = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const msgHistory = useRef<ChatMsg[]>([]);

  /* Sync ref */
  useEffect(() => { msgHistory.current = messages; }, [messages]);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Envoi API ── */
  const sendToAPI = useCallback(async (
    text:    string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    aiId:    string,
  ) => {
    try {
      const res = await fetch("/api/sourcing/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null) as SourcingApiResponse | null;
        throw new Error(errData?.error ?? `Erreur serveur (${res.status})`);
      }

      const rawData = await res.json() as SourcingApiResponse;

      /* ── Safety: si text est du JSON brut (fallback route déclenché), le re-parser ── */
      let resolved = rawData;
      if (typeof rawData.text === "string") {
        const t = rawData.text.trim();
        if (t.startsWith("{")) {
          try {
            const inner = JSON.parse(t) as SourcingApiResponse;
            if (inner.text !== undefined || (inner.sections && inner.sections.length > 0)) {
              resolved = {
                text:        inner.text        ?? "",
                sections:    inner.sections    ?? [],
                actions:     inner.actions     ?? rawData.actions     ?? [],
                suggestions: inner.suggestions ?? rawData.suggestions ?? [],
              };
            }
          } catch { /* pas du JSON valide — afficher comme texte normal */ }
        }
      }

      /* ── Normaliser les types de section (minuscules, fallback "text") ── */
      const VALID = ["supplier_list", "steps", "checklist", "tips", "text"] as const;
      type ValidType = typeof VALID[number];
      const normSections: SourcingSection[] = (resolved.sections ?? []).map(s => ({
        ...s,
        type: (VALID.includes((s.type ?? "").toLowerCase() as ValidType)
          ? (s.type ?? "").toLowerCase()
          : "text") as ValidType,
      }));

      setMessages(prev => prev.map(m =>
        m.id === aiId
          ? {
              ...m,
              content:     resolved.text        ?? "",
              sections:    normSections,
              actions:     resolved.actions     ?? [],
              suggestions: resolved.suggestions ?? [],
              loading:     false,
            }
          : m,
      ));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Erreur inconnue. Réessaie dans un instant.";
      setMessages(prev => prev.map(m =>
        m.id === aiId
          ? { ...m, content: errMsg, isError: true, retryText: text, loading: false }
          : m,
      ));
    } finally {
      setSending(false);
    }
  }, []);

  /* ── Envoyer message ── */
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    const userId = uid();
    const aiId   = uid();

    const history = msgHistory.current
      .filter(m => !m.loading && !m.isError && m.content.trim().length > 0)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [
      ...prev,
      { id: userId, role: "user",      content: msg },
      { id: aiId,   role: "assistant", content: "", loading: true },
    ]);
    setInput("");
    setSending(true);

    if (inputRef.current) inputRef.current.style.height = "auto";

    await sendToAPI(msg, history, aiId);
  }, [input, sending, sendToAPI]);

  /* ── Keyboard ── */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  }

  /* ── Nouveau chat ── */
  function newChat() {
    setMessages([]);
    setInput("");
    setSending(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  /* ── Générer PDF ── */
  const handleGeneratePdf = useCallback(async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const { generateGuide } = await import("@/lib/sourcing/generateGuide");
      const guideMessages: GuideMessage[] = msgHistory.current
        .filter(m => !m.loading)
        .map(m => ({
          role:     m.role,
          content:  m.content,
          sections: m.sections,
        }));
      const firstQ = guideMessages.find(m => m.role === "user")?.content ?? "Guide Sourcing & Marchés";
      await generateGuide(guideMessages, firstQ);
    } finally {
      setPdfLoading(false);
    }
  }, [pdfLoading]);

  const hasMessages = messages.length > 0;
  const hasAiMsg    = messages.some(m => m.role === "assistant" && !m.loading);

  /* ════════════════════════════════════════
     RENDU
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#09090f] text-white pb-40">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-[#09090f]/96 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/14 border border-blue-500/20 flex items-center justify-center">
              <Search className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">Sourcing IA</h1>
              <p className="text-[10px] text-white/28 leading-none mt-0.5">Fournisseurs · Marchés · Guides</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasAiMsg && (
              <button
                onClick={handleGeneratePdf}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/12 border border-blue-500/22 text-blue-400 text-[11px] font-bold hover:bg-blue-500/22 transition-all disabled:opacity-40"
              >
                {pdfLoading
                  ? <RefreshCw size={12} className="animate-spin" />
                  : <Download size={12} />
                }
                {pdfLoading ? "Génération…" : "Guide PDF"}
              </button>
            )}
            {hasMessages && (
              <button
                onClick={newChat}
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/55 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
              >
                <X size={13} />
                Nouveau
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5">

        {/* ══ ÉTAT INITIAL : QUICK START ══ */}
        <AnimatePresence>
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
            >
              {/* Welcome */}
              <div className="text-center mb-8 pt-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/12 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={24} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Expert Sourcing & Marchés IA
                </h2>
                <p className="text-sm text-white/38 max-w-sm mx-auto leading-relaxed">
                  Trouvez des fournisseurs fiables, répondez aux appels d'offre et obtenez des guides PDF professionnels.
                </p>
              </div>

              {/* Cards quick-start */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {QUICKSTART.map((card, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.25, ease }}
                    onClick={() => handleSend(card.question)}
                    className="flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
                    style={{ background: card.bg, borderColor: card.border }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                    >
                      <card.icon size={15} style={{ color: card.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/88 leading-snug">{card.label}</p>
                      <p className="text-[11px] text-white/38 mt-0.5">{card.desc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold mt-auto" style={{ color: card.color }}>
                      Demander <ChevronRight size={10} />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Hint */}
              <p className="text-center text-[11px] text-white/20 pb-4">
                Ou décris directement ce que tu cherches dans le champ ci-dessous
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ CONVERSATION ══ */}
        {hasMessages && (
          <div className="space-y-5 pb-4">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onSuggestion={text => handleSend(text)}
                  onPdf={handleGeneratePdf}
                  onRetry={text => handleSend(text)}
                />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
        {!hasMessages && <div ref={bottomRef} />}

      </div>

      {/* ══ INPUT STICKY ══ */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[#09090f]/96 backdrop-blur-xl border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2.5 bg-white/[0.04] border border-white/[0.09] rounded-2xl px-4 py-2.5 focus-within:border-white/18 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Décris ce que tu cherches ou pose une question…"
              rows={1}
              disabled={sending}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/22 outline-none resize-none leading-relaxed max-h-32 scrollbar-none disabled:opacity-40"
              style={{ height: "24px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/25 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-25 disabled:cursor-not-allowed shrink-0 mb-0.5"
            >
              {sending
                ? <RefreshCw size={13} className="animate-spin" />
                : <Send size={13} />
              }
            </button>
          </div>
          <p className="text-center text-[10px] text-white/13 mt-1.5">
            Entrée pour envoyer · Maj+Entrée pour saut de ligne
          </p>
        </div>
      </div>
    </div>
  );
}
