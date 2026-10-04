import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminClient();
  const { data } = await db.from("shop_config").select("*").eq("user_id", user.id).maybeSingle();
  return NextResponse.json(data ?? null);
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const body = await req.json() as Record<string, unknown>;
  const db = adminClient();
  const safe = {
    shop_name:        body.shop_name        ?? "",
    shop_description: body.shop_description ?? "",
    logo_url:         body.logo_url         ?? "",
    currency:         body.currency         ?? "EUR",
    currency_symbol:  body.currency_symbol  ?? "€",
    tax_rate:         typeof body.tax_rate === "number" ? body.tax_rate : 20,
    tax_included:     body.tax_included     ?? false,
    guest_checkout:   body.guest_checkout   ?? true,
    is_published:     body.is_published     ?? false,
    primary_color:    body.primary_color    ?? "#c9a55a",
    seo_title:        body.seo_title        ?? "",
    seo_description:  body.seo_description  ?? "",
    storefront_config: body.storefront_config ?? {},
    updated_at:       new Date().toISOString(),
    user_id:          user.id,
  };
  const { data, error } = await db
    .from("shop_config")
    .upsert(safe, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
