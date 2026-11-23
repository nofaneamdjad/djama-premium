"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Grid2x2, Plus, Search, User, ReceiptText, FileSignature, X } from "lucide-react";

const GOLD = "#FFB900";

interface Props {
  pathname: string;
  dark?: boolean;
  accent?: string;
  onLauncherOpen: () => void;
  onSearchOpen: () => void;
}

export default function BottomNavMobile({ pathname, dark = false, accent = GOLD, onLauncherOpen: _onLauncherOpen, onSearchOpen }: Props) {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const inFactures = pathname.startsWith("/client/factures");

  const items = [
    {
      key: "accueil",
      label: "Accueil",
      icon: Home,
      href: "/client",
      exact: true,
      onClick: undefined as (() => void) | undefined,
    },
    {
      key: "apps",
      label: "Applications",
      icon: Grid2x2,
      href: "/client/apps",
      exact: false,
      onClick: undefined as (() => void) | undefined,
    },
    {
      key: "creer",
      label: "Créer",
      icon: Plus,
      href: inFactures ? undefined : "/client/factures",
      exact: false,
      onClick: inFactures ? () => setCreateMenuOpen(v => !v) : undefined,
    },
    {
      key: "recherche",
      label: "Recherche",
      icon: Search,
      href: undefined,
      exact: false,
      onClick: onSearchOpen,
    },
    {
      key: "profil",
      label: "Profil",
      icon: User,
      href: "/client/profil",
      exact: false,
      onClick: undefined,
    },
  ] as const;

  const dimColor = dark ? "rgba(255,255,255,0.50)" : "#9ca3af";
  const menuBg   = dark ? "rgba(18,18,22,0.98)" : "rgba(255,255,255,0.98)";

  return (
    <>
      {/* Menu de création (Factures) */}
      <AnimatePresence>
        {createMenuOpen && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(0,0,0,0.45)" }}
              onClick={() => setCreateMenuOpen(false)}
            />
            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-x-0 z-50 lg:hidden"
              style={{
                bottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
                background: menuBg,
                borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
                borderRadius: "20px 20px 0 0",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.20)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <span className="text-sm font-bold" style={{ color: dark ? "#ffffff" : "#111827" }}>Nouveau document</span>
                <button onClick={() => setCreateMenuOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <X size={14} style={{ color: dark ? "rgba(255,255,255,0.5)" : "#6b7280" }} />
                </button>
              </div>
              <div className="flex flex-col gap-2 px-4 pb-5">
                <Link
                  href="/client/factures/documents?new=1&type=facture"
                  onClick={() => setCreateMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition active:opacity-80"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}33` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: accent }}>
                    <ReceiptText size={18} style={{ color: "#0a0a0a" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: dark ? "#ffffff" : "#111827" }}>Nouvelle facture</div>
                    <div className="text-xs" style={{ color: dark ? "rgba(255,255,255,0.45)" : "#6b7280" }}>Créer et envoyer une facture</div>
                  </div>
                </Link>
                <Link
                  href="/client/factures/documents?new=1&type=devis"
                  onClick={() => setCreateMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition active:opacity-80"
                  style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)" }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                    <FileSignature size={18} style={{ color: dark ? "rgba(255,255,255,0.6)" : "#374151" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: dark ? "#ffffff" : "#111827" }}>Nouveau devis</div>
                    <div className="text-xs" style={{ color: dark ? "rgba(255,255,255,0.45)" : "#6b7280" }}>Proposer un devis à un client</div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-0 inset-x-0 z-30 lg:hidden"
        style={{
          background: dark ? "rgba(9,9,14,0.97)" : "rgba(252,253,255,0.97)",
          borderTop: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: dark ? "0 -4px 24px rgba(0,0,0,0.28)" : "0 -4px 16px rgba(0,0,0,0.05)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex">
          {items.map(item => {
            const active = item.href
              ? item.exact ? pathname === item.href : pathname.startsWith(item.href as string)
              : false;
            const Icon = item.icon;
            const isCreate = item.key === "creer";

            const inner = (
              <>
                <motion.div
                  animate={{ scale: active || isCreate ? 1.12 : 1, rotate: isCreate && createMenuOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className={isCreate ? "flex h-9 w-9 items-center justify-center rounded-full" : undefined}
                  style={isCreate ? { background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 2px 10px ${accent}40` } : undefined}
                >
                  <Icon
                    size={isCreate ? 19 : 22}
                    strokeWidth={active || isCreate ? 2.2 : 1.7}
                    style={{ color: isCreate ? "#0a0a0a" : active ? accent : dimColor }}
                  />
                </motion.div>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: isCreate ? accent : active ? accent : dimColor }}
                >
                  {item.label}
                </span>
                {active && !isCreate && (
                  <motion.div
                    layoutId="bottomNavDot"
                    className="absolute bottom-1 h-1 w-1 rounded-full"
                    style={{ background: accent }}
                  />
                )}
              </>
            );

            const cls = "relative flex flex-1 flex-col items-center gap-1 py-2.5 transition-opacity active:opacity-70";

            if (item.onClick) {
              return (
                <button key={item.key} onClick={item.onClick} className={cls}>
                  {inner}
                </button>
              );
            }
            return (
              <Link key={item.key} href={item.href!} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
