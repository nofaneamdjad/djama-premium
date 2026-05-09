"use client";

/**
 * /client/assistant — Radar Argent Perdu · Relances
 *
 * Page dédiée : tous les dossiers à relancer, avec génération IA.
 * Le coaching (score + actions) est sur le dashboard principal.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import {
  Send, Copy, Check, X, RefreshCw, Sparkles,
  MessageCircle, Mail, AlertCircle, ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import type {
  RadarItem,      RadarResponse,
  RelanceRequest, RelanceResponse,
  UrgencyLevel,
} from "@/lib/assistant/types";
import { fmtEurInt } from "@/lib/format";

const URGENCY: Record<UrgencyLevel, {
  bg: string; border: string; text: string; dot: string;
  label: string; badge: string; ctaBg: string;
}> = {
  critique: {
    bg: "bg-red-500/[0.07]",    border: "border-red-500/25",
    text: "text-red-400",        dot: "bg-red-500",
    label: "Critique",           badge: "bg-red-500/15 text-red-400 border-red-500/20",
    ctaBg: "bg-red-500/15 border-red-500/25 text-red-300 hover:bg-red-500/25",
  },
  urgent: {
    bg: "bg-amber-500/[0.07]",  border: "border-amber-500/20",
    text: "text-amber-400",      dot: "bg-amber-400",
    label: "Urgent",             badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    ctaBg: "bg-amber-500/12 border-amber-500/20 text-amber-300 hover:bg-amber-500/22",
  },
  surveiller: {
    bg: "bg-white/[0.025]",     border: "border-white/[0.07]",
    text: "text-white/45",       dot: "bg-white/25",
    label: "Surveiller",         badge: "bg-white/8 text-white/40 border-white/10",
    ctaBg: "bg-white/6 border-white/10 text-white/50 hover:bg-white/10",
  },
};

/* ── Messages rapides sans IA ── */
const quickMsg = (item: RadarItem) => {
  const type = item.type === "facture" ? "facture" : "devis";
  return `Bonjour,\n\nJe vous relance concernant notre ${type} ${item.reference} d'un montant de ${fmtEurInt(item.amount)}.\n\nPourriez-vous me confirmer la prise en charge ?\n\nCordialement`;
};
const quickWa   = (item: RadarItem) =>
  `https://wa.me/?text=${encodeURIComponent(quickMsg(item))}`;
const quickMail = (item: RadarItem) =>
  `mailto:${item.client_email ?? ""}?subject=${encodeURIComponent(`Relance ${item.type === "facture" ? "facture" : "devis"} ${item.reference}`)}&body=${encodeURIComponent(quickMsg(item))}`;

