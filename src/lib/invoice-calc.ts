/**
 * invoice-calc — Moteur de calcul déterministe pour factures et devis.
 * Utilisable côté client ET serveur (pas de dépendances browser).
 */

export function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const VALID_VAT_RATES = [0, 2.1, 5.5, 8.5, 10, 20] as const;

export interface CalcLineItem {
  quantity:   number;
  unit_price: number;
  vat_rate:   number;
  remise_pct?: number | null;
}

export interface InvoiceTotals {
  subtotal_ht: number;
  remise:      number;
  ht:          number;
  tva:         number;
  ttc:         number;
  acompte:     number;
  tvaByRate:   Record<string, { ht: number; tva: number }>;
}

export interface CalcError {
  field:   string;
  message: string;
}

/** Valide une ligne individuelle — retourne [] si valide */
export function validateLine(item: CalcLineItem, idx: number): CalcError[] {
  const errs: CalcError[] = [];
  if (!Number.isFinite(item.quantity) || item.quantity <= 0)
    errs.push({ field: `items[${idx}].quantity`, message: "La quantité doit être un nombre positif." });
  if (!Number.isFinite(item.unit_price) || item.unit_price < 0)
    errs.push({ field: `items[${idx}].unit_price`, message: "Le prix unitaire ne peut pas être négatif." });
  const rem = item.remise_pct ?? 0;
  if (!Number.isFinite(rem) || rem < 0 || rem > 100)
    errs.push({ field: `items[${idx}].remise_pct`, message: "La remise par ligne doit être comprise entre 0 et 100 %." });
  if (!(VALID_VAT_RATES as readonly number[]).includes(item.vat_rate))
    errs.push({ field: `items[${idx}].vat_rate`, message: `Taux de TVA invalide : ${item.vat_rate}. Valeurs acceptées : ${VALID_VAT_RATES.join(", ")} %.` });
  return errs;
}

/** Valide les paramètres globaux (remise, acompte) */
export function validateGlobals(globalRemisePct: number, acompte: number): CalcError[] {
  const errs: CalcError[] = [];
  if (!Number.isFinite(globalRemisePct) || globalRemisePct < 0 || globalRemisePct > 100)
    errs.push({ field: "remise_pct", message: "La remise globale doit être comprise entre 0 et 100 %." });
  if (!Number.isFinite(acompte) || acompte < 0)
    errs.push({ field: "acompte", message: "L'acompte ne peut pas être négatif." });
  return errs;
}

/**
 * Calcule les totaux d'un document de manière déterministe.
 * Lève une erreur si les données sont invalides.
 */
export function calcInvoiceTotals(
  items:          CalcLineItem[],
  globalRemisePct = 0,
  acompte         = 0,
): InvoiceTotals {
  if (items.length === 0) {
    return { subtotal_ht: 0, remise: 0, ht: 0, tva: 0, ttc: 0, acompte: 0, tvaByRate: {} };
  }

  // Validation complète
  const errors: CalcError[] = [
    ...items.flatMap((it, i) => validateLine(it, i)),
    ...validateGlobals(globalRemisePct, acompte),
  ];
  if (errors.length > 0) {
    throw new CalcValidationError(errors);
  }

  const tvaMap = new Map<number, { ht: number; tva: number }>();
  let htRaw = 0;
  let tvaRaw = 0;

  for (const it of items) {
    const gross   = r2(it.quantity * it.unit_price);
    const lineRem = r2(gross * (it.remise_pct || 0) / 100);
    const lineHT  = r2(gross - lineRem);
    const lineTVA = r2(lineHT * it.vat_rate / 100);
    htRaw  += lineHT;
    tvaRaw += lineTVA;
    const cur = tvaMap.get(it.vat_rate) ?? { ht: 0, tva: 0 };
    tvaMap.set(it.vat_rate, { ht: r2(cur.ht + lineHT), tva: r2(cur.tva + lineTVA) });
  }

  const subtotal_ht = r2(htRaw);
  const remise      = r2(subtotal_ht * globalRemisePct / 100);
  const ht          = r2(subtotal_ht - remise);
  const factor      = subtotal_ht > 0 ? ht / subtotal_ht : 1;

  // Appliquer la remise globale proportionnellement à chaque base TVA
  const tvaByRate: Record<string, { ht: number; tva: number }> = {};
  tvaMap.forEach((v, k) => {
    const scaledHT  = r2(v.ht * factor);
    const scaledTVA = r2(scaledHT * k / 100);
    tvaByRate[String(k)] = { ht: scaledHT, tva: scaledTVA };
  });

  // TVA totale = somme des TVA par taux (plus précis qu'appliquer le factor sur tvaRaw)
  const tva     = r2(Object.values(tvaByRate).reduce((s, v) => s + v.tva, 0));
  const ttc     = r2(ht + tva);
  const acompteVal = r2(Math.min(acompte, ttc));

  return { subtotal_ht, remise, ht, tva, ttc, acompte: acompteVal, tvaByRate };
}

export class CalcValidationError extends Error {
  constructor(public readonly errors: CalcError[]) {
    super(errors.map(e => `${e.field}: ${e.message}`).join("; "));
    this.name = "CalcValidationError";
  }
}
