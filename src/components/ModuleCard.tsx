"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Lock } from "lucide-react";
import { AppModuleIcon } from "@/components/AppIcons";
import { getToolTier } from "@/lib/plans";
import type { ModuleItem, ModuleGroup } from "@/lib/module-groups";
import { useTheme } from "@/lib/theme-context";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

/* ── Icône style téléphone ── */
export function ModuleCard({
  mod,
  index,
  isPremium,
}: {
  mod: ModuleItem;
  index: number;
  isPremium: boolean;
}) {
  const tier = getToolTier(mod.href);
  const isLocked = tier === "premium" && !isPremium;
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: 0.02 + index * 0.018, ease }}
    >
      <Link href={isLocked ? "/client/abonnements" : mod.href} className="group flex flex-col items-center gap-1.5 p-2">
        <motion.div
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.12 }}
          className="relative"
        >
          <AppModuleIcon href={mod.href} size={52} locked={isLocked} hideBackground={isDark} />
          {isLocked && (
            <div
              className="absolute -bottom-0.5 -right-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", border: "1.5px solid rgba(0,0,0,0.5)" }}
            >
              <Lock size={7} color="white" strokeWidth={2.5} />
            </div>
          )}
          {isLocked && tier === "premium" && (
            <div
              className="absolute -top-1 -right-1 flex h-[14px] w-[14px] items-center justify-center rounded-full"
              style={{ background: "rgba(201,165,90,0.15)", border: "1px solid rgba(201,165,90,0.35)" }}
            >
              <Crown size={7} style={{ color: GOLD }} />
            </div>
          )}
        </motion.div>
        <p
          className={`text-[9.5px] font-medium text-center leading-tight line-clamp-2 w-full max-w-[68px] ${
            isLocked
              ? isDark ? "text-white/28" : "text-gray-300"
              : isDark ? "text-white/65" : "text-gray-600"
          }`}
        >
          {mod.label}
        </p>
      </Link>
    </motion.div>
  );
}

/* ── Section de groupe (en-tête + grille icônes) ── */
export function ModuleGroupSection({
  group,
  groupIndex,
  isPremium,
  isFree,
}: {
  group: ModuleGroup;
  groupIndex: number;
  isPremium: boolean;
  isFree: boolean;
}) {
  const GroupIcon = group.icon;
  const allPremium = group.modules.every((m) => getToolTier(m.href) === "premium");
  const groupIsLocked = allPremium && isFree;
  const { isDark } = useTheme();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08 + groupIndex * 0.05, ease }}
    >
      {/* En-tête groupe */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div
            className="flex h-5 w-5 items-center justify-center rounded-md"
            style={{ background: `${group.color}18` }}
          >
            <GroupIcon size={11} style={{ color: group.color }} strokeWidth={2} />
          </div>
          <h3 className={`text-[11.5px] font-bold tracking-wide ${isDark ? "text-white/50" : "text-gray-500"}`}>{group.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          {groupIsLocked && (
            <div
              className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(201,165,90,0.1)", border: "1px solid rgba(201,165,90,0.22)", color: GOLD }}
            >
              <Crown size={6} /> PRO
            </div>
          )}
          <span className={`text-[9.5px] font-bold tabular-nums ${isDark ? "text-white/20" : "text-gray-400"}`}>
            {group.modules.length}
          </span>
        </div>
      </div>

      {/* Grille icônes style téléphone */}
      <div
        className="grid grid-cols-4 gap-0 rounded-2xl px-1 py-2"
        style={{
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.93)",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.20)" : "0 4px 22px rgba(0,0,0,0.07)",
        }}
      >
        {group.modules.map((mod, mi) => (
          <ModuleCard
            key={mod.href}
            mod={mod}
            index={groupIndex * 6 + mi}
            isPremium={isPremium}
          />
        ))}
      </div>
    </motion.section>
  );
}
