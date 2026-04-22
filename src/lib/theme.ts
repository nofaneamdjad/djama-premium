/**
 * theme.ts — Types et utilitaires du système de thème DJAMA.
 */

export type Theme = "dark" | "light";

export const THEME_KEY    = "djama-theme";
export const THEMES       = ["dark", "light"] as const;
export const DEFAULT_THEME: Theme = "dark";

/** Lit et résoud le thème au premier chargement (avant React). */
export function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored && THEMES.includes(stored)) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return DEFAULT_THEME;
  }
}

/** Applique un thème sur <html> sans passer par React. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  // Met à jour la balise meta theme-color dynamiquement
  const metaThemeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (metaThemeColor) {
    metaThemeColor.content = theme === "dark" ? "#09090b" : "#f7f6f2";
  }
}
