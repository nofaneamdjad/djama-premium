"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, X, Sparkles } from "lucide-react";

interface SpeechRecognitionEvent {
  readonly results: { readonly [i: number]: { readonly [j: number]: { readonly transcript: string } } };
}
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  navigateUrl?: string;
  navigateLabel?: string;
};

type ToolActivity = {
  tool: string;
  label: string;
  done: boolean;
  summary?: string;
};

export default function AgentVocal() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour ! Je suis ARIA, votre assistante IA DJAMA. Posez-moi une question sur vos factures, clients ou finances, ou demandez-moi de créer un document.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [toolActivity, setToolActivity] = useState<ToolActivity | null>(null);
  const [statusText, setStatusText] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolActivity]);

  const playTts = useCallback(async (text: string) => {
    if (!ttsEnabled) return;
    try {
      const res = await fetch("/api/agent/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play();
      audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
    } catch {
      // TTS optionnel — silencieux si indisponible
    }
  }, [ttsEnabled]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const win = window as unknown as Record<string, unknown>;
    const SpeechRec = (win.SpeechRecognition ?? win.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionInstance)
      | undefined;

    if (!SpeechRec) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    stopAudio();
    const rec = new SpeechRec();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };

    rec.start();
    recognitionRef.current = rec;
  }, [stopAudio]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      stopAudio();

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setToolActivity(null);
      setStatusText("");

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur serveur");
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        let navigateUrl: string | undefined;
        let navigateLabel: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "status") {
                setStatusText(event.text);
              } else if (event.type === "tool_start") {
                setToolActivity({ tool: event.tool, label: event.label, done: false });
              } else if (event.type === "tool_done") {
                setToolActivity((prev) =>
                  prev ? { ...prev, done: true, summary: event.summary } : null
                );
              } else if (event.type === "navigate") {
                navigateUrl = event.url;
                navigateLabel = event.label;
              } else if (event.type === "text") {
                assistantText += event.content;
              } else if (event.type === "done") {
                setToolActivity(null);
                setStatusText("");
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch {
              // ligne SSE malformée
            }
          }
        }

        if (assistantText) {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              content: assistantText,
              navigateUrl,
              navigateLabel,
            },
          ]);
          await playTts(assistantText);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: `Désolée, une erreur est survenue : ${msg}`,
          },
        ]);
      } finally {
        setIsLoading(false);
        setStatusText("");
        setToolActivity(null);
      }
    },
    [isLoading, messages, playTts, stopAudio]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    stopAudio();
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content:
          "Bonjour ! Je suis ARIA, votre assistante IA DJAMA. Comment puis-je vous aider ?",
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFB900] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">ARIA</p>
            <p className="text-xs text-zinc-500">Assistante IA DJAMA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTtsEnabled((v) => !v); if (ttsEnabled) stopAudio(); }}
            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"
            title={ttsEnabled ? "Désactiver la voix" : "Activer la voix"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"
            title="Nouvelle conversation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-[#FFB900] text-white rounded-br-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.navigateUrl && (
                <button
                  onClick={() => router.push(msg.navigateUrl!)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium bg-white text-[#FFB900] px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  {msg.navigateLabel || "Ouvrir"}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Tool activity */}
        {(isLoading || toolActivity) && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              <span>
                {toolActivity?.done
                  ? toolActivity.summary
                  : toolActivity?.label ?? statusText ?? "ARIA réfléchit…"}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question à ARIA…"
          disabled={isLoading}
          className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-2.5 outline-none placeholder-zinc-400 text-zinc-900 dark:text-white disabled:opacity-50"
        />
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={isLoading}
          className={`p-2.5 rounded-xl transition-colors ${
            isListening
              ? "bg-red-100 text-red-500 hover:bg-red-200"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          } disabled:opacity-40`}
          title={isListening ? "Arrêter" : "Parler"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#FFB900] text-white hover:bg-[#E0A800] disabled:opacity-40 transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
