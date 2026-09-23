"use client";

import { useState, useEffect, createContext } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Euro,
  Download, ChevronRight, ChevronUp, ArrowUpRight, ArrowDownRight,
  Percent, Calendar, FileText, RefreshCw, BookMarked,
  Sparkles, Loader2, RefreshCcw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";
import type { AccountingPdfData } from "@/lib/pdf/generateAccountingPdf";

const ease = [0.22, 1, 0.36, 1] as const;

const DarkCtx = createContext(true);

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
  const [charges, setCharges]     = useState(0);
  const [tvaCollectee, setTvaCollectee] = useState(0);
  const [tvaDeductible, setTvaDeductible] = useState(0);
  const [journal, setJournal]     = useState<JournalLine[]>([]);
  const [tvaRows, setTvaRows]     = useState<TVARow[]>([]);
  const [showAll,        setShowAll]        = useState(false);
  const [analyse,        setAnalyse]        = useState("");
  const [analyseLoading, setAnalyseLoading] = useState(false);
  const [syncLoading,    setSyncLoading]    = useState(false);
  const [syncResult,     setSyncResult]     = useState<{ created: number; skipped: number } | null>(null);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [fecLoading,     setFecLoading]     = useState(false);
  const [hasData,        setHasData]        = useState(false);
  const [orgId,          setOrgId]          = useState<string | null>(null);

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

  // Correspondance compte TVA → taux (pour reconstruire la ventilation depuis le journal)
  const TVA_ACCOUNT_RATE: Record<string, number> = {
    "44571": 20, "44572": 10, "44573": 5.5, "44574": 2.1, "4457": 0,
  };
  const RATE_LABELS: Record<number, string> = {
    20: "TVA 20%", 10: "TVA 10%", 5.5: "TVA 5,5%", 2.1: "TVA 2,1%", 0: "TVA 0%",
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer l'org_id une seule fois (conservé dans le state pour FEC et sync)
      const { data: memberRows } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .is("suspended_at", null)
        .limit(1);
      const currentOrgId: string | null = memberRows?.[0]?.organization_id ?? null;
      setOrgId(currentOrgId);

      setLoading(true);
      const { start, end } = getPeriodRange(period);

      // ── Source unique de vérité : journal_entry_lines ────────────────────────
      // RPC get_kpis_from_journal agrège CA HT, Charges, TVA depuis les écritures.
      // has_data=false si aucune écriture pour la période → invite à synchroniser.
      const [kpisRes, tvaRes, journalRes] = await Promise.all([
        supabase.rpc("get_kpis_from_journal", {
          p_user_id: user.id,
          p_org_id:  currentOrgId,
          p_start:   start,
          p_end:     end,
        }),
        supabase.rpc("get_tva_breakdown_from_journal", {
          p_user_id: user.id,
          p_org_id:  currentOrgId,
          p_start:   start,
          p_end:     end,
        }),
        supabase.rpc("get_journal_lines", {
          p_user_id: user.id,
          p_org_id:  currentOrgId,
          p_start:   start,
          p_end:     end,
          p_limit:   500,
        }),
      ]);

      // ── KPIs depuis le journal ───────────────────────────────────────────────
      const kRow = (kpisRes.data as Array<{
        ca_ht: number; tva_collectee: number; charges_ht: number;
        tva_deductible: number; resultat: number; has_data: boolean;
      }>)?.[0];

      if (kRow) {
        setCaHT(kRow.ca_ht ?? 0);
        setCharges(kRow.charges_ht ?? 0);
        setTvaCollectee(kRow.tva_collectee ?? 0);
        setTvaDeductible(kRow.tva_deductible ?? 0);
        setHasData(kRow.has_data ?? false);
      } else {
        setCaHT(0); setCharges(0); setTvaCollectee(0); setTvaDeductible(0);
        setHasData(false);
      }

      // ── Ventilation TVA par taux depuis les comptes PCG ──────────────────────
      const tvaRaw = (tvaRes.data as Array<{
        account_code: string; account_label: string; net_amount: number;
      }>) ?? [];

      setTvaRows(
        tvaRaw
          .filter(r => r.account_code !== "44566" && Math.abs(r.net_amount) > 0.01)
          .map(r => {
            const rate = TVA_ACCOUNT_RATE[r.account_code] ?? 0;
            const tva  = r.net_amount;
            const base = rate > 0 ? tva / (rate / 100) : 0;
            return {
              label: RATE_LABELS[rate] ?? `TVA ${rate}%`,
              base,
              tva,
              taux: rate,
            };
          })
          .sort((a, b) => b.taux - a.taux)
      );

      // ── Journal des opérations depuis journal_entry_lines ────────────────────
      const journalRaw = (journalRes.data as Array<{
        date: string; description: string; reference: string;
        account_code: string; account_label: string; debit: number; credit: number;
      }>) ?? [];

      setJournal(
        journalRaw.map(r => ({
          date:    r.date,
          libelle: r.description || r.reference || r.account_label,
          debit:   r.debit,
          credit:  r.credit,
          compte:  r.account_code,
        }))
      );

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const resultat     = caHT - charges;
  const tvaSolde     = tvaCollectee - tvaDeductible;
  const { label: periodLabel } = getPeriodRange(period);

  // Export FEC — Fichier des Écritures Comptables (Art. A. 47 A-1 LPF)
  // Format conforme double entrée : lit journal_entries + journal_entry_lines
  // Une écriture (EcritureNum) = plusieurs lignes (411, 706, 4457x) équilibrées.
  async function exportFEC() {
    setFecLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { start, end } = getPeriodRange(period);

      // Récupérer toutes les écritures de la période
      const { data: entries, error: entriesErr } = await supabase
        .from("journal_entries")
        .select("id, date, journal, reference, description")
        .or(orgId ? `user_id.eq.${user.id},organization_id.eq.${orgId}` : `user_id.eq.${user.id}`)
        .gte("date", start)
        .lte("date", end)
        .neq("status", "draft")
        .order("date", { ascending: true });

      if (entriesErr || !entries?.length) {
        alert("Aucune écriture comptable pour cette période. Lancez une synchronisation d'abord.");
        return;
      }

      const entryIds = entries.map(e => e.id);

      // Récupérer toutes les lignes de ces écritures
      const { data: lines, error: linesErr } = await supabase
        .from("journal_entry_lines")
        .select("entry_id, account_code, account_label, debit, credit, description")
        .in("entry_id", entryIds)
        .order("entry_id");

      if (linesErr || !lines) {
        alert("Erreur lors de la récupération des lignes d'écriture.");
        return;
      }

      // Grouper les lignes par entry_id
      const linesByEntry = lines.reduce<Record<string, typeof lines>>((acc, l) => {
        if (!acc[l.entry_id]) acc[l.entry_id] = [];
        acc[l.entry_id].push(l);
        return acc;
      }, {});

      const JOURNAL_LIB: Record<string, string> = {
        VTE: "Ventes", ACH: "Achats", BNQ: "Banque",
        CAI: "Caisse", SAL: "Salaires", GEN: "Général", OD: "Opérations diverses",
      };
      const fmtDate = (d: string) => d.replace(/-/g, "");
      const fmtAmt  = (n: number) => (n ?? 0).toFixed(2);
      const esc     = (s: string) => (s ?? "").replace(/\|/g, " ");

      const HEADER = [
        "JournalCode","JournalLib","EcritureNum","EcritureDate",
        "CompteNum","CompteLib","CompAuxNum","CompAuxLib",
        "PieceRef","PieceDate","EcritureLib",
        "Debit","Credit",
        "EcritureLet","DateLet","ValidDate","Montantdevise","Idevise",
      ].join("|");

      const rows: string[] = [];
      let ecritureNum = 1;

      for (const entry of entries) {
        const entryLines = linesByEntry[entry.id] ?? [];
        const numStr = String(ecritureNum).padStart(6, "0");
        const jLib   = JOURNAL_LIB[entry.journal] ?? entry.journal;

        for (const line of entryLines) {
          rows.push([
            esc(entry.journal),
            esc(jLib),
            numStr,
            fmtDate(entry.date),
            esc(line.account_code),
            esc(line.account_label),
            "",
            "",
            esc(entry.reference),
            fmtDate(entry.date),
            esc(entry.description || entry.reference),
            fmtAmt(line.debit),
            fmtAmt(line.credit),
            "",
            "",
            fmtDate(entry.date),
            "",
            "",
          ].join("|"));
        }
        ecritureNum++;
      }

      const content = [HEADER, ...rows].join("\r\n");
      const blob = new Blob(["﻿" + content], { type: "text/plain;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `FEC_${periodLabel.replace(/ /g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("FEC export failed:", err);
    } finally {
      setFecLoading(false);
    }
  }

  async function exportPDF() {
    setPdfLoading(true);
    try {
      const { generateAccountingPdf } = await import("@/lib/pdf/generateAccountingPdf");
      const pdfData: AccountingPdfData = {
        period:        periodLabel,
        caHT,
        charges,
        resultat,
        tvaCollectee,
        tvaDeductible,
        tvaSolde,
        tvaRows,
        journal,
        analyse:       analyse || undefined,
      };
      await generateAccountingPdf(pdfData);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setPdfLoading(false);
  }

  async function syncJournal() {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const { start, end } = getPeriodRange(period);
      const res = await fetch("/api/comptabilite/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, end }),
      });
      const data = await res.json() as { created?: number; skipped?: number };
      setSyncResult({ created: data.created ?? 0, skipped: data.skipped ?? 0 });
    } catch {
      setSyncResult(null);
    }
    setSyncLoading(false);
  }

  async function analyseFinances() {
    setAnalyseLoading(true);
    setAnalyse("");
    try {
      const res = await fetch("/api/comptabilite/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caHT, charges, resultat, tvaCollectee, tvaDeductible, period: periodLabel }),
      });
      const data = await res.json() as { analyse?: string };
      if (data.analyse) setAnalyse(data.analyse);
    } catch {}
    setAnalyseLoading(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={syncJournal}
              disabled={syncLoading}
              title="Synchroniser les écritures dans le journal comptable"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition ${isDark ? "text-white/60 hover:text-white/80 disabled:opacity-30" : "text-gray-500 hover:text-gray-700 disabled:opacity-30"}`}
              style={{
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)"
              }}
            >
              {syncLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
              {syncResult ? `+${syncResult.created}` : "Sync"}
            </button>
            <button
              onClick={exportPDF}
              disabled={pdfLoading || loading || (caHT === 0 && charges === 0)}
              title="Exporter le rapport comptable en PDF"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition ${isDark ? "text-white/60 hover:text-white/80 disabled:opacity-30" : "text-gray-500 hover:text-gray-700 disabled:opacity-30"}`}
              style={{
                background: isDark ? "rgba(201,165,90,0.10)" : "rgba(201,165,90,0.12)",
                border: isDark ? "1px solid rgba(201,165,90,0.25)" : "1px solid rgba(201,165,90,0.30)"
              }}
            >
              {pdfLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              <span style={{ color: "#c9a55a" }}>PDF</span>
            </button>
            <button
              onClick={() => { void exportFEC(); }}
              disabled={!hasData || fecLoading}
              title="Exporter au format FEC (Fichier des Écritures Comptables — double entrée)"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition ${isDark ? "text-white/60 hover:text-white/80 disabled:opacity-30" : "text-gray-500 hover:text-gray-700 disabled:opacity-30"}`}
              style={{
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)"
              }}
            >
              {fecLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} FEC
            </button>
          </div>
        </motion.div>

        {/* Sélecteur période */}
        <div className="mt-3 flex gap-1.5">
          {(["month", "quarter", "year"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
              style={period === p
                ? { background: "rgba(201,165,90,0.15)", border: "1px solid rgba(201,165,90,0.35)", color: "#c9a55a" }
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

        {/* Bannière : aucune écriture — invite à synchroniser */}
        {!loading && !hasData && (
          <div className="rounded-2xl px-4 py-3.5 flex items-center justify-between"
            style={{
              background: isDark ? "rgba(251,191,36,0.06)" : "rgba(251,191,36,0.08)",
              border: isDark ? "1px solid rgba(251,191,36,0.20)" : "1px solid rgba(251,191,36,0.28)"
            }}>
            <div>
              <p className="text-[12px] font-bold" style={{ color: "#fbbf24" }}>
                Aucune écriture pour cette période
              </p>
              <p className={`text-[10.5px] mt-0.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                Appuyez sur <strong>Sync</strong> pour comptabiliser les factures et dépenses.
              </p>
            </div>
            <button
              onClick={syncJournal}
              disabled={syncLoading}
              className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold"
              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)" }}
            >
              {syncLoading ? <Loader2 size={11} className="animate-spin inline" /> : "Sync"}
            </button>
          </div>
        )}

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
            <Percent size={13} style={{ color: "#c9a55a" }} />
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
                      background: isDark ? "rgba(201,165,90,0.06)" : "rgba(201,165,90,0.07)",
                      border: isDark ? "1px solid rgba(201,165,90,0.14)" : "1px solid rgba(201,165,90,0.22)"
                    }}>
                    <div>
                      <p className={`text-[11px] font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{row.label}</p>
                      <p className={`text-[9.5px] ${isDark ? "text-white/30" : "text-gray-400"}`}>Base {fmtEurInt(row.base)}</p>
                    </div>
                    <p className="text-[13px] font-black" style={{ color: "#c9a55a" }}>{fmtEurInt(row.tva)}</p>
                  </div>
                )) : (
                  <p className={`text-[11px] text-center py-3 ${isDark ? "text-white/25" : "text-gray-400"}`}>Aucune facture sur la période</p>
                )}
              </div>

              {/* Solde TVA */}
              {(() => {
                const isCredit  = tvaSolde < 0;
                const isNeutral = tvaSolde === 0;
                const color  = isNeutral ? "#c9a55a" : isCredit ? "#16a34a" : "#dc2626";
                const bg     = isNeutral ? "rgba(201,165,90,0.07)"  : isCredit ? "rgba(34,197,94,0.07)"  : "rgba(239,68,68,0.07)";
                const border = isNeutral ? "rgba(201,165,90,0.18)"  : isCredit ? "rgba(34,197,94,0.18)"  : "rgba(239,68,68,0.18)";
                const label  = isNeutral ? "TVA — rien à payer"     : isCredit ? "Crédit de TVA"         : "TVA à payer";
                return (
                  <div className="mx-4 mb-4 mt-1 rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: bg, border: `1px solid ${border}` }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{label}</p>
                      <p className={`text-[9px] ${isDark ? "text-white/25" : "text-gray-400"}`}>Collectée {fmtEurInt(tvaCollectee)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] ${isDark ? "text-white/25" : "text-gray-400"}`}>Déductible</span>
                        <input
                          type="number"
                          min="0"
                          value={tvaDeductible === 0 ? "" : tvaDeductible}
                          onChange={e => setTvaDeductible(Number(e.target.value) || 0)}
                          placeholder="0"
                          className={`w-20 bg-transparent text-[11px] outline-none border-b tabular-nums text-right ${isDark ? "text-white/70 border-white/15 placeholder:text-white/20" : "text-gray-600 border-gray-300 placeholder:text-gray-300"}`}
                        />
                        <span className={`text-[9px] ${isDark ? "text-white/25" : "text-gray-400"}`}>€</span>
                      </div>
                    </div>
                    <p className="text-[16px] font-black tabular-nums" style={{ color }}>
                      {fmtEurInt(Math.abs(tvaSolde))}
                    </p>
                  </div>
                );
              })()}
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

          <div className="mx-4 mt-2 flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: resultat >= 0 ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
              border: `1px solid ${resultat >= 0 ? "rgba(34,197,94,0.20)" : "rgba(248,113,113,0.20)"}`,
            }}>
            <p className={`text-[12px] font-black ${isDark ? "text-white/80" : "text-gray-800"}`}>Résultat net</p>
            <p className="text-[17px] font-black tabular-nums" style={{ color: resultat >= 0 ? "#16a34a" : "#dc2626" }}>
              {loading ? "—" : fmtEurInt(resultat)}
            </p>
          </div>

          <div className="mx-4 mb-4 mt-3">
            <button
              onClick={analyseFinances}
              disabled={analyseLoading || loading || caHT === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-[11px] font-bold text-violet-400 transition hover:bg-violet-500/10 disabled:opacity-40"
              style={{ border: "1px dashed rgba(139,92,246,0.35)" }}>
              {analyseLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {analyseLoading ? "Analyse en cours…" : "Analyser avec l'IA"}
            </button>
            {analyse && (
              <div className="mt-2 rounded-xl p-3 text-[11.5px] leading-relaxed"
                style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)", color: isDark ? "rgba(255,255,255,0.72)" : "rgba(30,30,60,0.75)" }}>
                <div className="flex items-center gap-1 mb-1.5 text-[9.5px] font-bold text-violet-400 uppercase tracking-wide">
                  <Sparkles size={9} /> Analyse IA
                </div>
                {analyse}
              </div>
            )}
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
