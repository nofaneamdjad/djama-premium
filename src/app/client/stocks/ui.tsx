"use client";

import { createContext, useContext } from "react";
import type React from "react";

export const DarkCtx = createContext(true);
export const useDark = () => useContext(DarkCtx);

export function useInp() {
  const isDark = useDark();
  return (extra = "") => isDark
    ? `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.18] transition-colors ${extra}`
    : `w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors ${extra}`;
}

export function selStyle(isDark: boolean): React.CSSProperties {
  return {
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    color:           isDark ? "rgba(255,255,255,0.7)"  : "#374151",
    borderColor:     isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
    colorScheme:     isDark ? "dark" : "light",
  };
}

export function Label({ children }: { children: React.ReactNode }) {
  const isDark = useDark();
  return (
    <label className={`mb-1.5 block text-[0.65rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>
      {children}
    </label>
  );
}
