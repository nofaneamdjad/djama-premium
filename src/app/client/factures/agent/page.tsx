"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Phone, Video, ChevronLeft, ChevronRight,
  Send, Mic, MicOff, PhoneOff, Users,
  FileText, Search, Edit3, Repeat, Camera, CameraOff,
  Volume2, VolumeX, Paperclip, Plus, Receipt, Clock,
  Eye, Download, Archive, CheckCircle, Sparkles, Settings2,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { GalleryView, ALL_ASSISTANTS, type AssistantData, type PersonalizationPrefs, Portrait } from "./gallery";

/* ─── types ─────────────────────────────────────────────────── */

type View = "home" | "chat" | "audio" | "video" | "gallery";

interface Message {
  id:   string;
  role: "agent" | "user";
  body: string;
  ts:   Date;
  kind?: "normal" | "info" | "document";
  doc?: DocCard;
}

interface DocCard {
  type:   "facture" | "devis";
  label:  string;
  client: string;
  amount: string;
}

interface Conversation {
  id:    string;
  title: string;
  ts:    Date;
  msgs:  Message[];
}

/* ─── constants ─────────────────────────────────────────────── */

const GOLD = "#FFB900";
const NOIR = "#0a0a12";

const WELCOME_BODY =
  "Bonjour. Je suis prête à vous aider.\n\nJe peux créer des factures et des devis, rechercher vos clients, appliquer des remises et des taxes, préparer des documents PDF et bien plus encore.\n\nComment puis-je vous aider ?";

function mkWelcome(): Message {
  return { id: "welcome", role: "agent", body: WELCOME_BODY, ts: new Date() };
}

function mkConv(): Conversation {
  return { id: Date.now().toString(), title: "Nouvelle conversation", ts: new Date(), msgs: [mkWelcome()] };
}

/* ─── CSS animations ─────────────────────────────────────────── */

const CSS_ANIM = `
  @keyframes wave-bar {
    0%,100% { transform: scaleY(.25); }
    50%      { transform: scaleY(1); }
  }
  .dj-wave .dj-bar { animation: wave-bar 0.75s ease-in-out infinite; transform-origin: bottom; }
  .dj-wave .dj-bar:nth-child(1){ animation-delay:.00s; }
  .dj-wave .dj-bar:nth-child(2){ animation-delay:.08s; }
  .dj-wave .dj-bar:nth-child(3){ animation-delay:.16s; }
  .dj-wave .dj-bar:nth-child(4){ animation-delay:.24s; }
  .dj-wave .dj-bar:nth-child(5){ animation-delay:.32s; }
  .dj-wave .dj-bar:nth-child(6){ animation-delay:.24s; }
  .dj-wave .dj-bar:nth-child(7){ animation-delay:.16s; }
  .dj-wave .dj-bar:nth-child(8){ animation-delay:.08s; }
  .dj-wave.paused .dj-bar { animation-play-state: paused; }

  @keyframes dj-ping {
    0%   { transform: scale(1);    opacity: .55; }
    70%  { transform: scale(1.45); opacity: 0; }
    100% { transform: scale(1.45); opacity: 0; }
  }
  .dj-ping { animation: dj-ping 1.9s ease-out infinite; }

  @keyframes dj-think {
    0%,80%,100% { opacity: .2; transform: scale(.85); }
    40%          { opacity: 1;  transform: scale(1); }
  }
  .dj-dot { animation: dj-think 1.3s ease-in-out infinite; }
  .dj-dot:nth-child(2){ animation-delay:.18s; }
  .dj-dot:nth-child(3){ animation-delay:.36s; }

  @keyframes dj-slide-up {
    from { opacity:0; transform:translateY(7px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .dj-slide-up { animation: dj-slide-up .2s ease-out forwards; }

  @keyframes dj-ambient {
    0%,100% { opacity: .06; transform: scale(1); }
    50%      { opacity: .12; transform: scale(1.06); }
  }
  .dj-ambient { animation: dj-ambient 4s ease-in-out infinite; }

  @keyframes dj-fadein {
    from { opacity:0; }
    to   { opacity:1; }
  }
  .dj-fadein { animation: dj-fadein .3s ease-out forwards; }
`;

/* ─── Waveform ───────────────────────────────────────────────── */

