/**
 * Libellés multilingues pour les documents (factures / devis).
 * Supporte 7 langues : fr, en, ar, es, pt, de, it.
 * L'arabe utilise la direction RTL.
 */

export type DocLangCode = "fr" | "en" | "ar" | "es" | "pt" | "de" | "it";

export interface DocLabels {
  // Type de document
  invoice:          string;
  quote:            string;
  docType:          (t: "invoice" | "quote") => string;

  // Adresses
  from:             string;
  billTo:           string;
  quoteTo:          string;
  billOrQuoteTo:    (t: "invoice" | "quote") => string;

  // Dates
  issuedOn:         string;
  dueDate:          string;
  validUntil:       string;

  // En-têtes tableau
  description:      string;
  qty:              string;
  unitPrice:        string;
  unitPriceHT:      string;
  total:            string;
  totalHT:          string;
  amount:           string;

  // Récapitulatif
  subtotal:         string;
  tax:              (rate: number) => string;
  totalIncl:        string;

  // Divers
  subject:          string;

  // TechDark spécial
  sender:           string;
  recipient:        string;
  dateCmd:          string;

  // Letterhead spécial
  cityDate:         (city: string, date: string) => string;
  dueShort:         string;

  // Direction
  dir:              "ltr" | "rtl";
}

