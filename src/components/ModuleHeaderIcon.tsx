"use client";

import { useTheme } from "@/lib/theme-context";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  /** @deprecated couleurs arbitraires supprimées — utilise l'accent du Design System */
  color?: string;
  size?: number;
  containerSize?: number;
  borderRadius?: number;
}

export default function ModuleHeaderIcon({
  icon: Icon,
  size = 22,
  containerSize = 44,
  borderRadius = 13,
}: Props) {
  const { accent } = useTheme();
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius,
        background: `${accent}18`,
        border: `1.5px solid ${accent}28`,
      }}
    >
      <Icon size={size} style={{ color: accent }} strokeWidth={1.7} />
    </div>
  );
}
