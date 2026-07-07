"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeMode = "dark" | "light";

export interface AccentOption {
  name:  string;
  value: string;
  label: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { name: "gold",    value: "#c9a55a", label: "Or"       },
  { name: "indigo",  value: "#6366f1", label: "Indigo"   },
  { name: "emerald", value: "#10b981", label: "Émeraude" },
  { name: "rose",    value: "#f43f5e", label: "Rose"     },
  { name: "sky",     value: "#0ea5e9", label: "Ciel"     },
  { name: "violet",  value: "#8b5cf6", label: "Violet"   },
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>({
    mode:       "dark",
    accent:     "#c9a55a",
    accentName: "gold",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setState(prev => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  // Sync data-theme sur <html> pour les CSS anti-flash
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.mode);
    document.documentElement.style.colorScheme = state.mode;
  }, [state.mode]);

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
      isDark:    state.mode === "dark",
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
