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
    .from("shop_collections")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminClient();
  const body = await req.json() as Record<string, unknown>;

  if (body.id) {
    // Update
    const { data, error } = await db
      .from("shop_collections")
      .update({
        name:             body.name             ?? "",
        slug:             body.slug             ?? "",
        description:      body.description      ?? "",
        image_url:        body.image_url        ?? "",
        is_active:        body.is_active        ?? true,
        meta_title:       body.meta_title       ?? "",
        meta_description: body.meta_description ?? "",
        updated_at:       new Date().toISOString(),
      })
      .eq("id", body.id as string)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const slug = ((body.name as string) ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await db
    .from("shop_collections")
    .insert({
      user_id:          user.id,
      name:             body.name             ?? "",
      slug:             body.slug             ?? slug,
      description:      body.description      ?? "",
      image_url:        body.image_url        ?? "",
      is_active:        body.is_active        ?? true,
      meta_title:       body.meta_title       ?? "",
      meta_description: body.meta_description ?? "",
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
    .from("shop_collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
