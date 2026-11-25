"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import {
  Search, Plus, FileSignature, X, RefreshCw,
  MoreHorizontal, Copy, Eye, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#FFB900";

type Statut = "brouillon" | "envoyé" | "accepté" | "refusé" | "expiré" | "annulé";

interface Devis {
  id:             string;
  numero:         string;
  statut:         Statut;
  client_nom:     string;
  client_societe: string;
  date_document:  string | null;
  date_echeance:  string | null;
  total_ttc:      number;
}

const STATUTS: Record<Statut, { label: string; color: string; bg: string }> = {
  brouillon: { label: "Brouillon", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  envoyé:    { label: "Envoyé",   color: GOLD,       bg: "rgba(255,185,0,0.12)"   },
  accepté:   { label: "Accepté",  color: "#4ade80",  bg: "rgba(74,222,128,0.12)"  },
  refusé:    { label: "Refusé",   color: "#f87171",  bg: "rgba(248,113,113,0.12)" },
  expiré:    { label: "Expiré",   color: "#fb923c",  bg: "rgba(251,146,60,0.12)"  },
  annulé:    { label: "Annulé",   color: "#6b7280",  bg: "rgba(107,114,128,0.10)" },
};

const TABS: { key: Statut | ""; label: string }[] = [
  { key: "",         label: "Tous"       },
  { key: "envoyé",   label: "Envoyés"    },
  { key: "accepté",  label: "Acceptés"   },
  { key: "refusé",   label: "Refusés"    },
  { key: "expiré",   label: "Expirés"    },
  { key: "brouillon",label: "Brouillons" },
  { key: "annulé",   label: "Annulés"    },
];

const PAGE_SIZE = 20;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }).format(new Date(iso)); }
  catch { return iso; }
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
}

