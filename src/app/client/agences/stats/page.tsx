"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, Briefcase, FileQuestion,
  Star, Users, Activity, CheckCircle, Clock, AlertCircle,
  Loader2,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { VENDOR_TYPE_LABELS, VENDOR_STATUS_LABELS, MISSION_STATUS_LABELS } from "@/lib/vendors/types";

const ease = [0.22, 1, 0.36, 1] as const;

const STATUS_COLORS: Record<string, string> = {
  actif: "#10b981", prospect: "#f59e0b", inactif: "#6b7280",
};
const MISSION_COLORS: Record<string, string> = {
  en_cours: "#6366f1", terminee: "#10b981", prospect: "#f59e0b", annulee: "#6b7280",
};
const DEVIS_COLORS: Record<string, string> = {
  ouvert: "#6366f1", attribue: "#10b981", ferme: "#6b7280", annule: "#ef4444",
};
const TYPE_COLORS = ["#c9a55a", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

interface Stats {
  vendors:  { total: number; byStatus: Record<string, number>; byType: Record<string, number> };
  missions: { total: number; byStatus: Record<string, number>; totalAmountEur: number };
  devis:    { total: number; byStatus: Record<string, number>; tauxAttribution: number };
  topVendors: { id: string; name: string; type: string; status: string; rating: number; total_missions: number; active_missions: number }[];
}

function BarChart({ data, colors, labelMap }: {
  data: Record<string, number>;
  colors: Record<string, string>;
  labelMap?: Record<string, string>;
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="text-[11px] w-24 shrink-0 truncate" style={{ color: colors[k] ?? "#c9a55a" }}>
            {labelMap?.[k] ?? k}
          </span>
          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(v / max) * 100}%` }}
              transition={{ duration: 0.7, ease }}
              className="h-full rounded-full"
              style={{ background: colors[k] ?? "#c9a55a" }}
            />
          </div>
          <span className="text-[11px] font-bold w-6 text-right" style={{ color: colors[k] ?? "#c9a55a" }}>{v}</span>
        </div>
      ))}
      {entries.length === 0 && <p className="text-[11px] opacity-40 text-center py-2">Aucune donnée</p>}
    </div>
  );
}

function DonutMini({ data, colors }: { data: Record<string, number>; colors: Record<string, string> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return <p className="text-[11px] opacity-40 text-center py-2">Aucune donnée</p>;

  let cumul = 0;
  const segments = entries.map(([k, v]) => {
    const pct = v / total;
    const start = cumul;
    cumul += pct;
    return { k, v, pct, start };
  });

  const cx = 40, cy = 40, r = 30, stroke = 10;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" width={80} height={80} className="shrink-0">
        {segments.map(({ k, pct, start }) => (
          <circle key={k}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors[k] ?? "#c9a55a"}
            strokeWidth={stroke}
            strokeDasharray={`${pct * circumference} ${circumference}`}
            strokeDashoffset={-start * circumference}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="space-y-1">
        {segments.map(({ k, v, pct }) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[k] ?? "#c9a55a" }} />
            <span className="text-[10.5px] opacity-70">{k} — {v} ({Math.round(pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VendorStatsPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const s = {
    page:  isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]",
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]" : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85" : "text-gray-800",
    muted: isDark ? "text-white/35" : "text-gray-400",
    sub:   isDark ? "text-white/55" : "text-gray-500",
  };

  useEffect(() => {
    fetch("/api/vendors/stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`min-h-full flex items-center justify-center ${s.page}`}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#c9a55a" }} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`min-h-full flex flex-col items-center justify-center gap-4 ${s.page}`}>
        <p className={`text-[13px] ${s.muted}`}>Impossible de charger les statistiques</p>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px]" style={{ color: "#c9a55a" }}>
          <ArrowLeft size={14} /> Retour
        </button>
      </div>
    );
  }

  const typeEntries = Object.entries(stats.vendors.byType).filter(([, v]) => v > 0);
  const typeColors = Object.fromEntries(typeEntries.map(([k], i) => [k, TYPE_COLORS[i % TYPE_COLORS.length]]));
  const typeLabelMap = Object.fromEntries(
    Object.keys(VENDOR_TYPE_LABELS).map(k => [k, VENDOR_TYPE_LABELS[k as keyof typeof VENDOR_TYPE_LABELS]])
  );

  return (
    <div className={`min-h-full pb-20 ${s.page}`}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className={`p-2 rounded-xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
            <ArrowLeft size={16} className={s.muted} />
          </button>
          <span className={`text-[11px] ${s.muted}`}>Prestataires & Partenaires</span>
        </div>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#c9a55a18" }}>
              <TrendingUp size={18} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Analytics Prestataires</h1>
              <p className={`text-[10px] ${s.muted}`}>{stats.vendors.total} prestataires · {stats.missions.total} missions</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-3">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Prestataires",  value: stats.vendors.total,   icon: Users,         color: "#c9a55a" },
            { label: "Missions",      value: stats.missions.total,  icon: Briefcase,     color: "#6366f1" },
            { label: "Devis ouverts", value: stats.devis.byStatus["ouvert"] ?? 0, icon: FileQuestion, color: "#f59e0b" },
            { label: "Taux attribution", value: `${stats.devis.tauxAttribution}%`, icon: CheckCircle, color: "#10b981" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
              className={`rounded-2xl border p-3.5 ${s.card}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={12} style={{ color }} />
                <span className={`text-[10px] ${s.muted}`}>{label}</span>
              </div>
              <p className={`text-[22px] font-black ${s.text}`}>{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Montant total missions EUR */}
        {stats.missions.totalAmountEur > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className={`rounded-2xl border p-4 ${s.card}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${s.muted} mb-1`}>Montant total missions (EUR)</p>
            <p className={`text-[28px] font-black`} style={{ color: "#c9a55a" }}>
              {stats.missions.totalAmountEur.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
            </p>
          </motion.div>
        )}

        {/* Statuts prestataires */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className={`rounded-2xl border p-4 ${s.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={13} style={{ color: "#c9a55a" }} />
            <h3 className={`text-[12px] font-bold ${s.text}`}>Prestataires par statut</h3>
          </div>
          <DonutMini data={stats.vendors.byStatus} colors={STATUS_COLORS} />
        </motion.div>

        {/* Types prestataires */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className={`rounded-2xl border p-4 ${s.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={13} style={{ color: "#c9a55a" }} />
            <h3 className={`text-[12px] font-bold ${s.text}`}>Répartition par type</h3>
          </div>
          <BarChart data={stats.vendors.byType} colors={typeColors} labelMap={typeLabelMap} />
        </motion.div>

        {/* Missions par statut */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className={`rounded-2xl border p-4 ${s.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} style={{ color: "#c9a55a" }} />
            <h3 className={`text-[12px] font-bold ${s.text}`}>Missions par statut</h3>
          </div>
          <BarChart
            data={stats.missions.byStatus}
            colors={MISSION_COLORS}
            labelMap={Object.fromEntries(Object.keys(MISSION_STATUS_LABELS).map(k => [k, MISSION_STATUS_LABELS[k as keyof typeof MISSION_STATUS_LABELS]]))}
          />
        </motion.div>

        {/* Devis par statut */}
        {stats.devis.total > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className={`rounded-2xl border p-4 ${s.card}`}>
            <div className="flex items-center gap-2 mb-3">
              <FileQuestion size={13} style={{ color: "#c9a55a" }} />
              <h3 className={`text-[12px] font-bold ${s.text}`}>Demandes de devis</h3>
            </div>
            <DonutMini data={stats.devis.byStatus} colors={DEVIS_COLORS} />
          </motion.div>
        )}

        {/* Top prestataires */}
        {stats.topVendors.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className={`rounded-2xl border p-4 ${s.card}`}>
            <div className="flex items-center gap-2 mb-3">
              <Star size={13} style={{ color: "#c9a55a" }} />
              <h3 className={`text-[12px] font-bold ${s.text}`}>Top prestataires</h3>
            </div>
            <div className="space-y-2.5">
              {stats.topVendors.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3">
                  <span className={`text-[11px] font-black w-4 ${s.muted}`}>#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[12.5px] font-semibold ${s.text} truncate`}>{v.name}</span>
                      <span className="text-[9.5px] rounded px-1 py-0.5"
                        style={{ background: STATUS_COLORS[v.status] + "22", color: STATUS_COLORS[v.status] }}>
                        {VENDOR_STATUS_LABELS[v.status as keyof typeof VENDOR_STATUS_LABELS]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={9}
                            fill={j < v.rating ? "#c9a55a" : "transparent"}
                            style={{ color: j < v.rating ? "#c9a55a" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }} />
                        ))}
                      </div>
                      <span className={`text-[10px] ${s.muted}`}>{v.total_missions} mission{v.total_missions > 1 ? "s" : ""}</span>
                      {v.active_missions > 0 && (
                        <span className="text-[10px]" style={{ color: "#6366f1" }}>
                          · {v.active_missions} active{v.active_missions > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] ${s.muted} shrink-0`}>
                    {typeLabelMap[v.type] ?? v.type}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* État vide */}
        {stats.vendors.total === 0 && (
          <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
            <AlertCircle size={24} className="mx-auto mb-2 opacity-30" style={{ color: "#c9a55a" }} />
            <p className={`text-[13px] ${s.muted}`}>Aucun prestataire enregistré</p>
            <p className={`text-[11px] ${s.muted} mt-1`}>Les analytics s'afficheront après avoir ajouté des prestataires</p>
          </div>
        )}
      </div>
    </div>
  );
}
