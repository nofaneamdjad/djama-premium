"use client";

import type { LucideIcon } from "lucide-react";

function lighten(hex: string, t = 0.38): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (n: number) => Math.min(255, Math.round(n + (255 - n) * t)).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

interface Props {
  icon: LucideIcon;
  color: string;
  size?: number;
  /** px size of the container (default 44) */
  containerSize?: number;
  borderRadius?: number;
}

export default function ModuleHeaderIcon({
  icon: Icon,
  color,
  size = 22,
  containerSize = 44,
  borderRadius = 13,
}: Props) {
  const light = lighten(color, 0.4);
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius,
        background: `linear-gradient(150deg, ${light} 0%, ${color} 100%)`,
        boxShadow: `0 4px 14px ${color}40, 0 1px 4px rgba(0,0,0,0.18)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "inherit",
          background:
            "linear-gradient(165deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 45%, transparent 100%)",
        }}
      />
      <Icon size={size} color="white" strokeWidth={1.7} />
    </div>
  );
}
