"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Lock, Search } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { useSubscription } from "@/lib/use-require-subscription";
import { APP_REGISTRY, CATEGORY_LABELS, type AppCategory } from "@/lib/app-registry";

const DISPLAY_CATEGORIES: AppCategory[] = [
  "finance",
  "commercial",
  "operations",
  "documents",
  "intelligence",
  "gestion",
];

const CATEGORY_ICONS: Record<AppCategory, string> = {
  accueil:      "⬜",
  finance:      "F",
  commercial:   "C",
  operations:   "O",
  documents:    "D",
  intelligence: "I",
  gestion:      "G",
};

export default function AppsPage() {
  const { isDark, accent } = useTheme();
  const { isPremium } = useSubscription();
  const [query, setQuery] = useState("");

  const tx   = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)";
  const tx2  = isDark ? "rgba(255,255,255,0.44)" : "rgba(0,0,0,0.44)";
  const bdr  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const sur  = isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.90)";
  const surH = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const bg   = isDark ? "#07090e" : "#f1f2f4";
  const srBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  const q = query.trim().toLowerCase();
  const filtered = q
    ? APP_REGISTRY.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.keywords.some(k => k.includes(q))
      )
    : null;

  const totalApps = APP_REGISTRY.filter(a => a.category !== "accueil").length;

  return (
    <div className="min-h-full" style={{ background: bg }}>
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6 lg:py-8">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: tx }}>
            Applications
          </h1>
          <p className="mt-1 text-sm" style={{ color: tx2 }}>
            {totalApps} outils pour gérer votre activité
          </p>
        </div>

        {/* Search */}
        <div
          className="mb-6 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
          style={{ background: srBg, border: `1px solid ${bdr}` }}
        >
          <Search size={14} style={{ color: tx2, flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher une application…"
            className="flex-1 bg-transparent text-sm font-medium outline-none"
            style={{ color: tx, caretColor: accent }}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs"
              style={{ color: tx2 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search results */}
        {filtered ? (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="h-px flex-1" style={{ background: bdr }} />
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl py-12" style={{ border: `1px solid ${bdr}` }}>
                <Search size={20} style={{ color: tx2 }} />
                <p className="text-sm font-medium" style={{ color: tx2 }}>Aucune application trouvée</p>
              </div>
            ) : (
              <AppList apps={filtered} isPremium={isPremium} accent={accent} tx={tx} tx2={tx2} bdr={bdr} sur={sur} surH={surH} />
            )}
          </section>
        ) : (
          /* Category sections */
          DISPLAY_CATEGORIES.map(cat => {
            const apps = APP_REGISTRY.filter(a => a.category === cat);
            return (
              <motion.section
                key={cat}
                className="mb-5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <div className="h-px flex-1" style={{ background: bdr }} />
                  <span className="text-xs" style={{ color: tx2 }}>{apps.length}</span>
                </div>
                <AppList apps={apps} isPremium={isPremium} accent={accent} tx={tx} tx2={tx2} bdr={bdr} sur={sur} surH={surH} />
              </motion.section>
            );
          })
        )}
      </div>
    </div>
  );
}

function AppList({
  apps, isPremium, accent, tx, tx2, bdr, sur, surH,
}: {
  apps: typeof APP_REGISTRY[number][];
  isPremium: boolean;
  accent: string;
  tx: string; tx2: string; bdr: string; sur: string; surH: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: `1px solid ${bdr}`, background: sur }}
    >
      {apps.map((app, i) => {
        const locked = app.permission === "premium" && !isPremium;
        const Icon = app.icon;
        const href = locked ? "/client/abonnements" : app.route;

        return (
          <Link
            key={app.id}
            href={href}
            className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors"
            style={{
              borderTop: i > 0 ? `1px solid ${bdr}` : "none",
              opacity: locked ? 0.7 : 1,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = surH;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {/* App icon */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${accent}14`, border: `1px solid ${accent}1e` }}
            >
              <Icon size={16} style={{ color: accent }} />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold" style={{ color: tx }}>
                  {app.name}
                </span>
                {locked && (
                  <Lock size={11} style={{ color: accent, opacity: 0.7 }} />
                )}
              </div>
              <p className="mt-0.5 truncate text-xs" style={{ color: tx2 }}>
                {app.description}
              </p>
            </div>

            {/* Chevron */}
            <ChevronRight
              size={14}
              style={{ color: tx2, flexShrink: 0 }}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        );
      })}
    </div>
  );
}
