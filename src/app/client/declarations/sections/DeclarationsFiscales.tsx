"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Plus, FileCheck2, Download, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw, Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, fmt, fmtDate, GOLD, DECL_STATUT_CFG } from "../decl-utils";
import type { Declaration, FiscalProfile, TvaKpis, TvaBreakdownRow } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  add: (msg: string, type?: "success" | "error") => void;
}

function monthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

const TVA_ACCOUNT_RATE: Record<string, number> = {
  "44571": 20, "44572": 10, "44573": 5.5, "44574": 2.1, "4457": 0,
};

export default function DeclarationsFiscalesSection({ userId, isDark, profile, add }: Props) {
  const t = tok(isDark);
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [decls, setDecls] = useState<Declaration[]>([]);
  const [tvaKpis, setTvaKpis]         = useState<TvaKpis | null>(null);
  const [tvaBreakdown, setTvaBreakdown] = useState<TvaBreakdownRow[]>([]);
  const [loading, setLoading]          = useState(true);
  const [creating, setCreating]        = useState(false);

  const periodStart = new Date(year, month, 1).toISOString().slice(0, 10);
  const periodEnd   = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  const periodLabel = new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase.from("decl_declarations")
        .select("*")
        .eq("user_id", userId)
        .eq("type_declaration", "tva_ca3")
        .gte("periode_debut", periodStart)
        .lte("periode_debut", periodStart)
        .order("created_at", { ascending: false }),
      supabase.rpc("get_kpis_from_journal", {
        p_user_id: userId, p_org_id: null, p_start: periodStart, p_end: periodEnd,
      }),
      supabase.rpc("get_tva_breakdown_from_journal", {
        p_user_id: userId, p_org_id: null, p_start: periodStart, p_end: periodEnd,
      }),
    ]).then(([declRes, kpisRes, tvaRes]) => {
      setDecls((declRes.data as Declaration[]) ?? []);
      const kRow = (kpisRes.data as TvaKpis[])?.[0];
      if (kRow) setTvaKpis(kRow);
      setTvaBreakdown((tvaRes.data as TvaBreakdownRow[])?.filter(r => Math.abs(r.net_amount) > 0.01) ?? []);
      setLoading(false);
    });
  }, [userId, year, month]);

  async function preparerTva() {
    if (!userId || !tvaKpis) return;
    setCreating(true);
    const solde = Math.max(0, (tvaKpis.tva_collectee ?? 0) - (tvaKpis.tva_deductible ?? 0));
    const payload = {
      user_id:         userId,
      type_declaration:"tva_ca3",
      libelle:         `TVA mensuelle (CA3) — ${periodLabel}`,
      pays:            profile?.pays_constitution ?? "FR",
      territoire:      profile?.territoire_fiscal ?? "FRA_METRO",
      periode_debut:   periodStart,
      periode_fin:     periodEnd,
      date_echeance:   new Date(year, month + 1, 25).toISOString().slice(0, 10),
      montant_tva:     tvaKpis.tva_collectee,
      montant_principal: solde,
      devise:          profile?.devise_principale ?? "EUR",
      statut:          "en_preparation" as const,
      donnees: {
        tva_collectee:  tvaKpis.tva_collectee,
        tva_deductible: tvaKpis.tva_deductible,
        ca_ht:          tvaKpis.ca_ht,
        charges_ht:     tvaKpis.charges_ht,
        breakdown:      tvaBreakdown,
        source:         "journal_comptable",
        avertissement:  "Montants calculés depuis les écritures comptables. Vérifier avant dépôt.",
      },
    };
    const { error } = await supabase.from("decl_declarations").insert(payload);
    setCreating(false);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add("Déclaration TVA créée en mode brouillon", "success");
    const { data } = await supabase.from("decl_declarations")
      .select("*").eq("user_id", userId).eq("type_declaration", "tva_ca3")
      .gte("periode_debut", periodStart).lte("periode_debut", periodStart).order("created_at", { ascending: false });
    setDecls((data as Declaration[]) ?? []);
  }

  async function updateStatut(id: string, statut: Declaration["statut"]) {
    await supabase.from("decl_declarations").update({ statut }).eq("id", id);
    setDecls(prev => prev.map(d => d.id === id ? { ...d, statut } : d));
  }

  function exportTvaTxt(d: Declaration) {
    const data = d.donnees as Record<string, number>;
    const lines = [
      `EXPORT TVA — ${d.libelle}`,
      `Période : ${fmtDate(d.periode_debut)} au ${fmtDate(d.periode_fin)}`,
      `Échéance : ${d.date_echeance ? fmtDate(d.date_echeance) : "—"}`,
      "",
      `CA HT               : ${fmt(data.ca_ht ?? 0)}`,
      `TVA collectée        : ${fmt(data.tva_collectee ?? 0)}`,
      `TVA déductible       : ${fmt(data.tva_deductible ?? 0)}`,
      `Solde à payer        : ${fmt(d.montant_principal ?? 0)}`,
      "",
      "⚠ Ce document est un export de préparation DJAMA.",
      "  Il ne constitue pas une déclaration officielle.",
      "  Déposez sur impots.gouv.fr après vérification.",
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `TVA_${monthKey(year, month)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  const solde = tvaKpis ? Math.max(0, tvaKpis.tva_collectee - tvaKpis.tva_deductible) : 0;

  if (profile && !profile.assujetti_tva) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <Info size={20} className="mx-auto mb-3" style={{ color: t.text3 }} />
        <p className="text-sm" style={{ color: t.text3 }}>Votre profil est configuré en franchise ou non assujetti à la TVA.</p>
        <p className="text-xs mt-1" style={{ color: t.text4 }}>Si cela a changé, mettez à jour votre profil fiscal dans Paramètres.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sélecteur de période */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { const d = new Date(year, month - 1); setYear(d.getFullYear()); setMonth(d.getMonth()); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}
        >
          <ChevronLeft size={14} style={{ color: t.text2 }} />
        </button>
        <span className="text-sm font-semibold capitalize flex-1 text-center" style={{ color: t.text }}>{periodLabel}</span>
        <button
          onClick={() => { const d = new Date(year, month + 1); setYear(d.getFullYear()); setMonth(d.getMonth()); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}
        >
          <ChevronRight size={14} style={{ color: t.text2 }} />
        </button>
      </div>

      {/* Données TVA depuis le journal comptable */}
      <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15` }}>
              <TrendingUp size={13} style={{ color: GOLD }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: t.text }}>TVA mensuelle (CA3)</span>
          </div>
          {loading && <RefreshCw size={13} className="animate-spin" style={{ color: t.text3 }} />}
        </div>

        {!loading && !tvaKpis?.has_data && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}25` }}>
            <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
            <p className="text-xs" style={{ color: t.text2 }}>
              Aucune écriture comptable trouvée pour {periodLabel}. Synchronisez vos données depuis{" "}
              <span style={{ color: GOLD }}>Comptabilité → Sync</span> pour calculer la TVA.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "TVA collectée",  value: tvaKpis?.tva_collectee ?? 0,  color: "#ef4444" },
            { label: "TVA déductible", value: tvaKpis?.tva_deductible ?? 0, color: "#22c55e" },
            { label: "Solde à payer",  value: solde,                         color: GOLD      },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: t.glassMd ?? t.glass, border: `1px solid ${t.borderSoft}` }}>
              {loading ? (
                <div className="animate-pulse h-5 w-16 rounded mb-1" style={{ background: t.border }} />
              ) : (
                <div className="text-base font-bold tabular-nums" style={{ color }}>{fmt(value)}</div>
              )}
              <div className="text-[11px] mt-1" style={{ color: t.text3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Ventilation par taux */}
        {tvaBreakdown.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: t.text4 }}>Ventilation par taux</p>
            <div className="space-y-1.5">
              {tvaBreakdown.map(row => {
                const rate = TVA_ACCOUNT_RATE[row.account_code] ?? 0;
                const base = rate > 0 ? row.net_amount / (rate / 100) : 0;
                return (
                  <div key={row.account_code} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
                    style={{ background: t.glass, border: `1px solid ${t.borderSoft}` }}>
                    <span style={{ color: t.text2 }}>TVA {rate}% — Base {fmt(base)}</span>
                    <span className="font-semibold tabular-nums" style={{ color: t.text }}>{fmt(row.net_amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Avertissement légal */}
        <div className="rounded-xl px-3 py-2.5 mb-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-[11px]" style={{ color: "#f87171" }}>
            Ces montants sont calculés depuis vos écritures comptables et ne constituent pas une déclaration officielle.
            Vérifiez et déposez sur <strong>impots.gouv.fr</strong> après validation de votre expert-comptable.
          </p>
        </div>

        {decls.length === 0 ? (
          <button
            onClick={preparerTva}
            disabled={creating || loading || !tvaKpis?.has_data || !userId}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: GOLD, color: "#111" }}
          >
            <Plus size={14} />
            {creating ? "Création…" : "Préparer la déclaration TVA"}
          </button>
        ) : null}
      </div>

      {/* Déclarations existantes */}
      {decls.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: t.text }}>Déclarations de {periodLabel}</h3>
          {decls.map(d => {
            const cfg = DECL_STATUT_CFG[d.statut];
            const data = d.donnees as Record<string, number>;
            return (
              <div key={d.id} className="rounded-2xl p-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: t.text }}>{d.libelle}</div>
                    {d.date_echeance && (
                      <div className="text-xs mt-0.5" style={{ color: t.text3 }}>Échéance : {fmtDate(d.date_echeance)}</div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div><span style={{ color: t.text3 }}>TVA collectée</span><br /><strong style={{ color: t.text }}>{fmt(data.tva_collectee ?? 0)}</strong></div>
                  <div><span style={{ color: t.text3 }}>TVA déductible</span><br /><strong style={{ color: t.text }}>{fmt(data.tva_deductible ?? 0)}</strong></div>
                  <div><span style={{ color: t.text3 }}>À payer</span><br /><strong style={{ color: GOLD }}>{fmt(d.montant_principal ?? 0)}</strong></div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {d.statut === "en_preparation" && (
                    <button
                      onClick={() => updateStatut(d.id, "a_valider")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                      style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }}
                    >
                      Marquer à valider
                    </button>
                  )}
                  {d.statut === "a_valider" && (
                    <button
                      onClick={() => updateStatut(d.id, "validee")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
                    >
                      Valider
                    </button>
                  )}
                  <button
                    onClick={() => exportTvaTxt(d)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95"
                    style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                  >
                    <Download size={11} /> Export .txt
                  </button>
                  {["validee","deposee"].includes(d.statut) && (
                    <a
                      href="https://www.impots.gouv.fr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95"
                      style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}
                    >
                      <FileCheck2 size={11} /> impots.gouv.fr
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
