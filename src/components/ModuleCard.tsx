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

/* Éclaircit un hex en interpolant vers blanc */
function lighten(hex: string, t = 0.32): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (n: number) => Math.min(255, Math.round(n + (255 - n) * t)).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

/* ── Icône style iOS/Samsung ─────────────────────────────── */
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
  const Icon = mod.icon;
  const light = lighten(mod.color, 0.35);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.70 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, delay: 0.02 + index * 0.016, ease }}
    >
      <Link
        href={isLocked ? "/client/abonnements" : mod.href}
        className="group flex flex-col items-center gap-[6px] py-3 px-1"
      >
        <motion.div
          whileTap={{ scale: 0.84 }}
          transition={{ duration: 0.1 }}
          className="relative"
        >
          {/* Conteneur icône — style iOS */}
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              width: 60,
              height: 60,
              borderRadius: 15,
              background: `linear-gradient(150deg, ${light} 0%, ${mod.color} 100%)`,
              boxShadow: isLocked
                ? "none"
                : `0 4px 16px ${mod.color}40, 0 1px 4px rgba(0,0,0,0.18)`,
              opacity: isLocked ? 0.38 : 1,
            }}
          >
            {/* Reflet gloss en haut */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: "inherit",
                background:
                  "linear-gradient(165deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.04) 45%, transparent 100%)",
              }}
            />
            <Icon size={27} color="white" strokeWidth={1.7} />
          </div>

          {/* Badge cadenas PRO */}
          {isLocked && (
            <div
              className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                border: "1.5px solid rgba(0,0,0,0.4)",
                boxShadow: `0 2px 6px ${GOLD}40`,
              }}
            >
              <Lock size={8} color="white" strokeWidth={2.5} />
            </div>
          )}
        </motion.div>

        {/* Label */}
        <p
          className={`text-[10px] font-medium text-center leading-[1.25] line-clamp-2 w-full max-w-[64px] transition-opacity ${
            isLocked ? "opacity-25" : "opacity-65 group-hover:opacity-90"
          }`}
          style={{ color: "inherit" }}
        >
          {mod.label}
        </p>
      </Link>
    </motion.div>
  );
}

/* ── Section groupe ───────────────────────────────────────── */
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
      transition={{ duration: 0.28, delay: 0.06 + groupIndex * 0.045, ease }}
    >
      {/* En-tête section — minimaliste */}
      <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
        <GroupIcon size={10} style={{ color: group.color }} strokeWidth={2.5} />
        <span
          className="text-[10px] font-semibold tracking-[0.07em]"
          style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)" }}
        >
          {group.label.toUpperCase()}
        </span>
        <span
          className="ml-auto text-[9.5px] font-bold tabular-nums"
          style={{ color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.22)" }}
        >
          {group.modules.length}
        </span>
        {groupIsLocked && (
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide"
            style={{
              background: `${GOLD}12`,
              border: `1px solid ${GOLD}28`,
              color: GOLD,
            }}
          >
            <Crown size={6} /> PRO
          </div>
        )}
      </div>

      {/* Grille — carte semi-transparente */}
      <div
        className="grid grid-cols-4 rounded-[20px] overflow-hidden"
        style={{
          background: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.92)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.06)",
          boxShadow: isDark
            ? "0 2px 24px rgba(0,0,0,0.22)"
            : "0 2px 18px rgba(0,0,0,0.07)",
          color: isDark ? "white" : "#1a1a1a",
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