export default function DevisList() {
  const router  = useRouter();
  const { isDark } = useTheme();
  const [data,    setData]    = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [tab,     setTab]     = useState<Statut | "">("");
  const [page,    setPage]    = useState(1);
  const [menu,    setMenu]    = useState<string | null>(null);

  const pageBg      = isDark ? "#0f1117"                : "#f8f9fa";
  const textPrimary = isDark ? "#ffffff"                : "#0a0a0a";
  const textSecond  = isDark ? "rgba(255,255,255,0.55)" : "#4b5563";
  const textTert    = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";
  const cardBg      = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const cardBorder  = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const rowHover    = isDark ? "rgba(255,255,255,0.03)" : "#f9fafb";
  const divider     = isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6";

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const tid = setTimeout(() => document.addEventListener("click", close), 10);
    return () => { clearTimeout(tid); document.removeEventListener("click", close); };
  }, [menu]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: orgMember } = await supabase
        .from("organization_members").select("organization_id")
        .eq("user_id", user.id).in("role", ["owner", "admin"])
        .is("suspended_at", null).limit(1).maybeSingle();

      let q = supabase.from("documents")
        .select("id,numero,statut,client_nom,client_societe,date_document,date_echeance,total_ttc")
        .eq("type", "devis").is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (orgMember?.organization_id) q = q.eq("organization_id", orgMember.organization_id);
      else                             q = q.eq("user_id", user.id);

      const { data: rows, error: dbErr } = await q;
      if (dbErr) throw dbErr;
      setData((rows ?? []) as Devis[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let r = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(d => d.numero.toLowerCase().includes(q) || (d.client_nom || "").toLowerCase().includes(q) || (d.client_societe || "").toLowerCase().includes(q));
    }
    if (tab) r = r.filter(d => d.statut === tab);
    return r;
  }, [data, search, tab]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { "": data.length };
    TABS.slice(1).forEach(({ key }) => { c[key] = data.filter(d => d.statut === key).length; });
    return c;
  }, [data]);

  async function handleDuplicate(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: src } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
      if (!src) return;
      const res = await fetch("/api/factures/numero?type=devis&devise=EUR");
      const { numero } = res.ok ? await res.json() : { numero: src.numero + "-COPIE" };
      await supabase.from("documents").insert({ ...src, id: undefined, numero, statut: "brouillon", created_at: undefined, updated_at: undefined, source_id: id });
      await load();
    } catch (e) { console.error("[duplicate]", e); }
    setMenu(null);
  }

  return (
    <div className="min-h-full" style={{ background: pageBg }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: textPrimary }}>Devis</h1>
            <p className="mt-0.5 text-sm" style={{ color: textSecond }}>{data.length} devis</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:opacity-70"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: textTert }} />
            </button>
            <Link href="/client/factures/devis/nouveau"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
              style={{ background: GOLD }}>
              <Plus size={15} /> Nouveau devis
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: textTert }} />
            <input
              className="rounded-xl py-2 pl-9 pr-4 text-sm outline-none"
              style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: textPrimary, width: 280 }}
              placeholder="Rechercher par numéro, client..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70">
                <X size={12} style={{ color: textTert }} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => { setTab(key); setPage(1); }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                style={tab === key
                  ? { background: "rgba(255,185,0,0.15)", color: GOLD, border: `1px solid rgba(255,185,0,0.30)` }
                  : { background: cardBg, color: textSecond, border: `1px solid ${cardBorder}` }
                }>
                {label}
                {counts[key] > 0 && <span className="ml-1.5 opacity-60">{counts[key]}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin" style={{ color: textTert }} />
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
                <FileSignature size={20} style={{ color: textTert }} />
              </div>
              <div className="text-sm font-medium" style={{ color: textSecond }}>
                {search || tab ? "Aucun résultat" : "Aucun devis"}
              </div>
              {!search && !tab && (
                <Link href="/client/factures/devis/nouveau"
                  className="mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-black"
                  style={{ background: GOLD }}>
                  <Plus size={12} /> Créer un devis
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: textTert, borderBottom: `1px solid ${divider}` }}>
                      <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-widest">Numéro</th>
                      <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-widest">Client</th>
                      <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-widest">Date</th>
                      <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-widest">Validité</th>
                      <th className="px-5 py-3 text-left font-medium text-xs uppercase tracking-widest">Statut</th>
                      <th className="px-5 py-3 text-right font-medium text-xs uppercase tracking-widest">Montant TTC</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(d => {
                      const s = STATUTS[d.statut] ?? STATUTS.brouillon;
                      return (
                        <tr key={d.id} className="transition-colors" style={{ borderBottom: `1px solid ${divider}` }}
                          onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}>
                          <td className="px-5 py-3.5 font-semibold" style={{ color: textPrimary }}>{d.numero || "—"}</td>
                          <td className="px-5 py-3.5 max-w-[180px]">
                            <div className="truncate font-medium" style={{ color: textPrimary }}>{d.client_societe || d.client_nom || "—"}</div>
                            {d.client_societe && d.client_nom && <div className="truncate text-xs" style={{ color: textTert }}>{d.client_nom}</div>}
                          </td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: textSecond }}>{fmtDate(d.date_document)}</td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: d.statut === "expiré" ? "#f87171" : textSecond }}>{fmtDate(d.date_echeance)}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                              style={{ color: s.color, background: s.bg }}>{s.label}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold tabular-nums" style={{ color: textPrimary }}>
                            {fmtMoney(d.total_ttc)}
                          </td>
                          <td className="px-3 py-3.5 relative">
                            <button onClick={(e) => { e.stopPropagation(); setMenu(menu === d.id ? null : d.id); }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-70"
                              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
                              <MoreHorizontal size={14} style={{ color: textSecond }} />
                            </button>
                            {menu === d.id && (
                              <div className="absolute right-2 top-10 z-50 w-48 overflow-hidden rounded-xl py-1 shadow-xl"
                                style={{ background: isDark ? "#1a1b23" : "#ffffff", border: `1px solid ${cardBorder}` }}
                                onClick={e => e.stopPropagation()}>
                                {[
                                  { label: "Ouvrir", icon: Eye, action: () => { router.push(`/client/factures/documents?id=${d.id}`); setMenu(null); } },
                                  { label: "Dupliquer", icon: Copy, action: () => handleDuplicate(d.id) },
                                ].map(({ label, icon: Icon, action }) => (
                                  <button key={label} onClick={action}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition hover:opacity-80"
                                    style={{ color: textPrimary }}>
                                    <Icon size={14} style={{ color: textTert }} />
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden divide-y" style={{ borderColor: divider }}>
                {paged.map(d => {
                  const s = STATUTS[d.statut] ?? STATUTS.brouillon;
                  return (
                    <Link key={d.id} href={`/client/factures/documents?id=${d.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: textPrimary }}>{d.numero || "—"}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: s.color, background: s.bg }}>{s.label}</span>
                        </div>
                        <div className="mt-0.5 text-xs truncate" style={{ color: textTert }}>{d.client_societe || d.client_nom || "—"} · {fmtDate(d.date_document)}</div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: textPrimary }}>{fmtMoney(d.total_ttc)}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span style={{ color: textTert }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-30 hover:opacity-70"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <ChevronLeft size={14} style={{ color: textSecond }} />
              </button>
              <span style={{ color: textSecond }}>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-30 hover:opacity-70"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <ChevronRight size={14} style={{ color: textSecond }} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