/* ── Mini-composants ── */
function Sk({ h = "h-14" }: { h?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.04] ${h} w-full`} />;
}
function UrgentDot({ urgency }: { urgency: UrgencyLevel }) {
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${URGENCY[urgency].dot} ${urgency === "critique" ? "animate-pulse" : ""}`} />;
}

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
export default function RadarPage() {
  const [radar,         setRadar]         = useState<RadarResponse | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState(false);
  const [relanceItem,   setRelanceItem]   = useState<RadarItem | null>(null);
  const [relanceLoading,setRelanceLoading]= useState(false);
  const [relanceMsg,    setRelanceMsg]    = useState<RelanceResponse | null>(null);
  const [relanceError,  setRelanceError]  = useState(false);
  const [copied,        setCopied]        = useState(false);

  const fetchRadar = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/assistant/radar");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r: RadarResponse = await res.json();
      setRadar(r);
    } catch {
      setFetchError(true);
      setRadar(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRadar(); }, [fetchRadar]);

  const openRelance = useCallback(async (item: RadarItem) => {
    setRelanceItem(item);
    setRelanceMsg(null);
    setRelanceError(false);
    setRelanceLoading(true);
    setCopied(false);
    const body: RelanceRequest = {
      type: item.type, id: item.id, client_name: item.client,
      reference: item.reference, amount: item.amount, days: item.days,
    };
    try {
      const res = await fetch("/api/assistant/relance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RelanceResponse = await res.json();
      setRelanceMsg(data);
    } catch {
      setRelanceError(true);
    } finally {
      setRelanceLoading(false);
    }
  }, []);

  const copyMessage = useCallback(async () => {
    if (!relanceMsg) return;
    await navigator.clipboard.writeText(`Objet : ${relanceMsg.subject}\n\n${relanceMsg.message}`).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_500);
  }, [relanceMsg]);

  const closeModal = () => { setRelanceItem(null); setRelanceMsg(null); };
  const waLink   = (m: RelanceResponse) => `https://wa.me/?text=${encodeURIComponent(`${m.subject}\n\n${m.message}`)}`;
  const mailLink = (m: RelanceResponse, email: string | null) =>
    `mailto:${email ?? ""}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.message)}`;

  const items  = radar?.items ?? [];
  const total  = radar?.total ?? 0;
  const counts = { critique: 0, urgent: 0, surveiller: 0 };
  items.forEach(i => counts[i.urgency]++);

  return (
    <div className="min-h-screen bg-[#080a0f] text-white pb-28">

      {/* ── Sub-header ── */}
      <div className="border-b border-white/[0.06] bg-[rgba(10,11,16,0.92)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-sm" style={{ background: "#22d3ee30" }} />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{ backgroundColor: "#22d3ee14", borderColor: "#22d3ee28" }}>
                <Sparkles size={18} style={{ color: "#22d3ee" }} />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Assistant IA</h1>
              <p className="text-[0.65rem] text-white/30">Relances intelligentes · Radar argent perdu</p>
            </div>
          </div>
          <button
            onClick={fetchRadar} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* ── Résumé ── */}
        {!loading && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#0f1117] px-5 py-4"
          >
            <div>
              <p className="text-xl font-black text-white">{fmtEurInt(total)}</p>
              <p className="text-xs text-white/30 mt-0.5">{items.length} dossier{items.length > 1 ? "s" : ""} à traiter</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {counts.critique > 0 && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 font-bold">
                  {counts.critique} critique{counts.critique > 1 ? "s" : ""}
                </span>
              )}
              {counts.urgent > 0 && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 font-bold">
                  {counts.urgent} urgent{counts.urgent > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Liste ── */}
        {loading ? (
          <div className="space-y-2"><Sk /><Sk /><Sk h="h-12" /></div>
        ) : fetchError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/[0.15] bg-red-500/[0.04] py-16">
            <AlertCircle className="w-6 h-6 text-red-400/60" />
            <p className="text-sm text-white/40 font-semibold">Impossible de charger les données</p>
            <p className="text-xs text-white/20">Vérifiez votre connexion et réessayez.</p>
            <button onClick={fetchRadar} className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 hover:text-white/60 transition-colors">
              <RefreshCw className="w-3 h-3" /> Réessayer
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0f1117] py-16">
            <Check className="w-6 h-6 text-emerald-400" />
            <p className="text-sm text-white/25 font-semibold">Aucun argent perdu détecté</p>
            <p className="text-xs text-white/15">Toutes vos factures et devis sont à jour.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => {
              const u = URGENCY[item.urgency];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-2xl border p-4 ${u.bg} ${u.border}`}
                >
                  {/* Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <UrgentDot urgency={item.urgency} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{item.client}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${u.badge}`}>{u.label}</span>
                        </div>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {item.type === "facture" ? "Facture" : "Devis"} {item.reference} · J+{item.days}
                        </p>
                      </div>
                    </div>
                    <span className={`text-base font-black tabular-nums ${u.text}`}>
                      {fmtEurInt(item.amount)}
                    </span>
                  </div>

                  {/* Boutons d'action directe */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={quickWa(item)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/18 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={quickMail(item)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-sky-500/10 border border-sky-500/18 text-sky-400 hover:bg-sky-500/18 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                    <button
                      onClick={() => openRelance(item)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${u.ctaBg}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Rédiger avec l&apos;IA
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODALE RELANCE
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
              className="fixed bottom-0 inset-x-0 z-50 max-w-2xl mx-auto bg-[#0f1117] border-t border-x border-white/[0.07] rounded-t-[2rem] px-5 pb-10 pt-4 max-h-[90vh] overflow-y-auto shadow-[0_-24px_80px_rgba(0,0,0,0.7)]"
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
                    <span className="font-bold text-amber-400">{fmtEurInt(relanceItem.amount)}</span>
                    <span className="mx-1 opacity-40">·</span>J+{relanceItem.days}
                  </p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05]">
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
                    <p className="text-sm text-amber-400/60">Rédaction en cours...</p>
                  </motion.div>
                  <Sk h="h-11" /><Sk h="h-36" />
                </div>
              )}

              {relanceMsg && !relanceLoading && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="rounded-xl border border-white/[0.07] bg-[#0f1117] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/22 font-bold mb-1.5">Objet</p>
                    <p className="text-sm font-semibold">{relanceMsg.subject}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-[#0f1117] px-4 py-3">
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

              {relanceError && !relanceLoading && (
                <div className="text-center py-8">
                  <AlertCircle className="w-7 h-7 text-red-400/40 mx-auto mb-3" />
                  <p className="text-sm text-white/40 mb-1">La génération a échoué.</p>
                  <p className="text-xs text-white/20 mb-4">Vérifiez votre connexion et réessayez.</p>
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
