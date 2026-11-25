"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ReceiptText, FileSignature, Sparkles, History,
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  Loader2, RefreshCw, ArrowRight, ChevronRight,
  Plus, Download, Eye, Copy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#FFB900";

type DocStatut = "brouillon" | "envoyé" | "payé" | "en_retard" | "partiellement_payé" | "annulé" | "accepté" | "refusé" | "expiré";

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

interface KPI {
  total_facture:  number;
  total_encaisse: number;
  total_attente:  number;
  total_retard:   number;
  nb_factures:    number;
  nb_devis:       number;
}

const STATUT_MAP: Record<string, { label: string; color: string; bg: string }> = {
  brouillon:          { label: "Brouillon",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  envoyé:             { label: "Envoyé",      color: GOLD,      bg: "rgba(255,185,0,0.12)"   },
  payé:               { label: "Payé",        color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  en_retard:          { label: "En retard",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  partiellement_payé: { label: "Part. payé",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  annulé:             { label: "Annulé",      color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
  accepté:            { label: "Accepté",     color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  refusé:             { label: "Refusé",      color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  expiré:             { label: "Expiré",      color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
};

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " M€";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(".", ",") + " k€";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " €";
}

function fmtDate(s: string) {
  if (!s) return "—";
  try { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(s)); }
  catch { return s; }
}

export default function VueEnsemble() {
  const { isDark } = useTheme();
  const router     = useRouter();
  const sp         = useSearchParams();
  const [docs,    setDocs]    = useState<Doc[]>([]);
  const [kpi,     setKpi]     = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // ── theme tokens ─────────────────────────────────────────────────────────────
  const pageBg      = isDark ? "#0f1117"                  : "#f8f9fa";
  const textPrimary = isDark ? "#ffffff"                  : "#0a0a0a";
  const textSecond  = isDark ? "rgba(255,255,255,0.55)"   : "#4b5563";
  const textTertiary= isDark ? "rgba(255,255,255,0.35)"   : "#9ca3af";
  const cardBg      = isDark ? "rgba(255,255,255,0.04)"   : "#ffffff";
  const cardBorder  = isDark ? "rgba(255,255,255,0.08)"   : "#e5e7eb";
  const rowHover    = isDark ? "rgba(255,255,255,0.03)"   : "#f9fafb";
  const shimmerBg   = isDark ? "rgba(255,255,255,0.06)"   : "#f3f4f6";

  // ── redirect legacy editor params ───────────────────────────────────────────
  useEffect(() => {
    if (sp.has("new") || sp.has("type") || sp.has("from_contrat")) {
      router.replace(`/client/factures/documents?${sp.toString()}`);
    }
  }, [sp, router]);

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
        .order("created_at", { ascending: false })
        .limit(200);

      if (orgMember?.organization_id) q = q.eq("organization_id", orgMember.organization_id);
      else                            q = q.eq("user_id", user.id);

      const { data, error: dbErr } = await q;
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
      const totalAttente = factures
        .filter(d => d.statut === "envoyé" || d.statut === "partiellement_payé")
        .reduce((s, d) => s + Math.max(0, (d.total_ttc || 0) - (d.montant_paye || 0)), 0);
      const totalRetard = factures
        .filter(d => d.statut === "en_retard")
        .reduce((s, d) => s + Math.max(0, (d.total_ttc || 0) - (d.montant_paye || 0)), 0);

      setKpi({ total_facture: totalFacture, total_encaisse: totalEncaisse, total_attente: totalAttente, total_retard: totalRetard, nb_factures: factures.length, nb_devis: devis.length });
    } catch (e) {
      console.error("[VueEnsemble]", e);
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const recent = docs.slice(0, 8);

  return (
    <div className="min-h-full" style={{ background: pageBg }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>
              Facturation
            </h1>
            <p className="mt-1 text-sm" style={{ color: textSecond }}>
              Gérez vos factures, devis et paiements
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-70"
            style={{ background: cardBg, color: textTertiary, border: `1px solid ${cardBorder}` }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
            {error}
          </div>
        )}

        {/* ── 4 Action cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

          {/* Créer une facture */}
          <Link
            href="/client/factures/factures/nouveau"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: GOLD, minHeight: 140 }}
          >
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-black/15">
                <ReceiptText size={18} className="text-black" />
              </div>
              <div className="text-sm font-bold text-black">Créer une facture</div>
              <div className="mt-0.5 text-[11px] text-black/60">Factures professionnelles PDF</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-black/70">
              <span>Commencer</span>
              <ArrowRight size={11} />
            </div>
          </Link>

          {/* Créer un devis */}
          <Link
            href="/client/factures/devis/nouveau"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: isDark ? "#1a1a2e" : "#0a0a0a", minHeight: 140 }}
          >
            <div>
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.10)" }}
              >
                <FileSignature size={18} className="text-white" />
              </div>
              <div className="text-sm font-bold text-white">Créer un devis</div>
              <div className="mt-0.5 text-[11px] text-white/50">Propositions commerciales</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-white/60">
              <span>Commencer</span>
              <ArrowRight size={11} />
            </div>
          </Link>

          {/* DJAMA IA */}
          <Link
            href="/client/factures/documents?ai=1"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", minHeight: 140 }}
          >
            <div>
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(165,180,252,0.15)" }}
              >
                <Sparkles size={18} style={{ color: "#a5b4fc" }} />
              </div>
              <div className="text-sm font-bold text-white">DJAMA IA</div>
              <div className="mt-0.5 text-[11px] text-white/50">Générez par langage naturel</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#a5b4fc" }}>
              <span>Essayer</span>
              <ArrowRight size={11} />
            </div>
          </Link>

          {/* Historique */}
          <Link
            href="/client/factures/liste"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, minHeight: 140 }}
          >
            <div>
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6" }}
              >
                <History size={18} style={{ color: textSecond }} />
              </div>
              <div className="text-sm font-bold" style={{ color: textPrimary }}>Historique</div>
              <div className="mt-0.5 text-[11px]" style={{ color: textTertiary }}>Tous vos documents</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: textTertiary }}>
              <span>Consulter</span>
              <ArrowRight size={11} />
            </div>
          </Link>
        </div>

        {/* ── KPI tiles ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total facturé",   value: kpi ? fmt(kpi.total_facture)  : "—", sub: kpi ? `${kpi.nb_factures} facture${kpi.nb_factures !== 1 ? "s" : ""}` : undefined, Icon: TrendingUp,   col: GOLD,      bg: "rgba(255,185,0,0.10)",     bd: "rgba(255,185,0,0.20)" },
            { label: "Encaissé",        value: kpi ? (kpi.nb_factures === 0 ? "—" : fmt(kpi.total_encaisse)) : "—", sub: kpi && kpi.total_facture > 0 ? `${Math.round(kpi.total_encaisse / kpi.total_facture * 100)} %` : undefined, Icon: CheckCircle2, col: "#4ade80", bg: "rgba(74,222,128,0.08)",   bd: "rgba(74,222,128,0.20)" },
            { label: "En attente",      value: kpi ? fmt(kpi.total_attente)  : "—", sub: "Envoyées, non réglées",                          Icon: Clock,        col: "#60a5fa", bg: "rgba(96,165,250,0.08)",   bd: "rgba(96,165,250,0.20)" },
            { label: "En retard",       value: kpi ? fmt(kpi.total_retard)   : "—", sub: "Échéance dépassée",                              Icon: AlertTriangle, col: "#f87171", bg: "rgba(248,113,113,0.08)", bd: "rgba(248,113,113,0.20)" },
          ].map(({ label, value, sub, Icon, col, bg, bd }) => (
            <div key={label} className="flex flex-col gap-3 rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: textTertiary }}>{label}</span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: bg, border: `1px solid ${bd}` }}>
                  <Icon size={14} style={{ color: col }} />
                </div>
              </div>
              {loading
                ? <div className="h-7 w-20 animate-pulse rounded-lg" style={{ background: shimmerBg }} />
                : (
                  <div>
                    <div className="text-2xl font-bold tracking-tight" style={{ color: textPrimary, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                    {sub && <div className="mt-0.5 text-xs" style={{ color: textTertiary }}>{sub}</div>}
                  </div>
                )
              }
            </div>
          ))}
        </div>

        {/* ── Documents récents ── */}
        <div className="rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>Documents récents</h2>
            <Link
              href="/client/factures/liste"
              className="flex items-center gap-1 text-xs font-medium transition hover:opacity-70"
              style={{ color: GOLD }}
            >
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin" style={{ color: textTertiary }} />
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
                <ReceiptText size={20} style={{ color: textTertiary }} />
              </div>
              <div className="text-sm font-medium" style={{ color: textSecond }}>Aucun document</div>
              <div className="mt-1 text-xs" style={{ color: textTertiary }}>Créez votre première facture ou devis</div>
              <Link
                href="/client/factures/factures/nouveau"
                className="mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-black transition hover:opacity-80"
                style={{ background: GOLD }}
              >
                <Plus size={12} /> Créer une facture
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: cardBorder }}>
              {recent.map(doc => {
                const s = STATUT_MAP[doc.statut] ?? STATUT_MAP.brouillon;
                const client = doc.client_societe || doc.client_nom || "—";
                return (
                  <Link
                    key={doc.id}
                    href={`/client/factures/documents?id=${doc.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                    style={{ ["--hover-bg" as string]: rowHover } as React.CSSProperties}
                    onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    {/* Type badge */}
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold uppercase tracking-wide"
                      style={
                        doc.type === "facture"
                          ? { background: "rgba(255,185,0,0.12)", color: GOLD }
                          : doc.type === "devis"
                          ? { background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: textSecond }
                          : { background: "rgba(96,165,250,0.12)", color: "#60a5fa" }
                      }
                    >
                      {doc.type === "facture" ? "FAC" : doc.type === "devis" ? "DEV" : "AVO"}
                    </div>

                    {/* Number + client */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: textPrimary }}>{doc.numero || "—"}</span>
                      </div>
                      <div className="text-xs truncate" style={{ color: textTertiary }}>{client}</div>
                    </div>

                    {/* Date */}
                    <div className="hidden shrink-0 text-xs sm:block" style={{ color: textTertiary }}>
                      {fmtDate(doc.date_document)}
                    </div>

                    {/* Status */}
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: s.color, background: s.bg }}
                    >
                      {s.label}
                    </span>

                    {/* Amount */}
                    <div className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: textPrimary }}>
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(doc.total_ttc || 0)}
                    </div>

                    <ChevronRight size={14} style={{ color: textTertiary, flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick links ── */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { href: "/client/factures/factures",   label: "Toutes les factures" },
            { href: "/client/factures/devis",       label: "Tous les devis" },
            { href: "/client/factures/clients",     label: "Clients" },
            { href: "/client/factures/stats",       label: "Statistiques" },
            { href: "/client/factures/galerie",     label: "Galerie modèles" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-70"
              style={{ background: cardBg, color: textSecond, border: `1px solid ${cardBorder}` }}
            >
              {label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
