"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, TrendingDown, Users, Eye, MousePointer, Clock } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;

const PERIODS = ["7 jours", "30 jours", "3 mois"] as const;
type Period = typeof PERIODS[number];

const DATA: Record<Period, { visitors: number; pageviews: number; sessions: number; bounce: number; duration: string; topPages: { page: string; views: number }[]; sources: { name: string; pct: number; color: string }[]; weeklyVisitors: number[] }> = {
  "7 jours": {
    visitors: 1240, pageviews: 3870, sessions: 1580, bounce: 42, duration: "2m 34s",
    topPages: [{ page: "/", views: 890 }, { page: "/services", views: 540 }, { page: "/tarifs", views: 320 }, { page: "/contact", views: 215 }, { page: "/blog", views: 180 }],
    sources: [{ name: "Google", pct: 48, color: "#4285f4" }, { name: "Direct", pct: 27, color: "#10b981" }, { name: "Réseaux sociaux", pct: 15, color: "#e1306c" }, { name: "Autres", pct: 10, color: "#6b7280" }],
    weeklyVisitors: [142, 198, 175, 220, 185, 168, 152],
  },
  "30 jours": {
    visitors: 5840, pageviews: 17200, sessions: 7120, bounce: 39, duration: "2m 48s",
    topPages: [{ page: "/", views: 3200 }, { page: "/services", views: 2400 }, { page: "/tarifs", views: 1580 }, { page: "/contact", views: 980 }, { page: "/blog", views: 860 }],
    sources: [{ name: "Google", pct: 52, color: "#4285f4" }, { name: "Direct", pct: 23, color: "#10b981" }, { name: "Réseaux sociaux", pct: 17, color: "#e1306c" }, { name: "Autres", pct: 8, color: "#6b7280" }],
    weeklyVisitors: [980, 1240, 1580, 1650, 1480, 1620, 1820],
  },
  "3 mois": {
    visitors: 18200, pageviews: 54600, sessions: 22400, bounce: 37, duration: "3m 05s",
    topPages: [{ page: "/", views: 9800 }, { page: "/services", views: 7200 }, { page: "/tarifs", views: 5400 }, { page: "/contact", views: 3200 }, { page: "/blog", views: 2800 }],
    sources: [{ name: "Google", pct: 55, color: "#4285f4" }, { name: "Direct", pct: 21, color: "#10b981" }, { name: "Réseaux sociaux", pct: 16, color: "#e1306c" }, { name: "Autres", pct: 8, color: "#6b7280" }],
    weeklyVisitors: [4200, 5100, 5800, 6400, 7200, 7900, 8600],
  },
};

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState<Period>("7 jours");
  const d = DATA[period];

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
  };

  const maxV = Math.max(...d.weeklyVisitors);
  const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

  const kpis = [
    { label: "Visiteurs", value: d.visitors.toLocaleString("fr-FR"), icon: Users,        color: "#8b5cf6", trend: "+12%" },
    { label: "Pages vues", value: d.pageviews.toLocaleString("fr-FR"), icon: Eye,        color: "#0891b2", trend: "+8%"  },
    { label: "Sessions",   value: d.sessions.toLocaleString("fr-FR"),  icon: MousePointer, color: "#10b981", trend: "+15%"  },
    { label: "Durée moy.", value: d.duration,                           icon: Clock,      color: "#f59e0b", trend: "+5%"  },
  ];

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={BarChart2} color="#8b5cf6" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Analytics</h1>
              <p className={`text-[10px] ${s.muted}`}>Données en temps réel · djama.pro</p>
            </div>
          </div>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="rounded-xl px-2.5 py-1.5 text-[10.5px] font-semibold transition"
                style={period === p
                  ? { background: "rgba(139,92,246,0.18)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.35)" }
                  : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                {p}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease }}
                className={`rounded-2xl border p-4 ${s.card}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: k.color + "18" }}>
                    <Icon size={14} style={{ color: k.color }} />
                  </div>
                  <span className="text-[9.5px] font-bold flex items-center gap-0.5" style={{ color: "#10b981" }}>
                    <TrendingUp size={9} /> {k.trend}
                  </span>
                </div>
                <p className={`text-[10px] ${s.muted}`}>{k.label}</p>
                <p className="text-[20px] font-black tabular-nums" style={{ color: k.color }}>{k.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Graphique */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.1 }}
          className={`rounded-2xl border p-4 ${s.card}`}>
          <p className={`text-[11px] font-bold mb-3 ${s.text}`}>Visiteurs par jour</p>
          <div className="flex items-end gap-1.5 h-24">
            {d.weeklyVisitors.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / maxV) * 100}%` }}
                  transition={{ duration: 0.5, ease, delay: i * 0.06 }}
                  className="w-full rounded-md min-h-[4px]"
                  style={{ background: `linear-gradient(180deg,#8b5cf6,#7c3aed)` }} />
                <span className={`text-[8.5px] ${s.muted}`}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sources trafic */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.15 }}
          className={`rounded-2xl border p-4 ${s.card}`}>
          <p className={`text-[11px] font-bold mb-3 ${s.text}`}>Sources de trafic</p>
          <div className="space-y-2.5">
            {d.sources.map(src => (
              <div key={src.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] ${s.text}`}>{src.name}</span>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: src.color }}>{src.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${src.pct}%` }} transition={{ duration: 0.6, ease }}
                    className="h-full rounded-full" style={{ background: src.color }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top pages */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.2 }}
          className={`rounded-2xl border p-4 ${s.card}`}>
          <p className={`text-[11px] font-bold mb-3 ${s.text}`}>Pages les plus vues</p>
          <div className="space-y-2">
            {d.topPages.map((pg, i) => (
              <div key={pg.page} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[9.5px] font-black w-4 text-center ${s.muted}`}>{i + 1}</span>
                  <span className={`text-[11.5px] font-mono ${s.text}`}>{pg.page}</span>
                </div>
                <span className={`text-[11.5px] font-bold tabular-nums ${s.muted}`}>{pg.views.toLocaleString("fr-FR")}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Taux rebond */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.25 }}
          className={`rounded-2xl border p-4 ${s.card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] ${s.muted}`}>Taux de rebond</p>
              <p className="text-[28px] font-black tabular-nums" style={{ color: d.bounce < 45 ? "#10b981" : "#f59e0b" }}>{d.bounce}%</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end" style={{ color: "#10b981" }}>
                <TrendingDown size={12} />
                <span className="text-[11px] font-bold">-3% vs période préc.</span>
              </div>
              <p className={`text-[10px] mt-1 ${s.muted}`}>Excellent (objectif &lt; 50%)</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
