/**
 * POST /api/depenses/import
 * Import CSV bancaire : valide + déduplique + insère côté serveur.
 * Body : { rows: ImportRow[], organization_id?: string | null }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATS = [
  "transport","repas","logiciel","carburant","hotel",
  "equipement","communication","formation","publicite",
  "fournitures","autre",
] as const;
type ExpCat = typeof VALID_CATS[number];

interface ImportRow {
  date: string;
  amount: number;
  cat: ExpCat;
  label: string;
}

async function getAuthClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { rows: ImportRow[]; organization_id?: string | null };
  const { rows, organization_id = null } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne à importer" }, { status: 400 });
  }

  // Validation
  const invalid = rows.filter(r =>
    !r.date || typeof r.amount !== "number" || r.amount <= 0 ||
    !VALID_CATS.includes(r.cat) || !r.label?.trim()
  );
  if (invalid.length > 0) {
    return NextResponse.json({ error: `${invalid.length} ligne(s) invalide(s)` }, { status: 422 });
  }

  // Déduplication : on évite les doublons exacts (même date + montant + description + user)
  const { data: existing } = await supabase
    .from("expenses")
    .select("date, amount, description")
    .eq("user_id", user.id)
    .in("date", [...new Set(rows.map(r => r.date))])
    .is("deleted_at", null);

  const existingSet = new Set(
    (existing ?? []).map(e => `${e.date}|${e.amount}|${e.description}`)
  );

  const toInsert = rows.filter(r =>
    !existingSet.has(`${r.date}|${r.amount}|${r.label}`)
  );

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: rows.length, message: "Toutes les lignes sont déjà importées" });
  }

  const payload = toInsert.map(r => ({
    user_id:          user.id,
    organization_id:  organization_id,
    date:             r.date,
    amount:           r.amount,
    currency:         "EUR",
    category:         r.cat,
    description:      r.label,
    payment_method:   "carte_pro",
    status:           "draft",
    vat_amount:       0,
    vat_recoverable:  false,
    receipt_url:      "",
    invoice_number:   "",
    project:          "",
    cost_center:      "",
    notes:            "Importé depuis relevé bancaire",
    expense_report_id: null,
  }));

  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    inserted: data?.length ?? 0,
    skipped:  rows.length - toInsert.length,
    items:    data,
  }, { status: 201 });
}
