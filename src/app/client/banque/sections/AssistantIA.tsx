"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, AlertCircle, Sparkles } from "lucide-react";
import { tok, GOLD } from "../banque-utils";

interface Props {
  userId: string | null;
  isDark: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Quel est mon flux de trésorerie ce mois ?",
  "Quelles sont mes principales dépenses ?",
  "Combien de transactions ne sont pas rapprochées ?",
  "Quelle est l'évolution de mon solde sur 30 jours ?",
];

export default function AssistantIA({ userId, isDark }: Props) {
  const t = tok(isDark);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    const res = await fetch("/api/banque/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    const json = await res.json();

    if (res.ok && json.answer) {
      setMessages(prev => [...prev, { role: "assistant", content: json.answer }]);
    } else if (res.status === 429) {
      setError("Limite atteinte : 20 questions par heure. Réessayez plus tard.");
    } else {
      setError(json.error ?? "Erreur de l'assistant. Réessayez.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col" style={{ height: "clamp(400px, 70dvh, 700px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${GOLD}18` }}>
          <Sparkles size={16} style={{ color: GOLD }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: t.text }}>Assistant bancaire IA</p>
          <p className="text-xs" style={{ color: t.text3 }}>
            Posez vos questions sur vos finances · 20 questions/h
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2">
        {messages.length === 0 && (
          <div className="pt-4">
            <p className="text-sm font-medium mb-4 text-center" style={{ color: t.text2 }}>
              Que voulez-vous savoir sur vos finances ?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-xs px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: t.glass, border: `1px solid ${t.border}`,
                    color: t.text2,
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ background: msg.role === "user" ? `${GOLD}18` : "rgba(99,102,241,0.15)" }}>
              {msg.role === "user"
                ? <User size={12} style={{ color: GOLD }} />
                : <Bot size={12} style={{ color: "#818cf8" }} />}
            </div>
            <div
              className="rounded-2xl px-4 py-3 text-sm max-w-[85%]"
              style={{
                background: msg.role === "user"
                  ? `${GOLD}12`
                  : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${msg.role === "user" ? GOLD + "25" : t.border}`,
                color: t.text,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.15)" }}>
              <Bot size={12} style={{ color: "#818cf8" }} />
            </div>
            <div className="rounded-2xl px-4 py-3"
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${t.border}` }}>
              <div className="flex gap-1.5 items-center h-5">
                {[0, 0.2, 0.4].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "#818cf8", animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs px-4 py-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
        <div className="flex items-end gap-2 rounded-2xl p-2"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <textarea
            className="flex-1 bg-transparent outline-none resize-none text-sm"
            style={{ color: t.text, minHeight: "38px", maxHeight: "120px" }}
            placeholder="Posez votre question financière…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={1}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
            style={{ background: `${GOLD}20`, color: GOLD }}>
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: t.text4 }}>
          L'assistant analyse vos données réelles. Il ne génère pas d'écritures sans confirmation.
        </p>
      </div>
    </div>
  );
}
