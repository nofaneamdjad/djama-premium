import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// GET — liste des comptes
export async function GET(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("org_id");

  let query = supabase
    .from("treasury_accounts")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (orgId) {
    query = query.eq("organization_id", orgId);
  } else {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data });
}

// POST — créer un compte
export async function POST(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { name, bank, iban, initial_balance, currency, color, is_default, organization_id } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 422 });

  // Si is_default, retirer le flag des autres comptes
  if (is_default) {
    const filter = organization_id
      ? { organization_id }
      : { user_id: user.id };
    await supabase.from("treasury_accounts")
      .update({ is_default: false })
      .match(filter);
  }

  const { data, error } = await supabase.from("treasury_accounts").insert({
    user_id:         user.id,
    organization_id: organization_id ?? null,
    name:            name.trim(),
    bank:            bank?.trim() ?? "",
    iban:            iban?.trim() ?? "",
    balance:         initial_balance ?? 0,
    initial_balance: initial_balance ?? 0,
    currency:        currency ?? "EUR",
    color:           color ?? "#c9a55a",
    is_default:      is_default ?? false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: data }, { status: 201 });
}
