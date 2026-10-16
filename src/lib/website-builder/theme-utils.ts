// Tokens de thème pour les pages du Website Builder
export function tok(isDark: boolean) {
  return {
    bg:     isDark ? "#0a0b12"                : "#f2f4f7",
    glass:  isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    text:   isDark ? "#e4ddd4"                : "#1a1a1a",
  };
}
