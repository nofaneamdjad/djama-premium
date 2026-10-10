"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw, AlertTriangle } from "lucide-react";
import { tok, GOLD } from "../decl-utils";
import type { FiscalProfile } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Quelles sont mes obligations TVA ce mois-ci ?",
  "Comment calculer mon acompte d'IS ?",
  "Quand déposer ma liasse fiscale ?",
  "Quelle est la date limite de la DSN de novembre ?",
  "Comment récupérer la TVA sur un achat professionnel ?",
];

function buildSystemPrompt(profile: FiscalProfile | null): string {
  const base = `Tu es l'assistant fiscal DJAMA. Tu aides les entrepreneurs à comprendre leurs obligations déclaratives.

Règles absolues :
- Ne jamais prétendre qu'une déclaration a été officiellement transmise si elle ne l'a pas été
- Ne pas simuler un dépôt officiel ou générer de formulaire officiel
- Toujours préciser qu'une vérification par un expert-comptable est recommandée pour les décisions importantes
- Ne pas inventer des taux fiscaux ; citer uniquement des taux officiels vérifiables
- Si tu n'as pas les informations suffisantes, dire clairement que tu ne peux pas répondre avec certitude
- Langue : français uniquement`;

  if (!profile) return base;

  return `${base}

Contexte de l'entreprise :
- Forme : ${profile.forme_juridique ?? "non précisée"}
- Pays : ${profile.pays_constitution}
- Régime fiscal : ${profile.regime_fiscal}
- Régime TVA : ${profile.regime_tva}
- Assujetti TVA : ${profile.assujetti_tva ? "oui" : "non"}
- Salariés : ${profile.a_salaries ? "oui" : "non"}
- Secteur : ${profile.secteur ?? "non précisé"}`;
}

export default function AssistantIASection({ userId, isDark, profile }: Props) {
  const t = tok(isDark);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setError(null);
    const userMsg: Message = { role: "user", content: text.trim() };
    const history = messages;
    const newMessages = [...history, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: history.map(m => ({ role: m.role, content: m.content })),
          context: buildSystemPrompt(profile),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Erreur ${res.status}`);
      }
      const data = await res.json() as { text?: string; error?: string };
      const reply = data.text ?? "Pas de réponse.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: "500px" }}>
      {/* Avertissement */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: "#f87171" }} />
        <p className="text-[11px]" style={{ color: "#f87171" }}>
          Cet assistant fournit des informations générales à titre indicatif.
          Il ne remplace pas les conseils d'un expert-comptable ou d'un juriste fiscaliste.
          Ne prenez aucune décision fiscale importante sans validation professionnelle.
        </p>
      </div>

      {/* Zone messages */}
      <div className="flex-1 rounded-2xl overflow-hidden flex flex-col" style={{ background: t.glass, border: `1px solid ${t.border}`, minHeight: "360px" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "400px" }}>
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${GOLD}15` }}>
                <Bot size={22} style={{ color: GOLD }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: t.text }}>Assistant fiscal DJAMA</p>
              <p className="text-xs mb-6" style={{ color: t.text3 }}>
                Posez vos questions sur vos obligations déclaratives
              </p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text2 }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: m.role === "user" ? `${GOLD}20` : t.glassMd }}
              >
                {m.role === "user"
                  ? <User size={13} style={{ color: GOLD }} />
                  : <Bot size={13} style={{ color: GOLD }} />}
              </div>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap"
                style={{
                  background: m.role === "user" ? `${GOLD}15` : t.glassMd,
                  border: `1px solid ${m.role === "user" ? `${GOLD}30` : t.borderSoft}`,
                  color: t.text,
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: t.glassMd }}>
                <Bot size={13} style={{ color: GOLD }} />
              </div>
              <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
                style={{ background: t.glassMd, border: `1px solid ${t.borderSoft}` }}>
                <RefreshCw size={12} className="animate-spin" style={{ color: t.text3 }} />
                <span className="text-xs" style={{ color: t.text3 }}>Réflexion…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Zone de saisie */}
        <div className="p-3" style={{ borderTop: `1px solid ${t.borderSoft}` }}>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text, maxHeight: "120px" }}
              placeholder="Posez votre question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
              style={{ background: GOLD }}
            >
              <Send size={14} style={{ color: "#111" }} />
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setError(null); }}
              className="mt-2 text-[11px] transition-all"
              style={{ color: t.text4 }}
            >
              Nouvelle conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
