"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, Calendar, FileCheck2,
  TrendingUp, ArrowRight, RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, fmt, fmtDate, daysUntil, GOLD, DECL_STATUT_CFG, ECHEANCE_STATUT_CFG } from "../decl-utils";
import type { Declaration, Echeance, FiscalProfile, SectionId } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  onNavigate: (s: SectionId) => void;
}

export default function OverviewSection({ userId, isDark, profile, onNavigate }: Props) {
  const t = tok(isDark);
  const [decls, setDecls]         = useState<Declaration[]>([]);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [tvaKpis, setTvaKpis]     = useState<{ tva_collectee: number; tva_deductible: number; has_data: boolean } | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!userId) return;
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const start = new Date(y, m, 1).toISOString().slice(0, 10);
    const end   = new Date(y, m + 1, 0).toISOString().slice(0, 10);

    Promise.all([
      supabase.from("decl_declarations")
        .select("*")
        .eq("user_id", userId)
        .order("date_echeance", { ascending: true })
        .limit(20),
      supabase.from("decl_echeances")
        .select("*")
        .eq("user_id", userId)
        .gte("date_echeance", start)
        .order("date_echeance", { ascending: true })
        .limit(10),
      supabase.rpc("get_kpis_from_journal", {
        p_user_id: userId, p_org_id: null, p_start: start, p_end: end,
      }),
    ]).then(([declRes, echRes, kpisRes]) => {
      setDecls((declRes.data as Declaration[]) ?? []);
      setEcheances((echRes.data as Echeance[]) ?? []);
      const kRow = (kpisRes.data as Array<{ tva_collectee: number; tva_deductible: number; has_data: boolean }>)?.[0];
      if (kRow) setTvaKpis(kRow);
      setLoading(false);
    });
  }, [userId]);

  const enRetard   = decls.filter(d => d.date_echeance && new Date(d.date_echeance) < new Date() && !["deposee","accusee"].includes(d.statut));
  const enCours    = decls.filter(d => ["brouillon","en_preparation","a_valider","validee"].includes(d.statut));
  const deposees   = decls.filter(d => ["deposee","accusee"].includes(d.statut));
  const prochaines = echeances.filter(e => e.statut === "a_faire").slice(0, 5);

  const kpis = [
    { label: "En retard",      value: enRetard.length,  color: "#ef4444", icon: AlertTriangle, section: "historique" as SectionId },
    { label: "En préparation", value: enCours.length,   color: GOLD,      icon: Clock,         section: "fiscales"  as SectionId },
    { label: "Déposées",       value: deposees.length,  color: "#22c55e", icon: CheckCircle2,  section: "historique" as SectionId },
    { label: "Échéances",      value: prochaines.length,color: "#3b82f6", icon: Calendar,      section: "calendrier" as SectionId },
  ];

  if (!profile) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
          <FileCheck2 size={22} style={{ color: GOLD }} />
        </div>
        <h3 className="text-base font-bold mb-2" style={{ color: t.text }}>Configuration requise</h3>
        <p className="text-sm mb-5" style={{ color: t.text3 }}>
          Configurez votre profil fiscal pour activer le module Déclarations.
        </p>
        <button
          onClick={() => onNavigate("parametres")}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: GOLD, color: "#111" }}
        >
          Configurer mon profil fiscal <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPIs — cards avec barre d'accent gradient */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, color, icon: Icon, section }) => (
          <button
            key={label}
            onClick={() => onNavigate(section)}
            className="group relative flex flex-col rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: t.glass, border: `1px solid ${t.border}` }}
          >
            {/* Accent gradient bar */}
            <div className="h-0.5 w-full" style={{
              background: `linear-gradient(90deg, ${color}00 0%, ${color} 50%, ${color}00 100%)`
            }} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <ArrowRight size={11} className="opacity-0 group-hover:opacity-50 transition-opacity mt-1.5" style={{ color: t.text3 }} />
              </div>
              {loading ? (
                <div className="animate-pulse h-7 w-10 rounded" style={{ background: t.border }} />
              ) : (
                <div className="text-2xl font-black tabular-nums leading-none" style={{ color }}>
                  {value}
                </div>
              )}
              <div className="text-[11px] font-medium mt-2" style={{ color: t.text3 }}>{label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* TVA du mois depuis la comptabilité */}
      {tvaKpis?.has_data && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}
        >
          <div className="h-px w-full" style={{
            background: `linear-gradient(90deg, transparent 0%, ${GOLD}60 30%, ${GOLD} 50%, ${GOLD}60 70%, transparent 100%)`
          }} />
          <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: GOLD }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>
                TVA — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${GOLD}15`, color: GOLD }}>
                Depuis la comptabilité
              </span>
            </div>
            <button onClick={() => onNavigate("fiscales")} className="text-xs flex items-center gap-0.5" style={{ color: t.text3 }}>
              Préparer <ArrowRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "TVA collectée",  value: tvaKpis.tva_collectee,  color: "#ef4444" },
              { label: "TVA déductible", value: tvaKpis.tva_deductible, color: "#22c55e" },
              { label: "Solde à payer",  value: Math.max(0, tvaKpis.tva_collectee - tvaKpis.tva_deductible), color: GOLD },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: t.glassMd, border: `1px solid ${t.borderSoft}` }}>
                <div className="text-base font-bold tabular-nums" style={{ color }}>{fmt(value)}</div>
                <div className="text-[11px] mt-1" style={{ color: t.text3 }}>{label}</div>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* Prochaines échéances */}
      <div className="rounded-2xl overflow-hidden" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: GOLD }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Prochaines échéances</span>
          </div>
          <button onClick={() => onNavigate("calendrier")} className="text-xs flex items-center gap-0.5" style={{ color: t.text3 }}>
            Calendrier <ArrowRight size={10} />
          </button>
        </div>
        {prochaines.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm" style={{ color: t.text3 }}>
              {echeances.length === 0 ? "Aucune échéance configurée ce mois-ci" : "Toutes les échéances sont à jour"}
            </p>
          </div>
        ) : (
          <div>
            {prochaines.map((e, i) => {
              const days = daysUntil(e.date_echeance);
              const urgent = days <= 7;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderBottom: i < prochaines.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: urgent ? "rgba(239,68,68,0.1)" : `${GOLD}12` }}>
                    <Calendar size={14} style={{ color: urgent ? "#ef4444" : GOLD }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: t.text }}>{e.libelle}</div>
                    <div className="text-xs mt-0.5" style={{ color: t.text3 }}>{fmtDate(e.date_echeance)}</div>
                  </div>
                  {e.montant_estime != null && (
                    <div className="text-xs font-semibold tabular-nums shrink-0" style={{ color: t.text2 }}>
                      {fmt(e.montant_estime, e.devise)}
                    </div>
                  )}
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ background: urgent ? "rgba(239,68,68,0.12)" : `${GOLD}15`, color: urgent ? "#ef4444" : GOLD }}
                  >
                    {days <= 0 ? "Aujourd'hui" : `J−${days}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Déclarations récentes */}
      {decls.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
            <div className="flex items-center gap-2">
              <FileCheck2 size={14} style={{ color: GOLD }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>Déclarations récentes</span>
            </div>
            <button onClick={() => onNavigate("historique")} className="text-xs flex items-center gap-0.5" style={{ color: t.text3 }}>
              Tout voir <ArrowRight size={10} />
            </button>
          </div>
          <div>
            {decls.slice(0, 5).map((d, i) => {
              const cfg = DECL_STATUT_CFG[d.statut];
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderBottom: i < Math.min(decls.length, 5) - 1 ? `1px solid ${t.borderSoft}` : "none" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: t.text }}>{d.libelle}</div>
                    <div className="text-xs mt-0.5" style={{ color: t.text3 }}>
                      {d.date_echeance ? fmtDate(d.date_echeance) : "—"}
                    </div>
                  </div>
                  {d.montant_principal != null && (
                    <div className="text-xs font-semibold tabular-nums shrink-0" style={{ color: t.text2 }}>
                      {fmt(d.montant_principal, d.devise)}
                    </div>
                  )}
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
