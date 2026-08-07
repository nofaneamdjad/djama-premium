"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Globe, Eye, Edit3, Trash2, Plus, ExternalLink,
  Loader2, AlertCircle, CheckCircle2, Clock, Settings2, TrendingUp,
} from "lucide-react";
import { TEMPLATES } from "@/lib/site-builder";
import type { SiteConfig } from "@/lib/site-builder";

interface Site {
  id:         string;
  slug:       string;
  config:     SiteConfig;
  published:  boolean;
  created_at: string;
  updated_at: string;
}

export default function MesSitesPage() {
  const router = useRouter();
  const [sites,    setSites]    = useState<Site[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm,  setConfirm]  = useState<string | null>(null);
  const [stats,    setStats]    = useState<Record<string, { v7: number; v30: number }>>({});

  useEffect(() => { fetchSites(); }, []);

  async function fetchSites() {
    setLoading(true); setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch("/api/site-builder/list"),
        fetch("/api/site-builder/stats"),
      ]);
      const listData  = await listRes.json();
      if (!listRes.ok) throw new Error(listData.error);
      setSites(listData.sites);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) { setError((e as Error).message); }
    finally     { setLoading(false); }
  }

  async function togglePublish(site: Site) {
    setToggling(site.id); setError(null);
    try {
      const res  = await fetch("/api/site-builder/toggle", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id, publish: !site.published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSites(prev => prev.map(s => s.id === site.id ? { ...s, published: !s.published } : s));
    } catch (e) { setError((e as Error).message); }
    finally     { setToggling(null); }
  }

  async function deleteSite(siteId: string) {
    setDeleting(siteId); setConfirm(null); setError(null);
    try {
      const res  = await fetch("/api/site-builder/delete", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSites(prev => prev.filter(s => s.id !== siteId));
    } catch (e) { setError((e as Error).message); }
    finally     { setDeleting(null); }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#070711] text-white">

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Globe size={20} className="text-violet-400" /> Mes sites web
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              {loading ? "Chargement…" : `${sites.length} site${sites.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => router.push("/client/site-web")}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white
              px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap"
          >
            <Plus size={15} /> Nouveau site
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-6
            bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-violet-400" />
          </div>
        ) : sites.length === 0 ? (
          <EmptyState onNew={() => router.push("/client/site-web")} />
        ) : (
          <div className="flex flex-col gap-4">
            {sites.map(site => {
              const tpl = TEMPLATES[site.config.template] ?? TEMPLATES.commerce;
              return (
                <div key={site.id}
                  className="bg-white/[.03] border border-white/10 rounded-2xl p-5
                    hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-4">

                    {/* Emoji icon */}
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${tpl.color}22`, border: `1px solid ${tpl.color}44` }}>
                      {tpl.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h2 className="font-bold text-base truncate">{site.config.businessName}</h2>
                        {site.published ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold
                            bg-green-500/15 text-green-400 border border-green-500/25 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Publié
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold
                            bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
                            <Clock size={10} /> Brouillon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/35 font-mono mb-1">djama.pro/s/{site.slug}</p>
                      <div className="flex items-center gap-3 text-[11px] text-white/30 flex-wrap">
                        <span style={{ color: tpl.color }}>{tpl.label}</span>
                        <span>·</span>
                        <span>Modifié le {fmt(site.updated_at)}</span>
                        {site.config.city && <><span>·</span><span>{site.config.city}</span></>}
                        {(stats[site.id]?.v7 ?? 0) > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-violet-400 font-semibold">
                              <TrendingUp size={10} />
                              {stats[site.id].v7.toLocaleString("fr-FR")} vues / 7j
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                      <a href={`/s/${site.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10
                          rounded-lg text-xs font-medium transition-colors">
                        <Eye size={13} /> Voir
                      </a>

                      <button
                        onClick={() => router.push(`/client/site-web?id=${site.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10
                          rounded-lg text-xs font-medium transition-colors">
                        <Edit3 size={13} /> Modifier
                      </button>

                      <button
                        onClick={() => togglePublish(site)}
                        disabled={toggling === site.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                          transition-colors disabled:opacity-50 ${
                          site.published
                            ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                            : "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                        }`}>
                        {toggling === site.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : site.published ? "Dépublier" : "Publier"}
                      </button>

                      {confirm === site.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => deleteSite(site.id)}
                            disabled={deleting === site.id}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg
                              text-xs font-semibold transition-colors disabled:opacity-50">
                            {deleting === site.id ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
                          </button>
                          <button
                            onClick={() => setConfirm(null)}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors">
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirm(site.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20
                            text-red-400 rounded-lg text-xs font-medium transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Published URL bar */}
                  {site.published && (
                    <a href={`/s/${site.slug}`} target="_blank" rel="noopener noreferrer"
                      className="mt-4 flex items-center gap-2 bg-green-500/8 border border-green-500/20
                        rounded-xl px-4 py-2.5 text-xs text-green-400 hover:bg-green-500/12
                        transition-colors group">
                      <CheckCircle2 size={13} className="flex-shrink-0" />
                      <span className="font-mono flex-1">djama.pro/s/{site.slug}</span>
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20
        flex items-center justify-center text-4xl mb-5">
        🌐
      </div>
      <h2 className="text-xl font-bold mb-2">Aucun site créé</h2>
      <p className="text-sm text-white/40 mb-6 max-w-xs leading-relaxed">
        Créez votre premier site vitrine professionnel en quelques minutes grâce à l&apos;IA.
      </p>
      <button onClick={onNew}
        className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white
          px-5 py-3 rounded-xl font-semibold text-sm transition-colors">
        <Settings2 size={16} /> Créer mon premier site
      </button>
    </div>
  );
}
