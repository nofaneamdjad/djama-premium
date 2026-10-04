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
  const { data, error } = await db
    .from("shop_promotions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminClient();
  const body = await req.json() as Record<string, unknown>;

  const code = ((body.code as string) ?? "").toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  if (body.id) {
    const { data, error } = await db
      .from("shop_promotions")
      .update({
        code, description: body.description ?? "",
        type: body.type ?? "pct",
        value: body.value ?? 0,
        min_order:  body.min_order  ?? null,
        max_uses:   body.max_uses   ?? null,
        starts_at:  body.starts_at  ?? null,
        expires_at: body.expires_at ?? null,
        is_active:  body.is_active  ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id as string)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await db
    .from("shop_promotions")
    .insert({
      user_id:     user.id,
      code, description: body.description ?? "",
      type:        body.type        ?? "pct",
      value:       body.value       ?? 0,
      min_order:   body.min_order   ?? null,
      max_uses:    body.max_uses    ?? null,
      starts_at:   body.starts_at   ?? null,
      expires_at:  body.expires_at  ?? null,
      is_active:   body.is_active   ?? true,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const db = adminClient();
  const { error } = await db
    .from("shop_promotions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
