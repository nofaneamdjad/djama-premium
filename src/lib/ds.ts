/**
 * DJAMA Design System — Tokens & utilitaires
 * Direction : blanc & lumineux, premium, structuré, dense mais pas chargé.
 * Or (#c9a55a) utilisé uniquement comme accent — jamais comme couleur principale.
 */

export const GOLD   = "#c9a55a";
export const GOLD_B = "#b08d45";

export interface DSTokens {
  bg:          string;
  bgSoft:      string;
  bgSubtle:    string;
  border:      string;
  borderSoft:  string;
  text:        string;
  text2:       string;
  text3:       string;
  text4:       string;
  goldBg:      string;
  goldBorder:  string;
}

export const LIGHT: DSTokens = {
  bg:          "#ffffff",
  bgSoft:      "#f7f7fa",
  bgSubtle:    "#f0f0f4",
  border:      "#e0e0ea",
  borderSoft:  "#eaeaef",
  text:        "#0c0c15",
  text2:       "#3a3a52",
  text3:       "#76768e",
  text4:       "#a6a6bc",
  goldBg:      "rgba(201,165,90,0.08)",
  goldBorder:  "rgba(201,165,90,0.22)",
};

export const DARK: DSTokens = {
  bg:          "#111111",
  bgSoft:      "#181818",
  bgSubtle:    "#212121",
  border:      "rgba(255,255,255,0.08)",
  borderSoft:  "rgba(255,255,255,0.05)",
  text:        "rgba(255,255,255,0.92)",
  text2:       "rgba(255,255,255,0.65)",
  text3:       "rgba(255,255,255,0.42)",
  text4:       "rgba(255,255,255,0.35)",
  goldBg:      "rgba(201,165,90,0.09)",
  goldBorder:  "rgba(201,165,90,0.22)",
};

/** Hook contextuel — retourne les tokens selon isDark */
export function useDS(isDark: boolean): DSTokens & { gold: string; goldB: string } {
  return { ...(isDark ? DARK : LIGHT), gold: GOLD, goldB: GOLD_B };
}

// Helpers de style pré-construits
export function card(t: DSTokens, radius = 8) {
  return { background: t.bg, border: `1px solid ${t.border}`, borderRadius: radius };
}

export function cardSoft(t: DSTokens, radius = 8) {
  return { background: t.bgSoft, border: `1px solid ${t.borderSoft}`, borderRadius: radius };
}

export function goldCard(t: DSTokens, radius = 8) {
  return { background: t.goldBg, border: `1px solid ${t.goldBorder}`, borderRadius: radius };
}
