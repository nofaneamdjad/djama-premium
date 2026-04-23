"use client";

/**
 * /client/assistant — Assistant DJAMA PRO
 *
 * Principe : ouvrir → comprendre → agir → gagner de l'argent.
 *
 * Layout :
 *   HERO       — total € à risque, chiffre dominant
 *   ACTIONS    — 3 actions coach IA (auto-chargées, badgées)
 *   RADAR      — argent perdu par dossier (relance en 1 clic)
 *   MODALE     — message relance + copier / WhatsApp / email
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import {
  TrendingUp, Calendar, RefreshCw, Send, Copy,
  Check, X, Target, DollarSign, Sparkles, Clock,
  MessageCircle, Mail, ChevronRight, Zap, AlertCircle,
} from "lucide-react";
import type {
  RadarItem,       RadarResponse,
  CoachResponse,   CoachAction,
  NotificationsResponse,
  RelanceRequest,  RelanceResponse,
  UrgencyLevel,    CoachActionType,
} from "@/lib/assistant/types";

/* ════════════════════════════════════════════════════════
   Constantes visuelles
════════════════════════════════════════════════════════ */

const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const URGENCY_CFG: Record<UrgencyLevel, {
  bg: string; border: string; text: string; dot: string; label: string; labelBg: string;
}> = {
  critique:   {
    bg: "bg-red-500/[0.08]",   border: "border-red-500/25",
    text: "text-red-400",      dot: "bg-red-500",
    label: "Critique",         labelBg: "bg-red-500/15 text-red-400",
  },
  urgent:     {
    bg: "bg-amber-500/[0.08]", border: "border-amber-500/25",
    text: "text-amber-400",    dot: "bg-amber-400",
    label: "Urgent",           labelBg: "bg-amber-500/15 text-amber-400",
  },
  surveiller: {
    bg: "bg-white/[0.03]",     border: "border-white/[0.08]",
    text: "text-white/50",     dot: "bg-white/30",
    label: "Surveiller",       labelBg: "bg-white/10 text-white/40",
  },
};

