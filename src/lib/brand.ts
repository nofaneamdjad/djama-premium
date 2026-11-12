/**
 * DJAMA — Tokens de marque partagés (site public)
 *
 * Source de vérité unique pour les couleurs de la charte DJAMA.
 * Importer depuis ici plutôt que de déclarer GOLD localement dans chaque page.
 *
 * Palette officielle :
 *   Jaune  #FFB900  — accent principal, CTA, surlignage
 *   Noir   #0A0A0A  — fonds sombres, textes forts
 *   Blanc  #FFFFFF  — fonds clairs
 *   Gris   #374151  — textes secondaires
 */

/** Jaune DJAMA officiel — NE JAMAIS utiliser #c9a55a */
export const BRAND_YELLOW = "#FFB900";

/** Jaune DJAMA pour les rgba() */
export const BRAND_YELLOW_R = "255,185,0";

/** Noir DJAMA — fonds sombres et textes forts */
export const BRAND_BLACK = "#0A0A0A";

/** Gris DJAMA — textes secondaires */
export const BRAND_GRAY = "#374151";

/** Typographie DJAMA — titres et corps */
export const BRAND_FONT = "'Inter', system-ui, -apple-system, sans-serif";

/** Ne plus utiliser — alias de BRAND_YELLOW pour migration */
export const GOLD  = BRAND_YELLOW;
export const GOLDR = BRAND_YELLOW_R;