const LABELS: Record<DocLangCode, DocLabels> = {
  // ─────────────────────────────────────────────────────────────────────────────
  fr: {
    invoice:        "FACTURE",
    quote:          "DEVIS",
    docType:        t => t === "invoice" ? "FACTURE" : "DEVIS",
    from:           "DE",
    billTo:         "FACTURÉ À",
    quoteTo:        "DEVIS POUR",
    billOrQuoteTo:  t => t === "invoice" ? "FACTURÉ À" : "DEVIS POUR",
    issuedOn:       "Émis le",
    dueDate:        "Échéance",
    validUntil:     "Valable jusqu'au",
    description:    "DÉSIGNATION",
    qty:            "QTÉ",
    unitPrice:      "P.U.",
    unitPriceHT:    "P.U. HT",
    total:          "TOTAL",
    totalHT:        "TOTAL HT",
    amount:         "MONTANT",
    subtotal:       "Sous-total HT",
    tax:            r => `TVA ${r}%`,
    totalIncl:      "TOTAL TTC",
    subject:        "OBJET",
    sender:         "# ÉMETTEUR",
    recipient:      "# DESTINATAIRE",
    dateCmd:        "$ date :",
    cityDate:       (city, date) => `${city}, le ${date}`,
    dueShort:       "Éch.",
    dir:            "ltr",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  en: {
    invoice:        "INVOICE",
    quote:          "QUOTE",
    docType:        t => t === "invoice" ? "INVOICE" : "QUOTE",
    from:           "FROM",
    billTo:         "BILL TO",
    quoteTo:        "QUOTE FOR",
    billOrQuoteTo:  t => t === "invoice" ? "BILL TO" : "QUOTE FOR",
    issuedOn:       "Issued",
    dueDate:        "Due",
    validUntil:     "Valid until",
    description:    "DESCRIPTION",
    qty:            "QTY",
    unitPrice:      "UNIT PRICE",
    unitPriceHT:    "UNIT PRICE",
    total:          "TOTAL",
    totalHT:        "TOTAL",
    amount:         "AMOUNT",
    subtotal:       "Subtotal",
    tax:            r => `Tax ${r}%`,
    totalIncl:      "TOTAL DUE",
    subject:        "SUBJECT",
    sender:         "# SENDER",
    recipient:      "# RECIPIENT",
    dateCmd:        "$ date:",
    cityDate:       (city, date) => `${city}, ${date}`,
    dueShort:       "Due",
    dir:            "ltr",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  ar: {
    invoice:        "فاتورة",
    quote:          "عرض سعر",
    docType:        t => t === "invoice" ? "فاتورة" : "عرض سعر",
    from:           "من",
    billTo:         "فاتورة إلى",
    quoteTo:        "عرض لـ",
    billOrQuoteTo:  t => t === "invoice" ? "فاتورة إلى" : "عرض لـ",
    issuedOn:       "تاريخ الإصدار",
    dueDate:        "تاريخ الاستحقاق",
    validUntil:     "صالح حتى",
    description:    "الوصف",
    qty:            "الكمية",
    unitPrice:      "سعر الوحدة",
    unitPriceHT:    "سعر الوحدة",
    total:          "المجموع",
    totalHT:        "المجموع",
    amount:         "المبلغ",
    subtotal:       "المجموع الفرعي",
    tax:            r => `ضريبة ${r}%`,
    totalIncl:      "الإجمالي",
    subject:        "الموضوع",
    sender:         "# المرسل",
    recipient:      "# المستلم",
    dateCmd:        "$ التاريخ:",
    cityDate:       (city, date) => `${city}، ${date}`,
    dueShort:       "الاستحقاق",
    dir:            "rtl",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  es: {
    invoice:        "FACTURA",
    quote:          "PRESUPUESTO",
    docType:        t => t === "invoice" ? "FACTURA" : "PRESUPUESTO",
    from:           "DE",
    billTo:         "FACTURAR A",
    quoteTo:        "PRESUPUESTO PARA",
    billOrQuoteTo:  t => t === "invoice" ? "FACTURAR A" : "PRESUPUESTO PARA",
    issuedOn:       "Emitido el",
    dueDate:        "Vencimiento",
    validUntil:     "Válido hasta",
    description:    "DESCRIPCIÓN",
    qty:            "CANT.",
    unitPrice:      "P. UNIT.",
    unitPriceHT:    "P. UNIT.",
    total:          "TOTAL",
    totalHT:        "TOTAL",
    amount:         "IMPORTE",
    subtotal:       "Subtotal",
    tax:            r => `IVA ${r}%`,
    totalIncl:      "TOTAL IVA inc.",
    subject:        "ASUNTO",
    sender:         "# EMISOR",
    recipient:      "# DESTINATARIO",
    dateCmd:        "$ fecha:",
    cityDate:       (city, date) => `${city}, ${date}`,
    dueShort:       "Venc.",
    dir:            "ltr",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  pt: {
    invoice:        "FATURA",
    quote:          "ORÇAMENTO",
    docType:        t => t === "invoice" ? "FATURA" : "ORÇAMENTO",
    from:           "DE",
    billTo:         "FATURAR A",
    quoteTo:        "ORÇAMENTO PARA",
    billOrQuoteTo:  t => t === "invoice" ? "FATURAR A" : "ORÇAMENTO PARA",
    issuedOn:       "Emitido em",
    dueDate:        "Vencimento",
    validUntil:     "Válido até",
    description:    "DESCRIÇÃO",
    qty:            "QTD.",
    unitPrice:      "PREÇO UNIT.",
    unitPriceHT:    "PREÇO UNIT.",
    total:          "TOTAL",
    totalHT:        "TOTAL",
    amount:         "VALOR",
    subtotal:       "Subtotal",
    tax:            r => `IVA ${r}%`,
    totalIncl:      "TOTAL c/ IVA",
    subject:        "ASSUNTO",
    sender:         "# EMITENTE",
    recipient:      "# DESTINATÁRIO",
    dateCmd:        "$ data:",
    cityDate:       (city, date) => `${city}, ${date}`,
    dueShort:       "Venc.",
    dir:            "ltr",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  de: {
    invoice:        "RECHNUNG",
    quote:          "ANGEBOT",
    docType:        t => t === "invoice" ? "RECHNUNG" : "ANGEBOT",
    from:           "VON",
    billTo:         "AN",
    quoteTo:        "ANGEBOT FÜR",
    billOrQuoteTo:  t => t === "invoice" ? "AN" : "ANGEBOT FÜR",
    issuedOn:       "Ausgestellt am",
    dueDate:        "Fällig am",
    validUntil:     "Gültig bis",
    description:    "BEZEICHNUNG",
    qty:            "MENGE",
    unitPrice:      "EINZELPREIS",
    unitPriceHT:    "EINZELPREIS",
    total:          "GESAMT",
    totalHT:        "GESAMT",
    amount:         "BETRAG",
    subtotal:       "Nettosumme",
    tax:            r => `MwSt. ${r}%`,
    totalIncl:      "GESAMTBETRAG",
    subject:        "BETREFF",
    sender:         "# ABSENDER",
    recipient:      "# EMPFÄNGER",
    dateCmd:        "$ Datum:",
    cityDate:       (city, date) => `${city}, den ${date}`,
    dueShort:       "Fällig",
    dir:            "ltr",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  it: {
    invoice:        "FATTURA",
    quote:          "PREVENTIVO",
    docType:        t => t === "invoice" ? "FATTURA" : "PREVENTIVO",
    from:           "DA",
    billTo:         "FATTURARE A",
    quoteTo:        "PREVENTIVO PER",
    billOrQuoteTo:  t => t === "invoice" ? "FATTURARE A" : "PREVENTIVO PER",
    issuedOn:       "Emesso il",
    dueDate:        "Scadenza",
    validUntil:     "Valido fino al",
    description:    "DESCRIZIONE",
    qty:            "Q.TÀ",
    unitPrice:      "PREZZO UNIT.",
    unitPriceHT:    "PREZZO UNIT.",
    total:          "TOTALE",
    totalHT:        "TOTALE",
    amount:         "IMPORTO",
    subtotal:       "Subtotale",
    tax:            r => `IVA ${r}%`,
    totalIncl:      "TOTALE IVA inc.",
    subject:        "OGGETTO",
    sender:         "# MITTENTE",
    recipient:      "# DESTINATARIO",
    dateCmd:        "$ data:",
    cityDate:       (city, date) => `${city}, ${date}`,
    dueShort:       "Scad.",
    dir:            "ltr",
  },
};

/** Récupère les libellés pour une langue, avec fallback sur le français */
export function getDocLabels(lang?: string | null): DocLabels {
  const code = (lang ?? "fr") as DocLangCode;
  return LABELS[code] ?? LABELS.fr;
}

/** Liste des langues disponibles pour le sélecteur UI */
export const SUPPORTED_LANGUAGES: { code: DocLangCode; label: string; nativeLabel: string }[] = [
  { code: "fr", label: "Français",   nativeLabel: "Français" },
  { code: "en", label: "Anglais",    nativeLabel: "English" },
  { code: "ar", label: "Arabe",      nativeLabel: "العربية" },
  { code: "es", label: "Espagnol",   nativeLabel: "Español" },
  { code: "pt", label: "Portugais",  nativeLabel: "Português" },
  { code: "de", label: "Allemand",   nativeLabel: "Deutsch" },
  { code: "it", label: "Italien",    nativeLabel: "Italiano" },
];
