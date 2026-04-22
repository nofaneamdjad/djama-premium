"use client";
/**
 * ThemeProvider — Fournit le contexte de thème (dark / light) à toute l'app.
 *
 * Stratégie no-flash :
 *   Un <script> inline dans layout.tsx s'exécute avant React et applique
 *   immédiatement data-theme sur <html>. Ce provider synchronise ensuite
 *   l'état React avec la valeur déjà présente dans le DOM.
 *
 * Persistance : localStorage (clé "djama-theme")
 * Fallback    : prefers-color-scheme au premier chargement
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { type Theme, THEME_KEY, applyTheme, resolveInitialTheme } from "@/lib/theme";

// ── Context ────────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme:     Theme;
  setTheme:  (t: Theme) => void;
  toggle:    () => void;
  isDark:    boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:    "dark",
  setTheme: () => {},
  toggle:   () => {},
  isDark:   true,
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  /*
   * Initialisation : si le script no-flash a déjà positionné data-theme,
   * on le lit depuis le DOM pour éviter un flash de re-rendu.
   */
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const attr = document.documentElement.getAttribute("data-theme") as Theme | null;
      if (attr === "dark" || attr === "light") return attr;
    }
    return "dark"; // valeur SSR safe
  });

  /* Sync initial avec localStorage / prefers-color-scheme */
  useEffect(() => {
    const resolved = resolveInitialTheme();
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  /* Écoute les changements système quand l'utilisateur n'a pas de préférence explicite */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_KEY)) {
        const t = e.matches ? "dark" : "light";
        setThemeState(t);
        applyTheme(t);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* noop */ }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
