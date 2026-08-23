"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Lock } from "lucide-react";
import { getToolTier } from "@/lib/plans";
import type { ModuleItem, ModuleGroup } from "@/lib/module-groups";
import { useTheme } from "@/lib/theme-context";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

function lighten(hex: string, t = 0.32): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (n: number) => Math.min(255, Math.round(n + (255 - n) * t)).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

const cursive: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
};

/* ── Icône style iOS ─────────────────────────────────────── */
export function ModuleCard({
  mod,
  index,
  isPremium,
}: {
  mod: ModuleItem;
  index: number;
  isPremium: boolean;
}) {
  const { isDark } = useTheme();
  const tier = getToolTier(mod.href);
  const isLocked = tier === "premium" && !isPremium;
  const Icon = mod.icon;
  const light = lighten(mod.color, 0.35);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.80 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, delay: 0.02 + index * 0.016, ease }}
    >
      <Link
        href={isLocked ? "/client/abonnements" : mod.href}
        className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-all hover:bg-black/[0.04]"
        style={{ opacity: isLocked ? 0.5 : 1 }}
      >
        <motion.div
          whileTap={{ scale: 0.84 }}
          transition={{ duration: 0.1 }}
          className="relative"
        >
          {/* Icône 68×68 style iOS */}
          <div
            className="relative flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105"
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              background: `linear-gradient(145deg, ${light} 0%, ${mod.color} 100%)`,
              boxShadow: isLocked
                ? "none"
                : `0 2px 8px rgba(0,0,0,0.12)`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: "inherit",
                background: "linear-gradient(165deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.04) 45%, transparent 100%)",
              }}
            />
            <Icon size={28} color="white" strokeWidth={1.8} />
          </div>

          {/* Badge cadenas PRO */}
          {isLocked && (
            <div
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                border: "1.5px solid rgba(0,0,0,0.4)",
                boxShadow: `0 2px 6px ${GOLD}40`,
              }}
            >
              <Lock size={9} color="white" strokeWidth={2.5} />
            </div>
          )}
        </motion.div>

        {/* Label */}
        <p
          className="text-[0.72rem] font-bold leading-tight"
          style={{ color: isDark ? "rgba(255,255,255,0.80)" : "#1f2937" }}
        >
          {mod.label}
        </p>
      </Link>
    </motion.div>
  );
}

/* ── Section groupe — style homepage ─────────────────────── */
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
  const allPremium = group.modules.every((m) => getToolTier(m.href) === "premium");
  const groupIsLocked = allPremium && isFree;
  const { isDark } = useTheme();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + groupIndex * 0.04, ease }}
      className="mb-6"
    >
      {/* Titre cursif style homepage */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <h2
          className="text-[1.25rem]"
          style={{
            ...cursive,
            color: isDark ? "rgba(255,255,255,0.70)" : "#374151",
          }}
        >
          {group.label}
        </h2>
        {groupIsLocked && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide"
            style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}28`, color: GOLD }}
          >
            <Crown size={7} /> PRO
          </span>
        )}
      </div>

      {/* Carte blanche (light) / sombre (dark) */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
          boxShadow: isDark
            ? "0 2px 16px rgba(0,0,0,0.25)"
            : "0 1px 6px rgba(0,0,0,0.07)",
        }}
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {group.modules.map((mod, mi) => (
            <ModuleCard
              key={mod.href}
              mod={mod}
              index={groupIndex * 6 + mi}
              isPremium={isPremium}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
