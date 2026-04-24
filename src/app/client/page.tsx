"use client";

/**
 * /client — DJAMA PRO · Copilote Business IA
 *
 * Architecture :
 *  1. KPI bar        — CA ce mois, impayés, score (depuis la première réponse IA)
 *  2. Alertes        — Radar argent perdu (collapsible)
 *  3. Chat IA        — Conversation contextuelle avec données réelles
 *  4. Outils         — Grille collapsible
 *  5. Input          — Sticky bottom
 *  6. Modale relance — Bottom-sheet (conservée)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link                                          from "next/link";
import { motion, AnimatePresence }                   from "framer-motion";
import {
  Sparkles, Send, RefreshCw, X, Copy, Check, ChevronDown, ChevronUp,
  MessageCircle, Mail, AlertCircle, TrendingDown, TrendingUp,
  FileText, Users, Timer, Wallet, CreditCard, ArrowRight, Plus,
  StickyNote, ReceiptText, Calendar, CalendarRange, Flame,
  Eye, Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
  RadarItem, RadarResponse, RelanceRequest, RelanceResponse,
  UrgencyLevel, ChatAction, ChatKPIs, ChatApiResponse,
} from "@/lib/assistant/types";

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
const ease   = [0.16, 1, 0.3, 1] as const;
const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ════════════════════════════════════════════
   ICON MAP (pour les actions IA)
════════════════════════════════════════════ */
const ICON_MAP: Record<string, React.ElementType> = {
  AlertCircle, FileText, Users, Timer, Wallet, CreditCard,
  ArrowRight, Plus, TrendingUp, TrendingDown, Eye, Send, Zap, Sparkles,
};
function DynIcon({ name, size = 14, className = "" }: { name?: string; size?: number; className?: string }) {
  const I = (name && ICON_MAP[name]) ? ICON_MAP[name] : ArrowRight;
  return <I size={size} className={className} />;
}

/* ════════════════════════════════════════════
   CONFIG VISUELLE — ACTIONS IA
════════════════════════════════════════════ */
const ACTION_STYLE: Record<string, string> = {
  primary:   "bg-blue-500/12 border-blue-500/25 text-blue-400 hover:bg-blue-500/22",
  warning:   "bg-amber-500/12 border-amber-500/25 text-amber-400 hover:bg-amber-500/22",
  danger:    "bg-red-500/12 border-red-500/25 text-red-400 hover:bg-red-500/22",
  secondary: "bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white/70",
  ghost:     "border-transparent text-white/30 hover:text-white/55",
};

/* ════════════════════════════════════════════
   CONFIG VISUELLE — RADAR
════════════════════════════════════════════ */
const URGENCY: Record<UrgencyLevel, {
  bg: string; border: string; text: string; dot: string;
  label: string; badge: string; ctaBg: string;
}> = {
  critique: {
    bg: "bg-red-500/[0.07]",   border: "border-red-500/25",
    text: "text-red-400",       dot: "bg-red-500",
    label: "Critique",          badge: "bg-red-500/15 text-red-400 border-red-500/20",
    ctaBg: "bg-red-500/15 border-red-500/25 text-red-300 hover:bg-red-500/25",
  },
  urgent: {
    bg: "bg-amber-500/[0.07]", border: "border-amber-500/20",
    text: "text-amber-400",     dot: "bg-amber-400",
    label: "Urgent",            badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    ctaBg: "bg-amber-500/12 border-amber-500/20 text-amber-300 hover:bg-amber-500/22",
  },
  surveiller: {
    bg: "bg-white/[0.025]",    border: "border-white/[0.07]",
    text: "text-white/45",      dot: "bg-white/25",
    label: "Surveiller",        badge: "bg-white/8 text-white/40 border-white/10",
    ctaBg: "bg-white/6 border-white/10 text-white/50 hover:bg-white/10",
  },
};

