"use client";

import { createContext, useContext } from "react";
import type { CSSProperties } from "react";
import { Star } from "lucide-react";

export const DarkCtx = createContext(true);
export const useDark = () => useContext(DarkCtx);

export function useInp() {
  const isDark = useDark();
  return (extra = "") => isDark
    ? `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.18] transition-colors ${extra}`
    : `w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors ${extra}`;
}

export function selStyle(isDark: boolean): CSSProperties {
  return {
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
    colorScheme: isDark ? "dark" : "light",
  };
}

export function Lbl({ children }: { children: React.ReactNode }) {
  const isDark = useDark();
  return (
    <label className={`mb-1.5 block text-xs font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>
      {children}
    </label>
  );
}

export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const isDark = useDark();
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          className={`text-base transition-all ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          style={{ color: n <= value ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}>
          <Star size={16} fill="currentColor" strokeWidth={1}/>
        </button>
      ))}
    </div>
  );
}
