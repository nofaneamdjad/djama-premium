"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Lock } from "lucide-react";
import { AppModuleIcon } from "@/components/AppIcons";
import { getToolTier } from "@/lib/plans";
import type { ModuleItem, ModuleGroup } from "@/lib/module-groups";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

/* ── Carte module (2 colonnes) ── */
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.04 + index * 0.035, ease }}
    >
      <Link href={isLocked ? "/client/abonnements" : mod.href} className="group block">
        <motion.div
          whileTap={{ scale: 0.96 }}
          className="relative flex flex-col gap-2.5 rounded-2xl p-3.5 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: isLocked
              ? "rgba(201,165,90,0.05)"
              : "rgba(255,255,255,0.04)",
            border: isLocked
              ? "1px solid rgba(201,165,90,0.2)"
              : "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}
        >
          {/* Icône + badge verrou */}
          <div className="relative self-start">
            <AppModuleIcon href={mod.href} size={48} locked={isLocked} />
            {isLocked && (
              <div
                className="absolute -bottom-0.5 -right-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full shadow"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", border: "1.5px solid rgba(255,255,255,0.15)" }}
              >
                <Lock size={8} color="white" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <p className={`text-[12.5px] font-bold leading-tight ${isLocked ? "text-white/35" : "text-white/85"}`}>
              {mod.label}
            </p>
            {mod.sub && (
              <p className="mt-0.5 text-[10.5px] leading-snug text-white/35 line-clamp-2">
                {isLocked ? "Accès PRO requis" : mod.sub}
              </p>
            )}
          </div>

          {/* Badge tier */}
          {isLocked ? (
            <div
              className="self-start flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(201,165,90,0.10)", border: "1px solid rgba(201,165,90,0.25)", color: GOLD }}
            >
              <Crown size={6} /> PRO
            </div>
          ) : tier === "free" ? (
            <div
              className="self-start flex items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}
            >
              Gratuit
            </div>
          ) : null}
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ── Section de groupe (en-tête + grille 2-col) ── */
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: 0.1 + groupIndex * 0.06, ease }}
    >
      {/* En-tête groupe */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: `${group.color}18` }}
          >
            <GroupIcon size={13} style={{ color: group.color }} strokeWidth={2} />
          </div>
          <h3 className="text-[12.5px] font-black text-white/60 tracking-wide">{group.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          {groupIsLocked && (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(201,165,90,0.1)", border: "1px solid rgba(201,165,90,0.22)", color: GOLD }}
            >
              <Crown size={7} /> PRO
            </div>
          )}
          <span className="text-[10px] font-bold text-white/20 tabular-nums">
            {group.modules.length}
          </span>
        </div>
      </div>

      {/* Grille 2 colonnes */}
      <div className="grid grid-cols-2 gap-3">
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
