"use client";

/**
 * /client — DJAMA PRO · Coach Business
 *
 * UX rule: ouvrir → comprendre quoi faire en 3s → agir en 1 clic → gagner de l'argent.
 *
 * 1. HERO          — "Tu peux récupérer X€" (instant, radar)
 * 2. À FAIRE       — Top 5 actions directes (WA / Email / IA) sans navigation
 * 3. COACH IA      — Score + 3 actions + 1 insight (auto-chargé)
 * 4. OUTILS        — Section repliée "Voir tous les outils"
 * 5. MODALE        — Relance IA bottom-sheet
 */

import { useState, useEffect, useCallback } from "react";
import Link                                  from "next/link";
import { motion, AnimatePresence }           from "framer-motion";
import {
  Flame, Zap, Target, RefreshCw, Send, Copy, Check, X,
  MessageCircle, Mail, Sparkles, TrendingDown, TrendingUp,
  Calendar, AlertCircle, ChevronDown, ChevronUp,
  StickyNote, ReceiptText, Users, Timer,
  CreditCard, Wallet, FileText, Star, ArrowRight,
} from "lucide-react";
import type {
  RadarItem,      RadarResponse,
  CoachResponse,  CoachAction,
  RelanceRequest, RelanceResponse,
  UrgencyLevel,   CoachActionType,
} from "@/lib/assistant/types";

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
const ease   = [0.16, 1, 0.3, 1] as const;
const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/* ════════════════════════════════════════════
   CONFIG VISUELLE
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

const ACTION: Record<CoachActionType, { Icon: React.ElementType; color: string; bg: string }> = {
  relance_client:        { Icon: Send,       color: "text-red-400",   bg: "bg-red-500/10"   },
  optimisation_planning: { Icon: Calendar,   color: "text-sky-400",   bg: "bg-sky-500/10"   },
  opportunite_revenu:    { Icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
};

const ACTION_LINK: Record<CoachActionType, { href: string; label: string } | null> = {
  relance_client:        null,
  optimisation_planning: { href: "/client/planning", label: "Mon planning" },
  opportunite_revenu:    { href: "/client/factures",  label: "Créer un devis" },
};

const BADGE_STYLE: Record<string, string> = {
  "Aujourd'hui":  "bg-red-500/15 text-red-400 border-red-500/20",
  "Cette semaine":"bg-amber-500/15 text-amber-400 border-amber-500/20",
  "À planifier":  "bg-white/6 text-white/35 border-white/8",
};

const SCORE_CFG = (s: number) => ({
  color: s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400",
  bg:    s >= 70 ? "bg-emerald-500/12 border-emerald-500/25" : s >= 45 ? "bg-amber-500/12 border-amber-500/25" : "bg-red-500/12 border-red-500/25",
  label: s >= 70 ? "Bonne santé" : s >= 45 ? "À améliorer" : "Danger",
  bar:   s >= 70 ? "bg-emerald-400" : s >= 45 ? "bg-amber-400" : "bg-red-400",
});

/* ════════════════════════════════════════════
   MESSAGES RAPIDES (sans IA)
════════════════════════════════════════════ */
const quickMsg = (item: RadarItem) => {
  const type = item.type === "facture" ? "facture" : "devis";
  return `Bonjour,\n\nJe vous relance concernant notre ${type} ${item.reference} d'un montant de ${fmtEur(item.amount)}.\n\nPourriez-vous me confirmer la prise en charge ?\n\nCordialement`;
};
const quickWa   = (item: RadarItem) =>
  `https://wa.me/?text=${encodeURIComponent(quickMsg(item))}`;
const quickMail = (item: RadarItem) =>
  `mailto:${item.client_email ?? ""}?subject=${encodeURIComponent(`Relance ${item.type === "facture" ? "facture" : "devis"} ${item.reference}`)}&body=${encodeURIComponent(quickMsg(item))}`;