function Waveform({ active, color = GOLD, bars = 8, size = 32 }: {
  active: boolean; color?: string; bars?: number; size?: number;
}) {
  return (
    <div className={`dj-wave${active ? "" : " paused"}`}
      style={{ display: "flex", alignItems: "flex-end", gap: 3, height: size }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="dj-bar" style={{
          width: 3, height: size, borderRadius: 2,
          background: color, opacity: active ? 1 : 0.18,
          transform: "scaleY(.25)",
        }} />
      ))}
    </div>
  );
}

/* ─── ThinkingDots ───────────────────────────────────────────── */

function ThinkingDots({ color = GOLD }: { color?: string }) {
  return (
    <div style={{ display: "flex", gap: 5, padding: "10px 14px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="dj-dot" style={{
          width: 7, height: 7, borderRadius: "50%", background: color,
        }} />
      ))}
    </div>
  );
}

/* ─── DocumentCard ───────────────────────────────────────────── */

function DocumentCardUI({ doc, isDark }: { doc: DocCard; isDark: boolean }) {
  const bg  = isDark ? "rgba(255,255,255,.04)" : "#fff";
  const bd  = isDark ? "rgba(255,185,0,.3)"    : "rgba(255,185,0,.4)";
  const fg  = isDark ? "#fff"                   : NOIR;
  const fg2 = isDark ? "rgba(255,255,255,.5)"  : "#6b7280";

  return (
    <div className="dj-slide-up" style={{
      border: `1px solid ${bd}`, borderRadius: 14,
      background: bg, overflow: "hidden", maxWidth: 320, width: "100%",
    }}>
      <div style={{
        padding: "10px 14px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,.06)" : "#f3f4f6"}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: "rgba(255,185,0,.12)", border: `1px solid rgba(255,185,0,.25)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileText size={13} style={{ color: GOLD }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: fg }}>{doc.label}</div>
          <div style={{ fontSize: 11, color: fg2 }}>{doc.client}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: GOLD }}>
          {doc.amount}
        </div>
      </div>
      <div style={{ display: "flex", borderTop: "none" }}>
        {[
          { label: "Consulter", Icon: Eye },
          { label: "Modifier",  Icon: Edit3 },
          { label: "PDF",       Icon: Download },
          { label: "Brouillon", Icon: Archive },
          { label: "Valider",   Icon: CheckCircle },
        ].map(({ label, Icon }, i) => (
          <button key={label} style={{
            flex: 1, padding: "9px 4px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none",
            borderRight: i < 4 ? `1px solid ${isDark ? "rgba(255,255,255,.06)" : "#f3f4f6"}` : "none",
            cursor: "pointer", color: fg2, fontSize: 9.5, fontWeight: 500,
          }}>
            <Icon size={13} style={{ color: i === 4 ? GOLD : undefined }} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Message bubble ─────────────────────────────────────────── */

function MsgBubble({ msg, isDark, assistantName }: {
  msg: Message; isDark: boolean; assistantName: string;
}) {
  const isUser = msg.role === "user";
  const fg2    = isDark ? "rgba(255,255,255,.35)" : "#9ca3af";

  if (msg.doc) return (
    <div className="dj-slide-up" style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <div style={{ fontSize: 11, color: fg2, paddingLeft: 2 }}>{assistantName}</div>
      <div style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,.8)" : "#374151", marginBottom: 6 }}>{msg.body}</div>
      <DocumentCardUI doc={msg.doc} isDark={isDark} />
    </div>
  );

  return (
    <div className="dj-slide-up" style={{
      display: "flex", flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
    }}>
      {!isUser && (
        <div style={{ fontSize: 11, color: fg2, marginBottom: 4, paddingLeft: 2 }}>{assistantName}</div>
      )}
      <div style={{
        maxWidth: "78%",
        padding: "10px 14px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
        background: isUser
          ? GOLD
          : isDark ? "rgba(255,255,255,.06)" : "#f3f4f6",
        color: isUser
          ? NOIR
          : isDark ? "rgba(255,255,255,.88)" : "#111827",
        fontSize: 13.5,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
      }}>
        {msg.kind === "info" ? (
          <span style={{ opacity: .75, fontSize: 12.5 }}>{msg.body}</span>
        ) : msg.body}
      </div>
    </div>
  );
}

/* ─── Agent topbar ───────────────────────────────────────────── */

function AgentTopBar({ view, assistant, isDark, onBack, onGallery, onHistory, onSettings }: {
  view: View; assistant: AssistantData; isDark: boolean;
  onBack: () => void; onGallery: () => void; onHistory: () => void; onSettings: () => void;
}) {
  const isCall = view === "audio" || view === "video";
  const bg  = isCall ? NOIR : (isDark ? "rgba(10,10,18,.98)" : "#ffffff");
  const bd  = isCall ? "rgba(255,255,255,.08)" : (isDark ? "rgba(255,255,255,.07)" : "#e5e7eb");
  const fg  = isCall ? "#fff" : (isDark ? "#fff" : NOIR);
  const fg2 = isCall ? "rgba(255,255,255,.45)" : (isDark ? "rgba(255,255,255,.4)" : "#9ca3af");

  return (
    <div style={{
      flexShrink: 0, height: 52,
      display: "flex", alignItems: "center",
      padding: "0 14px", gap: 8,
      background: bg, borderBottom: `1px solid ${bd}`,
    }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 4,
        background: "none", border: "none", cursor: "pointer",
        color: fg2, fontSize: 13, fontWeight: 500, padding: "5px 6px",
        flexShrink: 0, borderRadius: 7,
      }}>
        <ChevronLeft size={15} />
        {view === "home" ? "Retour" : "Accueil"}
      </button>

      {/* Center: logo */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: "rgba(255,185,0,.12)", border: "1px solid rgba(255,185,0,.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={12} style={{ color: GOLD }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: fg, letterSpacing: "-.01em" }}>DJAMA IA</span>
      </div>

      {/* Right: controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <button onClick={onHistory} style={{
          width: 32, height: 32, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer", color: fg2,
        }} title="Historique">
          <Clock size={15} />
        </button>

        <button onClick={onGallery} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px 5px 7px",
          background: isCall ? "rgba(255,255,255,.07)" : (isDark ? "rgba(255,255,255,.06)" : "#f9fafb"),
          border: `1px solid ${bd}`, borderRadius: 20, cursor: "pointer",
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "rgba(255,185,0,.12)", border: "1px solid rgba(255,185,0,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9.5, fontWeight: 700, color: GOLD, flexShrink: 0,
          }}>
            {assistant.name[0]}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: fg }}>{assistant.name}</span>
          <ChevronRight size={11} style={{ color: fg2 }} />
        </button>

        <button onClick={onSettings} style={{
          width: 32, height: 32, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer", color: fg2,
        }} title="Paramètres">
          <Settings2 size={15} />
        </button>
      </div>
    </div>
  );
}

/* ─── Home view ─────────────────────────────────────────────── */

function HomeView({ assistant, isDark, onMode, onGallery, onQuickAction }: {
  assistant: AssistantData; isDark: boolean;
  onMode: (v: View) => void;
  onGallery: () => void;
  onQuickAction: (prompt: string) => void;
}) {
  const bg   = isDark ? NOIR       : "#fafafa";
  const fg   = isDark ? "#fff"      : NOIR;
  const fg2  = isDark ? "rgba(255,255,255,.5)"  : "#6b7280";
  const card = isDark ? "rgba(255,255,255,.04)" : "#fff";
  const bd   = isDark ? "rgba(255,255,255,.08)" : "#e5e7eb";

  const QUICK = [
    { label: "Créer une facture",     prompt: "Créer une nouvelle facture",    Icon: Receipt  },
    { label: "Créer un devis",        prompt: "Créer un nouveau devis",         Icon: FileText },
    { label: "Retrouver un document", prompt: "Retrouver un document existant", Icon: Search   },
    { label: "Modifier un brouillon", prompt: "Modifier un brouillon existant", Icon: Edit3    },
    { label: "Convertir un devis",    prompt: "Convertir un devis en facture",  Icon: Repeat   },
  ];

  return (
    <div style={{
      flex: 1, overflowY: "auto", background: bg,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 20px 40px",
    }}>
      <div style={{ width: "100%", maxWidth: 600 }}>

        {/* Portrait + Identity */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div className="dj-ping" style={{
              position: "absolute", inset: -6, borderRadius: 20,
              border: `1.5px solid ${GOLD}`,
            }} />
            <div style={{
              width: 160, borderRadius: 16, overflow: "hidden",
              border: `2px solid rgba(255,185,0,.35)`,
              boxShadow: "0 8px 32px rgba(255,185,0,.12)",
            }}>
              <Portrait type={assistant.portrait} size={160} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: fg }}>{assistant.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: GOLD,
              background: "rgba(255,185,0,.12)", border: "1px solid rgba(255,185,0,.25)",
              borderRadius: 20, padding: "2px 10px",
            }}>{assistant.country}</span>
          </div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, color: fg,
            lineHeight: 1.3, letterSpacing: "-.025em",
            textAlign: "center", margin: 0,
          }}>
            Comment puis-je vous aider ?
          </h1>
        </div>

        {/* 3 mode cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10, marginBottom: 28,
        }}>
          {([
            { view: "chat"  as View, label: "Chat écrit",  sub: "Écrivez librement",     Icon: MessageSquare },
            { view: "audio" as View, label: "Appel audio", sub: "Conversation vocale",    Icon: Phone         },
            { view: "video" as View, label: "Appel vidéo", sub: `Avec ${assistant.name}`, Icon: Video         },
          ] as const).map(({ view, label, sub, Icon }) => (
            <button key={view} onClick={() => onMode(view)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              padding: "20px 12px",
              background: card, border: `1px solid ${bd}`,
              borderRadius: 14, cursor: "pointer",
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = GOLD;
                el.style.background = isDark ? "rgba(255,185,0,.06)" : "#fffdf0";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = bd;
                el.style.background = card;
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: "rgba(255,185,0,.10)", border: "1px solid rgba(255,185,0,.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={20} style={{ color: GOLD }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: fg, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: fg2 }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: ".08em",
            textTransform: "uppercase", color: fg2, marginBottom: 10, textAlign: "center",
          }}>
            Actions rapides
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {QUICK.map(({ label, prompt, Icon }) => (
              <button key={label} onClick={() => onQuickAction(prompt)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 12,
                background: card, border: `1px solid ${bd}`,
                cursor: "pointer", color: fg, fontSize: 13.5, textAlign: "left",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = bd; }}
              >
                <Icon size={15} style={{ color: GOLD, flexShrink: 0 }} />
                {label}
                <ChevronRight size={12} style={{ color: fg2, marginLeft: "auto" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Chat view ─────────────────────────────────────────────── */

function ChatView({ assistant, isDark, initialPrompt, onBack, onSwitchMode }: {
  assistant: AssistantData; isDark: boolean;
  initialPrompt?: string;
  onBack: () => void;
  onSwitchMode: (v: View) => void;
}) {
  const bg    = isDark ? NOIR       : "#fafafa";
  const fg    = isDark ? "#fff"      : NOIR;
  const fg2   = isDark ? "rgba(255,255,255,.45)" : "#6b7280";
  const fg3   = isDark ? "rgba(255,255,255,.25)" : "#9ca3af";
  const sbBg  = isDark ? "rgba(255,255,255,.025)" : "#fff";
  const sbBd  = isDark ? "rgba(255,255,255,.07)"  : "#e5e7eb";
  const inBg  = isDark ? "rgba(255,255,255,.05)"  : "#fff";
  const inBd  = isDark ? "rgba(255,255,255,.10)"  : "#e5e7eb";

  const [convs, setConvs]     = useState<Conversation[]>(() => [mkConv()]);
  const [activeId, setActiveId] = useState<string>(() => convs[0].id);
  const [input, setInput]     = useState(initialPrompt ?? "");
  const [thinking, setThinking] = useState(false);
  const msgsEndRef = useRef<HTMLDivElement>(null);

  const active = convs.find(c => c.id === activeId)!;

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.msgs]);

  useEffect(() => {
    if (initialPrompt) {
      setInput("");
      handleSend(initialPrompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSend(text?: string) {
    const body = (text ?? input).trim();
    if (!body) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", body, ts: new Date() };
    setConvs(prev => prev.map(c => c.id === activeId
      ? { ...c, title: c.msgs.length === 1 ? body.slice(0, 40) : c.title, msgs: [...c.msgs, userMsg] }
      : c
    ));
    setThinking(true);

    setTimeout(() => {
      setThinking(false);
      const infoMsg: Message = {
        id: (Date.now() + 1).toString(), role: "agent", ts: new Date(), kind: "info",
        body: "Le moteur agent sera connecté lors du sous-chantier C. L'interface conversationnelle est prête.",
      };
      setConvs(prev => prev.map(c => c.id === activeId
        ? { ...c, msgs: [...c.msgs, infoMsg] }
        : c
      ));
    }, 900);
  }

  function newConversation() {
    const c = mkConv();
    setConvs(prev => [c, ...prev]);
    setActiveId(c.id);
  }

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* History sidebar */}
      <div style={{
        width: 220, flexShrink: 0, display: "flex", flexDirection: "column",
        background: sbBg, borderRight: `1px solid ${sbBd}`,
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: "12px 12px 10px",
          borderBottom: `1px solid ${sbBd}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 7,
            background: "none", border: `1px solid ${sbBd}`,
            cursor: "pointer", color: fg2, flexShrink: 0,
          }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, fontWeight: 600, color: fg, flex: 1 }}>Conversations</span>
          <button onClick={newConversation} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 7,
            background: "rgba(255,185,0,.10)", border: `1px solid rgba(255,185,0,.25)`,
            cursor: "pointer",
          }}>
            <Plus size={13} style={{ color: GOLD }} />
          </button>
        </div>

        {/* Conv list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          {convs.map(c => (
            <button key={c.id} onClick={() => setActiveId(c.id)} style={{
              width: "100%", textAlign: "left",
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: c.id === activeId
                ? (isDark ? "rgba(255,185,0,.10)" : "rgba(255,185,0,.08)")
                : "none",
              border: c.id === activeId ? `1px solid rgba(255,185,0,.20)` : "1px solid transparent",
              cursor: "pointer",
            }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: c.id === activeId ? GOLD : fg, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.title}
              </div>
              <div style={{ fontSize: 10.5, color: fg3 }}>
                {c.ts.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </button>
          ))}
        </div>

        {/* Switch to other modes */}
        <div style={{ padding: "8px", borderTop: `1px solid ${sbBd}` }}>
          {([
            { v: "audio" as View, label: "Appel audio", Icon: Phone },
            { v: "video" as View, label: "Appel vidéo", Icon: Video },
          ] as const).map(({ v, label, Icon }) => (
            <button key={v} onClick={() => onSwitchMode(v)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 7,
              padding: "7px 10px", borderRadius: 7, marginBottom: 4,
              background: "none", border: `1px solid ${sbBd}`,
              cursor: "pointer", color: fg2, fontSize: 12,
            }}>
              <Icon size={12} style={{ color: fg3 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg, minWidth: 0 }}>
        {/* Chat header */}
        <div style={{
          flexShrink: 0, padding: "12px 20px",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,.07)" : "#e5e7eb"}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,185,0,.12)", border: `1px solid rgba(255,185,0,.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: GOLD, flexShrink: 0,
          }}>
            {assistant.name[0]}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{assistant.name}</div>
            <div style={{ fontSize: 11, color: fg2 }}>DJAMA IA · {assistant.langs.join(" · ")}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", minHeight: 0,
          padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14,
        }}>
          {active.msgs.map(msg => (
            <MsgBubble key={msg.id} msg={msg} isDark={isDark} assistantName={assistant.name} />
          ))}
          {thinking && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ fontSize: 11, color: fg3, marginBottom: 4, paddingLeft: 2 }}>{assistant.name}</div>
              <div style={{
                borderRadius: "4px 16px 16px 16px",
                background: isDark ? "rgba(255,255,255,.06)" : "#f3f4f6",
              }}>
                <ThinkingDots color={GOLD} />
              </div>
            </div>
          )}
          <div ref={msgsEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          flexShrink: 0,
          padding: "12px 16px",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,.07)" : "#e5e7eb"}`,
        }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            background: inBg, border: `1px solid ${inBd}`,
            borderRadius: 14, padding: "8px 10px 8px 14px",
          }}>
            <button title="Pièce jointe" style={{ background: "none", border: "none", cursor: "pointer", color: fg3, flexShrink: 0, padding: 2 }}>
              <Paperclip size={15} />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Dites à ${assistant.name} ce que vous souhaitez créer…`}
              rows={1}
              style={{
                flex: 1, background: "none", border: "none", outline: "none", resize: "none",
                fontSize: 13.5, color: fg, lineHeight: 1.5,
                fontFamily: "inherit", maxHeight: 100, overflowY: "auto",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: input.trim() ? GOLD : (isDark ? "rgba(255,255,255,.08)" : "#e5e7eb"),
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <Send size={14} style={{ color: input.trim() ? NOIR : fg3 }} />
            </button>
          </div>
          <div style={{ fontSize: 10.5, color: fg3, textAlign: "center", marginTop: 6 }}>
            Entrée pour envoyer · Maj+Entrée pour un saut de ligne
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Audio view ─────────────────────────────────────────────── */

function AudioView({ assistant, isDark, onBack }: {
  assistant: AssistantData; isDark: boolean; onBack: () => void;
}) {
  const [muted,   setMuted]   = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [status,  setStatus]  = useState<"connecting" | "listening" | "speaking">("connecting");

  useEffect(() => {
    const t1 = setTimeout(() => setStatus("listening"), 1200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  const fg2 = "rgba(255,255,255,.5)";
  const fg3 = "rgba(255,255,255,.3)";

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: NOIR, color: "#fff",
    }}>
      {/* Main call area */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 28,
        padding: "32px 24px",
      }}>
        {/* Avatar ring */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {status !== "connecting" && (
            <div className="dj-ping" style={{
              position: "absolute", width: 100, height: 100,
              borderRadius: "50%", border: `2px solid ${GOLD}`,
            }} />
          )}
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: "rgba(255,185,0,.12)", border: `2px solid ${GOLD}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, color: GOLD,
          }}>
            {assistant.name[0]}
          </div>
        </div>

        {/* Name + status */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{assistant.name}</div>
          <div style={{
            fontSize: 13, color: fg2,
            display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
          }}>
            <Clock size={12} />
            {fmt(seconds)}
            <span style={{ opacity: .4 }}>·</span>
            <span style={{ color: status === "connecting" ? fg3 : GOLD }}>
              {status === "connecting" ? "Connexion…" : status === "listening" ? "À l'écoute" : "En train de parler"}
            </span>
          </div>
        </div>

        {/* Waveform */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Waveform active={status === "speaking"} color={GOLD} bars={16} size={48} />
          <div style={{ fontSize: 12, color: fg3 }}>
            {status === "listening" ? "Je vous écoute, parlez librement…"
              : status === "speaking" ? "Je prépare votre réponse…"
              : "Connexion en cours…"}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 8 }}>
          <button onClick={() => setMuted(m => !m)} style={{
            width: 52, height: 52, borderRadius: "50%",
            background: muted ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.08)",
            border: `1px solid ${muted ? "rgba(239,68,68,.4)" : "rgba(255,255,255,.12)"}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {muted ? <MicOff size={20} style={{ color: "#ef4444" }} /> : <Mic size={20} style={{ color: "rgba(255,255,255,.75)" }} />}
          </button>

          <button onClick={onBack} style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#ef4444", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(239,68,68,.4)",
          }}>
            <PhoneOff size={22} style={{ color: "#fff" }} />
          </button>

          <button onClick={() => setSpeaker(s => !s)} style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.12)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {speaker ? <Volume2 size={20} style={{ color: "rgba(255,255,255,.75)" }} /> : <VolumeX size={20} style={{ color: "rgba(255,255,255,.4)" }} />}
          </button>
        </div>

        {/* Honest notice */}
        <div style={{
          marginTop: 8, padding: "8px 16px", borderRadius: 8,
          background: "rgba(255,185,0,.06)", border: "1px solid rgba(255,185,0,.15)",
          fontSize: 11.5, color: "rgba(255,255,255,.45)", textAlign: "center", maxWidth: 320,
        }}>
          Interface vocale — moteur voix connecté lors du sous-chantier E
        </div>
      </div>
    </div>
  );
}

/* ─── Video view ─────────────────────────────────────────────── */

function VideoView({ assistant, isDark, onBack }: {
  assistant: AssistantData; isDark: boolean; onBack: () => void;
}) {
  const [muted,  setMuted]  = useState(false);
  const [cam,    setCam]    = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: "#050508", color: "#fff", position: "relative",
    }}>
      {/* Ambient background */}
      <div className="dj-ambient" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,185,0,.07), transparent)`,
      }} />

      {/* Avatar area */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 20, position: "relative", zIndex: 1,
      }}>
        {/* Placeholder honest card */}
        <div style={{
          width: 220, height: 290, borderRadius: 20,
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.08)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 14, padding: 24,
        }}>
          <div style={{ position: "relative" }}>
            <div className="dj-ping" style={{
              position: "absolute", inset: -6,
              borderRadius: "50%", border: `1.5px solid ${GOLD}`,
            }} />
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(255,185,0,.10)", border: `2px solid ${GOLD}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 800, color: GOLD,
            }}>
              {assistant.name[0]}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{assistant.name}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)", lineHeight: 1.5 }}>
              Humain numérique 3D
            </div>
          </div>
          <div style={{
            padding: "7px 12px", borderRadius: 7,
            background: "rgba(255,185,0,.07)", border: "1px solid rgba(255,185,0,.15)",
            fontSize: 10.5, color: "rgba(255,255,255,.45)", textAlign: "center",
          }}>
            Sous-chantier F
          </div>
        </div>

        {/* Waveform */}
        <Waveform active={false} color={GOLD} bars={10} size={28} />

        {/* Controls */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 4 }}>
          <button onClick={() => setCam(c => !c)} style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {cam ? <Camera size={18} style={{ color: "rgba(255,255,255,.75)" }} /> : <CameraOff size={18} style={{ color: "rgba(255,255,255,.4)" }} />}
          </button>

          <button onClick={() => setMuted(m => !m)} style={{
            width: 48, height: 48, borderRadius: "50%",
            background: muted ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.08)",
            border: `1px solid ${muted ? "rgba(239,68,68,.4)" : "rgba(255,255,255,.12)"}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {muted ? <MicOff size={18} style={{ color: "#ef4444" }} /> : <Mic size={18} style={{ color: "rgba(255,255,255,.75)" }} />}
          </button>

          <button onClick={onBack} style={{
            width: 58, height: 58, borderRadius: "50%",
            background: "#ef4444", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(239,68,68,.4)",
          }}>
            <PhoneOff size={20} style={{ color: "#fff" }} />
          </button>

          <button style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Volume2 size={18} style={{ color: "rgba(255,255,255,.75)" }} />
          </button>

          <button onClick={() => {}} style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MessageSquare size={18} style={{ color: "rgba(255,255,255,.75)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */

export default function AgentPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [view, setView]               = useState<View>("home");
  const [assistantId, setAssistantId] = useState("emma");
  const [quickPrompt, setQuickPrompt] = useState<string | undefined>();
  const [prefs, setPrefs]             = useState<PersonalizationPrefs>({
    assistantId: "emma",
    nickname:    "",
    tutoiement:  false,
    speed:       "normal",
    commStyle:   "Professionnel",
    lang:        "FR",
  });

  const assistant: AssistantData = ALL_ASSISTANTS.find(a => a.id === assistantId) ?? ALL_ASSISTANTS[0];

  function goHome()        { setView("home"); }
  function goGallery()     { setView("gallery"); }
  function goMode(v: View) { setView(v); }

  function handleBack() {
    if (view === "home") router.push("/client/factures");
    else setView("home");
  }

  function handleQuickAction(prompt: string) {
    setQuickPrompt(prompt);
    setView("chat");
  }

  function handleSelectAssistant(id: string) {
    setAssistantId(id);
    setPrefs(p => ({ ...p, assistantId: id, lang: ALL_ASSISTANTS.find(a => a.id === id)?.langs[0] ?? "FR" }));
    setView("home");
  }

  function handleSavePrefs(p: PersonalizationPrefs) {
    setPrefs(p);
    if (p.assistantId !== assistantId) setAssistantId(p.assistantId);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{CSS_ANIM}</style>

      <AgentTopBar
        view={view}
        assistant={assistant}
        isDark={isDark}
        onBack={handleBack}
        onGallery={goGallery}
        onHistory={() => setView("chat")}
        onSettings={() => {}}
      />

      {view === "home" && (
        <HomeView
          assistant={assistant}
          isDark={isDark}
          onMode={goMode}
          onGallery={goGallery}
          onQuickAction={handleQuickAction}
        />
      )}

      {view === "chat" && (
        <ChatView
          assistant={assistant}
          isDark={isDark}
          initialPrompt={quickPrompt}
          onBack={goHome}
          onSwitchMode={goMode}
        />
      )}

      {view === "audio" && (
        <AudioView assistant={assistant} isDark={isDark} onBack={goHome} />
      )}

      {view === "video" && (
        <VideoView assistant={assistant} isDark={isDark} onBack={goHome} />
      )}

      {view === "gallery" && (
        <GalleryView
          currentId={assistantId}
          prefs={prefs}
          isDark={isDark}
          onSelect={handleSelectAssistant}
          onSavePrefs={handleSavePrefs}
          onBack={goHome}
        />
      )}
    </div>
  );
}
