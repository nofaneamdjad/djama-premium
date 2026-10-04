"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Grid2x2, Plus, Search, User } from "lucide-react";

const GOLD = "#c9a55a";

interface Props {
  pathname: string;
  dark?: boolean;
  accent?: string;
  onLauncherOpen: () => void;
  onSearchOpen: () => void;
}

export default function BottomNavMobile({ pathname, dark = false, accent = GOLD, onLauncherOpen: _onLauncherOpen, onSearchOpen }: Props) {
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
      href: "/client/factures",
      exact: false,
      onClick: undefined,
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

  const dimColor  = dark ? "rgba(255,255,255,0.50)" : "#9ca3af";

  return (
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
            ? item.exact ? pathname === item.href : pathname.startsWith(item.href)
            : false;
          const Icon = item.icon;
          const isCreate = item.key === "creer";

          const inner = (
            <>
              <motion.div
                animate={{ scale: active || isCreate ? 1.12 : 1 }}
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
  );
}