/* ════════════════════════════════════════════
   DEMO DATA
════════════════════════════════════════════ */
const DEMO_RADAR: RadarItem[] = [
  { id: "d1", type: "facture", label: "", client: "Martin Électricité", reference: "FAC-2024-042", amount: 1_800, urgency: "critique",   days: 23, client_email: null },
  { id: "d2", type: "devis",   label: "", client: "Dupont Design",      reference: "DEV-2024-018", amount: 1_200, urgency: "urgent",     days: 11, client_email: null },
  { id: "d3", type: "facture", label: "", client: "Bâtisseurs & Co",    reference: "FAC-2024-039", amount:   650, urgency: "surveiller", days:  6, client_email: null },
];

const DEMO_COACH: CoachResponse = {
  resume: "3 650€ en attente — relancer Martin Électricité aujourd'hui est la priorité n°1.",
  score: 58,
  actions: [
    { type: "relance_client",     priority: 1, title: "Relancer Martin Électricité",  description: "J+23 — envoyer une relance ferme immédiatement.", impact: "1 800€ récupérables aujourd'hui",  urgency: "haute",   badge: "Aujourd'hui"   },
    { type: "relance_client",     priority: 2, title: "Relancer Dupont Design",        description: "Devis J+11 — relance = +60% de chances d'acceptation.", impact: "1 200€ potentiels cette semaine", urgency: "haute",   badge: "Aujourd'hui"   },
    { type: "opportunite_revenu", priority: 3, title: "Proposer un avenant à Bâtisseurs", description: "Client actif — proposer un forfait mensuel récurrent.", impact: "+500€/mois estimés",              urgency: "moyenne", badge: "Cette semaine" },
  ],
  insight: "Tes factures restent impayées 18j en moyenne — une relance à J+7 récupère 80% des paiements.",
  meta: { unpaid_total: 2_450, quotes_total: 1_200, generated_at: new Date().toISOString() },
};

const LOADING_TEXTS = [
  "L'IA analyse votre activité...",
  "Calcul de vos opportunités...",
  "Identification des priorités...",
  "Presque prêt...",
];

/* ════════════════════════════════════════════
   OUTILS (section repliée)
════════════════════════════════════════════ */
const ALL_TOOLS = [
  { href: "/client/notes",      icon: StickyNote,  label: "Bloc-notes IA",   color: "#c9a55a" },
  { href: "/client/planning",   icon: Calendar,    label: "Planning",         color: "#60a5fa" },
  { href: "/client/factures",   icon: ReceiptText, label: "Factures & Devis", color: "#4ade80" },
  { href: "/client/crm",        icon: Users,       label: "CRM Client",       color: "#60a5fa" },
  { href: "/client/chrono",     icon: Timer,       label: "Chrono Pro",       color: "#a78bfa" },
  { href: "/client/depenses",   icon: CreditCard,  label: "Dépenses Pro",     color: "#f97316" },
  { href: "/client/tresorerie", icon: Wallet,      label: "Trésorerie",       color: "#4ade80" },
  { href: "/client/contrats",   icon: FileText,    label: "Contrats IA",      color: "#c9a55a" },
  { href: "/client/reputation", icon: Star,        label: "Réputation",       color: "#f59e0b" },
];

/* ════════════════════════════════════════════
   MINI-COMPOSANTS
════════════════════════════════════════════ */
function Sk({ h = "h-14", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.04] ${h} ${w}`} />;
}

function UrgentDot({ urgency }: { urgency: UrgencyLevel }) {
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${URGENCY[urgency].dot} ${urgency === "critique" ? "animate-pulse" : ""}`} />;
}

