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
  color = "#9ca3af",
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 px-4 text-center ${className}`}>
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50"
      >
        <Icon size={24} style={{ color }} />
      </div>
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-400 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
