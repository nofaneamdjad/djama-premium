"use client";

/**
 * Liste Factures — tableau professionnel avec filtres, recherche, tri, pagination.
 * Suit useTheme() + pattern org-aware du dashboard.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import {
  Search, Plus, ArrowUpDown, ArrowUp, ArrowDown,
  AlertTriangle, ReceiptText, X, RefreshCw,
  MoreHorizontal, ExternalLink, Copy, FileDown,
  Clock, TrendingUp, Loader2, AlertCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const YELLOW = "#FFB900";

// ─── Types ────────────────────────────────────────────────────────────────────

type Statut = "brouillon" | "envoyé" | "payé" | "en_retard" | "partiellement_payé" | "annulé";

interface Facture {
  id:             string;
  numero:         string;
  statut:         Statut;
  client_nom:     string;
  client_societe: string;
  date_document:  string | null;
  date_echeance:  string | null;
  total_ttc:      number;
  total_ht:       number;
}

interface MenuState { id: string; top: number; right: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUTS: Record<Statut, { label: string; color: string; bg: string; border: string }> = {
  brouillon:          { label: "Brouillon",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.25)" },
  envoyé:             { label: "Envoyé",      color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)"  },
  payé:               { label: "Payé",        color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.25)"  },
  en_retard:          { label: "En retard",   color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
  partiellement_payé: { label: "Part. payé",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.25)"  },
  annulé:             { label: "Annulé",      color: "#6b7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)" },
};

const PAGE_SIZE = 20;
type SortKey = "date_document" | "total_ttc" | "client_nom" | "numero" | "statut";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function StatutBadge({ statut }: { statut: Statut }) {
  const s = STATUTS[statut] ?? STATUTS.brouillon;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FacturesList() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [data,    setData]    = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<Statut | "">("");
  const [sortKey, setSortKey] = useState<SortKey>("date_document");
  const [sortAsc, setSortAsc] = useState(false);
  const [page,    setPage]    = useState(1);
  const [menu,    setMenu]    = useState<MenuState | null>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const tid = setTimeout(() => document.addEventListener("click", close), 10);
    return () => { clearTimeout(tid); document.removeEventListener("click", close); };
  }, [menu]);

  // ── Load ────────────────────────────────────────────────────────────────────
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
        .select("id,numero,statut,client_nom,client_societe,date_document,date_echeance,total_ttc,total_ht")
        .eq("type", "facture")
        .order("created_at", { ascending: false });

      if (orgMember?.organization_id) {
        query = query.eq("organization_id", orgMember.organization_id);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data: rows, error: dbErr } = await query;
      if (dbErr) throw dbErr;
      setData((rows ?? []) as Facture[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filter + Sort ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(f =>
        f.numero.toLowerCase().includes(q) ||
        f.client_nom.toLowerCase().includes(q) ||
        (f.client_societe || "").toLowerCase().includes(q),
      );
    }
    if (filter) r = r.filter(f => f.statut === filter);
    r = [...r].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortKey === "date_document")  { va = a.date_document ?? ""; vb = b.date_document ?? ""; }
      else if (sortKey === "total_ttc") { va = a.total_ttc ?? 0;      vb = b.total_ttc ?? 0; }
      else if (sortKey === "client_nom"){ va = a.client_nom ?? "";     vb = b.client_nom ?? ""; }
      else if (sortKey === "numero")    { va = a.numero ?? "";         vb = b.numero ?? ""; }
      else if (sortKey === "statut")    { va = a.statut ?? "";         vb = b.statut ?? ""; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return r;
  }, [data, search, filter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(a => !a);
    else { setSortKey(k); setSortAsc(false); }
  }

  // ── Duplicate detection ───────────────────────────────────────────────────
  const duplicateNums = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of data) counts[f.numero] = (counts[f.numero] ?? 0) + 1;
    return new Set(Object.entries(counts).filter(([, c]) => c > 1).map(([n]) => n));
  }, [data]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    total:    data.reduce((s, f) => s + (f.total_ttc ?? 0), 0),
    encaisse: data.filter(f => f.statut === "payé").reduce((s, f) => s + f.total_ttc, 0),
    attente:  data.filter(f => f.statut === "envoyé").reduce((s, f) => s + f.total_ttc, 0),
    retard:   data.filter(f => f.statut === "en_retard").reduce((s, f) => s + f.total_ttc, 0),
  }), [data]);

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const tbd      = isDark ? "border-white/[0.07]"               : "border-gray-200";
  const ttext    = isDark ? "text-white"                         : "text-gray-900";
  const tsub     = isDark ? "text-white/40"                      : "text-gray-500";
  const thd      = isDark ? "text-white/30"                      : "text-gray-500";
  const tbgCard  = isDark ? "bg-[#111111]"                       : "bg-white";
  const tbgHead  = isDark ? "bg-white/[0.03]"                    : "bg-gray-50";
  const tbgRow   = isDark ? "hover:bg-white/[0.03]"              : "hover:bg-gray-50/80";
  const inputCls = isDark
    ? "bg-white/[0.04] text-white placeholder:text-white/20"
    : "bg-white text-gray-900 placeholder:text-gray-400";
  const selectCls = isDark ? "bg-white/[0.04] text-white" : "bg-white text-gray-900";

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortAsc
      ? <ArrowUp   size={12} style={{ color: YELLOW }} />
      : <ArrowDown size={12} style={{ color: YELLOW }} />;
  }

  const kpiCards = [
    { label: "Total facturé", val: fmt(kpi.total),    color: isDark ? "rgba(255,255,255,0.85)" : "#111827", iconColor: "#64748B", iconBg: "rgba(100,116,139,0.12)", Icon: ReceiptText   },
    { label: "Encaissé",      val: fmt(kpi.encaisse), color: "#4ade80",                                      iconColor: "#4ade80", iconBg: "rgba(74,222,128,0.12)",  Icon: TrendingUp    },
    { label: "En attente",    val: fmt(kpi.attente),  color: YELLOW,                                         iconColor: YELLOW,    iconBg: "rgba(255,185,0,0.12)",   Icon: Clock         },
    { label: "En retard",     val: fmt(kpi.retard),   color: "#f87171",                                      iconColor: "#f87171", iconBg: "rgba(248,113,113,0.12)", Icon: AlertTriangle },
  ];

  const colHeaders = [
    { k: "numero"        as SortKey, label: "N°"          },
    { k: "client_nom"    as SortKey, label: "Client"      },
    { k: "date_document" as SortKey, label: "Date"        },
    { k: "date_document" as SortKey, label: "Échéance",   noSort: true },
    { k: "total_ttc"     as SortKey, label: "Montant TTC", right: true },
    { k: "statut"        as SortKey, label: "Statut"      },
    { k: "numero"        as SortKey, label: "",            noSort: true },
  ] as { k: SortKey; label: string; noSort?: boolean; right?: boolean }[];

  const menuFacture = menu ? paged.find(f => f.id === menu.id) : null;

  return (
    <div className={`min-h-full ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}>
      <div className="px-6 py-6 pb-24 md:pb-8">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${ttext}`}>Factures</h1>
            <p className={`mt-0.5 text-sm ${tsub}`}>
              {data.length} facture{data.length !== 1 ? "s" : ""} au total
            </p>
          </div>
          <Link
            href="/client/factures/documents?new=1&type=facture"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
            style={{ background: YELLOW }}
          >
            <Plus size={14} /> Nouvelle facture
          </Link>
        </div>

        {/* ── KPIs ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpiCards.map(k => {
            const KpiIcon = k.Icon;
            return (
              <div
                key={k.label}
                className={`flex flex-col gap-2 rounded-2xl border p-3 sm:p-4 ${isDark ? "border-white/[0.07] bg-white/[0.03]" : "bg-white"}`}
                style={{ borderColor: isDark ? undefined : "rgba(0,0,0,0.07)" }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? "text-white/40" : "text-[#64748B]"}`}>
                    {k.label}
                  </span>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: k.iconBg }}>
                    <KpiIcon size={12} style={{ color: k.iconColor }} />
                  </div>
                </div>
                <span className="text-xl font-black leading-none tabular-nums" style={{ color: k.color }}>{k.val}</span>
              </div>
            );
          })}
        </div>

        {/* ── Duplicate warning ── */}
        {duplicateNums.size > 0 && (
          <div
            className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              <strong>Numéros en doublon détectés :</strong>{" "}
              {[...duplicateNums].join(", ")}.{" "}
              Vérifiez les identifiants et l'historique de ces documents avant toute action.
            </span>
          </div>
        )}

        {/* ── Search + filter ── */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search size={13} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${tsub}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un numéro ou un client"
              className={`w-full rounded-xl border py-2 pl-9 pr-9 text-sm outline-none transition ${tbd} ${inputCls}`}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${tsub} hover:opacity-70`}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value as Statut | "")}
            className={`appearance-none rounded-xl border py-2 pl-3 pr-7 text-sm outline-none cursor-pointer ${tbd} ${selectCls}`}
          >
            <option value="">Tous les statuts</option>
            {(Object.entries(STATUTS) as [Statut, (typeof STATUTS)[Statut]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <button
            onClick={load}
            className={`rounded-xl border p-2 transition ${tbd} ${isDark ? "bg-white/[0.04] text-white/40 hover:text-white/70" : "bg-white text-gray-400 hover:text-gray-700"}`}
            title="Actualiser"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {error && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className={`overflow-hidden rounded-2xl border ${tbd} ${tbgCard}`}>
          <div className="overflow-x-auto">
            {/* table-layout fixed + colgroup guarantee no cell wraps on N°/dates/montant */}
            <table className="w-full" style={{ tableLayout: "fixed", minWidth: 640 }}>
              <colgroup>
                <col style={{ width: 130 }} />
                <col />
                <col style={{ width: 90  }} />
                <col style={{ width: 90  }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 90  }} />
                <col style={{ width: 44  }} />
              </colgroup>
              <thead>
                <tr className={`border-b ${tbd} ${tbgHead}`}>
                  {colHeaders.map((col, i) => (
                    <th
                      key={i}
                      onClick={() => !col.noSort && toggleSort(col.k)}
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${col.right ? "text-right" : "text-left"} ${thd} ${!col.noSort ? "cursor-pointer select-none hover:opacity-80" : ""}`}
                    >
                      <div className={`flex items-center gap-1.5 whitespace-nowrap ${col.right ? "justify-end" : ""}`}>
                        {col.label}
                        {!col.noSort && col.label && <SortIcon k={col.k} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Loader2 size={22} className={`mx-auto animate-spin ${tsub}`} />
                    </td>
                  </tr>
                )}
                {!loading && paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <ReceiptText size={28} className={`mx-auto mb-3 ${tsub}`} />
                      <p className={`text-sm ${tsub}`}>
                        {search || filter
                          ? "Aucune facture ne correspond à votre recherche."
                          : "Aucune facture pour l'instant."}
                      </p>
                      {!search && !filter && (
                        <Link
                          href="/client/factures/documents?new=1&type=facture"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-black"
                          style={{ background: YELLOW }}
                        >
                          <Plus size={12} /> Créer ma première facture
                        </Link>
                      )}
                    </td>
                  </tr>
                )}
                {!loading && paged.map((f) => {
                  const isLate      = f.statut === "en_retard";
                  const isDuplicate = duplicateNums.has(f.numero);
                  return (
                    <tr
                      key={f.id}
                      className={`border-b ${tbd} transition-colors cursor-pointer ${tbgRow}`}
                      style={isLate ? { background: "rgba(248,113,113,0.04)" } : undefined}
                      onClick={() => router.push(`/client/factures/documents?id=${f.id}`)}
                    >
                      {/* N° */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold" style={{ color: YELLOW }}>
                          {f.numero}
                        </span>
                        {isDuplicate && (
                          <span title="Numéro en doublon">
                            <AlertTriangle
                              size={11}
                              className="ml-1.5 inline align-middle"
                              style={{ color: "#f87171" }}
                            />
                          </span>
                        )}
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3 overflow-hidden">
                        <div
                          className={`truncate text-sm font-medium ${ttext}`}
                          title={f.client_nom || undefined}
                        >
                          {f.client_nom || "—"}
                        </div>
                        {f.client_societe && (
                          <div className={`truncate text-[11px] ${tsub}`} title={f.client_societe}>
                            {f.client_societe}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${tsub}`}>
                        {fmtDate(f.date_document)}
                      </td>

                      {/* Échéance */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {isLate
                          ? <span style={{ color: "#f87171" }}>{fmtDate(f.date_echeance)}</span>
                          : <span className={tsub}>{fmtDate(f.date_echeance)}</span>
                        }
                      </td>

                      {/* Montant TTC */}
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold text-right ${ttext}`}>
                        {fmt(f.total_ttc ?? 0)}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <StatutBadge statut={f.statut} />
                      </td>

                      {/* Menu ⋮ — stops row click propagation */}
                      <td className="px-2 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenu({ id: f.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          }}
                          className={`rounded-lg p-1.5 transition ${isDark ? "text-white/30 hover:bg-white/[0.07] hover:text-white/60" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                          title="Actions"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between border-t ${tbd} px-4 py-3`}>
              <span className={`text-xs ${tsub}`}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`rounded-lg border p-1.5 disabled:opacity-30 ${tbd} ${isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className={`px-2 text-xs ${tsub}`}>{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`rounded-lg border p-1.5 disabled:opacity-30 ${tbd} ${isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Context menu (fixed = not clipped by overflow-x-auto) ── */}
      {menu && menuFacture && (
        <div
          className={`fixed z-50 min-w-[168px] overflow-hidden rounded-xl border shadow-xl ${isDark ? "bg-[#1c1c1c] border-white/[0.1]" : "bg-white border-gray-200"}`}
          style={{ top: menu.top, right: menu.right }}
          onClick={e => e.stopPropagation()}
        >
          <Link
            href={`/client/factures/documents?id=${menuFacture.id}`}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${isDark ? "text-white/70 hover:bg-white/[0.07] hover:text-white" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
            onClick={() => setMenu(null)}
          >
            <ExternalLink size={13} /> Ouvrir
          </Link>
          <Link
            href={`/client/factures/documents?id=${menuFacture.id}&action=duplicate`}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${isDark ? "text-white/70 hover:bg-white/[0.07] hover:text-white" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
            onClick={() => setMenu(null)}
          >
            <Copy size={13} /> Dupliquer
          </Link>
          {menuFacture.statut !== "brouillon" && (
            <Link
              href={`/client/factures/documents?id=${menuFacture.id}&action=pdf`}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${isDark ? "text-white/70 hover:bg-white/[0.07] hover:text-white" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
              onClick={() => setMenu(null)}
            >
              <FileDown size={13} /> Télécharger PDF
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
