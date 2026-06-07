"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, RotateCcw } from "lucide-react";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;

type Message = { role: "user" | "assistant"; content: string };

/* ── Per-tool context + suggested questions ── */
const TOOL_CONTEXTS: Record<string, { name: string; questions: string[] }> = {
  "/client/factures": {
    name: "Factures & Devis",
    questions: [
      "Comment relancer un client qui n'a pas payé ?",
      "Quelles mentions sont obligatoires sur une facture ?",
      "Comment calculer la TVA sur mes factures ?",
    ],
  },
  "/client/depenses": {
    name: "Dépenses",
    questions: [
      "Quelles dépenses sont déductibles pour un freelance ?",
      "Comment catégoriser mes frais kilométriques ?",
      "La TVA sur les repas d'affaires est-elle déductible ?",
    ],
  },
  "/client/tresorerie": {
    name: "Trésorerie",
    questions: [
      "Comment améliorer mon cash-flow rapidement ?",
      "Quel niveau de trésorerie minimum conserver ?",
      "Comment anticiper une période creuse ?",
    ],
  },
  "/client/crm": {
    name: "CRM Clients",
    questions: [
      "Comment structurer un pipeline commercial efficace ?",
      "Quand relancer un prospect qui ne répond plus ?",
      "Comment augmenter mon taux de conversion ?",
    ],
  },
  "/client/contrats": {
    name: "Contrats",
    questions: [
      "Quelles mentions obligatoires dans un contrat freelance ?",
      "Comment protéger mes droits d'auteur dans un contrat ?",
      "Délai légal pour résilier un contrat de prestation ?",
    ],
  },
  "/client/fournisseurs": {
    name: "Fournisseurs",
    questions: [
      "Comment négocier de meilleurs délais de paiement ?",
      "Quels critères pour évaluer un fournisseur ?",
      "Comment diversifier mes sources d'approvisionnement ?",
    ],
  },
  "/client/stocks": {
    name: "Stocks",
    questions: [
      "Comment calculer mon stock de sécurité minimum ?",
      "Méthode FIFO ou LIFO : laquelle choisir ?",
      "Comment réduire mes ruptures de stock ?",
    ],
  },
  "/client/productivite": {
    name: "Tâches",
    questions: [
      "Comment prioriser mes tâches efficacement ?",
      "Quelle méthode pour éviter la procrastination ?",
      "Comment organiser mes projets clients ?",
    ],
  },
  "/client/planning": {
    name: "Planning",
    questions: [
      "Comment optimiser mon agenda de la semaine ?",
      "Combien de temps bloquer entre deux rendez-vous ?",
      "Comment gérer les no-shows clients ?",
    ],
  },
  "/client/equipe": {
    name: "Équipe",
    questions: [
      "Obligations légales pour un premier salarié ?",
      "Comment gérer les demandes de congés ?",
      "Comment motiver et fidéliser mon équipe ?",
    ],
  },
  "/client/chrono": {
    name: "Chrono",
    questions: [
      "Comment facturer au temps passé correctement ?",
      "Comment déterminer mon taux horaire ?",
      "Comment analyser ma productivité par client ?",
    ],
  },
  "/client/notes": {
    name: "Notes IA",
    questions: [
      "Comment organiser mes notes efficacement ?",
      "Meilleure structure pour un compte-rendu de réunion ?",
      "Comment exploiter l'IA pour mes prises de notes ?",
    ],
  },
  "/client/bloc-note": {
    name: "Bloc-note",
    questions: [
      "Conseils pour une dictée vocale précise ?",
      "Comment organiser mes mémos et idées ?",
      "Comment transformer une note en action concrète ?",
    ],
  },
  "/client/sourcing": {
    name: "Sourcing IA",
    questions: [
      "Comment identifier mes clients idéaux ?",
      "Où trouver des prospects qualifiés ?",
      "Comment approcher un partenaire potentiel ?",
    ],
  },
  "/client/assistant": {
    name: "Assistant IA",
    questions: [
      "Comment rédiger un email de relance percutant ?",
      "Comment automatiser mes suivis clients ?",
      "Comment rédiger une proposition commerciale ?",
    ],
  },
  "/client/reputation": {
    name: "Réputation",
    questions: [
      "Comment répondre à un avis négatif en ligne ?",
      "Comment obtenir plus d'avis clients positifs ?",
      "Quelle stratégie de veille e-réputation ?",
    ],
  },
  "/client/reseaux-sociaux": {
    name: "Réseaux Sociaux IA",
    questions: [
      "Quelle fréquence de publication idéale ?",
      "Quel réseau social pour mon activité ?",
      "Comment créer du contenu rapidement ?",
    ],
  },
  "/client/portail": {
    name: "Portail Client",
    questions: [
      "Comment personnaliser l'espace client ?",
      "Quels documents partager avec mes clients ?",
      "Comment améliorer l'expérience client en ligne ?",
    ],
  },
  "/client/paie": {
    name: "Paie & RH",
    questions: [
      "Obligations légales pour un premier salarié ?",
      "Comment calculer les charges patronales ?",
      "Délai légal pour remettre la fiche de paie ?",
    ],
  },
  "/client/dashboard": {
    name: "Tableau de bord",
    questions: [
      "Comment interpréter mon score santé financière ?",
      "Comment améliorer ma rentabilité ce mois-ci ?",
      "Quels KPI surveiller en priorité ?",
    ],
  },
};

