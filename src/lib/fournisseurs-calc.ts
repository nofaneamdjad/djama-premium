export const VAT_RATES = [0, 5.5, 10, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

/**
 * Calcule TVA et TTC à partir du HT et du taux.
 * Arrondi à 2 décimales, cohérent avec le trigger PostgreSQL
 * `ROUND(subtotal * vat_rate / 100, 2)`.
 */
export function calcVat(
  subtotal: number,
  vatRate: number,
): { vatAmount: number; total: number } {
  const vatAmount = Math.round(subtotal * vatRate) / 100;
  return { vatAmount, total: subtotal + vatAmount };
}