/* ════════════════════════════════════════════
   CONFIG — OUTILS
════════════════════════════════════════════ */
const ALL_TOOLS = [
  { href: "/client/notes",        icon: StickyNote,    label: "Bloc-notes IA",    color: "#c9a55a" },
  { href: "/client/planning",     icon: Calendar,      label: "Planning",          color: "#60a5fa" },
  { href: "/client/factures",     icon: ReceiptText,   label: "Factures & Devis",  color: "#4ade80" },
  { href: "/client/crm",          icon: Users,         label: "CRM Client",        color: "#60a5fa" },
  { href: "/client/chrono",       icon: Timer,         label: "Chrono Pro",        color: "#a78bfa" },
  { href: "/client/depenses",     icon: CreditCard,    label: "Dépenses Pro",      color: "#f97316" },
  { href: "/client/tresorerie",   icon: Wallet,        label: "Trésorerie",        color: "#4ade80" },
  { href: "/client/contrats",     icon: FileText,      label: "Contrats IA",       color: "#c9a55a" },
  { href: "/client/planification",icon: CalendarRange, label: "Planification",     color: "#38bdf8" },
];

/* ════════════════════════════════════════════
   TYPES LOCAUX
════════════════════════════════════════════ */
interface ChatMsg {
  id:           string;
  role:         "user" | "assistant";
  content:      string;
  actions?:     ChatAction[];
  suggestions?: string[];
  loading?:     boolean;
}

/* ════════════════════════════════════════════
   MESSAGES RAPIDES RADAR
════════════════════════════════════════════ */
const quickMsg = (item: RadarItem) => {
  const type = item.type === "facture" ? "facture" : "devis";
  return `Bonjour,\n\nJe vous relance concernant notre ${type} ${item.reference} d'un montant de ${fmtEur(item.amount)}.\n\nPourriez-vous me confirmer la prise en charge ?\n\nCordialement`;
};
const quickWa   = (item: RadarItem) => `https://wa.me/?text=${encodeURIComponent(quickMsg(item))}`;
const quickMail = (item: RadarItem) =>
  `mailto:${item.client_email ?? ""}?subject=${encodeURIComponent(`Relance ${item.type === "facture" ? "facture" : "devis"} ${item.reference}`)}&body=${encodeURIComponent(quickMsg(item))}`;

/* ════════════════════════════════════════════
   SOUS-COMPOSANT — SKELETON
════════════════════════════════════════════ */
function Sk({ h = "h-10", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.04] ${h} ${w}`} />;
}

/* ════════════════════════════════════════════
   SOUS-COMPOSANT — BOUTON ACTION IA
════════════════════════════════════════════ */
function ActionBtn({ action }: { action: ChatAction }) {
  const style = ACTION_STYLE[action.variant] ?? ACTION_STYLE.secondary;
  const cls   = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${style}`;
  if (action.href) {
    return (
      <Link href={action.href} className={cls}>
        <DynIcon name={action.icon} size={12} />
        {action.label}
      </Link>
    );
  }
  return (
    <button className={cls}>
      <DynIcon name={action.icon} size={12} />
      {action.label}
    </button>
  );
}

