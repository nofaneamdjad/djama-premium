"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Lock, Star } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";
import { useSubscription } from "@/lib/use-require-subscription";
import { APP_REGISTRY, CATEGORY_LABELS, type AppCategory } from "@/lib/app-registry";
import { APPS_DATA } from "@/lib/applications-data";

// ─── constants ──────────────────────────────────────────────────────────────

const ALL_CATS = "all" as const;
type TabId = typeof ALL_CATS | AppCategory;

const DISPLAY_CATEGORIES: AppCategory[] = [
  "finance", "commercial", "operations", "documents", "intelligence", "gestion",
];

const DISPLAY_APPS = APP_REGISTRY.filter(a => a.category !== "accueil");

const FAVS_KEY = "djama_app_favs_v1";

const APP_COLOR: Record<string, string> = Object.fromEntries(
  APPS_DATA.map(a => [a.slug, a.color])
);

function loadFavs(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveFavs(favs: Set<string>) {
  try { localStorage.setItem(FAVS_KEY, JSON.stringify([...favs])); } catch {}
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function AppsPage() {
  const { isDark, accent } = useTheme();
  const { isPremium } = useSubscription();
  const [query, setQuery]       = useState("");
  const [activeTab, setActiveTab] = useState<TabId>(ALL_CATS);
  const [favs, setFavs]         = useState<Set<string>>(new Set());
  const [favsMounted, setFavsMounted] = useState(false);

  useEffect(() => {
    setFavs(loadFavs());
    setFavsMounted(true);
  }, []);

  const toggleFav = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavs(next);
      return next;
    });
  }, []);

  // ── tokens ────────────────────────────────────────────────────────────────
  const bg   = isDark ? "#07090e" : "#f1f2f4";
  const card = isDark ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.95)";
  const cardH = isDark ? "rgba(255,255,255,0.075)" : "#fff";
  const bdr  = isDark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.07)";
  const tx   = isDark ? "rgba(255,255,255,0.90)"  : "rgba(0,0,0,0.85)";
  const tx2  = isDark ? "rgba(255,255,255,0.44)"  : "rgba(0,0,0,0.44)";
  const srBg = isDark ? "rgba(255,255,255,0.05)"  : "rgba(0,0,0,0.04)";
  const tabBg  = isDark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.07)";
  const tabAct = accent;

  // ── filtering ─────────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase();

  const baseApps = q
    ? DISPLAY_APPS.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.keywords.some(k => k.includes(q))
      )
    : activeTab === ALL_CATS
      ? DISPLAY_APPS
      : DISPLAY_APPS.filter(a => a.category === activeTab);

  // favorites sub-list (only shown in ALL tab with no query)
  const favApps = (!q && activeTab === ALL_CATS && favsMounted)
    ? DISPLAY_APPS.filter(a => favs.has(a.id))
    : [];

  // ── tabs ──────────────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string }[] = [
    { id: ALL_CATS, label: "Tout" },
    ...DISPLAY_CATEGORIES.map(c => ({ id: c as TabId, label: CATEGORY_LABELS[c] })),
  ];

  return (
    <div className="min-h-full" style={{ background: bg }}>
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">

        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: tx }}>
            Applications
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: tx2 }}>
            {DISPLAY_APPS.length} outils pour gérer votre activité
          </p>
        </div>

        {/* ── Search ── */}
        <div
          className="mb-5 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
          style={{ background: srBg, border: `1px solid ${bdr}` }}
        >
          <Search size={14} style={{ color: tx2, flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); if (e.target.value) setActiveTab(ALL_CATS); }}
            placeholder="Rechercher une application…"
            className="flex-1 bg-transparent text-sm font-medium outline-none"
            style={{ color: tx, caretColor: accent }}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-xs" style={{ color: tx2 }}>
              ✕
            </button>
          )}
        </div>

        {/* ── Category tabs (hidden during search) ── */}
        {!q && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    background: active ? tabAct : tabBg,
                    color: active ? "#fff" : tx2,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Search results header ── */}
        {q && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
              {baseApps.length} résultat{baseApps.length !== 1 ? "s" : ""}
            </span>
            <div className="h-px flex-1" style={{ background: bdr }} />
          </div>
        )}

        {/* ── Empty state ── */}
        {q && baseApps.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl py-16" style={{ border: `1px solid ${bdr}` }}>
            <Search size={28} style={{ color: tx2 }} />
            <p className="text-sm font-medium" style={{ color: tx2 }}>Aucune application trouvée pour « {query} »</p>
            <button onClick={() => setQuery("")} className="text-xs font-semibold" style={{ color: accent }}>
              Effacer la recherche
            </button>
          </div>
        )}

        {/* ── Favorites row ── */}
        {favApps.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Star size={12} fill={accent} style={{ color: accent }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tx2 }}>Favoris</span>
              <div className="h-px flex-1" style={{ background: bdr }} />
            </div>
            <AppGrid
              apps={favApps}
              isPremium={isPremium}
              favs={favs}
              onToggleFav={toggleFav}
              card={card} cardH={cardH} bdr={bdr} tx={tx} tx2={tx2} accent={accent}
            />
          </section>
        )}

        {/* ── App grid ── */}
        {(baseApps.length > 0 || !q) && (
          q || activeTab !== ALL_CATS ? (
            /* Flat grid for search / single category */
            <AppGrid
              apps={baseApps}
              isPremium={isPremium}
              favs={favs}
              onToggleFav={toggleFav}
              card={card} cardH={cardH} bdr={bdr} tx={tx} tx2={tx2} accent={accent}
            />
          ) : (
            /* Grouped sections for "Tout" */
            <div className="space-y-8">
              {DISPLAY_CATEGORIES.map(cat => {
                const catApps = DISPLAY_APPS.filter(a => a.category === cat);
                if (!catApps.length) return null;
                return (
                  <motion.section
                    key={cat}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                        {CATEGORY_LABELS[cat]}
                      </span>
                      <div className="h-px flex-1" style={{ background: bdr }} />
                      <span className="text-xs" style={{ color: tx2 }}>{catApps.length}</span>
                    </div>
                    <AppGrid
                      apps={catApps}
                      isPremium={isPremium}
                      favs={favs}
                      onToggleFav={toggleFav}
                      card={card} cardH={cardH} bdr={bdr} tx={tx} tx2={tx2} accent={accent}
                    />
                  </motion.section>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── App grid ────────────────────────────────────────────────────────────────

type AppEntry = typeof APP_REGISTRY[number];

interface GridProps {
  apps: AppEntry[];
  isPremium: boolean;
  favs: Set<string>;
  onToggleFav: (id: string, e: React.MouseEvent) => void;
  card: string; cardH: string; bdr: string; tx: string; tx2: string; accent: string;
}

function AppGrid({ apps, isPremium, favs, onToggleFav, card, cardH, bdr, tx, tx2, accent }: GridProps) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
    >
      <AnimatePresence mode="popLayout">
        {apps.map((app, i) => (
          <AppCard
            key={app.id}
            app={app}
            index={i}
            isPremium={isPremium}
            isFav={favs.has(app.id)}
            onToggleFav={onToggleFav}
            card={card} cardH={cardH} bdr={bdr} tx={tx} tx2={tx2} accent={accent}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── App card ────────────────────────────────────────────────────────────────

interface CardProps {
  app: AppEntry;
  index: number;
  isPremium: boolean;
  isFav: boolean;
  onToggleFav: (id: string, e: React.MouseEvent) => void;
  card: string; cardH: string; bdr: string; tx: string; tx2: string; accent: string;
}

function AppCard({ app, index, isPremium, isFav, onToggleFav, card, cardH, bdr, tx, tx2, accent }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const locked = app.permission === "premium" && !isPremium;
  const href = locked ? "/client/abonnements" : app.route;
  const color = APP_COLOR[app.id] ?? accent;
  const Icon = app.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.3) }}
    >
      <Link
        href={href}
        className="group relative flex flex-col items-center gap-2.5 rounded-2xl p-4 transition-all"
        style={{
          background: hovered ? cardH : card,
          border: `1px solid ${bdr}`,
          opacity: locked ? 0.72 : 1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Icône squircle — même style que l'accueil */}
        <div style={{
          width: 52, height: 52, borderRadius: "27%",
          background: color,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: hovered ? `0 4px 16px ${color}50` : `0 2px 8px ${color}30`,
          position: "relative", overflow: "hidden",
          transition: "box-shadow 0.2s",
          flexShrink: 0,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%)",
            pointerEvents: "none",
          }} />
          <Icon size={24} color="white" strokeWidth={1.6} />
        </div>

        {/* Name */}
        <span
          className="w-full text-center text-xs font-semibold leading-tight"
          style={{
            color: tx,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          } as React.CSSProperties}
        >
          {app.name}
        </span>

        {/* PRO badge */}
        {app.permission === "premium" && !isPremium && (
          <span
            className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `${accent}18`, color: accent }}
          >
            <Lock size={8} />
            PRO
          </span>
        )}

        {/* Favorite star */}
        <button
          onClick={e => onToggleFav(app.id, e)}
          className="absolute left-2 top-2 rounded-md p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: isFav ? "#FFB900" : tx2 }}
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star size={11} fill={isFav ? "#FFB900" : "none"} />
        </button>
      </Link>
    </motion.div>
  );
}