const DEFAULT_CTX = {
  name: "DJAMA",
  questions: [
    "Comment optimiser mon activité au quotidien ?",
    "Quelles fonctionnalités utiliser en priorité ?",
    "Comment développer mon chiffre d'affaires ?",
  ],
};

function getContext(pathname: string) {
  if (TOOL_CONTEXTS[pathname]) return TOOL_CONTEXTS[pathname];
  const key = Object.keys(TOOL_CONTEXTS).find(k => pathname.startsWith(k + "/"));
  return key ? TOOL_CONTEXTS[key] : DEFAULT_CTX;
}

/**
 * FloatingAIAssistant
 * Renders a small icon button meant to be placed inside the topbar.
 * The chat panel opens as a dropdown below the button.
 */
export default function FloatingAIAssistant({ isDark = false }: { isDark?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const panelRef                = useRef<HTMLDivElement>(null);
  const messagesEndRef          = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const ctx = getContext(pathname);

  /* Reset on tool change */
  useEffect(() => { setMessages([]); setInput(""); }, [pathname]);

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Focus input on open */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  /* Close on outside click */
  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: ctx.name, question, history: messages.slice(-6) }),
      });
      if (!res.ok) throw new Error();
      const { answer } = await res.json() as { answer: string };
      setMessages(prev => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessaie dans un instant." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Trigger button (topbar icon) ── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Assistant IA"
        title="Assistant IA DJAMA"
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition ${
          isDark
            ? "text-white/40 hover:bg-white/[0.07] hover:text-white/70"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        } ${open ? (isDark ? "bg-white/[0.08] !text-white/80" : "bg-gray-100 !text-gray-600") : ""}`}
      >
        <Sparkles size={15} style={open ? { color: GOLD } : undefined} />
        {/* gold dot indicator when conversation active */}
        {messages.length > 0 && !open && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
            style={{ background: GOLD, border: "1.5px solid", borderColor: isDark ? "#111318" : "#fff" }}
          />
        )}
      </button>

      {/* ── Dropdown chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.2, ease }}
            className="absolute right-0 top-10 z-50 flex flex-col overflow-hidden rounded-2xl"
            style={{
              width: 340,
              height: 460,
              background: "#0c0f1a",
              border: "1px solid rgba(201,165,90,0.22)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,165,90,0.06)",
            }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(201,165,90,0.06)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{
                    background: "linear-gradient(135deg,rgba(201,165,90,0.28),rgba(201,165,90,0.1))",
                    border: "1px solid rgba(201,165,90,0.3)",
                  }}
                >
                  <Sparkles size={12} style={{ color: GOLD }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/90">Assistant IA</p>
                  <p className="text-[0.58rem] text-white/35 truncate max-w-[160px]">{ctx.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    title="Effacer"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
                  >
                    <RotateCcw size={11} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
              {messages.length === 0 ? (
                <div>
                  <p className="text-[0.58rem] font-black uppercase tracking-widest text-white/20 mb-3">
                    Suggestions — {ctx.name}
                  </p>
                  <div className="space-y-2">
                    {ctx.questions.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="w-full text-left rounded-xl px-3 py-2.5 text-[0.72rem] text-white/55 transition-all hover:text-white/90"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-[0.58rem] text-white/20">ou pose ta propre question</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {msg.role === "assistant" && (
                      <div
                        className="mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-lg"
                        style={{ background: "rgba(201,165,90,0.14)", border: "1px solid rgba(201,165,90,0.22)" }}
                      >
                        <Sparkles size={10} style={{ color: GOLD }} />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[0.75rem] leading-relaxed ${
                        msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                      }`}
                      style={
                        msg.role === "user"
                          ? { background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }
                          : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.82)" }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5">
                  <div
                    className="mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{ background: "rgba(201,165,90,0.14)", border: "1px solid rgba(201,165,90,0.22)" }}
                  >
                    <Sparkles size={10} style={{ color: GOLD }} />
                  </div>
                  <div
                    className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: GOLD }}
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-3 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div
                className="flex items-center gap-2 rounded-xl pl-3.5 pr-2 py-2"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                  }}
                  placeholder="Pose ta question…"
                  disabled={loading}
                  className="flex-1 bg-transparent text-[0.78rem] text-white placeholder-white/20 outline-none disabled:opacity-50"
                  autoComplete="off"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-30 hover:brightness-110 active:scale-95"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)` }}
                >
                  <Send size={12} style={{ color: "#0a0a0a" }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
