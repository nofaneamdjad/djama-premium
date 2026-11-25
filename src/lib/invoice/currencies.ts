/**
 * Catalogue de devises ISO 4217 pour DJAMA Facturation internationale.
 * 80+ devises avec symbole, décimales, locale Intl, et région.
 */

export interface CurrencyConfig {
  code:     string;   // ISO 4217: "EUR", "USD", "MAD"…
  symbol:   string;   // "€", "$", "MAD"…
  name:     string;   // Nom en français
  decimals: number;   // Nb de décimales (0 pour JPY, KMF…)
  /** Locale Intl.NumberFormat recommandée pour ce contexte */
  locale:   string;
  region:   "europe" | "americas" | "africa" | "asia" | "oceania" | "middleeast";
}

export const CURRENCIES: CurrencyConfig[] = [
  // ── Europe ──────────────────────────────────────────────────────────────────
  { code: "EUR", symbol: "€",    name: "Euro",                   decimals: 2, locale: "fr-FR", region: "europe" },
  { code: "GBP", symbol: "£",    name: "Livre sterling",         decimals: 2, locale: "en-GB", region: "europe" },
  { code: "CHF", symbol: "CHF",  name: "Franc suisse",           decimals: 2, locale: "fr-CH", region: "europe" },
  { code: "NOK", symbol: "kr",   name: "Couronne norvégienne",   decimals: 2, locale: "nb-NO", region: "europe" },
  { code: "SEK", symbol: "kr",   name: "Couronne suédoise",      decimals: 2, locale: "sv-SE", region: "europe" },
  { code: "DKK", symbol: "kr",   name: "Couronne danoise",       decimals: 2, locale: "da-DK", region: "europe" },
  { code: "PLN", symbol: "zł",   name: "Złoty polonais",         decimals: 2, locale: "pl-PL", region: "europe" },
  { code: "CZK", symbol: "Kč",   name: "Couronne tchèque",       decimals: 2, locale: "cs-CZ", region: "europe" },
  { code: "HUF", symbol: "Ft",   name: "Forint hongrois",        decimals: 0, locale: "hu-HU", region: "europe" },
  { code: "RON", symbol: "lei",  name: "Leu roumain",            decimals: 2, locale: "ro-RO", region: "europe" },
  { code: "BGN", symbol: "лв",   name: "Lev bulgare",            decimals: 2, locale: "bg-BG", region: "europe" },
  { code: "HRK", symbol: "kn",   name: "Kuna croate",            decimals: 2, locale: "hr-HR", region: "europe" },
  { code: "RUB", symbol: "₽",    name: "Rouble russe",           decimals: 2, locale: "ru-RU", region: "europe" },
  { code: "TRY", symbol: "₺",    name: "Livre turque",           decimals: 2, locale: "tr-TR", region: "europe" },

  // ── Amériques ───────────────────────────────────────────────────────────────
  { code: "USD", symbol: "$",    name: "Dollar américain",       decimals: 2, locale: "en-US", region: "americas" },
  { code: "CAD", symbol: "CA$",  name: "Dollar canadien",        decimals: 2, locale: "en-CA", region: "americas" },
  { code: "MXN", symbol: "$",    name: "Peso mexicain",          decimals: 2, locale: "es-MX", region: "americas" },
  { code: "BRL", symbol: "R$",   name: "Real brésilien",         decimals: 2, locale: "pt-BR", region: "americas" },
  { code: "ARS", symbol: "$",    name: "Peso argentin",          decimals: 2, locale: "es-AR", region: "americas" },
  { code: "CLP", symbol: "$",    name: "Peso chilien",           decimals: 0, locale: "es-CL", region: "americas" },
  { code: "COP", symbol: "$",    name: "Peso colombien",         decimals: 2, locale: "es-CO", region: "americas" },
  { code: "PEN", symbol: "S/",   name: "Sol péruvien",           decimals: 2, locale: "es-PE", region: "americas" },
  { code: "VES", symbol: "Bs.S", name: "Bolívar vénézuélien",    decimals: 2, locale: "es-VE", region: "americas" },
  { code: "DOP", symbol: "RD$",  name: "Peso dominicain",        decimals: 2, locale: "es-DO", region: "americas" },
  { code: "GTQ", symbol: "Q",    name: "Quetzal guatémaltèque",  decimals: 2, locale: "es-GT", region: "americas" },

  // ── Afrique ─────────────────────────────────────────────────────────────────
  { code: "MAD", symbol: "MAD",  name: "Dirham marocain",        decimals: 2, locale: "fr-MA", region: "africa" },
  { code: "DZD", symbol: "DA",   name: "Dinar algérien",         decimals: 2, locale: "fr-DZ", region: "africa" },
  { code: "TND", symbol: "DT",   name: "Dinar tunisien",         decimals: 3, locale: "fr-TN", region: "africa" },
  { code: "EGP", symbol: "E£",   name: "Livre égyptienne",       decimals: 2, locale: "ar-EG", region: "africa" },
  { code: "XOF", symbol: "CFA",  name: "Franc CFA BCEAO",        decimals: 0, locale: "fr-SN", region: "africa" },
  { code: "XAF", symbol: "FCFA", name: "Franc CFA BEAC",         decimals: 0, locale: "fr-CM", region: "africa" },
  { code: "MGA", symbol: "Ar",   name: "Ariary malgache",        decimals: 0, locale: "fr-MG", region: "africa" },
  { code: "KMF", symbol: "FC",   name: "Franc comorien",         decimals: 0, locale: "fr-KM", region: "africa" },
  { code: "MUR", symbol: "Rs",   name: "Roupie mauricienne",     decimals: 2, locale: "fr-MU", region: "africa" },
  { code: "SCR", symbol: "Rs",   name: "Roupie seychelloise",    decimals: 2, locale: "fr-SC", region: "africa" },
  { code: "ZAR", symbol: "R",    name: "Rand sud-africain",      decimals: 2, locale: "en-ZA", region: "africa" },
  { code: "KES", symbol: "KSh",  name: "Shilling kényan",        decimals: 2, locale: "sw-KE", region: "africa" },
  { code: "TZS", symbol: "TSh",  name: "Shilling tanzanien",     decimals: 2, locale: "sw-TZ", region: "africa" },
  { code: "UGX", symbol: "USh",  name: "Shilling ougandais",     decimals: 0, locale: "en-UG", region: "africa" },
  { code: "GHS", symbol: "GH₵",  name: "Cedi ghanéen",           decimals: 2, locale: "en-GH", region: "africa" },
  { code: "NGN", symbol: "₦",    name: "Naira nigérian",         decimals: 2, locale: "en-NG", region: "africa" },
  { code: "ETB", symbol: "Br",   name: "Birr éthiopien",         decimals: 2, locale: "am-ET", region: "africa" },
  { code: "CDF", symbol: "FC",   name: "Franc congolais",        decimals: 2, locale: "fr-CD", region: "africa" },
  { code: "XPF", symbol: "CFPF", name: "Franc CFP",              decimals: 0, locale: "fr-PF", region: "oceania" },
  { code: "STN", symbol: "Db",   name: "Dobra sao-toméen",       decimals: 2, locale: "pt-ST", region: "africa" },

  // ── Moyen-Orient ────────────────────────────────────────────────────────────
  { code: "AED", symbol: "AED",  name: "Dirham des EAU",         decimals: 2, locale: "ar-AE", region: "middleeast" },
  { code: "SAR", symbol: "SAR",  name: "Riyal saoudien",         decimals: 2, locale: "ar-SA", region: "middleeast" },
  { code: "QAR", symbol: "QAR",  name: "Riyal qatari",           decimals: 2, locale: "ar-QA", region: "middleeast" },
  { code: "KWD", symbol: "KWD",  name: "Dinar koweïtien",        decimals: 3, locale: "ar-KW", region: "middleeast" },
  { code: "BHD", symbol: "BHD",  name: "Dinar bahreïni",         decimals: 3, locale: "ar-BH", region: "middleeast" },
  { code: "OMR", symbol: "OMR",  name: "Rial omanais",           decimals: 3, locale: "ar-OM", region: "middleeast" },
  { code: "JOD", symbol: "JD",   name: "Dinar jordanien",        decimals: 3, locale: "ar-JO", region: "middleeast" },
  { code: "ILS", symbol: "₪",    name: "Nouveau shekel",         decimals: 2, locale: "he-IL", region: "middleeast" },
  { code: "LBP", symbol: "LL",   name: "Livre libanaise",        decimals: 2, locale: "ar-LB", region: "middleeast" },
  { code: "IRR", symbol: "﷼",    name: "Rial iranien",           decimals: 2, locale: "fa-IR", region: "middleeast" },

  // ── Asie ────────────────────────────────────────────────────────────────────
  { code: "JPY", symbol: "¥",    name: "Yen japonais",           decimals: 0, locale: "ja-JP", region: "asia" },
  { code: "CNY", symbol: "¥",    name: "Yuan renminbi",          decimals: 2, locale: "zh-CN", region: "asia" },
  { code: "HKD", symbol: "HK$",  name: "Dollar de Hong Kong",    decimals: 2, locale: "zh-HK", region: "asia" },
  { code: "TWD", symbol: "NT$",  name: "Dollar de Taïwan",       decimals: 2, locale: "zh-TW", region: "asia" },
  { code: "SGD", symbol: "S$",   name: "Dollar de Singapour",    decimals: 2, locale: "en-SG", region: "asia" },
  { code: "MYR", symbol: "RM",   name: "Ringgit malaisien",      decimals: 2, locale: "ms-MY", region: "asia" },
  { code: "IDR", symbol: "Rp",   name: "Roupie indonésienne",    decimals: 0, locale: "id-ID", region: "asia" },
  { code: "THB", symbol: "฿",    name: "Baht thaïlandais",       decimals: 2, locale: "th-TH", region: "asia" },
  { code: "PHP", symbol: "₱",    name: "Peso philippin",         decimals: 2, locale: "fil-PH", region: "asia" },
  { code: "VND", symbol: "₫",    name: "Dong vietnamien",        decimals: 0, locale: "vi-VN", region: "asia" },
  { code: "KRW", symbol: "₩",    name: "Won sud-coréen",         decimals: 0, locale: "ko-KR", region: "asia" },
  { code: "INR", symbol: "₹",    name: "Roupie indienne",        decimals: 2, locale: "en-IN", region: "asia" },
  { code: "PKR", symbol: "Rs",   name: "Roupie pakistanaise",    decimals: 2, locale: "ur-PK", region: "asia" },
  { code: "BDT", symbol: "৳",    name: "Taka bangladais",        decimals: 2, locale: "bn-BD", region: "asia" },
  { code: "LKR", symbol: "Rs",   name: "Roupie sri-lankaise",    decimals: 2, locale: "si-LK", region: "asia" },
  { code: "NPR", symbol: "Rs",   name: "Roupie népalaise",       decimals: 2, locale: "ne-NP", region: "asia" },
  { code: "MMK", symbol: "K",    name: "Kyat birman",            decimals: 2, locale: "my-MM", region: "asia" },
  { code: "KHR", symbol: "៛",    name: "Riel cambodgien",        decimals: 2, locale: "km-KH", region: "asia" },
  { code: "MNT", symbol: "₮",    name: "Tögrög mongol",          decimals: 2, locale: "mn-MN", region: "asia" },
  { code: "KZT", symbol: "₸",    name: "Tenge kazakh",           decimals: 2, locale: "kk-KZ", region: "asia" },
  { code: "UZS", symbol: "сўм",  name: "Sum ouzbek",             decimals: 2, locale: "uz-UZ", region: "asia" },
  { code: "GEL", symbol: "₾",    name: "Lari géorgien",          decimals: 2, locale: "ka-GE", region: "asia" },
  { code: "AMD", symbol: "֏",    name: "Dram arménien",          decimals: 2, locale: "hy-AM", region: "asia" },
  { code: "AZN", symbol: "₼",    name: "Manat azéri",            decimals: 2, locale: "az-AZ", region: "asia" },

  // ── Océanie ─────────────────────────────────────────────────────────────────
  { code: "AUD", symbol: "A$",   name: "Dollar australien",      decimals: 2, locale: "en-AU", region: "oceania" },
  { code: "NZD", symbol: "NZ$",  name: "Dollar néo-zélandais",   decimals: 2, locale: "en-NZ", region: "oceania" },
  { code: "FJD", symbol: "FJ$",  name: "Dollar fidjien",         decimals: 2, locale: "en-FJ", region: "oceania" },
  { code: "PGK", symbol: "K",    name: "Kina papouasien",        decimals: 2, locale: "en-PG", region: "oceania" },
];