const ACTION_CFG: Record<CoachActionType, {
  Icon: React.ElementType; color: string; bg: string;
}> = {
  relance_client:        { Icon: Send,       color: "text-red-400",   bg: "bg-red-500/10"   },
  optimisation_planning: { Icon: Calendar,   color: "text-sky-400",   bg: "bg-sky-500/10"   },
  opportunite_revenu:    { Icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
};

const BADGE_CFG: Record<string, string> = {
  "Aujourd'hui":  "bg-red-500/15 text-red-400 border-red-500/20",
  "Cette semaine":"bg-amber-500/15 text-amber-400 border-amber-500/20",
  "À planifier":  "bg-white/8 text-white/40 border-white/10",
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400";

const SCORE_LABEL = (s: number) =>
  s >= 70 ? "Bonne santé" : s >= 45 ? "À améliorer" : "Attention requise";

/* ════════════════════════════════════════════════════════
   Mini-composants
════════════════════════════════════════════════════════ */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.04] ${className}`} />;
}

function Badge({ label, className = "" }: { label: string; className?: string }) {
  const base = BADGE_CFG[label] ?? "bg-white/8 text-white/40 border-white/10";
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${base} ${className}`}>
      {label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════
   Page principale
════════════════════════════════════════════════════════ */

export default function AssistantPage() {
  /* ── Data ── */
  const [notifs,  setNotifs]  = useState<NotificationsResponse | null>(null);
  const [radar,   setRadar]   = useState<RadarResponse          | null>(null);
  const [coach,   setCoach]   = useState<CoachResponse          | null>(null);

  /* ── Loading ── */
  const [loadingBase,  setLoadingBase]  = useState(true);
  const [loadingCoach, setLoadingCoach] = useState(true);

  /* ── Relance sheet ── */
  const [relanceItem,    setRelanceItem]    = useState<RadarItem      | null>(null);
  const [relanceLoading, setRelanceLoading] = useState(false);
  const [relanceMsg,     setRelanceMsg]     = useState<RelanceResponse | null>(null);
  const [copied,         setCopied]         = useState(false);

  /* ── Fetch base (radar + notifs, sans IA) ── */
  const fetchBase = useCallback(async () => {
    setLoadingBase(true);
    const [nRes, rRes] = await Promise.all([
      fetch("/api/assistant/notifications").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/assistant/radar").then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    setNotifs(nRes);
    setRadar(rRes);
    setLoadingBase(false);
  }, []);

  /* ── Fetch coach (IA) ── */
  const fetchCoach = useCallback(async () => {
    setLoadingCoach(true);
    setCoach(null);
    const res = await fetch("/api/assistant/coach", { method: "POST" })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
    setCoach(res);
    setLoadingCoach(false);
  }, []);

  /* ── Auto-load on mount ── */
  useEffect(() => {
    fetchBase();
    fetchCoach();
  }, [fetchBase, fetchCoach]);

  /* ── Ouvrir modale relance ── */
  const openRelance = useCallback(async (item: RadarItem) => {
    setRelanceItem(item);
    setRelanceMsg(null);
    setRelanceLoading(true);
    setCopied(false);

    const body: RelanceRequest = {
      type:        item.type,
      id:          item.id,
      client_name: item.client,
      reference:   item.reference,
      amount:      item.amount,
      days:        item.days,
    };

    const res = await fetch("/api/assistant/relance", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    }).then(r => r.ok ? r.json() : null).catch(() => null);

    setRelanceMsg(res);
    setRelanceLoading(false);
  }, []);

  /* ── Copier message ── */
  const copyMessage = useCallback(async () => {
    if (!relanceMsg) return;
    await navigator.clipboard.writeText(
      `Objet : ${relanceMsg.subject}\n\n${relanceMsg.message}`
    ).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_500);
  }, [relanceMsg]);

  /* ── Liens d'envoi rapide ── */
  const whatsappLink = (msg: RelanceResponse) =>
    `https://wa.me/?text=${encodeURIComponent(`${msg.subject}\n\n${msg.message}`)}`;

  const emailLink = (msg: RelanceResponse, email: string | null) =>
    `mailto:${email ?? ""}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.message)}`;

  const closeModal = () => { setRelanceItem(null); setRelanceMsg(null); };

  /* ── Données dérivées ── */
  const totalAtRisk   = radar?.total           ?? 0;
  const urgentCount   = notifs?.urgent_count   ?? 0;
  const radarItems    = radar?.items           ?? [];

  /* ══════════════════════════════════════════════
     Rendu
  ══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#09090f] text-white pb-24">

      {/* ─── Header sticky ─── */}
      <header className="sticky top-0 z-30 bg-[#09090f]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-sm font-bold">Assistant DJAMA</span>
          </div>

          <button
            onClick={() => { fetchBase(); fetchCoach(); }}
            disabled={loadingBase || loadingCoach}
            className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/55 transition-colors disabled:opacity-30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loadingBase || loadingCoach) ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* ═══════════════════════════════════════
            HERO — Total à risque
        ═══════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.04] to-transparent p-6">
          {/* Glow décoratif */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/50 mb-2">
            Argent à récupérer
          </p>

          {loadingBase ? (
            <Skeleton className="h-10 w-36 mb-3 bg-amber-500/10" />
          ) : (
            <p className="text-4xl sm:text-5xl font-black text-amber-400 leading-none mb-3 tabular-nums">
              {fmtEur(totalAtRisk)}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {!loadingBase && urgentCount > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {urgentCount} urgent{urgentCount > 1 ? "s" : ""}
              </span>
            )}
            {!loadingBase && radarItems.length > 0 && (
              <span className="text-[11px] text-white/30">
                {radarItems.length} dossier{radarItems.length > 1 ? "s" : ""} en attente
              </span>
            )}
            {loadingBase && <Skeleton className="h-6 w-28 bg-white/5" />}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            ACTIONS DU JOUR — Coach IA
        ═══════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
              Actions du jour
            </h2>
            {coach && !loadingCoach && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${SCORE_COLOR(coach.score)}`}>
                  {coach.score}/100
                </span>
                <span className={`text-[10px] ${SCORE_COLOR(coach.score)} opacity-60`}>
                  {SCORE_LABEL(coach.score)}
                </span>
              </div>
            )}
          </div>

          {/* Loading coach — animé avec texte */}
          {loadingCoach && (
            <div className="space-y-2.5">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/[0.06] border border-amber-500/15"
              >
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-400/70">
                  L'IA analyse votre activité...
                </p>
              </motion.div>
              {[80, 96, 88].map((w, i) => <Skeleton key={i} className={`h-20 w-[${w}%]`} />)}
            </div>
          )}

          {/* Erreur coach */}
          {!loadingCoach && !coach && (
            <button
              onClick={fetchCoach}
              className="w-full flex items-center justify-center gap-2 py-6 rounded-2xl border border-dashed border-white/10 text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Relancer l'analyse
            </button>
          )}

          {/* Résultats coach */}
          {coach && !loadingCoach && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2.5"
            >
              {/* Résumé */}
              <div className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <p className="text-sm text-white/65 leading-relaxed">{coach.resume}</p>
              </div>

              {/* 3 actions */}
              {coach.actions.map((action: CoachAction, i: number) => {
                const cfg  = ACTION_CFG[action.type] ?? ACTION_CFG.relance_client;
                const Icon = cfg.Icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icone */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold leading-tight">{action.title}</p>
                          <Badge label={action.badge ?? "Aujourd'hui"} className="flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed mb-2">
                          {action.description}
                        </p>
                        {action.impact && (
                          <p className={`text-xs font-semibold ${cfg.color}`}>
                            → {action.impact}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Insight */}
              {coach.insight && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-sky-500/[0.06] border border-sky-500/15"
                >
                  <Target className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-sky-300/70 leading-relaxed">{coach.insight}</p>
                </motion.div>
              )}

              {/* Score bar */}
              <div className="px-1 pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-white/20">Santé business</span>
                  <span className={`text-[10px] font-bold ${SCORE_COLOR(coach.score)}`}>
                    {coach.score}/100
                  </span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${coach.score}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className={`h-full rounded-full ${
                      coach.score >= 70 ? "bg-emerald-400" :
                      coach.score >= 45 ? "bg-amber-400"   : "bg-red-400"
                    }`}
                  />
                </div>
              </div>

            </motion.div>
          )}
        </section>

        {/* ═══════════════════════════════════════
            RADAR — Argent à récupérer
        ═══════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
              Argent à récupérer
            </h2>
            {!loadingBase && radarItems.length > 0 && (
              <span className="text-[11px] text-white/25">
                {radarItems.length} dossier{radarItems.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingBase ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[70px]" />)}
            </div>
          ) : radarItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 rounded-2xl border border-dashed border-white/8">
              <Check className="w-5 h-5 text-emerald-400" />
              <p className="text-sm text-white/30">Aucun argent perdu détecté 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {radarItems.map((item, i) => {
                const cfg = URGENCY_CFG[item.urgency];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-4 py-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}
                  >
                    {/* Dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${item.urgency === "critique" ? "animate-pulse" : ""}`} />

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-semibold truncate">{item.client}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.labelBg}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/30">
                        {item.type === "facture" ? "Facture" : "Devis"} {item.reference}
                        <span className="mx-1 text-white/15">·</span>
                        J+{item.days}
                      </p>
                    </div>

                    {/* Montant + CTA */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-base font-black tabular-nums ${cfg.text}`}>
                        {fmtEur(item.amount)}
                      </span>
                      <button
                        onClick={() => openRelance(item)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all border ${
                          item.urgency === "critique"
                            ? "bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25"
                            : "bg-white/[0.06] border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        Relancer
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Espace bas de page */}
        <div className="h-4" />
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODALE RELANCE (slide-up)
      ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {relanceItem && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={closeModal}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed bottom-0 inset-x-0 z-50 max-w-2xl mx-auto bg-[#111118] border-t border-white/[0.08] rounded-t-3xl px-5 pb-10 pt-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="w-9 h-1 bg-white/12 rounded-full mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">{relanceItem.client}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${URGENCY_CFG[relanceItem.urgency].labelBg}`}>
                      {URGENCY_CFG[relanceItem.urgency].label}
                    </span>
                  </div>
                  <p className="text-xs text-white/30">
                    {relanceItem.type === "facture" ? "Facture" : "Devis"} {relanceItem.reference}
                    <span className="mx-1">·</span>
                    <span className="font-semibold text-amber-400">{fmtEur(relanceItem.amount)}</span>
                    <span className="mx-1">·</span>
                    J+{relanceItem.days}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] flex-shrink-0"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>

              {/* ── Chargement ── */}
              {relanceLoading && (
                <div className="space-y-3">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-sm text-amber-400/70">Rédaction du message en cours...</p>
                  </motion.div>
                  <Skeleton className="h-10" />
                  <Skeleton className="h-36" />
                  <Skeleton className="h-12" />
                </div>
              )}

              {/* ── Message généré ── */}
              {relanceMsg && !relanceLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Objet */}
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-1.5">Objet</p>
                    <p className="text-sm font-semibold leading-snug">{relanceMsg.subject}</p>
                  </div>

                  {/* Corps */}
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-2">Message</p>
                    <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">
                      {relanceMsg.message}
                    </p>
                  </div>

                  {/* ── Boutons d'action ── */}
                  <div className="grid grid-cols-3 gap-2 pt-1">

                    {/* Copier */}
                    <button
                      onClick={copyMessage}
                      className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl font-medium text-xs transition-all border ${
                        copied
                          ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                          : "bg-white/[0.05] border-white/[0.08] text-white/60 hover:bg-white/[0.08]"
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copié !" : "Copier"}
                    </button>

                    {/* WhatsApp */}
                    <a
                      href={whatsappLink(relanceMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl font-medium text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>

                    {/* Email */}
                    <a
                      href={emailLink(relanceMsg, relanceItem.client_email)}
                      className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl font-medium text-xs bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  </div>

                  {/* Régénérer */}
                  <button
                    onClick={() => openRelance(relanceItem)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-white/25 hover:text-white/40 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Régénérer le message
                  </button>
                </motion.div>
              )}

              {/* ── Erreur ── */}
              {!relanceMsg && !relanceLoading && (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/30 mb-4">La génération a échoué.</p>
                  <button
                    onClick={() => openRelance(relanceItem)}
                    className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-white/[0.06] text-sm text-white/50 hover:bg-white/[0.09] transition-colors"
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
