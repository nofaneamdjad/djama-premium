"use client";

/**
 * Badge — composant unifié pour les statuts, types et labels colorés.
 *
 * Deux modes :
 *  - `variant` : couleur sémantique Tailwind (success, warning, error, info, neutral, purple)
 *  - `color` / `bg` : couleurs hex personnalisées (pour CRM, planning, etc.)
 */

interface BadgeProps {
  label:    string;
  /** Couleur de texte hex — mode personnalisé */
  color?:   string;
  /** Couleur de fond hex (ex: "#10b98120") — mode personnalisé */
  bg?:      string;
  /** Couleur de bordure hex — optionnel en mode personnalisé */
  border?:  string;
  /** Variant sémantique Tailwind */
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "purple";
  size?:    "xs" | "sm";
  className?: string;
  dot?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  success: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
  warning: "bg-amber-500/15   border-amber-500/25   text-amber-300",
  error:   "bg-red-500/15     border-red-500/25     text-red-300",
  info:    "bg-blue-500/15    border-blue-500/25    text-blue-300",
  neutral: "bg-white/[0.06]   border-white/[0.08]   text-white/50",
  purple:  "bg-violet-500/15  border-violet-500/25  text-violet-300",
};

export function Badge({
  label,
  color,
  bg,
  border,
  variant,
  size = "xs",
  className = "",
  dot = false,
}: BadgeProps) {
  const sizeClass = size === "xs"
    ? "px-2 py-0.5 text-[0.65rem]"
    : "px-2.5 py-1 text-xs";

  const variantClass = variant ? VARIANT_CLASSES[variant] : "";

  const inlineStyle = !variant && (color || bg) ? {
    color,
    background: bg,
    borderColor: border ?? (color ? color + "30" : undefined),
  } : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${sizeClass} ${variantClass} ${className}`}
      style={inlineStyle}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: color ?? "currentColor" }}
        />
      )}
      {label}
    </span>
  );
}

export default Badge;
