"use client";

import { useState } from "react";
import {
  BarChart2, Download, FileText, Users, Banknote, CalendarDays, TrendingUp,
} from "lucide-react";
import type { Employe } from "../rh-types";
import {
  calcNet, calcCharges, fmt, fmt2, COT_SAL, COT_PAT,
  TOTAL_COT_SAL, TOTAL_COT_PAT, CONTRAT_COLORS,
} from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  add: (msg: string, type?: "success" | "error") => void;
  isDark: boolean;
}

export default function RapportsSection({ userId, employes, add, isDark }: Props) {
  const [monthKey] = useState(new Date().toISOString().slice(0, 7));

  const card  = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri   = isDark ? "text-white"    : "text-gray-900";
  const sec   = isDark ? "text-white/70" : "text-gray-600";
  const mut   = isDark ? "text-white/40" : "text-gray-400";
  const faint = isDark ? "text-white/20" : "text-gray-300";
  const divs  = isDark ? "divide-white/[0.04]" : "divide-black/[0.04]";

  const actifs   = employes.filter(e => e.actif);
  const archives = employes.filter(e => !e.actif);

  const masseTotal    = actifs.reduce((s, e) => s + e.salaire_brut, 0);
  const netTotal      = actifs.reduce((s, e) => s + calcNet(e.salaire_brut), 0);
  const chargesTotal  = actifs.reduce((s, e) => s + calcCharges(e.salaire_brut), 0);
  const coutTotal     = masseTotal + chargesTotal;

  const byContrat = Object.entries(
    actifs.reduce<Record<string, { count: number; masse: number }>>((acc, e) => {
      const t = e.type_contrat;
      if (!acc[t]) acc[t] = { count: 0, masse: 0 };
      acc[t].count++;
      acc[t].masse += e.salaire_brut;
      return acc;
    }, {})
  ).sort((a, b) => b[1].count - a[1].count);

  const byDept = Object.entries(
    actifs.reduce<Record<string, { count: number; masse: number }>>((acc, e) => {
      const d = e.departement ?? "Non défini";
      if (!acc[d]) acc[d] = { count: 0, masse: 0 };
      acc[d].count++;
      acc[d].masse += e.salaire_brut;
      return acc;
    }, {})
  ).sort((a, b) => b[1].count - a[1].count);

  const exportCSV = () => {
    const sep = ";";
    const header = ["Nom", "Poste", "Département", "Contrat", "Statut", "Embauche", "Salaire brut", "Net estimé", "Charges patronales", "Coût total"].join(sep);
    const rows = employes.map(e => [
      `"${e.nom}"`,
      `"${e.poste ?? ""}"`,
      `"${e.departement ?? ""}"`,
      e.type_contrat,
      e.actif ? "Actif" : "Archivé",
      e.date_embauche ?? "",
      e.salaire_brut.toFixed(2),
      calcNet(e.salaire_brut).toFixed(2),
      calcCharges(e.salaire_brut).toFixed(2),
      (e.salaire_brut + calcCharges(e.salaire_brut)).toFixed(2),
    ].join(sep));
    const csv  = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `Employes_${monthKey}.csv`; a.click();
    URL.revokeObjectURL(url);
    add("CSV exporté", "success");
  };

  const exportMasseSalariale = () => {
    const lines = [
      `RAPPORT MASSE SALARIALE — ${new Date(monthKey + "-02").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
      `Généré le : ${new Date().toLocaleDateString("fr-FR")}`,
      ``,
      `SYNTHÈSE GLOBALE`,
      `──────────────────────────────────────────`,
      `Effectif actif       : ${actifs.length} salarié(s)`,
      `Masse salariale brute: ${fmt(masseTotal)}`,
      `Net versé estimé     : ${fmt(netTotal)}  (${Math.round((netTotal / masseTotal) * 100)}% de la masse)`,
      `Cotisations salariales: ${fmt(masseTotal - netTotal)}  (${Math.round(TOTAL_COT_SAL)}%)`,
      `Charges patronales   : ${fmt(chargesTotal)}  (${Math.round(TOTAL_COT_PAT)}%)`,
      `Coût total employeur : ${fmt(coutTotal)}`,
      ``,
      `DÉTAIL COTISATIONS SALARIALES (taux 2024)`,
      `──────────────────────────────────────────`,
      ...COT_SAL.map(c => `  ${c.label.padEnd(30)} : ${c.pct.toFixed(2)}%  →  ${fmt(masseTotal * c.pct / 100)}`),
      ``,
      `DÉTAIL COTISATIONS PATRONALES (taux 2024)`,
      `──────────────────────────────────────────`,
      ...COT_PAT.map(c => `  ${c.label.padEnd(30)} : ${c.pct.toFixed(2)}%  →  ${fmt(masseTotal * c.pct / 100)}`),
      ``,
      `RÉPARTITION PAR TYPE DE CONTRAT`,
      `──────────────────────────────────────────`,
      ...byContrat.map(([t, v]) => `  ${t.padEnd(12)}: ${v.count} salarié(s) — ${fmt(v.masse)}`),
      ``,
      `RÉPARTITION PAR DÉPARTEMENT`,
      `──────────────────────────────────────────`,
      ...byDept.map(([d, v]) => `  ${d.padEnd(20)}: ${v.count} salarié(s) — ${fmt(v.masse)}`),
      ``,
      `─────────────────────────────────────────`,
      `Document indicatif généré par DJAMA Premium — taux 2024 régime général`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `Masse_salariale_${monthKey}.txt`; a.click();
    URL.revokeObjectURL(url);
    add("Rapport exporté", "success");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
        <h2 className={`mt-1 text-2xl font-black ${pri}`}>Rapports & Exports</h2>
        <p className={`mt-1 text-sm ${mut}`}>Analyses et exports des données RH</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Effectif actif",      value: actifs.length.toString(),    color: "#10b981" },
          { label: "Masse salariale",     value: fmt(masseTotal),             color: "#c9a55a" },
          { label: "Charges patronales",  value: fmt(chargesTotal),           color: "#f43f5e" },
          { label: "Coût total / mois",   value: fmt(coutTotal),              color: "#60a5fa" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border p-4 ${card}`}>
            <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-15 blur-xl" style={{ background: color }} />
            <p className="text-xl font-black" style={{ color }}>{value}</p>
            <p className={`text-xs font-semibold ${mut}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Actions export */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Users, label: "Registre salariés", sub: "CSV — tous les salariés",
            action: exportCSV, color: "#10b981",
          },
          {
            icon: Banknote, label: "Masse salariale", sub: "TXT — cotisations détaillées",
            action: exportMasseSalariale, color: "#c9a55a",
          },
          {
            icon: FileText, label: "Bientôt", sub: "Export DSN → module Paie",
            action: () => add("Utilisez l'export DSN dans le module Paie", "error"), color: "#6b7280",
          },
        ].map(({ icon: Icon, label, sub, action, color }) => (
          <button key={label} onClick={action}
            className={`group flex items-center gap-4 overflow-hidden rounded-2xl border p-5 text-left transition hover:scale-[1.01] active:scale-100 ${card}`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-110"
              style={{ background: color + "15" }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className={`font-bold ${pri}`}>{label}</p>
              <p className={`text-xs ${mut}`}>{sub}</p>
            </div>
            <Download size={14} className={`ml-auto shrink-0 ${mut} group-hover:text-[#c9a55a] transition`} />
          </button>
        ))}
      </div>

      {/* Répartition par type de contrat */}
      {byContrat.length > 0 && (
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#c9a55a]" />
              <p className={`text-sm font-bold ${pri}`}>Répartition par type de contrat</p>
            </div>
          </div>
          <div className={`divide-y ${divs}`}>
            {byContrat.map(([type, v]) => {
              const cc = CONTRAT_COLORS[type];
              const pctMasse = masseTotal > 0 ? (v.masse / masseTotal) * 100 : 0;
              return (
                <div key={type} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: cc?.bg ?? "#6b728020", color: cc?.color ?? "#6b7280" }}>{type}</span>
                      <span className={`text-sm ${sec}`}>{v.count} salarié{v.count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold" style={{ color: cc?.color ?? "#6b7280" }}>{fmt(v.masse)}</span>
                      <span className={`ml-2 text-xs ${faint}`}>{pctMasse.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.06]" : "bg-black/[0.06]"}`}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pctMasse}%`, background: cc?.color ?? "#6b7280" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Répartition par département */}
      {byDept.length > 1 && (
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[#c9a55a]" />
              <p className={`text-sm font-bold ${pri}`}>Répartition par département</p>
            </div>
          </div>
          <div className={`divide-y ${divs}`}>
            {byDept.map(([dept, v]) => {
              const pct = masseTotal > 0 ? (v.masse / masseTotal) * 100 : 0;
              return (
                <div key={dept} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${sec}`}>{dept}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#c9a55a]">{fmt(v.masse)}</span>
                      <span className={`ml-2 text-xs ${faint}`}>{v.count} pers.</span>
                    </div>
                  </div>
                  <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.06]" : "bg-black/[0.06]"}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-[#c9a55a] to-[#f0c97a] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top salaires */}
      {actifs.length > 0 && (
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-[#c9a55a]" />
              <p className={`text-sm font-bold ${pri}`}>Top salaires — bruts</p>
            </div>
          </div>
          <div className={`divide-y ${divs}`}>
            {[...actifs].sort((a, b) => b.salaire_brut - a.salaire_brut).slice(0, 10).map((e, i) => {
              const pct = masseTotal > 0 ? (e.salaire_brut / masseTotal) * 100 : 0;
              return (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                  <span className={`w-5 shrink-0 text-center text-xs font-black ${i < 3 ? "text-[#c9a55a]" : faint}`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-semibold ${sec}`}>{e.nom}</p>
                      <p className="text-sm font-bold text-[#c9a55a]">{fmt2(e.salaire_brut)}</p>
                    </div>
                    <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.06]" : "bg-black/[0.06]"}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-[#c9a55a] to-[#f0c97a]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Salariés archivés */}
      {archives.length > 0 && (
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <p className={`text-sm font-bold ${pri}`}>Salariés archivés — {archives.length}</p>
          </div>
          <div className={`divide-y ${divs}`}>
            {archives.map(e => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className={`text-sm font-semibold ${sec}`}>{e.nom}</p>
                  <p className={`text-xs ${faint}`}>{e.poste ?? "—"} · {e.type_contrat}</p>
                </div>
                <span className={`text-xs ${faint}`}>{e.date_sortie ? new Date(e.date_sortie).toLocaleDateString("fr-FR") : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
