"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BellRing, Plus, Trash2, Save, Loader2,
  Check, X, Mail, Clock, History, ToggleLeft, ToggleRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const GOLD = "#c9a55a";

interface RelanceConfig {
  enabled:    boolean;
  delays:     number[];
  email_cc:   string | null;
  updated_at?: string;
}

interface LogEntry {
  id:          string;
  document_id: string;
  delay_days:  number;
  sent_at:     string;
  documents:   { numero: string; client_nom: string } | null;
}

function relDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diff < 2)   return "à l'instant";
  if (diff < 60)  return `il y a ${diff} min`;
  if (diff < 1440) return `il y a ${Math.round(diff / 60)} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function toneLabel(days: number) {
  if (days >= 30) return { label: "Formel", color: "text-red-400" };
  if (days >= 15) return { label: "Ferme",  color: "text-amber-400" };
  return { label: "Amical", color: "text-emerald-400" };
}

export default function RelancesPage() {
  const { isDark } = useTheme();

  const [config,   setConfig]   = useState<RelanceConfig>({ enabled: false, delays: [7, 14, 30], email_cc: null });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [logData,  setLogData]  = useState<LogEntry[]>([]);
  const [toast,    setToast]    = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [dirty,    setDirty]    = useState(false);

  const bg  = isDark ? "bg-[#0f1117]"        : "bg-gray-50";
  const bg2 = isDark ? "bg-[#181c28]"        : "bg-white";
  const bd  = isDark ? "border-white/[0.07]" : "border-gray-200";
  const t1  = isDark ? "text-white"          : "text-gray-900";
  const t2  = isDark ? "text-white/70"       : "text-gray-600";
  const t3  = isDark ? "text-white/40"       : "text-gray-400";
  const inp = isDark
    ? "bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/20 focus:border-[rgba(201,165,90,0.4)]"
    : "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[rgba(201,165,90,0.5)]";

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/relances/config");
      const { config: cfg, log } = await res.json() as { config: RelanceConfig; log: LogEntry[] };
      setConfig(cfg);
      setLogData(log ?? []);
    } catch { showToast("err", "Impossible de charger la configuration"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function patch<K extends keyof RelanceConfig>(key: K, val: RelanceConfig[K]) {
    setConfig(c => ({ ...c, [key]: val }));
    setDirty(true);
  }

  function addDelay() {
    if (config.delays.length >= 5) return;
    const next = (config.delays[config.delays.length - 1] ?? 0) + 7;
    patch("delays", [...config.delays, next].sort((a, b) => a - b));
  }

  function removeDelay(idx: number) {
    const d = config.delays.filter((_, i) => i !== idx);
    patch("delays", d.length ? d : [7]);
  }

  function updateDelay(idx: number, val: string) {
    const n = parseInt(val, 10);
    if (isNaN(n) || n <= 0) return;
    const d = [...config.delays];
    d[idx] = n;
    patch("delays", d.sort((a, b) => a - b));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/relances/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled:  config.enabled,
          delays:   config.delays,
          email_cc: config.email_cc || null,
        }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      showToast("ok", "Configuration enregistrée");
    } catch { showToast("err", "Erreur lors de l'enregistrement"); }
    finally { setSaving(false); }
  }

  return (
    <div className={`flex h-screen flex-col overflow-hidden ${bg}`}>

      {/* ── Header ── */}
      <div className={`flex shrink-0 items-center justify-between border-b ${bd} ${isDark ? "bg-[#0f1117]/98" : "bg-white"} px-5 py-3 backdrop-blur`}>
        <Link href="/client/factures"
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${t2} transition hover:bg-white/[0.05]`}>
          <ArrowLeft size={14}/> Factures
        </Link>

        <div className="flex items-center gap-2">
          <BellRing size={14} style={{ color: GOLD }}/>
          <span className={`text-sm font-bold ${t1}`}>Relances automatiques</span>
        </div>

        <button onClick={() => void save()} disabled={!dirty || saving}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[0.72rem] font-bold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
          {saving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
          Enregistrer
        </button>
      </div>

      {/* ── Corps ── */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin" style={{ color: GOLD }}/>
          </div>
        ) : (
          <>
            {/* ── Activation ── */}
            <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-bold ${t1}`}>Relances automatiques IA</p>
                  <p className={`mt-1 text-xs ${t2}`}>
                    Chaque jour ouvré, DJAMA détecte les factures en retard et envoie automatiquement
                    un message de relance personnalisé via Claude.
                  </p>
                </div>
                <button onClick={() => patch("enabled", !config.enabled)}
                  className="mt-0.5 shrink-0 transition hover:opacity-80">
                  {config.enabled
                    ? <ToggleRight size={34} style={{ color: GOLD }}/>
                    : <ToggleLeft  size={34} className={t3}/>}
                </button>
              </div>

              {config.enabled && (
                <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Check size={11}/> Actif — relances envoyées automatiquement du lundi au vendredi à 9 h
                  </p>
                </div>
              )}
              {!config.enabled && (
                <div className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5">
                  <p className={`flex items-center gap-1.5 text-xs ${t3}`}>
                    <AlertCircle size={11}/> Désactivé — aucune relance ne sera envoyée
                  </p>
                </div>
              )}
            </div>

            {/* ── Seuils de relance ── */}
            <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold ${t1}`}>Calendrier de relance</p>
                  <p className={`mt-0.5 text-xs ${t2}`}>
                    Nombre de jours après l&apos;échéance pour chaque relance
                  </p>
                </div>
                {config.delays.length < 5 && (
                  <button onClick={addDelay}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${t2} border ${bd} transition hover:bg-white/[0.05]`}>
                    <Plus size={11}/> Ajouter
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {config.delays.map((d, i) => {
                  const tone = toneLabel(d);
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-xl border ${bd} px-4 py-3`}>
                      <span className={`w-16 text-xs font-semibold ${t3}`}>
                        {i === 0 ? "1re relance" : i === 1 ? "2e relance" : i === 2 ? "3e relance" : `${i + 1}e relance`}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${t3}`}>J+</span>
                        <input
                          type="number" min="1" max="365"
                          value={d}
                          onChange={e => updateDelay(i, e.target.value)}
                          className={`w-16 rounded-lg px-2 py-1 text-right text-sm font-semibold tabular-nums outline-none transition ${inp}`}
                        />
                        <span className={`text-xs ${t3}`}>jours</span>
                      </div>

                      <span className={`ml-auto text-[0.65rem] font-bold uppercase tracking-wider ${tone.color}`}>
                        {tone.label}
                      </span>

                      {config.delays.length > 1 && (
                        <button onClick={() => removeDelay(i)}
                          className="text-red-400/30 transition hover:text-red-400">
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className={`mt-3 text-[0.62rem] ${t3}`}>
                Ton adapté automatiquement : &lt;15j → amical · 15-29j → ferme · ≥30j → formel (mise en demeure)
              </p>
            </div>

            {/* ── Email CC ── */}
            <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
              <p className={`mb-1 text-sm font-bold ${t1}`}>Copie email (optionnel)</p>
              <p className={`mb-3 text-xs ${t2}`}>Recevez une copie de chaque relance envoyée</p>
              <div className={`flex items-center gap-2 rounded-xl border ${isDark ? "border-white/[0.1] bg-white/[0.04]" : "border-gray-200 bg-white"} px-3 py-2`}>
                <Mail size={13} className={t3}/>
                <input
                  type="email"
                  value={config.email_cc ?? ""}
                  onChange={e => patch("email_cc", e.target.value || null)}
                  placeholder="votre@email.com"
                  className={`flex-1 bg-transparent text-sm outline-none ${t1} placeholder:${t3}`}
                />
                {config.email_cc && (
                  <button onClick={() => patch("email_cc", null)} className={t3}>
                    <X size={12}/>
                  </button>
                )}
              </div>
            </div>

            {/* ── Historique ── */}
            <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
              <div className="mb-4 flex items-center gap-2">
                <History size={14} style={{ color: GOLD }}/>
                <p className={`text-sm font-bold ${t1}`}>
                  Historique des envois
                  {logData.length > 0 && (
                    <span className="ml-2 rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold"
                      style={{ background: "rgba(201,165,90,0.12)", color: GOLD }}>
                      {logData.length}
                    </span>
                  )}
                </p>
              </div>

              {logData.length === 0 ? (
                <div className="py-6 text-center">
                  <Clock size={28} className={`mx-auto mb-2 ${t3}`}/>
                  <p className={`text-xs ${t3}`}>Aucune relance envoyée pour le moment</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {logData.map(entry => {
                    const tone = toneLabel(entry.delay_days);
                    return (
                      <div key={entry.id}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isDark ? "hover:bg-white/[0.025]" : "hover:bg-gray-50"} transition`}>
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "rgba(201,165,90,0.12)" }}>
                          <Mail size={11} style={{ color: GOLD }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`truncate text-xs font-semibold ${t1}`}>
                            {entry.documents?.numero ?? "—"}
                            <span className={`ml-1.5 font-normal ${t2}`}>
                              · {entry.documents?.client_nom ?? "—"}
                            </span>
                          </p>
                          <p className={`text-[0.62rem] ${t3}`}>
                            Relance J+{entry.delay_days}
                          </p>
                        </div>
                        <span className={`text-[0.62rem] font-bold ${tone.color}`}>{tone.label}</span>
                        <span className={`text-[0.62rem] ${t3} whitespace-nowrap`}>{relDate(entry.sent_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-xl ${
              toast.type === "ok"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/15 text-red-400 border border-red-500/20"
            }`}>
            {toast.type === "ok" ? <Check size={13}/> : <X size={13}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
