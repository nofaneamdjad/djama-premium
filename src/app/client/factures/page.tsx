"use client";

/**
 * Vue d'ensemble — Factures & Devis
 * Dashboard principal avec KPIs réels et documents récents.
 * Thème clair/sombre via useTheme().
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  Plus, ArrowRight, ReceiptText, FileSignature, Users,
  Loader2, RefreshCw, ChevronRight, Sparkles, Building2,
  FileText, Send, BadgeCheck, DollarSign,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#FFB900";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatut = "brouillon" | "envoyé" | "payé" | "en_retard" | "partiellement_payé";

interface Doc {
  id:            string;
  type:          "facture" | "devis" | "avoir";
  numero:        string;
  statut:        DocStatut;
  client_nom:    string;
  client_societe:string;
  date_document: string;
  date_echeance: string | null;
  total_ttc:     number;
  montant_paye:  number;
}

interface KPI {
  total_facture: number;
  total_encaisse: number;
  total_attente:  number;
  total_retard:   number;
  nb_factures:    number;
  nb_devis:       number;
  nb_clients:     number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUTS: Record<DocStatut, { label: string; color: string; bg: string }> = {
  brouillon:          { label: "Brouillon",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  envoyé:             { label: "Envoyé",      color: GOLD,      bg: "rgba(255,185,0,0.12)"   },
  payé:               { label: "Payé",        color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  en_retard:          { label: "En retard",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  partiellement_payé: { label: "Part. payé",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
};

function StatutBadge({ statut }: { statut: DocStatut }) {
  const s = STATUTS[statut] ?? STATUTS.brouillon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function clientLabel(doc: Doc) {
  return doc.client_societe || doc.client_nom || "—";
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

interface KpiTileProps {
  label:   string;
  value:   string;
  sub?:    string;
  icon:    React.ElementType;
  color:   string;
  bg:      string;
  border:  string;
  loading?: boolean;
  isDark:  boolean;
}

function KpiTile({ label, value, sub, icon: Icon, color, bg, border, loading, isDark }: KpiTileProps) {
  const cardBg     = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const labelCol   = isDark ? "rgba(255,255,255,0.40)" : "#6b7280";
  const valueCol   = isDark ? "#ffffff"                : "#111827";
  const subCol     = isDark ? "rgba(255,255,255,0.30)" : "#9ca3af";
  const shimmerBg  = isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6";

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5"
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: labelCol }}>
          {label}
        </span>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: bg, border: `1px solid ${border}` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-24 animate-pulse rounded-lg" style={{ background: shimmerBg }} />
      ) : (
        <div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: valueCol, fontVariantNumeric: "tabular-nums" }}>
            {value}
          </div>
          {sub && <div className="mt-0.5 text-xs" style={{ color: subCol }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function VueEnsemble() {
  const { isDark } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [docs,      setDocs]      = useState<Doc[]>([]);
  const [kpi,       setKpi]       = useState<KPI | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [dupNums,   setDupNums]   = useState<string[]>([]);

  // ── Tokens thème ────────────────────────────────────────────────────────────
  const pageBg       = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const textPrimary  = isDark ? "#ffffff"                : "#111827";
  const textSecond   = isDark ? "rgba(255,255,255,0.55)" : "#4b5563";
  const textTertiary = isDark ? "rgba(255,255,255,0.40)" : "#6b7280";
  const cardBg       = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const cardBorder   = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const divider      = isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6";
  const rowHover     = isDark ? "rgba(255,255,255,0.03)" : "#f9fafb";
  const rowDivider   = isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6";
  const btnBg        = isDark ? "rgba(255,255,255,0.05)" : "#f9fafb";
  const btnText      = isDark ? "rgba(255,255,255,0.40)" : "#6b7280";
  const btnBorder    = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const actionBg     = isDark ? "rgba(255,255,255,0.04)" : "#f9fafb";
  const actionText   = isDark ? "rgba(255,255,255,0.65)" : "#374151";
  const actionBorder = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";
  const emptyIcon    = isDark ? "rgba(255,255,255,0.10)" : "#d1d5db";
  const emptyText    = isDark ? "rgba(255,255,255,0.30)" : "#9ca3af";

  // Redirection transparente si l'URL porte des params d'ouverture de l'éditeur
  useEffect(() => {
    const hasEditorParams = searchParams.has("new") || searchParams.has("type") || searchParams.has("from_contrat");
    if (hasEditorParams) {
      router.replace(`/client/factures/documents?${searchParams.toString()}`);
    }
  }, [searchParams, router]);

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

      let query = supabase
        .from("documents")
        .select("id,type,numero,statut,client_nom,client_societe,date_document,date_echeance,total_ttc,montant_paye")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (orgMember?.organization_id) {
        query = query.eq("organization_id", orgMember.organization_id);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data, error: dbErr } = await query.limit(200);
      if (dbErr) throw dbErr;

      const all = (data ?? []) as Doc[];
      setDocs(all);

      const factures = all.filter(d => d.type === "facture");
      const devis    = all.filter(d => d.type === "devis");

      const totalFacture  = factures.reduce((s, d) => s + (d.total_ttc || 0), 0);
      const totalEncaisse = factures.reduce((s, d) => {
        if (d.statut === "payé")               return s + (d.total_ttc || 0);
        if (d.statut === "partiellement_payé") return s + (d.montant_paye || 0);
        return s;
      }, 0);
      const totalAttente  = factures.filter(d => d.statut === "envoyé" || d.statut === "partiellement_payé").reduce((s, d) => {
        const restant = (d.total_ttc || 0) - (d.montant_paye || 0);
        return s + Math.max(0, restant);
      }, 0);
      const totalRetard   = factures.filter(d => d.statut === "en_retard").reduce((s, d) => {
        const restant = (d.total_ttc || 0) - (d.montant_paye || 0);
        return s + Math.max(0, restant);
      }, 0);
      const clients = new Set(all.map(d => d.client_societe || d.client_nom).filter(Boolean));

      // Diagnostic numérotation : détecter les doublons
      const numCount: Record<string, number> = {};
      all.forEach(d => { numCount[d.numero] = (numCount[d.numero] ?? 0) + 1; });
      setDupNums(Object.entries(numCount).filter(([,c]) => c > 1).map(([n]) => n));

      setKpi({
        total_facture:  totalFacture,
        total_encaisse: totalEncaisse,
        total_attente:  totalAttente,
        total_retard:   totalRetard,
        nb_factures:    factures.length,
        nb_devis:       devis.length,
        nb_clients:     clients.size,
      });
    } catch (e) {
      console.error("[VueEnsemble]", e);
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const recent = docs.slice(0, 8);

  function fmt(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " M€";
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(".", ",") + " k€";
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + " €";
  }

  return (
    <div className={`min-h-full px-6 py-6 ${pageBg}`}>

      {/* ── Header ── */}
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: textPrimary }}>Vue d&apos;ensemble</h1>
          <p className="mt-0.5 text-sm" style={{ color: textSecond }}>
            Tableau de bord de votre activité de facturation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
            style={{ background: btnBg, color: btnText, border: `1px solid ${btnBorder}` }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <Link
            href="/client/factures/documents?new=1&type=facture"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-black transition hover:opacity-90"
            style={{ background: GOLD }}
          >
            <Plus size={13} />
            Nouvelle facture
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
          {error}
        </div>
      )}

      {dupNums.length > 0 && (
        <div className="mb-5 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
          <strong>Diagnostic numérotation :</strong> {dupNums.length} numéro{dupNums.length > 1 ? "s" : ""} en doublon détecté{dupNums.length > 1 ? "s" : ""} — {dupNums.join(", ")}.
          Les doublons sont signalés par <span className="rounded px-1 text-[10px] font-bold" style={{ background: "rgba(248,113,113,0.2)" }}>×2</span> dans le tableau.
          Vérifiez les documents concernés dans l&apos;éditeur avant toute action.
        </div>
      )}

      {/* ── KPI tiles ── */}
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Total facturé" value={kpi ? fmt(kpi.total_facture) : "—"}
          sub={kpi ? `${kpi.nb_factures} facture${kpi.nb_factures > 1 ? "s" : ""}` : undefined}
          icon={TrendingUp} color={GOLD} bg="rgba(255,185,0,0.10)" border="rgba(255,185,0,0.22)"
          loading={loading} isDark={isDark}
        />
        <KpiTile
          label="Encaissé"
          value={kpi ? (kpi.nb_factures === 0 ? "—" : fmt(kpi.total_encaisse)) : "—"}
          sub={kpi && kpi.total_facture > 0
            ? `${Math.round(kpi.total_encaisse / kpi.total_facture * 100)} % du total`
            : kpi?.nb_factures === 0 ? "Aucune facture émise" : undefined}
          icon={CheckCircle2} color="#4ade80" bg="rgba(74,222,128,0.08)" border="rgba(74,222,128,0.2)"
          loading={loading} isDark={isDark}
        />
        <KpiTile
          label="En attente" value={kpi ? fmt(kpi.total_attente) : "—"}
          sub="Envoyées, non réglées"
          icon={Clock} color="#60a5fa" bg="rgba(96,165,250,0.08)" border="rgba(96,165,250,0.2)"
          loading={loading} isDark={isDark}
        />
        <KpiTile
          label="En retard" value={kpi ? fmt(kpi.total_retard) : "—"}
          sub="Échéance dépassée"
          icon={AlertTriangle} color="#f87171" bg="rgba(248,113,113,0.08)" border="rgba(248,113,113,0.2)"
          loading={loading} isDark={isDark}
        />
      </div>

      {/* ── Contenu en colonnes ── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_260px]">

        {/* ── Documents récents (2/3) ── */}
        <div
          className="min-w-0 rounded-2xl overflow-hidden"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${divider}` }}
          >
            <span className="text-sm font-semibold" style={{ color: textPrimary }}>Documents récents</span>
            <Link
              href="/client/factures/documents"
              className="flex items-center gap-1 text-xs font-medium transition hover:opacity-100"
              style={{ color: GOLD, opacity: 0.85 }}
            >
              Voir tout <ChevronRight size={11} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin" style={{ color: textTertiary }} />
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <ReceiptText size={28} style={{ color: emptyIcon }} />
              <p className="text-sm" style={{ color: emptyText }}>Aucun document pour le moment</p>
              <Link
                href="/client/factures/documents?new=1&type=facture"
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-black"
                style={{ background: GOLD }}
              >
                Créer une facture
              </Link>
            </div>
          ) : (
            <>
              {/* ── Tableau desktop (≥ sm) ── */}
              <div className="hidden md:block">
                <table className="w-full table-fixed">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${divider}` }}>
                      <th className="w-24 px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: textTertiary }}>Numéro</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: textTertiary }}>Client</th>
                      <th className="w-20 px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: textTertiary }}>Date</th>
                      <th className="w-20 px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: textTertiary }}>Montant</th>
                      <th className="w-28 px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: textTertiary }}>Statut</th>
                      <th className="w-5 px-1 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((doc, i) => {
                      const isDup = dupNums.includes(doc.numero);
                      return (
                        <tr
                          key={doc.id}
                          className="group cursor-pointer transition-colors"
                          style={{ borderBottom: i < recent.length - 1 ? `1px solid ${rowDivider}` : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          onClick={() => router.push(`/client/factures/documents?id=${doc.id}`)}
                        >
                          <td className="px-2 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold" style={{ color: GOLD }}>
                              {doc.numero}
                            </span>
                            {isDup && (
                              <span title={`Numéro dupliqué (id: ${doc.id.slice(0,8)}…)`}
                                className="ml-1 inline-block rounded px-1 text-[9px] font-bold uppercase"
                                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                                ×2
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className="block truncate text-sm" style={{ color: textPrimary }}>
                              {clientLabel(doc)}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-xs whitespace-nowrap" style={{ color: textTertiary }}>
                            {doc.date_document ? new Date(doc.date_document).toLocaleDateString("fr-FR") : "—"}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <span className="text-xs font-semibold tabular-nums" style={{ color: textPrimary }}>
                              {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(doc.total_ttc ?? 0)} €
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <StatutBadge statut={doc.statut} />
                          </td>
                          <td className="px-1 py-3">
                            <ChevronRight size={13} className="opacity-0 transition group-hover:opacity-100" style={{ color: textTertiary }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Cards mobile (< sm) ── */}
              <div className="md:hidden divide-y" style={{ borderColor: rowDivider }}>
                {recent.map((doc) => {
                  const isDup = dupNums.includes(doc.numero);
                  return (
                    <div
                      key={doc.id}
                      className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors active:opacity-70"
                      style={{ background: "transparent" }}
                      onClick={() => router.push(`/client/factures/documents?id=${doc.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold" style={{ color: GOLD }}>{doc.numero}</span>
                          {isDup && (
                            <span className="rounded px-1 text-[9px] font-bold uppercase"
                              style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>×2</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium" style={{ color: textPrimary }}>{clientLabel(doc)}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: textTertiary }}>
                          {doc.date_document ? new Date(doc.date_document).toLocaleDateString("fr-FR") : "—"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold" style={{ color: textPrimary, fontVariantNumeric: "tabular-nums" }}>
                          {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(doc.total_ttc ?? 0)}
                        </div>
                        <div className="mt-1"><StatutBadge statut={doc.statut} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Colonne droite (1/3) ── */}
        <div className="flex flex-col gap-4">

          {/* Actions rapides */}
          <div
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="mb-3 text-sm font-semibold" style={{ color: textPrimary }}>Actions rapides</div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Nouvelle facture", href: "/client/factures/documents?new=1&type=facture", icon: ReceiptText, gold: true },
                { label: "Nouveau devis",    href: "/client/factures/documents?new=1&type=devis",   icon: FileSignature },
                { label: "Mes clients",      href: "/client/factures/clients",                       icon: Users },
                { label: "Mon entreprise",   href: "/client/factures/entreprise",                    icon: Building2 },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:opacity-80"
                    style={a.gold ? {
                      background: GOLD, color: "#0a0a0a",
                    } : {
                      background: actionBg, color: actionText, border: `1px solid ${actionBorder}`,
                    }}
                  >
                    <Icon size={13} />
                    {a.label}
                    <ArrowRight size={11} className="ml-auto shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Résumé */}
          {kpi && (
            <div
              className="rounded-2xl p-4"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="mb-3 text-sm font-semibold" style={{ color: textPrimary }}>Résumé</div>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Devis en cours",  value: kpi.nb_devis,   icon: FileSignature, color: "#a78bfa" },
                  { label: "Clients actifs",  value: kpi.nb_clients, icon: Users,         color: "#60a5fa" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: item.color }} />
                        <span className="text-xs" style={{ color: textSecond }}>{item.label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>{item.value}</span>
                    </div>
                  );
                })}
                <div
                  className="mt-1 rounded-lg px-3 py-2 text-xs"
                  style={{ background: "rgba(255,185,0,0.08)", color: isDark ? "rgba(255,185,0,0.8)" : "#cc9400", border: "1px solid rgba(255,185,0,0.18)" }}
                >
                  <Sparkles size={9} className="mr-1 inline-block" />
                  Données en temps réel · Organisation isolée
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
