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
import Avatar3D from "./avatar/Avatar3D";

/* ─── types ─────────────────────────────────────────────────── */

type View = "home" | "chat" | "audio" | "video" | "gallery" | "summary";

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

  @keyframes dj-breathe {
    0%,100% { transform: scale(1) translateY(0); }
    50%      { transform: scale(1.009) translateY(-3px); }
  }
  .dj-breathe { animation: dj-breathe 3.5s ease-in-out infinite; }

  @keyframes dj-speak-pulse {
    0%,100% { transform: scale(1) translateY(0); }
    30%      { transform: scale(1.015) translateY(-2px); }
    70%      { transform: scale(0.996) translateY(1px); }
  }
  .dj-speak { animation: dj-speak-pulse 0.65s ease-in-out infinite; }

  @keyframes dj-conn-blink {
    0%,80%,100% { opacity: .2; transform: scale(.8); }
    40%          { opacity: 1;  transform: scale(1); }
  }
  .dj-conn-dot { animation: dj-conn-blink 1.4s ease-in-out infinite; }
  .dj-conn-dot:nth-child(2) { animation-delay: .22s; }
  .dj-conn-dot:nth-child(3) { animation-delay: .44s; }

  @keyframes dj-ctrl-fadein  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes dj-ctrl-fadeout { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(10px); } }
  .dj-ctrl-in  { animation: dj-ctrl-fadein  .28s ease-out forwards; }
  .dj-ctrl-out { animation: dj-ctrl-fadeout .28s ease-in  forwards; }

  @keyframes dj-summary-in {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .dj-summary-in { animation: dj-summary-in .35s ease-out forwards; }
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
  const isSummary = view === "summary";
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
            { v: "chat"  as View, label: "Chat",       sub: "Écrivez librement",  Icon: MessageSquare, clr: "#818cf8", hbg: "rgba(129,140,248,.08)", hbd: "rgba(129,140,248,.35)" },
            { v: "audio" as View, label: "Audio",      sub: "Appel vocal",         Icon: Phone,         clr: GOLD,     hbg: "rgba(255,185,0,.07)",   hbd: "rgba(255,185,0,.4)"   },
            { v: "video" as View, label: "Vidéo",      sub: `Avec ${assistant.name.split(" ")[0]}`, Icon: Video, clr: "#34d399", hbg: "rgba(52,211,153,.07)", hbd: "rgba(52,211,153,.35)" },
          ]).map(({ v, label, sub, Icon, clr, hbg, hbd }) => (
            <button key={v} onClick={() => onMode(v)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              padding: "22px 10px 18px",
              background: card, border: `1px solid ${bd}`,
              borderRadius: 16, cursor: "pointer",
              transition: "border-color .15s, background .15s, transform .15s",
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = hbd;
                el.style.background  = hbg;
                el.style.transform   = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = bd;
                el.style.background  = card;
                el.style.transform   = "translateY(0)";
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `${clr}18`,
                border: `1px solid ${clr}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={22} style={{ color: clr }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: fg, marginBottom: 3 }}>{label}</div>
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

/* ─── Circular call button helper ───────────────────────────── */

function CtrlBtn({ Icon, label, size, color, bg, bd, shadow, onClick }: {
  Icon: React.ElementType; label: string; size: number;
  color: string; bg: string; bd: string; shadow?: string;
  onClick: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button onClick={onClick} style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, border: `1.5px solid ${bd}`,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: shadow ?? "none", flexShrink: 0,
      }}>
        <Icon size={Math.round(size * 0.37)} style={{ color }} />
      </button>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,.38)", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

/* ─── Audio view — iPhone-inspired ──────────────────────────── */

function AudioView({ assistant, isDark: _isDark, onBack: _onBack, onSwitchVideo, onEnd }: {
  assistant: AssistantData; isDark: boolean; onBack: () => void;
  onSwitchVideo?: () => void;
  onEnd?: (seconds: number) => void;
}) {
  const [muted,     setMuted]     = useState(false);
  const [speaker,   setSpeaker]   = useState(true);
  const [seconds,   setSeconds]   = useState(0);
  const [connected, setConnected] = useState(false);
  const [status,    setStatus]    = useState<"connecting" | "listening" | "speaking">("connecting");

  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!connected) return;
    setStatus("listening");
    const cycle = setInterval(() => {
      setStatus(s => (s === "listening" ? "speaking" : "listening"));
    }, 3400);
    return () => clearInterval(cycle);
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  const isSpeaking = status === "speaking";

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: NOIR, color: "#fff", position: "relative", overflow: "hidden",
    }}>
      <div className="dj-ambient" style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 56% 48% at 50% 42%, rgba(255,185,0,.10), transparent)",
      }} />

      {/* Portrait + info */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "28px 24px 0", position: "relative", zIndex: 1,
      }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          {connected && (<>
            <div className="dj-ping" style={{ position: "absolute", width: 152, height: 152, borderRadius: 28, border: `1.5px solid ${GOLD}` }} />
            <div className="dj-ping" style={{ position: "absolute", width: 176, height: 176, borderRadius: 32, border: "1px solid rgba(255,185,0,.28)", animationDelay: ".65s" }} />
          </>)}
          <div className={isSpeaking ? "dj-speak" : "dj-breathe"} style={{ borderRadius: 20, overflow: "hidden" }}>
            <Portrait type={assistant.portrait} size={120} />
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.025em", marginBottom: 6 }}>{assistant.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center", marginBottom: 12 }}>
            <div style={{ width: 17, height: 17, borderRadius: 4, background: "rgba(255,185,0,.15)", border: "1px solid rgba(255,185,0,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={9} style={{ color: GOLD }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, letterSpacing: ".05em" }}>DJAMA IA</span>
          </div>
          {!connected ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 16px", borderRadius: 20, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0,1,2].map(i => <div key={i} className="dj-conn-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,.5)" }} />)}
              </div>
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.45)" }}>Connexion en cours</span>
            </div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)" }}>
              <Clock size={11} style={{ color: "rgba(255,255,255,.45)" }} />
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.45)", fontVariantNumeric: "tabular-nums" }}>{fmt(seconds)}</span>
              <span style={{ color: "rgba(255,255,255,.18)" }}>·</span>
              <span style={{ fontSize: 12.5, color: status === "listening" ? GOLD : "rgba(255,255,255,.5)", transition: "color .4s" }}>
                {status === "listening" ? "À l'écoute" : "Réponse en cours"}
              </span>
            </div>
          )}
        </div>

        <Waveform active={isSpeaking} color={GOLD} bars={20} size={44} />
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.28)", marginTop: 10 }}>
          {!connected ? "Établissement de la connexion…" : (isSpeaking ? "Réponse en préparation…" : "Je vous écoute, parlez librement…")}
        </div>
      </div>

      {/* Controls */}
      <div style={{ flexShrink: 0, padding: "24px 20px 44px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
          <CtrlBtn Icon={muted ? MicOff : Mic} label={muted ? "Muet" : "Micro"} size={58} color={muted ? "#ef4444" : "rgba(255,255,255,.85)"} bg={muted ? "rgba(239,68,68,.22)" : "rgba(255,255,255,.10)"} bd={muted ? "rgba(239,68,68,.5)" : "rgba(255,255,255,.14)"} onClick={() => setMuted(m => !m)} />
          <CtrlBtn Icon={speaker ? Volume2 : VolumeX} label="Haut-parl." size={58} color={speaker ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.35)"} bg="rgba(255,255,255,.10)" bd="rgba(255,255,255,.14)" onClick={() => setSpeaker(s => !s)} />
          <CtrlBtn Icon={PhoneOff} label="Terminer" size={72} color="#fff" bg="#ef4444" bd="transparent" shadow="0 6px 28px rgba(239,68,68,.55)" onClick={() => onEnd ? onEnd(seconds) : _onBack()} />
          <CtrlBtn Icon={MessageSquare} label="Transcript" size={58} color="rgba(255,255,255,.85)" bg="rgba(255,255,255,.10)" bd="rgba(255,255,255,.14)" onClick={() => {}} />
          <CtrlBtn Icon={Video} label="Vidéo" size={58} color="rgba(255,255,255,.85)" bg="rgba(255,255,255,.10)" bd="rgba(255,255,255,.14)" onClick={() => onSwitchVideo?.() ?? _onBack()} />
        </div>
        <div style={{ padding: "6px 16px", borderRadius: 20, marginTop: 4, background: "rgba(255,185,0,.05)", border: "1px solid rgba(255,185,0,.12)", fontSize: 10.5, color: "rgba(255,255,255,.28)", textAlign: "center" }}>
          Moteur vocal — connexion lors du sous-chantier E
        </div>
      </div>
    </div>
  );
}

/* ─── Video view — FaceTime-inspired ────────────────────────── */

function VideoView({ assistant, isDark: _isDark, onBack: _onBack, onSwitchAudio, onEnd }: {
  assistant: AssistantData; isDark: boolean; onBack: () => void;
  onSwitchAudio?: () => void;
  onEnd?: (seconds: number) => void;
}) {
  const [muted,     setMuted]     = useState(false);
  const [cam,       setCam]       = useState(false);
  const [seconds,   setSeconds]   = useState(0);
  const [connected, setConnected] = useState(false);
  const [status,    setStatus]    = useState<"connecting" | "listening" | "speaking">("connecting");
  const [ctrlVis,   setCtrlVis]   = useState(true);
  const ctrlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function resetCtrlTimer() {
    setCtrlVis(true);
    if (ctrlTimer.current) clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => setCtrlVis(false), 3200);
  }

  useEffect(() => {
    resetCtrlTimer();
    return () => { if (ctrlTimer.current) clearTimeout(ctrlTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!connected) return;
    setStatus("listening");
    const cycle = setInterval(() => {
      setStatus(s => (s === "listening" ? "speaking" : "listening"));
    }, 3600);
    return () => clearInterval(cycle);
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  const isSpeaking = status === "speaking";

  return (
    <div
      onClick={resetCtrlTimer}
      style={{ flex: 1, background: "#060610", color: "#fff", position: "relative", overflow: "hidden", cursor: "default" }}
    >
      {/* ── 3D Avatar — full-screen background ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <Avatar3D isSpeaking={isSpeaking} isConnected={connected} />
      </div>

      {/* ── PiP corner — user camera placeholder ── */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 4,
        width: 90, height: 118, borderRadius: 14,
        background: "rgba(0,0,0,.55)", border: "1px solid rgba(255,255,255,.12)",
        backdropFilter: "blur(8px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <CameraOff size={18} style={{ color: "rgba(255,255,255,.28)" }} />
        <span style={{ fontSize: 9, color: "rgba(255,255,255,.28)", textAlign: "center", lineHeight: 1.3 }}>
          Votre{"\n"}caméra
        </span>
      </div>

      {/* ── Timer — top left ── */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}>
        {connected && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "5px 12px", borderRadius: 20,
            background: "rgba(0,0,0,.50)", backdropFilter: "blur(10px)",
          }}>
            <Clock size={10} style={{ color: "rgba(255,255,255,.5)" }} />
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.5)", fontVariantNumeric: "tabular-nums" }}>
              {fmt(seconds)}
            </span>
          </div>
        )}
      </div>

      {/* ── Name + status — bottom of avatar area ── */}
      <div style={{
        position: "absolute", bottom: 110, left: 0, right: 0, zIndex: 4,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        pointerEvents: "none",
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.02em", textShadow: "0 1px 8px rgba(0,0,0,.7)" }}>
          {assistant.name}
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "4px 14px", borderRadius: 20,
          background: "rgba(0,0,0,.50)", backdropFilter: "blur(8px)",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: connected ? (isSpeaking ? GOLD : "#34d399") : "rgba(255,255,255,.3)",
            transition: "background .4s", flexShrink: 0,
          }} />
          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.65)" }}>
            {!connected ? "Connexion…" : (isSpeaking ? "En train de répondre" : "À l'écoute")}
          </span>
        </div>
        <Waveform active={isSpeaking} color={GOLD} bars={12} size={22} />
      </div>

      {/* ── Floating controls — auto-hide ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5,
        opacity: ctrlVis ? 1 : 0,
        transform: ctrlVis ? "translateY(0)" : "translateY(10px)",
        transition: "opacity .28s ease, transform .28s ease",
        pointerEvents: ctrlVis ? "auto" : "none",
      }}>
        <div style={{
          display: "flex", justifyContent: "center", gap: 12, alignItems: "flex-end",
          padding: "20px 20px 32px",
          background: "linear-gradient(to top, rgba(6,6,16,.95) 0%, transparent 100%)",
        }}>
          <CtrlBtn
            Icon={cam ? Camera : CameraOff} label={cam ? "Caméra" : "Caméra off"}
            size={54}
            color={cam ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.35)"}
            bg={cam ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.07)"}
            bd="rgba(255,255,255,.12)"
            onClick={() => setCam(c => !c)}
          />
          <CtrlBtn
            Icon={muted ? MicOff : Mic} label={muted ? "Muet" : "Micro"}
            size={54}
            color={muted ? "#ef4444" : "rgba(255,255,255,.85)"}
            bg={muted ? "rgba(239,68,68,.22)" : "rgba(255,255,255,.10)"}
            bd={muted ? "rgba(239,68,68,.5)" : "rgba(255,255,255,.12)"}
            onClick={() => setMuted(m => !m)}
          />
          <CtrlBtn
            Icon={PhoneOff} label="Terminer"
            size={68} color="#fff" bg="#ef4444" bd="transparent"
            shadow="0 6px 28px rgba(239,68,68,.55)"
            onClick={() => onEnd ? onEnd(seconds) : _onBack()}
          />
          <CtrlBtn
            Icon={Volume2} label="Audio"
            size={54} color="rgba(255,255,255,.85)" bg="rgba(255,255,255,.10)" bd="rgba(255,255,255,.12)"
            onClick={() => {}}
          />
          <CtrlBtn
            Icon={Phone} label="Passer en audio"
            size={54} color="rgba(255,255,255,.85)" bg="rgba(255,255,255,.10)" bd="rgba(255,255,255,.12)"
            onClick={() => onSwitchAudio?.() ?? _onBack()}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Call summary view ──────────────────────────────────────── */

function CallSummaryView({ assistant, isDark, seconds, mode, onResume, onHome }: {
  assistant: AssistantData; isDark: boolean;
  seconds: number; mode: "audio" | "video";
  onResume: () => void; onHome: () => void;
}) {
  const bg   = isDark ? NOIR       : "#fafafa";
  const fg   = isDark ? "#fff"      : NOIR;
  const fg2  = isDark ? "rgba(255,255,255,.5)"  : "#6b7280";
  const fg3  = isDark ? "rgba(255,255,255,.25)" : "#9ca3af";
  const card = isDark ? "rgba(255,255,255,.04)" : "#fff";
  const bd   = isDark ? "rgba(255,255,255,.08)" : "#e5e7eb";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const durationLabel = mins > 0
    ? `${mins} min ${String(secs).padStart(2, "0")} s`
    : `${secs} secondes`;

  return (
    <div className="dj-summary-in" style={{ flex: 1, overflowY: "auto", background: bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px 48px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32, gap: 14 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 80, height: 80, borderRadius: 18, overflow: "hidden", border: `2px solid rgba(255,185,0,.3)`, boxShadow: "0 4px 20px rgba(255,185,0,.12)" }}>
              <Portrait type={assistant.portrait} size={80} />
            </div>
            <div style={{ position: "absolute", bottom: -6, right: -6, width: 26, height: 26, borderRadius: "50%", background: "#22c55e", border: "2px solid " + bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={13} style={{ color: "#fff" }} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: fg, marginBottom: 4 }}>Appel terminé</div>
            <div style={{ fontSize: 13, color: fg2 }}>{assistant.name} · DJAMA IA</div>
          </div>
        </div>

        {/* Duration card */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14, background: card, border: `1px solid ${bd}`, marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(255,185,0,.10)", border: "1px solid rgba(255,185,0,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={18} style={{ color: GOLD }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: fg3, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 2 }}>Durée de l&apos;appel</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: fg, fontVariantNumeric: "tabular-nums" }}>{durationLabel}</div>
          </div>
        </div>

        {/* Summary section */}
        <div style={{ padding: "16px 20px", borderRadius: 14, background: card, border: `1px solid ${bd}`, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: fg3, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Résumé de l&apos;échange</div>
          <div style={{ padding: "12px 14px", borderRadius: 10, background: isDark ? "rgba(255,185,0,.04)" : "rgba(255,185,0,.04)", border: "1px solid rgba(255,185,0,.12)" }}>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,.4)" : "#9ca3af", lineHeight: 1.6 }}>
              Le résumé automatique de l&apos;échange sera disponible après l&apos;intégration du moteur vocal (sous-chantier E). La transcription et l&apos;analyse IA seront générées ici.
            </div>
          </div>
        </div>

        {/* Documents section */}
        <div style={{ padding: "16px 20px", borderRadius: 14, background: card, border: `1px solid ${bd}`, marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: fg3, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Documents préparés</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0" }}>
            <FileText size={28} style={{ color: isDark ? "rgba(255,255,255,.12)" : "#d1d5db" }} />
            <div style={{ fontSize: 12, color: fg3, textAlign: "center" }}>Aucun document généré lors de cet appel</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onResume} style={{
            width: "100%", padding: "14px 20px", borderRadius: 13,
            background: GOLD, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {mode === "audio" ? <Phone size={16} style={{ color: NOIR }} /> : <Video size={16} style={{ color: NOIR }} />}
            <span style={{ fontSize: 14, fontWeight: 700, color: NOIR }}>Reprendre l&apos;appel</span>
          </button>
          <button onClick={onHome} style={{
            width: "100%", padding: "13px 20px", borderRadius: 13,
            background: "none", border: `1px solid ${bd}`, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: fg2 }}>Retour à l&apos;accueil</span>
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
  const [callSeconds, setCallSeconds] = useState(0);
  const [callMode,    setCallMode]    = useState<"audio" | "video">("audio");
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

  function handleAudioEnd(secs: number) {
    setCallSeconds(secs);
    setCallMode("audio");
    setView("summary");
  }

  function handleVideoEnd(secs: number) {
    setCallSeconds(secs);
    setCallMode("video");
    setView("summary");
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
        <AudioView
          assistant={assistant}
          isDark={isDark}
          onBack={goHome}
          onSwitchVideo={() => setView("video")}
          onEnd={handleAudioEnd}
        />
      )}

      {view === "video" && (
        <VideoView
          assistant={assistant}
          isDark={isDark}
          onBack={goHome}
          onSwitchAudio={() => setView("audio")}
          onEnd={handleVideoEnd}
        />
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

      {view === "summary" && (
        <CallSummaryView
          assistant={assistant}
          isDark={isDark}
          seconds={callSeconds}
          mode={callMode}
          onResume={() => setView(callMode)}
          onHome={goHome}
        />
      )}
    </div>
  );
}
