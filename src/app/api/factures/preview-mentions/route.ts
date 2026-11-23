/**
 * POST /api/factures/preview-mentions
 *
 * Génère un PDF de démonstration affichant les mentions documentaires actuelles.
 * Utilisé par l'onglet Documents de Mon Entreprise pour l'aperçu A4.
 *
 * Body: { mentions_legales, payment_conditions, late_payment_clause, garantie, template, color }
 * Returns: application/pdf
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import type { TemplateType }         from "@/lib/pdf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── Body ──────────────────────────────────────────────────────────────────
  const body = await req.json() as {
    mentions_legales?:   string;
    payment_conditions?: string;
    late_payment_clause?: string;
    garantie?:           string;
    template?:           string;
    color?:              string;
  };
  const {
    mentions_legales   = "",
    payment_conditions  = "",
    late_payment_clause = "",
    garantie            = "",
    template            = "min-ligne",
    color               = "#FFB900",
  } = body;

  // ── Brand settings depuis Supabase ────────────────────────────────────────
  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1);

  const orgId = (memberRows as { organization_id: string }[] | null)?.[0]?.organization_id ?? null;

  const { data: settingsRows } = orgId
    ? await supabase.from("org_settings").select("key, value")
        .eq("organization_id", orgId).like("key", "brand.%")
    : await supabase.from("user_settings").select("key, value")
        .eq("user_id", user.id).like("key", "brand.%");

  const m: Record<string, string> = {};
  (settingsRows as { key: string; value: string }[] | null ?? [])
    .forEach(r => { m[r.key] = r.value; });

  const co = {
    logoUrl:          m["brand.logo_url"]         || null,
    name:             m["brand.company_name"]      || "",
    email:            m["brand.email"]             || "",
    website:          m["brand.website"]           || "",
    phone:            m["brand.phone"]             || "",
    address:          m["brand.address"]           || "",
    postal_code:      m["brand.postal_code"]       || "",
    city:             m["brand.city"]              || "",
    country:          m["brand.country"]           || "",
    country_code:     m["brand.country_code"]      || "",
    siret:            m["brand.siret"]             || "",
    ape:              m["brand.ape"]               || "",
    vat_number:       m["brand.vat_number"]        || "",
    tax_id_1:         m["brand.tax_id_1"]          || "",
    tax_id_1_label:   m["brand.tax_id_1_label"]    || "",
    tax_id_2:         m["brand.tax_id_2"]          || "",
    tax_id_2_label:   m["brand.tax_id_2_label"]    || "",
    tax_id_3:         m["brand.tax_id_3"]          || "",
    tax_id_3_label:   m["brand.tax_id_3_label"]    || "",
    iban:             m["brand.iban"]              || "",
    bic:              m["brand.bic"]               || "",
    bank_name:        m["brand.bank_name"]         || "",
    routing_number:   m["brand.routing_number"]    || "",
    sort_code:        m["brand.sort_code"]         || "",
    account_number:   m["brand.account_number"]    || "",
    mobile_money:     m["brand.mobile_money"]      || "",
    forme_juridique:  m["brand.forme_juridique"]   || "",
    capital_social:   m["brand.capital_social"]    || "",
    garantie:         garantie  || m["brand.garantie"]         || "",
    mentions_legales: mentions_legales || m["brand.mentions_legales"] || "",
    logoSize:         (m["brand.logo_size"] as "sm" | "md" | "lg") || "md",
    logoHideName:     m["brand.logo_hide_name"] === "true",
    template:         template || m["brand.template"] || "min-ligne",
    color:            color    || m["brand.color"]    || "#FFB900",
    logoTransform:    null,
  };

  // ── Composition du texte footer (mentions + retards) ──────────────────────
  const footerParts = [mentions_legales, late_payment_clause].filter(s => s?.trim());
  const footerText  = footerParts.join("\n\n") || null;

  // ── Notes (conditions de paiement + garantie) ─────────────────────────────
  const noteParts: string[] = [];
  if (payment_conditions?.trim()) noteParts.push(`Conditions de paiement : ${payment_conditions.trim()}`);
  if (garantie?.trim())           noteParts.push(`Garantie : ${garantie.trim()}`);
  const notes = noteParts.join("\n") || null;

  // ── Facture de démonstration ───────────────────────────────────────────────
  const today     = new Date().toISOString().slice(0, 10);
  const in30days  = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  const { generatePdfBuffer } = await import("@/lib/pdf/generatePdfBuffer");

  const buffer = await generatePdfBuffer({
    type:        "invoice",
    template:    (co.template || "min-ligne") as TemplateType,
    accentColor: co.color || "#FFB900",
    reference:   "APERÇU-2026-001",
    issue_date:  today,
    due_date:    in30days,
    client_name:    "Client Exemple",
    client_email:   "client@exemple.fr",
    client_company: "Société Cliente SARL",
    client_address: "123 rue de l'Exemple\n75001 Paris\nFrance",
    client_vat:  null,
    subject:     "Aperçu — Mentions documentaires",
    items: [
      { description: "Prestation de conseil en gestion", quantity: 2, unit_price: 500, tax_rate: 20, total: 1000 },
      { description: "Formation sur mesure (1 journée)",  quantity: 1, unit_price: 800, tax_rate: 20, total: 800  },
      { description: "Maintenance et support mensuel",    quantity: 3, unit_price: 150, tax_rate: 20, total: 450  },
    ],
    subtotal:    2250,
    tax_rate:    20,
    tax_amount:  450,
    total:       2700,
    footer_text: footerText,
    notes,
    currency:    "EUR",
    company:     co,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": 'inline; filename="apercu-mentions.pdf"',
    },
  });
}
