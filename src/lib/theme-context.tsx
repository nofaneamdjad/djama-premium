"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeMode = "dark" | "light" | "auto";

export interface AccentOption {
  name:  string;
  value: string;
  label: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { name: "yellow",  value: "#FFB900", label: "Jaune DJAMA" },
  { name: "indigo",  value: "#6366f1", label: "Indigo"      },
  { name: "emerald", value: "#10b981", label: "Émeraude"    },
  { name: "rose",    value: "#f43f5e", label: "Rose"        },
  { name: "sky",     value: "#0ea5e9", label: "Ciel"        },
  { name: "violet",  value: "#8b5cf6", label: "Violet"      },
];

interface ThemeState {
  mode:       ThemeMode;
  accent:     string;
  accentName: string;
}

interface ThemeCtx extends ThemeState {
  toggle:    () => void;
  setMode:   (m: ThemeMode) => void;
  setAccent: (value: string, name: string) => void;
  isDark:    boolean;
}

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = "djama-theme";

function autoIsDark(): boolean {
  const h = new Date().getHours();
  return h >= 20 || h < 7;
}

function loadInitialState(): ThemeState {
  const defaults: ThemeState = { mode: "dark", accent: "#FFB900", accentName: "yellow" };
  if (typeof window === "undefined") return defaults;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch {}
  return defaults;
}

function computeDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return autoIsDark();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(loadInitialState);
  const [resolvedDark, setResolvedDark] = useState(() => computeDark(loadInitialState().mode));

  useEffect(() => {
    function compute() {
      const dark = computeDark(state.mode);
      setResolvedDark(dark);
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    }
    compute();
    if (state.mode === "auto") {
      const interval = setInterval(compute, 60_000);
      return () => clearInterval(interval);
    }
  }, [state.mode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", state.accent);
    document.documentElement.style.setProperty("--djama-yellow", state.accent);
  }, [state.accent]);

  function save(next: Partial<ThemeState>) {
    setState(prev => {
      const updated = { ...prev, ...next };
      try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  return (
    <Ctx.Provider value={{
      ...state,
      isDark:    resolvedDark,
      toggle:    () => save({ mode: state.mode === "dark" ? "light" : "dark" }),
      setMode:   (mode)               => save({ mode }),
      setAccent: (accent, accentName) => save({ accent, accentName }),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
