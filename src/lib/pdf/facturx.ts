/**
 * Factur-X / ZUGFeRD XML generator — profil EN 16931 (niveau recommandé France 2026)
 *
 * Spec : https://www.factur-x.eu/
 * Type codes UN/ECE : 380 = Facture commerciale, 381 = Note de crédit (avoir)
 * VAT category codes : S = Standard, E = Exonéré, AE = Auto-liquidation, O = Hors champ
 */

// ─── Mapping pays texte → ISO 3166-1 alpha-2 ─────────────────────────────────
const COUNTRY_CODES: Record<string, string> = {
  "france":"FR","fr":"FR","réunion":"FR","martinique":"FR","guadeloupe":"FR",
  "allemagne":"DE","germany":"DE","de":"DE",
  "espagne":"ES","spain":"ES","es":"ES",
  "italie":"IT","italy":"IT","it":"IT",
  "belgique":"BE","belgium":"BE","be":"BE",
  "luxembourg":"LU","lu":"LU",
  "suisse":"CH","switzerland":"CH","ch":"CH",
  "pays-bas":"NL","netherlands":"NL","nl":"NL",
  "portugal":"PT","pt":"PT",
  "maroc":"MA","morocco":"MA","ma":"MA",
  "algérie":"DZ","algeria":"DZ","dz":"DZ",
  "tunisie":"TN","tunisia":"TN","tn":"TN",
  "sénégal":"SN","senegal":"SN","sn":"SN",
  "côte d'ivoire":"CI","ivory coast":"CI","ci":"CI",
  "cameroun":"CM","cameroon":"CM","cm":"CM",
  "royaume-uni":"GB","uk":"GB","gb":"GB",
  "canada":"CA","ca":"CA",
  "états-unis":"US","usa":"US","us":"US",
  "émirats arabes unis":"AE","uae":"AE","ae":"AE",
};

function toCountryCode(country: string): string {
  if (!country) return "FR";
  const key = country.toLowerCase().trim();
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key];
  if (country.length === 2) return country.toUpperCase();
  return "FR";
}

// ─── Mapping unités DJAMA → UN/ECE Rec 20 ────────────────────────────────────
const UNIT_CODES: Record<string, string> = {
  "h":       "HUR",   // heure
  "j":       "DAY",   // jour
  "forfait": "C62",   // unité (one)
  "pièce":   "C62",
  "m²":      "MTK",   // mètre carré
  "km":      "KMT",   // kilomètre
  "kg":      "KGM",   // kilogramme
  "mois":    "MON",   // mois
  "lot":     "SET",   // ensemble
  "":        "C62",
};

function toUnitCode(unit: string): string {
  return UNIT_CODES[unit] ?? "C62";
}

// ─── Helpers XML ──────────────────────────────────────────────────────────────
function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** YYYYMMDD */
function fmtD(iso: string): string { return iso.replace(/-/g, ""); }

/** 2 decimals */
function amt(n: number): string { return n.toFixed(2); }

// ─── Types ────────────────────────────────────────────────────────────────────
export type VatRegime = "micro" | "reel" | "autoliquidation" | "cga" | null;

export interface FxSeller {
  name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  siret?: string;
  vat_number?: string;
  email?: string;
}

export interface FxBuyer {
  name: string;
  company?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  vat_number?: string;
  email?: string;
}

export interface FxItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_ht: number;
  vat_rate: number;
}

export interface FxTotals {
  subtotal_ht: number;
  remise: number;
  ht: number;
  tva: number;
  ttc: number;
  acompte: number;
  tvaByRate: Map<number, { ht: number; tva: number }>;
}

export interface FacturXInput {
  type: "invoice" | "credit_note";
  reference: string;
  issue_date: string;
  due_date?: string | null;
  seller: FxSeller;
  buyer: FxBuyer;
  items: FxItem[];
  totals: FxTotals;
  currency: string;
  payment_conditions?: string | null;
  notes?: string | null;
  rib_iban?: string | null;
  regime: VatRegime;
}

// ─── VAT category resolution ──────────────────────────────────────────────────
function vatCategory(rate: number, regime: VatRegime): string {
  if (regime === "micro" || regime === "cga") return "O";   // hors champ TVA
  if (regime === "autoliquidation") return "AE";            // auto-liquidation
  if (rate === 0) return "E";                               // exonéré
  return "S";                                               // taux standard
}

