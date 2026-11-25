"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ReceiptText, FileSignature, Sparkles, History,
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  Loader2, RefreshCw, ArrowRight, ChevronRight,
  Plus, ChevronDown, Calendar, BarChart2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";

const GOLD  = "#FFB900";
const NOIR  = "#0a0a12";

type DocStatut =
  | "brouillon" | "envoyé" | "payé" | "en_retard"
  | "partiellement_payé" | "annulé" | "accepté" | "refusé" | "expiré";

type Periode = "mois" | "mois_prec" | "trimestre" | "annee" | "tout";

interface Doc {
  id:             string;
  type:           "facture" | "devis" | "avoir";
  numero:         string;
  statut:         DocStatut;
  client_nom:     string;
  client_societe: string;
  date_document:  string;
  total_ttc:      number;
  montant_paye:   number;
}

const STATUT_MAP: Record<string, { label: string; color: string; bg: string }> = {
  brouillon:          { label: "Brouillon",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  envoyé:             { label: "Envoyé",      color: "#d97706", bg: "rgba(217,119,6,0.10)"   },
  payé:               { label: "Payé",        color: "#16a34a", bg: "rgba(22,163,74,0.10)"   },
  en_retard:          { label: "En retard",   color: "#dc2626", bg: "rgba(220,38,38,0.08)"   },
  partiellement_payé: { label: "Part. payé",  color: "#b45309", bg: "rgba(180,83,9,0.10)"    },
  annulé:             { label: "Annulé",      color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
  accepté:            { label: "Accepté",     color: "#16a34a", bg: "rgba(22,163,74,0.10)"   },
  refusé:             { label: "Refusé",      color: "#dc2626", bg: "rgba(220,38,38,0.08)"   },
  expiré:             { label: "Expiré",      color: "#c2410c", bg: "rgba(194,65,12,0.10)"   },
};

const PERIODE_LABELS: Record<Periode, string> = {
  mois:      "Ce mois-ci",
  mois_prec: "Mois précédent",
  trimestre: "Ce trimestre",
  annee:     "Cette année",
  tout:      "Toutes périodes",
};

function getDateRange(p: Periode): { start: Date; end: Date } {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth();
  const q     = Math.floor(m / 3);
  switch (p) {
    case "mois":      return { start: new Date(y, m, 1),         end: new Date(y, m + 1, 0)        };
    case "mois_prec": return { start: new Date(y, m - 1, 1),     end: new Date(y, m, 0)            };
    case "trimestre": return { start: new Date(y, q * 3, 1),     end: new Date(y, q * 3 + 3, 0)   };
    case "annee":     return { start: new Date(y, 0, 1),          end: new Date(y, 11, 31)          };
    case "tout":      return { start: new Date(2000, 0, 1),       end: new Date(2099, 11, 31)       };
  }
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n / 1_000_000) + " M€";
  }
  if (n >= 10_000) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n / 1_000)) + " k€";
  }
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function fmtFull(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
}

function fmtDate(s: string): string {
  if (!s) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(s));
  } catch { return s; }
}

/* ─────────────────────────── BAR CHART ───────────────────────────────────── */

interface ChartMonth { label: string; facture: number; encaisse: number }

