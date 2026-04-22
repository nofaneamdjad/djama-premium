"use client";
/**
 * ThemeToggle — Bouton animé soleil / lune pour changer de thème.
 *
 * Usage :
 *   <ThemeToggle />                         → compact (navbar)
 *   <ThemeToggle variant="pill" />          → pill avec label
 *   <ThemeToggle variant="icon-only" />     → icône seule sans fond
 */

import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export interface ThemeToggleProps {
  variant?:   "default" | "pill" | "icon-only";
  className?: string;
  size?:      number;
}

export function ThemeToggle({
  variant   = "default",
  className = "",
  size      = 15,
}: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  const label = isDark ? "Mode jour" : "Mode nuit";

  const iconNode = (
    <AnimatePresence mode="wait" initial={false}>
      {isDark ? (
        <motion.span
          key="moon"
          initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0,   scale: 1   }}
          exit={{    opacity: 0, rotate:  90, scale: 0.7 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex" }}
        >
          <Moon size={size} />
        </motion.span>
      ) : (
        <motion.span
          key="sun"
          initial={{ opacity: 0, rotate:  90, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0,   scale: 1   }}
          exit={{    opacity: 0, rotate: -90, scale: 0.7 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex" }}
        >
          <Sun size={size} />
        </motion.span>
      )}
    </AnimatePresence>
  );

  if (variant === "icon-only") {
    return (
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.88 }}
        aria-label={label}
        title={label}
        className={`text-[var(--text-38)] transition-colors hover:text-[var(--text-primary)] ${className}`}
      >
        {iconNode}
      </motion.button>
    );
  }

  if (variant === "pill") {
    return (
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.96 }}
        aria-label={label}
        title={label}
        className={[
          "inline-flex items-center gap-2 rounded-full",
          "border border-[var(--border-base)] bg-[var(--bg-glass)]",
          "px-3 py-1.5 text-[0.7rem] font-bold",
          "text-[var(--text-55)] transition-all duration-200",
          "hover:border-[var(--accent-border)] hover:text-[var(--accent)]",
          className,
        ].join(" ")}
      >
        {iconNode}
        <span>{isDark ? "Jour" : "Nuit"}</span>
      </motion.button>
    );
  }

  /* default — rond compact style navbar */
  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.88 }}
      aria-label={label}
      title={label}
      className={[
        "flex items-center justify-center rounded-full",
        "border border-[var(--border-base)] bg-[var(--bg-glass)]",
        "h-8 w-8 text-[var(--text-55)]",
        "transition-all duration-200",
        "hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)]",
        "hover:text-[var(--accent)]",
        className,
      ].join(" ")}
    >
      {iconNode}
    </motion.button>
  );
}
