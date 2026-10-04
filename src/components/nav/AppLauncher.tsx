"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Pin, Lock, Check } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { APP_REGISTRY, CATEGORY_LABELS, type AppCategory } from "@/lib/app-registry";

const GOLD = "#c9a55a";

const CATEGORIES: AppCategory[] = [
  "accueil",
  "finance",
  "commercial",
  "operations",
  "documents",
  "intelligence",
  "gestion",
];

interface Props {
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
}

export default function AppLauncher({ open, onClose, isPremium, pinnedIds, onTogglePin }: Props) {
  const { isDark, accent } = useTheme();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<AppCategory | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
      setActiveTab("all");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function onOut(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    setTimeout(() => document.addEventListener("mousedown", onOut), 100);
    return () => document.removeEventListener("mousedown", onOut);
  }, [open, onClose]);

  const filtered = APP_REGISTRY.filter(app => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return app.name.toLowerCase().includes(q) || app.keywords.some(k => k.includes(q));
    }
    if (activeTab === "all") return true;
    return app.category === activeTab;
  });

  const bg    = isDark ? "rgba(10,12,20,0.98)" : "rgba(255,255,255,0.99)";
  const bdr   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tx    = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)";
  const tx2   = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.45)";
  const sur   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const surH  = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[70]"
            style={{ background: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)" }}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[8vh] z-[71] w-full -translate-x-1/2 px-4 sm:px-0"
            style={{ maxWidth: 720 }}
          >
            <div className="overflow-hidden rounded-2xl" style={{
              background: bg,
              border: `1px solid ${bdr}`,
              boxShadow: isDark
                ? `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`
                : `0 24px 64px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)`,
            }}>
              {/* Gold orb décoration */}
              <div className="pointer-events-none absolute left-1/2 -top-16 h-32 w-64 -translate-x-1/2 rounded-full blur-3xl"
                style={{ background: `${accent}18` }} />

              {/* Header */}
              <div className="relative flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: `1px solid ${bdr}` }}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="0" y="0" width="5.5" height="5.5" rx="1.5" fill={accent} opacity="0.9" />
                    <rect x="8.5" y="0" width="5.5" height="5.5" rx="1.5" fill={accent} opacity="0.6" />
                    <rect x="0" y="8.5" width="5.5" height="5.5" rx="1.5" fill={accent} opacity="0.6" />
                    <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill={accent} opacity="0.9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="relative flex items-center gap-2">
                    <Search size={13} style={{ color: tx2, flexShrink: 0 }} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Rechercher une application…"
                      className="flex-1 bg-transparent text-sm font-medium outline-none"
                      style={{ color: tx, caretColor: accent }}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                </div>
                <button onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                  style={{ color: tx2, background: sur }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = surH; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = sur; }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Category tabs */}
              {!query.trim() && (
                <div className="flex items-center gap-1 overflow-x-auto px-4 py-2.5" style={{ scrollbarWidth: "none", borderBottom: `1px solid ${bdr}` }}>
                  <button
                    onClick={() => setActiveTab("all")}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all"
                    style={{
                      background: activeTab === "all" ? `${accent}18` : "transparent",
                      color: activeTab === "all" ? accent : tx2,
                      border: activeTab === "all" ? `1px solid ${accent}28` : "1px solid transparent",
                    }}
                  >
                    Toutes
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all"
                      style={{
                        background: activeTab === cat ? `${accent}18` : "transparent",
                        color: activeTab === cat ? accent : tx2,
                        border: activeTab === cat ? `1px solid ${accent}28` : "1px solid transparent",
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              )}

              {/* App grid */}
              <div className="max-h-[60vh] overflow-y-auto p-4" style={{ scrollbarWidth: "none" }}>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10">
                    <Search size={20} style={{ color: tx2 }} />
                    <p className="text-sm font-medium" style={{ color: tx2 }}>Aucune application trouvée</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {filtered.map(app => {
                      const locked  = app.permission === "premium" && !isPremium;
                      const pinned  = pinnedIds.includes(app.id);
                      const Icon    = app.icon;
                      return (
                        <div key={app.id} className="group relative">
                          <Link
                            href={locked ? "/client/abonnements" : app.route}
                            onClick={onClose}
                            className="relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all"
                            style={{
                              background: sur,
                              border: `1px solid ${bdr}`,
                              opacity: locked ? 0.55 : 1,
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = surH; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = sur; }}
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                              style={{ background: `${accent}14`, border: `1px solid ${accent}1c` }}>
                              <Icon size={16} style={{ color: accent }} />
                            </div>
                            <span className="w-full truncate text-xs font-semibold leading-tight" style={{ color: tx }}>
                              {app.name}
                            </span>
                            {locked && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                                style={{ background: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.4)" }}>
                                <Lock size={12} style={{ color: GOLD }} />
                              </div>
                            )}
                          </Link>

                          {/* Pin button — visible on hover, hidden when locked */}
                          {!locked && isPremium && (
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); onTogglePin(app.id); }}
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-all group-hover:opacity-100"
                              style={{
                                background: pinned ? accent : (isDark ? "rgba(30,32,38,0.95)" : "rgba(240,240,245,0.95)"),
                                border: `1px solid ${pinned ? accent : bdr}`,
                                color: pinned ? "#fff" : tx2,
                              }}
                              title={pinned ? "Désépingler" : "Épingler dans la sidebar"}
                            >
                              {pinned ? <Check size={9} /> : <Pin size={9} />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: `1px solid ${bdr}` }}>
                <span className="text-[11px] font-bold tracking-wider" style={{ color: `${accent}60` }}>DJAMA</span>
                <span className="text-[11px]" style={{ color: tx2 }}>
                  {pinnedIds.length > 0 ? `${pinnedIds.length} app${pinnedIds.length > 1 ? "s" : ""} épinglée${pinnedIds.length > 1 ? "s" : ""}` : "Épinglez vos apps préférées"}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}