function Badge({ text, className = "" }: { text: string; className?: string }) {
  const base = BADGE_STYLE[text] ?? "bg-white/6 text-white/35 border-white/8";
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${base} ${className}`}>
      {text === "Aujourd'hui" && <span className="w-1 h-1 rounded-full bg-red-500 mr-1 animate-pulse" />}
      {text}
    </span>
  );
}

/* ════════════════════════════════════════════
   PAGE PRINCIPALE — COACH
════════════════════════════════════════════ */
export default function CoachDashboard() {

  /* ── État ── */
  const [radar,         setRadar]         = useState<RadarResponse | null>(null);
  const [coach,         setCoach]         = useState<CoachResponse | null>(null);
  const [loadingBase,   setLoadingBase]   = useState(true);
  const [loadingCoach,  setLoadingCoach]  = useState(true);
  const [loadingTxtIdx, setLoadingTxtIdx] = useState(0);
  const [toolsOpen,     setToolsOpen]     = useState(false);

  /* ── Relance ── */
  const [relanceItem,    setRelanceItem]    = useState<RadarItem | null>(null);
  const [relanceLoading, setRelanceLoading] = useState(false);
  const [relanceMsg,     setRelanceMsg]     = useState<RelanceResponse | null>(null);
  const [copied,         setCopied]         = useState(false);

  /* ── Cycling loading text ── */
  useEffect(() => {
    if (!loadingCoach) return;
    const t = setInterval(() => setLoadingTxtIdx(i => (i + 1) % LOADING_TEXTS.length), 1_600);
    return () => clearInterval(t);
  }, [loadingCoach]);

  /* ── Fetch radar (rapide, sans IA) ── */
  const fetchBase = useCallback(async () => {
    setLoadingBase(true);
    const r = await fetch("/api/assistant/radar").then(r => r.ok ? r.json() : null).catch(() => null);
    setRadar(r);
    setLoadingBase(false);
  }, []);

  /* ── Fetch coach (IA, ~3s) ── */
  const fetchCoach = useCallback(async () => {
    setLoadingCoach(true);
    setCoach(null);
    const res = await fetch("/api/assistant/coach", { method: "POST" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    setCoach(res);
    setLoadingCoach(false);
  }, []);

  useEffect(() => { fetchBase(); fetchCoach(); }, [fetchBase, fetchCoach]);

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

  const copyMessage = useCallback(async () => {
    if (!relanceMsg) return;
    await navigator.clipboard.writeText(`Objet : ${relanceMsg.subject}\n\n${relanceMsg.message}`).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_500);
  }, [relanceMsg]);

  const closeModal = () => { setRelanceItem(null); setRelanceMsg(null); };

  const mailLink = (m: RelanceResponse, email: string | null) =>
    `mailto:${email ?? ""}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.message)}`;
  const waLink = (m: RelanceResponse) =>
    `https://wa.me/?text=${encodeURIComponent(`${m.subject}\n\n${m.message}`)}`;

  /* ── Données dérivées ── */
  const loaded     = !loadingBase && !loadingCoach;
  const hasReal    = (radar?.items?.length ?? 0) > 0 || (coach?.actions?.length ?? 0) > 0;
  const isDemoMode = loaded && !hasReal;

  const activeRadar = isDemoMode ? DEMO_RADAR : (radar?.items ?? []);
  const activeCoach = isDemoMode ? DEMO_COACH : coach;
  const totalAtRisk = isDemoMode ? 3_650       : (radar?.total ?? 0);

  const weeklyLoss = Math.round(
    activeRadar.reduce((s, item) => {
      const rate = item.urgency === "critique" ? 0.20 : item.urgency === "urgent" ? 0.08 : 0.02;
      return s + item.amount * rate;
    }, 0)
  );

  /* Top 5 urgents pour "À faire maintenant" */
  const urgentActions = activeRadar
    .filter(i => i.urgency === "critique" || i.urgency === "urgent")
    .slice(0, 5);

  const score    = activeCoach?.score ?? null;
  const scoreCfg = score !== null ? SCORE_CFG(score) : null;

  /* ════════════════════════════════════════
     RENDU
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#09090f] text-white pb-28">

      {/* ─── Header ───────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#09090f]/95 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-sm font-bold tracking-tight">Coach DJAMA</span>
            {isDemoMode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/20 font-semibold">
                Démo
              </span>
            )}
          </div>
          <button
            onClick={() => { fetchBase(); fetchCoach(); }}
            disabled={loadingBase || loadingCoach}
            className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/55 transition-colors disabled:opacity-25 px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loadingBase || loadingCoach) ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* ══════════════════════════════════════
            1. HERO — impact immédiat
        ══════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] via-amber-500/[0.03] to-transparent p-6">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-amber-500/8 blur-3xl pointer-events-none" />

          {isDemoMode && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-sky-500/8 border border-sky-500/15">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <p className="text-xs text-sky-300/70 leading-snug">
                Exemple — voici ce que DJAMA détectera dès vos premières factures créées.
              </p>
            </div>
          )}

          {loadingBase ? <Sk h="h-8" w="w-64" /> : (
            <motion.p
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-xl font-bold text-white leading-tight mb-3"
            >
              Tu peux récupérer{" "}
              <span className="text-amber-400">{fmtEur(totalAtRisk)}</span>{" "}
              cette semaine
            </motion.p>
          )}

          <div className="flex items-center gap-2 flex-wrap mb-4">
            {scoreCfg && score !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${scoreCfg.bg} ${scoreCfg.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${scoreCfg.bar}`} />
                Score {score}/100 · {scoreCfg.label}
              </motion.div>
            )}
            {loadingCoach && !scoreCfg && <Sk h="h-6" w="w-36" />}

            {!loadingBase && urgentActions.length > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {urgentActions.length} action{urgentActions.length > 1 ? "s" : ""} urgente{urgentActions.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {!loadingBase && weeklyLoss >= 50 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/[0.07] border border-red-500/15"
            >
              <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300/80">
                Sans action, tu perds{" "}
                <span className="font-bold text-red-400">~{fmtEur(weeklyLoss)}/semaine</span>
              </p>
            </motion.div>
          )}
        </div>

        {/* ══════════════════════════════════════
            2. À FAIRE MAINTENANT — actions directes
        ══════════════════════════════════════ */}
        {(loadingBase || urgentActions.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/30">
                À faire maintenant
              </h2>
            </div>

            {loadingBase ? (
              <div className="space-y-2"><Sk h="h-20" /><Sk h="h-20" /></div>
            ) : (
              <div className="space-y-2">
                {urgentActions.map((item, i) => {
                  const u = URGENCY[item.urgency];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`rounded-2xl border p-4 ${u.bg} ${u.border}`}
                    >
                      {/* Ligne 1 : client + montant */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <UrgentDot urgency={item.urgency} />
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

                      {/* Ligne 2 : boutons d'action directe */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* WhatsApp rapide (template pré-construit) */}
                        <a
                          href={quickWa(item)}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/18 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>

                        {/* Email rapide */}
                        <a
                          href={quickMail(item)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-sky-500/10 border border-sky-500/18 text-sky-400 hover:bg-sky-500/18 transition-all"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </a>

                        {/* Relance IA (message personnalisé) */}
                        <button
                          onClick={() => openRelance(item)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${u.ctaBg}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Rédiger avec l&apos;IA
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════
            3. COACH IA — analyse + actions
        ══════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/30">
                Analyse business
              </h2>
            </div>
            {activeCoach && !loadingCoach && (
              <button
                onClick={fetchCoach}
                className="text-[10px] text-white/20 hover:text-white/40 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Relancer
              </button>
            )}
          </div>

          {loadingCoach && (
            <div className="space-y-2.5">
              <motion.div
                key={loadingTxtIdx}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/[0.05] border border-amber-500/12"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                  <Sparkles className="w-4 h-4 text-amber-400/70 flex-shrink-0" />
                </motion.div>
                <p className="text-sm text-amber-400/60">{LOADING_TEXTS[loadingTxtIdx]}</p>
              </motion.div>
              <Sk h="h-12" /><Sk h="h-20" /><Sk h="h-20" />
            </div>
          )}

          {!loadingCoach && !activeCoach && !isDemoMode && (
            <button
              onClick={fetchCoach}
              className="w-full py-6 rounded-2xl border border-dashed border-white/8 text-sm text-white/25 hover:text-white/45 hover:border-white/15 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Relancer l&apos;analyse
            </button>
          )}

          {activeCoach && !loadingCoach && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
              {/* Résumé */}
              <div className="px-4 py-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                <p className="text-sm text-white/60 leading-relaxed">{activeCoach.resume}</p>
              </div>

              {/* 3 actions */}
              {activeCoach.actions.map((action: CoachAction, i: number) => {
                const cfg  = ACTION[action.type] ?? ACTION.relance_client;
                const link = ACTION_LINK[action.type];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold leading-snug">{action.title}</p>
                          <Badge text={action.badge ?? "Cette semaine"} className="flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-white/38 leading-relaxed mb-2">{action.description}</p>
                        {action.impact && (
                          <p className={`text-xs font-bold ${cfg.color}`}>→ {action.impact}</p>
                        )}
                        {link && (
                          <Link
                            href={link.href}
                            className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold opacity-50 hover:opacity-90 transition-opacity ${cfg.color}`}
                          >
                            {link.label} <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Insight */}
              {activeCoach.insight && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-sky-500/[0.05] border border-sky-500/12">
                  <Target className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-sky-300/65 leading-relaxed">{activeCoach.insight}</p>
                </div>
              )}

              {/* Barre de score */}
              {scoreCfg && score !== null && (
                <div className="px-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-white/18">Santé business</span>
                    <span className={`text-[10px] font-bold ${scoreCfg.color}`}>{score}/100 · {scoreCfg.label}</span>
                  </div>
                  <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${score}%` }}
                      transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
                      className={`h-full rounded-full ${scoreCfg.bar}`}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* ══════════════════════════════════════
            4. TOUS LES OUTILS (replié par défaut)
        ══════════════════════════════════════ */}
        <section className="pb-4">
          <button
            onClick={() => setToolsOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-[11px] font-bold text-white/25 hover:text-white/45 hover:border-white/10 transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/20" />
              Voir tous les outils ({ALL_TOOLS.length})
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
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04]"
                        style={{ color }}>
                        <Icon size={15} />
                      </div>
                      <span className="text-[10px] font-semibold text-white/30 text-center leading-tight group-hover:text-white/50 transition-colors">
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

      {/* ══════════════════════════════════════
          5. MODALE RELANCE IA
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {relanceItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-black/72 backdrop-blur-sm z-40"
              onClick={closeModal}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 270 }}
              className="fixed bottom-0 inset-x-0 z-50 max-w-2xl mx-auto bg-[#101017] border-t border-white/[0.07] rounded-t-3xl px-5 pb-10 pt-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-9 h-1 bg-white/10 rounded-full mx-auto mb-5" />

              {/* Header */}
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
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05]">
                  <X className="w-4 h-4 text-white/45" />
                </button>
              </div>

              {/* Loading */}
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
                    <p className="text-sm text-amber-400/60">Rédaction du message en cours...</p>
                  </motion.div>
                  <Sk h="h-11" /><Sk h="h-36" /><Sk h="h-28" />
                </div>
              )}

              {/* Message généré */}
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
                      onClick={copyMessage}
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
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </a>
                    <a
                      href={mailLink(relanceMsg, relanceItem.client_email)}
                      className="flex flex-col items-center gap-1.5 py-4 rounded-2xl text-xs font-bold bg-sky-500/10 border border-sky-500/18 text-sky-400 hover:bg-sky-500/18 transition-all"
                    >
                      <Mail className="w-5 h-5" />
                      Email
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

              {/* Erreur */}
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
