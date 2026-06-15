"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence }                   from "framer-motion";
import {
  Search, Send, RefreshCw, X, Download, ChevronRight,
  Building2, ListChecks, Lightbulb, FileText,
  CheckCircle2, Factory, Sparkles, Package, AlertCircle,
  Brain, Star, ShieldCheck, TrendingUp,
} from "lucide-react";
import type { GuideMessage, GuideSection, GuideItem } from "@/lib/sourcing/generateGuide";

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
  reasoning?:   string;
  sections?:    SourcingSection[];
  actions?:     SourcingAction[];
  suggestions?: string[];
  error?:       string;
}

interface ChatMsg {
  id:           string;
  role:         "user" | "assistant";
  content:      string;
  reasoning?:   string;
  sections?:    SourcingSection[];
  actions?:     SourcingAction[];
  suggestions?: string[];
  loading?:     boolean;
  isError?:     boolean;
  retryText?:   string;
}

const ease = [0.16, 1, 0.3, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes = parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-bold text-white/90">{p.slice(2, -2)}</strong>;
    }
    return p.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < p.split("\n").length - 1 && <br />}
      </span>
    ));
  });
  return <span className={className}>{nodes}</span>;
}

const QUICKSTART = [
  {
    icon: Factory,
    color: "#60a5fa",
    bg:    "rgba(59,130,246,0.08)",
    border:"rgba(59,130,246,0.18)",
    label: "Trouver des fournisseurs",
    desc:  "Plateformes, critères, pays sources",
    question: "Je veux trouver des fournisseurs fiables pour mon activité. Quelles plateformes utiliser, quels critères vérifier, comment évaluer la fiabilité et comment démarcher efficacement ? Donne-moi un guide complet.",
  },
  {
    icon: FileText,
    color: "#4ade80",
    bg:    "rgba(74,222,128,0.08)",
    border:"rgba(74,222,128,0.18)",
    label: "Répondre à un appel d'offre",
    desc:  "Étapes, stratégie, erreurs à éviter",
    question: "Comment répondre efficacement à un appel d'offre ? Donne-moi les étapes complètes, la stratégie de positionnement, comment rédiger le mémoire technique, et toutes les erreurs classiques à éviter pour maximiser mes chances.",
  },
  {
    icon: Package,
    color: "#c9a55a",
    bg:    "rgba(201,165,90,0.08)",
    border:"rgba(201,165,90,0.18)",
    label: "Négocier avec un fournisseur",
    desc:  "Arguments, tactiques, conditions",
    question: "Comment négocier les meilleures conditions avec un fournisseur ? Donne-moi une stratégie complète : préparation, BATNA, tactiques de négociation, arguments concrets, clauses contractuelles clés et conditions de paiement à obtenir.",
  },
  {
    icon: Building2,
    color: "#a78bfa",
    bg:    "rgba(167,139,250,0.08)",
    border:"rgba(167,139,250,0.18)",
    label: "Marchés publics & privés",
    desc:  "Plateformes, seuils, procédures, stratégie",
    question: "Comment accéder aux marchés publics et privés ? Quelles plateformes utiliser selon le pays, quels seuils s'appliquent, comment préparer un dossier gagnant et quelle stratégie adopter pour remporter des contrats ?",
  },
];

const ACTION_STYLE: Record<string, string> = {
  primary:   "bg-blue-500/12 border-blue-500/25 text-blue-400 hover:bg-blue-500/22",
  warning:   "bg-amber-500/12 border-amber-500/25 text-amber-400 hover:bg-amber-500/22",
  secondary: "bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white/70",
  ghost:     "border-transparent text-white/30 hover:text-white/55",
};

function ReasoningBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-2xl border border-violet-500/18 bg-violet-500/[0.05]"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-violet-500/[0.04]"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
          <Brain size={13} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-medium text-violet-400/80">
            Analyse stratégique
          </p>
        </div>
        <ChevronRight
          size={13}
          className={`text-violet-400/50 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
          >
            <div className="border-t border-violet-500/10 px-4 py-3">
              <RichText
                text={text}
                className="text-[13px] text-violet-200/70 leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SupplierCard({ item }: { item: SourcingItem }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-[13px] font-bold text-white/92">{item.name}</p>
        <div className="flex gap-1.5 flex-wrap">
          {item.country && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
              {item.country}
            </span>
          )}
          {item.type && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/40 font-semibold">
              {item.type}
            </span>
          )}
        </div>
      </div>
      {item.description && (
        <RichText text={item.description} className="text-[12px] text-white/60 leading-relaxed" />
      )}
      {item.tip && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/[0.07] border border-amber-500/15 px-3 py-2.5">
          <Star size={11} className="text-amber-400 shrink-0 mt-0.5" />
          <RichText text={item.tip} className="text-[11px] text-amber-300/80 leading-relaxed" />
        </div>
      )}
    </div>
  );
}

function StepItem({ item, index }: { item: SourcingItem; index: number }) {
  return (
    <div className="flex gap-3.5 pb-4 last:pb-0">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold text-white">
        {index + 1}
      </div>
      <div className="flex-1 border-b border-white/[0.05] last:border-0 pb-4 last:pb-0">
        <p className="text-[13px] font-bold text-white/88 leading-snug mb-1">
          {(item.name ?? "").replace(/^\d+\.\s*/, "")}
        </p>
        {item.description && (
          <RichText text={item.description} className="text-[12px] text-white/55 leading-relaxed" />
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ item }: { item: SourcingItem }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="w-4 h-4 rounded border border-emerald-500/35 bg-emerald-500/[0.08] flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 size={10} className="text-emerald-400" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-white/75 leading-snug">{item.name}</p>
        {item.description && (
          <RichText text={item.description} className="text-[11px] text-white/40 leading-relaxed mt-0.5" />
        )}
      </div>
    </div>
  );
}

function TipItem({ item }: { item: SourcingItem }) {
  return (
    <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={12} className="text-amber-400 shrink-0" />
        <p className="text-[12px] font-bold text-amber-400">{item.name}</p>
      </div>
      {item.description && (
        <RichText text={item.description} className="text-[12px] text-amber-200/55 leading-relaxed" />
      )}
    </div>
  );
}

function SectionBlock({ section }: { section: SourcingSection }) {
  const iconMap: Record<string, React.ElementType> = {
    supplier_list: Factory,
    steps:         ListChecks,
    checklist:     CheckCircle2,
    tips:          ShieldCheck,
    text:          FileText,
  };
  const Icon = iconMap[section.type] ?? FileText;

  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    supplier_list: { text: "text-blue-400",    bg: "bg-blue-500/8",    border: "border-blue-500/15"    },
    steps:         { text: "text-sky-400",     bg: "bg-sky-500/8",     border: "border-sky-500/15"     },
    checklist:     { text: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/15" },
    tips:          { text: "text-amber-400",   bg: "bg-amber-500/8",   border: "border-amber-500/15"   },
    text:          { text: "text-white/40",    bg: "bg-white/[0.03]",  border: "border-white/8"        },
  };
  const col = colorMap[section.type] ?? colorMap.text;

  return (
    <div className="mt-5">
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border ${col.bg} ${col.border}`}>
        <Icon size={13} className={col.text} />
        <p className={`text-[11px] font-semibold ${col.text}`}>
          {section.title}
        </p>
        <span className="ml-auto text-[10px] text-white/20 font-medium">
          {section.items.length} élément{section.items.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className={`space-y-${section.type === "steps" ? "0" : "2"} ${section.type === "steps" ? "pl-1" : ""}`}>
        {section.items.map((item, i) => {
          if (section.type === "supplier_list") return <SupplierCard   key={i} item={item} />;
          if (section.type === "steps")         return <StepItem       key={i} item={item} index={i} />;
          if (section.type === "checklist")     return <ChecklistItem  key={i} item={item} />;
          if (section.type === "tips")          return <TipItem        key={i} item={item} />;
          return (
            <p key={i} className="text-[13px] text-white/60 leading-relaxed">
              {item.name}{item.description ? " — " + item.description : ""}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ action, onPdf }: { action: SourcingAction; onPdf: () => void }) {
  const style = ACTION_STYLE[action.variant] ?? ACTION_STYLE.secondary;
  const cls   = `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all ${style}`;

  if (action.type === "generate_pdf") {
    return (
      <button onClick={onPdf} className={cls}>
        <Download size={13} />
        {action.label}
      </button>
    );
  }
  if (action.href) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={cls}>
        <ChevronRight size={13} />
        {action.label}
      </a>
    );
  }
  return <button className={cls}><ChevronRight size={13} />{action.label}</button>;
}

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
          <p className="text-[13px] text-white/88 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
        msg.isError
          ? "bg-red-500/10 border-red-500/20"
          : "bg-blue-500/12 border-blue-500/20"
      }`}>
        {msg.isError
          ? <AlertCircle size={13} className="text-red-400" />
          : <TrendingUp size={13} className="text-blue-400" />
        }
      </div>

      <div className="flex-1 min-w-0">

                {msg.loading && (
          <div className="rounded-3xl rounded-tl-lg bg-white/[0.03] border border-white/[0.07] px-5 py-5 mb-2.5">
            <div className="flex items-center gap-2 mb-2">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-400/65 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
                />
              ))}
            </div>
            <p className="text-[11px] text-white/25 animate-pulse">Analyse en cours — réponse complète…</p>
          </div>
        )}

                {!msg.loading && msg.isError && (
          <div className="rounded-3xl rounded-tl-lg bg-red-500/[0.06] border border-red-500/20 px-4 py-3.5 mb-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-red-300 mb-1">
                  Service temporairement indisponible
                </p>
                <p className="text-[12px] text-red-300/60 leading-relaxed mb-3">
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

                {!msg.loading && !msg.isError && (
          <>
            <div className="rounded-3xl rounded-tl-lg bg-white/[0.025] border border-white/[0.07] px-5 py-5 mb-3">

                            {msg.content && (
                <div className="mb-1">
                  <RichText
                    text={msg.content}
                    className="text-[13px] text-white/75 leading-relaxed"
                  />
                </div>
              )}

                            {msg.reasoning && msg.reasoning.trim() && (
                <ReasoningBlock text={msg.reasoning} />
              )}

                            {(msg.sections ?? []).map((section, i) => (
                <SectionBlock key={i} section={section} />
              ))}

                            {(msg.sections ?? []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] text-white/20">
                    <Sparkles size={9} />
                    {(msg.sections ?? []).length} sections
                  </span>
                  <span className="text-[10px] text-white/15">·</span>
                  <span className="text-[10px] text-white/20">
                    {(msg.sections ?? []).reduce((acc, s) => acc + s.items.length, 0)} points couverts
                  </span>
                  <span className="text-[10px] text-white/15">·</span>
                  <span className="flex items-center gap-1 text-[10px] text-blue-400/50">
                    <TrendingUp size={9} />
                    Analyse Sonnet IA
                  </span>
                </div>
              )}
            </div>

                        {(msg.actions ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {(msg.actions ?? []).map((a, i) => (
                  <ActionBtn key={i} action={a} onPdf={onPdf} />
                ))}
              </div>
            )}

                        {(msg.suggestions ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(msg.suggestions ?? []).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestion(s)}
                    className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full border border-white/[0.09] text-white/35 hover:text-white/65 hover:border-white/20 transition-all"
                  >
                    <ChevronRight size={10} className="shrink-0" />
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

export default function SourcingPage() {
  const [messages,    setMessages]    = useState<ChatMsg[]>([]);
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [pdfLoading,  setPdfLoading]  = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const msgHistory = useRef<ChatMsg[]>([]);

  useEffect(() => { msgHistory.current = messages; }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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

            let resolved = rawData;
      if (typeof rawData.text === "string") {
        const t = rawData.text.trim();
        if (t.startsWith("{")) {
          try {
            const inner = JSON.parse(t) as SourcingApiResponse;
            if (inner.text !== undefined || (inner.sections && inner.sections.length > 0)) {
              resolved = {
                text:        inner.text        ?? "",
                reasoning:   inner.reasoning   ?? "",
                sections:    inner.sections    ?? [],
                actions:     inner.actions     ?? rawData.actions     ?? [],
                suggestions: inner.suggestions ?? rawData.suggestions ?? [],
              };
            }
          } catch { /* double-parse optionnel — rawData utilisé tel quel */ }
        }
      }

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
              reasoning:   resolved.reasoning   ?? "",
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

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  }

  function newChat() {
    setMessages([]);
    setInput("");
    setSending(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

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

    return (
    <div className="min-h-screen bg-[#0a0f1e] text-white pb-40">

            <div className="border-b border-white/[0.06] bg-[rgba(10,11,16,0.92)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{ backgroundColor: "#818cf814", borderColor: "#818cf828" }}>
                <Search size={18} style={{ color: "#818cf8" }} />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Sourcing IA</h1>
              <p className="text-[0.65rem] text-white/30">Fournisseurs · Marchés · Analyse Sonnet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasAiMsg && (
              <button
                onClick={handleGeneratePdf}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] disabled:opacity-40"
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
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08]"
              >
                <X size={13} />
                Nouveau
              </button>
            )}
          </div>
        </div>
      </div>

            <div className="max-w-2xl mx-auto px-4 pt-5">

                <AnimatePresence>
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
            >
                            <div className="text-center mb-8 pt-4">
                <div className="relative inline-flex mb-4">
                  <div className="relative w-14 h-14 rounded-2xl bg-blue-500/12 border border-blue-500/20 flex items-center justify-center">
                    <Sparkles size={24} className="text-blue-400" />
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-white mb-2">
                  Expert Sourcing & Marchés IA
                </h2>
                <p className="text-[13px] text-white/38 max-w-sm mx-auto leading-relaxed">
                  Analyses complètes, raisonnement stratégique, guides actionnables.
                  Réponses expertes avec <strong className="text-white/55 font-bold">Claude Sonnet</strong>.
                </p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400/60">
                    <CheckCircle2 size={9} /> Réponses longues
                  </span>
                  <span className="text-[10px] text-white/15">·</span>
                  <span className="flex items-center gap-1 text-[10px] text-violet-400/60">
                    <Brain size={9} /> Raisonnement stratégique
                  </span>
                  <span className="text-[10px] text-white/15">·</span>
                  <span className="flex items-center gap-1 text-[10px] text-blue-400/60">
                    <Download size={9} /> Export PDF
                  </span>
                </div>
              </div>

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
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                    >
                      <card.icon size={16} style={{ color: card.color }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white/88 leading-snug">{card.label}</p>
                      <p className="text-[11px] text-white/38 mt-0.5">{card.desc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold mt-auto" style={{ color: card.color }}>
                      Analyse complète <ChevronRight size={10} />
                    </div>
                  </motion.button>
                ))}
              </div>

              <p className="text-center text-[11px] text-white/20 pb-4">
                Ou décris directement ta situation dans le champ ci-dessous
              </p>
            </motion.div>
          )}
        </AnimatePresence>

                {hasMessages && (
          <div className="space-y-6 pb-4">
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

            <div className="fixed bottom-0 inset-x-0 z-30 bg-[rgba(10,11,16,0.96)] backdrop-blur-xl border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 transition-colors focus-within:border-[rgba(129,140,248,0.3)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Décris ta situation, ton secteur, ton pays… Plus tu es précis, plus la réponse sera utile."
              rows={1}
              disabled={sending}
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/25 outline-none resize-none leading-relaxed max-h-32 scrollbar-none disabled:opacity-40"
              style={{ height: "24px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all disabled:cursor-not-allowed disabled:opacity-25"
              style={{ backgroundColor: "#818cf820", borderColor: "#818cf830", color: "#818cf8" }}
            >
              {sending
                ? <RefreshCw size={13} className="animate-spin" />
                : <Send size={13} />
              }
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-white/15">
            Entrée pour envoyer · Maj+Entrée pour saut de ligne · Réponse complète ~10-30s
          </p>
        </div>
      </div>
    </div>
  );
}
