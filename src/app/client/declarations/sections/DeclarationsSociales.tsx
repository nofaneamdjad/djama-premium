"use client";

import { useState, useEffect } from "react";
import { Users, RefreshCw, Info, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, fmt, GOLD } from "../decl-utils";
import type { FiscalProfile } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  add: (msg: string, type?: "success" | "error") => void;
}

interface EmployeRow {
  id: string;
  prenom: string | null;
  nom: string | null;
  statut: string | null;
  contrat: string | null;
  date_entree: string | null;
  taux_horaire: number | null;
  salaire_brut: number | null;
}

interface PayeVars {
  periode: string;
  salaire_brut_total: number;
  charges_patronales: number;
  charges_salariales: number;
  nb_employes: number;
}

export default function DeclarationsSocialesSection({ userId, isDark, profile, add }: Props) {
  const t = tok(isDark);
  const now = new Date();
  const periodLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [employes, setEmployes] = useState<EmployeRow[]>([]);
  const [payeVars, setPayeVars] = useState<PayeVars | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase.from("employes")
        .select("id, prenom, nom, statut, contrat, date_entree, taux_horaire, salaire_brut")
        .eq("user_id", userId)
        .eq("statut", "actif")
        .order("nom"),
      supabase.from("rh_variables_paie")
        .select("salaire_brut, charges_patronales, charges_salariales")
        .eq("user_id", userId)
        .gte("periode", periodStart)
        .lte("periode", periodEnd),
    ]).then(([empRes, payRes]) => {
      setEmployes((empRes.data as EmployeRow[]) ?? []);
      const rows = payRes.data as Array<{ salaire_brut: number; charges_patronales: number; charges_salariales: number }> ?? [];
      if (rows.length > 0) {
        setPayeVars({
          periode: periodLabel,
          nb_employes: rows.length,
          salaire_brut_total: rows.reduce((s, r) => s + (r.salaire_brut ?? 0), 0),
          charges_patronales: rows.reduce((s, r) => s + (r.charges_patronales ?? 0), 0),
          charges_salariales: rows.reduce((s, r) => s + (r.charges_salariales ?? 0), 0),
        });
      }
      setLoading(false);
    });
  }, [userId]);

  if (!profile?.a_salaries) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <Users size={20} className="mx-auto mb-3" style={{ color: t.text3 }} />
        <p className="text-sm" style={{ color: t.text3 }}>Votre profil est configuré sans salariés.</p>
        <p className="text-xs mt-1" style={{ color: t.text4 }}>Activez "A des salariés" dans Paramètres pour accéder aux déclarations sociales.</p>
      </div>
    );
  }

  const totalCharges = (payeVars?.charges_patronales ?? 0) + (payeVars?.charges_salariales ?? 0);

  return (
    <div className="space-y-5">
      {/* Avertissement légal */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "#f87171" }} />
        <p className="text-[11px]" style={{ color: "#f87171" }}>
          Les déclarations sociales (DSN, URSSAF) nécessitent un logiciel de paie agréé.
          DJAMA ne génère pas de DSN officielle. Utilisez ces données comme récapitulatif
          pour votre logiciel de paie ou votre expert social.
        </p>
      </div>

      {/* Récap paie du mois */}
      <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15` }}>
              <Users size={13} style={{ color: GOLD }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: t.text }}>Récapitulatif paie — {periodLabel}</span>
          </div>
          {loading && <RefreshCw size={13} className="animate-spin" style={{ color: t.text3 }} />}
        </div>

        {!loading && !payeVars && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}25` }}>
            <Info size={13} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
            <p className="text-xs" style={{ color: t.text2 }}>
              Aucune variable de paie pour {periodLabel}. Saisissez les données dans{" "}
              <span style={{ color: GOLD }}>Paie & RH → Bulletins</span> pour calculer les charges.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Salariés actifs",      value: employes.length,                         unit: "personnes",  color: GOLD      },
            { label: "Salaires bruts",        value: payeVars?.salaire_brut_total ?? 0,       unit: "€",          color: t.text    },
            { label: "Charges patronales",    value: payeVars?.charges_patronales ?? 0,       unit: "€",          color: "#ef4444" },
            { label: "Charges salariales",    value: payeVars?.charges_salariales ?? 0,       unit: "€",          color: "#f59e0b" },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: t.glassMd, border: `1px solid ${t.borderSoft}` }}>
              {loading ? (
                <div className="animate-pulse h-5 w-16 rounded" style={{ background: t.border }} />
              ) : (
                <div className="text-base font-bold tabular-nums" style={{ color }}>
                  {unit === "€" ? fmt(value) : value}
                </div>
              )}
              <div className="text-[11px] mt-1" style={{ color: t.text3 }}>{label}</div>
            </div>
          ))}
        </div>

        {payeVars && (
          <div className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: t.glassMd, border: `1px solid ${t.borderSoft}` }}>
            <span className="text-sm" style={{ color: t.text2 }}>Total charges URSSAF estimées</span>
            <span className="text-base font-bold tabular-nums" style={{ color: "#ef4444" }}>{fmt(totalCharges)}</span>
          </div>
        )}
      </div>

      {/* Liste employés actifs */}
      {!loading && employes.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
            <span className="text-sm font-semibold" style={{ color: t.text }}>Salariés actifs ({employes.length})</span>
          </div>
          <div>
            {employes.map((e, i) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < employes.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `${GOLD}20`, color: GOLD }}>
                  {(e.prenom?.[0] ?? "?").toUpperCase()}{(e.nom?.[0] ?? "").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: t.text }}>
                    {[e.prenom, e.nom].filter(Boolean).join(" ") || "—"}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: t.text3 }}>
                    {e.contrat ?? "—"}{e.date_entree ? ` · depuis ${new Date(e.date_entree).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : ""}
                  </div>
                </div>
                {e.salaire_brut != null && (
                  <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: t.text }}>{fmt(e.salaire_brut)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liens DSN */}
      <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
        <p className="text-sm font-semibold mb-3" style={{ color: t.text }}>Déclaration DSN officielle</p>
        <p className="text-xs mb-4" style={{ color: t.text2 }}>
          La DSN doit être déposée via un logiciel de paie agréé (Sage, Silae, Nibelis…)
          ou directement sur net-entreprises.fr avant le 5 ou 15 du mois suivant.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="https://www.net-entreprises.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl transition-all"
            style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text2 }}
          >
            <ExternalLink size={13} style={{ color: GOLD }} />
            net-entreprises.fr — Dépôt DSN
          </a>
          <a
            href="https://www.urssaf.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl transition-all"
            style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text2 }}
          >
            <ExternalLink size={13} style={{ color: GOLD }} />
            urssaf.fr — Paiement des cotisations
          </a>
        </div>
      </div>
    </div>
  );
}
