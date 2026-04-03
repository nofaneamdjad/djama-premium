"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, Sparkles, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME = "Bonjour 👋 Je suis l'assistant DJAMA.\nJe peux répondre à vos questions sur nos services et vous guider.";

const SUGGESTIONS = [
  "Quels services proposez-vous ?",
  "Comment demander un devis ?",
  "Proposez-vous du coaching IA ?",
  "Comment fonctionne l'espace client ?",
];

export default function AssistantDJAMA() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setShowSuggestions(false);
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].filter((m) => m.role !== "assistant" || m.content !== WELCOME),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.error || "Une erreur est survenue." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez dans un instant." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Widget flottant ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Panneau chat */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-[360px] flex-col overflow-hidden rounded-[1.5rem] border border-white/[0.09] bg-[#09090b] shadow-[0_32px_80px_rgba(0,0,0,0.7)] sm:w-[400px]"
              style={{ height: "520px" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.07] bg-[rgba(201,165,90,0.05)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]">
                    <Bot size={16} className="text-[#09090b]" />
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#09090b] bg-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Assistant DJAMA</p>
                    <p className="text-[0.62rem] text-white/35">Répond instantanément</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.07] hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]">
                        <Sparkles size={10} className="text-[#09090b]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "rounded-tr-sm bg-[#c9a55a] text-[#09090b] font-medium"
                          : "rounded-tl-sm bg-white/[0.06] text-white/80"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]">
                      <Sparkles size={10} className="text-[#09090b]" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full bg-white/40"
                          style={{ animation: `bounce 1.2s ease-in-out ${d * 0.2}s infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions suggérées */}
                {showSuggestions && messages.length === 1 && (
                  <div className="flex flex-col gap-2 pt-1">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/25 px-1">
                      Questions fréquentes
                    </p>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-left text-xs font-medium text-white/55 transition hover:border-[rgba(201,165,90,0.3)] hover:bg-[rgba(201,165,90,0.06)] hover:text-white/85"
                      >
                        {s}
                        <ArrowRight size={11} className="shrink-0 ml-2 text-[#c9a55a]" />
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="border-t border-white/[0.07] bg-[rgba(255,255,255,0.02)] px-4 py-3 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  placeholder="Posez votre question…"
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-[rgba(201,165,90,0.4)] focus:bg-white/[0.07] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a55a] to-[#b08d57] text-[#09090b] transition hover:brightness-110 disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton flottant */}
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f] shadow-[0_8px_32px_rgba(201,165,90,0.45)] transition-shadow hover:shadow-[0_12px_40px_rgba(201,165,90,0.6)]"
          aria-label="Ouvrir l'assistant DJAMA"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="close"
                initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                <X size={22} className="text-[#09090b]" />
              </motion.span>
            ) : (
              <motion.span key="open"
                initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle size={22} className="text-[#09090b]" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Ping d'attention */}
          {!open && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-400 text-[0.45rem] font-black text-green-900">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative h-3 w-3 rounded-full bg-green-400" />
            </span>
          )}
        </motion.button>
      </div>

      {/* Keyframes pour le typing */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
