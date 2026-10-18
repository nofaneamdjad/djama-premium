"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

interface Message {
  role:    "user" | "assistant";
  content: string;
}

interface BotConfig {
  name:            string;
  welcome_message: string;
  widget_config: {
    theme_color:     string;
    text_color:      string;
    background_color: string;
    border_radius:   "sm" | "md" | "lg" | "full";
    bot_display_name: string;
    suggested_questions: string[];
    avatar_url:      string | null;
    show_typing_indicator: boolean;
  };
}

const RADIUS_MAP: Record<string, string> = {
  sm:   "6px",
  md:   "10px",
  lg:   "14px",
  full: "999px",
};

export default function WidgetPage() {
  const { id: publicId }    = useParams<{ id: string }>();
  const [bot,    setBot]    = useState<BotConfig | null>(null);
  const [msgs,   setMsgs]   = useState<Message[]>([]);
  const [input,  setInput]  = useState("");
  const [convId, setConvId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/widget/${publicId}/config`)
      .then(r => r.json())
      .then((d: { bot?: BotConfig; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        setBot(d.bot ?? null);
        if (d.bot?.welcome_message) {
          setMsgs([{ role: "assistant", content: d.bot.welcome_message }]);
        }
      })
      .catch(() => setError("Impossible de charger le chatbot"));
  }, [publicId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setMsgs(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/widget/${publicId}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text, conversationId: convId, history: msgs }),
      });

      if (!res.ok || !res.body) throw new Error("Erreur réseau");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   assistant = "";
      setMsgs(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (json === "[DONE]") break;
          try {
            const data = JSON.parse(json) as {
              text?: string; done?: boolean; conversationId?: string; error?: string;
            };
            if (data.text) {
              assistant += data.text;
              setMsgs(prev => [
                ...prev.slice(0, -1),
                { role: "assistant", content: assistant },
              ]);
            }
            if (data.conversationId) setConvId(data.conversationId);
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      setMsgs(prev => [
        ...prev,
        { role: "assistant", content: "Une erreur est survenue. Réessayez." },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#ef4444", fontFamily: "system-ui" }}>
        {error}
      </div>
    );
  }

  if (!bot) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontFamily: "system-ui" }}>
        Chargement…
      </div>
    );
  }

  const wc     = bot.widget_config;
  const radius = RADIUS_MAP[wc.border_radius] ?? "14px";
  const accent = wc.theme_color ?? "#7c3aed";

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      height:        "100vh",
      fontFamily:    "system-ui, sans-serif",
      background:    wc.background_color ?? "#ffffff",
      fontSize:      "14px",
    }}>
      {/* Header */}
      <div style={{
        padding:    "12px 16px",
        background: accent,
        color:      wc.text_color ?? "#ffffff",
        display:    "flex",
        alignItems: "center",
        gap:        "10px",
        flexShrink: 0,
      }}>
        {wc.avatar_url && (
          <img src={wc.avatar_url} alt="" style={{
            width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover",
          }} />
        )}
        <span style={{ fontWeight: 600 }}>
          {wc.bot_display_name || bot.name}
        </span>
        <span style={{ marginLeft: "auto", opacity: 0.8, fontSize: "12px" }}>
          <span style={{
            display: "inline-block", width: "8px", height: "8px",
            borderRadius: "50%", background: "#4ade80", marginRight: "4px",
          }} />
          En ligne
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display:       "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth:      "80%",
              padding:       "10px 14px",
              borderRadius:  radius,
              background:    m.role === "user" ? accent : "#f3f4f6",
              color:         m.role === "user" ? (wc.text_color ?? "#ffffff") : "#111827",
              lineHeight:    1.5,
              whiteSpace:    "pre-wrap",
              wordBreak:     "break-word",
            }}>
              {m.content || (loading && m.role === "assistant" && (
                <span style={{ opacity: 0.5 }}>…</span>
              ))}
            </div>
          </div>
        ))}
        {loading && wc.show_typing_indicator && msgs[msgs.length - 1]?.role !== "assistant" && (
          <div style={{ display: "flex", gap: "4px", padding: "10px 14px", background: "#f3f4f6", borderRadius: radius, width: "fit-content" }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: "6px", height: "6px", borderRadius: "50%", background: "#9ca3af",
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {wc.suggested_questions?.length > 0 && msgs.length <= 1 && (
        <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {wc.suggested_questions.slice(0, 3).map((q, i) => (
            <button key={i} onClick={() => void send(q)} style={{
              padding:      "6px 12px",
              borderRadius: "999px",
              border:       `1px solid ${accent}`,
              background:   "transparent",
              color:        accent,
              fontSize:     "12px",
              cursor:       "pointer",
            }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding:    "12px 16px",
        borderTop:  "1px solid #e5e7eb",
        display:    "flex",
        gap:        "8px",
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
          placeholder="Votre message…"
          disabled={loading}
          style={{
            flex:         1,
            padding:      "10px 14px",
            borderRadius: "999px",
            border:       "1px solid #d1d5db",
            outline:      "none",
            fontSize:     "14px",
          }}
        />
        <button
          onClick={() => void send(input)}
          disabled={loading || !input.trim()}
          style={{
            width:        "40px",
            height:       "40px",
            borderRadius: "50%",
            background:   accent,
            color:        wc.text_color ?? "#fff",
            border:       "none",
            cursor:       loading || !input.trim() ? "not-allowed" : "pointer",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            opacity:      loading || !input.trim() ? 0.5 : 1,
            flexShrink:   0,
          }}
        >
          ➤
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
