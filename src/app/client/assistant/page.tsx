"use client";

/**
 * /client/assistant — Tableau de bord Assistant DJAMA PRO
 *
 * Sections :
 *   1. Stats bar  — total à risque + alertes urgentes
 *   2. Alertes    — notifications actives (sans IA, rapide)
 *   3. Radar      — argent perdu : factures + devis, scorés + triés
 *   4. Coach      — analyse IA + 3 actions prioritaires (à la demande)
 *   5. Modale     — message de relance généré par IA (slide-up)
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import {
  AlertTriangle, TrendingUp, Calendar, RefreshCw,
  Send, Copy, Check, X, Zap, Target,
  DollarSign, Bell, BarChart3, Sparkles, Clock,
  ArrowRight,
} from "lucide-react";
import type {
  RadarItem,      RadarResponse,
  CoachResponse,  CoachAction,
  AppNotification, NotificationsResponse,
  RelanceRequest, RelanceResponse,
  UrgencyLevel,   NotifLevel,  CoachActionType,
} from "@/lib/assistant/types";

/* ════════════════════════════════════════════════════════
   Helpers
════════════════════════════════════════════════════════ */
const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/* ── Config visuelle par niveau d'urgence ── */
const URGENCY: Record<UrgencyLevel, {
  bg: string; border: string; text: string; dot: string; label: string;
}> = {
  critique:   { bg: "bg-red-500/10",   border: "border-red-500/30",   text: "text-red-400",   dot: "bg-red-500",   label: "Critique"   },
  urgent:     { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500", label: "Urgent"     },
  surveiller: { bg: "bg-sky-500/10",   border: "border-sky-500/30",   text: "text-sky-400",   dot: "bg-sky-400",   label: "Surveiller" },
};

/* ── Config visuelle par niveau de notif ── */
const NOTIF: Record<NotifLevel, {
  bg: string; border: string; text: string; Icon: React.ElementType;
}> = {
  urgent:    { bg: "bg-red-500/10",   border: "border-red-500/30",   text: "text-red-400",   Icon: AlertTriangle },
  important: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", Icon: Clock         },
  info:      { bg: "bg-sky-500/10",   border: "border-sky-500/30",   text: "text-sky-400",   Icon: Bell          },
};

/* ── Config visuelle par type d'action Coach ── */
const ACTION: Record<CoachActionType, {
  Icon: React.ElementType; color: string; bg: string; label: string;
}> = {
  relance_client:        { Icon: Send,       color: "text-red-400",   bg: "bg-red-500/10",   label: "Relance client"     },
  optimisation_planning: { Icon: Calendar,   color: "text-sky-400",   bg: "bg-sky-500/10",   label: "Planning"           },
  opportunite_revenu:    { Icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10", label: "Opportunité revenu" },
};

const URGENCY_BADGE: Record<string, string> = {
  haute:   "bg-red-500/15 text-red-400",
  moyenne: "bg-amber-500/15 text-amber-400",
  faible:  "bg-emerald-500/15 text-emerald-400",
};

/* ════════════════════════════════════════════════════════
   Composants internes
════════════════════════════════════════════════════════ */

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className ?? ""}`} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">
      {children}
    </h2>
  );
}

/* ════════════════════════════════════════════════════════
   Page principale
════════════════════════════════════════════════════════ */

export default function AssistantPage() {
  /* ── State données ── */
  const [notifs,  setNotifs]  = useState<NotificationsResponse | null>(null);
  const [radar,   setRadar]   = useState<RadarResponse          | null>(null);
  const [coach,   setCoach]   = useState<CoachResponse          | null>(null);

  /* ── State chargement ── */
  const [loadingBase,  setLoadingBase]  = useState(true);
  const [loadingCoach, setLoadingCoach] = useState(false);

  /* ── State modale relance ── */
  const [relanceItem,    setRelanceItem]    = useState<RadarItem      | null>(null);
  const [relanceLoading, setRelanceLoading] = useState(false);
  const [relanceMsg,     setRelanceMsg]     = useState<RelanceResponse | null>(null);
  const [copied,         setCopied]         = useState(false);

  /* ── Fetch initial (notifs + radar, pas de IA) ── */
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

  /* ── Analyse Coach (à la demande — appel IA) ── */
  const fetchCoach = useCallback(async () => {
    setLoadingCoach(true);
    setCoach(null);
    const res = await fetch("/api/assistant/coach", { method: "POST" })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
    setCoach(res);
    setLoadingCoach(false);
  }, []);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  /* ── Ouvrir modale + générer relance ── */
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
    const text = `Objet : ${relanceMsg.subject}\n\n${relanceMsg.message}`;
    await navigator.clipboard.writeText(text).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  }, [relanceMsg]);

  const closeModal = () => { setRelanceItem(null); setRelanceMsg(null); };

  /* ── Totaux ── */
  const totalAtRisk  = radar?.total           ?? 0;
  const urgentCount  = notifs?.urgent_count   ?? 0;
  const radarItems   = radar?.items           ?? [];
  const notifications = notifs?.notifications ?? [];

  /* ════════════════════════════════════════════════════
     Rendu
  ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#09090f] text-white pb-20">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#09090f]/90 backdrop-blur border-b border-white/[0.07]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Assistant DJAMA</h1>
              <p className="text-[11px] text-white/35">
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </p>
            </div>
          </div>

          <button
            onClick={fetchBase}
            disabled={loadingBase}
            className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/10 transition-colors disabled:opacity-40"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 text-white/50 ${loadingBase ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-7">

        {/* ══════════════════════════════════
            Stats bar
        ══════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total à risque */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-white/40 font-medium">À récupérer</span>
            </div>
            {loadingBase
              ? <Skeleton className="h-7 w-28" />
              : <p className="text-2xl font-black text-amber-400 leading-none">{fmtEur(totalAtRisk)}</p>
            }
          </div>

          {/* Alertes urgentes */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] text-white/40 font-medium">Alertes urgentes</span>
            </div>
            {loadingBase
              ? <Skeleton className="h-7 w-10" />
              : <p className="text-2xl font-black text-red-400 leading-none">{urgentCount}</p>
            }
          </div>
        </div>

        {/* ══════════════════════════════════
            Alertes actives
        ══════════════════════════════════ */}
        {!loadingBase && notifications.length > 0 && (
          <section>
            <SectionTitle>Alertes actives</SectionTitle>
            <div className="space-y-2">
              {notifications.map((n, i) => {
                const cfg = NOTIF[n.level];
                const Icon = cfg.Icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.text}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{n.title}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{n.description}</p>
                    </div>
                    {n.amount !== undefined && (
                      <span className={`text-sm font-bold flex-shrink-0 ${cfg.text}`}>
                        {fmtEur(n.amount)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════
            Radar argent perdu
        ══════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Radar argent perdu</SectionTitle>
            {!loadingBase && radarItems.length > 0 && (
              <span className="text-[11px] text-white/30">
                {radarItems.length} dossier{radarItems.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingBase ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[72px]" />)}
            </div>
          ) : radarItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 border border-dashed border-white/10 rounded-2xl">
              <Check className="w-5 h-5 text-emerald-400" />
              <p className="text-sm text-white/40">Aucun argent perdu détecté 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {radarItems.map((item, i) => {
                const cfg = URGENCY[item.urgency];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${cfg.bg} ${cfg.border}`}
                  >
                    {/* Dot urgence */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold leading-tight truncate">{item.client}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-medium flex-shrink-0 ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/35">
                        {item.type === "facture" ? "Facture" : "Devis"} {item.reference} · J+{item.days}
                      </p>
                    </div>

                    {/* Montant + bouton */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-base font-bold ${cfg.text}`}>
                        {fmtEur(item.amount)}
                      </span>
                      <button
                        onClick={() => openRelance(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-[11px] font-semibold transition-colors border border-white/10"
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

        {/* ══════════════════════════════════
            Coach Business (IA à la demande)
        ══════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Coach Business</SectionTitle>
            {coach && !loadingCoach && (
              <button
                onClick={fetchCoach}
                className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/50 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Relancer
              </button>
            )}
          </div>

          {/* CTA initial */}
          {!coach && !loadingCoach && (
            <motion.button
              onClick={fetchCoach}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-8 border border-dashed border-white/15 rounded-2xl flex flex-col items-center gap-3 hover:border-amber-500/30 hover:bg-amber-500/[0.04] transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <BarChart3 className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white/60 group-hover:text-white/80 transition-colors">
                  Lancer l'analyse business
                </p>
                <p className="text-xs text-white/25 mt-1 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  L'IA analyse vos données et propose 3 actions prioritaires
                </p>
              </div>
            </motion.button>
          )}

          {/* Skeleton chargement IA */}
          {loadingCoach && (
            <div className="space-y-3">
              <div className="h-14 rounded-xl bg-amber-500/5 border border-amber-500/10 animate-pulse" />
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          )}

          {/* Résultat */}
          {coach && !loadingCoach && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Résumé + score */}
              <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <p className="flex-1 text-sm font-medium text-amber-50/90 leading-relaxed">
                    {coach.resume}
                  </p>
                  <div className="flex-shrink-0 text-center">
                    <div className="text-3xl font-black text-amber-400 leading-none">{coach.score}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">score</div>
                  </div>
                </div>
                {/* Barre de score */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${coach.score}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-300 rounded-full"
                  />
                </div>
              </div>

              {/* 3 actions */}
              {coach.actions.map((action: CoachAction, i: number) => {
                const cfg  = ACTION[action.type] ?? ACTION.relance_client;
                const Icon = cfg.Icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] text-white/25 font-mono">#{action.priority}</span>
                          <p className="text-sm font-semibold leading-tight">{action.title}</p>
                          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${URGENCY_BADGE[action.urgency] ?? ""}`}>
                            {action.urgency}
                          </span>
                        </div>
                        <p className="text-xs text-white/45 leading-relaxed">{action.description}</p>
                        {action.impact && (
                          <p className="text-xs text-amber-400/80 mt-2 font-medium">
                            💡 {action.impact}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Insight */}
              {coach.insight && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-sky-500/[0.07] border border-sky-500/20 rounded-xl">
                  <Target className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <p className="text-xs text-sky-200/80 leading-relaxed">{coach.insight}</p>
                </div>
              )}

              {/* Méta */}
              <p className="text-[10px] text-white/20 text-center">
                Analyse générée à {new Date(coach.meta.generated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </motion.div>
          )}
        </section>

      </div>

      {/* ════════════════════════════════════════════════════
          Modale Relance (slide-up)
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {relanceItem && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40"
              onClick={closeModal}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto bg-[#131320] border-t border-white/10 rounded-t-3xl px-5 pb-8 pt-4 max-h-[88vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />

              {/* Header modale */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-bold leading-tight">
                    Relance — {relanceItem.client}
                  </h3>
                  <p className="text-xs text-white/35 mt-0.5">
                    {relanceItem.type === "facture" ? "Facture" : "Devis"}{" "}
                    {relanceItem.reference} · {fmtEur(relanceItem.amount)} · J+{relanceItem.days}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chargement */}
              {relanceLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-36" />
                  <Skeleton className="h-11" />
                </div>
              )}

              {/* Message généré */}
              {relanceMsg && !relanceLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Objet */}
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
                    <p className="text-[11px] text-white/35 mb-1 font-medium">OBJET</p>
                    <p className="text-sm font-semibold">{relanceMsg.subject}</p>
                  </div>

                  {/* Corps */}
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
                    <p className="text-[11px] text-white/35 mb-2 font-medium">MESSAGE</p>
                    <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
                      {relanceMsg.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={copyMessage}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                        copied
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25"
                      }`}
                    >
                      {copied
                        ? <><Check className="w-4 h-4" /> Copié !</>
                        : <><Copy className="w-4 h-4" /> Copier le message</>
                      }
                    </button>
                    <button
                      onClick={() => openRelance(relanceItem)}
                      className="px-4 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/10 transition-colors border border-white/10"
                      title="Régénérer"
                    >
                      <RefreshCw className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Erreur génération */}
              {!relanceMsg && !relanceLoading && (
                <div className="text-center py-6">
                  <p className="text-sm text-white/40 mb-3">Erreur lors de la génération.</p>
                  <button
                    onClick={() => openRelance(relanceItem)}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-white/8 text-sm text-white/60 hover:bg-white/12 transition-colors"
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
