"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Euro,
  Download, ChevronRight, ChevronUp, ArrowUpRight, ArrowDownRight,
  Percent, Calendar, FileText, RefreshCw, BookMarked, Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;

const DarkCtx = createContext(true);
const useDark = () => useContext(DarkCtx);

interface JournalLine {
  date: string;
  libelle: string;
  debit: number;
  credit: number;
  compte: string;
}

interface TVARow {
  label: string;
  base: number;
  tva: number;
  taux: number;
}

export default function ComptabilitePage() {
  const { isDark } = useTheme();
  const [loading, setLoading]     = useState(true);
  const [period,  setPeriod]      = useState<"month" | "quarter" | "year">("month");

  const [caHT,    setCaHT]        = useState(0);
  const [caTTC,   setCaTTC]       = useState(0);
  const [charges, setCharges]     = useState(0);
  const [tvaCollectee, setTvaCollectee] = useState(0);
  const [tvaDeductible, setTvaDeductible] = useState(0);
  const [journal, setJournal]     = useState<JournalLine[]>([]);
  const [tvaRows, setTvaRows]     = useState<TVARow[]>([]);
  const [showAll, setShowAll]     = useState(false);

  function getPeriodRange(p: "month" | "quarter" | "year") {
    const now = new Date();
    const y   = now.getFullYear();
    const m   = now.getMonth();
    if (p === "month") {
      const start = new Date(y, m, 1).toISOString().slice(0, 10);
      const end   = new Date(y, m + 1, 0).toISOString().slice(0, 10);
      return { start, end, label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) };
    }
    if (p === "quarter") {
      const q     = Math.floor(m / 3);
      const start = new Date(y, q * 3, 1).toISOString().slice(0, 10);
      const end   = new Date(y, q * 3 + 3, 0).toISOString().slice(0, 10);
      return { start, end, label: `T${q + 1} ${y}` };
    }
    return { start: `${y}-01-01`, end: `${y}-12-31`, label: `Année ${y}` };
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { start, end } = getPeriodRange(period);

      const [facRes, expRes] = await Promise.all([
        supabase.from("documents")
          .select("montant_ht, montant_tva, montant_ttc, date_emission, client_nom, numero, statut")
          .eq("user_id", user.id)
          .eq("type", "facture")
          .gte("date_emission", start)
          .lte("date_emission", end)
          .order("date_emission", { ascending: false }),
        supabase.from("expenses")
          .select("amount, description, date, category")
          .eq("user_id", user.id)
          .gte("date", start)
          .lte("date", end)
          .order("date", { ascending: false }),
      ]);

      const facs = facRes.data ?? [];
      const exps = expRes.data ?? [];

      const totalHT  = facs.reduce((s, f) => s + (f.montant_ht  ?? 0), 0);
      const totalTTC = facs.reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const totalTVA = facs.reduce((s, f) => s + (f.montant_tva ?? 0), 0);
      const totalExp = exps.reduce((s, e) => s + (e.amount ?? 0), 0);

      setCaHT(totalHT);
      setCaTTC(totalTTC);
      setTvaCollectee(totalTVA);
      setTvaDeductible(0);
      setCharges(totalExp);

      const lines: JournalLine[] = [
        ...facs.map(f => ({
          date: f.date_emission,
          libelle: `Facture ${f.numero ?? ""} — ${f.client_nom ?? "Client"}`,
          debit: 0,
          credit: f.montant_ht ?? 0,
          compte: "706",
        })),
        ...exps.map(e => ({
          date: e.date,
          libelle: e.description ?? e.category ?? "Charge",
          debit: e.amount ?? 0,
          credit: 0,
          compte: "60x",
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date));

      setJournal(lines);

      const tva20 = facs.filter(f => {
        const ht  = f.montant_ht ?? 0;
        const tva = f.montant_tva ?? 0;
        return ht > 0 && Math.round((tva / ht) * 100) === 20;
      });
      const tva10 = facs.filter(f => {
        const ht  = f.montant_ht ?? 0;
        const tva = f.montant_tva ?? 0;
        return ht > 0 && Math.round((tva / ht) * 100) === 10;
      });
      setTvaRows([
        { label: "TVA 20%", base: tva20.reduce((s, f) => s + (f.montant_ht ?? 0), 0), tva: tva20.reduce((s, f) => s + (f.montant_tva ?? 0), 0), taux: 20 },
        { label: "TVA 10%", base: tva10.reduce((s, f) => s + (f.montant_ht ?? 0), 0), tva: tva10.reduce((s, f) => s + (f.montant_tva ?? 0), 0), taux: 10 },
      ].filter(r => r.base > 0));

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const resultat     = caHT - charges;
  const tvaSolde     = tvaCollectee - tvaDeductible;
  const { label: periodLabel } = getPeriodRange(period);

  function exportCSV() {
    const rows = [
      ["Date", "Compte", "Libellé", "Débit (€)", "Crédit (€)"],
      ...journal.map(l => [l.date, l.compte, l.libelle, l.debit || "", l.credit || ""]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `journal-comptable-${periodLabel.replace(/ /g, "-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const kpis = [
    { label: "CA HT",    value: caHT,    color: "#16a34a", icon: TrendingUp,   bgD: "rgba(34,197,94,0.08)",   bgL: "rgba(34,197,94,0.10)",   borderD: "rgba(34,197,94,0.18)",   borderL: "rgba(34,197,94,0.25)" },
    { label: "Charges",  value: charges, color: "#dc2626", icon: TrendingDown, bgD: "rgba(248,113,113,0.08)", bgL: "rgba(248,113,113,0.10)", borderD: "rgba(248,113,113,0.18)", borderL: "rgba(248,113,113,0.25)" },
    { label: "Résultat", value: resultat,color: resultat >= 0 ? "#16a34a" : "#dc2626", icon: Euro, bgD: "rgba(99,102,241,0.08)", bgL: "rgba(99,102,241,0.08)", borderD: "rgba(99,102,241,0.18)", borderL: "rgba(99,102,241,0.22)" },
  ];

  return (
    <DarkCtx.Provider value={isDark}>
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-5 pb-3"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, #07080e 85%, transparent)"
            : "linear-gradient(to bottom, #f0f2f5 85%, transparent)",
          backdropFilter: "blur(8px)"
        }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={BookMarked} color="#0891b2" />
            <div>
              <h1 className={`text-[17px] font-black ${isDark ? "text-white" : "text-gray-900"}`}>Comptabilité</h1>
              <p className={`text-[10px] ${isDark ? "text-white/35" : "text-gray-400"}`}>{periodLabel}</p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            disabled={journal.length === 0}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition ${isDark ? "text-white/60 hover:text-white/80 disabled:opacity-30" : "text-gray-500 hover:text-gray-700 disabled:opacity-30"}`}
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)"
            }}
          >
            <Download size={12} /> Exporter
          </button>
        </motion.div>

        {/* Sélecteur période */}
        <div className="mt-3 flex gap-1.5">
          {(["month", "quarter", "year"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
              style={period === p
                ? { background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.35)", color: "#0ea5e9" }
                : isDark
                  ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                  : { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.4)" }
              }
            >
              {p === "month" ? "Mois" : p === "quarter" ? "Trimestre" : "Année"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-5 pt-2">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease }}
                className="rounded-2xl p-3.5"
                style={{ background: isDark ? k.bgD : k.bgL, border: `1px solid ${isDark ? k.borderD : k.borderL}` }}
              >
                <Icon size={14} style={{ color: k.color }} className="mb-2" />
                {loading ? (
                  <div className="h-5 w-16 rounded animate-pulse mb-1"
                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }} />
                ) : (
                  <p className="text-[15px] font-black tabular-nums leading-tight" style={{ color: k.color }}>
                    {fmtEurInt(k.value)}
                  </p>
                )}
                <p className={`text-[9px] font-semibold mt-0.5 uppercase tracking-wide ${isDark ? "text-white/30" : "text-gray-500"}`}>{k.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* TVA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.15, ease }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
            border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)"
          }}
        >
          <div className="flex items-center gap-2 px-4 pt-4 pb-3">
            <Percent size={13} style={{ color: "#0ea5e9" }} />
            <h2 className={`text-[12px] font-bold ${isDark ? "text-white/70" : "text-gray-700"}`}>Déclaration TVA</h2>
          </div>

          {loading ? (
            <div className="px-4 pb-4 space-y-2">
              {[0, 1].map(i => (
                <div key={i} className="h-8 rounded-xl animate-pulse"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
              ))}
            </div>
          ) : (
            <div>
              <div className="px-4 pb-2 space-y-1.5">
                {tvaRows.length > 0 ? tvaRows.map(row => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{
                      background: isDark ? "rgba(14,165,233,0.06)" : "rgba(14,165,233,0.07)",
                      border: isDark ? "1px solid rgba(14,165,233,0.12)" : "1px solid rgba(14,165,233,0.18)"
                    }}>
                    <div>
                      <p className={`text-[11px] font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{row.label}</p>
                      <p className={`text-[9.5px] ${isDark ? "text-white/30" : "text-gray-400"}`}>Base {fmtEurInt(row.base)}</p>
                    </div>
                    <p className="text-[13px] font-black" style={{ color: "#0ea5e9" }}>{fmtEurInt(row.tva)}</p>
                  </div>
                )) : (
                  <p className={`text-[11px] text-center py-3 ${isDark ? "text-white/25" : "text-gray-400"}`}>Aucune facture sur la période</p>
                )}
              </div>

              {/* Solde TVA */}
              <div className="mx-4 mb-4 mt-1 rounded-xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: tvaSolde >= 0 ? "rgba(239,68,68,0.07)" : "rgba(34,197,94,0.07)",
                  border: `1px solid ${tvaSolde >= 0 ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)"}`
                }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: tvaSolde >= 0 ? "#dc2626" : "#16a34a" }}>
                    {tvaSolde >= 0 ? "TVA à payer" : "Crédit de TVA"}
                  </p>
                  <p className={`text-[9px] ${isDark ? "text-white/25" : "text-gray-400"}`}>Collectée {fmtEurInt(tvaCollectee)} − Déductible {fmtEurInt(tvaDeductible)}</p>
                  {tvaDeductible === 0 && tvaCollectee > 0 && (
                    <p className={`text-[8.5px] flex items-center gap-0.5 mt-0.5 ${isDark ? "text-white/18" : "text-gray-300"}`}><Info size={8} />TVA déductible non encore renseignée</p>
                  )}
                </div>
                <p className="text-[16px] font-black tabular-nums" style={{ color: tvaSolde >= 0 ? "#dc2626" : "#16a34a" }}>
                  {fmtEurInt(Math.abs(tvaSolde))}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Compte de résultat simplifié */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.2, ease }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
            border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)"
          }}
        >
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <FileText size={13} style={{ color: "#a78bfa" }} />
            <h2 className={`text-[12px] font-bold ${isDark ? "text-white/70" : "text-gray-700"}`}>Compte de résultat</h2>
          </div>

          {[
            { label: "Chiffre d'affaires HT", value: caHT,    sign: "+", color: "#16a34a" },
            { label: "Charges déductibles",   value: charges, sign: "−", color: "#dc2626" },
          ].map((row, i) => (
            <div key={row.label}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: i > 0 ? isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.05)" : undefined }}>
              <p className={`text-[11.5px] ${isDark ? "text-white/55" : "text-gray-500"}`}>{row.label}</p>
              <p className="text-[13px] font-bold tabular-nums" style={{ color: row.color }}>
                {loading ? "—" : `${row.sign} ${fmtEurInt(row.value)}`}
              </p>
            </div>
          ))}

          <div className="mx-4 mb-4 mt-2 flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: resultat >= 0 ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
              border: `1px solid ${resultat >= 0 ? "rgba(34,197,94,0.20)" : "rgba(248,113,113,0.20)"}`,
            }}>
            <p className={`text-[12px] font-black ${isDark ? "text-white/80" : "text-gray-800"}`}>Résultat net</p>
            <p className="text-[17px] font-black tabular-nums" style={{ color: resultat >= 0 ? "#16a34a" : "#dc2626" }}>
              {loading ? "—" : fmtEurInt(resultat)}
            </p>
          </div>
        </motion.div>

        {/* Journal comptable */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.25, ease }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
            border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)"
          }}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Calendar size={13} style={{ color: "#fbbf24" }} />
              <h2 className={`text-[12px] font-bold ${isDark ? "text-white/70" : "text-gray-700"}`}>Journal des opérations</h2>
            </div>
            <span className={`text-[9.5px] font-bold tabular-nums ${isDark ? "text-white/20" : "text-gray-300"}`}>{journal.length}</span>
          </div>

          {loading ? (
            <div className="px-4 pb-4 space-y-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-xl animate-pulse"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
              ))}
            </div>
          ) : journal.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <RefreshCw size={22} className={isDark ? "text-white/15" : "text-gray-300"} />
              <p className={`text-[11px] ${isDark ? "text-white/25" : "text-gray-400"}`}>Aucune opération sur la période</p>
            </div>
          ) : (
            <div className="pb-2">
              {(showAll ? journal : journal.slice(0, 5)).map((line, i) => (
                <div key={i}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderTop: i > 0 ? isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.05)" : undefined }}>
                  <div className="shrink-0 w-9 text-center rounded-lg py-1"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                    <p className={`text-[8.5px] font-bold ${isDark ? "text-white/35" : "text-gray-400"}`}>{line.compte}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-semibold truncate ${isDark ? "text-white/70" : "text-gray-700"}`}>{line.libelle}</p>
                    <p className={`text-[9px] ${isDark ? "text-white/25" : "text-gray-400"}`}>
                      {new Date(line.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {line.credit > 0 ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <ArrowUpRight size={11} className="text-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-500 tabular-nums">{fmtEurInt(line.credit)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <ArrowDownRight size={11} className="text-red-500" />
                      <span className="text-[11px] font-bold text-red-500 tabular-nums">{fmtEurInt(line.debit)}</span>
                    </div>
                  )}
                </div>
              ))}

              {journal.length > 5 && (
                <div className="px-4 pt-1 pb-1">
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className={`flex w-full items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition ${isDark ? "text-white/35 hover:text-white/55" : "text-gray-400 hover:text-gray-600"}`}
                    style={{ border: isDark ? "1px dashed rgba(255,255,255,0.08)" : "1px dashed rgba(0,0,0,0.12)" }}>
                    {showAll ? <>Réduire <ChevronUp size={11} /></> : <>Voir tout ({journal.length}) <ChevronRight size={11} /></>}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

      </div>
    </div>
    </DarkCtx.Provider>
  );
}
