"use client";

import { useState, useEffect } from "react";
import { Clock, ExternalLink, Info, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe } from "../rh-types";
import { avatarGradient } from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  add: (msg: string, type?: "success" | "error") => void;
  isDark: boolean;
}

interface ChronoEntry {
  id: string;
  user_id: string;
  employee_name?: string;
  task_name?: string;
  project?: string;
  duration_seconds: number;
  created_at: string;
}

export default function TempsSection({ userId, employes, add, isDark }: Props) {
  const [chronos,  setChronos]  = useState<ChronoEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [monthKey, setMonthKey] = useState(new Date().toISOString().slice(0, 7));

  const card  = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri   = isDark ? "text-white"    : "text-gray-900";
  const sec   = isDark ? "text-white/70" : "text-gray-600";
  const mut   = isDark ? "text-white/40" : "text-gray-400";
  const faint = isDark ? "text-white/20" : "text-gray-300";

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", monthKey + "-01")
      .lte("created_at", monthKey + "-31")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setChronos((data as ChronoEntry[]) ?? []);
        setLoading(false);
      });
  }, [userId, monthKey]);

  const actifs = employes.filter(e => e.actif);
  const monthLabel = new Date(monthKey + "-02").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const fmtDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
  };

  const totalSeconds = chronos.reduce((s, e) => s + e.duration_seconds, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
          <h2 className={`mt-1 text-2xl font-black ${pri}`}>Temps & Présences</h2>
        </div>
        <a href="/client/chrono" target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-[#c9a55a]/30 bg-[#c9a55a]/10 px-4 py-2 text-sm font-bold text-[#c9a55a] hover:bg-[#c9a55a]/20 transition self-start">
          <ExternalLink size={13} /> Ouvrir Chrono
        </a>
      </div>

      {/* Info banner */}
      <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isDark ? "border-blue-500/20 bg-blue-500/5" : "border-blue-200 bg-blue-50"}`}>
        <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
        <p className={`text-sm ${isDark ? "text-blue-300" : "text-blue-700"}`}>
          Les pointages sont saisis depuis le module <strong>Chrono</strong>. Cette vue affiche un récapitulatif
          des entrées de temps du mois pour le suivi RH. Pour créer ou modifier des entrées, utilisez Chrono directement.
        </p>
      </div>

      {/* Sélecteur mois */}
      <div className="flex items-center gap-3">
        <CalendarDays size={14} className="text-[#c9a55a]" />
        <input type="month" value={monthKey} onChange={e => setMonthKey(e.target.value)}
          className={`rounded-xl border px-3.5 py-2 text-sm font-bold outline-none ${
            isDark ? "border-white/[0.08] bg-white/[0.06] text-white [color-scheme:dark]" : "border-black/[0.08] bg-white text-gray-900"
          }`} />
        <span className={`text-sm font-bold capitalize ${pri}`}>{monthLabel}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Effectif actif",  value: actifs.length.toString(),          color: "#10b981" },
          { label: "Entrées Chrono",  value: chronos.length.toString(),         color: "#c9a55a" },
          { label: "Temps total",     value: totalSeconds > 0 ? fmtDuration(totalSeconds) : "—", color: "#60a5fa" },
          { label: "Moy. par entrée", value: chronos.length > 0 ? fmtDuration(Math.round(totalSeconds / chronos.length)) : "—", color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border p-4 ${card}`}>
            <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-15 blur-xl" style={{ background: color }} />
            <p className="text-xl font-black" style={{ color }}>{value}</p>
            <p className={`text-xs font-semibold ${mut}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tableau récap par salarié */}
      {actifs.length > 0 && (
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#c9a55a]" />
              <p className={`text-sm font-bold ${pri}`}>Récapitulatif mensuel — {monthLabel}</p>
            </div>
            <p className={`mt-1 text-xs ${mut}`}>Les données proviennent du module Chrono (champ employee_name)</p>
          </div>
          <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
            {actifs.map(emp => {
              const entries = chronos.filter(c =>
                c.employee_name?.toLowerCase().includes(emp.nom.toLowerCase()) ||
                emp.nom.toLowerCase().includes((c.employee_name ?? "").toLowerCase())
              );
              const totalSec = entries.reduce((s, e) => s + e.duration_seconds, 0);
              return (
                <div key={emp.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                    style={{ background: avatarGradient(emp.id) }}>
                    {emp.nom[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold ${sec}`}>{emp.nom}</p>
                    {emp.poste && <p className={`text-xs ${mut}`}>{emp.poste}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${totalSec > 0 ? "text-[#c9a55a]" : faint}`}>{totalSec > 0 ? fmtDuration(totalSec) : "—"}</p>
                    <p className={`text-xs ${faint}`}>{entries.length} entrée{entries.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dernières entrées Chrono */}
      {chronos.length > 0 && (
        <div className={`overflow-hidden rounded-2xl ${card}`}>
          <div className={`border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <p className={`text-sm font-bold ${pri}`}>Dernières entrées — {monthLabel}</p>
          </div>
          <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
            {chronos.slice(0, 20).map(entry => (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-white/[0.05]" : "bg-black/[0.04]"}`}>
                  <Clock size={13} className="text-[#c9a55a]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${sec}`}>{entry.task_name ?? entry.project ?? "Tâche sans titre"}</p>
                  <p className={`text-xs ${mut}`}>
                    {entry.employee_name ?? "Non attribuée"} · {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className={`text-sm font-bold text-[#c9a55a]`}>{fmtDuration(entry.duration_seconds)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && chronos.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Clock size={32} className={faint} />
          <p className={`font-bold ${mut}`}>Aucune entrée Chrono pour {monthLabel}</p>
          <p className={`text-sm ${faint}`}>Les pointages sont enregistrés depuis le module Chrono</p>
        </div>
      )}
    </div>
  );
}
