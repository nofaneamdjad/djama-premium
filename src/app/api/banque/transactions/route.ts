import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET — liste des transactions avec filtres
export async function GET(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const account_id  = p.get("account_id");
  const type        = p.get("type");           // income | expense
  const category    = p.get("category");
  const status      = p.get("status");
  const date_from   = p.get("date_from");
  const date_to     = p.get("date_to");
  const q           = p.get("q");              // recherche texte
  const recon       = p.get("reconciliation_status");
  const limit       = Math.min(parseInt(p.get("limit") ?? "100"), 500);
  const offset      = parseInt(p.get("offset") ?? "0");

  let query = supabase
    .from("treasury_transactions")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (account_id) query = query.eq("account_id", account_id);
  if (type)       query = query.eq("type", type);
  if (category)   query = query.eq("category", category);
  if (status)     query = query.eq("status", status);
  if (date_from)  query = query.gte("date", date_from);
  if (date_to)    query = query.lte("date", date_to);
  if (recon)      query = query.eq("reconciliation_status", recon);
  if (q)          query = query.ilike("label", `%${q}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data, total: count ?? 0 });
}

// POST — créer une transaction manuelle
export async function POST(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 200, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const body = await req.json();
  const { account_id, type, category, label, amount, currency, date, payment_method,
          status: txStatus, client_supplier, invoice_ref, notes, bank_ref, tags } = body;

  if (!label?.trim() || !amount || !date || !type) {
    return NextResponse.json({ error: "label, amount, date et type sont requis" }, { status: 422 });
  }
  if (!["income", "expense"].includes(type)) {
    return NextResponse.json({ error: "type invalide" }, { status: 422 });
  }

  const { data, error } = await supabase.from("treasury_transactions").insert({
    user_id:        user.id,
    account_id:     account_id ?? null,
    type,
    category:       category ?? "autre",
    label:          label.trim(),
    amount:         Math.abs(parseFloat(amount)),
    currency:       currency ?? "EUR",
    date,
    payment_method: payment_method ?? "virement",
    status:         txStatus ?? "completed",
    client_supplier: client_supplier ?? "",
    invoice_ref:    invoice_ref ?? "",
    notes:          notes ?? "",
    bank_ref:       bank_ref ?? null,
    tags:           tags ?? [],
    source:         "manual",
    reconciliation_status: "unmatched",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data }, { status: 201 });
}