/** Map code → config pour recherche O(1) */
const CURRENCY_MAP = new Map<string, CurrencyConfig>(
  CURRENCIES.map(c => [c.code, c])
);

/** Récupère la config d'une devise par son code ISO, ou EUR par défaut */
export function getCurrency(code?: string | null): CurrencyConfig {
  return CURRENCY_MAP.get(code?.toUpperCase() ?? "") ?? CURRENCY_MAP.get("EUR")!;
}

/**
 * Formate un montant avec la devise et la locale données.
 * Fallback robuste: si Intl échoue, retourne symbol + number.
 */
export function formatAmount(
  n: number,
  currencyCode?: string | null,
  locale?: string | null,
): string {
  const cfg = getCurrency(currencyCode);
  const loc = locale ?? cfg.locale;
  try {
    return new Intl.NumberFormat(loc, {
      style:                 "currency",
      currency:              cfg.code,
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    }).format(n);
  } catch {
    // Fallback si la locale n'est pas supportée
    try {
      return new Intl.NumberFormat("en-US", {
        style:                 "currency",
        currency:              cfg.code,
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      }).format(n);
    } catch {
      return `${cfg.symbol}${n.toFixed(cfg.decimals)}`;
    }
  }
}

/** Recherche dans le catalogue (code ou nom, insensible à la casse) */
export function searchCurrencies(q: string): CurrencyConfig[] {
  const query = q.toLowerCase().trim();
  if (!query) return CURRENCIES;
  return CURRENCIES.filter(
    c => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
  );
}

/** Devise locale déduite du pays (via countries.ts) ou de la langue du document */
export function guessLocaleCurrency(currencyCode: string, lang: string): string {
  const cfg = getCurrency(currencyCode);
  // Si la locale de la devise correspond à la langue → utiliser la locale native
  const baseLang = cfg.locale.split("-")[0];
  if (baseLang === lang) return cfg.locale;
  // Sinon, construire une locale hybride (ex: formatage en arabe mais devise MAD)
  const countryPart = cfg.locale.split("-")[1] ?? "";
  const langMap: Record<string, string> = {
    fr: "fr", en: "en", ar: "ar", es: "es", pt: "pt", de: "de", it: "it",
  };
  const normalizedLang = langMap[lang] ?? lang;
  if (countryPart) return `${normalizedLang}-${countryPart}`;
  return cfg.locale;
}
