import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { generateSlug } from "@/lib/cards/templates";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// POST /api/cards/[id]/duplicate
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();

  const { data: src } = await admin
    .from("business_cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!src) return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });

  // Nouveau slug
  const baseSlug = generateSlug(src.first_name ?? "", src.last_name ?? "");
  let slug = `${baseSlug}-copie`;
  let attempt = 0;
  while (attempt < 10) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const { data: ex } = await admin.from("business_cards").select("id").eq("slug", candidate).maybeSingle();
    if (!ex) { slug = candidate; break; }
    attempt++;
  }

  const { id: _id, created_at: _c, updated_at: _u, published_at: _p,
    view_count: _v, contact_count: _cc, status: _s, ...fields } = src as Record<string, unknown>;
  void _id; void _c; void _u; void _p; void _v; void _cc; void _s;

  const { data: newCard, error } = await admin
    .from("business_cards")
    .insert({ ...fields, user_id: user.id, slug, status: "draft", name: `Copie de ${src.name}`, view_count: 0, contact_count: 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ card: newCard });
}
