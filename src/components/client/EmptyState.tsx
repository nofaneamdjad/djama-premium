"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon:         LucideIcon;
  title:        string;
  description?: string;
  action?:      { label: string; onClick: () => void };
    color?:       string;
  className?:   string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  color = "#ffffff40",
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 px-4 text-center ${className}`}>
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/[0.10]"
        style={{ background: "#ffffff05" }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <p className="text-sm font-semibold text-white/50">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-white/25 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.07] hover:text-white/80 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