// ─── Générateur principal ─────────────────────────────────────────────────────
export function generateFacturX(input: FacturXInput): string {
  const typeCode = input.type === "credit_note" ? "381" : "380";
  const profile  = "urn:factur-x.eu:1p0:en16931";
  const cur      = esc(input.currency || "EUR");

  // ── Lignes de prestation ──
  const lineItems = input.items.map((it, i) => {
    const cat = vatCategory(it.vat_rate, input.regime);
    return `    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(it.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${amt(it.unit_price)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${toUnitCode(it.unit)}">${amt(it.quantity)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${cat}</ram:CategoryCode>
          <ram:RateApplicablePercent>${amt(it.vat_rate)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${amt(it.total_ht)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }).join("\n");

  // ── Ventilation TVA par taux ──
  const taxBreakdown = Array.from(input.totals.tvaByRate.entries()).map(([rate, v]) => {
    const cat = vatCategory(rate, input.regime);
    return `      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amt(v.tva)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${amt(v.ht)}</ram:BasisAmount>
        <ram:CategoryCode>${cat}</ram:CategoryCode>
        <ram:RateApplicablePercent>${amt(rate)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;
  }).join("\n");

  // ── Infos acheteur ──
  const buyerName = esc(input.buyer.company || input.buyer.name || "Client");
  const buyerContact = (input.buyer.company && input.buyer.name)
    ? `\n        <ram:DefinedTradeContact><ram:PersonName>${esc(input.buyer.name)}</ram:PersonName></ram:DefinedTradeContact>` : "";

  // ── IBAN ──
  const ibanBlock = input.rib_iban ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${esc(input.rib_iban.replace(/\s/g, ""))}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>` : "";

  // ── Échéance ──
  const dueDateBlock = input.due_date ? `
      <ram:SpecifiedTradePaymentTerms>${input.payment_conditions ? `\n        <ram:Description>${esc(input.payment_conditions)}</ram:Description>` : ""}
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${fmtD(input.due_date)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>` : "";

  // ── Remise globale ──
  const allowanceBlock = input.totals.remise > 0
    ? `\n        <ram:AllowanceTotalAmount>${amt(input.totals.remise)}</ram:AllowanceTotalAmount>` : "";

  const netDue = Math.max(0, input.totals.ttc - (input.totals.acompte || 0));

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${profile}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${esc(input.reference)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${fmtD(input.issue_date)}</udt:DateTimeString>
    </ram:IssueDateTime>${input.notes ? `
    <ram:IncludedNote><ram:Content>${esc(input.notes)}</ram:Content></ram:IncludedNote>` : ""}
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
${lineItems}

    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(input.seller.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${esc(input.seller.postal_code)}</ram:PostcodeCode>
          <ram:LineOne>${esc(input.seller.address)}</ram:LineOne>
          <ram:CityName>${esc(input.seller.city)}</ram:CityName>
          <ram:CountryID>${toCountryCode(input.seller.country)}</ram:CountryID>
        </ram:PostalTradeAddress>${input.seller.email ? `
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${esc(input.seller.email)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ""}${input.seller.siret ? `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${esc(input.seller.siret.replace(/\s/g, "").slice(0, 9))}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ""}${input.seller.vat_number ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${esc(input.seller.vat_number.replace(/\s/g, ""))}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>

      <ram:BuyerTradeParty>
        <ram:Name>${buyerName}</ram:Name>${buyerContact}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${esc(input.buyer.postal_code ?? "")}</ram:PostcodeCode>
          <ram:LineOne>${esc(input.buyer.address ?? "")}</ram:LineOne>
          <ram:CityName>${esc(input.buyer.city ?? "")}</ram:CityName>
          <ram:CountryID>${toCountryCode(input.buyer.country ?? "")}</ram:CountryID>
        </ram:PostalTradeAddress>${input.buyer.email ? `
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${esc(input.buyer.email)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ""}${input.buyer.vat_number ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${esc(input.buyer.vat_number.replace(/\s/g, ""))}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ""}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery/>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${esc(input.reference)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>${cur}</ram:InvoiceCurrencyCode>${ibanBlock}
${taxBreakdown}${dueDateBlock}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amt(input.totals.subtotal_ht)}</ram:LineTotalAmount>${allowanceBlock}
        <ram:TaxBasisTotalAmount>${amt(input.totals.ht)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${cur}">${amt(input.totals.tva)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amt(input.totals.ttc)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${amt(netDue)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
