"use client";

import { useState, useEffect } from "react";
import {
  Users, Banknote, TrendingUp, Euro, AlertCircle,
  CalendarDays, FileText, ArrowRight, CheckCircle2, Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe, DemandeConge, RhContrat, SectionId } from "../rh-types";
import { calcNet, calcCharges, fmt } from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  isDark: boolean;
  onNavigate: (s: SectionId) => void;
}

export default function OverviewSection({ userId, employes, isDark, onNavigate }: Props) {
  const [congesPending, setCongesPending] = useState<(DemandeConge & { employe?: { nom: string } })[]>([]);
  const [contratsExpiring, setContratsExpiring] = useState<(RhContrat & { employe?: { nom: string } })[]>([]);
  const [bulletinsCount, setBulletinsCount] = useState({ generated: 0, total: 0 });

  const card  = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri   = isDark ? "text-white"        : "text-gray-900";
  const sec   = isDark ? "text-white/70"     : "text-gray-600";
  const mut   = isDark ? "text-white/40"     : "text-gray-400";
  const faint = isDark ? "text-white/20"     : "text-gray-300";
  const divs  = isDark ? "divide-white/[0.05]" : "divide-black/[0.05]";

  useEffect(() => {
    if (!userId) return;
    const month = new Date().toISOString().slice(0, 7);
    Promise.all([
      supabase.from("rh_demandes_conges")
        .select("*, employe:employes(nom)")
        .eq("user_id", userId)
        .eq("statut", "en_attente")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("rh_contrats")
        .select("*, employe:employes(nom)")
        .eq("user_id", userId)
        .eq("statut", "actif")
        .not("date_fin", "is", null)
        .lte("date_fin", new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10))
        .order("date_fin", { ascending: true })
        .limit(5),
      supabase.from("payslips")
        .select("employee_id")
        .eq("user_id", userId)
        .eq("month_key", month),
    ]).then(([congesRes, contratsRes, bulletinsRes]) => {
      setCongesPending((congesRes.data as (DemandeConge & { employe?: { nom: string } })[]) ?? []);
      setContratsExpiring((contratsRes.data as (RhContrat & { employe?: { nom: string } })[]) ?? []);
      const actifs = employes.filter(e => e.actif).length;
      setBulletinsCount({
        generated: new Set((bulletinsRes.data ?? []).map((r: { employee_id: string }) => r.employee_id)).size,
        total: actifs,
      });
    });
  }, [userId, employes]);

  const actifs        = employes.filter(e => e.actif);
  const masseTotal    = actifs.reduce((s, e) => s + e.salaire_brut, 0);
  const chargesTotal  = actifs.reduce((s, e) => s + calcCharges(e.salaire_brut), 0);
  const netTotal      = actifs.reduce((s, e) => s + calcNet(e.salaire_brut), 0);

  const kpis = [
    { label: "Effectif actif",    value: actifs.length.toString(),   color: "#10b981", icon: Users      },
    { label: "Masse salariale",   value: fmt(masseTotal),            color: "#c9a55a", icon: Banknote   },
    { label: "Charges patronales",value: fmt(chargesTotal),          color: "#f43f5e", icon: TrendingUp },
    { label: "Coût total",        value: fmt(masseTotal + chargesTotal), color: "#c9a55a", icon: Euro   },
  ];

  const TYPE_CONGE: Record<string, string> = {
    cp: "Congés payés", rtt: "RTT", maladie: "Maladie",
    maternite: "Maternité", paternite: "Paternité",
    sans_solde: "Sans solde", exceptionnel: "Événement familial",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
        <h2 className={`mt-1 text-2xl font-black ${pri}`}>Vue d&apos;ensemble</h2>
        <p className={`mt-1 text-sm ${mut}`}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border p-5 ${card}`}>
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl" style={{ background: color }} />
            <p className="mb-2 text-2xl font-black" style={{ color }}>{value}</p>
            <div className="flex items-center gap-1.5">
              <Icon size={11} style={{ color }} />
              <p className={`text-xs font-semibold ${mut}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Congés en attente */}
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <div className="flex items-center gap-2.5">
              <CalendarDays size={14} className="text-[#c9a55a]" />
              <p className={`text-sm font-bold ${pri}`}>Congés en attente</p>
              {congesPending.length > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500">
                  {congesPending.length}
                </span>
              )}
            </div>
            <button onClick={() => onNavigate("conges")} className={`text-xs font-semibold flex items-center gap-1 ${mut} hover:${sec} transition`}>
              Voir tout <ArrowRight size={11} />
            </button>
          </div>
          <div className={`divide-y ${divs}`}>
            {congesPending.length === 0 ? (
              <p className={`py-8 text-center text-sm ${faint}`}>Aucune demande en attente</p>
            ) : congesPending.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Clock size={13} className="text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${sec}`}>{c.employe?.nom ?? "—"}</p>
                  <p className={`text-xs ${mut}`}>
                    {TYPE_CONGE[c.type] ?? c.type} — {c.nb_jours}j
                    {" · "}
                    {new Date(c.date_debut).toLocaleDateString("fr-FR")} au {new Date(c.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-500">
                  En attente
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contrats expirant */}
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <div className="flex items-center gap-2.5">
              <AlertCircle size={14} className="text-orange-400" />
              <p className={`text-sm font-bold ${pri}`}>Contrats bientôt expirés</p>
              {contratsExpiring.length > 0 && (
                <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-400">
                  {contratsExpiring.length}
                </span>
              )}
            </div>
            <button onClick={() => onNavigate("contrats")} className={`text-xs font-semibold flex items-center gap-1 ${mut} hover:${sec} transition`}>
              Voir tout <ArrowRight size={11} />
            </button>
          </div>
          <div className={`divide-y ${divs}`}>
            {contratsExpiring.length === 0 ? (
              <p className={`py-8 text-center text-sm ${faint}`}>Aucun contrat expirant sous 60j</p>
            ) : contratsExpiring.map(c => {
              const daysLeft = Math.round((new Date(c.date_fin!).getTime() - Date.now()) / (24 * 3600 * 1000));
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <FileText size={13} className="text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${sec}`}>{(c as { employe?: { nom: string } }).employe?.nom ?? "—"}</p>
                    <p className={`text-xs ${mut}`}>{c.type_contrat} — fin le {new Date(c.date_fin!).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${daysLeft <= 14 ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"}`}>
                    J−{daysLeft}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bulletins du mois */}
      <div className={`overflow-hidden rounded-2xl ${card}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
          <div className="flex items-center gap-2.5">
            <FileText size={14} className="text-[#c9a55a]" />
            <p className={`text-sm font-bold ${pri}`}>Bulletins — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
          </div>
          <button onClick={() => onNavigate("paie")} className={`text-xs font-semibold flex items-center gap-1 ${mut} transition`}>
            Gérer <ArrowRight size={11} />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className={`text-sm ${sec}`}>{bulletinsCount.generated} / {bulletinsCount.total} générés</p>
            <p className={`text-sm font-bold ${bulletinsCount.generated === bulletinsCount.total && bulletinsCount.total > 0 ? "text-emerald-400" : mut}`}>
              {bulletinsCount.total === 0 ? "—" : Math.round((bulletinsCount.generated / bulletinsCount.total) * 100)}%
            </p>
          </div>
          <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/8" : "bg-black/7"}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#c9a55a] to-[#f0c97a] transition-all"
              style={{ width: bulletinsCount.total > 0 ? `${Math.round((bulletinsCount.generated / bulletinsCount.total) * 100)}%` : "0%" }}
            />
          </div>
          {bulletinsCount.generated === bulletinsCount.total && bulletinsCount.total > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={12} /> Tous les bulletins ont été générés ce mois-ci
            </p>
          )}
        </div>
      </div>

      {/* Répartition masse salariale */}
      {actifs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Net versé", value: fmt(netTotal),    color: "#10b981", sub: `${Math.round((netTotal / masseTotal) * 100)}% de la masse` },
            { label: "Cot. salariales", value: fmt(masseTotal - netTotal), color: "#f59e0b", sub: `${Math.round(((masseTotal - netTotal) / masseTotal) * 100)}% de la masse` },
            { label: "Charges patronales", value: fmt(chargesTotal), color: "#f43f5e", sub: `${Math.round((chargesTotal / masseTotal) * 100)}% de la masse` },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className={`relative overflow-hidden rounded-2xl border p-4 ${card}`}>
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-xl" style={{ background: color }} />
              <p className="text-lg font-black" style={{ color }}>{value}</p>
              <p className={`mt-1 text-xs font-semibold ${mut}`}>{label}</p>
              <p className={`mt-0.5 text-xs ${faint}`}>{sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
