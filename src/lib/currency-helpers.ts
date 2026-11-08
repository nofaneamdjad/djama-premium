/**
 * Helpers de conversion de devises — DJAMA
 *
 * Stratégie :
 *  - EUR direct         → rate=1.0, source="direct"
 *  - Stripe via invoice → rate depuis Stripe balance_transaction si disponible
 *  - Taux de référence  → table fixe labelisée rate_source="fixedrate_reference",
 *                         date explicite — JAMAIS silencieux
 *
 * Devises 0-décimales : KMF, MGA, IDR, JPY, VND, XOF, XAF (FCFA)
 */

export interface ConversionResult {
  amountEur:    number;
  exchangeRate: number;
  rateSource:   string;        // "direct" | "fixedrate_reference" | "stripe_realtime" | "paypal_realtime" | "pending"
  rateDate:     string;        // ISO date yyyy-mm-dd
  decimalPlaces: number;       // nb de décimales de la devise originale
}

/** Table de référence — taux au 2026-11-08, source ECB/Banque de France.
 *  Utilisée UNIQUEMENT quand aucun taux temps-réel n'est disponible.
 *  Toujours déclarée avec rate_source="fixedrate_reference" pour traçabilité.
 */
const REFERENCE_RATES: Record<string, { rate: number; decimals: number }> = {
  EUR: { rate: 1.0,       decimals: 2 },
  USD: { rate: 0.9237,    decimals: 2 },  // 1 USD = 0.9237 EUR  (ECB 2026-11-08)
  GBP: { rate: 1.1952,    decimals: 2 },  // 1 GBP = 1.1952 EUR
  CHF: { rate: 1.0634,    decimals: 2 },  // 1 CHF = 1.0634 EUR
  CAD: { rate: 0.6765,    decimals: 2 },  // 1 CAD = 0.6765 EUR
  AUD: { rate: 0.6071,    decimals: 2 },  // 1 AUD = 0.6071 EUR
  JPY: { rate: 0.006071,  decimals: 0 },  // 1 JPY = 0.006071 EUR
  KMF: { rate: 0.002033,  decimals: 0 },  // 1 KMF = 0.002033 EUR  (1 EUR = 492 KMF)
  MGA: { rate: 0.000208,  decimals: 0 },  // 1 MGA = 0.000208 EUR  (1 EUR = 4800 MGA)
  MUR: { rate: 0.021277,  decimals: 2 },  // 1 MUR = 0.021277 EUR  (1 EUR = 47 MUR)
  AED: { rate: 0.256410,  decimals: 2 },  // 1 AED = 0.256410 EUR  (1 EUR = 3.90 AED)
  IDR: { rate: 0.000058,  decimals: 0 },  // 1 IDR = 0.000058 EUR
  VND: { rate: 0.000037,  decimals: 0 },  // 1 VND = 0.000037 EUR
  XOF: { rate: 0.001524,  decimals: 0 },  // FCFA Ouest (XOF) = 1/656.957 EUR
  XAF: { rate: 0.001524,  decimals: 0 },  // FCFA Central (XAF) = idem XOF
};

const REFERENCE_DATE = "2026-11-08";

/**
 * Convertit un montant en EUR.
 *
 * Pour EUR : conversion exacte (rate=1.0, source="direct").
 * Pour autres devises : utilise la table de référence avec date explicite.
 * Si la devise est inconnue : retourne amountEur=0, source="pending".
 */
export function convertToEur(
  amount: number,
  currency: string,
  options?: {
    stripeRate?:  number;   // taux exact depuis Stripe balance_transaction
    paypalRate?:  number;   // taux exact depuis PayPal conversion_info
    rateDate?:    string;   // date si taux temps-réel fourni
  }
): ConversionResult {
  const iso = currency.toUpperCase();

  // EUR : conversion exacte
  if (iso === "EUR") {
    return {
      amountEur:     round(amount, 2),
      exchangeRate:  1.0,
      rateSource:    "direct",
      rateDate:      new Date().toISOString().slice(0, 10),
      decimalPlaces: 2,
    };
  }

  // Taux temps-réel Stripe (depuis balance_transaction.exchange_rate)
  if (options?.stripeRate && options.stripeRate > 0) {
    const decimals = REFERENCE_RATES[iso]?.decimals ?? 2;
    return {
      amountEur:     round(amount * options.stripeRate, 2),
      exchangeRate:  options.stripeRate,
      rateSource:    "stripe_realtime",
      rateDate:      options.rateDate ?? new Date().toISOString().slice(0, 10),
      decimalPlaces: decimals,
    };
  }

  // Taux temps-réel PayPal
  if (options?.paypalRate && options.paypalRate > 0) {
    const decimals = REFERENCE_RATES[iso]?.decimals ?? 2;
    return {
      amountEur:     round(amount * options.paypalRate, 2),
      exchangeRate:  options.paypalRate,
      rateSource:    "paypal_realtime",
      rateDate:      options.rateDate ?? new Date().toISOString().slice(0, 10),
      decimalPlaces: decimals,
    };
  }

  // Taux de référence (table fixe labelisée)
  const ref = REFERENCE_RATES[iso];
  if (ref) {
    return {
      amountEur:     round(amount * ref.rate, 2),
      exchangeRate:  ref.rate,
      rateSource:    "fixedrate_reference",
      rateDate:      REFERENCE_DATE,
      decimalPlaces: ref.decimals,
    };
  }

  // Devise inconnue — pas de conversion silencieuse
  return {
    amountEur:     0,
    exchangeRate:  0,
    rateSource:    "pending",
    rateDate:      new Date().toISOString().slice(0, 10),
    decimalPlaces: 2,
  };
}

/** Arrondit au nombre de décimales indiqué (gère les 0-décimales). */
function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** Retourne le nombre de décimales d'une devise ISO 4217.
 *  Utilisé pour la validation des montants entrants (ex: KMF = entiers). */
export function getCurrencyDecimals(iso: string): number {
  return REFERENCE_RATES[iso.toUpperCase()]?.decimals ?? 2;
}
