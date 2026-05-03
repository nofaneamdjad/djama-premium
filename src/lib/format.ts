/**
 * Utilitaires de formatage partagés — DJAMA PRO
 *
 * Centralise fmtEur et fmtDate pour éviter de les redéfinir
 * dans chaque page client (factures, crm, chrono, dépenses…).
 */

/**
 * Formate un nombre en euros (fr-FR).
 * @example fmtEur(1234.5) → "1 234,50 €"
 */
export function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

/**
 * Formate une date ISO (YYYY-MM-DD) en date lisible française.
 * Utilise une construction manuelle y/m/d pour éviter les problèmes
 * de timezone (new Date("2026-01-15") interprète en UTC sinon).
 * @example fmtDate("2026-01-15") → "15 janv. 2026"
 */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parts = iso.split("-").map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

/**
 * Formate une date ISO en format court (sans année).
 * @example fmtDateShort("2026-01-15") → "15 janv."
 */
export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parts = iso.split("-").map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(y, m - 1, d));
}

/**
 * Formate une durée en minutes en format lisible.
 * @example fmtDuration(90) → "1h 30m"
 * @example fmtDuration(45) → "45m"
 */
export function fmtDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}