/* ════════════════════════════════════════════
   SOUS-COMPOSANT — BULLE DE MESSAGE
════════════════════════════════════════════ */
function MessageBubble({
  msg,
  onSuggestion,
}: {
  msg:          ChatMsg;
  onSuggestion: (text: string) => void;
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
      <div className="w-8 h-8 rounded-xl bg-amber-500/14 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={13} className="text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Texte */}
        <div className="rounded-3xl rounded-tl-lg bg-white/[0.03] border border-white/[0.07] px-4 py-3 mb-2.5">
          {msg.loading ? (
            <div className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400/50"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ delay: i * 0.18, repeat: Infinity, duration: 1.1 }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/78 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>

        {/* Actions */}
        {!msg.loading && msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {msg.actions.map((a, i) => <ActionBtn key={i} action={a} />)}
          </div>
        )}

        {/* Suggestions */}
        {!msg.loading && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.suggestions.map((s, i) => (
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
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════ */
export default function CoachPage() {

  /* ── Chat ── */
  const [messages,  setMessages]  = useState<ChatMsg[]>([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [kpis,      setKpis]      = useState<ChatKPIs | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const msgHistory = useRef<ChatMsg[]>([]);

  /* ── Radar ── */
  const [radar,       setRadar]       = useState<RadarResponse | null>(null);
  const [loadingBase, setLoadingBase] = useState(true);
  const [alertsOpen,  setAlertsOpen]  = useState(true);

  /* ── Relance modal ── */
  const [relanceItem,    setRelanceItem]    = useState<RadarItem | null>(null);
  const [relanceLoading, setRelanceLoading] = useState(false);
  const [relanceMsg,     setRelanceMsg]     = useState<RelanceResponse | null>(null);
  const [copied,         setCopied]         = useState(false);

  /* ── Outils ── */
  const [toolsOpen, setToolsOpen] = useState(false);

  /* ── Sync ref messages ── */
  useEffect(() => { msgHistory.current = messages; }, [messages]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Fetch radar ── */
  const fetchBase = useCallback(async () => {
    setLoadingBase(true);
    const r = await fetch("/api/assistant/radar").then(r => r.ok ? r.json() : null).catch(() => null);
    setRadar(r);
    setLoadingBase(false);
  }, []);

  /* ── Send to chat API ── */
  const sendToAPI = useCallback(async (
    text:    string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    aiId:    string,
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/assistant/chat", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ChatApiResponse = await res.json();

      setMessages(prev => prev.map(m =>
        m.id === aiId
          ? { ...m, content: data.text, actions: data.actions, suggestions: data.suggestions, loading: false }
          : m,
      ));

      if (data.kpis) setKpis(data.kpis);

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aiId
          ? { ...m, content: "Je n'ai pas pu analyser ta situation. Vérifie ta connexion et réessaie.", loading: false }
          : m,
      ));
    } finally {
      setSending(false);
    }
  }, []);

  /* ── Init ── */
  useEffect(() => {
    fetchBase();

    const initId = uid();
    setMessages([{ id: initId, role: "assistant", content: "", loading: true }]);
    setSending(true);

    sendToAPI(
      "Analyse ma situation business actuelle. Donne-moi un résumé avec les chiffres clés et l'alerte principale.",
      [],
      initId,
    );
  }, [fetchBase, sendToAPI]);

  /* ── Refresh ── */
  const handleRefresh = useCallback(() => {
    const initId = uid();
    setMessages([{ id: initId, role: "assistant", content: "", loading: true }]);
    setKpis(null);
    setSending(true);
    fetchBase();
    sendToAPI(
      "Analyse ma situation business actuelle. Donne-moi un résumé avec les chiffres clés et l'alerte principale.",
      [],
      initId,
    );
  }, [fetchBase, sendToAPI]);

  /* ── Envoyer un message ── */
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    const userId = uid();
    const aiId   = uid();

    /* Historique AVANT l'ajout du nouveau message */
    const history = msgHistory.current
      .filter(m => !m.loading)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [
      ...prev,
      { id: userId, role: "user",      content: msg },
      { id: aiId,   role: "assistant", content: "", loading: true },
    ]);
    setInput("");
    setSending(true);

    /* Reset hauteur textarea */
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

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

  /* ── Relance IA ── */
  const openRelance = useCallback(async (item: RadarItem) => {
    setRelanceItem(item);
    setRelanceMsg(null);
    setRelanceLoading(true);
    setCopied(false);
    const body: RelanceRequest = {
      type: item.type, id: item.id, client_name: item.client,
      reference: item.reference, amount: item.amount, days: item.days,
    };
    const res = await fetch("/api/assistant/relance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.ok ? r.json() : null).catch(() => null);
    setRelanceMsg(res);
    setRelanceLoading(false);
  }, []);

  const copyRelance = useCallback(async () => {
    if (!relanceMsg) return;
    await navigator.clipboard.writeText(`Objet : ${relanceMsg.subject}\n\n${relanceMsg.message}`).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_500);
  }, [relanceMsg]);

  const closeRelance = () => { setRelanceItem(null); setRelanceMsg(null); };

  const mailLink = (m: RelanceResponse, email: string | null) =>
    `mailto:${email ?? ""}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.message)}`;
  const waLink   = (m: RelanceResponse) =>
    `https://wa.me/?text=${encodeURIComponent(`${m.subject}\n\n${m.message}`)}`;

  /* ── Données dérivées ── */
  const urgentItems = (radar?.items ?? []).filter(i => i.urgency === "critique" || i.urgency === "urgent").slice(0, 5);
  const hasAlerts   = !loadingBase && urgentItems.length > 0;

  /* ════════════════════════════════════════
     RENDU
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#09090f] text-white pb-40">

      {/* ── HEADER ─────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#09090f]/96 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/14 border border-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-sm font-bold tracking-tight">Copilote IA</span>
            {kpis && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                kpis.score >= 70
                  ? "bg-emerald-500/12 border-emerald-500/22 text-emerald-400"
                  : kpis.score >= 45
                    ? "bg-amber-500/12 border-amber-500/22 text-amber-400"
                    : "bg-red-500/12 border-red-500/22 text-red-400"
              }`}>
                Score {kpis.score}/100
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={sending}
            className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/55 transition-colors disabled:opacity-25 px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </header>

      {/* ── KPI BAR ─────────────────────────────── */}
      <AnimatePresence>
        {kpis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="sticky top-14 z-20 bg-[#09090f]/92 backdrop-blur-sm border-b border-white/[0.04]"
          >
            <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto scrollbar-none text-xs">
              {/* CA */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-white/28 font-medium">CA</span>
                <span className="font-bold text-white/80">{fmtEur(kpis.ca_this_month)}</span>
                {kpis.ca_last_month > 0 && (
                  <span className={`flex items-center gap-0.5 font-bold ${kpis.ca_change_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {kpis.ca_change_pct >= 0
                      ? <TrendingUp size={11} />
                      : <TrendingDown size={11} />
                    }
                    {Math.abs(kpis.ca_change_pct)}%
                  </span>
                )}
              </div>
              <span className="text-white/8 shrink-0">│</span>

              {/* Impayés */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-white/28 font-medium">Impayés</span>
                <span className={`font-bold ${kpis.unpaid_count > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {kpis.unpaid_count > 0
                    ? `${kpis.unpaid_count} · ${fmtEur(kpis.unpaid_total)}`
                    : "0 ✓"
                  }
                </span>
              </div>
              <span className="text-white/8 shrink-0">│</span>

              {/* Score */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-white/28 font-medium">Santé</span>
                <span className={`font-bold ${
                  kpis.score >= 70 ? "text-emerald-400" : kpis.score >= 45 ? "text-amber-400" : "text-red-400"
                }`}>
                  {kpis.score}/100
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* ══ ALERTES RADAR ══ */}
        {(loadingBase || hasAlerts) && (
          <section>
            <button
              onClick={() => setAlertsOpen(o => !o)}
              className="w-full flex items-center justify-between px-1 py-1 mb-2 group"
            >
              <div className="flex items-center gap-2">
                <Flame className={`w-3.5 h-3.5 ${loadingBase ? "text-white/25" : "text-red-400"}`} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/28">
                  {loadingBase ? "Chargement…" : `${urgentItems.length} action${urgentItems.length > 1 ? "s" : ""} urgente${urgentItems.length > 1 ? "s" : ""}`}
                </span>
              </div>
              {!loadingBase && (
                alertsOpen
                  ? <ChevronUp className="w-3.5 h-3.5 text-white/20" />
                  : <ChevronDown className="w-3.5 h-3.5 text-white/20" />
              )}
            </button>

            <AnimatePresence>
              {alertsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="space-y-2 overflow-hidden"
                >
                  {loadingBase ? (
                    <><Sk h="h-20" /><Sk h="h-20" /></>
                  ) : (
                    urgentItems.map((item, i) => {
                      const u = URGENCY[item.urgency];
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`rounded-2xl border p-4 ${u.bg} ${u.border}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${u.dot} ${item.urgency === "critique" ? "animate-pulse" : ""}`} />
                              <div>
                                <p className="text-sm font-bold">{item.client}</p>
                                <p className="text-[11px] text-white/30">
                                  {item.type === "facture" ? "Facture" : "Devis"} {item.reference} · J+{item.days}
                                </p>
                              </div>
                            </div>
                            <span className={`text-base font-black tabular-nums ${u.text}`}>
                              {fmtEur(item.amount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={quickWa(item)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/18 transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                            </a>
                            <a
                              href={quickMail(item)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-sky-500/10 border border-sky-500/18 text-sky-400 hover:bg-sky-500/18 transition-all"
                            >
                              <Mail className="w-3.5 h-3.5" />Email
                            </a>
                            <button
                              onClick={() => openRelance(item)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${u.ctaBg}`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />Rédiger avec l&apos;IA
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* ══ CHAT ══ */}
        <section className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onSuggestion={text => handleSend(text)}
              />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </section>

        {/* ══ OUTILS ══ */}
        <section className="pt-2 pb-4">
          <button
            onClick={() => setToolsOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-[11px] font-bold text-white/22 hover:text-white/40 hover:border-white/10 transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/18" />
              Tous les outils ({ALL_TOOLS.length})
            </span>
            {toolsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {toolsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {ALL_TOOLS.map(({ href, icon: Icon, label, color }) => (
                    <Link
                      key={href} href={href}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:border-white/10 hover:bg-white/[0.03] transition-all group"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04]" style={{ color }}>
                        <Icon size={15} />
                      </div>
                      <span className="text-[10px] font-semibold text-white/28 text-center leading-tight group-hover:text-white/50 transition-colors">
                        {label}
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>

      {/* ══ INPUT STICKY ══════════════════════════════ */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[#09090f]/96 backdrop-blur-xl border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2.5 bg-white/[0.04] border border-white/[0.09] rounded-2xl px-4 py-2.5 focus-within:border-white/18 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question business…"
              rows={1}
              disabled={sending}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/22 outline-none resize-none leading-relaxed max-h-32 scrollbar-none disabled:opacity-40"
              style={{ height: "24px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/25 text-amber-400 hover:bg-amber-500/30 transition-all disabled:opacity-25 disabled:cursor-not-allowed shrink-0 mb-0.5"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-center text-[10px] text-white/14 mt-1.5">
            Entrée pour envoyer · Maj+Entrée pour saut de ligne
          </p>
        </div>
      </div>

      {/* ══ MODALE RELANCE IA ══════════════════════════════ */}
      <AnimatePresence>
        {relanceItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-black/72 backdrop-blur-sm z-40"
              onClick={closeRelance}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 270 }}
              className="fixed bottom-0 inset-x-0 z-50 max-w-2xl mx-auto bg-[#101017] border-t border-white/[0.07] rounded-t-3xl px-5 pb-10 pt-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-9 h-1 bg-white/10 rounded-full mx-auto mb-5" />

              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[15px]">{relanceItem.client}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${URGENCY[relanceItem.urgency].badge}`}>
                      {URGENCY[relanceItem.urgency].label}
                    </span>
                  </div>
                  <p className="text-xs text-white/28">
                    {relanceItem.type === "facture" ? "Facture" : "Devis"} {relanceItem.reference}
                    <span className="mx-1 opacity-40">·</span>
                    <span className="font-bold text-amber-400">{fmtEur(relanceItem.amount)}</span>
                    <span className="mx-1 opacity-40">·</span>J+{relanceItem.days}
                  </p>
                </div>
                <button onClick={closeRelance} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05]">
                  <X className="w-4 h-4 text-white/45" />
                </button>
              </div>

              {relanceLoading && (
                <div className="space-y-3">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/12"
                  >
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </motion.div>
                    <p className="text-sm text-amber-400/60">Rédaction en cours…</p>
                  </motion.div>
                  <Sk h="h-11" /><Sk h="h-36" />
                </div>
              )}

              {relanceMsg && !relanceLoading && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/22 font-bold mb-1.5">Objet</p>
                    <p className="text-sm font-semibold">{relanceMsg.subject}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/22 font-bold mb-2">Message</p>
                    <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{relanceMsg.message}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={copyRelance}
                      className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl text-xs font-bold transition-all border ${copied ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-white/[0.04] border-white/[0.07] text-white/50 hover:bg-white/[0.07]"}`}
                    >
                      <motion.div key={String(copied)} initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </motion.div>
                      {copied ? "Copié !" : "Copier"}
                    </button>
                    <a
                      href={waLink(relanceMsg)} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 py-4 rounded-2xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/18 text-emerald-400 hover:bg-emerald-500/18 transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />WhatsApp
                    </a>
                    <a
                      href={mailLink(relanceMsg, relanceItem.client_email)}
                      className="flex flex-col items-center gap-1.5 py-4 rounded-2xl text-xs font-bold bg-sky-500/10 border border-sky-500/18 text-sky-400 hover:bg-sky-500/18 transition-all"
                    >
                      <Mail className="w-5 h-5" />Email
                    </a>
                  </div>
                  <button
                    onClick={() => openRelance(relanceItem)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-white/20 hover:text-white/40 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Régénérer
                  </button>
                </motion.div>
              )}

              {!relanceMsg && !relanceLoading && (
                <div className="text-center py-8">
                  <AlertCircle className="w-7 h-7 text-white/15 mx-auto mb-3" />
                  <p className="text-sm text-white/25 mb-4">La génération a échoué.</p>
                  <button
                    onClick={() => openRelance(relanceItem)}
                    className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-white/[0.05] text-sm text-white/45 hover:bg-white/[0.08] transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Réessayer
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