function FinanceChart({ data, isDark, textTert }: {
  data:     ChartMonth[];
  isDark:   boolean;
  textTert: string;
}) {
  const hasData = data.some(d => d.facture > 0 || d.encaisse > 0);
  const svgBg   = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}
        >
          <BarChart2 size={22} style={{ color: textTert }} />
        </div>
        <p className="text-sm font-medium" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#9ca3af" }}>
          Aucune donnée disponible
        </p>
        <p className="mt-1 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.18)" : "#d1d5db" }}>
          Créez vos premières factures pour voir l&apos;analyse
        </p>
      </div>
    );
  }

  const maxVal   = Math.max(...data.map(d => d.facture), 1);
  const chartH   = 160;
  const barW     = 20;
  const barGap   = 6;
  const colGap   = 24;
  const groupW   = barW * 2 + barGap;
  const padL     = 56;
  const padB     = 28;
  const padT     = 12;
  const svgW     = padL + data.length * (groupW + colGap) + 16;
  const svgH     = chartH + padB + padT;

  const toY = (v: number) => padT + chartH - Math.max((v / maxVal) * chartH, v > 0 ? 3 : 0);
  const toH = (v: number) => Math.max((v / maxVal) * chartH, v > 0 ? 3 : 0);

  const gridVals = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ overflowX: "auto", borderRadius: 12, background: svgBg }}>
      <svg width={svgW} height={svgH} style={{ display: "block", padding: "0 0 0 0" }}>
        {/* Grid */}
        {gridVals.map(r => {
          const y   = padT + chartH * (1 - r);
          const val = maxVal * r;
          const lbl = val >= 1000 ? (val / 1000).toFixed(val < 10000 ? 1 : 0) + "k" : Math.round(val).toString();
          return (
            <g key={r}>
              <line
                x1={padL} y1={y}
                x2={svgW - 8} y2={y}
                stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                strokeWidth={1}
                strokeDasharray={r === 0 ? "none" : "2,3"}
              />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={9} fill={textTert}>{lbl}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padL + i * (groupW + colGap);
          return (
            <g key={d.label}>
              {/* Facturé */}
              <rect
                x={x} y={toY(d.facture)}
                width={barW} height={toH(d.facture)}
                fill={GOLD} rx={4} ry={4} opacity={0.90}
              />
              {/* Encaissé */}
              <rect
                x={x + barW + barGap} y={toY(d.encaisse)}
                width={barW} height={toH(d.encaisse)}
                fill="#16a34a" rx={4} ry={4} opacity={0.80}
              />
              {/* Label */}
              <text
                x={x + groupW / 2} y={svgH - 8}
                textAnchor="middle" fontSize={10} fontWeight={500}
                fill={textTert}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────── RECENT SECTION ─────────────────────────────────── */

interface RecentSectionProps {
  title:       string;
  docs:        Doc[];
  allHref:     string;
  newHref:     string;
  newLabel:    string;
  loading:     boolean;
  isDark:      boolean;
  textPrimary: string;
  textSecond:  string;
  textTert:    string;
  cardBg:      string;
  cardBorder:  string;
  divider:     string;
  rowHover:    string;
}

function RecentSection({
  title, docs, allHref, newHref, newLabel,
  loading, isDark, textPrimary, textSecond, textTert,
  cardBg, cardBorder, divider, rowHover,
}: RecentSectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${divider}` }}
      >
        <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>{title}</h2>
        <Link
          href={allHref}
          className="flex items-center gap-1 text-xs font-medium transition hover:opacity-70"
          style={{ color: GOLD }}
        >
          Voir tout <ChevronRight size={12} />
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin" style={{ color: textTert }} />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-1 text-sm font-medium" style={{ color: textSecond }}>Aucun document</div>
          <Link
            href={newHref}
            className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
            style={{ background: GOLD, color: NOIR }}
          >
            <Plus size={12} /> {newLabel}
          </Link>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: divider }}>
          {docs.map(doc => {
            const s      = STATUT_MAP[doc.statut] ?? STATUT_MAP.brouillon;
            const client = doc.client_societe || doc.client_nom || "—";
            return (
              <Link
                key={doc.id}
                href={`/client/factures/documents?id=${doc.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold" style={{ color: textPrimary }}>
                    {doc.numero || "—"}
                  </div>
                  <div className="truncate text-xs" style={{ color: textTert }}>{client}</div>
                </div>
                <div className="shrink-0 text-xs" style={{ color: textTert }}>
                  {fmtDate(doc.date_document)}
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ color: s.color, background: s.bg }}
                >
                  {s.label}
                </span>
                <div
                  className="shrink-0 text-sm font-semibold tabular-nums"
                  style={{ color: textPrimary }}
                >
                  {fmtCompact(doc.total_ttc || 0)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── MAIN PAGE ──────────────────────────────────────── */

export default function VueEnsemble() {
  const { isDark } = useTheme();
  const router     = useRouter();
  const sp         = useSearchParams();

  const [docs,       setDocs]       = useState<Doc[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [periode,    setPeriode]    = useState<Periode>("annee");
  const [dropOpen,   setDropOpen]   = useState(false);

  /* ── theme tokens ──────────────────────────────────────────────────────── */
  const pageBg      = isDark ? "#0a0a12"                : "#ffffff";
  const textPrimary = isDark ? "#ffffff"                : NOIR;
  const textSecond  = isDark ? "rgba(255,255,255,0.60)" : "#374151";
  const textTert    = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";
  const cardBg      = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const cardBorder  = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const divider     = isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6";
  const shimmerBg   = isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6";
  const rowHover    = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";

  /* ── redirect legacy params ────────────────────────────────────────────── */
  useEffect(() => {
    if (sp.has("new") || sp.has("type") || sp.has("from_contrat")) {
      router.replace(`/client/factures/documents?${sp.toString()}`);
    }
  }, [sp, router]);

  /* ── data fetch ────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .is("suspended_at", null)
        .limit(1)
        .maybeSingle();

      let q = supabase
        .from("documents")
        .select("id,type,numero,statut,client_nom,client_societe,date_document,total_ttc,montant_paye")
        .is("deleted_at", null)
        .order("date_document", { ascending: false })
        .limit(500);

      if (orgMember?.organization_id) q = q.eq("organization_id", orgMember.organization_id);
      else                            q = q.eq("user_id", user.id);

      const { data, error: dbErr } = await q;
      if (dbErr) throw dbErr;

      setDocs((data ?? []) as Doc[]);
    } catch (e) {
      console.error("[VueEnsemble]", e);
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── computed ──────────────────────────────────────────────────────────── */
  const { start, end } = useMemo(() => getDateRange(periode), [periode]);

  const filteredFactures = useMemo(
    () => docs.filter(d => {
      if (d.type !== "facture")                           return false;
      if (d.statut === "brouillon" || d.statut === "annulé") return false;
      const dt = new Date(d.date_document);
      return dt >= start && dt <= end;
    }),
    [docs, start, end],
  );

  const kpi = useMemo(() => {
    const totalFacture = filteredFactures.reduce((s, d) => s + (d.total_ttc || 0), 0);
    const totalEncaisse = filteredFactures.reduce((s, d) => {
      if (d.statut === "payé")               return s + (d.total_ttc || 0);
      if (d.statut === "partiellement_payé") return s + (d.montant_paye || 0);
      return s;
    }, 0);
    const totalAttente = filteredFactures
      .filter(d => d.statut === "envoyé" || d.statut === "partiellement_payé")
      .reduce((s, d) => s + Math.max(0, (d.total_ttc || 0) - (d.montant_paye || 0)), 0);
    const totalRetard = filteredFactures
      .filter(d => d.statut === "en_retard")
      .reduce((s, d) => s + Math.max(0, (d.total_ttc || 0) - (d.montant_paye || 0)), 0);

    const nbFactures = docs.filter(d => d.type === "facture").length;
    const nbDevis    = docs.filter(d => d.type === "devis").length;

    return { totalFacture, totalEncaisse, totalAttente, totalRetard, nbFactures, nbDevis };
  }, [filteredFactures, docs]);

  /* ── chart: 6 derniers mois ────────────────────────────────────────────── */
  const chartData = useMemo<ChartMonth[]>(() => {
    const factures = docs.filter(
      d => d.type === "facture" && d.statut !== "brouillon" && d.statut !== "annulé",
    );
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d);
      const ms = new Date(d.getFullYear(), d.getMonth(), 1);
      const me = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const month = factures.filter(doc => {
        const dt = new Date(doc.date_document);
        return dt >= ms && dt <= me;
      });
      const facture  = month.reduce((s, doc) => s + (doc.total_ttc || 0), 0);
      const encaisse = month.reduce((s, doc) => {
        if (doc.statut === "payé")               return s + (doc.total_ttc || 0);
        if (doc.statut === "partiellement_payé") return s + (doc.montant_paye || 0);
        return s;
      }, 0);
      return { label, facture, encaisse };
    });
  }, [docs]);

  const recentFactures = useMemo(() => docs.filter(d => d.type === "facture").slice(0, 5), [docs]);
  const recentDevis    = useMemo(() => docs.filter(d => d.type === "devis").slice(0, 5), [docs]);

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div className="min-h-full" style={{ background: pageBg }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>
              Facturation
            </h1>
            <p className="mt-1 text-sm" style={{ color: textSecond }}>
              Gérez vos factures, devis et paiements
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="relative">
              <button
                onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition hover:opacity-80"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb", color: textPrimary, border: `1px solid ${cardBorder}` }}
              >
                <Calendar size={14} style={{ color: GOLD }} />
                <span>{PERIODE_LABELS[periode]}</span>
                <ChevronDown size={13} style={{ color: textTert }} />
              </button>

              {dropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                  <div
                    className="absolute right-0 top-full z-20 mt-1.5 min-w-[190px] overflow-hidden rounded-xl py-1.5 shadow-xl"
                    style={{ background: isDark ? "#15151f" : "#ffffff", border: `1px solid ${cardBorder}` }}
                  >
                    {(Object.entries(PERIODE_LABELS) as [Periode, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => { setPeriode(key); setDropOpen(false); }}
                        className="flex w-full items-center px-4 py-2 text-sm transition-colors"
                        style={{
                          color: periode === key ? GOLD : textPrimary,
                          background: periode === key
                            ? (isDark ? "rgba(255,185,0,0.08)" : "rgba(255,185,0,0.06)")
                            : "transparent",
                          fontWeight: periode === key ? 600 : 400,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={load}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:opacity-70"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb", border: `1px solid ${cardBorder}` }}
              title="Actualiser"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: textTert }} />
            </button>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
          >
            {error}
          </div>
        )}

        {/* ── 4 Action cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

          {/* Créer une facture — Jaune DJAMA */}
          <Link
            href="/client/factures/factures/nouveau"
            className="flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
            style={{ background: GOLD, minHeight: 128 }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(0,0,0,0.12)" }}
            >
              <ReceiptText size={18} color={NOIR} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: NOIR }}>Créer une facture</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium" style={{ color: "rgba(10,10,18,0.55)" }}>
                Commencer <ArrowRight size={10} />
              </div>
            </div>
          </Link>

          {/* Créer un devis — Noir */}
          <Link
            href="/client/factures/devis/nouveau"
            className="flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
            style={{ background: NOIR, minHeight: 128 }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.10)" }}
            >
              <FileSignature size={18} color="#ffffff" />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: "#ffffff" }}>Créer un devis</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                Commencer <ArrowRight size={10} />
              </div>
            </div>
          </Link>

          {/* DJAMA IA — Blanc/Noir/Jaune */}
          <Link
            href="/client/factures/agent"
            className="flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, minHeight: 128 }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: isDark ? "rgba(255,185,0,0.12)" : "rgba(255,185,0,0.10)" }}
            >
              <Sparkles size={18} style={{ color: GOLD }} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: textPrimary }}>DJAMA IA</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold" style={{ color: GOLD }}>
                Essayer <ArrowRight size={10} />
              </div>
            </div>
          </Link>

          {/* Historique — Blanc/Neutre */}
          <Link
            href="/client/factures/liste"
            className="flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, minHeight: 128 }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6" }}
            >
              <History size={18} style={{ color: textSecond }} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: textPrimary }}>Historique</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium" style={{ color: textTert }}>
                Consulter <ArrowRight size={10} />
              </div>
            </div>
          </Link>
        </div>

        {/* ── KPI tiles ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Total facturé",
              value: fmtCompact(kpi.totalFacture),
              full:  fmtFull(kpi.totalFacture),
              sub:   `${kpi.nbFactures} facture${kpi.nbFactures !== 1 ? "s" : ""}`,
              Icon:  TrendingUp,
              col:   GOLD,
              ibg:   isDark ? "rgba(255,185,0,0.12)"  : "rgba(255,185,0,0.08)",
              ibd:   "rgba(255,185,0,0.20)",
            },
            {
              label: "Encaissé",
              value: kpi.nbFactures === 0 ? "—" : fmtCompact(kpi.totalEncaisse),
              full:  fmtFull(kpi.totalEncaisse),
              sub:   kpi.totalFacture > 0
                ? `${Math.round(kpi.totalEncaisse / kpi.totalFacture * 100)} % du total`
                : undefined,
              Icon:  CheckCircle2,
              col:   "#16a34a",
              ibg:   isDark ? "rgba(22,163,74,0.12)"  : "rgba(22,163,74,0.08)",
              ibd:   "rgba(22,163,74,0.20)",
            },
            {
              label: "En attente",
              value: fmtCompact(kpi.totalAttente),
              full:  fmtFull(kpi.totalAttente),
              sub:   "Envoyées, non réglées",
              Icon:  Clock,
              col:   "#2563eb",
              ibg:   isDark ? "rgba(37,99,235,0.12)"  : "rgba(37,99,235,0.08)",
              ibd:   "rgba(37,99,235,0.20)",
            },
            {
              label: "En retard",
              value: fmtCompact(kpi.totalRetard),
              full:  fmtFull(kpi.totalRetard),
              sub:   "Échéance dépassée",
              Icon:  AlertTriangle,
              col:   "#dc2626",
              ibg:   isDark ? "rgba(220,38,38,0.12)"  : "rgba(220,38,38,0.08)",
              ibd:   "rgba(220,38,38,0.20)",
            },
          ].map(({ label, value, full, sub, Icon, col, ibg, ibd }) => (
            <div
              key={label}
              className="flex flex-col gap-3 rounded-2xl p-5"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              title={full}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: textTert }}
                >
                  {label}
                </span>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: ibg, border: `1px solid ${ibd}` }}
                >
                  <Icon size={14} style={{ color: col }} />
                </div>
              </div>

              {loading ? (
                <div className="h-7 w-24 animate-pulse rounded-lg" style={{ background: shimmerBg }} />
              ) : (
                <div>
                  <div
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: textPrimary, fontVariantNumeric: "tabular-nums" }}
                  >
                    {value}
                  </div>
                  {sub && (
                    <div className="mt-0.5 text-xs" style={{ color: textTert }}>{sub}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Finance chart ── */}
        <div
          className="mb-8 overflow-hidden rounded-2xl"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            style={{ borderBottom: `1px solid ${divider}` }}
          >
            <div>
              <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>Analyse financière</h2>
              <p className="mt-0.5 text-xs" style={{ color: textTert }}>
                6 derniers mois · hors brouillons et annulés
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: textTert }}>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GOLD }} />
                Facturé
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#16a34a" }} />
                Encaissé
              </span>
            </div>
          </div>
          <div className="p-5">
            <FinanceChart data={chartData} isDark={isDark} textTert={textTert} />
          </div>
        </div>

        {/* ── Sections récentes ── */}
        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <RecentSection
            title="Factures récentes"
            docs={recentFactures}
            allHref="/client/factures/factures"
            newHref="/client/factures/factures/nouveau"
            newLabel="Nouvelle facture"
            loading={loading}
            isDark={isDark}
            textPrimary={textPrimary}
            textSecond={textSecond}
            textTert={textTert}
            cardBg={cardBg}
            cardBorder={cardBorder}
            divider={divider}
            rowHover={rowHover}
          />
          <RecentSection
            title="Devis récents"
            docs={recentDevis}
            allHref="/client/factures/devis"
            newHref="/client/factures/devis/nouveau"
            newLabel="Nouveau devis"
            loading={loading}
            isDark={isDark}
            textPrimary={textPrimary}
            textSecond={textSecond}
            textTert={textTert}
            cardBg={cardBg}
            cardBorder={cardBorder}
            divider={divider}
            rowHover={rowHover}
          />
        </div>

        {/* ── Quick links ── */}
        <div className="flex flex-wrap gap-2 pb-4">
          {[
            { href: "/client/factures/factures", label: "Toutes les factures" },
            { href: "/client/factures/devis",    label: "Tous les devis"      },
            { href: "/client/factures/clients",  label: "Clients"             },
            { href: "/client/factures/stats",    label: "Statistiques"        },
            { href: "/client/factures/galerie",  label: "Galerie modèles"     },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-70"
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f9fafb", color: textSecond, border: `1px solid ${cardBorder}` }}
            >
              {label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
