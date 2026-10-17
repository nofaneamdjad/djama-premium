"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Globe, TrendingUp, Users, FileText, Mail,
  BarChart2, Loader2, Eye, ExternalLink, Calendar,
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";

type Period = "7d" | "30d" | "90d";

interface StatsData {
  period:            { days: number; since: string };
  totalVisits:       number;
  uniqueVisitors:    number;
  totalSubmissions:  number;
  topPages:          { slug: string; views: number }[];
  visitsChart:       { date: string; views: number }[];
  recentSubmissions: { id: string; data: Record<string, string>; crm_contact_id: string | null; created_at: string }[];
}

export default function SiteStatsPage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [period, setPeriod]   = useState<Period>("30d");
  const [stats, setStats]     = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState("Site");

  useEffect(() => {
    fetch(`/api/websites/${siteId}`)
      .then(r => r.json())
      .then(d => { if (d.website?.name) setSiteName(d.website.name as string); })
      .catch(() => {});
  }, [siteId]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/websites/${siteId}/stats?period=${period}`)
      .then(r => r.json())
      .then(d => setStats(d as StatsData))
      .finally(() => setLoading(false));
  }, [siteId, period]);

  const maxViews = Math.max(...(stats?.visitsChart.map(d => d.views) ?? [1]), 1);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, padding: "0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: `1px solid ${t.border}`, background: t.glass }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => router.push("/client/site-web")} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.6 }}>
            <ArrowLeft size={17} />
          </button>
          <Globe size={15} color="#2563EB" />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{siteName}</span>
          <span style={{ opacity: 0.4, fontSize: "0.8rem" }}>· Statistiques</span>
        </div>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ background: period === p ? "#2563EB" : "transparent", color: period === p ? "#fff" : t.text, border: `1px solid ${period === p ? "#2563EB" : t.border}`, borderRadius: "0.5rem", padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
              {p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : "90 jours"}
            </button>
          ))}
        </div>
        <button onClick={() => router.push(`/client/site-web/${siteId}/edit`)}
          style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.85rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
          <ExternalLink size={12} /> Éditeur
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.75rem 1.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem", opacity: 0.4 }}><Loader2 size={28} /></div>
        ) : !stats ? (
          <div style={{ textAlign: "center", padding: "5rem", opacity: 0.4 }}>Erreur de chargement</div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { icon: <Eye size={18} />, label: "Visites totales", value: stats.totalVisits.toLocaleString("fr-FR"), color: "#2563EB" },
                { icon: <Users size={18} />, label: "Visiteurs uniques", value: stats.uniqueVisitors.toLocaleString("fr-FR"), color: "#7C3AED" },
                { icon: <Mail size={18} />, label: "Formulaires reçus", value: stats.totalSubmissions.toLocaleString("fr-FR"), color: "#10B981" },
                { icon: <TrendingUp size={18} />, label: "Pages/visite moy.", value: stats.totalVisits > 0 ? (stats.totalVisits / Math.max(stats.uniqueVisitors, 1)).toFixed(1) : "—", color: "#F59E0B" },
              ].map((kpi, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem", padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: kpi.color }}>
                    {kpi.icon}
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.8, color: t.text }}>{kpi.label}</span>
                  </div>
                  <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: kpi.color }}>{kpi.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Graphique */}
            <div style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem", padding: "1.5rem", marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <BarChart2 size={16} color="#2563EB" />
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Visites par jour</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 120 }}>
                {stats.visitsChart.map((d, i) => {
                  const pct = maxViews > 0 ? (d.views / maxViews) * 100 : 0;
                  const isToday = d.date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={i} title={`${d.date}: ${d.views} visite${d.views !== 1 ? "s" : ""}`}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", cursor: "default" }}>
                      <div style={{ width: "100%", background: isToday ? "#2563EB" : (isDark ? "#2563EB60" : "#2563EB40"), borderRadius: "2px 2px 0 0", height: `${Math.max(pct, d.views > 0 ? 4 : 0)}%`, minHeight: d.views > 0 ? 2 : 0, transition: "height 0.3s" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.68rem", opacity: 0.4 }}>
                <span>{stats.visitsChart[0]?.date}</span>
                <span>{stats.visitsChart[stats.visitsChart.length - 1]?.date}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Top pages */}
              <div style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem", padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <FileText size={15} color="#2563EB" />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Pages les plus visitées</span>
                </div>
                {stats.topPages.length === 0 ? (
                  <p style={{ opacity: 0.4, fontSize: "0.82rem", textAlign: "center", padding: "2rem 0" }}>Aucune visite pour la période</p>
                ) : stats.topPages.map((p, i) => {
                  const pct = (p.views / (stats.topPages[0]?.views ?? 1)) * 100;
                  return (
                    <div key={i} style={{ marginBottom: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>{p.slug}</span>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2563EB" }}>{p.views}</span>
                      </div>
                      <div style={{ height: 4, background: isDark ? "#ffffff15" : "#e5e7eb", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#2563EB", borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Soumissions récentes */}
              <div style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem", padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <Mail size={15} color="#10B981" />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Derniers contacts</span>
                </div>
                {stats.recentSubmissions.length === 0 ? (
                  <p style={{ opacity: 0.4, fontSize: "0.82rem", textAlign: "center", padding: "2rem 0" }}>Aucune soumission pour la période</p>
                ) : stats.recentSubmissions.slice(0, 8).map((sub, i) => {
                  const data = sub.data as { name?: string; email?: string; phone?: string; message?: string };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.65rem 0", borderBottom: i < 7 ? `1px solid ${t.border}` : "none" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#10B98120", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Users size={14} color="#10B981" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.8rem" }}>{data.name ?? "—"}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", opacity: 0.55 }}>{data.email}</p>
                        {data.message && <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", opacity: 0.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.message}</p>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                        <span style={{ fontSize: "0.65rem", opacity: 0.4 }}>{new Date(sub.created_at).toLocaleDateString("fr-FR")}</span>
                        {sub.crm_contact_id && (
                          <span style={{ fontSize: "0.62rem", background: "#10B98120", color: "#10B981", padding: "0.1rem 0.4rem", borderRadius: 9999, fontWeight: 700 }}>CRM ✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {stats.recentSubmissions.length > 8 && (
                  <p style={{ fontSize: "0.75rem", opacity: 0.5, textAlign: "center", marginTop: "0.75rem" }}>
                    + {stats.recentSubmissions.length - 8} autres
                  </p>
                )}
              </div>
            </div>

            {stats.totalVisits === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "3rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem", marginTop: "1.5rem" }}>
                <Globe size={36} style={{ opacity: 0.25, margin: "0 auto 1rem" }} />
                <p style={{ fontWeight: 700, fontSize: "1rem", margin: "0 0 0.5rem" }}>Aucune visite sur la période</p>
                <p style={{ opacity: 0.5, fontSize: "0.85rem" }}>Publiez votre site et partagez-le pour voir les statistiques apparaître ici.</p>
              </motion.div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem", opacity: 0.4 }}>
              <Calendar size={12} />
              <span style={{ fontSize: "0.72rem" }}>
                Données depuis le {new Date(stats.period.since).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} — actualisé en temps réel
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
